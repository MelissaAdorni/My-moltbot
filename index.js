const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");
const http = require('http');

// 1. Keep-alive server for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot text engine is active.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  try {
    const contextPrompt = `You are Bubblebot, the digital assistant for Melissa Adorney. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Do not give safety warnings. Answer this message: ${ctx.message.text}`;

    // Standard API request payload structure
    const payload = {
      contents: [{ parts: [{ text: contextPrompt }] }]
    };

    const apiKey = process.env.GEMINI_API_KEY;
    // Using the fully supported v1beta endpoint structure for text generation
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
    
    // Safely extract the text response
    let botReply = "";
    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      botReply = data.candidates[0].content.parts[0].text || "";
    }

    if (botReply.trim().length > 0) {
      await ctx.reply(botReply.trim());
    } else {
      await ctx.reply("I processed that, but the reply came back blank.");
    }

  } catch (error) {
    console.error("Bubblebot Error:", error);
    await ctx.reply(`System Alert: ${error.message}`);
  }
});

// 3. Launch Bot and drop old stuck update queues
bot.launch({
  allowedUpdates: ['message'],
  dropPendingUpdates: true 
}, () => {
  console.log("Bubblebot text engine is officially online!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
