import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import  { IDL, LbClmm } from './dlmm/idl';

import { config, validateConfig } from './config';
import { WatchlistService } from './services/WatchlistService';
import { SolanaService } from './services/SolanaService';
import { TelegramService } from './services/TelegramService';
import { LiquidityMonitor } from './services/LiquidityMonitor';
import express from 'express';

async function main() {
  try {
    // Validate configuration
    validateConfig();
    console.log('Configuration validated successfully');

    // Initialize services
    const watchlistService = new WatchlistService(config.maxWatchlistSize);
    
    const solanaService = new SolanaService(config.solanaRpcUrl, config.heliusApiKey, null, watchlistService);
    const liquidityMonitor = new LiquidityMonitor(
      solanaService,
      null, // Will be set after TelegramService is created
      watchlistService,
      config.alertCooldownMinutes
    );

    const telegramService = new TelegramService(
      config.telegramBotToken,
      config.telegramChatId,
      watchlistService,
      liquidityMonitor
    );

    // Set the telegram service in solana service and liquidity monitor
    solanaService.setTelegramService(telegramService);
    liquidityMonitor.setTelegramService(telegramService);

    // Set up webhook endpoint for Helius
    const app = express();
    app.use(express.json());

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Webhook server running on port ${PORT}`);
    });

    // Launch Telegram bot
    telegramService.launch();

    console.log('🚀 Solana Liquidity Bot is running!');
    console.log('📱 Telegram bot is active');
    console.log('⏸️  Monitoring is paused - use /start command in Telegram to begin monitoring');

    // Send startup notification
    await telegramService.sendMessage('🤖 Bot started successfully! Use /start command to begin monitoring for liquidity events.');

  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main();
