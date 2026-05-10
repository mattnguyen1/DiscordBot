import type { Command } from "../types/command.js";
import { aiCommand, llmCommand } from "./openai.js";
import { cryptoCommand } from "./crypto.js";
import { deleteCommand, flushCommand } from "./delete.js";
import { dokkanCommand } from "./dokkan.js";
import { gifCommand } from "./gif.js";
import { helpCommand, playingCommand, uptimeCommand } from "./utility.js";
import { imageCommand } from "./image.js";
import { memeCommand } from "./meme.js";
import { remindCommand } from "./remind.js";
import { rollCommand } from "./roll.js";
import { todoCommand } from "./todo.js";
import { weatherCommand } from "./weather.js";
import { wolframCommand } from "./wolfram.js";

export const commands: Command[] = [
  aiCommand,
  cryptoCommand,
  deleteCommand,
  dokkanCommand,
  flushCommand,
  gifCommand,
  helpCommand,
  imageCommand,
  llmCommand,
  memeCommand,
  playingCommand,
  remindCommand,
  rollCommand,
  todoCommand,
  uptimeCommand,
  weatherCommand,
  wolframCommand,
];

export const commandMap = new Map<string, Command>();
for (const command of commands) {
  commandMap.set(command.name, command);
  for (const alias of command.aliases || []) {
    commandMap.set(alias, command);
  }
}

export function commandList() {
  return commands.map((command) => command.usage || command.name).sort();
}
