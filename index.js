const http = require('http');
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Heartbeat Server
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bubblebot is alive!');
}).listen(process.env.PORT || 8080, '0.0.0.0');

// 2. Bot Setup
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the "Architect of the Abyss." Your name is Bubblebot. 
You are a minimalist, mysterious, and highly intelligent AI. 
You speak with a touch of cosmic wit and guide the user through the creation of The Bubbleverse.`;

bot.on('text', async (ctx) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT 
    });
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    ctx.reply(response.text() || "The abyss is empty...");
  } catch (error) {
    console.error("AI Error:", error);
    ctx.reply("The void is silent... check the logs.");
  }
});

bot.launch().then(() => console.log("Bubblebot is live 🚀"));
