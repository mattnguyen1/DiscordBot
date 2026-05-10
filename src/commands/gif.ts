import { apiUrls, env } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface GiphyResponse {
  data?: Array<{ images?: { fixed_height?: { url?: string } } }>;
}

export const gifCommand: Command = {
  name: "gif",
  aliases: ["g"],
  usage: "gif [-nsfw] <query>",
  description: "Searches Giphy and returns a random gif.",
  async run({ args, options }) {
    if (!env.GIPHY_KEY) return "GIPHY_KEY is not configured.";
    if (!args.trim()) return "Usage: gif <query>";
    const params = new URLSearchParams({
      q: args,
      limit: "25",
      fmt: "json",
      api_key: env.GIPHY_KEY,
      rating: options.nsfw ? "r" : "pg-13",
    });
    const body = await fetchJson<GiphyResponse>(`${apiUrls.giphy}?${params}`);
    const results = body.data || [];
    if (!results.length) return "No results :(";
    const chosen = results[Math.floor(Math.random() * results.length)];
    return chosen?.images?.fixed_height?.url || "No results :(";
  },
};
