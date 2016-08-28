/**
 * @file botUtils
 * @author mattnguyen1
 */

"use strict";

// ---------------------------------
// Requirements
// ---------------------------------

let redisClient = require('./redisClient'),
	bot = require('./discordClient');

// ---------------------------------
// Public
// ---------------------------------

/**
 * Adds a timer for reminders
 * @param {Object} timestamp
 * @param {string} reminder
 * @returns {void}
 */
module.exports.addTimer = (timestamp, reminder) => {
	let currentTimestamp = Date.now();
	setTimeout(function() {
		redisClient.hdel("reminders", JSON.stringify(timestamp));
		bot.sendMessage(timestamp.channel, reminder, (err, response) => {
			if (err) {
				console.log(err);
			}
		});
	}, timestamp.time - currentTimestamp);
}

/**
 * Returns the first word delimited by spaces in the string
 * @param  {string} str
 * @return {string}    
 */
module.exports.getFirstWord = (str) => {
	return str.split(' ')[0];
}

/**
 * Returns if a string is a positive integer.
 * THIS FUNCTION IS LITERALLY MAGIC.
 * @param  {string}  n
 * @return {Boolean}
 */
module.exports.isPositiveInteger = (n) => {
    return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
}

module.exports.messages = {};