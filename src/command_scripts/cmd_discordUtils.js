/**
 * @file cmd_redisUtils
 * @author mattnguyen1
 */

"use strict";

// ---------------------------------
// Requirements
// ---------------------------------

let bot = require('../discordClient'),
	base64 = require('node-base64-image');

const 	MS_IN_SECONDS = 1000,
		MS_IN_MINUTES = 1000 * 60,
		MS_IN_HOURS	= 1000 * 60 * 60,
		MS_IN_DAYS = 1000 * 60 * 60 * 24;

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
	"uptime": {
		run: (options, message, callback) => {
			let seconds = Math.floor(bot.uptime / MS_IN_SECONDS) % 60,
				minutes = Math.floor(bot.uptime / MS_IN_MINUTES) % 60,
				hours = Math.floor(bot.uptime / MS_IN_HOURS) % 24,
				days = Math.floor(bot.uptime / MS_IN_DAYS) 
			callback(null, days + "d " + hours + "h " + minutes + "m " + seconds + "s");
		}
	},
	"avatar" :  {
		run: (options, message, callback) => {
			base64.encode(message.content, {}, (err, base64Resolvable) => {
				if (err) {
					callback(null, "Failed to convert image.");
					return;
				}
				bot.setAvatar(base64Resolvable, (err) => {
					if (err) {
						callback(null, "Failed to set avatar.");
						return;
					}
					callback(null, "Avatar set.");
				})
			})
		}
	},
	"playing" : {
		run: (options, message, callback) => {
			bot.setPlayingGame(message.content, callback);
		}
	},
	"help" : {
		run: (options, message, callback) => {
			let response = "Here are some of the commands I can do!\n";
			response +=  "\t" + name + " gif <query>\n";
			response +=  "\t" + name + " image <query>\n";
			response +=  "\t" + name + " meme help\n";
			response +=  "\t" + name + " weather <zipcode>\n";
			response +=	 "\t" + name + " wolfram <query>\n";
			response +=  "\t /roll <lower (optional)> <higher (optional)>\n\n";
			response +=  "See more about me at https://github.com/mattnguyen1/DiscordBot";
			callback(null, response);
		}
	}
};