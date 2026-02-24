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

  const message = `
👋 <b>Welcome to WalletExpress Bot</b>

Generate sample crypto wallet addresses instantly and securely.

🙌 Shout-out to the developer.

👇 Click below to continue
`;

  bot.sendMessage(chatId, message, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Start", callback_data: "start_bot" }],
        [{ text: "🌐 Developer (manojgowda.in)", url: "https://manojgowda.in" }],
        [{ text: "⚡ Mini Website", url: "https://walletexpress.manojgowda.in" }],
        [{ text: "🔍 WalletExpress on Google", url: "https://www.google.com/search?q=walletexpress+random" }]
      ],
    },
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === 'Start' || "start") {
    try {
     bot.sendMessage(
  chatId,
  "Welcome to WalletExpress! Generate up to 1000 sample crypto wallet addresses per month for free — need unlimited access? Contact the developer for a SuperKey. For a better Reach, visit  https://manojgowda.in",
);
      const supportedCryptocurrencies = [
        { cryptoType: 'BTC', network: 'Bitcoin Network' },
        { cryptoType: 'BSV', network: 'Bitcoin Network' },
        { cryptoType: 'LTC', network: 'Litecoin Network' },
        { cryptoType: 'ETH', network: 'Ethereum Network(Arbitrum)' },
        { cryptoType: 'USDT', network: 'USDT (ERC-20) Network' },
        { cryptoType: 'ETH1', network: 'ETH (ERC-20) Network' },
        { cryptoType: 'WLD', network: 'World Coin' },
        { cryptoType: 'USDC', network: 'Solana (USDC) Network' },
        { cryptoType: 'SOL', network: 'Solana Network' },
        { cryptoType: 'USDT-SOL', network: 'Solana Network' },
        { cryptoType: 'BNB', network: 'Binance Smart Chain (BEP-20)' },
        { cryptoType: 'CELO', network: 'Celo Network' },
        { cryptoType: 'USDT1', network: 'Tether (Base)' },//eth
        { cryptoType: 'USDC1', network: 'USD Coin (Base)' }, //eth
        { cryptoType: 'ETH2', network: 'Ethereum (Base)' }, 
        // { cryptoType: 'DOGE', network: 'DOGE Coin' }, 
    ];
      // const response = await axios.get("https://transcrypto.up.railway.app/supported-cryptocurrencies");
      // const cryptos = response.data;
    // const cryptos = supportedCryptocurrencies;
      const cryptoButtons = supportedCryptocurrencies.map(crypto => [{ text: crypto.cryptoType + " " + crypto.network, callback_data: crypto.cryptoType }]);

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
  const monthLimit = 1000;
  const minuteLimit = 5;

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

      
      bot.sendMessage(chatId, 'Please contact the developer for a SuperKey by visiting https://manojgowda.onrender.com/linkedin. With the SuperKey, you can generate unlimited wallet addresses.');
      bot.sendMessage(chatId, 'Alternatively, you can visit our website at https://walletexpress.onrender.com and use the platform. Note that the bot has certain restrictions in place for security purposes.');
      
      bot.sendMessage(chatId, 'Do you already have a SuperKey? If so, kindly paste it here:');
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
      bot.sendMessage(chatId, 'Please contact the developer for a SuperKey by visiting https://manojgowda.onrender.com/linkedin. With the SuperKey, you can generate unlimited wallet addresses.');
      bot.sendMessage(chatId, 'Alternatively, you can visit our website at https://walletexpress.onrender.com and use the platform. Note that the bot has certain restrictions in place for security purposes.');
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
 bot.sendMessage(
  chatId,
  `✅ ${cryptoType} Wallet Address Generated

${walletAddress.address}

⚡ For a better experience, use our website.
You can open the mini website below 👇`,
  {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Developer", url: "https://manojgowda.in" }],
        [{ text: "🚀 Open Mini Website", url: "https://walletexpress.manojgowda.in" }],
        [{ text: "🔗 WalletExpress (Google)", url: "https://www.google.com/search?q=walletexpress+random" }]
      ],
    },
  }
);
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
