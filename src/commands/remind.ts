import * as chrono from "chrono-node";
import type { Command } from "../types/command.js";

interface ReminderPayload {
  time: number;
  target: string;
  channelId: string;
  text: string;
}

function parseTarget(raw: string, authorMention: string) {
  const [first = "", ...rest] = raw.trim().split(/\s+/);
  if (first.toLowerCase() === "me") return { target: authorMention, text: rest.join(" ") };
  if (first.startsWith("<@")) return { target: first, text: rest.join(" ") };
  return { target: authorMention, text: raw };
}

function reminderMessage(payload: ReminderPayload) {
  return `${payload.target} reminder: ${payload.text}`;
}

async function deliverReminder(ctx: Pick<Parameters<Command["run"]>[0], "client" | "redis">, key: string, payload: ReminderPayload) {
  const channel = await ctx.client.channels.fetch(payload.channelId).catch(() => null);
  if (channel && "send" in channel) {
    await (channel as any).send(reminderMessage(payload)).catch(console.error);
  }
  await ctx.redis.hDel("reminders", key);
}

export async function loadReminders(ctx: Pick<Parameters<Command["run"]>[0], "client" | "redis">) {
  const reminders = await ctx.redis.hGetAll("reminders");
  for (const [key, value] of Object.entries(reminders)) {
    let payload: ReminderPayload;
    try {
      payload = JSON.parse(value) as ReminderPayload;
    } catch {
      await ctx.redis.hDel("reminders", key);
      continue;
    }
    const delay = Math.max(payload.time - Date.now(), 0);
    setTimeout(() => void deliverReminder(ctx, key, payload), Math.min(delay, 2_147_483_647)).unref();
  }
}

export const remindCommand: Command = {
  name: "remind",
  aliases: ["r"],
  usage: "remind <me|@user> <time> <reminder>",
  description: "Sets a reminder.",
  async run(ctx) {
    const { args, message, redis } = ctx;
    const parsedTarget = parseTarget(args, message.author.toString());
    const result = chrono.parse(parsedTarget.text)[0];
    if (!result?.start?.date()) return "Failed to parse reminder!";

    const before = parsedTarget.text.slice(0, result.index).trim();
    const after = parsedTarget.text.slice(result.index + result.text.length).trim();
    let text = (before.length > after.length ? before : after).replace(/^(to|that)\s+/i, "").trim();
    if (!text) text = parsedTarget.text.replace(result.text, "").trim();
    if (!text) return "What should I remind you about?";

    const payload: ReminderPayload = {
      time: result.start.date().getTime(),
      target: parsedTarget.target,
      channelId: message.channel.id,
      text,
    };
    const key = JSON.stringify({ time: payload.time, target: payload.target, channelId: payload.channelId });
    await redis.hSet("reminders", key, JSON.stringify(payload));
    setTimeout(() => void deliverReminder(ctx, key, payload), Math.max(payload.time - Date.now(), 0)).unref();
    return `Reminder set for ${new Date(payload.time).toLocaleString()}.`;
  },
};
