var Discord = require('discord.js');

// Configs
var auth = require('./auth.json');
var conf = require('./config.json');

// Dependencies
var request = require('request');

// Discord Bot
var bot = new Discord.Client();
var name = "";

var commands = {
	"gif" : {
		"protocol" : function(suffix, callback) {
			var query = '&q=' + suffix.split(' ').join('+');
			var params = ''
			for (param in conf.giphy_params) {
				params += '&' + param + '=' + conf.giphy_params[param];
			}

			var request_url = conf.urls.giphy + '?' + query + params;
			request(request_url, function (error, response, body) {
				//console.log(arguments)
				if (error || response.statusCode !== 200) {
					console.error("giphy: Got error: " + body);
					console.log(error);
					callback(new Error("Giphy error."), "Bad Request.");
				}
				else {
					var responseObj = JSON.parse(body);
					// console.log(responseObj.data);
					if (responseObj.data.length) {
						var random_index = Math.floor(Math.random() * responseObj.data.length);
						console.log(random_index);
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

	}
}

function parseCommand(message, callback) {
	var message_content = message.content;
	var first_word = message_content.split(' ')[0];

	// Accept command if the first word is a name
	if (first_word === name) {
		var command = message_content.split(' ')[1];

		// Terrible way to parse a query
		var split1 = message_content.indexOf(' ');
		var split2 = message_content.indexOf(' ', split1+1);

		if (commands[command] != null) {
			var suffix = message_content.substring(split2+1);
			console.log(command);
			console.log(suffix);

			commands[command].protocol(suffix, function(err, response) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, response);
				}
			});
		} else {
			callback(new Error("Command is invalid."), null);
		}
	// Throw an error if the request is not valid
	} else {
		callback(new Error("Not a request."), null);
	}
}

// Bot initializiation
bot.on("ready", function() {
	name = bot.internal.user.username;
});

// Bot responses
bot.on("message", function(message){
	parseCommand(message, function respond(err, response) {
		if (err) {
			console.log(err);
		} else {
			bot.sendMessage(message.channel, response);
		}
	});
});

bot.login(auth.email, auth.password);
