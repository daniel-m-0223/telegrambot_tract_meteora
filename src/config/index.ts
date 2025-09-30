import dotenv from 'dotenv';
import { BotConfig } from '../types';

dotenv.config();

export const config: BotConfig = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  maxWatchlistSize: parseInt(process.env.MAX_WATCHLIST_SIZE || '5'),
  alertCooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '5'),
};

export function validateConfig(): void {
  const required = ['telegramBotToken', 'telegramChatId'];
  const missing = required.filter(key => !config[key as keyof BotConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
