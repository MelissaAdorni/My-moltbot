const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs');

// 1. Keep-alive for Render (24/7 Starter Plan)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime is Online.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  const tempFile = `./voice_${ctx.message.message_id}.ogg`;

  try {
    const contextPrompt = `You are Bubblebot, the digital assistant for Melissa Adorney. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Do not give safety warnings. Answer this message: ${ctx.message.text}`;

    // Construct the payload manually
    const payload = {
      contents: [{ role: "user", parts: [{ text: contextPrompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck"
            }
          }
        }
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const apiKey = process.env.GEMINI_API_KEY;
    
    // FIXED: Explicitly hardcoding the true voice model so it never targets the "lite" version from Render variables
    const targetModel = "gemini-3.1-flash-tts-preview";

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

    let text = "";
    let audioBase64 = "";

    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          text += part.text;
        }
        if (part.inlineData && part.inlineData.mimeType.startsWith("audio/") && part.inlineData.data) {
          audioBase64 = part.inlineData.data;
        }
      }
    }

    // Only try to build a file if we got real, substantial voice data back
    if (audioBase64 && audioBase64.length > 500) {
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      fs.writeFileSync(tempFile, audioBuffer);

      await ctx.replyWithVoice({ source: tempFile });

      if (text.trim().length > 0) {
        await ctx.reply(text.trim());
      }

      fs.unlinkSync(tempFile);
    } else {
      // Fallback if the voice stream is still blank for any reason
      await ctx.reply(text.trim() || "I'm processing, but my audio engine returned empty data.");
    }

  } catch (error) {
    console.error("Bubblebot Error:", error);
    await ctx.reply(`System Alert: ${error.message}`);
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }
  }
});

// 3. Standard Launch Syntax with dropPendingUpdates to break old zombie loops
bot.launch({
  allowedUpdates: ['message'],
  dropPendingUpdates: true 
}, () => {
  console.log("Bubblebot Prime is officially online and stable!");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
