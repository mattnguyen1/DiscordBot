# Bro Discord Bot

Bro is a TypeScript Discord bot intended to run as a normal Node service on the mini PC.

## Development

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

## Runtime

The production entrypoint is compiled JavaScript:

```bash
npm run build
npm start
```

Required Discord developer setting for prefix commands:

- Enable the privileged **Message Content Intent** for the bot application.

## Commands

Prefix commands use the bot name:

```text
bro help
bro image toast
bro llm explain redis in one sentence
```

Legacy text `/roll` is still supported.

Current TypeScript commands:

- `ai <image prompt>`
- `crypto [list|symbol]`
- `delete`
- `flush`
- `gif [-nsfw] <query>`
- `help`
- `image <query>`
- `llm <prompt>`
- `meme <template> "top" "bottom"`
- `playing <status>`
- `remind <me|@user> <time> <reminder>`
- `roll [lower] [upper]`
- `todo [-add|-remove|-clear] [item-or-index]`
- `uptime`
- `weather [-set] <city-or-zip>`
- `wolfram <query>`

## Redis keys

- `reminders` hash
- `weather` hash
- `todo` list

## Environment

Copy `.env.example` into your service environment file. `DISCORD_TOKEN` is preferred; `CLIENT_SECRET` is temporarily accepted as a deprecated alias for the existing deployment.
