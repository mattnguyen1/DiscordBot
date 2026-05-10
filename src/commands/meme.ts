import { apiUrls, env, memeIds } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface ImgflipResponse { success: boolean; data?: { url?: string }; error_message?: string }

export const memeCommand: Command = {
  name: "meme",
  usage: "meme <template> \"top text\" \"bottom text\"",
  description: "Creates an Imgflip meme.",
  async run({ args }) {
    if (!env.MEME_USER || !env.MEME_PASS) return "MEME_USER/MEME_PASS are not configured.";
    if (args.trim().toLowerCase() === "help") {
      return `List of meme templates:\n${Object.keys(memeIds).map((id) => `\t${id}`).join("\n")}\n\nUsage: meme meme_id \"<top-text>\" \"<bottom-text>\"`;
    }
    const [template = "", ...quoted] = args.split('"');
    const templateName = template.trim();
    const templateId = memeIds[templateName] || templateName;
    const topText = quoted[1] || "";
    const bottomText = quoted[3] || "";
    if (!templateId || !topText || !bottomText) return "Usage: meme <template> \"top text\" \"bottom text\"";

    const params = new URLSearchParams({
      template_id: templateId,
      username: env.MEME_USER,
      password: env.MEME_PASS,
      text0: topText,
      text1: bottomText,
    });
    const body = await fetchJson<ImgflipResponse>(`${apiUrls.imgflipCaption}?${params}`);
    return body.success ? body.data?.url || "No meme returned." : body.error_message || "Bad meme :(";
  },
};
