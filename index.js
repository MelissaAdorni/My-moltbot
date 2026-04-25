const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');

// This keeps Render happy
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('The Architect is Awake.');
}).listen(process.env.PORT || 3000);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// FIXED MODEL NAME HERE
const model = genAI.getGenerativeModel({ 
model: "models/gemini-1.5-flash"
 
}, { apiVersion: 'v1' });


bot.on("text", async (ctx) => {
  try {
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    await ctx.reply(response.text());
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("The system is syncing. Try one more time in a second!");
  }
});

bot.launch().then(() => {
  console.log("The Architect is online! 🚀");
});
