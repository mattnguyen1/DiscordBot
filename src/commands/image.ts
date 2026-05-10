import { apiUrls, env } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface BraveImageResult {
  url?: string;
  properties?: { url?: string };
  image?: { src?: string };
  thumbnail?: { src?: string };
}
interface BraveImageResponse { results?: BraveImageResult[] }
interface GoogleImageResponse { items?: Array<{ link?: string }> }

function pickImageUrl(results: BraveImageResult[]) {
  const chosen = results[Math.floor(Math.random() * results.length)];
  return chosen?.properties?.url || chosen?.image?.src || chosen?.thumbnail?.src || chosen?.url;
}

export const imageCommand: Command = {
  name: "image",
  aliases: ["i"],
  usage: "image <query>",
  description: "Returns a random image search result.",
  loadingText: "🔎 Searching images…",
  async run({ args }) {
    if (!args.trim()) return "Usage: image <query>";

    if (env.BRAVE_SEARCH_API_KEY) {
      const params = new URLSearchParams({ q: args, safesearch: "strict" });
      const body = await fetchJson<BraveImageResponse>(`${apiUrls.braveImages}?${params}`, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": env.BRAVE_SEARCH_API_KEY,
        },
      });
      const results = body.results || [];
      return results.length ? pickImageUrl(results) || "No results :(" : "No results :(";
    }

    if (!env.IMG_KEY || !env.IMG_CX) return "BRAVE_SEARCH_API_KEY or IMG_KEY/IMG_CX is not configured.";
    const params = new URLSearchParams({
      q: args,
      key: env.IMG_KEY,
      cx: env.IMG_CX,
      searchType: "image",
      fileType: "jpg",
      alt: "json",
    });
    const body = await fetchJson<GoogleImageResponse>(`${apiUrls.googleImages}?${params}`);
    const items = body.items || [];
    if (!items.length) return "No results :(";
    return items[Math.floor(Math.random() * items.length)]?.link || "No results :(";
  },
};
