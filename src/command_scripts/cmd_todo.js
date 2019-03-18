/**
 * @file cmd_deleteMessage
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const async = require("async");
const redisClient = require("../redisClient");
const { isPositiveInteger } = require("../botUtils");

// ---------------------------------
// Private
// ---------------------------------

let _todo = (options, message, callback) => {
	let todoList = null;
	if(options['clear']) {
		redisClient.del("todo");
		return;
	}
	async.waterfall([
		(waterfallCallback) => {
			if(options['add']) {
				redisClient.lpush("todo", message.content, (err, res) => {
					if (err) {
						waterfallCallback(err);
						return;
					}
				});
			} else if (options['remove']) {
				if (isPositiveInteger(message.content)) {
					let indexToRemove = parseInt(message.content);
					async.waterfall([
						(removeWaterfallCallback) => {
							redisClient.lset("todo", indexToRemove-1, "DELETED", removeWaterfallCallback);
						},
						(val, removeWaterfallCallback) => {
							redisClient.lrem("todo", 1, "DELETED", removeWaterfallCallback);
						}
					], (err, val) => {
						if (err) {
							waterfallCallback(err);
							return;
						}
					});
				};
			}
			waterfallCallback();
		},
		(waterfallCallback) => {
			redisClient.llen("todo", (err, len) => {
				if (err) {
					waterfallCallback(err);
					return;
				}

				waterfallCallback(null, len);
			});
		},
		(len, waterfallCallback) => {
			redisClient.lrange("todo", 0, len, (err, arr) => {
				if (err) {
					waterfallCallback(err);
					return;
				}

				waterfallCallback(null, arr);
			});
		}
	], (err, res) => {
		if (err) {
			callback(err);
			return;
		}
		let formattedList = "TODO: \n";
		for (let i = 1; i <= res.length; i++) {
			formattedList += i + ": " + res[i-1] + "\n";
		}

		callback(formattedList);
	});

}

module.exports.todo = {
	run: _todo,
	usage: "todo \n"
		+ "Options: \n"
		+ "\t -add: todo <task> will add the task to the list. \n"
		+ "\t -remove: todo <task-number> will remove the task from the list. \n",
	description: "Displays the todo list set on the bot."
};
	