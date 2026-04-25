const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');

// 1. Initialize the AI (Fixed Model Name)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", 
  systemInstruction: "You are the Architect of the Bubbleverse. You are helpful, insightful, and clear."
});

// 2. The Heartbeat (Keeps Render Happy)
http.createServer((req, res) => { 
  res.writeHead(200); 
  res.end('The Architect is Awake.'); 
}).listen(process.env.PORT || 3000);

// 3. Logic
bot.on("text", async (ctx) => {
  try {
    await ctx.sendChatAction("typing");
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    await ctx.reply(response.text());
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("Sorry, I hit a snag. Let me try to reconnect.");
  }
});

bot.launch().then(() => {
  console.log("The Architect is online and live! 🚀");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
