"use strict";

let Discord = require('discord.js');

// Configs
let conf 	= require('./config.json');

// Dependencies
let request 		= require('request');
let express 		= require('express');
let wolframClient 	= require('node-wolfram')
let helpers 		= require('./helpers.js');
let exec 			= require('child_process').exec;

// Vars
let bot 	= new Discord.Client();
let wolfram = new wolframClient(process.env.WOLFRAM_KEY);
let name 	= "";
let app     = express();

// Bools
let sfw		= false;
let isListeningOnPort = false;

console.log("Starting Discord bot script.");
// Heroku $PORT error fix
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    let result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

var commands = {
	"gif" : {
		run: (options, suffix, callback) => {
			let requestParams = {
				qs: {
					q: suffix,
					limit: 25,
					fmt: "json",
					api_key: process.nev.GIPHY_KEY,
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
				let response = "List of meme templates: \n";
				for (key in conf.meme_ids){
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
	"join" : {
		run: (options, suffix, callback) => {
			bot.joinServer(suffix, (err, server) => {
				if (err) {
					callback(null, "Failed to join " + server + ".");
					return
				}
				bot.sendMessage(server, "Hello!");
				callback(null, "Succesfully joined " + server + ".");
			});
		}
	},
	"leave" : {
		run: (options, message, callback) => {
			let server = message.channel;
			bot.leaveServer(server, (err) => {
				if (err) {
					callback(null, "It won't let me leave!");
				}
			});
		}
	},
	"help" : {
		run: (options, message, callback) => {
			let response = "Here are some of the commands I can do!\n";
			response +=  "\t" + name + " gif <query>\n";
			response +=  "\t" + name + " image <query>\n";
			response +=  "\t" + name + " meme help\n";
			response +=  "\t" + name + " weather <zipcode>\n";
			response +=  "\t" + name + " join <invite-link>\n";
			response +=	 "\t" + name + " wolfram <query>\n";
			response +=  "\t" + name + " leave\n";
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
			if (sfx_arr.length == 1) {
				callback(null,roll(message.author, 1, 100));
			}
			if (sfx_arr.length == 2) {
				if (sfx_arr[1] == "rick") {
					callback(null,"https://www.youtube.com/watch?v=dQw4w9WgXcQ");
				}
				if (isPositiveInteger(sfx_arr[1])) {
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
				commands[command].run(options, message, (err, response) => {
					if (err) {
						callback(err);
						return;
					}
					callback(null, response);
				});
			} else {
				let suffix = message_arr.join(" ");
				commands[command].run(options, suffix, (err, response) => {
					if (err) {
						callback(err);
						return;
					}
					callback(null, response);
				});
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
		} else {
			if (response) {
				bot.sendMessage(message.channel, response, (err, message) => {
					if (err) {
						console.log("onMessage error: " + err);
					}
				});
			}
		}
	});
	onSlash(message, (err, response) => {
		if (err) {
			console.log(err);
		} else {
			bot.sendMessage(message.channel, response, (err, message) => {
				if (err) {
					console.log("parse slash error: " +err);
				}
			});
		}
	});
	autoResponse(message, (err, response) => {
		if (err) {
			console.log(err)
		} else {
			bot.sendMessage(message.channel, response, (err, message) => {
				if (err) {
					console.log("auto respond error: " +err);
				}
			});
		}
	});
});

// Login with the token secret
bot.loginWithToken(process.env.CLIENT_SECRET);
