import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().optional(),
  CLIENT_SECRET: z.string().optional(), // deprecated Heroku-era name; kept for compatibility
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_OWNER_IDS: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(5000),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  REDIS_TLS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  GIPHY_KEY: z.string().optional(),
  MEME_USER: z.string().optional(),
  MEME_PASS: z.string().optional(),
  BRAVE_SEARCH_API_KEY: z.string().optional(),
  BRAVE_API_KEY: z.string().optional(),
  IMG_KEY: z.string().optional(),
  IMG_CX: z.string().optional(),
  WEATHER: z.string().optional(),
  WOLFRAM_KEY: z.string().optional(),
});

const parsed = envSchema.parse(process.env);
const discordToken = parsed.DISCORD_TOKEN || parsed.CLIENT_SECRET;

if (!discordToken && process.env.NODE_ENV !== "test") {
  throw new Error("Missing DISCORD_TOKEN. CLIENT_SECRET is still accepted as a deprecated alias.");
}

export const env = {
  ...parsed,
  DISCORD_TOKEN: discordToken || "test-token",
  OWNER_IDS: new Set(
    (parsed.DISCORD_OWNER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  ),
  BRAVE_SEARCH_API_KEY: parsed.BRAVE_SEARCH_API_KEY || parsed.BRAVE_API_KEY,
  REDIS_URL: parsed.REDIS_TLS_URL || parsed.REDIS_URL,
};

export const apiUrls = {
  giphy: "https://api.giphy.com/v1/gifs/search",
  braveImages: "https://api.search.brave.com/res/v1/images/search",
  googleImages: "https://www.googleapis.com/customsearch/v1",
  imgflipCaption: "https://api.imgflip.com/caption_image",
  openWeather: "https://api.openweathermap.org/data/2.5/weather",
  coinbase: "https://api.coinbase.com/v2",
  dokkanCards: "https://dokk.in/api/cards",
  wolfram: "https://api.wolframalpha.com/v2/query",
};

export const memeIds: Record<string, string> = {
  boromir: "61579",
  interesting: "61532",
  fry: "61520",
  fwp: "61539",
  leo: "5496396",
  badluck: "61585",
  wonka: "61582",
  success: "61544",
  toohigh: "61580",
  kd35: "15878567",
  aliens: "101470",
  scumbag: "61522",
  dwight: "61554",
  ronburgandy: "1232147",
};
