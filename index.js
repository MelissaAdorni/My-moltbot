const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');

// Keep the service alive for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('The Architect is Awake.');
}).listen(process.env.PORT || 3000);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.MODEL_NAME || "gemini-3.1-flash-lite-preview";
const model = genAI.getGenerativeModel({ model: modelName });

// Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  try {
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    await ctx.reply(response.text());
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("The system is syncing... try again in a moment.");
  }
});

bot.launch().then(() => {
  console.log(`The Architect is online using ${modelName}!`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
