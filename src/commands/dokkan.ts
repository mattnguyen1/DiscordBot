import { apiUrls } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface DokkanResponse { cards?: Array<{ url?: string }> }
const baseUrl = "https://dokk.in";

export const dokkanCommand: Command = {
  name: "dokkan",
  usage: "dokkan <search query>",
  description: "Returns dokkan card results.",
  async run({ args }) {
    if (!args.trim()) return "Usage: dokkan <search query>";
    const params = new URLSearchParams({ q: args, limit: "3", offset: "0" });
    const body = await fetchJson<DokkanResponse>(`${apiUrls.dokkanCards}?${params}`);
    const urls = (body.cards || []).map((card) => card.url ? `${baseUrl}${card.url}` : null).filter(Boolean);
    return urls.length ? urls.join("\n") : "No dokkan cards found :(";
  },
};
