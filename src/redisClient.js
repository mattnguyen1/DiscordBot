/**
 * @file redisClient
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const redis = require("redis");

const redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisClient = redis.createClient({
  url: redisUrl,
  socket: redisUrl.startsWith("rediss://")
    ? {
        tls: true,
        rejectUnauthorized: false,
      }
    : undefined,
});

// Subscribe to Redis errors
redisClient.on("error", function (err) {
  console.log("Redis Error " + err);
});

module.exports = redisClient;
