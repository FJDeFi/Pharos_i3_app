// Canvas Workflow JavaScript
console.log('🎨 Loading Canvas Workflow...');

// Global variables
let workflowNodes = [];
let connections = [];
let nodeIdCounter = 0;
let connectionIdCounter = 0;
let draggedModel = null;
let isConnecting = false;
let connectionStart = null;
let temporaryLine = null;

const NODE_WIDTH = 320;
const NODE_HEIGHT = 200;
const WORKSPACE_PADDING = 400;
let sidebarModelsBase = [];

// Selection variables
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionBox = null;
let selectedNodes = new Set();
let selectedConnections = new Set();

// ==================== x402 Payment Support Functions ====================

/**
 * 获取已连接的钱包地址（Canvas 版）
 * 直接复用 wallet-manager.js 在 localStorage 里存的地址：
 *   localStorage.setItem('wallet_connected', this.walletAddress)
 */
async function getConnectedWallet() {
    try {
        // 和 wallet-manager.js 保持一致，用 'wallet_connected'
        const savedWallet = localStorage.getItem('wallet_connected');
        if (savedWallet && typeof savedWallet === 'string' && savedWallet.trim() !== '') {
            return savedWallet;
        }
        console.warn('[Canvas] No connected wallet found in localStorage (wallet_connected)');
        return null;
    } catch (e) {
        console.error('[Canvas] Failed to read wallet from localStorage:', e);
        return null;
    }
}

// ---- x402 / Pharos 支付辅助函数（Canvas 专用）----
async function sendCanvasPharosPayment(recipient, amountUsdc, decimals) {
    if (!window.ethereum || typeof ethers === 'undefined') {
        throw new Error('Wallet provider (MetaMask / ethers) not available');
    }
    // 确保钱包已经连接
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const amountWei = ethers.utils.parseUnits(
        amountUsdc.toString(),
        decimals || 18
    );
    const tx = await signer.sendTransaction({
        to: recipient,
        value: amountWei
    });
    // 等待链上确认
    await tx.wait();
    return tx; // 保留 tx.hash 给后面 confirm 使用
}

// ---- Canvas 版 x402 Invoice 弹窗（对齐 workflow 的 UI + 付款逻辑）----
function show402InvoiceModal(invoice, workflow) {
    return new Promise((resolve) => {
        const workflowInfo = invoice.workflow || {};
        const workflowName =
            (workflow && workflow.name) ||
            workflowInfo.name ||
            'My Canvas Workflow';
        const network = invoice.network || 'pharos-testnet';
        const nodeCount =
            workflowInfo.node_count ??
            workflowInfo.total_nodes ??
            invoice.total_nodes ??
            0;
        const amount = Number(invoice.amount_usdc || 0);
        const expiresAt = invoice.expires_at
            ? new Date(invoice.expires_at)
            : null;
        const explorerBase =
            invoice.explorer_base_url ||
            'https://pharos-testnet.socialscan.io/tx';
        const costBreakdown = invoice.cost_breakdown || [];
        const breakdownRows =
            costBreakdown.map((node) => `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
                        ${node.name}
                    </td>
                    <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #f3f4f6;">
                        ${node.calls}
                    </td>
                    <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #f3f4f6;">
                        ${Number(node.total_cost || 0).toFixed(6)} PHRS
                    </td>
                </tr>
            `).join('') || `
                <tr>
                    <td colspan="3" style="padding:12px;text-align:center;color:#6b7280;border-bottom:1px solid #f3f4f6;">
                        No detailed cost breakdown.
                    </td>
                </tr>
            `;

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.cssText =
            'position:fixed;inset:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;';
        modal.innerHTML = `
            <div style="background:white;border-radius:18px;padding:24px 24px 20px;
                        box-shadow:0 20px 45px rgba(15,23,42,0.35);
                        width:100%;max-width:640px;max-height:80vh;overflow-y:auto;
                        font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
                <!-- Header -->
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                    <div style="width:32px;height:32px;border-radius:999px;
                                background:linear-gradient(135deg,#6366f1,#3b82f6);
                                display:flex;align-items:center;justify-content:center;
                                color:white;font-size:18px;">
                        ₓ
                    </div>
                    <div style="flex:1;">
                        <h2 style="margin:0;font-size:18px;color:#111827;">x402 Payment Invoice</h2>
                        <p style="margin:2px 0 0 0;font-size:12px;color:#6b7280;">
                            Pay once, then execute this workflow from Canvas without additional transactions.
                        </p>
                    </div>
                    <span style="font-size:11px;font-weight:600;padding:4px 8px;border-radius:999px;
                                 background:#e0f2fe;color:#0369a1;">
                        x402 PROTOCOL
                    </span>
                </div>
                <!-- Summary -->
                <div style="border-radius:12px;background:#f9fafb;padding:16px 14px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
                        <span style="color:#6b7280;">Workflow</span>
                        <span style="font-weight:600;color:#111827;">${workflowName}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
                        <span style="color:#6b7280;">Total Nodes</span>
                        <span style="font-weight:600;color:#111827;">${nodeCount}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;">
                        <span style="color:#6b7280;">Network</span>
                        <span style="font-weight:600;color:#111827;">${network}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:14px;">
                        <span style="color:#6b7280;">Total Amount</span>
                        <span style="font-weight:700;color:#16a34a;">${amount.toFixed(6)} PHRS</span>
                    </div>
                </div>
                <!-- Cost breakdown -->
                <details open style="margin-bottom:16px;border-radius:12px;border:1px solid #e5e7eb;background:#ffffff;">
                    <summary style="list-style:none;padding:10px 14px;cursor:pointer;
                                    display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:13px;color:#374151;">📊 Cost Breakdown (${nodeCount} nodes)</span>
                        <span style="font-size:11px;color:#6b7280;">Toggle</span>
                    </summary>
                    <div style="border-top:1px solid #e5e7eb;">
                        <table style="width:100%;border-collapse:collapse;font-size:12px;">
                            <thead>
                                <tr>
                                    <th style="text-align:left;padding:8px 12px;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb;">Model</th>
                                    <th style="text-align:center;padding:8px 12px;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb;">Calls</th>
                                    <th style="text-align:right;padding:8px 12px;color:#6b7280;font-weight:500;border-bottom:1px solid #e5e7eb;">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${breakdownRows}
                            </tbody>
                        </table>
                    </div>
                </details>
                <!-- Pay once note -->
                <div style="margin-bottom:14px;padding:10px 12px;border-radius:12px;
                            border:1px solid #facc15;background:#fef9c3;font-size:12px;color:#854d0e;">
                    <strong style="display:block;margin-bottom:4px;">⚡ Pay Once, Execute All!</strong>
                    <span>After this single payment, you can execute all ${nodeCount || 'workflow'} nodes without any additional transactions.</span>
                </div>
                <!-- Recipient / Request / Explorer / Expiry -->
                <div style="margin-bottom:18px;padding:12px 14px;border-radius:12px;
                            border-left:4px solid #3b82f6;background:#eff6ff;font-size:12px;color:#1e3a8a;">
                    <div style="margin-bottom:6px;">
                        <strong>📍 Recipient:</strong><br>
                        <code style="font-size:11px;background:white;border-radius:6px;padding:4px 6px;word-break:break-all;">
                            ${invoice.recipient}
                        </code>
                    </div>
                    <div style="margin-bottom:6px;">
                        <strong>🆔 Request ID:</strong><br>
                        <code style="font-size:11px;background:white;border-radius:6px;padding:4px 6px;word-break:break-all;">
                            ${invoice.request_id}
                        </code>
                    </div>
                    <div style="margin-bottom:6px;">
                        <strong>🔗 Explorer:</strong><br>
                        <span style="font-size:11px;">${explorerBase}/&lt;tx-hash-after-payment&gt;</span>
                    </div>
                    ${
                        expiresAt
                            ? `<div>
                                   <strong>⏰ Expires:</strong><br>
                                   <span style="font-size:11px;">${expiresAt.toLocaleString()}</span>
                               </div>`
                            : ''
                    }
                </div>
                <!-- status + buttons -->
                <div id="x402-payment-status"
                     style="font-size:12px;color:#6b7280;margin-bottom:8px;min-height:16px;"></div>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
                    <button id="x402-cancel-btn"
                            style="padding:9px 16px;font-size:13px;border-radius:999px;border:1px solid #e5e7eb;
                                   background:white;color:#374151;cursor:pointer;">
                        Cancel
                    </button>
                    <button id="x402-pay-btn"
                            style="padding:9px 18px;font-size:13px;border-radius:999px;border:none;
                                   background:linear-gradient(135deg,#4f46e5,#6366f1);
                                   color:white;font-weight:600;cursor:pointer;">
                        Pay ${amount.toFixed(6)} PHRS
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#x402-cancel-btn');
        const payBtn = modal.querySelector('#x402-pay-btn');
        const statusEl = modal.querySelector('#x402-payment-status');

        // 取消：关闭弹窗，返回 null
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });

        // 支付：调用 MetaMask / Pharos，一次性完成付款
        payBtn.addEventListener('click', async () => {
            try {
                payBtn.disabled = true;
                payBtn.textContent = 'Waiting for wallet...';
                statusEl.textContent = 'Please confirm the transaction in your wallet.';

                const tx = await sendCanvasPharosPayment(
                    invoice.recipient,
                    amount,
                    invoice.decimals || 18
                );

                statusEl.textContent = 'Payment sent, waiting for confirmation...';

                // 把 tx.hash 传回去，后面的 confirm + 保存逻辑沿用原有 purchaseAndPrepayCanvasWorkflow
                document.body.removeChild(modal);
                resolve({
                    hash: tx.hash,
                    amount,
                    network,
                    explorerUrl: explorerBase + '/' + tx.hash
                });
            } catch (err) {
                console.error('x402 canvas payment error:', err);
                statusEl.textContent =
                    'Payment failed or was rejected: ' +
                    (err && err.message ? err.message : err);
                payBtn.disabled = false;
                payBtn.textContent = `Pay ${amount.toFixed(6)} PHRS`;
            }
        });
    });
}

/**
 * 显示支付成功的toast通知
 */
function showWorkflowExplorerToast(signature, amount, explorerUrlOverride) {
    try {
        if (!signature) return;
        const existing = document.getElementById('workflow-payment-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.id = 'workflow-payment-toast';
        toast.className = 'workflow-payment-toast';
        const explorerUrl = explorerUrlOverride || `https://pharos-testnet.socialscan.io/tx/${encodeURIComponent(signature)}`;
        
        toast.innerHTML = `
            <button class="workflow-payment-toast__close" aria-label="Dismiss">×</button>
            <h4>✅ Workflow Payment Settled</h4>
            <p>Amount: <strong>${Number(amount).toFixed(6)} PHRS</strong></p>
            <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">View on Explorer →</a>
        `;
        
        const close = toast.querySelector('.workflow-payment-toast__close');
        if (close) close.addEventListener('click', () => toast.remove());
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            try { toast.remove(); } catch (_) {}
        }, 12000);
    } catch (err) {
        console.warn('Failed to show explorer toast', err);
    }
}

/**
 * 预付费购买Canvas workflow
 * 完整的x402支付流程:
 * 1. 请求402发票
 * 2. 显示发票并等待用户支付
 * 3. 提交支付凭证验证
 * 4. 保存prepaid信息
 */
async function purchaseAndPrepayCanvasWorkflow(options = {}) {
    try {
        const {
            workflowId,
            workflowName,
            workflowDescription,
            plan: incomingPlan
        } = options;

        const walletAddress = await getConnectedWallet();
        if (!walletAddress) {
            alert('Please connect your wallet first');
            return;
        }

        // 如果外面已经算好 plan，就直接用；否则这里再算一次兜底
        const plan = incomingPlan || computeExecutionPlan();
        if (!plan || !plan.orderedNodes || !plan.orderedNodes.length) {
            alert('⚠️ Please add at least one model to the Canvas first.');
            return;
        }

        // 从 localStorage 兜底读取一次 currentWorkflow，避免字段缺失
        let storedWorkflow = {};
        try {
            storedWorkflow = JSON.parse(localStorage.getItem('currentWorkflow') || '{}') || {};
        } catch (_) {
            storedWorkflow = {};
        }

        const finalWorkflowId = workflowId || storedWorkflow.id || `canvas-${Date.now()}`;
        const finalWorkflowName = workflowName || storedWorkflow.name || 'Canvas Workflow';
        const finalWorkflowDescription = 
            typeof workflowDescription === 'string'
                ? workflowDescription
                : (storedWorkflow.description || '');

        console.log('[Canvas][Prepay] Using workflow meta:', {
            id: finalWorkflowId,
            name: finalWorkflowName,
            description: finalWorkflowDescription
        });

        const nodes = plan.orderedNodes;
        const workflowNodeSummary = nodes.map((node, index) => ({
            index: index + 1,
            id: node.id,
            name: node.modelName,
            quantity: Math.max(Number(node.quantity) || 1, 1),
            category: node.category || '',
            position: { x: node.x, y: node.y }
        }));

        console.log('[Canvas][Prepay] Workflow nodes summary:', workflowNodeSummary);

        // 组装 node payload：name + calls（对应 backend 的 node_count）
        const nodePayload = nodes.map(node => ({
            name: node.modelName,
            calls: Math.max(Number(node.quantity) || 1, 1)
        }));

        const prepayRequestId = `canvas-prepay-${Date.now()}`;
        console.log('[Canvas][Prepay] Sending /mcp/workflow.prepay payload:', {
            workflow: { name: finalWorkflowName },
            nodes: nodePayload,
            requestId: prepayRequestId,
            walletAddress
        });

        console.log('🔄 Requesting prepayment invoice for canvas workflow...');

        // 1) 第一次请求：拿到 402 + invoice
        const invoiceResponse = await fetch('/mcp/workflow.prepay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': prepayRequestId
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                workflow: { name: finalWorkflowName },
                nodes: nodePayload
            })
        });

        if (invoiceResponse.status !== 402) {
            const text = await invoiceResponse.text();
            console.error('[Canvas][Prepay] Expected 402 for invoice, got:', invoiceResponse.status, text);
            alert(`Unexpected response (${invoiceResponse.status}). Please see console logs.`);
            return;
        }

        const invoiceData = await invoiceResponse.json();
        console.log('[Canvas][Prepay] Invoice received:', invoiceData);

        // 打开发票 modal，让用户去链上支付，并让用户输入 tx hash
        const paymentResult = await show402InvoiceModal(invoiceData, {
            name: finalWorkflowName,
            nodes: nodePayload
        });

        if (!paymentResult || !paymentResult.hash) {
            alert('Payment was cancelled or no transaction hash was provided.');
            return;
        }

        console.log('✅ Payment info collected:', paymentResult);

        // ✅ 正确的 X-Payment 格式：必须以 x402 开头，nonce 用 invoiceData.nonce
        const xPaymentHeader = `x402 ${invoiceData.network}; ` +
            `tx=${paymentResult.hash}; ` +
            `amount=${paymentResult.amount ?? invoiceData.amount_usdc}; ` +
            `nonce=${invoiceData.nonce}`;

        console.log('[Canvas][Prepay] X-Payment header:', xPaymentHeader);

        // 2) 第二次请求：带上 X-Payment 确认预付费
        const confirmResponse = await fetch('/mcp/workflow.prepay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': invoiceData.request_id,  // ✅ 使用 invoice 里的 request_id
                'X-Payment': xPaymentHeader
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                workflow: { name: finalWorkflowName },
                nodes: nodePayload
            })
        });

        const confirmJson = await confirmResponse.json();
        console.log('[Canvas][Prepay] Confirm response:', confirmResponse.status, confirmJson);

        // ✅ 检查 HTTP 状态和响应中的 status 字段
        if (!confirmResponse.ok || confirmJson.status !== 'ok') {
            const errorMsg = confirmJson.message || confirmJson.error || 'Payment verification failed';
            console.error('[Canvas][Prepay] Confirmation failed:', errorMsg, confirmJson);
            alert(`❌ Prepay confirmation failed: ${errorMsg}`);
            return;
        }

        // ====== 写 workflow + session 到 localStorage，供 index/chat 使用 ======
        const workflowSession = {
            workflow_session_id: confirmJson.workflow_session_id || confirmJson.workflowSessionId || null,
            amount_paid: confirmJson.amount_usdc || invoiceData.amount_usdc,
            total_nodes: confirmJson.total_nodes || (invoiceData.workflow && invoiceData.workflow.node_count) || nodePayload.reduce((s, n) => s + (n.calls || 0), 0),
            wallet_address: walletAddress,
            lastPaymentTx: paymentResult.hash || null,
            lastPaymentExplorer: paymentResult.explorerUrl || null,
            prepaidAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('canvasWorkflow', JSON.stringify({
                id: finalWorkflowId,
                name: finalWorkflowName,
                description: finalWorkflowDescription,
                prepaid: true,
                prepaidAt: workflowSession.prepaidAt,
                prepaidAmountUsdc: workflowSession.amount_paid,
                prepaidModels: nodePayload,
                lastPaymentTx: workflowSession.lastPaymentTx,
                lastPaymentExplorer: workflowSession.lastPaymentExplorer,
                lastPaymentAt: workflowSession.prepaidAt,
                lastPaymentMemo: `Workflow prepay via Canvas`,
                workflowSessionId: workflowSession.workflow_session_id
            }));
        } catch (e) {
            console.warn('[Canvas][Prepay] Failed to persist canvasWorkflow:', e);
        }

        // 同时更新 currentWorkflow，保持 index.html 兼容（写成"正在运行"的完整工作流）
        let currentWorkflow = {};
        try {
            currentWorkflow = JSON.parse(localStorage.getItem('currentWorkflow') || '{}') || {};
        } catch (_) {
            currentWorkflow = {};
        }

        // 从 plan 里抽取执行顺序（nodes 已在前面定义）
        const sequenceNames = Array.isArray(plan?.sequenceNames) && plan.sequenceNames.length
            ? plan.sequenceNames
            : nodes.map(n => n.modelName);
        const runId = `run-${Date.now()}`;

        // 丰富每个节点的信息（和 executeCanvasWorkflow 保持一致）
        const enrichedNodes = nodes.map(node => {
            const md = (typeof getModelData === 'function') ? getModelData(node.modelName) : null;
            return {
                id: node.id,
                name: node.modelName,
                category: node.category || '',
                quantity: Math.max(Number(node.quantity) || 1, 1),
                x: Number(node.x) || 0,
                y: Number(node.y) || 0,
                purpose: md?.purpose || '',
                useCase: md?.useCase || '',
                industry: md?.industry || ''
            };
        });

        const expertDetails = enrichedNodes.map(n => ({
            name: n.name,
            purpose: n.purpose,
            useCase: n.useCase,
            industry: n.industry
        }));

        const updatedCurrentWorkflow = {
            ...currentWorkflow,
            // 基本信息
            id: finalWorkflowId,
            name: finalWorkflowName,
            description: finalWorkflowDescription,
            // 🔴 关键：对 index.html 来说，这是"正在运行的 workflow"
            status: 'running',
            runId,
            startedAt: new Date().toISOString(),
            // 🔴 chat UI 和执行逻辑会用到的字段
            sequence: sequenceNames,
            experts: sequenceNames.slice(),
            expertDetails,
            graph: {
                nodes: enrichedNodes.map(n => ({
                    id: n.id,
                    name: n.name,
                    category: n.category,
                    x: n.x,
                    y: n.y
                })),
                edges: Array.isArray(plan?.edges)
                    ? plan.edges.map(edge => ({
                        from: edge.from,
                        to: edge.to
                    }))
                    : []
            },
            nodes: enrichedNodes,
            // 预付费相关字段
            prepaid: true,
            prepaidAt: workflowSession.prepaidAt,
            prepaidAmountUsdc: workflowSession.amount_paid,
            prepaidModels: nodePayload,
            lastPaymentTx: workflowSession.lastPaymentTx,
            lastPaymentExplorer: workflowSession.lastPaymentExplorer,
            lastPaymentAt: workflowSession.prepaidAt,
            lastPaymentMemo: `Workflow prepay via Canvas`,
            workflowSessionId: workflowSession.workflow_session_id
        };

        // 清理 forcedModel，确保 chat 用 workflow 模式
        try { localStorage.removeItem('forcedModel'); } catch (_) {}
        try {
            localStorage.setItem('currentWorkflow', JSON.stringify(updatedCurrentWorkflow));
        } catch (e) {
            console.warn('[Canvas][Prepay] Failed to persist currentWorkflow:', e);
        }

        try { localStorage.setItem('autoRouter', 'off'); } catch (_) {}

        console.log('[Canvas][Prepay] Workflow prepaid successfully:', updatedCurrentWorkflow);

        // ✅ 显示支付成功的 toast 通知
        showWorkflowExplorerToast(
            paymentResult.hash,
            workflowSession.amount_paid,
            paymentResult.explorerUrl
        );

        alert(`✅ Workflow "${finalWorkflowName}" prepaid successfully! Redirecting to chat...`);

        // ✅ 清除旧的初始化标记，确保 index.html 会重新显示预付费提示
        try {
            const oldKey1 = `wfInit:${runId}`;
            const oldKey2 = `wfInit:${finalWorkflowName}`;
            localStorage.removeItem(oldKey1);
            localStorage.removeItem(oldKey2);
        } catch (_) {}

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 600);
    } catch (error) {
        console.error('❌ Canvas prepayment failed:', error);
        alert(`Payment failed: ${error.message}`);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化Canvas工作流...');
    loadModels();
    setupDragAndDrop();
    setupCanvasSelection();
    setupKeyboardShortcuts();
    
    // 恢复保存的工作流
    restoreWorkflow();
    
    // 如果从工作流页点击"Try Now"跳转过来，优先加载预选的工作流
    try {
        const selectedWorkflowRaw = localStorage.getItem('selectedWorkflow');
        if (selectedWorkflowRaw) {
            const selectedWorkflow = JSON.parse(selectedWorkflowRaw);
            if (selectedWorkflow && selectedWorkflow.models && selectedWorkflow.models.length > 0) {
                loadWorkflowToCanvas(selectedWorkflow);
            }
            // 只使用一次，避免刷新后重复加载
            localStorage.removeItem('selectedWorkflow');
        }
    } catch (e) {
        console.error('Failed to load selected workflow:', e);
    }
    
    updateWorkspaceSize();
    console.log('Canvas工作流初始化完成');
});

// 新增函数：恢复工作流
function restoreWorkflow() {
    // 检查是否有保存的Canvas工作流数据
    const canvasWorkflow = localStorage.getItem('canvasWorkflow');
    
    if (canvasWorkflow) {
        try {
            const workflowData = JSON.parse(canvasWorkflow);
            console.log('恢复工作流:', workflowData.name);
            
            // 恢复节点
            if (workflowData.nodes && workflowData.nodes.length > 0) {
                workflowData.nodes.forEach(nodeData => {
                    // 添加到workflowNodes数组
                    workflowNodes.push(nodeData);
                    
                    // 创建DOM元素
                    createNodeElement(nodeData);
                    
                    // 更新计数器
                    const nodeNumber = parseInt(nodeData.id.split('-')[1]);
                    if (nodeNumber >= nodeIdCounter) {
                        nodeIdCounter = nodeNumber + 1;
                    }
                });
                
                updateWorkspaceSize();
                // 延迟恢复连接，确保节点已创建
                setTimeout(() => {
                    if (workflowData.connections && workflowData.connections.length > 0) {
                        workflowData.connections.forEach(connData => {
                            connections.push(connData);
                            drawConnection(connData);
                            
                            const connNumber = parseInt(connData.id.split('-')[1]);
                            if (connNumber >= connectionIdCounter) {
                                connectionIdCounter = connNumber + 1;
                            }
                        });
                    }
                    updateWorkspaceSize();
                }, 200);
            }
        } catch (e) {
            console.error('恢复工作流失败:', e);
        }
    }
}

// 新增函数：创建节点DOM元素
function createNodeElement(nodeData) {
    const nodeElement = document.createElement('div');
    nodeElement.className = 'workflow-node';
    nodeElement.id = nodeData.id;
    nodeElement.style.left = `${nodeData.x}px`;
    nodeElement.style.top = `${nodeData.y}px`;
    
    const displayName = nodeData.modelName.length > 20 ? 
        nodeData.modelName.substring(0, 20) + '...' : nodeData.modelName;
    
    nodeElement.innerHTML = `
        <div class="node-header">
            <div class="node-title" title="${nodeData.modelName}">${displayName}</div>
        </div>
        <div class="node-category">${nodeData.category}</div>
        <div class="node-tokens">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
            </svg>
            ${nodeData.quantity} API calls
        </div>
    `;
    
    // 添加连接点
    const leftPoint = document.createElement('div');
    leftPoint.className = 'connection-point left';
    leftPoint.dataset.node = nodeData.id;
    leftPoint.dataset.type = 'left';
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'connection-point right';
    rightPoint.dataset.node = nodeData.id;
    rightPoint.dataset.type = 'right';
    
    nodeElement.appendChild(leftPoint);
    nodeElement.appendChild(rightPoint);
    
    setupNodeDragging(nodeElement, nodeData);
    setupConnectionPoints(nodeElement, nodeData);
    
    document.getElementById('workflowNodes').appendChild(nodeElement);
    updateWorkspaceSize();
}

// 新增函数：恢复保存的工作流
function restoreSavedWorkflow() {
    // 检查多个可能的存储位置
    const savedWorkflow = localStorage.getItem('savedWorkflow');
    const canvasWorkflow = localStorage.getItem('canvasWorkflow');
    
    let workflowToRestore = null;
    
    if (savedWorkflow) {
        try {
            workflowToRestore = JSON.parse(savedWorkflow);
        } catch (e) {
            console.error('Error parsing saved workflow:', e);
        }
    } else if (canvasWorkflow) {
        try {
            workflowToRestore = JSON.parse(canvasWorkflow);
        } catch (e) {
            console.error('Error parsing canvas workflow:', e);
        }
    }
    
    if (workflowToRestore && workflowToRestore.nodes && workflowToRestore.nodes.length > 0) {
        console.log('Restoring workflow with', workflowToRestore.nodes.length, 'nodes');
        restoreWorkflowFromData(workflowToRestore);
    }
}

// 新增函数：从数据恢复工作流
function restoreWorkflowFromData(workflowData) {
    // 清空现有内容
    workflowNodes = [];
    connections = [];
    nodeIdCounter = 0;
    connectionIdCounter = 0;
    
    // 恢复节点
    workflowData.nodes.forEach(nodeData => {
        const restoredNode = {
            id: nodeData.id,
            modelName: nodeData.modelName,
            modelType: nodeData.modelType || 'token',
            category: nodeData.category,
            quantity: nodeData.quantity || 2,
            x: nodeData.x,
            y: nodeData.y
        };
        
        workflowNodes.push(restoredNode);
        
        // 创建DOM元素
        const nodeElement = document.createElement('div');
        nodeElement.className = 'workflow-node';
        nodeElement.id = restoredNode.id;
        nodeElement.style.left = `${restoredNode.x}px`;
        nodeElement.style.top = `${restoredNode.y}px`;
        
        const displayName = restoredNode.modelName.length > 20 ? 
            restoredNode.modelName.substring(0, 20) + '...' : restoredNode.modelName;
        
        nodeElement.innerHTML = `
            <div class="node-header">
                <div class="node-title" title="${restoredNode.modelName}">${displayName}</div>
            </div>
            <div class="node-category">${restoredNode.category}</div>
            <div class="node-tokens">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m21 12-6-3-6 3-6-3"/>
                </svg>
                ${restoredNode.quantity} API calls
            </div>
        `;
        
        // 添加连接点
        const leftPoint = document.createElement('div');
        leftPoint.className = 'connection-point left';
        leftPoint.dataset.node = restoredNode.id;
        leftPoint.dataset.type = 'left';
        
        const rightPoint = document.createElement('div');
        rightPoint.className = 'connection-point right';
        rightPoint.dataset.node = restoredNode.id;
        rightPoint.dataset.type = 'right';
        
        nodeElement.appendChild(leftPoint);
        nodeElement.appendChild(rightPoint);
        
        setupNodeDragging(nodeElement, restoredNode);
        setupConnectionPoints(nodeElement, restoredNode);
        
        document.getElementById('workflowNodes').appendChild(nodeElement);
        
        // 更新计数器
        const nodeNumber = parseInt(restoredNode.id.split('-')[1]);
        if (nodeNumber > nodeIdCounter) {
            nodeIdCounter = nodeNumber;
        }
    });
    updateWorkspaceSize();
    
    // 恢复连接
    if (workflowData.connections) {
        setTimeout(() => {
            workflowData.connections.forEach(connectionData => {
                connections.push(connectionData);
                drawConnection(connectionData);
                
                const connectionNumber = parseInt(connectionData.id.split('-')[1]);
                if (connectionNumber > connectionIdCounter) {
                    connectionIdCounter = connectionNumber;
                }
            });
            updateWorkspaceSize();
        }, 100);
    }
    
    console.log('Workflow restored successfully');
}

// Setup canvas selection functionality
function setupCanvasSelection() {
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    let longPressTimer = null;
    
    canvasWorkspace.addEventListener('mousedown', (e) => {
        // Only handle if not clicking on nodes, connection points, or during connection
        if (e.target.closest('.workflow-node') || 
            e.target.closest('.connection-point') || 
            isConnecting || 
            draggedModel) {
        return;
    }
    
        const canvasRect = canvasWorkspace.getBoundingClientRect();
        selectionStart = {
            x: e.clientX - canvasRect.left,
            y: e.clientY - canvasRect.top
        };
        
        // Start long press timer for selection
        longPressTimer = setTimeout(() => {
            // Start selection immediately when long press is detected
            startSelection(e);
        }, 150); // 150ms long press for selection - faster response
        
    e.preventDefault();
    });
    
    canvasWorkspace.addEventListener('mousemove', (e) => {
        // If long press timer is active and we're dragging, start selection immediately
        if (longPressTimer) {
            const canvasRect = canvasWorkspace.getBoundingClientRect();
            const currentX = e.clientX - canvasRect.left;
            const currentY = e.clientY - canvasRect.top;
            const distance = Math.sqrt(
                Math.pow(currentX - selectionStart.x, 2) + 
                Math.pow(currentY - selectionStart.y, 2)
            );
            
            // If dragging while holding down, start selection immediately
            if (distance > 5) { // 5px threshold
                clearTimeout(longPressTimer);
                longPressTimer = null;
                // Start selection immediately when dragging during long press
                if (!isSelecting) {
                    startSelection(e);
                }
            }
        }
        
        // Update selection box if selecting
        if (isSelecting) {
            updateSelectionBox(e);
        }
    });
    
    canvasWorkspace.addEventListener('mouseup', (e) => {
        // Clear long press timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        // End selection if selecting
        if (isSelecting) {
            endSelection();
        }
    });
}
    
    // Start selection box
function startSelection(event) {
    console.log('📦 Starting selection box');
    
    isSelecting = true;
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    
    // Create selection box element
    selectionBox = document.createElement('div');
    selectionBox.className = 'selection-box';
    selectionBox.style.left = `${selectionStart.x}px`;
    selectionBox.style.top = `${selectionStart.y}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    
    canvasWorkspace.appendChild(selectionBox);
    
    // If we're starting due to drag, immediately update the box size
    if (event) {
        updateSelectionBox(event);
    }
    
    // Add global mouse move and up listeners
    document.addEventListener('mousemove', updateSelectionBox);
    document.addEventListener('mouseup', endSelection);
}

// Update selection box
function updateSelectionBox(event) {
    if (!isSelecting || !selectionBox) return;
    
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    const canvasRect = canvasWorkspace.getBoundingClientRect();
    const currentX = event.clientX - canvasRect.left;
    const currentY = event.clientY - canvasRect.top;
    
    const left = Math.min(selectionStart.x, currentX);
    const top = Math.min(selectionStart.y, currentY);
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    
    selectionBox.style.left = `${left}px`;
    selectionBox.style.top = `${top}px`;
    selectionBox.style.width = `${width}px`;
    selectionBox.style.height = `${height}px`;
    
    // Preview selection
    previewSelection(left, top, width, height);
}

// Preview selection
function previewSelection(left, top, width, height) {
    const selectionRect = { left, top, right: left + width, bottom: top + height };
    
    // Preview nodes
    workflowNodes.forEach(node => {
        const nodeElement = document.getElementById(node.id);
        if (nodeElement && isNodeInSelection(nodeElement, selectionRect)) {
            nodeElement.classList.add('selection-preview');
        } else if (nodeElement) {
            nodeElement.classList.remove('selection-preview');
        }
    });
    
    // Preview connections
    connections.forEach(connection => {
        const lineElement = document.getElementById(connection.id);
        if (lineElement && isConnectionInSelection(connection, selectionRect)) {
            lineElement.classList.add('selection-preview');
        } else if (lineElement) {
            lineElement.classList.remove('selection-preview');
        }
    });
}

// Check if node is in selection
function isNodeInSelection(nodeElement, selectionRect) {
        const nodeRect = nodeElement.getBoundingClientRect();
    const canvasRect = document.getElementById('canvasWorkspace').getBoundingClientRect();
        
        const nodeRelativeRect = {
            left: nodeRect.left - canvasRect.left,
            top: nodeRect.top - canvasRect.top,
            right: nodeRect.right - canvasRect.left,
            bottom: nodeRect.bottom - canvasRect.top
        };
        
    return !(selectionRect.right < nodeRelativeRect.left || 
             selectionRect.left > nodeRelativeRect.right || 
             selectionRect.bottom < nodeRelativeRect.top || 
             selectionRect.top > nodeRelativeRect.bottom);
}

// Check if connection is in selection
function isConnectionInSelection(connection, selectionRect) {
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return false;
    
    const fromPoint = fromNode.querySelector(`.connection-point.${connection.from.type}`);
    const toPoint = toNode.querySelector(`.connection-point.${connection.to.type}`);
    
    if (!fromPoint || !toPoint) return false;
    
    const canvasRect = document.getElementById('canvasWorkspace').getBoundingClientRect();
    
    const fromRect = fromPoint.getBoundingClientRect();
    const toRect = toPoint.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const toX = toRect.left + toRect.width / 2 - canvasRect.left;
    const toY = toRect.top + toRect.height / 2 - canvasRect.top;
    
    // Check if line intersects selection box
    const centerX = (fromX + toX) / 2;
    const centerY = (fromY + toY) / 2;
    
    return centerX >= selectionRect.left && centerX <= selectionRect.right &&
           centerY >= selectionRect.top && centerY <= selectionRect.bottom;
}

// End selection
function endSelection() {
    if (!isSelecting) return;
    
    console.log('📦 Ending selection');
    
    // Clear previous selection
    clearSelection();
    
    // Finalize selection
    document.querySelectorAll('.selection-preview').forEach(element => {
        if (element.classList.contains('workflow-node')) {
            selectedNodes.add(element.id);
            element.classList.remove('selection-preview');
            element.classList.add('selected');
        } else if (element.classList.contains('connection-line')) {
            selectedConnections.add(element.id);
            element.classList.remove('selection-preview');
            element.classList.add('selected');
        }
    });
    
    // Remove selection box
    if (selectionBox) {
        selectionBox.remove();
        selectionBox = null;
    }
    
    // Reset state
    isSelecting = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', updateSelectionBox);
    document.removeEventListener('mouseup', endSelection);
    
    console.log(`✅ Selected ${selectedNodes.size} nodes and ${selectedConnections.size} connections`);
}

// Clear selection
function clearSelection() {
    selectedNodes.forEach(nodeId => {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.classList.remove('selected', 'selection-preview');
        }
    });
    selectedNodes.clear();
    
    selectedConnections.forEach(connectionId => {
        const lineElement = document.getElementById(connectionId);
        if (lineElement) {
            lineElement.classList.remove('selected', 'selection-preview');
        }
    });
    selectedConnections.clear();
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (selectedNodes.size > 0 || selectedConnections.size > 0) {
                deleteSelectedElements();
                e.preventDefault();
            }
        }
        
        if (e.key === 'Escape') {
            clearSelection();
            if (isSelecting) {
                endSelection();
            }
            // Cancel connection if connecting
            if (isConnecting) {
                cancelConnection();
            }
        }
    });
}

// Delete selected elements
function deleteSelectedElements() {
    if (selectedNodes.size === 0 && selectedConnections.size === 0) return;
    
    const nodeCount = selectedNodes.size;
    const connectionCount = selectedConnections.size;
    
    console.log(`🗑️ Deleting ${nodeCount} nodes and ${connectionCount} connections`);
    
    // Delete connections
    selectedConnections.forEach(connectionId => {
        const connectionIndex = connections.findIndex(c => c.id === connectionId);
        if (connectionIndex !== -1) {
            const lineElement = document.getElementById(connectionId);
            if (lineElement) lineElement.remove();
            connections.splice(connectionIndex, 1);
        }
    });
    
    // Delete nodes
    selectedNodes.forEach(nodeId => {
        // Remove node's connections
    const nodeConnections = connections.filter(c => 
        c.from.nodeId === nodeId || c.to.nodeId === nodeId
    );
    
        nodeConnections.forEach(connection => {
            const lineElement = document.getElementById(connection.id);
            if (lineElement) lineElement.remove();
            const connectionIndex = connections.findIndex(c => c.id === connection.id);
            if (connectionIndex !== -1) connections.splice(connectionIndex, 1);
        });
        
        // Remove node
    const nodeIndex = workflowNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) workflowNodes.splice(nodeIndex, 1);
    
    const nodeElement = document.getElementById(nodeId);
        if (nodeElement) nodeElement.remove();
    });
    
    // Clear selection
    clearSelection();
    
    console.log(`✅ Deleted ${nodeCount} nodes and ${connectionCount} connections`);
}

// Load models
function loadModels() {
    const modelsList = document.getElementById('modelsList');
    const modelsCount = document.getElementById('modelsCount');
    if (!modelsList || !modelsCount) {
        return;
    }

    const modelMap = new Map();

    function addModel(modelName, source = {}) {
        if (!modelName || modelMap.has(modelName)) return;
        const modelData = getModelData(modelName);
        if (!modelData && !source.category) {
            return;
        }
        modelMap.set(modelName, {
            modelName,
            type: source.type || 'TOKEN',
            category: source.category || (modelData ? modelData.category : 'AI Research'),
            quantity: Number(source.quantity || source.tokens || 2) || 2,
            purpose: source.purpose || (modelData ? modelData.purpose : ''),
            useCase: source.useCase || (modelData ? modelData.useCase : ''),
            tags: source.tags || `${modelData?.purpose || ''} ${modelData?.useCase || ''}`
        });
    }

    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        myAssets.tokens.forEach(token => {
            if (token.quantity > 0) {
                addModel(token.modelName, {
                    quantity: token.quantity,
                    category: token.category,
                    type: 'TOKEN'
                });
            }
        });
    } catch (error) {
        console.error('Error loading user models:', error);
    }

    try {
        const selectedWorkflowRaw = localStorage.getItem('selectedWorkflow') || localStorage.getItem('canvasWorkflow');
        if (selectedWorkflowRaw) {
            const selectedWorkflow = JSON.parse(selectedWorkflowRaw);
            (selectedWorkflow?.models || []).forEach(model => {
                addModel(model.name || model.modelName, {
                    quantity: model.tokens || model.calls || model.quantity || 2,
                    category: model.category,
                    type: 'WORKFLOW'
                });
            });
        }
    } catch (error) {
        console.warn('Unable to merge selected workflow models:', error);
    }

    if (modelMap.size === 0 && typeof MODEL_DATA === 'object') {
        Object.entries(MODEL_DATA)
            .slice(0, 250)
            .forEach(([modelName, data]) => {
                addModel(modelName, {
                    quantity: 2,
                    category: data.category,
                    purpose: data.purpose,
                    useCase: data.useCase,
                    tags: `${data.category} ${data.industry}`,
                    type: 'TOKEN'
                });
            });
    }

    sidebarModelsBase = Array.from(modelMap.values());
    renderSidebarModels(sidebarModelsBase);
    console.log(`✅ Loaded ${sidebarModelsBase.length} models into sidebar`);
}

// Create model element
function createModelElement(model) {
    const modelElement = document.createElement('div');
    modelElement.className = 'model-item';
    modelElement.draggable = true;
    
    const quantity = Number(model.quantity) || 2;
    modelElement.dataset.modelName = model.modelName;
    modelElement.dataset.modelType = model.type || 'TOKEN';
    modelElement.dataset.category = model.category || 'AI Research';
    modelElement.dataset.quantity = quantity;
    if (model.tags) {
        modelElement.dataset.tags = model.tags;
    }
    
    const displayName = model.modelName.length > 25 ? 
        model.modelName.substring(0, 25) + '...' : model.modelName;
    
    modelElement.innerHTML = `
        <div class="model-header">
            <div class="model-name" title="${model.modelName}">${displayName}</div>
            <div class="model-type">${model.type}</div>
            </div>
            <div class="model-category">${model.category || ''}</div>
        <div class="model-tokens">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
                </svg>
            ${quantity} API calls
        </div>
    `;
    
    modelElement.addEventListener('dragstart', handleDragStart);
    modelElement.addEventListener('dragend', handleDragEnd);
    
    return modelElement;
}

function renderSidebarModels(models, { filteredTerm = '' } = {}) {
    const modelsList = document.getElementById('modelsList');
    const modelsCount = document.getElementById('modelsCount');
    if (!modelsList || !modelsCount) {
        return;
    }

    modelsList.innerHTML = '';

    if (!models.length) {
        const empty = document.createElement('div');
        empty.className = 'models-empty-state';
        empty.textContent = filteredTerm
            ? `No models found for "${filteredTerm}".`
            : 'No models available yet.';
        modelsList.appendChild(empty);
    } else {
        models.forEach(model => {
            const modelElement = createModelElement(model);
            modelsList.appendChild(modelElement);
        });
    }

    const total = sidebarModelsBase.length || models.length;
    modelsCount.dataset.total = total;
    if (filteredTerm && filteredTerm.trim().length) {
        modelsCount.textContent = `${models.length} / ${total} models`;
    } else {
        modelsCount.textContent = `${total} models`;
    }
}

// Setup drag and drop
function setupDragAndDrop() {
    const canvasWorkspace = document.getElementById('canvasWorkspace');
    
    canvasWorkspace.addEventListener('dragover', handleDragOver);
    canvasWorkspace.addEventListener('dragenter', handleDragEnter);
    canvasWorkspace.addEventListener('dragleave', handleDragLeave);
    canvasWorkspace.addEventListener('drop', handleDrop);
    
    console.log('✅ Drag and drop setup complete');
}

// Drag handlers
function handleDragStart(e) {
    console.log('🚀 Drag started:', e.target.dataset.modelName);
    
    draggedModel = {
        name: e.target.dataset.modelName,
        type: e.target.dataset.modelType,
        category: e.target.dataset.category,
        quantity: e.target.dataset.quantity
    };
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    hideDropZone();
    draggedModel = null;
}

function handleDragOver(e) {
        e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(e) {
    e.preventDefault();
    if (draggedModel) {
        showDropZone();
    }
}

function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
        hideDropZone();
    }
}

function handleDrop(e) {
    e.preventDefault();
    hideDropZone();
    
    console.log('🎯 Drop event triggered');
    
    if (!draggedModel) return;
    
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, e.clientX - canvasRect.left - 140);
    const y = Math.max(10, e.clientY - canvasRect.top - 100);
    
        createWorkflowNode(draggedModel, x, y);
    draggedModel = null;
}

// Show/hide drop zone
function showDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.style.display = 'block';
        dropZone.classList.add('active');
    }
}

function hideDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.style.display = 'none';
        dropZone.classList.remove('active');
    }
}

// Create workflow node
function createWorkflowNode(model, x, y) {
    const nodeId = `node-${++nodeIdCounter}`;
    const quantity = Math.max(Number(model.quantity) || 1, 1);
    
    const nodeData = {
        id: nodeId,
        modelName: model.name,
        modelType: model.type,
        category: model.category,
        quantity,
        x: x,
        y: y
    };
    
    workflowNodes.push(nodeData);
    
    const nodeElement = document.createElement('div');
    nodeElement.className = 'workflow-node appear';
    nodeElement.id = nodeId;
    nodeElement.style.left = `${x}px`;
    nodeElement.style.top = `${y}px`;
    
    const displayName = model.name.length > 20 ? 
        model.name.substring(0, 20) + '...' : model.name;
    
    nodeElement.innerHTML = `
        <div class="node-header">
            <div class="node-title" title="${model.name}">${displayName}</div>
            <div class="node-actions">
                <button type="button" class="node-control node-config" title="Configure">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                </button>
                <button type="button" class="node-control node-delete" title="Remove">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="node-category">${model.category}</div>
        <div class="node-tokens">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
                <path d="m21 12-6-3-6 3-6-3"/>
            </svg>
            ${quantity} API calls
        </div>
    `;
    
    // Add connection points after creating the main content
    const leftPoint = document.createElement('div');
    leftPoint.className = 'connection-point left';
    leftPoint.dataset.node = nodeId;
    leftPoint.dataset.type = 'left';
    leftPoint.title = 'Click to start connection (ESC to cancel)';
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'connection-point right';
    rightPoint.dataset.node = nodeId;
    rightPoint.dataset.type = 'right';
    rightPoint.title = 'Click to start connection (ESC to cancel)';
    
    nodeElement.appendChild(leftPoint);
    nodeElement.appendChild(rightPoint);
    
    setupNodeDragging(nodeElement, nodeData);
    setupConnectionPoints(nodeElement, nodeData);
    
    const configBtn = nodeElement.querySelector('.node-config');
    if (configBtn) {
        configBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            configureNode(nodeId);
        });
    }
    
    const deleteBtn = nodeElement.querySelector('.node-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteNode(nodeId);
        });
    }
    
    const workflowNodesContainer = document.getElementById('workflowNodes');
    workflowNodesContainer.appendChild(nodeElement);
    
    console.log('✅ Created workflow node:', nodeData);
    updateWorkspaceSize();
}



// Setup connection points functionality
function setupConnectionPoints(nodeElement, nodeData) {
    const connectionPoints = nodeElement.querySelectorAll('.connection-point');
    
    connectionPoints.forEach(point => {
        // Click to start connection
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (isConnecting) {
                // If already connecting, end the connection
                endConnection(point);
    } else {
                // Start new connection
                startConnection(point, e);
            }
        });
        
        // Mouse enter - highlight as target during connection
        point.addEventListener('mouseenter', () => {
            if (isConnecting && point !== connectionStart.element) {
                point.classList.add('target');
                // Auto-connect when hovering over target point
                setTimeout(() => {
                    if (point.classList.contains('target')) {
                        endConnection(point);
                    }
                }, 200); // 200ms delay for auto-connect
            }
        });
        
        // Mouse leave - remove target highlight
        point.addEventListener('mouseleave', () => {
            point.classList.remove('target');
        });
    });
}

// Start connection from a point
function startConnection(point, event) {
    console.log('🔗 Starting connection from:', point.dataset.node, point.dataset.type);
    
    isConnecting = true;
    connectionStart = {
        element: point,
        nodeId: point.dataset.node,
        type: point.dataset.type
    };
    
    point.classList.add('connecting');
    
    // Show connection mode indicator
    showConnectionModeIndicator();
    
    // Create temporary line
    createTemporaryLine(point, event);
    
    // Add global mouse move listener
    document.addEventListener('mousemove', updateTemporaryLine);
    document.addEventListener('mouseup', cancelConnection);
}

// End connection at a point
function endConnection(targetPoint) {
    if (!isConnecting || !connectionStart) return;
    
    const startNodeId = connectionStart.nodeId;
            const targetNodeId = targetPoint.dataset.node;
    
    // Don't connect to the same node
    if (startNodeId !== targetNodeId) {
        createNodeConnection(connectionStart, {
            element: targetPoint,
                    nodeId: targetNodeId, 
            type: targetPoint.dataset.type
        });
        console.log('✅ Connection created:', startNodeId, '→', targetNodeId);
    }
    
    cancelConnection();
}

// Cancel connection
function cancelConnection() {
    if (!isConnecting) return;
    
    // Remove temporary line
    if (temporaryLine) {
        temporaryLine.remove();
        temporaryLine = null;
    }
    
    // Remove connecting class
    if (connectionStart && connectionStart.element) {
        connectionStart.element.classList.remove('connecting');
    }
    
    // Remove target highlights
    document.querySelectorAll('.connection-point.target').forEach(point => {
        point.classList.remove('target');
    });
    
    // Reset state
    isConnecting = false;
    connectionStart = null;
    
    // Remove global listeners
    document.removeEventListener('mousemove', updateTemporaryLine);
    document.removeEventListener('mouseup', cancelConnection);
    
    console.log('🚫 Connection cancelled');
    
    // Hide connection mode indicator
    hideConnectionModeIndicator();
}

// Show connection mode indicator
function showConnectionModeIndicator() {
    let indicator = document.getElementById('connectionModeIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'connectionModeIndicator';
        indicator.className = 'connection-mode-indicator';
        indicator.innerHTML = `
            <div class="indicator-content">
                <span class="indicator-icon">🔗</span>
                <span class="indicator-text">Connection Mode - Click another point or press ESC to cancel</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    indicator.style.display = 'block';
}

// Hide connection mode indicator
function hideConnectionModeIndicator() {
    const indicator = document.getElementById('connectionModeIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Create temporary line during connection
function createTemporaryLine(startPoint, event) {
    const svg = document.getElementById('connectionsSvg');
    const connectionsGroup = document.getElementById('connectionsGroup');
    
    const startRect = startPoint.getBoundingClientRect();
    const canvasRect = svg.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width / 2 - canvasRect.left;
    const startY = startRect.top + startRect.height / 2 - canvasRect.top;
    const endX = event.clientX - canvasRect.left;
    const endY = event.clientY - canvasRect.top;
    
    temporaryLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    temporaryLine.setAttribute('class', 'connection-line temporary');
    temporaryLine.setAttribute('marker-end', 'url(#arrowhead)');
    
    const path = createCurvedPath(startX, startY, endX, endY);
    temporaryLine.setAttribute('d', path);
    
    connectionsGroup.appendChild(temporaryLine);
}

// Update temporary line position
function updateTemporaryLine(event) {
    if (!temporaryLine || !connectionStart) return;
    
    const svg = document.getElementById('connectionsSvg');
    const startPoint = connectionStart.element;
    
    const startRect = startPoint.getBoundingClientRect();
    const canvasRect = svg.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width / 2 - canvasRect.left;
    const startY = startRect.top + startRect.height / 2 - canvasRect.top;
    const endX = event.clientX - canvasRect.left;
    const endY = event.clientY - canvasRect.top;
    
    const path = createCurvedPath(startX, startY, endX, endY);
    temporaryLine.setAttribute('d', path);
}

// Create curved path for connections
function createCurvedPath(startX, startY, endX, endY) {
    const midX = (startX + endX) / 2;
    const controlOffset = Math.abs(endX - startX) * 0.3;
    
    return `M ${startX} ${startY} Q ${startX + controlOffset} ${startY} ${midX} ${(startY + endY) / 2} Q ${endX - controlOffset} ${endY} ${endX} ${endY}`;
}

// Create actual connection between nodes
function createNodeConnection(start, end) {
    const connectionId = `connection-${++connectionIdCounter}`;
    
    // Check for duplicate connections
    const exists = connections.find(conn => 
        (conn.from.nodeId === start.nodeId && conn.to.nodeId === end.nodeId) ||
        (conn.from.nodeId === end.nodeId && conn.to.nodeId === start.nodeId)
    );
    
    if (exists) {
        console.log('⚠️ Connection already exists');
        return;
    }
    
    const connection = {
        id: connectionId,
        from: start,
        to: end
    };
    
    connections.push(connection);
    drawConnection(connection);
    
    // Update priorities when new connection is created
    updateAllPriorities();
}

// Draw permanent connection line
function drawConnection(connection) {
    const svg = document.getElementById('connectionsSvg');
    const connectionsGroup = document.getElementById('connectionsGroup');
    
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('id', connection.id);
    line.setAttribute('class', 'connection-line');
    line.setAttribute('marker-end', 'url(#arrowhead)');
    
    // Calculate and set path
    updateConnectionPath(connection, line);
    
    // Add click handler for selection
    line.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔗 Selected connection:', connection.id);
    });
    
    connectionsGroup.appendChild(line);
}

// Update connection path
function updateConnectionPath(connection, line) {
    const fromNode = document.getElementById(connection.from.nodeId);
    const toNode = document.getElementById(connection.to.nodeId);
    
    if (!fromNode || !toNode) return;
    
    const svg = document.getElementById('connectionsSvg');
    const canvasRect = svg.getBoundingClientRect();
    
    // Get connection points
    const fromPoint = fromNode.querySelector(`.connection-point.${connection.from.type}`);
    const toPoint = toNode.querySelector(`.connection-point.${connection.to.type}`);
    
    if (!fromPoint || !toPoint) return;
    
    const fromRect = fromPoint.getBoundingClientRect();
    const toRect = toPoint.getBoundingClientRect();
    
    const fromX = fromRect.left + fromRect.width / 2 - canvasRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - canvasRect.top;
    const toX = toRect.left + toRect.width / 2 - canvasRect.left;
    const toY = toRect.top + toRect.height / 2 - canvasRect.top;
    
    const path = createCurvedPath(fromX, fromY, toX, toY);
    line.setAttribute('d', path);
}

// Update all connections when nodes move
function updateAllConnections() {
    connections.forEach(connection => {
        const line = document.getElementById(connection.id);
        if (line) {
            updateConnectionPath(connection, line);
        }
    });
}

function updateWorkspaceSize() {
    const workspace = document.getElementById('canvasWorkspace');
    const nodesContainer = document.getElementById('workflowNodes');
    const connectionsSvg = document.getElementById('connectionsSvg');
    if (!workspace || !nodesContainer || !connectionsSvg) {
        return;
    }

    let maxX = 0;
    let maxY = 0;
    workflowNodes.forEach(node => {
        maxX = Math.max(maxX, (Number(node.x) || 0) + NODE_WIDTH);
        maxY = Math.max(maxY, (Number(node.y) || 0) + NODE_HEIGHT);
    });

    const desiredWidth = Math.max(workspace.clientWidth, maxX + WORKSPACE_PADDING);
    const desiredHeight = Math.max(workspace.clientHeight, maxY + WORKSPACE_PADDING);

    nodesContainer.style.width = `${desiredWidth}px`;
    nodesContainer.style.height = `${desiredHeight}px`;

    connectionsSvg.setAttribute('width', desiredWidth);
    connectionsSvg.setAttribute('height', desiredHeight);
    connectionsSvg.style.width = `${desiredWidth}px`;
    connectionsSvg.style.height = `${desiredHeight}px`;
}

// Update all node priorities based on position
function updateAllPriorities() {
    // This function can be used to update execution order based on node positions
    // For now, it's a placeholder for future functionality
    console.log('🔄 Updated node priorities');
}

// Setup node dragging
function setupNodeDragging(nodeElement, nodeData) {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let nodeStart = { x: 0, y: 0 };
    
    nodeElement.addEventListener('mousedown', (e) => {
        if (e.target.closest('.node-control')) return;
        
            isDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
            nodeStart = { x: nodeData.x, y: nodeData.y };
            
            nodeElement.classList.add('dragging');
            
            document.addEventListener('mousemove', handleNodeDrag);
            document.addEventListener('mouseup', handleNodeDragEnd);
        
        e.preventDefault();
    });
    
    function handleNodeDrag(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        nodeData.x = Math.max(0, nodeStart.x + deltaX);
        nodeData.y = Math.max(0, nodeStart.y + deltaY);
        
        nodeElement.style.left = `${nodeData.x}px`;
        nodeElement.style.top = `${nodeData.y}px`;
        
        updateWorkspaceSize();
        // Update connections when node moves
        updateAllConnections();
        
        // Update priorities when node position changes
        updateAllPriorities();
    }
    
    function handleNodeDragEnd() {
        isDragging = false;
        nodeElement.classList.remove('dragging');
        
        document.removeEventListener('mousemove', handleNodeDrag);
        document.removeEventListener('mouseup', handleNodeDragEnd);
        updateWorkspaceSize();
    }
}

// UI Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

function filterModels() {
    const searchInput = document.getElementById('modelSearch');
    const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

    if (!searchTerm) {
        renderSidebarModels(sidebarModelsBase);
        return;
    }

    const primaryMatches = sidebarModelsBase.filter(model => {
        const bucket = [
            model.modelName,
            model.category,
            model.type,
            model.purpose,
            model.useCase,
            model.tags
        ].join(' ').toLowerCase();
        return bucket.includes(searchTerm);
    });

    if (primaryMatches.length) {
        renderSidebarModels(primaryMatches, { filteredTerm: searchTerm });
        return;
    }

    // Fallback: search the full model catalog
    if (typeof MODEL_DATA === 'object' && MODEL_DATA) {
        const fallbackMatches = [];
        Object.entries(MODEL_DATA).some(([name, data]) => {
            const bucket = [
                name,
                data?.category,
                data?.industry,
                data?.purpose,
                data?.useCase
            ].join(' ').toLowerCase();
            if (bucket.includes(searchTerm)) {
                fallbackMatches.push({
                    modelName: name,
                    type: 'TOKEN',
                    category: data?.category || 'AI Research',
                    quantity: 2,
                    purpose: data?.purpose || '',
                    useCase: data?.useCase || '',
                    tags: `${data?.category || ''} ${data?.industry || ''}`
                });
            }
            return fallbackMatches.length >= 40;
        });
        renderSidebarModels(fallbackMatches, { filteredTerm: searchTerm });
        return;
    }

    renderSidebarModels([], { filteredTerm: searchTerm });
}

function clearCanvas() {
    if (workflowNodes.length === 0) return;
    
    if (confirm('Clear entire canvas? This cannot be undone.')) {
        workflowNodes.forEach(node => {
            const nodeElement = document.getElementById(node.id);
            if (nodeElement) nodeElement.remove();
        });
        
        // Clear connections
        connections.forEach(connection => {
            const lineElement = document.getElementById(connection.id);
            if (lineElement) lineElement.remove();
        });
        
        workflowNodes = [];
        connections = [];
        nodeIdCounter = 0;
        connectionIdCounter = 0;
        
        // Reset button states
        document.getElementById('saveRunBtn').style.display = 'flex';
        document.getElementById('runBtn').style.display = 'none';
        
        // Clear workflow data
        localStorage.removeItem('currentWorkflow');
        
        console.log('🧹 Canvas cleared');
        updateWorkspaceSize();
    }
}

function saveWorkflow() {
    const workflow = {
        nodes: workflowNodes,
        connections: connections,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('savedWorkflow', JSON.stringify(workflow));
    localStorage.setItem('canvasWorkflow', JSON.stringify(workflow)); // 双重保存
    alert('✅ Workflow saved successfully!');
    console.log('💾 Workflow saved:', workflow);
}

/**
 * Run workflow - 支持两种支付模式
 */
function runWorkflow() {
    if (!workflowNodes || workflowNodes.length === 0) {
        alert('⚠️ Please add at least one model to the Canvas first.');
        return;
    }

    // 显示支付方式选择对话框
    const choice = confirm(
        `Choose payment method for your canvas workflow:\n\n` +
        `OK = Prepay once (single transaction for all nodes)\n` +
        `Cancel = Pay per node (separate transaction for each node)`
    );

    if (choice) {
        // 预付费模式 - 新增功能
        purchaseAndPrepayCanvasWorkflow();
    } else {
        // 按节点付费模式 - 保留原有逻辑
        const workflowName = prompt('Enter workflow name:', 'Canvas Workflow');
        if (!workflowName) return;
        
        const workflowDescription = prompt('Enter workflow description (optional):', '');
        
        executeCanvasWorkflow({
            workflowName,
            workflowDescription,
            prepay: false  // 明确标记不是预付费
        });
    }
}

function configureNode(nodeId) {
    const node = workflowNodes.find(n => n.id === nodeId);
    if (node) {
        alert(`⚙️ Configure ${node.modelName}\n\nThis feature allows you to set model parameters and options.`);
    }
}

function deleteNode(nodeId) {
    if (!nodeId) return;
    if (!confirm('Delete this node?')) {
        return;
    }

    const nodeIndex = workflowNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex !== -1) {
        workflowNodes.splice(nodeIndex, 1);
    }

    const nodeElement = document.getElementById(nodeId);
    if (nodeElement) {
        nodeElement.remove();
    }

    selectedNodes.delete(nodeId);

    const removedConnections = connections.filter(conn => conn.from.nodeId === nodeId || conn.to.nodeId === nodeId);
    if (removedConnections.length) {
        removedConnections.forEach(conn => {
            const line = document.getElementById(conn.id);
            if (line) line.remove();
        });
    }
    connections = connections.filter(conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId);

    clearSelection();
    updateAllConnections();
    updateWorkspaceSize();

    console.log('🗑️ Node deleted:', nodeId);
}

// Modal functions
function showSaveRunModal() {
    if (workflowNodes.length === 0) {
        alert('⚠️ Please add some models to create a workflow first.');
        return;
    }
    
    const modal = document.getElementById('saveRunModal');
    modal.classList.add('show');
    
    // Focus on the first input
    setTimeout(() => {
        document.getElementById('workflowName').focus();
    }, 100);
}

function hideSaveRunModal() {
    const modal = document.getElementById('saveRunModal');
    if (modal) modal.classList.remove('show');
    
    // Clear form
    const nameInput = document.getElementById('workflowName');
    if (nameInput) nameInput.value = '';
    
    const descInput = document.getElementById('workflowDescription');
    if (descInput) descInput.value = '';
    
    // 这行是给 MyAssets 那边复用的代码，Canvas 里没这个元素就直接忽略
    const visibilityPublic = document.getElementById('visibilityPublic');
    if (visibilityPublic) {
        visibilityPublic.checked = true;
    }
}

function saveAndRunWorkflow() {
    console.log('💾 [Canvas] Save and Run workflow');
    
    const workflowName = document.getElementById('workflowName').value.trim();
    const workflowDescription = document.getElementById('workflowDescription').value.trim();
    
    if (!workflowName) {
        alert('Please enter a workflow name.');
        return;
    }
    
    if (!workflowNodes || workflowNodes.length === 0) {
        alert('⚠️ Please add at least one model to the Canvas first.');
        return;
    }

    console.log(`📝 [Canvas] Saving workflow: ${workflowName}`);
    
    // 1. 收集模型列表
    const modelsList = workflowNodes.map(node => node.modelName);
    const modelsUsed = modelsList.length > 0 ? `${modelsList.join(', ')} (${modelsList.length} models)` : 'None';
    
    const workflowId = 'workflow_' + Date.now();
    
    // 2. 保存完整的工作流数据到 myWorkflows (显示在MyAssets页面)
    const completeWorkflowData = {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        visibility: 'private',
        models: modelsList,
        modelsUsed: modelsUsed,
        modelCount: modelsList.length,
        nodes: workflowNodes.map(node => ({
            id: node.id,
            modelName: node.modelName,
            modelType: node.modelType,
            category: node.category,
            quantity: node.quantity,
            x: node.x,
            y: node.y
        })),
        connections: connections.map(conn => ({
            id: conn.id,
            from: { nodeId: conn.from.nodeId, type: conn.from.type },
            to: { nodeId: conn.to.nodeId, type: conn.to.type }
        })),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: 'RUNNING'
    };
    
    // 3. 保存到 myWorkflows
    let myWorkflows = JSON.parse(localStorage.getItem('myWorkflows') || '[]');
    myWorkflows.push(completeWorkflowData);
    localStorage.setItem('myWorkflows', JSON.stringify(myWorkflows));
    console.log('✅ [Canvas] Saved to myWorkflows');
    
    // 4. 关闭弹窗
    hideSaveRunModal();
    
    // 5. 执行workflow：走预付费分支，触发 X402 支付
    executeCanvasWorkflow({
        workflowId: workflowId,
        workflowName: workflowName,
        workflowDescription: workflowDescription,
        prepay: true
    });
}

// Load workflow to canvas
function loadWorkflowToCanvas(workflow) {
    console.log('🔄 Loading workflow to canvas:', workflow.name);
    
    // Force clear existing nodes without confirmation
    workflowNodes.forEach(node => {
        const nodeElement = document.getElementById(node.id);
        if (nodeElement) nodeElement.remove();
    });
    
    // Clear connections
    connections.forEach(connection => {
        const lineElement = document.getElementById(connection.id);
        if (lineElement) lineElement.remove();
    });
    
    workflowNodes = [];
    connections = [];
    nodeIdCounter = 0;
    connectionIdCounter = 0;
    
    // Create nodes for each model in the workflow
    let xOffset = 100;
    workflow.models.forEach((model, index) => {
        // Find the model in our model data
        const modelData = findModelByName(model.name);
        if (modelData) {
            const quantity = Math.max(
                Number(model.tokens || model.calls || model.quantity || modelData.quantity || 1) || 1,
                1
            );
            createWorkflowNode(
                {
                    ...modelData,
                    quantity
                },
                xOffset,
                200
            );
            xOffset += 350; // Space between nodes
        }
    });
    
    updateWorkspaceSize();
    // Connect nodes sequentially
    setTimeout(() => {
        connectWorkflowNodes();
        updateWorkspaceSize();
    }, 500);
    
    // Show Run button and hide Save and Run button
    document.getElementById('saveRunBtn').style.display = 'none';
    document.getElementById('runBtn').style.display = 'flex';
    
    // Store workflow data - preserve prepaid fields from input workflow
    localStorage.setItem('currentWorkflow', JSON.stringify({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: 'running',
        // ✅ 关键修复：保留预付费相关字段
        prepaid: !!workflow.prepaid,
        prepaidAt: workflow.prepaidAt || null,
        prepaidAmountUsdc: workflow.prepaidAmountUsdc || null,
        prepaidModels: workflow.prepaidModels || null,
        lastPaymentTx: workflow.lastPaymentTx || null,
        lastPaymentExplorer: workflow.lastPaymentExplorer || null,
        lastPaymentAt: workflow.lastPaymentAt || null,
        lastPaymentMemo: workflow.lastPaymentMemo || null,
        workflowSessionId: workflow.workflowSessionId || null
    }));
    
    console.log('✅ Workflow loaded successfully');
}

// Find model by name
function findModelByName(name) {
    // Use model-data.js to get real model information
    const modelData = getModelData(name);
    if (modelData) {
        return {
            name: name,
            type: modelData.category,
            category: modelData.category,
            quantity: 2, // Default quantity
            purpose: modelData.purpose,
            useCase: modelData.useCase,
            industry: modelData.industry,
            rating: modelData.rating,
            tokenPrice: modelData.tokenPrice,
            sharePrice: modelData.sharePrice
        };
    }
    
    // Fallback for models not in model-data.js
    return {
        name: name,
        type: 'AI Model',
        category: 'AI Research',
        quantity: 2
    };
}

// Connect workflow nodes sequentially
function connectWorkflowNodes() {
    const nodes = document.querySelectorAll('.workflow-node');
    
    for (let i = 0; i < nodes.length - 1; i++) {
        const currentNode = nodes[i];
        const nextNode = nodes[i + 1];
        
        const currentRightPoint = currentNode.querySelector('.connection-point.right');
        const nextLeftPoint = nextNode.querySelector('.connection-point.left');
        
        if (currentRightPoint && nextLeftPoint) {
            // Create connection between nodes
            const start = {
                element: currentRightPoint,
                nodeId: currentRightPoint.dataset.node,
                type: 'right'
            };
            
            const end = {
                element: nextLeftPoint,
                nodeId: nextLeftPoint.dataset.node,
                type: 'left'
            };
            
            createNodeConnection(start, end);
        }
    }
}

function computeExecutionPlan() {
    if (!workflowNodes.length) {
        return {
            orderedNodes: [],
            sequenceNames: [],
            edges: []
        };
    }

    const nodes = workflowNodes.map(node => ({
        ...node,
        x: Number(node.x) || 0
    }));
    const nodesById = new Map(nodes.map(n => [n.id, n]));
    const validIds = new Set(nodes.map(n => n.id));

    const edges = connections
        .filter(conn => validIds.has(conn.from.nodeId) && validIds.has(conn.to.nodeId) && conn.from.nodeId !== conn.to.nodeId)
        .map(conn => ({ from: conn.from.nodeId, to: conn.to.nodeId }));

    const inDegree = new Map();
    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(edge => inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1));

    const adjacency = new Map();
    nodes.forEach(n => adjacency.set(n.id, []));
    edges.forEach(edge => {
        adjacency.get(edge.from).push(edge.to);
    });

    const compareNodes = (a, b) => {
        if (a.x !== b.x) return a.x - b.x;
        return a.modelName.localeCompare(b.modelName);
    };
    const compareIds = (aId, bId) => {
        const a = nodesById.get(aId);
        const b = nodesById.get(bId);
        if (!a || !b) return 0;
        return compareNodes(a, b);
    };

    const ready = [];
    inDegree.forEach((deg, id) => {
        if (deg === 0) {
            ready.push(id);
        }
    });
    ready.sort(compareIds);

    const orderedIds = [];
    let processed = 0;

    while (ready.length) {
        const id = ready.shift();
        orderedIds.push(id);
        processed += 1;
        const neighbors = adjacency.get(id) || [];
        neighbors.forEach(nextId => {
            inDegree.set(nextId, (inDegree.get(nextId) || 0) - 1);
            if (inDegree.get(nextId) === 0) {
                ready.push(nextId);
                ready.sort(compareIds);
            }
        });
    }

    let finalIds = orderedIds;
    if (processed !== nodes.length) {
        console.warn('⚠️ Cycle detected; falling back to left→right order.');
        finalIds = [...nodes].sort(compareNodes).map(n => n.id);
    }

    const orderedNodes = finalIds.map(id => nodesById.get(id)).filter(Boolean);
    const sequenceNames = orderedNodes.map(node => node.modelName);

    return {
        orderedNodes,
        sequenceNames,
        edges
    };
}

function executeCanvasWorkflow({ workflowId, workflowName, workflowDescription, prepay } = {}) {
    const plan = computeExecutionPlan();
    if (!plan.orderedNodes.length) {
        alert('⚠️ Please add at least one model to the Canvas first.');
        return;
    }

    // 先统一算一份安全的 meta，后面普通运行和预付费共用
    const workflowNameSafe = workflowName || 'Canvas Workflow';
    const workflowIdSafe = workflowId || `canvas-${Date.now()}`;
    const descriptionSafe = workflowDescription || '';

    // === 如果选择预付费, 走预付费流程 ===
    if (prepay) {
        purchaseAndPrepayCanvasWorkflow({
            workflowId: workflowIdSafe,
            workflowName: workflowNameSafe,
            workflowDescription: descriptionSafe,
            plan              // 把刚算好的执行顺序也一起传进去，避免重复计算
        });
        return;
    }
    // =========================================
    const runId = `run-${Date.now()}`;
    let existingWorkflowMeta = {};
    try {
        existingWorkflowMeta = JSON.parse(localStorage.getItem('currentWorkflow') || '{}') || {};
    } catch (_) {
        existingWorkflowMeta = {};
    }

    const enrichedNodes = plan.orderedNodes.map(node => {
        const md = (typeof getModelData === 'function') ? getModelData(node.modelName) : null;
        return {
            id: node.id,
            name: node.modelName,
            category: node.category,
            quantity: Math.max(Number(node.quantity) || 1, 1),
            x: Number(node.x) || 0,
            y: Number(node.y) || 0,
            purpose: md?.purpose || '',
            useCase: md?.useCase || '',
            industry: md?.industry || ''
        };
    });

    const expertDetails = enrichedNodes.map(n => ({
        name: n.name,
        purpose: n.purpose,
        useCase: n.useCase,
        category: n.category,
        industry: n.industry
    }));

    const workflowRecord = {
        id: workflowIdSafe,
        name: workflowNameSafe,
        description: descriptionSafe,
        status: 'running',
        runId,
        startedAt: new Date().toISOString(),
        sequence: plan.sequenceNames,
        experts: plan.sequenceNames.slice(),
        expertDetails,
        graph: {
            nodes: enrichedNodes.map(n => ({
                id: n.id,
                name: n.name,
                category: n.category,
                x: n.x,
                y: n.y
            })),
            edges: plan.edges.map(edge => ({
                from: edge.from,
                to: edge.to
            }))
        },
        nodes: enrichedNodes,
        prepaid: !!existingWorkflowMeta.prepaid,
        prepaidAt: existingWorkflowMeta.prepaidAt || null,
        prepaidAmountUsdc: existingWorkflowMeta.prepaidAmountUsdc || null,
        prepaidModels: existingWorkflowMeta.prepaidModels || null,
        lastPaymentTx: existingWorkflowMeta.lastPaymentTx || null,
        lastPaymentExplorer: existingWorkflowMeta.lastPaymentExplorer || null,
        lastPaymentAt: existingWorkflowMeta.lastPaymentAt || null,
        lastPaymentMemo: existingWorkflowMeta.lastPaymentMemo || null
    };

    localStorage.removeItem('forcedModel');
    localStorage.setItem('currentWorkflow', JSON.stringify(workflowRecord));

    try {
        const snapshot = collectWorkflowData();
        if (snapshot) {
            localStorage.setItem('canvasWorkflow', JSON.stringify({
                ...snapshot,
                id: workflowIdSafe,
                name: workflowNameSafe,
                description: descriptionSafe,
                lastRunAt: workflowRecord.startedAt,
                prepaid: workflowRecord.prepaid,
                prepaidAt: workflowRecord.prepaidAt,
                prepaidAmountUsdc: workflowRecord.prepaidAmountUsdc,
                prepaidModels: workflowRecord.prepaidModels,
                lastPaymentTx: workflowRecord.lastPaymentTx,
                lastPaymentExplorer: workflowRecord.lastPaymentExplorer,
                lastPaymentAt: workflowRecord.lastPaymentAt,
                lastPaymentMemo: workflowRecord.lastPaymentMemo
            }));
        }
    } catch (err) {
        console.warn('Failed to persist canvas workflow snapshot:', err);
    }

    try { localStorage.setItem('autoRouter', 'off'); } catch (_) {}

    // 添加这段代码 - 确保跳转
    console.log('🎉 [Canvas] Workflow ready, redirecting to chat');
    alert(`🚀 Workflow "${workflowNameSafe}" is ready, redirecting to chat interface.`);
    
    setTimeout(() => {
        console.log('🔀 [Canvas] Redirecting to index.html');
        window.location.href = 'index.html';
    }, 500);
}

// Run selected workflow
function runSelectedWorkflow() {
    if (!workflowNodes.length) {
        alert('⚠️ Please load a workflow on the Canvas first.');
        return;
    }

    let storedWorkflow = {};
    const storedRaw = localStorage.getItem('currentWorkflow');
    if (storedRaw) {
        try {
            storedWorkflow = JSON.parse(storedRaw) || {};
        } catch (e) {
            console.error('Failed to parse currentWorkflow from localStorage:', e);
        }
    }

    const workflowId = storedWorkflow.id || `canvas-${Date.now()}`;
    const workflowName = storedWorkflow.name || 'Canvas Workflow';
    const workflowDescription = storedWorkflow.description || '';

    executeCanvasWorkflow({
        workflowId,
        workflowName,
        workflowDescription
    });
}

// 收集当前canvas上的workflow数据
function collectWorkflowData() {
    const models = [];
    const nodeData = [];
    
    workflowNodes.forEach((node, index) => {
        models.push(node.modelName);
        nodeData.push({
            id: node.id,
            modelName: node.modelName,
            x: node.x,
            y: node.y,
            index: index
        });
    });
    
    // 收集连接数据
    const connectionData = connections.map(conn => ({
        id: conn.id,
        from: conn.from,
        to: conn.to
    }));
    
    return {
        models: models,
        nodes: nodeData,
        connections: connectionData
    };
}

// 保存workflow到My Assets
function saveWorkflowToMyAssets(workflow) {
    try {
        let myWorkflows = JSON.parse(localStorage.getItem('myWorkflows')) || [];
        myWorkflows.push(workflow);
        localStorage.setItem('myWorkflows', JSON.stringify(myWorkflows));
        console.log('Workflow saved to My Assets:', workflow);
        return true;
    } catch (error) {
        console.error('Error saving workflow:', error);
        alert('Failed to save workflow. Please try again.');
        return false;
    }
}

// Export functions
window.toggleSidebar = toggleSidebar;
window.filterModels = filterModels;
window.clearCanvas = clearCanvas;
window.saveWorkflow = saveWorkflow;
window.runWorkflow = runWorkflow;
window.configureNode = configureNode;
window.deleteNode = deleteNode;
window.showSaveRunModal = showSaveRunModal;
window.hideSaveRunModal = hideSaveRunModal;
window.saveAndRunWorkflow = saveAndRunWorkflow;
window.runSelectedWorkflow = runSelectedWorkflow;
// === 新增导出 ===
window.purchaseAndPrepayCanvasWorkflow = purchaseAndPrepayCanvasWorkflow;
window.getConnectedWallet = getConnectedWallet;
// ================
function getCurrentCanvasModels() {
    return workflowNodes.map(node => node.modelName);
}
window.getCurrentCanvasModels = getCurrentCanvasModels;

console.log('✅ Canvas Workflow JavaScript loaded');
