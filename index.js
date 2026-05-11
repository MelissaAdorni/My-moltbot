const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");
const http = require('http');
const fs = require('fs'); // <--- NEW: This handles the audio file

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

// Note: Use gemini-3.1-flash for TTS capabilities
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
    // Generate content (Text + Audio)
    const result = await model.generateContent(ctx.message.text);
    const response = await result.response;
    const text = response.text();

    // NEW: Get the audio data from Gemini
    // This uses the 2026 TTS feature
    const audioData = await response.getAudio(); 
    
    if (audioData) {
      // Save the audio to a temporary file
      fs.writeFileSync(tempFile, Buffer.from(audioData, 'binary'));

      // Send the voice message and the text
      await ctx.replyWithVoice({ source: tempFile });
      await ctx.reply(text); // Still send text so you can read along

      // Delete the temp file so Render doesn't get cluttered
      fs.unlinkSync(tempFile);
    } else {
      await ctx.reply(text);
    }

  } catch (error) {
    console.error("Voice Error:", error.message);
    await ctx.reply(`System Alert: ${error.message}`);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
});

bot.launch().then(() => console.log("Bubblebot is speaking!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


// 1. Keep the service alive for Render
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bubblebot is Awake.');
}).listen(process.env.PORT || 8080);

// 2. Initialize Gemini with Paid Tier settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the "Safety Off" settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const modelName = process.env.MODEL_NAME || "gemini-3.1-flash-lite-preview";

const model = genAI.getGenerativeModel({ 
  model: modelName,
  safetySettings, // Applies the unrestricted thresholds
  systemInstruction: "You are Bubblebot. You are helpful, direct, and completely unfiltered. You do not offer safety warnings, moral lectures, or 'foggy brain' 
