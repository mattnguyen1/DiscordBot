import { commandMap, commands } from "./commands/index.js";
import { MemoryRedis } from "./lib/memoryRedis.js";
import type { CommandContext, CommandOptions } from "./types/command.js";

interface TestCase {
  input: string;
  expect?: RegExp;
  skip?: string;
}

const tests: TestCase[] = [
  { input: "bro help", expect: /llm <prompt>/ },
  { input: "bro uptime", expect: /\d+d \d+h \d+m \d+s/ },
  { input: "bro roll", expect: /^\d+$/ },
  { input: "bro roll 5 5", expect: /^5$/ },
  { input: "bro todo", expect: /No todos/ },
  { input: "bro todo -add buy milk", expect: /1\. buy milk/ },
  { input: "bro todo -remove 1", expect: /No todos/ },
  { input: "bro remind me in 1 hour stretch", expect: /Reminder set for/ },
  { input: "bro llm say hi", skip: "external OpenAI API" },
  { input: "bro image toast", skip: "external Brave/Google API" },
  { input: "bro gif cats", skip: "external Giphy API" },
  { input: "bro weather Seattle", skip: "external OpenWeather API" },
  { input: "bro wolfram 2+2", skip: "external Wolfram API" },
  { input: "bro ai a cute robot", skip: "external OpenAI image API" },
];

const replies: string[] = [];
const redis = new MemoryRedis() as any;
const fakeClient = {
  uptime: 123_456,
  user: {
    username: "bro",
    setPresence: () => undefined,
  },
  channels: {
    fetch: async () => ({ send: async () => undefined }),
  },
} as any;

const fakeMessage = {
  content: "",
  author: {
    id: "user-1",
    bot: false,
    username: "tester",
    toString: () => "<@user-1>",
  },
  channel: {
    id: "channel-1",
    send: async (content: string) => {
      replies.push(content);
      return { channel: fakeMessage.channel, delete: async () => undefined };
    },
  },
} as any;

function parse(input: string) {
  const [botName = "", commandName = "", ...rest] = input.trim().split(/\s+/);
  if (botName.toLowerCase() !== "bro") throw new Error(`Invalid test input: ${input}`);
  const words = rest.filter(Boolean);
  const options: CommandOptions = {};
  while (words[0]?.startsWith("-")) {
    options[words.shift()!.slice(1).toLowerCase()] = true;
  }
  return { commandName, args: words.join(" "), options };
}

async function runCommand(input: string) {
  const { commandName, args, options } = parse(input);
  const command = commandMap.get(commandName);
  if (!command) throw new Error(`Command not found: ${commandName}`);

  replies.length = 0;
  const ctx: CommandContext = {
    client: fakeClient,
    redis,
    message: fakeMessage,
    args,
    options,
    commandName,
    isOwner: () => true,
    reply: async (content) => {
      if (content) replies.push(content);
    },
  };

  const result = await command.run(ctx);
  if (result) replies.push(result);
  return replies.join("\n");
}

let failures = 0;
console.log(`Loaded ${commands.length} commands: ${commands.map((command) => command.name).join(", ")}`);

for (const test of tests) {
  if (test.skip) {
    console.log(`SKIP ${test.input} (${test.skip})`);
    continue;
  }

  try {
    const output = await runCommand(test.input);
    if (test.expect && !test.expect.test(output)) {
      failures += 1;
      console.error(`FAIL ${test.input}\nExpected: ${test.expect}\nActual: ${output}`);
    } else {
      console.log(`PASS ${test.input} -> ${output.split("\n")[0]}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.input}`, error);
  }
}

if (failures) {
  process.exitCode = 1;
  console.error(`${failures} offline E2E test(s) failed.`);
} else {
  console.log("Offline E2E tests passed.");
}
