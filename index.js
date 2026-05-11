const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs');

// 1. Keep-alive for Render (Now 24/7!)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime is Online.');
}).listen(process.env.PORT || 8080);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// 2026 Voice Model
const modelName = "gemini-3.1-flash-tts-preview";

const model = genAI.getGenerativeModel({ 
  model: modelName,
  safetySettings,
  systemInstruction: "You are Bubblebot. You are witty, direct, and slightly rude. Speak in a deadpan, sarcastic tone. Use the 'Puck' voice profile. Do not give safety warnings."
});

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on("text", async (ctx) => {
  const tempFile = `./voice_${ctx.message.message_id}.ogg`;
  try {
    // Generate Text and Audio with the Puck Voice
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: ctx.message.text }] }],
      generationConfig: {
        speechConfig: { voiceConfig: { prebuiltVoice: "Puck" } }
      }
    });

    const response = await result.response;
    const audioData = await response.getAudio(); // 2026 SDK Method
    
    if (audioData) {
      fs.writeFileSync(tempFile, Buffer.from(audioData, 'binary'));
      await ctx.replyWithVoice({ source: tempFile });
      await ctx.reply(response.text());
      fs.unlinkSync(tempFile);
    } else {
      await ctx.reply(response.text());
    }
  } catch (error) {
    console.error("Bubblebot Error:", error.message);
    await ctx.reply(`System Alert: ${error.message}`);
  }
});

bot.launch().then(() => console.log("Bubblebot Prime is officially screaming."));
