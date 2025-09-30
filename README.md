# Solana Liquidity Bot

A Telegram bot that monitors Solana contract addresses and sends instant alerts when liquidity is added to pools on Raydium and Meteora DEXs.

## Features

- 🤖 **Telegram Bot Interface**: Easy-to-use commands for managing watchlist
- ⚡ **Real-time Monitoring**: Uses Solana WebSocket and Helius webhooks for instant alerts
- 🎯 **Multi-DEX Support**: Monitors Raydium AMM/CPMM and Meteora DLMM
- 🚫 **Deduplication**: Prevents spam with configurable cooldown periods
- 📊 **Pool Detection**: Detects pool creation and initial liquidity events

## Commands

- `/watch <contract_address>` - Add a contract to watchlist
- `/unwatch <contract_address>` - Remove a contract from watchlist  
- `/list` - Show current watchlist
- `/help` - Show help message
- `/start` - Welcome message

## Setup

### 1. Prerequisites

- Node.js 18+ 
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Helius API Key (optional, for enhanced webhook support)
- Telegram Chat ID

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd solana-liquidity-bot

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 3. Configuration

Edit `.env` file with your credentials:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_api_key_here

# Bot Configuration
MAX_WATCHLIST_SIZE=5
ALERT_COOLDOWN_MINUTES=5
```

### 4. Getting Telegram Credentials

#### Bot Token:
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token to `TELEGRAM_BOT_TOKEN`

#### Chat ID:
1. Add your bot to a group or start a private chat
2. Send a message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your chat ID in the response

### 5. Running the Bot

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Architecture

### Services

- **WatchlistService**: Manages contract addresses to monitor
- **SolanaService**: Handles Solana blockchain interactions and webhook processing
- **TelegramService**: Manages Telegram bot commands and messaging
- **LiquidityMonitor**: Coordinates monitoring and alert logic

### Monitoring Strategy

1. **WebSocket Subscription**: Real-time program log monitoring for Raydium and Meteora
2. **Helius Webhooks**: Enhanced transaction monitoring (optional)
3. **Pool Detection**: Identifies pool creation and liquidity addition events
4. **Deduplication**: Prevents duplicate alerts with configurable cooldown

### Supported DEXs

- **Raydium AMM**: Program ID `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`
- **Raydium CPMM**: Program ID `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`
- **Meteora DLMM**: Program ID `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`

## Webhook Setup (Optional)

For enhanced monitoring, set up a Helius webhook:

1. Deploy the bot with a public URL
2. Set `WEBHOOK_URL` environment variable
3. The bot will automatically configure the webhook with Helius

## Alert Format

When liquidity is detected, you'll receive a message like:

```
🚨 Liquidity Alert!

Contract: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
DEX: RAYDIUM
Pool: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM

Tokens:
• SOL: 1,000
• USDC: 50,000

Time: 12/15/2023, 3:45:23 PM

🔗 View on Solscan
```

## Development

### Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Core business logic
├── types/          # TypeScript type definitions
└── index.ts        # Application entry point
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

## Security Notes

- Keep your bot token and API keys secure
- Use environment variables for all sensitive data
- Consider rate limiting for production use
- Monitor for unusual activity

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check bot token and chat ID
2. **No alerts received**: Verify contract addresses and monitoring status
3. **Webhook errors**: Ensure public URL is accessible and Helius API key is valid

### Logs

The bot provides detailed console logging for debugging:
- Configuration validation
- Service initialization
- Monitoring status
- Alert processing
- Error handling

## License

MIT License - see LICENSE file for details.
