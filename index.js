const http = require('http');
const port = process.env.PORT || 8080;

// 1. Heartbeat Server for Render
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bubblebot is alive!');
}).listen(port, '0.0.0.0', () => {
  console.log(`Heartbeat server listening on port ${port}`);
});

// 2. Bot Setup
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are the "Architect of the Abyss." 
Your name is Bubblebot. 
You are a minimalist, mysterious, and highly intelligent AI. 
You speak with a touch of cosmic wit and guide the user through the creation of The Bubbleverse.`;

bot.on('text', async (ctx) => {
  try {
    // Access Gemini 1.5 Flash (fast and free)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT 
    });

    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    ctx.reply(response.text());

  } catch (error) {
    console.error("Error Details:", error);
    ctx.reply("The void is silent... check the logs.");
  }
});

bot.launch().then(() => console.log("Your service is live 🚀"));
