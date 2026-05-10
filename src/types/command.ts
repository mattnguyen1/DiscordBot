import type { Client, Message } from "discord.js";
import type { BroRedisClient } from "../lib/redis.js";

export type CommandOptions = Record<string, boolean>;

export interface CommandContext {
  client: Client;
  redis: BroRedisClient;
  message: Message;
  args: string;
  options: CommandOptions;
  commandName: string;
  reply(content: string | null | undefined): Promise<void>;
  isOwner(): boolean;
}

export interface Command {
  name: string;
  aliases?: string[];
  usage?: string;
  description?: string;
  ownerOnly?: boolean;
  loadingText?: string;
  run(ctx: CommandContext): Promise<string | void | null>;
}
