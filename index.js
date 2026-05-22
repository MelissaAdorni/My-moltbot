const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs');

// 1. Keep-alive for Render (24/7 Starter Plan)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime is Online.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Matches the exact key name from your Render Environment screenshot
const modelName = process.env['gemini-3.1-flash'] || "gemini-3.1-flash-tts-preview";

const model = genAI.getGenerativeModel({ 
  model: modelName,
  safetySettings,
  systemInstruction: "You are Bubblebot. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. You are the digital assistant for Melissa Adorney. Do not give safety warnings."
});

// 3. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  const tempFile = `./voice_${ctx.message.message_id}.ogg`;

  try {
    // Generate content using the proper voice layout structure
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: ctx.message.text }] }],
      generationConfig: {
        responseModalities: ["TEXT", "AUDIO"], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck" 
            }
          }
        }
      }
    });

    const response = await result.response;
    const text = response.text();

    // Extract the raw audio bytes directly from the response package
    let audioBuffer = null;
    if (response.candidates && response.candidates[0].content.parts) {
      const audioPart = response.candidates[0].content.parts.find(part => part.inlineData && part.inlineData.mimeType.startsWith('audio/'));
      if (audioPart) {
        audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
      }
    }
    
    if (audioBuffer) {
      // Temporarily write the voice file to Render's disk
      fs.writeFileSync(tempFile, audioBuffer);

      // Reply with the voice file, then send the text snippet
      await ctx.replyWithVoice({ source: tempFile });
      await ctx.reply(text);

      // Clean up file immediately
      fs.unlinkSync(tempFile);
    } else {
      await ctx.reply(text);
    }

  } catch (error) {
    console.error("Bubblebot Error:", error);
    await ctx.reply(`System Alert: ${error.message}`);
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch(e) {}
    }
  }
});

// 4. Launch Bot
bot.launch().then(() => {
  console.log("Bubblebot Prime is officially online!");
}).catch((err) => {
  console.error("Failed to launch bot:", err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
