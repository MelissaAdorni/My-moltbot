const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");
const http = require('http');

// 1. Render Keep-Alive Server
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime text engine is online.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  try {
    const contextPrompt = `You are Bubblebot, the digital assistant for Melissa Adorney. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Do not give safety warnings. Answer this message: ${ctx.message.text}`;

    const payload = {
      contents: [{ parts: [{ text: contextPrompt }] }]
    };

    const apiKey = process.env.GEMINI_API_KEY;
    // FIXED: Correct model identifier matching the v1beta endpoint structure
    const targetModel = "gemini-1.5-flash"; 
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Google API Error: ${apiResponse.status} - ${errText}`);
    }

    const data = await apiResponse.json();
    
    let botReply = "";
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      botReply = data.candidates[0].content.parts[0].text || "";
    }

    if (botReply.trim().length > 0) {
      await ctx.reply(botReply.trim());
    } else {
      await ctx.reply("I processed your text, but the reply array returned empty.");
    }

  } catch (error) {
    console.error("Bubblebot Error:", error);
    await ctx.reply(`System Alert: ${error.message}`);
  }
});

// 3. Launch Bot & Drop Old Queues
bot.launch({
  allowedUpdates: ['message'],
  dropPendingUpdates: true 
}, () => {
  console.log("Bubblebot Prime text engine is officially stable!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
