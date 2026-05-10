import { apiUrls, env } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

interface WeatherResponse {
  name: string;
  main: { temp: number };
  weather: Array<{ main: string }>;
}

export const weatherCommand: Command = {
  name: "weather",
  aliases: ["w", "wr"],
  usage: "weather [-set] <city-or-zip>",
  description: "Gets current weather.",
  async run({ args, options, redis, message }) {
    if (!env.WEATHER) return "WEATHER API key is not configured.";
    if (options.set && args.trim()) await redis.hSet("weather", message.author.id, args.trim());
    const saved = await redis.hGet("weather", message.author.id);
    const query = args.trim() || saved;
    if (!query) return "Usage: weather <city-or-zip>";

    const params = new URLSearchParams({ appid: env.WEATHER, units: "imperial" });
    if (/^\d{5}$/.test(query)) params.set("zip", query);
    else params.set("q", query);

    const body = await fetchJson<WeatherResponse>(`${apiUrls.openWeather}?${params}`);
    return `It is currently ${body.main.temp} degrees in ${body.name}.\nCurrent conditions: ${body.weather[0]?.main || "unknown"}.`;
  },
};
