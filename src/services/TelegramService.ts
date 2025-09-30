import { Telegraf, Context } from 'telegraf';
import { WatchlistItem, LiquidityAlert } from '../types';
import { WatchlistService } from './WatchlistService';

export class TelegramService {
  private bot: Telegraf;
  private watchlistService: WatchlistService;
  private chatId: string;

  constructor(botToken: string, chatId: string, watchlistService: WatchlistService) {
    this.bot = new Telegraf(botToken);
    this.chatId = chatId;
    this.watchlistService = watchlistService;
    this.setupCommands();
  }

  private setupCommands(): void {
    // /watch command
    this.bot.command('watch', async (ctx: Context) => {
      const args = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ') : [];
      
      if (args.length < 2) {
        await ctx.reply('Usage: /watch <contract_address>\nExample: /watch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
        return;
      }

      const contractAddress = args[1];
      const result = this.watchlistService.addContract(contractAddress);
      
      await ctx.reply(result.message);
    });

    // /unwatch command
    this.bot.command('unwatch', async (ctx: Context) => {
      const args = ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ') : [];
      
      if (args.length < 2) {
        await ctx.reply('Usage: /unwatch <contract_address>\nExample: /unwatch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
        return;
      }

      const contractAddress = args[1];
      const result = this.watchlistService.removeContract(contractAddress);
      
      await ctx.reply(result.message);
    });

    // /list command
    this.bot.command('list', async (ctx: Context) => {
      const watchlist = this.watchlistService.getWatchlist();
      
      if (watchlist.length === 0) {
        await ctx.reply('No contracts are currently being watched.\nUse /watch <contract_address> to add one.');
        return;
      }

      let message = '📋 **Current Watchlist:**\n\n';
      watchlist.forEach((item, index) => {
        const addedDate = item.addedAt.toLocaleDateString();
        const lastAlert = item.lastAlert ? `\nLast alert: ${item.lastAlert.toLocaleString()}` : '';
        message += `${index + 1}. \`${item.contractAddress}\`\nAdded: ${addedDate}${lastAlert}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
    });

    // /help command
    this.bot.command('help', async (ctx: Context) => {
      const helpMessage = `
        🤖 **Solana Liquidity Bot Commands:**

        /watch <contract_address> - Add a contract to watchlist
        /unwatch <contract_address> - Remove a contract from watchlist
        /list - Show current watchlist
        /help - Show this help message

        **Example:**
        /watch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

        **Supported DEXs:**
        • Raydium AMM/CPMM
        • Meteora DLMM

        The bot will alert you when liquidity is added to pools containing your watched contracts.
      `;
      
      await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    });

    // Start command
    this.bot.command('start', async (ctx: Context) => {
      const welcomeMessage = `
        🚀 **Welcome to Solana Liquidity Bot!**

        I monitor Solana contract addresses and alert you when liquidity is added to pools on Raydium and Meteora.

        **Quick Start:**
        1. Use /watch contract_address to add a contract
        2. I'll monitor for pool creation and liquidity events
        3. Get instant alerts when your contracts get liquidity

        Use /help for more commands.
      `;
      
      await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    });
  }

  async sendLiquidityAlert(alert: LiquidityAlert): Promise<void> {
    try {
      const message = `
        🚨 **Liquidity Alert!**

        **Contract:** \`${alert.contractAddress}\`
        **DEX:** ${alert.dex.toUpperCase()}
        **Pool:** \`${alert.poolAddress}\`

        **Tokens:**
        • ${alert.tokenA}: ${alert.liquidityA.toLocaleString()}
        • ${alert.tokenB}: ${alert.liquidityB.toLocaleString()}

        **Time:** ${alert.timestamp.toLocaleString()}

        🔗 [View on Solscan](https://solscan.io/account/${alert.poolAddress})
      `;

      await this.bot.telegram.sendMessage(this.chatId, message, { 
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true }
      });

      console.log(`Liquidity alert sent for ${alert.contractAddress}`);
    } catch (error) {
      console.error('Error sending liquidity alert:', error);
    }
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.telegram.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  launch(): void {
    this.bot.launch();
    console.log('Telegram bot launched successfully');
    
    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}
