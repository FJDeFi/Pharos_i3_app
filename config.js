// 🔐 Configuration file for Intelligence Cubed
// This file contains sensitive configuration data

const config = {
    // I3 Proxy API Configuration (used by api-manager.js)
    proxy: {
        apiKey: 'ak_pxOhfZtDes9R6CUyPoOGZtnr61tGJOb2CBz-HHa_VDE',
        model: 'I3-Generic-Foundation-LLM',
        maxTokens: 4000,
        temperature: 0.7
    },

    // Pricing configuration (PHRS)
    pricing: {
        currency: 'PHRS',
        pricePerApiCallUsdc: 0.0008,
        gasEstimatePerCallUsdc: 0.00025,
        sharePurchaseMinUsdc: 1,
        sharePurchaseMaxUsdc: 20,
        dailyCheckInRewardUsdc: 0.01
    },

    // MCP / payment service configuration
    mcp: {
        baseUrl: 'http://localhost:3000',
        receiptExplorerBaseUrl: 'https://explorer.solana.com/tx'
    },
    mcpBaseUrl: 'http://localhost:3000',

    // Solana payment rails
    solana: {
        cluster: 'mainnet-beta',
        rpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=fd6a5779-892d-47eb-a88b-bc961ca4b606',
        phrsMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        merchantAddress: 'FWSVwBwtyN3mFY96cR3myCbsNYawdyZRyX1W29nsFqYV',
        phrsDecimals: 6
    },

    // Server Configuration
    server: {
        port: 3000,
        host: 'localhost'
    },

    // Application Configuration
    app: {
        name: 'Intelligence Cubed',
        version: '1.0.0',
        environment: (typeof process !== 'undefined' && process && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'development'
    },

    // Model Configuration (legacy - kept for compatibility)
    models: {
        defaultModel: 'I3-Generic-Foundation-LLM',
        fallbackModel: 'I3-Generic-Foundation-LLM',
        maxConcurrentRequests: 10
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}

// Export for browser
if (typeof window !== 'undefined') {
    window.APP_CONFIG = config;
}
