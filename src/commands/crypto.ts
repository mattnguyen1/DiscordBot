import { apiUrls } from "../config.js";
import { fetchJson } from "../lib/http.js";
import type { Command } from "../types/command.js";

const cryptoList = ["BTC", "ETH", "SOL", "RNDR", "DOGE", "SHIB"];
interface CoinbaseRates { data: { rates: Record<string, string> } }
interface CoinbaseSpot { data: { amount: string; currency: string } }

export const cryptoCommand: Command = {
  name: "crypto",
  aliases: ["c"],
  usage: "crypto [list|symbol]",
  description: "Gets crypto prices from Coinbase.",
  async run({ args }) {
    const [symbolRaw = "BTC", maybeDate] = args.trim().split(/\s+/).filter(Boolean);
    if (symbolRaw.toLowerCase() === "list") return cryptoList.join(", ");
    const symbol = symbolRaw.toUpperCase();
    if (maybeDate && /^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
      const body = await fetchJson<CoinbaseSpot>(`${apiUrls.coinbase}/prices/${symbol}-USD/spot?${new URLSearchParams({ date: maybeDate })}`);
      return `${symbol} was $${body.data.amount} ${body.data.currency} on ${maybeDate}.`;
    }
    const body = await fetchJson<CoinbaseRates>(`${apiUrls.coinbase}/exchange-rates?${new URLSearchParams({ currency: symbol })}`);
    const usd = body.data.rates.USD;
    return usd ? `${symbol}: $${Number(usd).toLocaleString(undefined, { maximumFractionDigits: 6 })} USD` : `No USD price found for ${symbol}.`;
  },
};
