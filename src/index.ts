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
    const solanaService = new SolanaService(config.solanaRpcUrl, config.heliusApiKey);
    const telegramService = new TelegramService(
      config.telegramBotToken,
      config.telegramChatId,
      watchlistService
    );
    const liquidityMonitor = new LiquidityMonitor(
      solanaService,
      telegramService,
      watchlistService,
      config.alertCooldownMinutes
    );

    // Set up webhook endpoint for Helius
    const app = express();
    app.use(express.json());

    app.post('/webhook', async (req, res) => {
      try {
        console.log('Webhook received:', req.body);
        await liquidityMonitor.handleWebhookData(req.body);
        res.status(200).send('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        monitoring: liquidityMonitor.getMonitoringStatus(),
        watchlistSize: watchlistService.getWatchlist().length
      });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Webhook server running on port ${PORT}`);
    });

    // Launch Telegram bot
    telegramService.launch();

    // Start liquidity monitoring
    await liquidityMonitor.startMonitoring();

    // Set up Helius webhook if API key is provided
    if (config.heliusApiKey) {
      const webhookUrl = process.env.WEBHOOK_URL || `https://your-domain.com/webhook`;
      await solanaService.setupHeliusWebhook(webhookUrl);
    }

    console.log('🚀 Solana Liquidity Bot is running!');
    console.log('📱 Telegram bot is active');
    console.log('🔍 Monitoring for liquidity events...');

    // Send startup notification
    await telegramService.sendMessage('🤖 Bot started successfully! Monitoring for liquidity events...');

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
