// Simple test script to verify bot functionality
const axios = require('axios');

async function testBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment');
    console.log('Please set these in your .env file');
    return;
  }

  console.log('🤖 Testing Telegram Bot...');
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Chat ID: ${chatId}`);

  try {
    // Test 1: Get bot info
    console.log('\n📋 Test 1: Getting bot info...');
    const botInfo = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    console.log('✅ Bot info retrieved:', botInfo.data.result.username);

    // Test 2: Send test message
    console.log('\n📤 Test 2: Sending test message...');
    const testMessage = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: '🧪 Test message from Solana Liquidity Bot!\n\nIf you see this, the bot is working correctly!',
      parse_mode: 'Markdown'
    });
    console.log('✅ Test message sent successfully');

    // Test 3: Get updates
    console.log('\n📥 Test 3: Getting recent updates...');
    const updates = await axios.get(`https://api.telegram.org/bot${botToken}/getUpdates`);
    console.log(`✅ Found ${updates.data.result.length} recent updates`);

    console.log('\n🎉 All tests passed! Your bot is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Start your bot with: npm run dev');
    console.log('2. Send /start to your bot in Telegram');
    console.log('3. Try the commands: /help, /watch, /list');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This usually means your bot token is incorrect.');
    } else if (error.response?.status === 400) {
      console.log('\n💡 This usually means your chat ID is incorrect or you haven\'t started a chat with the bot yet.');
    }
  }
}

// Load environment variables
require('dotenv').config();

// Run the test
testBot();
