/**
 * @file redisClient
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("./config");
const url = require("url");
const redis = require("redis");

let redisURL = url.parse(process.env.REDIS_URL),
	redisClient = redis.createClient(redisURL.port, redisURL.hostname);

// Authenticate with the Redis instance
redisClient.auth(redisURL.auth.split(':')[1], (err) => {
	if (err) {
		console.log("Redis auth error: " + err);
		return;
	}
});

// Subscribe to Redis errors
redisClient.on("error", function (err) {
	console.log("Redis Error " + err);
});

module.exports = redisClient;
