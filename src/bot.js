/**
 * @file bot.js
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import conf from "./config.json";
import extend from "extend";
import async from "async";
import url from "url";
import request from "request";
import express from "express";
import redisClient from "./redisClient";
import { bot } from "./discordClient";
import { messages, addTimer, sendMessage } from "./botUtils";

// ---------------------------------
// Vars
// ---------------------------------

let	name = "",
	app = express(),
	commands = {},
	slash_commands = {},
	sfw = false,
	isListeningOnPort = false;

// ---------------------------------
// Const
// ---------------------------------

const MS_IN_SECONDS = 1000,
		MS_IN_MINUTES = 1000 * 60,
		MS_IN_HOURS	= 1000 * 60 * 60,
		MS_IN_DAYS = 1000 * 60 * 60 * 24,
		MS_IN_YEARS = 1000 * 60 * 60 * 24 * 365,
		MAX_MESSAGES_IN_MEMORY = 100;

const autoResponses = {
	"Kappa": conf.urls.Kappa,
	"lategong" : conf.urls.leigong
}

const autoDeleteList = {
	"!airhorn": true
}

// ---------------------------------
// Public
// ---------------------------------

function init() {
	console.log("Starting Discord bot script.");

	// Obtain the port the bot client will listen on
	app.set('port', (process.env.PORT || 5000));
	app.get('/', function(request, response) {
	    let result = 'App is running'
	    response.send(result);
	}).listen(app.get('port'), function() {
	    console.log('App is running, server is listening on port ', app.get('port'));
	});

	// Login with the token secret
	bot.login(process.env.CLIENT_SECRET);

	// Load Reminders
	redisClient.hgetall("reminders", (err, obj) => {
		if (err) {
			console.log("Redis load reminders error: " + err);
			return;
		}
		for (let key in obj) {
			if (obj.hasOwnProperty(key)) {
				let timestamp = JSON.parse(key);
				if (timestamp < Date.now()) {
					redisClient.hdel("reminders", key);
				}
				addTimer(timestamp, obj[key]);
			}
		}
	});

	// Load bot command scripts
	let commandScriptsPath = require("path").join(__dirname, "command_scripts");
	require("fs").readdirSync(commandScriptsPath).forEach(function(file) {
		let script = require("./command_scripts/" + file)
	  	extend(commands,script);
	});

	// Load slash command scripts
	let slashScriptsPath = require("path").join(__dirname, "slash_scripts");
	require("fs").readdirSync(slashScriptsPath).forEach(function(file) {
		let script = require("./slash_scripts/" + file)
	  	extend(slash_commands,script);
	});
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

	// Accept command if the first word is the name
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
			message.content = message_arr.join(" ");
			commands[command].run(options, message, callback);
		} else {
			callback();
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
			slash_commands[command].run(message, callback);
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
			callback(autoResponses[message_arr[i]]);
		}
	}
}

/**
 * Auto deletes messages
 * @param  {Message} message
 * @return {void}
 */
function autoDelete(message) {
	if (autoDeleteList[message.content]) {
		message.delete()
			.catch(console.log);
	}
}

/**
 * Handles a successfully sent message by the bot client
 * @param  {?Error} err
 * @param  {Message} message
 * @return {void}    
 */
let handleMessageSent = (message) => {
	if (!messages[message.channel.id]) {
		messages[message.channel.id] = [];
	}
	messages[message.channel.id].push(message);

	if (messages[message.channel.id].length > MAX_MESSAGES_IN_MEMORY) {
		messages[message.channel.id].shift();
	}
}

function handleMessageReceived(message, res) {
	if (res) {
		sendMessage(message.channel, res, handleMessageSent);
	}
}

init();

// Bot initializiation
bot.on("ready", function() {
	name = bot.user.username;
	console.log(name + " is online.");
});

// Message handler
bot.on("message", function(message){
	onMessage(message, handleMessageReceived.bind(this, message));
	onSlash(message, handleMessageReceived.bind(this, message));
	autoResponse(message, handleMessageReceived.bind(this, message));
	autoDelete(message);
});