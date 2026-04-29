const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');

// 1. Keep the service alive for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot is Awake.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.MODEL_NAME || "gemini-3.1-flash-lite-preview";
const model = genAI.getGenerativeModel({ model: modelName });

// 3. Initialize Telegram Bot (using Telegraf)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log(`Starting Bubblebot with model: ${modelName}`);

bot.on("text", async (ctx) => {
  try {
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    await ctx.reply(response.text());
  } catch (error) {
    console.error("Gemini Error:", error.message);
    await ctx.reply("Sorry, my brain is a bit foggy. Try again in a second!");
  }
});

// 4. Launch the bot
bot.launch().then(() => {
  console.log("Bubblebot is officially online!");
}).catch((err) => {
  console.error("Failed to launch bot:", err);
});

// Graceful stop for Render
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
