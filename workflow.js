// Workflow Page JavaScript

const WORKFLOW_PRICING_DEFAULTS = (window.PricingUtils && window.PricingUtils.constants) || {
    currency: 'PHRS',
    pricePerApiCallUsdc: 0.0008,
    gasEstimatePerCallUsdc: 0.00025,
    sharePurchaseMinUsdc: 1,
    sharePurchaseMaxUsdc: 20,
    dailyCheckInRewardUsdc: 0.01
};

function workflowFormatUsdc(value, options = {}) {
    if (window.PricingUtils && typeof window.PricingUtils.formatUsdcAmount === 'function') {
        return window.PricingUtils.formatUsdcAmount(value, options);
    }
    const num = Number(value || 0);
    const min = options.minimumFractionDigits ?? 4;
    const max = options.maximumFractionDigits ?? 6;
    return `${num.toFixed(Math.min(Math.max(min, 0), max))} PHRS`;
}

function getWorkflowModelPricing(modelName) {
    const model = (typeof window.getModelData === 'function') ? window.getModelData(modelName) : null;
    if (window.PricingUtils && typeof window.PricingUtils.normalizeModelPricing === 'function') {
        return window.PricingUtils.normalizeModelPricing(model || {});
    }
    return {
        currency: WORKFLOW_PRICING_DEFAULTS.currency,
        pricePerCallUsdc: WORKFLOW_PRICING_DEFAULTS.pricePerApiCallUsdc,
        gasPerCallUsdc: WORKFLOW_PRICING_DEFAULTS.gasEstimatePerCallUsdc
    };
}

// Sample workflow data using real models from model-data.js
const workflows = [
    {
        id: 1,
        name: "AI Safety & Watermarking Pipeline",
        description: "Comprehensive AI safety workflow combining watermarking detection, safety evaluation, and content authenticity verification using state-of-the-art models.",
        category: "AI Safety",
        models: [
            { name: "AI-Text-Detector-Examiner", price: 9.8, tokens: 2 },
            { name: "SafeKey-Safety-Reasoner", price: 5.3, tokens: 1 },
            { name: "Invisible-Watermark-Remover", price: 9.5, tokens: 3 },
            { name: "Context-Watermarker", price: 5.0, tokens: 1 }
        ],
        totalPrice: 29.6,
        modelCount: 4,
        popularity: 95,
        createdAt: "2024-01-15"
    },
    {
        id: 2,
        name: "Content Generation & Analysis Suite",
        description: "Advanced content generation workflow with multimodal capabilities, including text generation, image processing, and creative content creation.",
        category: "Content Generation",
        models: [
            { name: "NVIDIA-Cosmos-World-Model", price: 9.8, tokens: 4 },
            { name: "SurfGen-3D-Shape-Generator", price: 6.8, tokens: 2 },
            { name: "InfoGAN-Disentangled-Representation", price: 7.4, tokens: 2 },
            { name: "TPU-GAN-Temporal-Point-Cloud", price: 6.8, tokens: 2 }
        ],
        totalPrice: 30.8,
        modelCount: 4,
        popularity: 88,
        createdAt: "2024-01-20"
    },
    {
        id: 3,
        name: "Medical AI Diagnosis Pipeline",
        description: "Comprehensive medical diagnosis workflow using advanced imaging analysis, clinical AI, and medical diagnosis models for healthcare applications.",
        category: "Healthcare",
        models: [
            { name: "Multi-Scale-PET-GCN", price: 7.4, tokens: 2 },
            { name: "Alzheimer-Hierarchical-Graph-PET", price: 9.5, tokens: 3 },
            { name: "Multi-Size-PET-Graph-CNN", price: 8.0, tokens: 2 },
            { name: "Unified-MRI-Neural-Operator", price: 3.8, tokens: 1 }
        ],
        totalPrice: 28.7,
        modelCount: 4,
        popularity: 92,
        createdAt: "2024-01-18"
    },
    {
        id: 4,
        name: "Computer Vision & Analysis Suite",
        description: "Advanced computer vision workflow combining multiple vision models for comprehensive image analysis, recognition, and processing.",
        category: "Computer Vision",
        models: [
            { name: "Activation-Sparsity-Shape-Bias-CNN", price: 9.8, tokens: 3 },
            { name: "Gabor-Wavelet-Image-Processor", price: 4.1, tokens: 1 },
            { name: "Bayesian-V1-Texture-Segmenter", price: 9.2, tokens: 2 },
            { name: "V1-Integration-Blackboard", price: 4.7, tokens: 1 }
        ],
        totalPrice: 27.8,
        modelCount: 4,
        popularity: 87,
        createdAt: "2024-01-22"
    },
    {
        id: 5,
        name: "Blockchain & Web3 AI Integration",
        description: "Innovative blockchain AI workflow combining smart contract development, game agents, and decentralized AI applications.",
        category: "Web3/Blockchain",
        models: [
            { name: "GameFi-Embodied-AI-Agent", price: 6.2, tokens: 2 },
            { name: "Smart-Contract-LLM-Pipeline", price: 4.1, tokens: 1 },
            { name: "PoL-Proof-of-Learning-Blockchain", price: 3.5, tokens: 1 },
            { name: "GameFi-Embodied-AI-Agents", price: 3.2, tokens: 1 }
        ],
        totalPrice: 17.0,
        modelCount: 4,
        popularity: 90,
        createdAt: "2024-01-25"
    },
    {
        id: 6,
        name: "Environmental & Climate AI Analysis",
        description: "Comprehensive environmental analysis workflow using advanced AI models for climate prediction, water resource management, and environmental monitoring.",
        category: "Environmental AI",
        models: [
            { name: "Graph-Runoff-GNN-River-Basins", price: 9.8, tokens: 3 },
            { name: "SoilMoist-Diff-SMAP-Imputation", price: 6.2, tokens: 2 },
            { name: "WADE-RL-Water-Adaptive-Decision", price: 4.1, tokens: 1 },
            { name: "Hydro-PINO-Physics-Informed", price: 6.8, tokens: 2 }
        ],
        totalPrice: 26.9,
        modelCount: 4,
        popularity: 94,
        createdAt: "2024-01-28"
    },
    {
        id: 7,
        name: "Security & Red Teaming Framework",
        description: "Advanced security assessment workflow using red teaming models, vulnerability detection, and AI security evaluation tools.",
        category: "Security",
        models: [
            { name: "Weak-to-Strong-Jailbreak", price: 8.3, tokens: 2 },
            { name: "ReLeak-Privacy-Attacker", price: 7.4, tokens: 2 },
            { name: "AgentVigil-Red-Team-Fuzzer", price: 5.9, tokens: 1 },
            { name: "AgentVigil-Black-Box-Red-Team", price: 5.9, tokens: 1 }
        ],
        totalPrice: 27.5,
        modelCount: 4,
        popularity: 89,
        createdAt: "2024-02-01"
    },
    {
        id: 8,
        name: "Graph Neural Networks & Analytics",
        description: "Advanced graph neural network workflow for complex relational data processing, network analysis, and knowledge graph applications.",
        category: "Graph Analytics",
        models: [
            { name: "Multi-Semantic-Metapath", price: 3.5, tokens: 1 },
            { name: "GVR-Graph-Valued-Regression", price: 9.5, tokens: 3 },
            { name: "STVG-Spatial-Temporal-Varying-Graphs", price: 4.7, tokens: 1 },
            { name: "Multi-Semantic-Metapath-MSM", price: 9.5, tokens: 3 }
        ],
        totalPrice: 27.2,
        modelCount: 4,
        popularity: 91,
        createdAt: "2024-02-05"
    },
    {
        id: 9,
        name: "Model Optimization & Training Suite",
        description: "Comprehensive model optimization workflow using advanced training techniques, hyperparameter optimization, and model efficiency tools.",
        category: "Model Optimization",
        models: [
            { name: "Hierarchical-Bayesian-Inference", price: 7.4, tokens: 2 },
            { name: "Normative-Causal-Inference", price: 5.6, tokens: 1 },
            { name: "BDP-Rank-Bayesian-Decision-Process", price: 8.9, tokens: 2 },
            { name: "BPTF-Bayesian-Tensor-Factorization", price: 4.4, tokens: 1 }
        ],
        totalPrice: 26.3,
        modelCount: 4,
        popularity: 93,
        createdAt: "2024-02-10"
    },
    {
        id: 10,
        name: "Advanced Research & Development",
        description: "Cutting-edge research workflow combining multiple AI research models for advanced experimentation and development.",
        category: "AI Research",
        models: [
            { name: "Intuitor-Self-Certainty-Learner", price: 8.3, tokens: 2 },
            { name: "Best-of-N-Self-Certainty", price: 5.3, tokens: 1 },
            { name: "Permute-and-Flip-Decoder", price: 8.9, tokens: 3 },
            { name: "Intuitor-Internal-Feedback-RLIF", price: 9.8, tokens: 3 }
        ],
        totalPrice: 32.3,
        modelCount: 4,
        popularity: 96,
        createdAt: "2024-02-15"
    }
];

enrichWorkflowPricing(workflows);

function enrichWorkflowPricing(workflowList) {
    workflowList.forEach(workflow => {
        let computeCost = 0;
        let gasCost = 0;
        workflow.models = (workflow.models || []).map(node => {
            const calls = Math.max(Number(node.tokens || node.calls || 1), 1);
            const pricing = getWorkflowModelPricing(node.name);
            const pricePerCall = Number(pricing.pricePerCallUsdc || WORKFLOW_PRICING_DEFAULTS.pricePerApiCallUsdc);
            const gasPerCall = Number(pricing.gasPerCallUsdc || WORKFLOW_PRICING_DEFAULTS.gasEstimatePerCallUsdc);
            const nodeComputeCost = calls * pricePerCall;
            const nodeGasCost = calls * gasPerCall;
            computeCost += nodeComputeCost;
            gasCost += nodeGasCost;
            return {
                ...node,
                calls,
                tokens: calls,
                price: Number(pricePerCall.toFixed(6)),
                pricePerCallUsdc: pricePerCall,
                gasPerCallUsdc: gasPerCall,
                computeCostUsdc: Number(nodeComputeCost.toFixed(6)),
                gasCostUsdc: Number(nodeGasCost.toFixed(6)),
                totalCostUsdc: Number((nodeComputeCost + nodeGasCost).toFixed(6))
            };
        });
        workflow.totalComputeCostUsdc = Number(computeCost.toFixed(6));
        workflow.totalGasCostUsdc = Number(gasCost.toFixed(6));
        workflow.totalPriceUsdc = Number((computeCost + gasCost).toFixed(6));
        workflow.totalPrice = workflow.totalPriceUsdc; // legacy compatibility
    });
}

// Current user's assets (from myAssets localStorage)
let userAssets = {};

// Helper: get current wallet credits (PHRS balance)
function getWalletCredits() {
    try {
        if (window.walletManager && typeof window.walletManager.getUserInfo === 'function') {
            const info = window.walletManager.getUserInfo();
            return Number(info && info.credits ? info.credits : 0);
        }
    } catch (_) {}
    return 0;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserAssets();
    displayWorkflows(workflows);
    console.log('✅ Workflow page loaded');
});

// Load user assets from localStorage
function loadUserAssets() {
    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        
        // Convert tokens array to object format
        userAssets = {};
        myAssets.tokens.forEach(token => {
            userAssets[token.modelName] = token.quantity;
        });
        
        console.log('📦 Loaded user assets:', userAssets);
    } catch (error) {
        console.error('❌ Error loading user assets:', error);
        userAssets = {};
    }
}

// 检查用户是否已连接钱包 - 复制自mycart.js
function checkWalletConnection() {
    if (!window.walletManager) {
        return { connected: false, error: 'Wallet manager not loaded' };
    }
    
    const userInfo = window.walletManager.getUserInfo();
    return {
        connected: userInfo.isConnected,
        address: userInfo.address,
        tokens: userInfo.credits, // 统一使用 PHRS 余额
        error: userInfo.isConnected ? null : 'Please connect your wallet first'
    };
}

// 验证用户是否有足够的 PHRS 余额 - 复制自mycart.js
function validatePayment(totalCost) {
    const walletStatus = checkWalletConnection();
    
    if (!walletStatus.connected) {
        return {
            valid: false,
            error: walletStatus.error,
            required: totalCost,
            available: 0
        };
    }
    
    if (walletStatus.tokens < totalCost) {
        return {
            valid: false,
            error: `Insufficient PHRS balance. You need ${totalCost} PHRS but only have ${walletStatus.tokens} PHRS.`,
            required: totalCost,
            available: walletStatus.tokens
        };
    }
    
    return {
        valid: true,
        available: walletStatus.tokens,
        required: totalCost
    };
}

// Display workflows
function displayWorkflows(workflowsToShow) {
    const grid = document.getElementById('workflowGrid');
    grid.innerHTML = '';

    if (workflowsToShow.length === 0) {
        grid.innerHTML = '<div class="loading">No workflows found</div>';
        return;
    }

    workflowsToShow.forEach(workflow => {
        const card = createWorkflowCard(workflow);
        grid.appendChild(card);
    });
}

// Create workflow card with enhanced features
function createWorkflowCard(workflow) {
    const card = document.createElement('div');
    card.className = 'workflow-card';
    
    card.innerHTML = `
        <div class="workflow-header-section">
            <div>
                <h3 class="workflow-title">${workflow.name}</h3>
                <div class="workflow-stats">
                    <span class="stat-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        ${workflow.popularity}% popular
                    </span>
                    <span class="stat-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="m2 17 10 5 10-5"/>
                            <path d="m2 12 10 5 10-5"/>
                        </svg>
                        ${workflow.modelCount} models
                    </span>
                </div>
            </div>
        </div>
        
        <div class="workflow-description">${workflow.description}</div>
        
        <div class="workflow-metrics">
            <div class="metric-item">
                <span class="metric-label">Compute Cost</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalComputeCostUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Estimated Gas</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalGasCostUsdc, { minimumFractionDigits: 5, maximumFractionDigits: 6 })}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Total (x402)</span>
                <span class="metric-value price">${workflowFormatUsdc(workflow.totalPriceUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
        </div>
        
        <div class="workflow-actions">
            <button class="action-btn details" onclick="showWorkflowDetails(${workflow.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                Details
            </button>
            <button class="action-btn try-now" onclick="tryWorkflow(${workflow.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
                Pay with x402
            </button>
        </div>
    `;
    
    return card;
}

// Check missing tokens for a workflow
function checkMissingTokens(workflow) {
    const missing = [];
    
    workflow.models.forEach(model => {
        const userTokens = userAssets[model.name] || 0;
        if (userTokens < model.tokens) {
            missing.push({
                name: model.name,
                required: model.tokens,
                current: userTokens,
                price: model.price,
                cost: model.price * model.tokens
            });
        }
    });
    
    return missing;
}

// Show token purchase modal - 先显示购买界面，验证留到placeOrder
function showTokenPurchaseModal(workflow, missingTokens) {
    const modal = document.getElementById('tokenPurchaseModal');
    const tokenList = document.getElementById('tokenList');
    const totalCostElement = document.getElementById('totalCost');
    
    // Clear previous content
    tokenList.innerHTML = '';
    
    // Calculate total cost
    const totalCost = missingTokens.reduce((sum, token) => sum + token.cost, 0);
    
    // Add token items
    missingTokens.forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.className = 'token-item';
        tokenItem.innerHTML = `
            <div class="token-info-left">
                <div class="token-name">${token.name}</div>
                <div class="token-details">${token.required}K tokens needed (you have ${token.current}K)</div>
            </div>
            <div class="token-price">${workflowFormatUsdc(token.cost, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
        `;
        tokenList.appendChild(tokenItem);
    });
    
    totalCostElement.textContent = workflowFormatUsdc(totalCost, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    
    // Store workflow data for later use
    modal.dataset.workflowId = workflow.id;
    
    // Show modal
    modal.classList.add('show');
}

// Hide token purchase modal
function hideTokenPurchaseModal() {
    const modal = document.getElementById('tokenPurchaseModal');
    modal.classList.remove('show');
}

async function placeOrder() {
    const modal = document.getElementById('tokenPurchaseModal');
    const workflowId = parseInt(modal.dataset.workflowId);
    const workflow = workflows.find(w => w.id === workflowId);
    
    if (!workflow) return;
    
    // 1. 检查钱包连接
    const walletStatus = checkWalletConnection();
    if (!walletStatus.connected) {
        alert('⚠️ Please connect your MetaMask wallet first to proceed with payment.\n\nClick "Login" → "Connect Wallet"');
        return;
    }
    
    // 2. 计算缺失tokens的总成本
    const missingTokens = checkMissingTokens(workflow);
    const totalCost = missingTokens.reduce((sum, token) => sum + token.cost, 0);
    
    
    // 4. 使用 MCPClient.executeWorkflow 执行整个 workflow
    let workflowResult;
    try {
        if (!window.MCPClient || typeof window.MCPClient.executeWorkflow !== 'function') {
            throw new Error('MCPClient not available. Please refresh the page.');
        }
        
        console.log('[Workflow] Starting workflow execution:', workflow.name);
        
        // 构造 workflow payload
        const workflowPayload = {
            workflow_id: workflow.id,
            workflow_name: workflow.name,
            workflow_description: workflow.description,
            nodes: workflow.models.map(model => ({
                name: model.name,
                calls: model.tokens || 1,
                tokens: model.tokens || 1
            })),
            wallet_address: walletStatus.address,
            metadata: {
                source: 'workflow_purchase',
                user_wallet: walletStatus.address,
                workflow_id: workflow.id
            }
        };
        
        // 调用 MCPClient.executeWorkflow（它会自动处理多次 402 循环）
        workflowResult = await window.MCPClient.executeWorkflow(workflowPayload, {
            onInvoice: (invoice) => {
                console.log('[Workflow] Received invoice:', invoice);
                // 可以在这里显示支付进度
            },
            onPayment: (invoice, tx) => {
                console.log('[Workflow] Payment settled:', tx);
            },
            onResult: (result) => {
                console.log('[Workflow] Node completed:', result);
            }
        });
        
        console.log('[Workflow] Workflow execution result:', workflowResult);
        
        // 检查结果状态
        if (!workflowResult) {
            throw new Error('No result returned from workflow execution');
        }
        
        if (workflowResult.status === 'cancelled') {
            console.log('[Workflow] User cancelled payment');
            return;
        }
        
        if (workflowResult.status !== 'ok') {
            const errorMsg = workflowResult.error?.message || 
                           workflowResult.message || 
                           workflowResult.status ||
                           'Workflow execution failed';
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        const errorMsg = error?.message || String(error);
        console.error('[Workflow] Execution error:', error);
        
        // 区分不同类型的错误
        if (errorMsg.includes('cancelled') || errorMsg.includes('user denied') || errorMsg.includes('User rejected')) {
            console.log('[Workflow] User cancelled workflow execution');
            return;
        } else if (errorMsg.includes('insufficient') || errorMsg.includes('balance')) {
            alert(`⚠️ Insufficient Balance!\n\n${errorMsg}\n\nPlease add PHRS to your wallet and try again.`);
        } else {
            alert(`❌ Workflow Execution Failed!\n\n${errorMsg}\n\nPlease try again.`);
        }
        return;
    }
    
    // 5. 扣减本地账户余额
    const spendResult = window.walletManager.spendCredits(totalCost, 'workflow_tokens_purchase');
    if (!spendResult.success) {
        console.warn('[Workflow] Failed to update local credits:', spendResult.error);
    }
    
    // 6. 更新用户资产
    missingTokens.forEach(token => {
        userAssets[token.name] = (userAssets[token.name] || 0) + token.required;
    });
    
    // 7. 保存到localStorage
    updateUserAssetsInStorage();
    
    // 8. 显示成功消息
    alert(`🎉 Workflow Purchase Successful!\n\n💳 Total Cost: ${totalCost.toFixed(6)} PHRS\n📊 Workflow: ${workflow.name}\n🎯 Models: ${workflow.modelCount}\n\n✅ Tokens have been added to your account!`);
    
    // 9. Hide modal
    hideTokenPurchaseModal();
    
    // 10. Refresh workflow display
    displayWorkflows(workflows);
    
    // 11. 标记该工作流已预付费
    workflow.prepaid = true;
    workflow.prepaidAt = new Date().toISOString();
    workflow.prepaidAmountUsdc = Number(totalCost.toFixed(6));
    workflow.prepaidModels = (workflow.models || []).map(m => m.name);
    workflow.lastPaymentAt = workflow.prepaidAt;
    
    // 从 workflowResult 中提取交易信息
    const history = workflowResult.history || [];
    const payments = history.filter(h => h.type === 'payment');
    if (payments.length > 0) {
        const lastPayment = payments[payments.length - 1];
        workflow.lastPaymentTx = lastPayment.tx;
        
        // 构造 explorer URL
        const explorerBase = 'https://pharos-testnet.socialscan.io/tx';
        workflow.lastPaymentExplorer = `${explorerBase}/${lastPayment.tx}`;
        workflow.lastPaymentMemo = lastPayment.invoice?.request_id || null;
        
        // 显示交易链接
        showWorkflowExplorerToast(
            workflow.lastPaymentTx, 
            totalCost, 
            workflow.lastPaymentExplorer
        );
    }
    
    workflow.workflowResult = workflowResult;
    
    // 12. 记录日志
    if (window.MCPClient && typeof window.MCPClient.logStatus === 'function') {
        window.MCPClient.logStatus('paid', 'Workflow completed', {
            amount: totalCost.toFixed(6),
            workflow: workflow.name
        });
    }
    
    // 13. 提示用户打开 Canvas
    offerCanvasNavigation(workflow);
}

// Update user assets in localStorage
function updateUserAssetsInStorage() {
    try {
        const myAssets = JSON.parse(localStorage.getItem('myAssets')) || { tokens: [], shares: [] };
        
        // Update tokens with proper structure for My Assets
        myAssets.tokens = Object.entries(userAssets).map(([modelName, quantity]) => {
            const modelData = getModelData(modelName);
            return {
                modelName,
                quantity,
                category: modelData ? modelData.category : 'AI Research',
                industry: modelData ? modelData.industry : 'Technology',
                tokenPrice: modelData ? modelData.tokenPrice : 0,
                sharePrice: modelData ? modelData.sharePrice : 0,
                change: modelData ? modelData.change : 0,
                rating: modelData ? modelData.rating : 0,
                usage: modelData ? modelData.usage : 0,
                compatibility: modelData ? modelData.compatibility : 0,
                totalScore: modelData ? modelData.totalScore : 0,
                purchaseDate: new Date().toISOString(),
                lastPurchase: new Date().toISOString()
            };
        });
        
        localStorage.setItem('myAssets', JSON.stringify(myAssets));
        console.log('💾 Updated user assets in localStorage');
    } catch (error) {
        console.error('❌ Error updating user assets:', error);
    }
}

// Filter workflows with enhanced functionality
function filterWorkflows() {
    const searchTerm = document.getElementById('workflowSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filtered = workflows.filter(workflow => {
        const matchesSearch = workflow.name.toLowerCase().includes(searchTerm) || 
                            workflow.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || workflow.category === categoryFilter;
        
        // Status filter (Ready/Need Tokens) based on credits vs total price
        let matchesStatus = true;
        if (statusFilter) {
            const hasSufficientCredits = getWalletCredits() >= Number(workflow.totalPrice || 0);
            if (statusFilter === 'ready' && !hasSufficientCredits) matchesStatus = false;
            if (statusFilter === 'need-tokens' && hasSufficientCredits) matchesStatus = false;
        }
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Sort workflows
    switch(sortFilter) {
        case 'popular':
            filtered.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'recent':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-low':
            filtered.sort((a, b) => a.totalPrice - b.totalPrice);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.totalPrice - a.totalPrice);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayWorkflows(filtered);
}

// Show workflow details with enhanced information
function showWorkflowDetails(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const hasSufficientCredits = getWalletCredits() >= Number(workflow.totalPrice || 0);
    
    // Update modal title
    document.getElementById('workflowDetailsTitle').textContent = workflow.name;
    
    // Build detailed content
    let content = `
        <div class="workflow-details-section">
            <h3>Overview</h3>
            <p>${workflow.description}</p>
        </div>
        
        <div class="workflow-details-section">
            <h3>Models (${workflow.modelCount})</h3>
            <div class="workflow-models-list">
    `;
    
    workflow.models.forEach(model => {
        const userTokens = userAssets[model.name] || 0;
        const modelReady = hasSufficientCredits || (userTokens >= model.tokens);
        const status = modelReady ? 'ready' : 'need-tokens';
        const statusText = modelReady ? 'Ready' : 'Need Tokens';
        const statusIcon = modelReady ? '✅' : '⚠️';
        const modelData = getModelData(model.name);
        
        content += `
            <div class="workflow-model-item ${status}">
                <div class="model-item-header">
                    <div class="model-name">${model.name}</div>
                    <div class="model-status ${status}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="model-details">
                    <div class="model-detail-item">
                        <div class="model-detail-label">Price</div>
                        <div class="model-detail-value">${workflowFormatUsdc(model.price, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} / call</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Required Tokens</div>
                        <div class="model-detail-value">${model.tokens}K tokens</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Your Tokens</div>
                        <div class="model-detail-value">${userTokens}K tokens</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Category</div>
                        <div class="model-detail-value">${modelData ? modelData.category : 'N/A'}</div>
                    </div>
                </div>
        `;
        
        if (modelData) {
            content += `
                <div class="model-details" style="margin-top: 12px;">
                    <div class="model-detail-item">
                        <div class="model-detail-label">Purpose</div>
                        <div class="model-detail-value">${modelData.purpose}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Use Case</div>
                        <div class="model-detail-value">${modelData.useCase}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Industry</div>
                        <div class="model-detail-value">${modelData.industry}</div>
                    </div>
                    <div class="model-detail-item">
                        <div class="model-detail-label">Rating</div>
                        <div class="model-detail-value rating">${modelData.ratingFormatted} ${modelData.starsHtml}</div>
                    </div>
                </div>
            `;
        }
        
        content += `
            </div>
        </div>
        `;
    });
    
    content += `
            </div>
        </div>
        
        <div class="workflow-summary">
            <h4>Workflow Summary</h4>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="summary-stat-label">Total Price</div>
                    <div class="summary-stat-value price">${workflowFormatUsdc(workflow.totalPriceUsdc, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</div>
                </div>
                <div class="summary-stat">
                    <div class="summary-stat-label">Status</div>
                    <div class="summary-stat-value status ${hasSufficientCredits ? 'ready' : 'need-tokens'}">
                        ${hasSufficientCredits ? '✅ Ready to Run' : '⚠️ Need Tokens'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update modal content
    document.getElementById('workflowDetailsContent').innerHTML = content;
    
    // Show modal
    document.getElementById('workflowDetailsModal').classList.add('show');
}

// Hide workflow details modal
function hideWorkflowDetailsModal() {
    document.getElementById('workflowDetailsModal').classList.remove('show');
}

// Try workflow with token checking
function tryWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    // 显示选择对话框
    const choice = confirm(
        `Choose payment method for "${workflow.name}":\n\n` +
        `OK = Prepay once (${workflow.totalPrice.toFixed(4)} PHRS total, 1 transaction)\n` +
        `Cancel = Pay per node (${workflow.models.length} separate transactions)`
    );

    if (choice) {
        // 预付费模式
        purchaseAndPrepayWorkflow(workflow);
    } else {
        // 原有模式
        const missingTokens = checkMissingTokens(workflow);
        if (missingTokens.length) {
            showTokenPurchaseModal(workflow, missingTokens);
            return;
        }
        loadWorkflowToCanvas(workflow);
    }
}

// Load workflow to canvas
function loadWorkflowToCanvas(workflow) {
    // Save workflow data to localStorage
    const workflowData = {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        models: workflow.models,
        totalPrice: workflow.totalPrice,
        modelCount: workflow.modelCount,
        prepaid: !!workflow.prepaid,
        prepaidAt: workflow.prepaidAt || null,
        prepaidAmountUsdc: workflow.prepaidAmountUsdc || null,
        prepaidModels: workflow.prepaidModels || null,
        lastPaymentTx: workflow.lastPaymentTx || null,
        lastPaymentExplorer: workflow.lastPaymentExplorer || null,
        lastPaymentAt: workflow.lastPaymentAt || null,
        lastPaymentMemo: workflow.lastPaymentMemo || null,
        status: 'ready',
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('selectedWorkflow', JSON.stringify(workflowData));
    
    // Also save to currentWorkflow for index.html compatibility
    const currentWorkflow = {
        name: workflow.name,
        description: workflow.description,
        status: 'running',
        createdAt: new Date().toISOString(),
        prepaid: !!workflow.prepaid,
        prepaidAt: workflow.prepaidAt || null,
        prepaidAmountUsdc: workflow.prepaidAmountUsdc || null,
        prepaidModels: workflow.prepaidModels || null,
        lastPaymentTx: workflow.lastPaymentTx || null,
        lastPaymentExplorer: workflow.lastPaymentExplorer || null,
        lastPaymentAt: workflow.lastPaymentAt || null,
        lastPaymentMemo: workflow.lastPaymentMemo || null
    };
    localStorage.setItem('currentWorkflow', JSON.stringify(currentWorkflow));
    
    // ✅ 清除旧的初始化标记，确保后续流程正常
    try {
        localStorage.removeItem(`wfInit:${workflow.name}`);
        if (workflow.runId) localStorage.removeItem(`wfInit:${workflow.runId}`);
    } catch (_) {}
    
    // Redirect to canvas page
    window.location.href = 'canvas.html';
}

// Export functions for global access
window.filterWorkflows = filterWorkflows;
window.showWorkflowDetails = showWorkflowDetails;
window.hideWorkflowDetailsModal = hideWorkflowDetailsModal;
window.tryWorkflow = tryWorkflow;
window.hideTokenPurchaseModal = hideTokenPurchaseModal;


function showWorkflowExplorerToast(signature, amount, explorerUrlOverride) {
    try {
        if (!signature) return;
        const existing = document.getElementById('workflow-payment-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'workflow-payment-toast';
        toast.className = 'workflow-payment-toast';
        const explorerUrl = explorerUrlOverride || `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
        toast.innerHTML = `
            <button class="workflow-payment-toast__close" aria-label="Dismiss">×</button>
            <h4>Workflow Payment Settled</h4>
            <p>Amount: <strong>${Number(amount).toFixed(6)} PHRS</strong></p>
            <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">View on Solana Explorer →</a>
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

function offerCanvasNavigation(workflow) {
    try {
        const existing = document.getElementById('workflow-run-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'workflow-run-modal';
        modal.className = 'workflow-run-modal';
        
        // Build explorer link section if transaction data is available
        let explorerSection = '';
        if (workflow.lastPaymentTx && workflow.lastPaymentExplorer) {
            const shortTx = `${workflow.lastPaymentTx.slice(0, 8)}...${workflow.lastPaymentTx.slice(-8)}`;
            explorerSection = `
                <div class="workflow-run-modal__explorer">
                    <p style="margin: 12px 0 8px; font-size: 13px; color: #94a3b8;">
                        <strong>Payment Transaction:</strong>
                    </p>
                    <a href="${workflow.lastPaymentExplorer}" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="workflow-run-modal__solscan-link"
                       title="View on Solana Explorer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        ${shortTx}
                    </a>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
                        ${workflow.prepaidAmountUsdc ? `Amount: ${workflow.prepaidAmountUsdc.toFixed(6)} PHRS` : ''}
                    </p>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="workflow-run-modal__content">
                <button class="workflow-run-modal__close" aria-label="Close">×</button>
                <h3>Workflow Ready</h3>
                <p>Your workflow <strong>${workflow.name}</strong> is paid and ready to execute.</p>
                ${explorerSection}
                <p style="margin-top: 16px;">Would you like to open it on the canvas to review or run the pipeline now?</p>
                <div class="workflow-run-modal__actions">
                    <button type="button" class="workflow-run-modal__later">Maybe Later</button>
                    <button type="button" class="workflow-run-modal__open">Open Canvas</button>
                </div>
            </div>
        `;
        const close = () => modal.remove();
        modal.querySelector('.workflow-run-modal__close').addEventListener('click', close);
        modal.querySelector('.workflow-run-modal__later').addEventListener('click', close);
        modal.querySelector('.workflow-run-modal__open').addEventListener('click', () => {
            try { loadWorkflowToCanvas(workflow); }
            finally { close(); }
        });
        document.body.appendChild(modal);
    } catch (err) {
        console.warn('Failed to show canvas navigation modal', err);
        loadWorkflowToCanvas(workflow);
    }
}

// ========== Workflow 预付费功能 ==========

async function purchaseAndPrepayWorkflow(workflow) {
    try {
        const walletAddress = await getConnectedWallet();
        if (!walletAddress) {
            alert('Please connect your wallet first');
            return;
        }

        // 步骤 1: 请求预付费发票
        const invoiceResponse = await fetch('/mcp/workflow.prepay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet_address: walletAddress,
                workflow: { name: workflow.name },
                nodes: workflow.models.map(m => ({
                    name: m.name,
                    calls: m.tokens || 1
                }))
            })
        });

        const invoiceData = await invoiceResponse.json();
        if (invoiceResponse.status !== 402) {
            throw new Error(invoiceData.message || 'Failed to get invoice');
        }

        console.log('📋 x402 Invoice received:', invoiceData);

        // 步骤 2: 立即显示 402 发票弹窗 (在支付之前!)
        const paymentResult = await show402InvoiceModal(invoiceData, workflow);
        if (!paymentResult) {
            console.log('User cancelled payment');
            return;
        }

        console.log('✅ Payment successful:', paymentResult);

        // 步骤 3: 提交支付凭证
        const paymentHeader = `x402 ${invoiceData.network}; tx=${paymentResult.hash}; amount=${invoiceData.amount_usdc}; nonce=${invoiceData.nonce}`;

        const confirmResponse = await fetch('/mcp/workflow.prepay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Payment': paymentHeader,
                'X-Request-Id': invoiceData.request_id
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                workflow: { name: workflow.name },
                nodes: workflow.models.map(m => ({
                    name: m.name,
                    calls: m.tokens || 1
                }))
            })
        });

        const confirmData = await confirmResponse.json();
        if (confirmData.status !== 'ok') {
            throw new Error(confirmData.message || 'Payment verification failed');
        }

        console.log('✅ Workflow prepaid successfully!');
        
        // 保存数据
        workflow.prepaid = true;
        workflow.workflowSessionId = confirmData.workflow_session_id;
        workflow.prepaidAmountUsdc = confirmData.amount_usdc;
        workflow.lastPaymentTx = confirmData.tx_signature;
        workflow.lastPaymentExplorer = confirmData.explorer;
        workflow.prepaidAt = confirmData.settled_at;

        localStorage.setItem('selectedWorkflow', JSON.stringify(workflow));

        showWorkflowExplorerToast(confirmData.tx_signature, confirmData.amount_usdc, confirmData.explorer);
        offerCanvasNavigation(workflow);

    } catch (error) {
        console.error('❌ Prepayment failed:', error);
        alert(`Payment failed: ${error.message}`);
    }
}

// 修改后的 402 发票弹窗 - 在弹窗内完成支付
function show402InvoiceModal(invoice, workflow) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        
        const costBreakdown = invoice.cost_breakdown || [];
        const breakdownHtml = costBreakdown.map(node => `
            <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${node.name}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${node.calls}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${node.total_cost.toFixed(6)} PHRS</td>
            </tr>
        `).join('');

        modal.innerHTML = `
            <div style="background:white;border-radius:16px;padding:32px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                    <h2 style="margin:0;color:#1a1a1a;flex:1;">💰 x402 Payment Invoice</h2>
                    <span style="background:#e7f3ff;color:#3498db;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;">x402 PROTOCOL</span>
                </div>
                
                <div style="background:#f8f9fa;padding:20px;border-radius:12px;margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                        <span style="color:#666;">Workflow:</span>
                        <strong>${workflow.name}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                        <span style="color:#666;">Total Nodes:</span>
                        <strong>${invoice.workflow.node_count}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                        <span style="color:#666;">Network:</span>
                        <strong>${invoice.network}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:2px solid #dee2e6;">
                        <span style="color:#666;font-size:18px;">Total Amount:</span>
                        <strong style="color:#2ecc71;font-size:20px;">${invoice.amount_usdc.toFixed(6)} PHRS</strong>
                    </div>
                </div>

                <details style="margin-bottom:20px;">
                    <summary style="cursor:pointer;padding:12px;background:#f8f9fa;border-radius:8px;font-weight:500;">
                        📊 Cost Breakdown (${costBreakdown.length} nodes)
                    </summary>
                    <table style="width:100%;margin-top:12px;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8f9fa;">
                                <th style="padding:8px;text-align:left;">Node</th>
                                <th style="padding:8px;text-align:center;">Calls</th>
                                <th style="padding:8px;text-align:right;">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdownHtml}
                        </tbody>
                    </table>
                </details>

                <div style="background:#fff3cd;padding:16px;border-radius:8px;margin-bottom:20px;border-left:4px solid #ffc107;">
                    <strong>⚡ Pay Once, Execute All!</strong>
                    <p style="margin:8px 0 0 0;color:#666;font-size:14px;">
                        After this single payment, you can execute all ${invoice.workflow.node_count} nodes without any additional transactions.
                    </p>
                </div>

                <div style="background:#e7f3ff;padding:16px;border-radius:8px;margin-bottom:24px;border-left:4px solid #3498db;">
                    <div style="font-size:13px;color:#555;">
                        <div style="margin-bottom:8px;"><strong>📍 Recipient:</strong><br>
                        <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:11px;word-break:break-all;">${invoice.recipient}</code></div>
                        <div style="margin-bottom:8px;"><strong>🔒 Request ID:</strong><br>
                        <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:11px;word-break:break-all;">${invoice.request_id}</code></div>
                        <div style="margin-bottom:8px;"><strong>🔗 Explorer:</strong><br>
                        <code style="background:#fff;padding:4px 8px;border-radius:4px;font-size:11px;word-break:break-all;">${invoice.explorer_base_url}</code></div>
                        <div><strong>⏱️ Expires:</strong> ${new Date(invoice.expires_at).toLocaleString()}</div>
                    </div>
                </div>

                <!-- 支付状态区域 -->
                <div id="payment-status" style="display:none;background:#d4edda;padding:16px;border-radius:8px;margin-bottom:20px;border-left:4px solid #28a745;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="font-size:20px;">✅</span>
                        <strong style="color:#155724;">Payment Successful!</strong>
                    </div>
                    <div style="font-size:13px;color:#155724;">
                        <div style="margin-bottom:4px;"><strong>Tx Hash:</strong><br>
                        <code id="tx-hash" style="background:#fff;padding:4px 8px;border-radius:4px;font-size:11px;word-break:break-all;"></code></div>
                        <a id="explorer-link" href="#" target="_blank" rel="noopener noreferrer" 
                           style="color:#007bff;text-decoration:none;font-weight:500;">
                            🔍 View on Explorer →
                        </a>
                    </div>
                </div>

                <div style="display:flex;gap:12px;">
                    <button id="cancel-btn" style="flex:1;padding:14px;border:2px solid #ddd;background:white;border-radius:8px;cursor:pointer;font-size:16px;font-weight:500;">
                        Cancel
                    </button>
                    <button id="pay-btn" style="flex:2;padding:14px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:500;">
                        💳 Pay ${invoice.amount_usdc.toFixed(6)} PHRS
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#cancel-btn');
        const payBtn = modal.querySelector('#pay-btn');
        const paymentStatus = modal.querySelector('#payment-status');

        cancelBtn.onclick = () => {
            modal.remove();
            resolve(null);
        };

        payBtn.onclick = async () => {
            try {
                // 禁用按钮
                payBtn.disabled = true;
                payBtn.style.opacity = '0.6';
                payBtn.style.cursor = 'not-allowed';
                payBtn.innerHTML = '⏳ Processing...';

                // 发起支付
                const tx = await sendPharosPayment(
                    invoice.recipient,
                    invoice.amount_usdc,
                    invoice.decimals || 18
                );

                console.log('💰 Payment tx:', tx.hash);

                // 生成 explorer URL
                const explorerUrl = `${invoice.explorer_base_url}/${tx.hash}`;

                // 显示支付成功状态
                paymentStatus.style.display = 'block';
                modal.querySelector('#tx-hash').textContent = tx.hash;
                modal.querySelector('#explorer-link').href = explorerUrl;

                // 更新按钮
                payBtn.innerHTML = '✅ Payment Confirmed';
                payBtn.style.background = '#28a745';
                
                // 隐藏取消按钮
                cancelBtn.style.display = 'none';

                // 2秒后自动关闭并返回结果
                setTimeout(() => {
                    modal.remove();
                    resolve(tx);
                }, 2000);

            } catch (error) {
                console.error('Payment error:', error);
                payBtn.disabled = false;
                payBtn.style.opacity = '1';
                payBtn.style.cursor = 'pointer';
                payBtn.innerHTML = `💳 Pay ${invoice.amount_usdc.toFixed(6)} PHRS`;
                alert(`Payment failed: ${error.message}`);
            }
        };

        // Click outside to cancel
        modal.onclick = (e) => {
            if (e.target === modal && !payBtn.disabled) {
                modal.remove();
                resolve(null);
            }
        };
    });
}

async function executePrepaidWorkflow(workflow) {
    if (!workflow.prepaid || !workflow.workflowSessionId) {
        alert('Workflow not prepaid');
        return;
    }

    const walletAddress = await getConnectedWallet();
    const results = [];
    const totalNodes = workflow.models.length;

    showExecutionProgress(0, totalNodes, 'Starting...');

    for (let i = 0; i < totalNodes; i++) {
        updateExecutionProgress(i, totalNodes, `Executing ${workflow.models[i].name}...`);

        const response = await fetch('/mcp/workflow.execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workflow_session_id: workflow.workflowSessionId,
                wallet_address: walletAddress,
                workflow: { name: workflow.name },
                nodes: workflow.models.map(m => ({
                    name: m.name,
                    calls: m.tokens || 1
                }))
            })
        });

        const data = await response.json();

        if (data.status === 'continue') {
            results.push(data.previous_node);
            updateExecutionProgress(i + 1, totalNodes, `${data.progress.completed}/${data.progress.total_nodes} completed`);
        } else if (data.status === 'ok') {
            results.push(data.final_node);
            updateExecutionProgress(totalNodes, totalNodes, 'Completed!');
            break;
        } else {
            throw new Error(data.message || 'Execution failed');
        }

        await new Promise(r => setTimeout(r, 500));
    }

    hideExecutionProgress();
    alert(`✅ Workflow completed! Executed ${results.length} nodes.`);
}

async function sendPharosPayment(recipient, amountUsdc, decimals) {
    if (!window.ethereum) throw new Error('MetaMask not installed');
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const amountWei = ethers.utils.parseUnits(amountUsdc.toString(), decimals);

    const tx = await signer.sendTransaction({
        to: recipient,
        value: amountWei
    });

    await tx.wait();
    return tx;
}

async function getConnectedWallet() {
    if (!window.ethereum) return null;
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
}

// UI 辅助函数
function showPrepayProgress(msg) {
    const modal = document.createElement('div');
    modal.id = 'prepay-progress';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;min-width:400px;text-align:center;';
    modal.innerHTML = `<h3 style="margin-top:0;">Workflow Prepayment</h3><div class="spinner" style="margin:20px auto;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;"></div><p id="prepay-msg">${msg}</p><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    document.body.appendChild(modal);
}

function updatePrepayProgress(msg) {
    const el = document.getElementById('prepay-msg');
    if (el) el.textContent = msg;
}

function hidePrepayProgress() {
    const modal = document.getElementById('prepay-progress');
    if (modal) modal.remove();
}

function showExecutionProgress(current, total, msg) {
    const modal = document.createElement('div');
    modal.id = 'exec-progress';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;min-width:400px;text-align:center;';
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    modal.innerHTML = `<h3 style="margin-top:0;">Executing Workflow</h3><div style="margin:20px 0;"><div style="background:#f0f0f0;height:24px;border-radius:12px;overflow:hidden;"><div id="exec-bar" style="background:linear-gradient(90deg,#3498db,#2ecc71);height:100%;width:${pct}%;transition:width 0.3s;"></div></div><p style="margin-top:10px;font-weight:bold;"><span id="exec-count">${current}/${total}</span> (${pct}%)</p></div><p id="exec-msg">${msg}</p>`;
    document.body.appendChild(modal);
}

function updateExecutionProgress(current, total, msg) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    const bar = document.getElementById('exec-bar');
    const count = document.getElementById('exec-count');
    const msgEl = document.getElementById('exec-msg');
    if (bar) bar.style.width = `${pct}%`;
    if (count) count.textContent = `${current}/${total}`;
    if (msgEl) msgEl.textContent = msg;
}

function hideExecutionProgress() {
    const modal = document.getElementById('exec-progress');
    if (modal) modal.remove();
}