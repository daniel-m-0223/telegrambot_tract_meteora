# Setup Guide for Solana Liquidity Bot

## Step 1: Get Telegram Bot Token

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather
3. Send `/newbot` command
4. Follow the prompts:
   - Choose a name for your bot (e.g., "My Solana Liquidity Bot")
   - Choose a username (e.g., "my_solana_liquidity_bot")
5. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Step 2: Get Your Chat ID

### Method 1: Using Bot Commands
1. Start a chat with your bot (search for the username you created)
2. Send `/start` to your bot
3. Send any message to your bot
4. Visit this URL in your browser (replace `YOUR_BOT_TOKEN` with your actual token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
5. Look for `"chat":{"id":123456789}` in the response - that's your chat ID

### Method 2: Using @userinfobot
1. Search for `@userinfobot` on Telegram
2. Start a chat and send `/start`
3. It will show your user ID (use this as your chat ID)

## Step 3: Get Helius API Key (Optional but Recommended)

1. Go to [Helius Dashboard](https://dashboard.helius.xyz/)
2. Sign up for a free account
3. Create a new project
4. Copy your API key

## Step 4: Configure Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` file with your credentials:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   HELIUS_API_KEY=your_helius_api_key_here
   MAX_WATCHLIST_SIZE=5
   ALERT_COOLDOWN_MINUTES=5
   ```

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Test the Bot

### Development Mode (Recommended for testing)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Step 7: Test Bot Commands

1. Open Telegram and find your bot
2. Send `/start` - you should see a welcome message
3. Send `/help` - you should see available commands
4. Send `/watch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` - add a test contract
5. Send `/list` - you should see your watchlist
6. Send `/unwatch 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` - remove the contract

## Troubleshooting

### Bot not responding?
- Check if the bot token is correct
- Make sure you're messaging the right bot
- Check console logs for errors

### "Chat not found" error?
- Make sure you've sent at least one message to the bot first
- Double-check your chat ID

### No alerts received?
- The bot is monitoring real Solana transactions
- You'll only get alerts when actual liquidity events occur
- Check the console logs to see if monitoring is active

### Webhook errors?
- Helius webhook is optional
- The bot works with WebSocket monitoring alone
- Make sure your webhook URL is publicly accessible if using webhooks
