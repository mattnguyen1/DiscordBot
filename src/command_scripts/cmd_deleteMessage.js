/**
 * @file cmd_deleteMessage
 * @author mattnguyen1
 */

"use strict";

// ---------------------------------
// Requirements
// ---------------------------------

let bot = require('../discordClient'),
	messages = require('../botUtils').messages;

// ---------------------------------
// Private
// ---------------------------------

let _delete = (options, message, callback) => {
	var lastMessage = messages[message.channel.id] ? messages[message.channel.id].pop() : null;
	if (lastMessage) {
		bot.deleteMessage(lastMessage, { wait: 0 }, (err, response) => {
			if (err) {
				callback(err);
				return;
			}
		});
	}
	callback(null, null);
}

let _flush = (options, message, callback) => {
	while (messages.length) {
		var lastMessage = messages[message.channel.id] ? messages[message.channel.id].pop() : null;
		if (lastMessage) {
			bot.deleteMessage(lastMessage, { wait: 0 }, (err, response) => {
				if (err) {
					callback(err);
					return;
				}
			});
		}
	}
	callback(null, null);
}

module.exports = {
	"delete" : {
		run: _delete,
		usage: "delete",
		description: "Deletes the last bot message from the current text channel."
	},
	"flush" : {
		run: _flush,
		usage: "flush",
		description: "Deletes the last 100 bot messages (since bot was online) from the current text channel."
	}
}