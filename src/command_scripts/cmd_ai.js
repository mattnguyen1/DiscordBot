/**
 * @file cmd_img
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const OpenAi = require("openai");
const conf = require("../config");
const request = require("request");

// ---------------------------------
// Private
// ---------------------------------

const openai = new OpenAi();
const DEFAULT_LLM_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DISCORD_MESSAGE_LIMIT = 1900;

function truncateForDiscord(text) {
  if (!text || text.length <= DISCORD_MESSAGE_LIMIT) {
    return text;
  }

  return text.slice(0, DISCORD_MESSAGE_LIMIT - 20) + "\n…[truncated]";
}

/**
 * Generates an open ai image
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _genImage = async (options, message, callback) => {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: message.content,
      n: 1,
      size: "1024x1024",
    });
    const image_url = response.data[0].url;
    callback(image_url);
  } catch (e) {
    console.log("ai error", e);
    callback("Error generating image: " + e.error.message);
  }
};

let _llm = async (options, message, callback) => {
  const prompt = message.content && message.content.trim();
  if (!prompt) {
    callback("Usage: llm <prompt>");
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_LLM_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Bro, a concise and helpful Discord bot. Keep replies short unless the user asks for detail.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const reply = response.choices[0].message.content || "No response.";
    callback(truncateForDiscord(reply));
  } catch (e) {
    console.log("llm error", {
      message: e.message,
      status: e.status,
      code: e.code,
      type: e.type,
    });
    callback("Error asking ChatGPT: " + (e.message || "unknown error"));
  }
};

module.exports = {
  ai: {
    run: _genImage,
    usage: "ai <query>",
    description: "Returns an ai generated image based on query.",
  },
  llm: {
    run: _llm,
    usage: "llm <prompt>",
    description: "Asks ChatGPT a question.",
  },
};
