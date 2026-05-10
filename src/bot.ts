import express from "express";
import { ChannelType, Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { env } from "./config.js";
import { createRedisClient } from "./lib/redis.js";
import { commandMap } from "./commands/index.js";
import { trackSentMessage } from "./commands/delete.js";
import { loadReminders } from "./commands/remind.js";
import type { CommandOptions } from "./types/command.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

const redis = createRedisClient();
let ready = false;

function parseOptions(words: string[]) {
  const options: CommandOptions = {};
  let index = 0;
  while (words[index]?.startsWith("-")) {
    options[words[index]!.slice(1).toLowerCase()] = true;
    index += 1;
  }
  return { options, rest: words.slice(index).join(" ") };
}

async function sendReply(message: Parameters<typeof trackSentMessage>[0], content: string | null | undefined | void) {
  if (!content) return;
  const sent = await (message.channel as any).send(content.slice(0, 2000));
  trackSentMessage(sent);
}

async function sendLoadingReply(message: Parameters<typeof trackSentMessage>[0], content: string) {
  const sent = await (message.channel as any).send(content.slice(0, 2000));
  trackSentMessage(sent);
  return sent as { edit(content: string): Promise<unknown> };
}

function startTyping(message: Parameters<typeof trackSentMessage>[0]) {
  void (message.channel as any).sendTyping?.().catch?.(() => undefined);
  const interval = setInterval(() => {
    void (message.channel as any).sendTyping?.().catch?.(() => undefined);
  }, 8_000);
  interval.unref();
  return () => clearInterval(interval);
}

client.once(Events.ClientReady, async (loggedInClient) => {
  ready = true;
  console.log(`${loggedInClient.user.username} is online.`);
  await loadReminders({ client, redis });
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const botName = client.user?.username?.toLowerCase();
  if (!botName) return;

  const raw = message.content.trim();
  let commandName = "";
  let remainder = "";

  if (raw.startsWith("/roll")) {
    commandName = "roll";
    remainder = raw.slice("/roll".length).trim();
  } else {
    const [first = "", second = "", ...rest] = raw.split(/\s+/);
    if (first.toLowerCase() !== botName) return;
    commandName = second.toLowerCase();
    remainder = rest.join(" ");
  }

  const command = commandMap.get(commandName);
  if (!command) return;

  const words = remainder.split(/\s+/).filter(Boolean);
  const { options, rest } = parseOptions(words);
  const isOwner = () => env.OWNER_IDS.size === 0 || env.OWNER_IDS.has(message.author.id);

  if (command.ownerOnly && !isOwner()) {
    await sendReply(message, "That command is owner-only.");
    return;
  }

  const stopTyping = startTyping(message);
  const loadingReply = command.loadingText && rest.trim()
    ? await sendLoadingReply(message, command.loadingText)
    : undefined;

  try {
    const result = await command.run({
      client,
      redis,
      message,
      args: rest,
      options,
      commandName,
      isOwner,
      reply: (content) => sendReply(message, content),
    });

    if (loadingReply && result) {
      await loadingReply.edit(result.slice(0, 2000));
    } else {
      await sendReply(message, result);
    }
  } catch (error) {
    console.error(`Command ${commandName} failed`, error);
    const messageText = error instanceof Error ? error.message : "Unknown error";
    const errorReply = `Error: ${messageText}`;
    if (loadingReply) {
      await loadingReply.edit(errorReply.slice(0, 2000));
    } else {
      await sendReply(message, errorReply);
    }
  } finally {
    stopTyping?.();
  }
});

const app = express();
app.get("/", (_req, res) => res.send("App is running"));
app.get("/healthz", (_req, res) => {
  res.status(ready && redis.isReady ? 200 : 503).json({
    ready,
    redis: redis.isReady,
    discord: client.isReady(),
  });
});

const server = app.listen(env.PORT, "127.0.0.1", () => {
  console.log(`Health server listening on 127.0.0.1:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down.`);
  server.close();
  client.destroy();
  if (redis.isOpen) await redis.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

redis.on("error", (error) => console.error("Redis error", error));
await redis.connect();
await client.login(env.DISCORD_TOKEN);
