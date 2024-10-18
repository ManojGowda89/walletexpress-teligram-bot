const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require("dotenv").config();
const { generateWalletAddress } = require("./walletGeneration.js");
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: false });

const app = express();
const port = process.env.PORT || 3000;

const webhookURL = process.env.URL;

app.use(bodyParser.json());

const requestLogs = new Map();

async function setWebhook() {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookURL}/bot${token}`);
    console.log('Webhook setup response:', response.data);
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

setWebhook();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Press "Start" to fetch supported cryptocurrencies.', {
    reply_markup: {
      keyboard: [[{ text: 'Start' }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === 'Start' || "start") {
    try {
      const response = await axios.get("https://transcrypto.up.railway.app/supported-cryptocurrencies");
      const cryptos = response.data;

      const cryptoButtons = cryptos.map(crypto => [{ text: crypto.cryptoType + " " + crypto.network, callback_data: crypto.cryptoType }]);

      bot.sendMessage(chatId, 'Please choose a cryptocurrency:', {
        reply_markup: {
          inline_keyboard: cryptoButtons,
        },
      });
    } catch (error) {
      bot.sendMessage(chatId, 'Failed to fetch cryptocurrencies. Please try again later.');
      console.error('Error fetching cryptocurrencies:', error);
    }
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const cryptoType = query.data;
  const ip = query.from.id;

  const now = Date.now();
  const monthLimit = 30;
  const minuteLimit = 3;

  if (!requestLogs.has(ip)) {
    requestLogs.set(ip, { timestamps: [], walletCount: 0, hasSuperkey: false });
  }

  const userLogs = requestLogs.get(ip);
  const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
  const minuteAgo = now - (60 * 1000);

  userLogs.timestamps = userLogs.timestamps.filter(ts => ts > minuteAgo);
  userLogs.walletCount = userLogs.timestamps.filter(ts => ts > monthAgo).length;


  const superkeys = ['dsfujshfuhswufd', 'dfushehufhth', 'dhrtewhehrthr'];

  if (!userLogs.hasSuperkey) {
    if (userLogs.walletCount >= monthLimit) {
      bot.sendMessage(chatId, `Monthly limit reached. You can generate only ${monthLimit} wallet addresses per month.`);

      
      bot.sendMessage(chatId, 'Do you have a superkey? If you do, paste it here:');
      bot.sendMessage(chatId, 'Contact Developer for SuperKey https://manojgowda.onrender.com/linkedin  with superKey You Can Generate unlimited WalletAddress');
     
      bot.once('message', (msg) => {
        const userInput = msg.text;
        
      
        if (superkeys.includes(userInput)) {
          bot.sendMessage(chatId, 'Superkey accepted! You can now generate unlimited wallet addresses.');
          userLogs.hasSuperkey = true;
        } else {
          bot.sendMessage(chatId, 'Invalid superkey. You are still subject to the monthly limit.');
        }
      });

      requestLogs.set(ip, userLogs);
      return;
    }

    if (userLogs.timestamps.length >= minuteLimit) {
      bot.sendMessage(chatId, `Rate limit reached. You can generate only ${minuteLimit} wallet addresses per minute.`);
      
    
      bot.sendMessage(chatId, 'Do you have a superkey? If you do, paste it here:');
      
    
      bot.once('message', (msg) => {
        const userInput = msg.text;
        
    
        if (superkeys.includes(userInput)) {
          bot.sendMessage(chatId, 'Superkey accepted! You can now generate unlimited wallet addresses.');
          userLogs.hasSuperkey = true; 
        } else {
          bot.sendMessage(chatId, 'Invalid superkey. You are still subject to the rate limit.');
        }
      });

      requestLogs.set(ip, userLogs);
      return;
    }
  }

  
  try {
    const walletAddress = await generateWalletAddress(cryptoType);
    userLogs.timestamps.push(now);
    bot.sendMessage(chatId, `Generated wallet address for ${cryptoType}: ${walletAddress.address}`);
  } catch (error) {
    bot.sendMessage(chatId, `Failed to generate wallet address for ${cryptoType}.`);
    console.error('Error generating wallet address:', error);
  }

  requestLogs.set(ip, userLogs);
});

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


app.get('*', (req, res) => {
  res.send('Telegram bot is running with webhooks!');
});

app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
});
