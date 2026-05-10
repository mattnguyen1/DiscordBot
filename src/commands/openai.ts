import OpenAI from "openai";
import { env } from "../config.js";
import { truncateForDiscord } from "../lib/http.js";
import type { Command } from "../types/command.js";

function client() {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export const llmCommand: Command = {
  name: "llm",
  usage: "llm <prompt>",
  description: "Asks ChatGPT a question.",
  loadingText: "🤔 Thinking…",
  async run({ args }) {
    if (!args.trim()) return "Usage: llm <prompt>";
    const response = await client().chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: "You are Bro, a concise and helpful Discord bot. Keep replies short unless the user asks for detail." },
        { role: "user", content: args },
      ],
    });
    return truncateForDiscord(response.choices[0]?.message?.content || "No response.");
  },
};

export const aiCommand: Command = {
  name: "ai",
  usage: "ai <image prompt>",
  description: "Generates an image with OpenAI.",
  loadingText: "🎨 Generating image…",
  async run({ args }) {
    if (!args.trim()) return "Usage: ai <image prompt>";
    const response = await client().images.generate({
      model: "dall-e-3",
      prompt: args,
      n: 1,
      size: "1024x1024",
    });
    return response.data?.[0]?.url || "No image returned.";
  },
};
