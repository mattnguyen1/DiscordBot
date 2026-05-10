import type { Message } from "discord.js";
import type { Command } from "../types/command.js";

const sentMessages = new Map<string, Message[]>();
const maxMessages = 100;

export function trackSentMessage(message: Message) {
  const list = sentMessages.get(message.channel.id) || [];
  list.push(message);
  while (list.length > maxMessages) list.shift();
  sentMessages.set(message.channel.id, list);
}

export const deleteCommand: Command = {
  name: "delete",
  aliases: ["d"],
  description: "Deletes the last bot message from the current channel.",
  async run({ message }) {
    const list = sentMessages.get(message.channel.id) || [];
    const last = list.pop();
    if (last) await last.delete().catch(() => undefined);
  },
};

export const flushCommand: Command = {
  name: "flush",
  aliases: ["f"],
  description: "Deletes tracked bot messages from the current channel.",
  async run({ message }) {
    const list = sentMessages.get(message.channel.id) || [];
    while (list.length) {
      const last = list.pop();
      if (last) await last.delete().catch(() => undefined);
    }
  },
};
