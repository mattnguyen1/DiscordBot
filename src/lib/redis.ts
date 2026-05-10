import { createClient } from "redis";
import { env } from "../config.js";

export function createRedisClient() {
  const url = env.REDIS_URL;
  return createClient({
    url,
    socket: url.startsWith("rediss://")
      ? {
          tls: true,
          rejectUnauthorized: false,
        }
      : undefined,
  });
}

export type BroRedisClient = ReturnType<typeof createRedisClient>;
