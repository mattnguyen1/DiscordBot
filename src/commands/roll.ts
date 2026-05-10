import type { Command } from "../types/command.js";

export const rollCommand: Command = {
  name: "roll",
  usage: "roll [lower] [upper]",
  description: "Rolls a random integer.",
  async run({ args }) {
    const parts = args.trim().split(/\s+/).filter(Boolean).map(Number);
    let low = 1;
    let high = 100;
    if (parts.length === 1 && Number.isFinite(parts[0])) high = parts[0]!;
    if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      low = parts[0]!;
      high = parts[1]!;
    }
    if (high < low) [low, high] = [high, low];
    return String(Math.floor(Math.random() * (high - low + 1)) + low);
  },
};
