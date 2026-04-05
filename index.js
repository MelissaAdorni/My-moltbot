// 1. HEARTBEAT SERVER (Satisfies Render's Port Scan)
const http = require('http');
const port = process.env.PORT || 8080;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Bubblebot is alive!');
  res.end();
}).listen(port, '0.0.0.0', () => {
  console.log(`Heartbeat server listening on port ${port}`);
});

// 2. BOT SYSTEM INSTRUCTIONS
const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are the "Architect of the Abyss." 
Your name is Bubblebot. 
You are a minimalist, mysterious, and highly intelligent AI. 
You speak with a touch of cosmic wit and guide the user through the creation of The Bubbleverse.`;

bot.on('text', async (ctx) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: ctx.message.text }
      ],
    });
    ctx.reply(response.choices[0].message.content);
  } catch (error) {
    console.error(error);
    ctx.reply("The void is silent... check the logs.");
  }
});

bot.launch();
