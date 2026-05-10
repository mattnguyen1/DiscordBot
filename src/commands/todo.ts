import type { Command } from "../types/command.js";

export const todoCommand: Command = {
  name: "todo",
  usage: "todo [-add|-remove|-clear] [item-or-index]",
  description: "Manages the shared Redis todo list.",
  async run({ redis, options, args }) {
    if (options.clear) {
      await redis.del("todo");
      return "Todo list cleared.";
    }
    if (options.add) {
      if (!args.trim()) return "Usage: todo -add <item>";
      await redis.lPush("todo", args);
    }
    if (options.remove) {
      const index = Number(args.trim());
      if (!Number.isInteger(index) || index < 1) return "Usage: todo -remove <number>";
      await redis.lSet("todo", index - 1, "DELETED");
      await redis.lRem("todo", 1, "DELETED");
    }

    const items = await redis.lRange("todo", 0, -1);
    if (!items.length) return "No todos.";
    return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  },
};
