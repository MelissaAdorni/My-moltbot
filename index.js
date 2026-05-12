const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs');

// 1. Keep-alive for Render (Stay awake 24/7 on Starter Plan)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot Prime is Online.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Paid Tier: Lowering all safety filters
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Set model to the TTS-specific version
const modelName = process.env.MODEL_NAME || "gemini-3.1-flash-tts-preview";

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
    // Generate Content with the 'Puck' voice config
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: ctx.message.text }] }],
      generationConfig: {
        speechConfig: {
          voiceConfig: {
            voiceName: "Puck" // Fixed: API changed from prebuiltVoice to voiceName
          }
        }
      }
    });

    const response = await result.response;
    const text = response.text();

    // Pull the audio data from the response
    const audioData = await response.getAudio(); 
    
    if (audioData) {
      // Save binary audio to a temporary file
      fs.writeFileSync(tempFile, Buffer.from(audioData, 'binary'));

      // Send the voice message first, then the text transcript
      await ctx.replyWithVoice({ source: tempFile });
      await ctx.reply(text);

      // Clean up the file to keep Render's disk clean
      fs.unlinkSync(tempFile);
    } else {
      await ctx.reply(text);
    }

  } catch (error) {
    console.error("Bubblebot Error:", error.message);
    // Reporting the real error so we can fix it if it breaks again
    await ctx.reply(`System Alert: ${error.message}`);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

// 4. Launch the Bot
bot.launch().then(() => {
  console.log("Bubblebot Prime is officially online and speaking!");
}).catch((err) => {
  console.error("Failed to launch bot:", err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
