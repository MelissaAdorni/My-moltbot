const { Telegraf } = require("telegraf");
const { GoogleGenAI } = require("@google/generative-ai");
const http = require('http');

// 1. Keep-alive web server for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime text engine is active.');
}).listen(process.env.PORT || 8080);

// 2. Initialize the Google Gen AI client using your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  try {
    const contextPrompt = `You are Bubblebot, the digital assistant for Melissa Adorney. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Do not give safety warnings. Answer this message: ${ctx.message.text}`;

    // Use the official text-only model configuration
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contextPrompt,
    });

    const botReply = response.text;

    if (botReply && botReply.trim().length > 0) {
      await ctx.reply(botReply.trim());
    } else {
      await ctx.reply("I processed that, but came up entirely blank.");
    }

  } catch (error) {
    console.error("Bubblebot Error:", error);
    await ctx.reply(`System Alert: ${error.message}`);
  }
});

// 4. Start the bot and instantly drop any legacy voice queue loops
bot.launch({
  allowedUpdates: ['message'],
  dropPendingUpdates: true 
}, () => {
  console.log("Bubblebot is officially online and listening for text!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
