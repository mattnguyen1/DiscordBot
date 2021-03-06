/**
 * @file cmd_redisUtils
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const { bot, getBotName } = require("../discordClient");
const base64 = require("node-base64-image");

// ---------------------------------
// Const
// ---------------------------------

const 	MS_IN_SECONDS = 1000,
		MS_IN_MINUTES = 1000 * 60,
		MS_IN_HOURS	= 1000 * 60 * 60,
		MS_IN_DAYS = 1000 * 60 * 60 * 24;

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
	uptime: {
		run: (options, message, callback) => {
			let seconds = Math.floor(bot.uptime / MS_IN_SECONDS) % 60,
				minutes = Math.floor(bot.uptime / MS_IN_MINUTES) % 60,
				hours = Math.floor(bot.uptime / MS_IN_HOURS) % 24,
				days = Math.floor(bot.uptime / MS_IN_DAYS) 
			callback(days + "d " + hours + "h " + minutes + "m " + seconds + "s");
		}
	},
	avatar:  {
		run: (options, message, callback) => {
			base64.encode(message.content, {}, (err, base64Resolvable) => {
				if (err) {
					callback("Failed to convert image.");
					return;
				}
				bot.user.setAvatar(base64Resolvable)
					.then(user => callback('Avatar set.'))
					.catch(console.log);
			})
		}
	},
	playing: {
		run: (options, message, callback) => {
			console.log(message.content);
			bot.user.setStatus('online', message.content)
				.catch(console.log);
		}
	},
	help: {
		run: (options, message, callback) => {
			const name = getBotName();
			let response = "Here are some of the commands I can do!\n";
			response +=  "\t" + name + " gif <query>\n";
			response +=  "\t" + name + " image <query>\n";
			response +=  "\t" + name + " meme help\n";
			response +=  "\t" + name + " weather <zipcode>\n";
			response +=  "\t" + name + " wolfram <query>\n";
			response +=  "\t" + name + " remind <me/at-user> <time and reminder>\n";
			response +=  "\t /roll <lower (optional)> <higher (optional)>\n\n";
			response +=  "See more about me at https://github.com/mattnguyen1/DiscordBot";
			callback(response);
		}
	}
};