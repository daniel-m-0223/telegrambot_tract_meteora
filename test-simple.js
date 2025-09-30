// Simple test to verify the bot works
require('dotenv').config();

const { Telegraf } = require('telegraf');

async function testBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment');
    console.log('Please create a .env file with your credentials');
    return;
  }

  console.log('🤖 Testing Telegram Bot...');
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Chat ID: ${chatId}`);

  try {
    const bot = new Telegraf(botToken);

    // Test message
    await bot.telegram.sendMessage(chatId, '🧪 Test message from Solana Liquidity Bot!\n\nIf you see this, the bot is working correctly!');

    console.log('✅ Test message sent successfully!');
    console.log('🎉 Your bot is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Try running: npm run dev');
    console.log('2. Send /start to your bot in Telegram');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This usually means your bot token is incorrect.');
    } else if (error.response?.status === 400) {
      console.log('\n💡 This usually means your chat ID is incorrect or you haven\'t started a chat with the bot yet.');
    }
  }
}

testBot();
