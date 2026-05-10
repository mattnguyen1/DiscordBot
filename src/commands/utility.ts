import { ActivityType } from "discord.js";
import { commandList } from "./index.js";
import type { Command } from "../types/command.js";

const MS = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

export const uptimeCommand: Command = {
  name: "uptime",
  async run({ client }) {
    const uptime = client.uptime || 0;
    const days = Math.floor(uptime / MS.day);
    const hours = Math.floor(uptime / MS.hour) % 24;
    const minutes = Math.floor(uptime / MS.minute) % 60;
    const seconds = Math.floor(uptime / MS.second) % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  },
};

export const playingCommand: Command = {
  name: "playing",
  ownerOnly: true,
  usage: "playing <status>",
  async run({ args, client }) {
    if (!args.trim()) return "Usage: playing <status>";
    client.user?.setPresence({ activities: [{ name: args, type: ActivityType.Playing }], status: "online" });
    return "Status set.";
  },
};

export const helpCommand: Command = {
  name: "help",
  aliases: ["h"],
  async run({ client }) {
    const name = client.user?.username || "bro";
    return `Here are some of the commands I can do!\n${commandList().map((line) => `\t${name} ${line}`).join("\n")}\n\nSee more about me at https://github.com/mattnguyen1/DiscordBot`;
  },
};
