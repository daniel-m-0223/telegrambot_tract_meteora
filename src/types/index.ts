export interface WatchlistItem {
  contractAddress: string;
  addedAt: Date;
  lastAlert?: Date;
}

export interface LiquidityAlert {
  contractAddress: string;
  dex: 'raydium' | 'meteora';
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  liquidityA: number;
  liquidityB: number;
  timestamp: Date;
}

export interface PoolInfo {
  address: string;
  tokenA: string;
  tokenB: string;
  liquidityA: number;
  liquidityB: number;
  dex: 'raydium' | 'meteora';
}

export interface BotConfig {
  telegramBotToken: string;
  telegramChatId: string;
  solanaRpcUrl: string;
  heliusApiKey: string;
  maxWatchlistSize: number;
  alertCooldownMinutes: number;
}
