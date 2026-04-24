const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");

// 1. Initialize the AI with your API Key from Render's Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Initialize the Telegram Bot with your Token from Render's Environment Variables
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 3. Set the model to 1.5 Flash (the stable version)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest",
  systemInstruction: "You are the Architect of the Bubbleverse. You are helpful, insightful, and clear."
});

// 4. Handle incoming messages
bot.on("text", async (ctx) => {
  try {
    // Show the bot is "typing" so users know it's working
    await ctx.sendChatAction("typing");

    const prompt = ctx.message.text;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    await ctx.reply(text);
  } catch (error) {
    console.error("Error:", error);
    // This helps you see in the Render logs if there's still a billing issue
    if (error.message.includes("quota")) {
      await ctx.reply("I'm resting my brain for a moment (Quota Limit). Try again in a minute!");
    } else {
      await ctx.reply("Sorry, I hit a snag. Let me try to reconnect.");
    }
  }
});

// 5. Launch the bot
bot.launch().then(() => {
  console.log("The Architect is online and live! 🚀");
});

// Enable graceful stop for Render
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
