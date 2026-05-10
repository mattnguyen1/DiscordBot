import { apiUrls, env } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface WolframResponse {
  queryresult?: {
    success?: boolean;
    pods?: Array<{ title?: string; subpods?: Array<{ plaintext?: string }> }>;
  };
}

export const wolframCommand: Command = {
  name: "wolfram",
  usage: "wolfram <query>",
  description: "Searches WolframAlpha.",
  async run({ args }) {
    if (!env.WOLFRAM_KEY) return "WOLFRAM_KEY is not configured.";
    if (!args.trim()) return "Usage: wolfram <query>";
    const params = new URLSearchParams({ input: args, appid: env.WOLFRAM_KEY, output: "json" });
    const body = await fetchJson<WolframResponse>(`${apiUrls.wolfram}?${params}`);
    const pods = body.queryresult?.pods || [];
    const lines: string[] = [];
    for (const pod of pods.slice(0, 5)) {
      const text = pod.subpods?.map((subpod) => subpod.plaintext).filter(Boolean).join("\n");
      if (text) lines.push(`**${pod.title || "Result"}**:\n\t${text}`);
    }
    return lines.length ? `${lines.join("\n")}\n\nSee the full answer at https://www.wolframalpha.com/input?i=${encodeURIComponent(args)}` : "Bad query.";
  },
};
