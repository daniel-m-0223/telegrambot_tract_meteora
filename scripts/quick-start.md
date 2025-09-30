# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Telegram Credentials

**Get Bot Token:**
1. Message `@BotFather` on Telegram
2. Send `/newbot`
3. Follow prompts to create your bot
4. Copy the token

**Get Chat ID:**
1. Start a chat with your new bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find your chat ID in the response

### 3. Create Environment File
```bash
cp env.example .env
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_key_here
MAX_WATCHLIST_SIZE=5
ALERT_COOLDOWN_MINUTES=5
```

### 4. Test Your Setup
```bash
npm run test-bot
```

### 5. Start the Bot
```bash
npm run dev
```

### 6. Test in Telegram
Send these commands to your bot:
- `/start` - Welcome message
- `/help` - Available commands
- `/watch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` - Add test contract
- `/list` - Show watchlist

## 🎯 What to Expect

- ✅ Bot responds to commands
- ✅ Can add/remove contracts from watchlist
- ✅ Monitors Solana blockchain in real-time
- ✅ Sends alerts when liquidity is added (when real events occur)

## 🔧 Troubleshooting

**Bot not responding?**
- Check bot token and chat ID
- Make sure you've sent a message to the bot first

**No alerts?**
- Bot only alerts on real liquidity events
- Check console logs to see monitoring status
- Try with a popular token that has frequent activity

**Need help?**
- Check `scripts/setup.md` for detailed instructions
- Look at console logs for error messages
