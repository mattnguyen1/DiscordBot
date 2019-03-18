/**
 * @file cmd_deleteMessage
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const { messages } = require("../botUtils");

// ---------------------------------
// Private
// ---------------------------------

let _delete = (options, message, callback) => {
	let lastMessage = messages[message.channel.id] ? messages[message.channel.id].pop() : null;
	if (lastMessage) {
		lastMessage.delete()
			.catch(console.log);
	}
	callback(null);
}

let _flush = (options, message, callback) => {
	if (!messages[message.channel.id]) {
		callback(null);
		return;
	}

	while (messages[message.channel.id].length) {
		let lastMessage = messages[message.channel.id].pop();
		if (lastMessage) {
			lastMessage.delete()
				.catch(console.log);
		}
	}
	callback(null);
}

module.exports = {
	delete: {
		run: _delete,
		usage: "delete",
		description: "Deletes the last bot message from the current text channel."
	},
	flush: {
		run: _flush,
		usage: "flush",
		description: "Deletes the last 100 bot messages (since bot was online) from the current text channel."
	}
}