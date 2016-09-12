/**
 * @file botUtils
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import redisClient from "./redisClient";
import { bot } from "./discordClient";

// ---------------------------------
// Private
// ---------------------------------

/**
 * Sends a message to the target
 * @param  {User|TextChannel} target
 * @param  {string} message
 * @param  {Function} callback
 * @return {void}
 */
function sendMessage(target, message, callback) {
	callback = callback || null;
	target.sendMessage(message)
		.then(callback)
		.catch(console.log);
}

/**
 * Stringifies a JSON, regardless of circular structure
 * @param  {Object} obj
 * @return {string}
 */
function stringifyJSON(obj) {
	let cache = [];
	return JSON.stringify(obj, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// Circular reference found, discard key
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	});
}

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
	/**
	 * Adds a timer for reminders
	 * @param {Object} timestamp
	 * @param {string} reminder
	 * @returns {void}
	 */
	addTimer: (timestamp, reminder) => {
		let currentTimestamp = Date.now();
		setTimeout(function() {
			redisClient.hdel("reminders", stringifyJSON(timestamp));

			if (timestamp.dm) {
				sendMessage(bot.users.find('id', timestamp.target), reminder);
			} else {
				sendMessage(bot.channels.find('id', timestamp.channel), reminder);
			}
		}, timestamp.time - currentTimestamp);
	},

	/**
	 * Returns the first word delimited by spaces in the string
	 * @param  {string} str
	 * @return {string}    
	 */
	getFirstWord: (str) => {
		return str.split(' ')[0];
	},

	/**
	 * Returns if a string is a positive integer.
	 * THIS FUNCTION IS LITERALLY MAGIC.
	 * @param  {string}  n
	 * @return {Boolean}
	 */
	isPositiveInteger: (n) => {
		return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
	},

	stringifyJSON: stringifyJSON,

	sendMessage: sendMessage,

	messages: {}
}