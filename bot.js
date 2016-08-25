"use strict";

let Discord = require('discord.js');

// Configs
let conf 	= require('./config.json');

// Dependencies
let jsdom			= require('jsdom'),
	url 			= require('url'),
	request 		= require('request'),
	redis			= require('redis'),
	express 		= require('express'),
	wolframClient 	= require('node-wolfram'),
	helpers 		= require('./helpers.js'),
	exec 			= require('child_process').exec,
	chrono 			= require('chrono-node');

// Vars
let bot 		= new Discord.Client(),
	wolfram 	= new wolframClient(process.env.WOLFRAM_KEY),
	name 		= "",
	redisURL 	= url.parse(process.env.REDIS_URL),
	redisClient = redis.createClient(redisURL.port, redisURL.hostname),
	app     	= express(),
	messages	= [];

// Bools
let sfw		= false,
	isListeningOnPort = false;

// CONST
const 	MS_IN_SECONDS = 1000,
		MS_IN_MINUTES = 1000 * 60,
		MS_IN_HOURS	= 1000 * 60 * 60,
		MS_IN_DAYS = 1000 * 60 * 60 * 24,
		MAX_MESSAGES_IN_MEMORY = 100;

function init() {
	console.log("Starting Discord bot script.");
	// Heroku $PORT error fix
	app.set('port', (process.env.PORT || 5000));
	app.get('/', function(request, response) {
	    let result = 'App is running'
	    response.send(result);
	}).listen(app.get('port'), function() {
	    console.log('App is running, server is listening on port ', app.get('port'));
	});

	// Login with the token secret
	bot.loginWithToken(process.env.CLIENT_SECRET);

	// Redis
	redisClient.auth(redisURL.auth.split(':')[1], (err) => {
		if (err) {
			console.log("Redis auth error: " + err);
		}
	});
	redisClient.on("error", function (err) {
	    console.log("Redis Error " + err);
	});
}

init();

var commands = {
	"gif" : {
		run: (options, suffix, callback) => {
			let requestParams = {
				url: conf.urls.giphy,
				qs: {
					q: suffix,
					limit: 25,
					fmt: "json",
					api_key: process.env.GIPHY_KEY,
					rating: options['nsfw'] ? 'r' : 'pg-13'
				}
			};

			request(requestParams, (error, response, body) => {
				//console.log(arguments)
				if (error || response.statusCode !== 200) {
					console.error("giphy: Got error: " + body);
					console.log(error);
					callback(new Error("Giphy error."), "Bad Request.");
					return;
				}
				let responseObj = JSON.parse(body);
				if (responseObj.data.length) {
					let random_index = Math.floor(Math.random() * responseObj.data.length);
					let response_url = responseObj.data[random_index].images.fixed_height.url;
					callback(null, response_url);
				} else {
					callback(null, "No results :(");
				}
			});
		}
	},
	"meme" : {
		run: (options, suffix, callback) => {
			let sfx_arr = suffix.split('"');
			let sfx_split_space = suffix.split(' ');
			if (sfx_split_space[0].toLowerCase() == "help") {
				console.log(conf.meme_ids);
				let response = "List of meme templates: \n";
				for (let key in conf.meme_ids){
					response += "\t" + key + "\n";
				}
				response += "\nUsage:\n";
				response += "\t" + name + " meme meme_id \"<top-text>\" \"<bot-text>\"";
				callback(null, response);
				return;
			}

			let template_id = sfx_arr[0].trim();

			if (sfx_arr.length >= 2) {
				let top_text = sfx_arr[1];
				let bot_text = "";
				// Optional top text only
				if (sfx_arr.length >= 4 && sfx_arr[2] == ' ') {
					bot_text = sfx_arr[3];
				} 

				imgflip(conf.meme_ids[template_id], top_text, bot_text, callback);		
			}
		}
	},
	"image" : {
		run: (options, suffix, callback) => {
			googleImg(suffix, callback);
		}
	},
	"weather" : {
		run: (options, suffix, callback) => {
			weather(suffix, callback);
		}
	},
	"wolfram" : {
		run: (options, suffix, callback) => {
			wolfram.query(suffix, (err, result) => {
				if (err) {
					callback(null, "Bad query.");
				} else {
					let response = "";
					if (result.queryresult == undefined) {
						callback(null, "Bad query.");
						return;
					}
					if (result.queryresult.pod == undefined) {
						console.log(result.queryresult);
						callback(null, "Bad query.");
						return;
					}
					for(let a=0; a<result.queryresult.pod.length && a < 5; a++) {
						let pod = result.queryresult.pod[a];
						response += "**" + pod.$.title + "**: \n";
						for(let b=0; b<pod.subpod.length; b++) {
							let subpod = pod.subpod[b];
							for(let c=0; c<subpod.plaintext.length; c++) {
								let text = subpod.plaintext[c];
								response += '\t' + text + "\n";
							}
						}
					}
					response += "\nSee the full answer at " + conf.urls.wolfram + encodeURIComponent(suffix);
					callback(null, response);
				}
			});
		}
	},
	"wcl": {
		run: (options, suffix, callback) => {
			if (options['setalias']) {
				let suffix_arr = suffix.split(' ');
				redisClient.hset("wcl", suffix_arr[0], suffix_arr[1]);
				callback(null, "Set " + suffix_arr[0] + " as " + suffix_arr[1]);
				return;
			}
			redisClient.hget("wcl", suffix, (err, value) => {
				jsdom.env(
					conf.urls.wcl + value,
					["http://code.jquery.com/jquery.js"],
					(err, window) => {
						if (window.$("tr td a") && window.$("tr td a")[0]) {
							callback(null, window.$("tr td a")[0].href);	
							return;		  		
						} else {
							callback(null, "No logs found :(");
						}
					}
				);
			})
		}
	},
	"redis-hgetall": {
		run: (options, suffix, callback) => {
			redisClient.hgetall(suffix, (err, obj) => {
			    console.log(obj);
			});
		}
	},
	"get-alias": {
		run: (options, suffix, callback) => {
			let suffix_arr = suffix.split(' ');
			let hash = suffix_arr[0];
			let key = suffix_arr[1];
			redisClient.hget(hash, key, (err, value) => {
				console.log(value);
				callback(null, value);
			})
		}
	},
	"uptime": {
		run: (options, suffix, callback) => {
			let seconds = Math.floor(bot.uptime / MS_IN_SECONDS) % 60,
				minutes = Math.floor(bot.uptime / MS_IN_MINUTES) % 60,
				hours = Math.floor(bot.uptime / MS_IN_HOURS) % 24,
				days = Math.floor(bot.uptime / MS_IN_DAYS) 
			callback(null, days + "d " + hours + "h " + minutes + "m " + seconds + "s");
		}
	},
	"remind": {
		run: (options, suffix, callback) => {
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
				hour = result.start.get('hour') % 12,
				minute = result.start.get('minute'),
				ampm = result.start.get('meridiem') !== undefined ? (0 ? "AM" : "PM") : "";

			hour = hour === 0 ? 12 : (hour % 12);

			// redisClient.hset("remindTo", result.start.date(), author);
			// redisClient.hset("remindWhat", result.start.date(), reminder);
			// addTimer();
			callback(null, "I will remind you on " 
				+ month + "/" + day + "/" + year + " @ " // Date
				+ hour + ":" + zeroPad(minute) + " " + ampm // Time
				+ " " + actionWord
				+ "```" + reminderText + "```");
		}
	},
	"delete" : {
		run: (options, suffix, callback) => {
			var lastMessage = messages.pop();
			if (lastMessage) {
				bot.deleteMessage(lastMessage, { wait: 0 }, (err, response) => {
					if (err) {
						callback(err);
						return;
					}
					callback(null, "Deleted message.");
				});
			}
		}
	},
	"flush" : {
		run: (options, suffix, callback) => {
			while (messages.length) {
				var lastMessage = messages.pop();
				if (lastMessage) {
					bot.deleteMessage(lastMessage, { wait: 0 }, (err, response) => {
						if (err) {
							callback(err);
							return;
						}
						callback(null, "Deleted messages.");
					});
				}
			}	
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
}

let slash_commands = {
	"roll" : {
		run: (message, callback) => {
			let sfx_arr = message.content.split(' ');
			let lo = sfx_arr[1];
			let hi = sfx_arr[2];

			// Default roll is from 1-100
			if (sfx_arr.length == 1) {
				callback(null,roll(message.author, 1, 100));
			}
			if (sfx_arr.length == 2) {
				if (lo == "rick") {
					callback(null,"https://www.youtube.com/watch?v=dQw4w9WgXcQ");
				}
				if (isPositiveInteger(lo)) {
					callback(null,roll(message.author, sfx_arr[1]));
				}
			} else if (sfx_arr.length == 3) {
				callback(null,roll(message.author, sfx_arr[1], sfx_arr[2]));
			}
		}
	}
}

let autoResponses = {
	"Kappa": {
		run: (callback) => {
			callback(null, conf.urls.Kappa);
		}
	},
	"lategong" : {
		run: (callback) => {
			callback(null, conf.urls.leigong);
		}
	}
}

/**
 * Handles messages prefixed with the bot's name
 * @param  {Object} message - Discord message object
 * @param  {Function} callback
 * @return {void}
 */
function onMessage(message, callback) {
	let message_content = message.content;
	let message_arr = message_content.split(' ');
	let first_word = message_arr[0].toLowerCase();
	let options = {};

	// Do not listen to own name
	if (message.author.username === name) {
		callback();
		return;
	}

	// Accept command if the first word is a name
	if (first_word === name.toLowerCase()) {
		// No commands
		if (message_arr.length == 1) {
			callback();
			return;
		}
		message_arr.shift();

		// Options parse
		while (message_arr[0].substr(0,1) == '-') {
			let option = message_arr[0].substr(1).toLowerCase()
			options[option] = true;
			message_arr.shift();
		}

		// No command
		if (message_arr.length == 0) {
			callback();
		}

		// Run the command
		let command = message_arr.shift();
		if (commands[command] != null) {
			// Commands that take no suffix
			if (message_arr.length == 0) {
				commands[command].run(options, message, callback);
			} else {
				let suffix = message_arr.join(" ");
				commands[command].run(options, suffix, callback);
			}
		} else {
			callback(new Error("Command is invalid."), null);
		}
	// Throw an error if the request is not valid
	} else {
		callback();
	}
}

/**
 * Handles commands that are prefixed with "/"
 * @param  {Object} message - Discord message object
 * @param  {Function} callback 
 * @return {voids}
 */
function onSlash(message, callback) {
	let first = message.content.split(' ')[0];
	if (first.substring(0,1) == '/') {
		let command = first.substring(1);
		if (slash_commands[command] != null) {
			slash_commands[command].run(message, (err, response) => {
				if (err) {
					callback(err);
				} else {
					callback(null, response);
				}
			});
		}
	}
}

/**
 * Response handler for commands without name prefix
 * @param  {Object} message - Discord message object
 * @param  {Function} callback
 * @return {void}
 */
function autoResponse(message, callback) {
	let message_arr = message.content.split(' ');
	for (let i = 0; i < message_arr.length; i++) {
		if (autoResponses[message_arr[i]] != null) {
			// If we need to deal with an error later, we can make
			// some statements to deal with it, for now we just say null
			autoResponses[message_arr[i]].run((err, response) => {
				callback(null, response);
			});
		}
	}
}

/**
 * Creates an imgflip meme
 * @param  {string} template_id - ID for the meme template to use
 * @param  {string} top_text - String for the text at the top of the meme
 * @param  {string} bot_text - String for the text at the bottom of the meme
 * @param  {Function} callback
 * @return {void}
 */
function imgflip(template_id, top_text, bot_text, callback) {
	let requestParams = {
		url: conf.urls.meme,
		qs: {
			template_id: template_id,
			username: process.env.MEME_USER,
			password: process.env.MEME_PASS,
			text0: top_text,
			text1: bot_text
		}
	};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback(new Error("Imgflip error."), "Bad Request.");
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.success) {
				let response_url = responseObj.data.url;
				callback(null, response_url);
			} else {
				callback(null, "Bad meme :(");
			}
		}
	});
}

/**
 * Queries for a google image
 * @param  {string} query - Query string to search google images for
 * @param  {Function} callback
 * @return {void}
 */
function googleImg(query, callback) {
	let requestParams = {
		url: conf.urls.google,
		qs: {
			q: query,
			key: process.env.IMG_KEY,
			cx: process.env.IMG_CX,
			searchType: conf.google_image_params['searchType'],
			fileType: conf.google_image_params['fileType'],
			alt: conf.google_image_params['alt']
		}
	};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback(new Error("Google error."), "Bad Request.");
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.items) {
				if (responseObj.items.length) {
					let random_index = Math.floor(Math.random() * responseObj.items.length);
					let response_url = responseObj.items[random_index].link;
					callback(null, response_url);
				} else {
					callback(null, "No results :(");
				}
			} else {
				callback(null, "No results :(");
			}
		}
	});
}

/**
 * Gets the weather information based on the location query
 * @param  {string} query
 * @param  {Function} callback
 * @return {void}
 */
function weather(query, callback) {
	let request_url = conf.urls.weatherstart 
		+ process.env.WEATHER 
		+ conf.urls.weatherend
		+ query + '.json';

	request(request_url, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback(new Error("Wunderground error."), "Bad Request.");
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.location != undefined) {
				let cityweather = responseObj.current_observation;
				let cityloc = responseObj.location;
				let response = "It is currently " + cityweather.temperature_string
					+ " in " + cityloc.city + ".\n"
					+ "The weather there is currently " + cityweather.weather + ".";
				callback(null, response);
			} else {
				callback(null, "No city :(");
			}
		}
	});
}

/**
 * Returns if a string is a positive integer.
 * THIS FUNCTION IS LITERALLY MAGIC.
 * @param  {string}  n
 * @return {Boolean}
 */
function isPositiveInteger(n) {
    return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
}

/**
 * Rolls a random integer between a and b
 * @param  {string} user
 * @param  {int} a - lower bound
 * @param  {int} b - upper bound
 * @return {string}
 */
function roll(user, a, b) {
	if (b === undefined || b === null) {
		let rand_roll = Math.floor(Math.random()*a)+1;
		if (a > 0) {
			return user + " rolls " + rand_roll + " (1-" + a + ")";
		} else {
			return user + " rolls " + rand_roll + " (" + a + "-0)";
		}
	// 2 numbers given, roll from a to b, assuming a < b
	} else {
		if (a > b) {
			return "Rolls require the first number to be less than the second.";
		}
		let rand_roll = Math.floor(Math.random()*(b-a+1))+parseInt(a);
		return user + " rolls " + rand_roll + " (" + a + "-" + b + ")"; 
	}
}

/**
 * Returns the first word delimited by spaces in the string
 * @param  {string} str
 * @return {string}    
 */
function getFirstWord(str) {
	return str.split(' ')[0];
}

/**
 * Handles a successfully sent message by the bot client
 * @param  {?Error} err
 * @param  {Message} message
 * @return {void}    
 */
function handleMessageSent(err, message) {
	if (err) {
		console.log(err);
		return;
	}
	messages.push(message);
	if (messages.length > MAX_MESSAGES_IN_MEMORY) {
		messages.shift();
	}
}

// Bot initializiation
bot.on("ready", function() {
	name = bot.internal.user.username;
	console.log(name + " is online.");
});

// Message handler
bot.on("message", function(message){
	onMessage(message, (err, response) => {
		if (err) {
			console.log(err);
		}
		if (response) {
			bot.sendMessage(message.channel, response, handleMessageSent);
		}
	});
	onSlash(message, (err, response) => {
		if (err) {
			console.log(err);
		} else {
			bot.sendMessage(message.channel, response, handleMessageSent);
		}
	});
	autoResponse(message, (err, response) => {
		if (err) {
			console.log(err)
		} else {
			bot.sendMessage(message.channel, response, handleMessageSent);
		}
	});
});

