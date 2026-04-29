const { GoogleGenerativeAI } = require("@google/generative-ai");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// 1. Initialize Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// 2. Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We grab the name from Render. If you forget to set it, 
// we use 'gemini-3.1-flash-lite-preview' as the 2026 fallback.
const modelName = process.env.MODEL_NAME || "gemini-3.1-flash-lite-preview";
const model = genAI.getGenerativeModel({ model: modelName });

console.log(`Bubblebot is waking up using model: ${modelName}`);

// 3. Handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;

  if (!userInput) return;

  try {
    // Generate response from Gemini
    const result = await model.generateContent(userInput);
    const response = await result.response;
    const text = response.text();

    // Send the AI response back to Telegram
    bot.sendMessage(chatId, text);
  } catch (error) {
    console.error("Gemini Error:", error.message);
    bot.sendMessage(chatId, "Sorry, my brain is a bit foggy. Try again in a second!");
  }
});

// Error handling for the bot
bot.on("polling_error", (error) => {
  console.log("Telegram Polling Error:", error.code); 
});
