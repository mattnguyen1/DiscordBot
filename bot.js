var Discord = require('discord.js');

// Configs
var conf 	= require('./config.json');

// Dependencies
var request 		= require('request');
var express 		= require('express');
var wolframClient 	= require('node-wolfram')
var helpers 		= require('./helpers.js');
var exec 			= require('child_process').exec;

// Vars
var bot 	= new Discord.Client();
var wolfram = new wolframClient(process.env.WOLFRAM_KEY);
var name 	= "";
var app     = express();

// Bools
var sfw		= false;
var isListeningOnPort = false;

console.log("Starting Discord bot script.");
// Heroku $PORT error fix


var commands = {
	"gif" : {
		"protocol" : function(options, suffix, callback) {
			var query = '&q=' + suffix.split(' ').join('+');
			var params = ''
			for (param in conf.giphy_params) {
				params += '&' + param + '=' + conf.giphy_params[param];
			}
			params += '&api_key=' + process.env.GIPHY_KEY;
			if (options['sfw']) {
				params += '&rating=pg-13';
			} else if (options['nsfw']) {
				params += '&rating=r';
			}

			var request_url = conf.urls.giphy + '?' + query + params;
			console.log(request_url);
			request(request_url, function (error, response, body) {
				//console.log(arguments)
				if (error || response.statusCode !== 200) {
					console.error("giphy: Got error: " + body);
					console.log(error);
					callback(new Error("Giphy error."), "Bad Request.");
				}
				else {
					var responseObj = JSON.parse(body);
					console.log(responseObj.data.rating);
					if (responseObj.data.length) {
						var random_index = Math.floor(Math.random() * responseObj.data.length);
						// console.log(random_index);
						var response_url = responseObj.data[random_index].images.fixed_height.url;
						callback(null, response_url);
					} else {
						callback(null, "No results :(");
					}
				}
			}.bind(this));
		}
	},
	"meme" : {
		"protocol" : function(options, suffix, callback) {
			var sfx_arr = suffix.split('"');
			var sfx_split_space = suffix.split(' ');
			if (sfx_split_space[0].toLowerCase() == "help") {
				var response = "List of meme templates: \n";
				for (key in conf.meme_ids){
					response += "\t" + key + "\n";
				}
				response += "\nUsage:\n";
				response += "\t" + name + " meme meme_id \"<top-text>\" \"<bot-text>\"";
				callback(null, response);
				return;
			}

			var template_id = sfx_arr[0].trim();

			if (sfx_arr.length >= 2) {
				var top_text = sfx_arr[1];
				var bot_text = "";
				// Optional top text only
				if (sfx_arr.length >= 4 && sfx_arr[2] == ' ') {
					bot_text = sfx_arr[3];
				} 

				imgflip(conf.meme_ids[template_id], top_text, bot_text, callback);		
			}
		}
	},
	"image" : {
		"protocol" : function(options, suffix, callback) {
			google(suffix, callback);
		}
	},
	"weather" : {
		"protocol" : function(options, suffix, callback) {
			weather(suffix, callback);
		}
	},
	"wolfram" : {
		"protocol" : function(options, suffix, callback) {
			wolfram.query(suffix, function(err, result) {
				if (err) {
					callback(null, "Bad query.");
				} else {
					var response = "";
					if (result.queryresult == undefined) {
						callback(null, "Bad query.");
						return;
					}
					if (result.queryresult.pod == undefined) {
						console.log(result.queryresult);
						callback(null, "Bad query.");
						return;
					}
					for(var a=0; a<result.queryresult.pod.length && a < 5; a++) {
						var pod = result.queryresult.pod[a];
						response += "**" + pod.$.title + "**: \n";
						for(var b=0; b<pod.subpod.length; b++) {
							var subpod = pod.subpod[b];
							for(var c=0; c<subpod.plaintext.length; c++) {
								var text = subpod.plaintext[c];
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
		"protocol" : function(options, suffix, callback) {
			bot.joinServer(suffix, function(err, server) {
				if (err) {
					callback(null, "Failed to join " + server + ".");
				} else {
					bot.sendMessage(server, "Hello!");
					callback(null, "Succesfully joined " + server + ".");
				}
			});
		}
	},
	"leave" : {
		"protocol" : function(options, message, callback) {
			var server = message.channel;
			bot.leaveServer(server, function(err) {
				if (err) {
					callback(null, "It won't let me leave!");
				}
			});
		}
	},
	"help" : {
		"protocol" : function(options, message, callback) {
			var response = "Here are some of the commands I can do!\n";
			response +=  "\t" + name + " gif <query>\n";
			response +=  "\t" + name + " image <query>\n";
			response +=  "\t" + name + " meme help\n";
			response +=  "\t" + name + " weather <zipcode>\n";
			response +=  "\t" + name + " join <invite-link>\n";
			response +=  "\t" + name + " leave\n";
			response +=  "\t /roll <lower (optional)> <higher (optional)>\n\n";
			response +=  "See more about me at https://github.com/mattnguyen1/DiscordBot";
			callback(null, response);
		}
	},
	"logs" : {
		"protocol" : function(options, message, callback) {
			var child;
			child = exec("heroku logs -n 10", function(error, stdout, stderr) {
				// console.log('stdout: ' + stdout);
				// console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				}
				callback(null, stdout);
			});
		}	
	},
	"update" : {
		"protocol" : function(options, message, callback) {
			var child;
			child = exec("git pull", function(error, stdout, stderr) {
				// console.log('stdout: ' + stdout);
				// console.log('stderr: ' + stderr);
				if (error !== null) {
					console.log('exec error: ' + error);
				}
				callback(null, stdout);
			});
		}
	}
}

var slash_commands = {
	"roll" : {
		"protocol" : function(message, callback) {
			var sfx_arr = message.content.split(' ');
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

var responses = {
	"Kappa": {
		"protocol": function(callback) {
			callback(null, conf.urls.Kappa);
		}
	},
	"lategong" : {
		"protocol" : function(callback) {
			callback(null, conf.urls.leigong);
		}
	}
}

function parseCommand(message, callback) {
	var message_content = message.content;
	var message_arr = message_content.split(' ');
	var first_word = message_arr[0].toLowerCase();
	var options = {};

	// Accept command if the first word is a name
	if (first_word === name.toLowerCase()) {
		// No commands
		if (message_arr.length == 1) {
			callback(null,null);
			return;
		}
		message_arr.shift();

		// Options parse
		while (message_arr[0].substr(0,1) == '-') {
			console.log(message_arr[0].substr(1));
			if (message_arr[0].substr(1).toLowerCase() == 'sfw') {
				options['sfw'] = true;
			} else if (message_arr[0].substr(1).toLowerCase() == 'nsfw') {
				options['nsfw'] = true;
			} else {
				callback(null, message_arr[0].substr(1) + " is not a valid option.");
			}
			message_arr.shift();
		}

		// No actual command
		if (message_arr.length == 0) {
			callback(null,null);
		}
		var command = message_arr.shift();
		
		if (commands[command] != null) {
			// Commands that take no suffix
			if (message_arr.length == 0) {
				commands[command].protocol(options, message, function(err, response) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, response);
					}
				});
			} else {
				var suffix = message_arr.join(" ");
				commands[command].protocol(options, suffix, function(err, response) {
					if (err) {
						callback(err, null);
					} else {
						callback(null, response);
					}
				});
			}
		} else {
			callback(new Error("Command is invalid."), null);
		}
	// Throw an error if the request is not valid
	} else {
		callback(null, null);
	}
}

function parseSlash(message, callback) {
	var first = message.content.split(' ')[0];
	if (first.substring(0,1) == '/') {
		var command = first.substring(1);
		if (slash_commands[command] != null) {
			slash_commands[command].protocol(message, function(err, response) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, response);
				}
			});
		}
	}
}

function autoResponse(message, callback) {
	var message_arr = message.content.split(' ');
	var i;
	for (i = 0; i < message_arr.length; i++) {
		if (responses[message_arr[i]] != null) {
			// If we need to deal with an error later, we can make
			// some statements to deal with it, for now we just say null
			responses[message_arr[i]].protocol(function(err, response) {
				callback(null, response);
			});
		}
	}
}

// Create imgflip meme
function imgflip(template_id, top_text, bot_text, callback) {
	var request_url = conf.urls.meme + '?template_id=';

	request_url += template_id
	request_url += '&username=' + process.env.MEME_USER;
	request_url += '&password=' + process.env.MEME_PASS;
	request_url += '&text0=' + top_text;
	request_url += '&text1=' + bot_text;
	console.log(request_url);
	request(request_url, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			callback(new Error("Imgflip error."), "Bad Request.");
		}
		else {
			var responseObj = JSON.parse(body);
			// console.log(responseObj.data);
			if (responseObj.success) {
				var response_url = responseObj.data.url;
				console.log(response_url);
				console.log(callback);
				callback(null, response_url);
			} else {
				callback(null, "Bad meme :(");
			}
		}
	}.bind(this));
}

// Google CSE
function google(query, callback) {
	var request_url = conf.urls.google + '?q=';

	request_url += query;
	request_url += '&key=' + process.env.IMG_KEY;
	request_url += '&cx=' + process.env.IMG_CX;
	request_url += '&searchType=' + conf.google_image_params['searchType'];
	request_url += '&fileType=' + conf.google_image_params['fileType'];
	request_url += '&alt=' + conf.google_image_params['alt'];

	// console.log(conf.google_image_params);
	// for (param in conf.google_image_params) {
	// 	params += '&' + param + '=' + conf.google_image_params[param];
	// }

	// console.log(request_url);
	request(request_url, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			callback(new Error("Google error."), "Bad Request.");
		}
		else {
			var responseObj = JSON.parse(body);
			// console.log(responseObj.data);
			if (responseObj.items) {
				if (responseObj.items.length) {
					var random_index = Math.floor(Math.random() * responseObj.items.length);
					var response_url = responseObj.items[random_index].link;
					// console.log(response_url);
					// console.log(callback);
					callback(null, response_url);
				} else {
					callback(null, "No results :(");
				}
			} else {
				callback(null, "No results :(");
			}
		}
	}.bind(this));
}

function weather(query, callback) {
	var request_url = conf.urls.weatherstart 
		+ process.env.WEATHER 
		+ conf.urls.weatherend
		+ query
		+ '.json';
	console.log(request_url);

	request(request_url, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			callback(new Error("Wunderground error."), "Bad Request.");
		}
		else {
			var responseObj = JSON.parse(body);
			if (responseObj.location != undefined) {
				var cityweather = responseObj.current_observation;
				var cityloc = responseObj.location;
				var response = "It is currently " + cityweather.temperature_string
					+ " in " + cityloc.city + ".\n"
					+ "The weather there is currently " + cityweather.weather + ".";
				callback(null, response);
			} else {
				callback(null, "No city :(");
			}
		}
	}.bind(this));
}

function isPositiveInteger(n) {
    return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
}

function roll(user, a, b) {
	if (b === undefined || b === null) {
		var rand_roll = Math.floor(Math.random()*a)+1;
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
		var rand_roll = Math.floor(Math.random()*(b-a+1))+parseInt(a);
		return user + " rolls " + rand_roll + " (" + a + "-" + b + ")"; 
	}
}

// Bot initializiation
bot.on("ready", function() {
	name = bot.internal.user.username;
	console.log(name + " is online.");
});

// Bot responses
bot.on("message", function(message){
	parseCommand(message, function respond(err, response) {
		if (err) {
			console.log(err);
		} else {
			if (response !== null) {
				bot.sendMessage(message.channel, response, function(err, message) {
					if (err) {
						console.log("parse command error: " +err);
					}
				});
			}
		}
	});
	parseSlash(message, function respond(err, response) {
		if (err) {
			console.log(err);
		} else {
			bot.sendMessage(message.channel, response, function(err, message) {
				if (err) {
					console.log("parse slash error: " +err);
				}
			});
		}
	});
	autoResponse(message, function autoRespond(err, response) {
		if (err) {
			console.log(err)
		} else {
			bot.sendMessage(message.channel, response, function(err, message) {
				if (err) {
					console.log("auto respond error: " +err);
				}
			});
		}
	});
});

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
	isListeningOnPort = true;
    console.log('App is running, server is listening on port ', app.get('port'));
	bot.login(process.env.EMAIL, process.env.PASSWORD);
});

// Attempt login
// console.log(clientConnected);
// console.log(isListeningOnPort);
