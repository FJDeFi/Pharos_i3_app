const path = require('path');

// 网络配置映射
const NETWORK_CONFIGS = {
  'pharos-testnet': {
    network: 'pharos-testnet',
    // 这里不再配置 mint，因为我们使用的是原生 PHRS
    explorerBaseUrl: 'https://pharos-testnet.socialscan.io/tx',
    rpcUrl:
      'https://api.zan.top/node/v1/pharos/testnet/35905838255149eaa94c610c79294f0f',
    tokenType: 'native',
    decimals: 18
  }
};

// 默认网络（mainnet）
const DEFAULT_NETWORK = process.env.X402_NETWORK || 'pharos-testnet';

const MCP_CONFIG = {
  payments: {
    network: DEFAULT_NETWORK,
    // 对于 Pharos testnet，我们使用原生 PHRS 作为支付币
    tokenType: NETWORK_CONFIGS[DEFAULT_NETWORK]?.tokenType || 'native',
    // 收款地址：可以通过环境变量覆盖
    recipient:
      process.env.X402_RECIPIENT ||
      '0x49e0329808559a9aa742a3cf01cec9b773a53834',
    paymentUrl: process.env.X402_PAYMENT_URL || null,
    explorerBaseUrl:
      NETWORK_CONFIGS[DEFAULT_NETWORK]?.explorerBaseUrl ||
      'https://pharos-testnet.socialscan.io/tx',
    rpcUrl:
      NETWORK_CONFIGS[DEFAULT_NETWORK]?.rpcUrl ||
      'https://api.zan.top/node/v1/pharos/testnet/35905838255149eaa94c610c79294f0f',
    // PHRS 默认使用 18 位精度
    decimals: Number(
      process.env.X402_DECIMALS ||
        NETWORK_CONFIGS[DEFAULT_NETWORK]?.decimals ||
        18
    ),
    expiresInSeconds: Number(process.env.X402_EXPIRES_SECONDS || 300)
  },
  billing: {
    storeFile: path.join(__dirname, '..', '..', 'data', 'billing-entries.json')
  },
  autoRouter: {
    defaultMaxCandidates: 3
  }
};

// 根据请求头获取网络配置
function getNetworkConfigFromRequest(req) {
  const networkHeader =
    req.headers['x-pharos-network'] ||
    req.body?.network ||
    DEFAULT_NETWORK;
  const networkKey = networkHeader || DEFAULT_NETWORK;
  const config = NETWORK_CONFIGS[networkKey] || NETWORK_CONFIGS[DEFAULT_NETWORK];
  return {
    ...MCP_CONFIG.payments,
    network: config.network,
    explorerBaseUrl: config.explorerBaseUrl,
    rpcUrl: config.rpcUrl,
    decimals: config.decimals ?? MCP_CONFIG.payments.decimals,
    tokenType: config.tokenType || MCP_CONFIG.payments.tokenType
  };
}

module.exports = { MCP_CONFIG, getNetworkConfigFromRequest, NETWORK_CONFIGS };