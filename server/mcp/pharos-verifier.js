const fetch = require('node-fetch');
const { MCP_CONFIG } = require('./config');

// 默认使用 Pharos testnet 的 RPC（可以被 MCP_CONFIG.payments.rpcUrl 覆盖）
const DEFAULT_RPC =
  MCP_CONFIG.payments.rpcUrl ||
  'https://api.zan.top/node/v1/pharos/testnet/35905838255149eaa94c610c79294f0f';

/**
 * 将「人类可读」的小数金额转换成整数 base units（支持 18 位）
 * 例如：toBaseUnits('0.1', 18) => 100000000000000000n
 */
function toBaseUnits(amount, decimals) {
  if (amount === undefined || amount === null) {
    throw new Error('amount is required');
  }
  const decs = Number.isFinite(decimals) ? decimals : MCP_CONFIG.payments.decimals || 18;
  const str = String(amount).trim();
  if (!str.length) {
    throw new Error('amount is empty');
  }
  const [intPartRaw, fracPartRaw = ''] = str.split('.');
  const intPart = intPartRaw || '0';
  const fracPart = fracPartRaw;
  
  if (fracPart.length > decs) {
    throw new Error(`Too many decimal places: got ${fracPart.length}, max ${decs}`);
  }
  
  // Pad fractional part to full decimals
  const fracPadded = fracPart.padEnd(decs, '0');
  const combined = intPart + fracPadded;
  
  // Remove leading zeros
  const cleaned = combined.replace(/^0+/, '') || '0';
  return BigInt(cleaned);
}

async function jsonRpc(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    })
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP error: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (body.error) {
    const msg = body.error.message || 'RPC error';
    const code = body.error.code;
    throw new Error(`RPC error (${code}): ${msg}`);
  }
  return body.result;
}

/**
 * 核心校验函数：名字仍然叫 verifySolanaUsdcTransfer，
 * 但内部已经完全改成「在 Pharos testnet 上验证一笔 PHRS 原生币转账」。
 *
 * 参数结构保持兼容原来的调用：
 *   - signature: tx hash
 *   - amount: 人类可读金额（例如 0.01）
 *   - recipient: 收款地址（如果没传，用 MCP_CONFIG.payments.recipient）
 *   - decimals: 精度（默认 18）
 *   - expectedWallet: 期望的付款地址（如果有）
 *   - networkConfig: 里可以带 rpcUrl / explorerBaseUrl / network 等
 *   - mint / memo: 仍然接受但会被忽略
 */
async function verifySolanaUsdcTransfer({
  signature,
  amount,
  recipient,
  decimals,
  expectedWallet,
  networkConfig
}) {
  const rpcUrl =
    (networkConfig && networkConfig.rpcUrl) ||
    MCP_CONFIG.payments.rpcUrl ||
    DEFAULT_RPC;
  const explorerBaseUrl =
    (networkConfig && networkConfig.explorerBaseUrl) ||
    MCP_CONFIG.payments.explorerBaseUrl ||
    'https://pharos-testnet.socialscan.io/tx';

  const txHash = signature;
  const explorerUrl = `${explorerBaseUrl}/${txHash}`;

  if (!txHash) {
    return {
      ok: false,
      code: 'missing_tx_hash',
      message: 'Missing transaction hash',
      explorerUrl
    };
  }

  const expectedRecipient =
    (recipient || MCP_CONFIG.payments.recipient || '').toLowerCase();
  if (!expectedRecipient) {
    return {
      ok: false,
      code: 'missing_recipient',
      message: 'No recipient configured for payments',
      explorerUrl
    };
  }

  const decs = decimals || MCP_CONFIG.payments.decimals || 18;

  try {
    // *** 新增: 轮询等待交易上链 ***
    let tx = null;
    const maxAttempts = 20;
    
    console.log(`[Pharos Verifier] Starting transaction verification with polling (max ${maxAttempts} attempts)...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        tx = await jsonRpc(rpcUrl, 'eth_getTransactionByHash', [txHash]);
        if (tx) {
          console.log(`[Pharos Verifier] ✅ Transaction found after ${attempt + 1} attempt(s)`);
          break;
        }
      } catch (err) {
        console.warn(`[Pharos Verifier] Attempt ${attempt + 1}/${maxAttempts} failed:`, err.message);
      }
      
      if (attempt < maxAttempts - 1) {
        const waitTime = 2000; // 每次等待2秒
        console.log(`[Pharos Verifier] Transaction not found yet, waiting ${waitTime}ms before retry ${attempt + 2}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    if (!tx) {
      console.error(`[Pharos Verifier] ❌ Transaction not found after ${maxAttempts} attempts`);
      return {
        ok: false,
        code: 'tx_not_found',
        message: 'Transaction not found on chain after polling',
        explorerUrl
      };
    }

    // 拿交易回执（确认状态）
    const receipt = await jsonRpc(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
    if (!receipt) {
      return {
        ok: false,
        code: 'receipt_not_found',
        message: 'Transaction receipt not found on chain',
        explorerUrl
      };
    }

    if (receipt.status !== '0x1') {
      return {
        ok: false,
        code: 'tx_failed',
        message: 'Transaction status is not successful',
        explorerUrl
      };
    }

    const from = (tx.from || '').toLowerCase();
    const to = (tx.to || '').toLowerCase();

    if (to !== expectedRecipient) {
      return {
        ok: false,
        code: 'wrong_recipient',
        message: 'Payment was sent to a different address',
        details: { expectedRecipient, actualRecipient: to },
        explorerUrl
      };
    }

    if (expectedWallet) {
      const expectedPayer = expectedWallet.toLowerCase();
      if (from !== expectedPayer) {
        return {
          ok: false,
          code: 'wallet_mismatch',
          message: 'Payment was sent from a different wallet than expected',
          details: { expectedWallet: expectedPayer, actualWallet: from },
          explorerUrl
        };
      }
    }

    // 校验金额：value 是 16 进制字符串（单位 wei）
    const valueHex = tx.value || '0x0';
    const chainAmount = BigInt(valueHex);

    let expectedAmount;
    try {
      expectedAmount = toBaseUnits(amount, decs);
    } catch (err) {
      return {
        ok: false,
        code: 'amount_encode_error',
        message: `Failed to encode expected amount: ${err.message}`,
        explorerUrl
      };
    }

    if (chainAmount < expectedAmount) {
      return {
        ok: false,
        code: 'amount_too_low',
        message: 'On-chain amount is below invoice requirement',
        details: {
          expected: expectedAmount.toString(),
          actual: chainAmount.toString()
        },
        explorerUrl
      };
    }

    return {
      ok: true,
      code: 'ok',
      message: 'Payment verified on Pharos testnet',
      payer: from,
      amountRaw: chainAmount.toString(),
      explorerUrl,
      network: networkConfig?.network || MCP_CONFIG.payments.network || 'pharos-testnet'
    };
  } catch (err) {
    console.error('[verifySolanaUsdcTransfer] Error verifying payment:', err);
    return {
      ok: false,
      code: 'verification_error',
      message: err.message || 'Unknown verification error',
      explorerUrl
    };
  }
}

module.exports = {
  toBaseUnits,
  verifySolanaUsdcTransfer,
  verifyPharosTransfer: verifySolanaUsdcTransfer
};
