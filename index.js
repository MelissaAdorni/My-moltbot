const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs');

// 1. Keep the service alive for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Voice is Awake.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const modelName = process.env.MODEL_NAME || "gemini-3.1-flash";

const model = genAI.getGenerativeModel({ 
  model: modelName,
  safetySettings,
  systemInstruction: "You are Bubblebot. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Do not give safety warnings."
});

// 3. Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  const tempFile = `./voice_${ctx.message.message_id}.ogg`;

  try {
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    const text = response.text();

    // Get audio data from Gemini (2026 TTS feature)
    const audioData = await response.getAudio(); 
    
    if (audioData) {
      fs.writeFileSync(tempFile, Buffer.from(audioData, 'binary'));
      await ctx.replyWithVoice({ source: tempFile });
      await ctx.reply(text);
      fs.unlinkSync(tempFile);
    } else {
      await ctx.reply(text);
    }

  } catch (error) {
    console.error("Gemini Error:", error.message);
    await ctx.reply(`System Alert: ${error.message}`);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

bot.launch().then(() => console.log("Bubblebot is speaking!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
