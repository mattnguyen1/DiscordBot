/**
 * @file cmd_remind
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

let conf = require('../config.json'),
	redisClient = require('../redisClient'),
	chrono = require('chrono-node'),
	{ addTimer, getFirstWord } = require('../botUtils');

// ---------------------------------
// Private
// ---------------------------------

/**
 * Sets a reminder for the user.
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _remind = (options, message, callback) => {
	let suffix = message.content;
	let zeroPad = (num) => {
		if (num < 10) {
			return "0" + num;
		}
		return num;
	};

	// @TODO(mattnguyen1) 2016-08-24: Make this parse a user to @mention them
	if (getFirstWord(suffix.toLowerCase()) === "me") {
		suffix = suffix.slice(3);
	}
	// Use chrono to parse the string for a time
	let result = chrono.parse(suffix)[0];
	if (!(result && result.index !== undefined && result.text && result.start && result.start.date())) {
		callback(null, "Failed to parse reminder!");
		return;
	}
	// Get the resulting reminder text
	let strBeforeTime = suffix.slice(0,result.index),
		strAfterTime = suffix.slice(result.index + result.text.length),
		reminderText = (strBeforeTime.length > strAfterTime.length) ? strBeforeTime : strAfterTime;

	// Find the action word
	let actionWord = getFirstWord(reminderText.toLowerCase());
	if (actionWord === "to" || actionWord === "that") {
		reminderText = reminderText.slice(actionWord.length+1);
	} else {
		actionWord = "";
	}

	let year = result.start.get('year'),
		month = result.start.get('month'),
		day = result.start.get('day'),
		hour = result.start.get('hour'),
		minute = result.start.get('minute'),
		second = result.start.get('second'),
		ampm = hour < 12 ? "AM" : "PM",
		reminderMessage = message.author + ": " + reminderText;

	hour = (hour%12) === 0 ? 12 : (hour % 12);

	let timestamp = {
		author: message.author.username,
		channel: message.channel.id,
		time: Date.parse(result.start.date())
	}
	redisClient.hset("reminders", JSON.stringify(timestamp), reminderMessage);
	addTimer(timestamp, reminderMessage);
	callback(null, message.author + ": I will remind you on " 
		+ month + "/" + day + "/" + year + " @ " // Date
		+ hour + ":" + zeroPad(minute) + " " + ampm + "(PST)" // Time
		+ " " + actionWord
		+ "```" + reminderText + "```");
}

module.exports = {
	"remind": {
		run: _remind,
		usage: "remind <query + time>",
		description: "Creates a reminder set to a time based on NL processed query."
	}
}