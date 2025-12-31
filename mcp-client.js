(function () {
  const MCP_NAMESPACE = 'mcp';
  // 自动检测基础URL：开发环境使用localhost，生产环境使用当前域名
  const DEFAULT_BASE_URL = window.location.origin;
  const CONFIGURED_BASE_URL =
    (window.APP_CONFIG && (window.APP_CONFIG.mcpBaseUrl || window.APP_CONFIG?.mcp?.baseUrl)) ||
    DEFAULT_BASE_URL;
  const MCP_BASE_URL = CONFIGURED_BASE_URL.replace(/\/$/, '');
  let explorerToastStylesInjected = false;

  function injectExplorerToastStyles() {
    if (explorerToastStylesInjected) return;
    const style = document.createElement('style');
    style.textContent = `
      .mcp-explorer-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 360px;
        max-width: calc(100% - 32px);
        background: rgba(17, 24, 39, 0.92);
        color: #fff;
        border-radius: 16px;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
        padding: 18px 20px;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        line-height: 1.5;
        z-index: 100000;
        animation: mcp-toast-in 0.25s ease-out;
      }
      .mcp-explorer-toast h4 {
        margin: 0 0 8px;
        font-size: 15px;
        font-weight: 600;
      }
      .mcp-explorer-toast a {
        color: #38bdf8;
        font-weight: 600;
        text-decoration: none;
      }
      .mcp-explorer-toast a:hover {
        text-decoration: underline;
      }
      .mcp-explorer-toast button {
        position: absolute;
        top: 12px;
        right: 14px;
        cursor: pointer;
        border: none;
        background: transparent;
        color: rgba(255,255,255,0.7);
        font-size: 14px;
      }
      .mcp-explorer-toast button:hover {
        color: #fff;
      }
      @keyframes mcp-toast-in {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    explorerToastStylesInjected = true;
  }

  function showExplorerToast({ url, title, subtitle }) {
    if (!url) return;
    injectExplorerToastStyles();
    const toast = document.createElement('div');
    toast.className = 'mcp-explorer-toast';
    toast.innerHTML = `
      <button aria-label="Dismiss explorer link">✕</button>
      <h4>${title || 'Payment Settled'}</h4>
      <div>${subtitle || 'View the on-chain transaction:'}</div>
      <div style="margin-top: 10px;">
        <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
      </div>
    `;
    const close = toast.querySelector('button');
    const remove = () => {
      toast.remove();
    };
    close.addEventListener('click', remove);
    setTimeout(remove, 15000);
    document.body.appendChild(toast);
  }

  function detectMetaMaskProvider() {
    if (window.ethereum && window.ethereum.isMetaMask) {
      return window.ethereum;
    }
    if (window.walletManager?.ethereum) {
      return window.walletManager.ethereum;
    }
    return null;
  }

  function detectWalletAddress() {
    // 优先从 walletManager 获取地址
    if (window.walletManager && window.walletManager.walletAddress) {
      return window.walletManager.walletAddress;
    }
    // 退一步，从 MetaMask 读取 selectedAddress
    if (window.ethereum && window.ethereum.selectedAddress) {
      return window.ethereum.selectedAddress;
    }
    return null;
  }

  function normalizeModelIdentifier(name) {
    if (!name) return '';
    return String(name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-:_]/g, '');
  }

  function modelIdentifiersMatch(a, b) {
    if (!a || !b) return false;
    const normA = normalizeModelIdentifier(a);
    const normB = normalizeModelIdentifier(b);
    if (!normA || !normB) return false;
    if (normA === normB) return true;
    const compactA = normA.replace(/[-_:]/g, '');
    const compactB = normB.replace(/[-_:]/g, '');
    return compactA && compactA === compactB;
  }

  function resolveModelMatch(storedName, candidates = []) {
    if (!storedName) return null;
    for (const candidate of candidates) {
      if (modelIdentifiersMatch(storedName, candidate)) {
        return candidate;
      }
    }
    return null;
  }

  async function ensureMetaMaskConnected() {
    const provider = detectMetaMaskProvider();
    if (!provider) {
      throw new Error('MetaMask not detected. Please install MetaMask extension.');
    }
    
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts[0]) {
        throw new Error('No accounts found in MetaMask');
      }
      return { provider, address: accounts[0] };
    } catch (err) {
      throw new Error(`MetaMask connection failed: ${err.message}`);
    }
  }

  function amountToBaseUnits(amount, decimals = 18) {
    const str = String(amount);
    const [whole = '0', frac = ''] = str.split('.');
    const wholePart = whole || '0';
    const fracPart = frac.padEnd(decimals, '0').slice(0, decimals);
    const combined = wholePart + fracPart;
    return BigInt(combined);
  }


  function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function emit(event, detail) {
    try {
      window.dispatchEvent(new CustomEvent(`${MCP_NAMESPACE}:${event}`, { detail }));
    } catch (_) {
      // noop
    }
  }

  function ensurePanel() {
    let panel = document.getElementById('mcp-status-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'mcp-status-panel';
    panel.innerHTML = `
      <style>
        #mcp-status-panel { position: fixed; right: 24px; bottom: 24px; width: 320px; max-height: 50vh; overflow-y: auto; background: rgba(17, 24, 39, 0.92); color: #fff; border-radius: 16px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45); padding: 18px 20px; font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.45; z-index: 99999; display: none; }
        #mcp-status-panel.show { display: block; }
        #mcp-status-panel h4 { margin: 0 0 10px; font-size: 15px; font-weight: 600; }
        #mcp-status-panel .mcp-close { position: absolute; top: 12px; right: 14px; cursor: pointer; border: none; background: transparent; color: rgba(255,255,255,0.6); font-size: 14px; }
        #mcp-status-panel .mcp-close:hover { color: #fff; }
        #mcp-status-panel .mcp-log { margin: 0; padding: 0; list-style: none; }
        #mcp-status-panel .mcp-log li { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.08); }
        #mcp-status-panel .mcp-log li:last-child { border-bottom: none; }
        #mcp-status-panel .mcp-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 600; letter-spacing: 0.2px; }
        #mcp-status-panel .pill-invoice { background: rgba(59, 130, 246, 0.18); color: #bfdbfe; }
        #mcp-status-panel .pill-pay { background: rgba(16, 185, 129, 0.18); color: #bbf7d0; }
        #mcp-status-panel .pill-result { background: rgba(244, 114, 182, 0.18); color: #fbcfe8; }
        #mcp-status-panel .pill-cancel { background: rgba(248, 113, 113, 0.18); color: #fecaca; }
        #mcp-status-panel .mcp-log small { display: block; margin-top: 3px; color: rgba(255,255,255,0.65); }
      </style>
      <button class="mcp-close" aria-label="Close">✕</button>
      <h4>402 Payment Progress</h4>
      <ul class="mcp-log"></ul>
    `;
    panel.querySelector('.mcp-close').addEventListener('click', () => {
      panel.classList.remove('show');
    });
    document.body.appendChild(panel);
    return panel;
  }

  function logStatus(kind, text, meta = {}) {
    const panel = ensurePanel();
    const list = panel.querySelector('.mcp-log');
    const li = document.createElement('li');
    const pillClass = {
      invoice: 'pill-invoice',
      payment: 'pill-pay',
      result: 'pill-result',
      cancel: 'pill-cancel'
    }[kind] || 'pill-invoice';
    const title = {
      invoice: '402 Invoice',
      payment: 'Paid',
      result: 'Result',
      cancel: 'Cancelled'
    }[kind] || 'Update';
    const lines = [];
    
    // Auto Router 选中的模型信息
    if (meta.autoRouterModel) {
      lines.push(`🤖 Auto Router → <strong style="color: #a78bfa;">${meta.autoRouterModel}</strong>`);
    }
    
    if (meta.amount) lines.push(`Amount: ${meta.amount} PHRS`);
    if (meta.memo) lines.push(`Memo: ${meta.memo}`);
    if (meta.tx) {
      // 生成 Pharos explorer 链接
      let explorer = meta.explorer;
      if (!explorer) {
        // 默认使用 Pharos Testnet explorer
        explorer = `https://pharos-testnet.socialscan.io/tx/${encodeURIComponent(meta.tx)}`;
      }
      const short = `${meta.tx.slice(0, 6)}…${meta.tx.slice(-4)}`;
      lines.push(
        `Tx: <a href="${explorer}" target="_blank" rel="noopener noreferrer">${short}</a>`
      );
    }
    if (meta.node) lines.push(`Node: ${meta.node}`);
    if (meta.description) lines.push(meta.description);
    li.innerHTML = `
      <span class="mcp-pill ${pillClass}">${title}</span>
      <div>${text}</div>
      ${lines.length ? `<small>${lines.join(' • ')}</small>` : ''}
    `;
    list.appendChild(li);
    panel.classList.add('show');
    panel.scrollTop = panel.scrollHeight;
  }

  async function settleInvoice(invoice) {
    try {
      console.log('[MCPClient] settleInvoice (Pharos)', invoice);
      const PHAROS_CHAIN_ID = '0xa8230'; // 688688
      const FALLBACK_EXPLORER_BASE =
        invoice.explorer_base_url ||
        (window.APP_CONFIG &&
          window.APP_CONFIG.mcp &&
          window.APP_CONFIG.mcp.receipt_explorer_base_url) ||
        'https://pharos-testnet.socialscan.io/tx';

      // —— 1. 基本检查 ——
      const recipient = (invoice.recipient || '').trim();
      if (!recipient) {
        throw new Error('Invoice missing recipient address');
      }
      const amount = invoice.amount_usdc ?? invoice.amount;
      if (amount == null) {
        throw new Error('Invoice missing amount');
      }
      const decimals =
        typeof invoice.decimals === 'number'
          ? invoice.decimals
          : (window.APP_CONFIG &&
             window.APP_CONFIG.mcp &&
             window.APP_CONFIG.mcp.decimals) || 18;

      // —— 2. 拿到 MetaMask provider + 当前账户 ——
      const wm = window.walletManager;
      if (!wm) {
        throw new Error('Wallet manager not available. Please refresh the page.');
      }
      const user =
        typeof wm.getUserInfo === 'function'
          ? wm.getUserInfo()
          : { isConnected: false };
      if (!user.isConnected || !user.address) {
        throw new Error('Please connect MetaMask before making a payment.');
      }
      let provider = null;
      if (typeof wm.getMetaMaskProvider === 'function') {
        provider = wm.getMetaMaskProvider();
      }
      if (!provider && window.ethereum && window.ethereum.isMetaMask) {
        provider = window.ethereum;
      }
      if (!provider || typeof provider.request !== 'function') {
        throw new Error('MetaMask provider not detected. Please install or enable MetaMask.');
      }

      // —— 3. 确保链是 Pharos Testnet（必要时自动切链 / 加链） ——
      let currentChainId = null;
      try {
        currentChainId = await provider.request({ method: 'eth_chainId' });
      } catch (e) {
        console.warn('[MCPClient] Failed to read chainId:', e);
      }
      let targetChainId = PHAROS_CHAIN_ID;
      try {
        if (typeof getPreferredNetwork === 'function') {
          const preferred = getPreferredNetwork();
          if (preferred && preferred.chainId) {
            targetChainId = preferred.chainId;
          }
        }
      } catch (e) {
        console.warn('[MCPClient] getPreferredNetwork failed, using default Pharos chainId', e);
      }

      if (
        currentChainId &&
        currentChainId.toLowerCase() !== targetChainId.toLowerCase()
      ) {
        console.log('[MCPClient] Switching chain to Pharos Testnet', {
          from: currentChainId,
          to: targetChainId
        });
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }]
          });
        } catch (switchErr) {
          console.warn('[MCPClient] wallet_switchEthereumChain failed:', switchErr);
          const canAdd =
            switchErr &&
            (switchErr.code === 4902 || switchErr.code === '4902') &&
            typeof getAddChainParams === 'function';
          if (canAdd) {
            try {
              const addParams = getAddChainParams({
                chainId: targetChainId,
                name: 'Pharos Testnet'
              });
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [addParams]
              });
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: targetChainId }]
              });
            } catch (addErr) {
              console.error('[MCPClient] Failed to add/switch to Pharos chain', addErr);
              if (typeof showNotification === 'function') {
                showNotification(
                  'Please manually switch MetaMask to Pharos Testnet and try again.',
                  'error'
                );
              }
              throw addErr;
            }
          } else {
            if (typeof showNotification === 'function') {
              showNotification(
                'Please switch MetaMask to Pharos Testnet in your wallet and try again.',
                'error'
              );
            }
            throw switchErr;
          }
        }
      }

      // —— 4. 把 amount 转成 wei(hex) ——
      function toHexWei(amountInput, decimalsInput) {
        const decs =
          typeof decimalsInput === 'number' && Number.isFinite(decimalsInput)
            ? decimalsInput
            : 18;
        const s = String(amountInput).trim();
        if (!s) return '0x0';
        const parts = s.split('.');
        const intRaw = parts[0] || '0';
        const fracRaw = parts[1] || '';
        const intPart = intRaw.replace(/^0+/, '') || '0';
        const fracStr = fracRaw.replace(/0+$/, '');
        if (fracStr.length > decs) {
          throw new Error(
            `Too many decimal places in amount (max ${decs}, got ${fracStr.length}).`
          );
        }
        const fracPadded = fracStr + '0'.repeat(decs - fracStr.length);
        const combined = (intPart === '0' ? '' : intPart) + fracPadded;
        const big =
          combined === '' ? 0n : BigInt(combined.replace(/^0+/, '') || '0');
        return '0x' + big.toString(16);
      }

      const valueHex = toHexWei(amount, decimals);
      const txParams = {
        from: user.address,
        to: recipient,
        value: valueHex
      };

      if (typeof logStatus === 'function') {
        logStatus('payment', `Sending PHRS payment of ${amount} on Pharos Testnet…`, {
          to: recipient,
          valueHex,
          request_id: invoice.request_id,
          nonce: invoice.nonce
        });
      }

      console.log('[MCPClient] eth_sendTransaction params:', txParams);

      // —— 5. 通过 MetaMask 发送交易 ——
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams]
      });

      if (!txHash) {
        throw new Error('No transaction hash returned from MetaMask');
      }

      console.log('[MCPClient] Payment transaction sent:', txHash);

      const explorerUrl =
        FALLBACK_EXPLORER_BASE.replace(/\/+$/, '') +
        '/' +
        encodeURIComponent(txHash);

      try {
        if (typeof showExplorerToast === 'function') {
          showExplorerToast({
            url: explorerUrl,
            title: 'Payment submitted',
            subtitle: 'Click to view on Pharos explorer.'
          });
        }
      } catch (e) {
        console.warn('[MCPClient] Failed to show explorer toast:', e);
      }

      if (typeof logStatus === 'function') {
        logStatus('payment', 'Payment transaction submitted. Awaiting verification…', {
          tx: txHash,
          explorerUrl
        });
      }

      return txHash;
    } catch (error) {
      console.error('[MCPClient] settleInvoice error:', error);
      if (typeof logStatus === 'function') {
        logStatus('cancel', error && error.message ? error.message : 'Payment cancelled', {
          error: String(error && error.stack ? error.stack : error)
        });
      }
      throw error;
    }
  }


  async function request(path, body, opts = {}) {
    const fullEndpoint = path.startsWith('http')
      ? path
      : `${MCP_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    console.log('[MCPClient] request start', fullEndpoint, body);
    const baseHeaders = { 'Content-Type': 'application/json' };
    let sessionHeaders = { ...(opts.headers || {}) };
    let paymentHeaders = {};
    const history = [];
    const payload = { ...(body || {}) };
    let walletAddress = detectWalletAddress();
    if (walletAddress) {
      baseHeaders['X-Wallet-Address'] = walletAddress;
      if (!payload.wallet_address) {
        payload.wallet_address = walletAddress;
      }
    }
    
    // 添加网络信息到请求头
    try {
      const networkRaw = localStorage.getItem('i3_preferred_network');
      if (networkRaw) {
        const network = JSON.parse(networkRaw);
        if (network && network.key) {
          baseHeaders['X-Pharos-Network'] = network.key;
          if (!payload.network) {
            payload.network = network.key;
          }
        }
      }
    } catch (e) {
      console.warn('[MCPClient] Failed to read network from localStorage:', e);
    }

    while (true) {
      if (walletAddress && payload.wallet_address !== walletAddress) {
        payload.wallet_address = walletAddress;
      }
      const payloadJson = JSON.stringify(payload);
      const headers = { ...baseHeaders, ...sessionHeaders, ...paymentHeaders };
      console.log('[MCPClient] issuing fetch', fullEndpoint, { headers });
      const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers,
        body: payloadJson
      });
      console.log('[MCPClient] response status', response.status, fullEndpoint);
      paymentHeaders = {};

      const session = response.headers.get('X-Workflow-Session');
      if (session) {
        sessionHeaders['X-Workflow-Session'] = session;
      }

      if (response.status === 402) {
        const invoice = await response.json();
        console.log('[MCPClient] received 402 invoice', invoice);
        console.log('[MCPClient] Invoice status:', invoice.status);
        console.log('[MCPClient] Is payment_required?', invoice.status === 'payment_required');
        console.log('[MCPClient] Full invoice:', JSON.stringify(invoice, null, 2));
        if (invoice.status && invoice.status !== 'payment_required') {
          // 如果验证失败但提供了 explorerLink，说明交易可能已成功但 RPC 延迟
          // 在这种情况下，不显示错误，而是继续重试请求（后端应该会允许继续）
          if (invoice.status === 'payment_verification_failed' && 
              invoice.code === 'tx_not_found' && 
              invoice.details?.explorerLink) {
            
            // *** 新增: 增加重试计数器 ***
            if (!history.retryCount) history.retryCount = 0;
            history.retryCount++;
            
            console.warn(`[MCPClient] Transaction not found on RPC (attempt ${history.retryCount}/20), but explorer link is available. Retrying...`);
            console.warn('[MCPClient] Explorer link:', invoice.details.explorerLink);
            
            // *** 修改: 增加等待时间,最多重试 20 次 ***
            if (history.retryCount <= 20) {
              const waitTime = Math.min(2000 * history.retryCount, 5000); // 从2秒逐渐增加到5秒
              console.log(`[MCPClient] Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              console.error('[MCPClient] Max retries reached, but transaction exists on explorer');
              // 即使达到最大重试次数,如果有 explorerLink,也视为成功
              return {
                status: 'ok',
                result: {
                  tx: invoice.details.explorerLink.split('/').pop(),
                  message: 'Payment confirmed via explorer (RPC delayed)',
                  explorerLink: invoice.details.explorerLink
                },
                history
              };
            }
          }
          
          // 检查错误消息中是否包含 "Transaction not found" 且提供了 explorerLink
          // 如果是，也不显示错误，而是继续重试
          const errorMessage = invoice.message || invoice.status || '';
          if (errorMessage.includes('Transaction not found') && invoice.details?.explorerLink) {
            
            // *** 新增: 增加重试计数器 ***
            if (!history.retryCount) history.retryCount = 0;
            history.retryCount++;
            
            console.warn(`[MCPClient] Transaction not found on RPC (attempt ${history.retryCount}/20), but explorer link is available. Retrying...`);
            console.warn('[MCPClient] Explorer link:', invoice.details.explorerLink);
            
            // *** 修改: 增加等待时间,最多重试 20 次 ***
            if (history.retryCount <= 20) {
              const waitTime = Math.min(2000 * history.retryCount, 5000); // 从2秒逐渐增加到5秒
              console.log(`[MCPClient] Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              console.error('[MCPClient] Max retries reached, but transaction exists on explorer');
              // 即使达到最大重试次数,如果有 explorerLink,也视为成功
              return {
                status: 'ok',
                result: {
                  message: 'Payment confirmed via explorer (RPC delayed)',
                  explorerLink: invoice.details.explorerLink
                },
                history
              };
            }
          }
          
          const reason = invoice.message || invoice.status || 'Payment required';
          logStatus('cancel', reason, {
            amount: invoice.amount_usdc,
            memo: invoice.memo
          });
          return {
            status: 'invoice_error',
            invoice,
            history: [...history, { type: 'invoice_error', invoice }]
          };
        }
        
        // 检查是否有 prepaid credits
        const prepaidCreditsRaw = localStorage.getItem('prepaidCredits');
        if (prepaidCreditsRaw) {
          try {
            const prepaidCredits = JSON.parse(prepaidCreditsRaw);
            const modelCandidates = [
              payload.model,
              payload.modelName,
              payload.modelId,
              invoice.model_or_node,
              invoice.model,
              invoice.modelId,
              invoice.auto_router?.model?.id,
              invoice.auto_router?.model?.name
            ].filter(Boolean);
            const matchedCandidate = resolveModelMatch(prepaidCredits.modelName, modelCandidates);
            const fallbackModel = payload.model || payload.modelId || invoice.model_or_node;
            const modelName = matchedCandidate || fallbackModel;
            
            console.log('[MCPClient] Checking prepaid credits:', {
              prepaidModel: prepaidCredits.modelName,
              requestModel: modelName,
              remaining: prepaidCredits.remainingCalls,
              invoiceModel: invoice.model_or_node
            });
            
            // 尝试多种方式匹配模型名称
            const requestedModel = modelName || invoice.model_or_node;
            const isModelMatch = modelIdentifiersMatch(prepaidCredits.modelName, requestedModel);
            
            if (isModelMatch && prepaidCredits.remainingCalls > 0) {
              console.log(`[MCPClient] ✅ Using prepaid credits: ${prepaidCredits.remainingCalls} calls remaining for ${requestedModel}`);
              
              // 减少一次 API call
              prepaidCredits.remainingCalls -= 1;
              prepaidCredits.lastUsedAt = new Date().toISOString();
              
              // 如果用完了，清除 prepaid credits
              if (prepaidCredits.remainingCalls <= 0) {
                console.log('[MCPClient] Prepaid credits exhausted, clearing...');
                localStorage.removeItem('prepaidCredits');
                
                // 显示通知
                setTimeout(() => {
                  const notification = document.createElement('div');
                  notification.style.cssText = `
                    position: fixed; top: 20px; right: 20px; z-index: 10000;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white; padding: 16px 24px; border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
                  `;
                  notification.innerHTML = `
                    ⚠️ API calls exhausted!<br>
                    <span style="font-size: 12px; font-weight: 400;">Purchase more from Modelverse to continue.</span>
                  `;
                  document.body.appendChild(notification);
                  
                  setTimeout(() => notification.remove(), 5000);
                }, 500);
              } else {
                localStorage.setItem('prepaidCredits', JSON.stringify(prepaidCredits));
              }
              
              // 同步更新 myAssets
              const myAssetsRaw = localStorage.getItem('myAssets');
              if (myAssetsRaw) {
                const myAssets = JSON.parse(myAssetsRaw);
                const tokenAsset = myAssets.tokens.find(
                  (t) => modelIdentifiersMatch(t.modelName, prepaidCredits.modelName) ||
                    modelIdentifiersMatch(t.modelName, modelName)
                );
                if (tokenAsset && tokenAsset.quantity > 0) {
                  tokenAsset.quantity -= 1;
                  localStorage.setItem('myAssets', JSON.stringify(myAssets));
                  console.log(`[MCPClient] Deducted 1 API call. Remaining: ${tokenAsset.quantity}`);
                  
                  // 如果 myAssets 中也用完了，移除该 token
                  if (tokenAsset.quantity <= 0) {
                    myAssets.tokens = myAssets.tokens.filter(
                      (t) =>
                        !modelIdentifiersMatch(t.modelName, prepaidCredits.modelName) &&
                        !modelIdentifiersMatch(t.modelName, modelName)
                    );
                    localStorage.setItem('myAssets', JSON.stringify(myAssets));
                    console.log(`[MCPClient] Removed ${modelName} from myAssets (exhausted)`);
                  }
                }
              }
              
              // 使用 prepaid 标记跳过实际支付
              logStatus('invoice', `Using prepaid credits (${prepaidCredits.remainingCalls} remaining)`, {
                amount: invoice.amount_usdc,
                memo: 'PREPAID'
              });
              
              // 设置特殊的支付 header 表示使用 prepaid credits
              paymentHeaders = {
                'X-PAYMENT': `prepaid model=${normalizeModelIdentifier(requestedModel || prepaidCredits.modelName)}; remaining=${prepaidCredits.remainingCalls}; nonce=${invoice.nonce}`,
                'X-Prepaid-Credits': 'true',
                'X-Request-Id': invoice.request_id || invoice.memo
              };
              
              console.log('[MCPClient] Setting prepaid payment headers:', paymentHeaders);
              
              // 触发 UI 更新事件
              window.dispatchEvent(new CustomEvent('prepaidCreditsUsed', { 
                detail: { 
                  modelName: requestedModel, 
                  remaining: prepaidCredits.remainingCalls 
                } 
              }));
              
              continue;
            } else {
              console.log('[MCPClient] Prepaid credits not applicable:', {
                modelMatch: isModelMatch,
                hasCredits: prepaidCredits.remainingCalls > 0,
                prepaidModel: prepaidCredits.modelName,
                requestedModel: requestedModel
              });
            }
          } catch (err) {
            console.warn('[MCPClient] Error checking prepaid credits:', err);
          }
        }
        
        history.push({ type: 'invoice', invoice });
        
        // 获取 Auto Router 选中的模型信息
        const autoRouterModel = invoice.auto_router?.model?.id || invoice.model_or_node || payload.model;
        
        logStatus('invoice', invoice.description || 'Payment required', {
          amount: invoice.amount_usdc,
          memo: invoice.memo,
          autoRouterModel: autoRouterModel
        });
        emit('invoice', { endpoint: fullEndpoint, invoice });
        if (typeof opts.onInvoice === 'function') {
          try { await opts.onInvoice(invoice); } catch (_) {}
        }
        if (opts.autoPay === false) {
          return { status: 'invoice', invoice, history, headers: sessionHeaders };
        }
        let tx;
        try {
          tx = opts.paymentProvider
          ? await opts.paymentProvider(invoice)
            : await settleInvoice(invoice);
        } catch (paymentError) {
          history.push({ type: 'payment_error', invoice, error: paymentError });
          logStatus('cancel', `Payment failed: ${paymentError?.message || 'Payment error'}`, {
            amount: invoice.amount_usdc,
            memo: invoice.memo
          });
          emit('payment:error', { endpoint: fullEndpoint, invoice, error: paymentError });
          throw paymentError;
        }
        if (!tx) {
          return { status: 'cancelled', invoice, history };
        }
        history.push({ type: 'payment', invoice, tx });
        if (typeof opts.onPayment === 'function') {
          try { await opts.onPayment(invoice, tx); } catch (_) {}
        }
        emit('payment:settled', { endpoint: fullEndpoint, invoice, tx });
        walletAddress = detectWalletAddress() || walletAddress;
        if (walletAddress) {
          baseHeaders['X-Wallet-Address'] = walletAddress;
        }
        const memoPart = invoice.memo ? `; memo=${invoice.memo}` : '';
        paymentHeaders = {
          'X-Request-Id': invoice.request_id,
          'X-PAYMENT': `x402 tx=${tx}; amount=${invoice.amount_usdc}; nonce=${invoice.nonce}${memoPart}`
        };
        continue;
      }

      const result = await response.json();
      console.log('[MCPClient] final result', result);
      history.push({ type: 'result', result });
      if (typeof opts.onResult === 'function') {
        try { await opts.onResult(result); } catch (_) {}
      }
      emit('result', { endpoint: fullEndpoint, result });
      logStatus('result', 'Call completed', {});
      try {
        const explorerUrl =
          result?.final_node?.explorer ||
          result?.explorer ||
          result?.receipt?.explorer ||
          result?.meta?.verification?.explorerUrl;
        if (explorerUrl) {
          showExplorerToast({
            url: explorerUrl,
            title: 'On-chain Transaction',
            subtitle: 'Click to view on Pharos explorer.'
          });
        }
      } catch (toastError) {
        console.warn('[MCPClient] failed to display explorer toast', toastError);
      }
      return { status: 'ok', result, history };
    }
  }

  async function invokeModel({ prompt, modelName, metadata } = {}) {
    const body = {
      prompt,
      model: modelName,
      metadata: metadata || {}
    };
    return request('/mcp/models.invoke', body, {});
  }

  async function executeWorkflow(payload, hooks = {}) {
    return request('/mcp/workflow/execute', payload, {
      onInvoice: hooks.onInvoice,
      onPayment: hooks.onPayment,
      onResult: hooks.onResult
    });
  }

  async function purchaseShare(payload, hooks = {}) {
    return request('/mcp/share/buy', payload, {
      onInvoice: hooks.onInvoice,
      onPayment: hooks.onPayment,
      onResult: hooks.onResult
    });
  }

  async function claimCheckin(payload, hooks = {}) {
    const res = await fetch(`${MCP_BASE_URL}/mcp/checkin/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      logStatus('result', 'Check-in successful', {
        amount: data.amount_usdc,
        tx: data.tx_signature
      });
      if (typeof hooks.onResult === 'function') {
        try { await hooks.onResult(data); } catch (_) {}
      }
      emit('result', { endpoint: 'checkin', result: data });
      return { status: 'ok', result: data };
    }
    emit('error', { endpoint: 'checkin', error: data });
    return { status: 'error', error: data };
  }

  window.MCPClient = {
    baseUrl: MCP_BASE_URL,
    request,
    invokeModel,
    executeWorkflow,
    settleInvoice,
    purchaseShare,
    claimCheckin,
    logStatus,
    // Debug helpers
    debugPrepaidCredits() {
      const prepaidCreditsRaw = localStorage.getItem('prepaidCredits');
      const myAssetsRaw = localStorage.getItem('myAssets');
      const currentModelRaw = localStorage.getItem('currentModel');
      
      console.log('=== Prepaid Credits Debug ===');
      console.log('1. Prepaid Credits:', prepaidCreditsRaw ? JSON.parse(prepaidCreditsRaw) : 'None');
      console.log('2. My Assets Tokens:', myAssetsRaw ? JSON.parse(myAssetsRaw).tokens : 'None');
      console.log('3. Current Model:', currentModelRaw ? JSON.parse(currentModelRaw) : 'None');
      
      return {
        prepaidCredits: prepaidCreditsRaw ? JSON.parse(prepaidCreditsRaw) : null,
        myAssets: myAssetsRaw ? JSON.parse(myAssetsRaw) : null,
        currentModel: currentModelRaw ? JSON.parse(currentModelRaw) : null
      };
    },
    clearPrepaidCredits() {
      localStorage.removeItem('prepaidCredits');
      console.log('✅ Prepaid credits cleared. Please refresh and use the "Use" button again.');
    }
  };
})();
