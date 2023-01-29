/**
 * @file bot.js
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("./config");
const altCmds = require("./altCommands.json");
const extend = require("extend");
const async = require("async");
const url = require("url");
const request = require("request");
const express = require("express");
const redisClient = require("./redisClient");
const { bot } = require("./discordClient");
const { messages, addTimer, sendMessage } = require("./botUtils");

// ---------------------------------
// Vars
// ---------------------------------

let name = "",
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
  MS_IN_HOURS = 1000 * 60 * 60,
  MS_IN_DAYS = 1000 * 60 * 60 * 24,
  MS_IN_YEARS = 1000 * 60 * 60 * 24 * 365,
  MAX_MESSAGES_IN_MEMORY = 100;

const autoResponses = {
  lategong: conf.urls.leigong,
};

const autoDeleteList = {
  "!airhorn": true,
};

function isBotCommand(str) {
  return str === name.toLowerCase();
}

function isOption(str) {
  return str.substring(0, 1) === "-";
}

function getOptionFromString(str) {
  return str.substring(1).toLowerCase();
}

function getCommandParams(splitMessage, paramStartIndex) {
  return splitMessage.slice(paramStartIndex).join(" ");
}

// ---------------------------------
// Public
// ---------------------------------

async function init() {
  console.log("Starting Discord bot script.");

  // Obtain the port the bot client will listen on
  app.set("port", process.env.PORT || 5000);
  app
    .get("/", function (request, response) {
      let result = "App is running";
      response.send(result);
    })
    .listen(app.get("port"), function () {
      console.log(
        "App is running, server is listening on port ",
        app.get("port")
      );
    });

  // Login with the token secret
  bot.login(process.env.CLIENT_SECRET);

  await redisClient.connect();

  // Load Reminders
  try {
    const storedReminders = await redisClient.HGETALL("reminders");
    console.log("stored reminders", storedReminders);
    for (let key in storedReminders) {
      const timestamp = JSON.parse(key);
      if (timestamp.time < Date.now()) {
        redisClient.HDEL("reminders", key);
      }
      addTimer(timestamp, storedReminders[key]);
    }
  } catch (err) {
    console.log("Redis load reminders error: " + err);
  }

  // Load bot command scripts
  let commandScriptsPath = require("path").join(__dirname, "command_scripts");
  require("fs")
    .readdirSync(commandScriptsPath)
    .forEach(function (file) {
      let script = require("./command_scripts/" + file);
      extend(commands, script);
    });

  // Load slash command scripts
  let slashScriptsPath = require("path").join(__dirname, "slash_scripts");
  require("fs")
    .readdirSync(slashScriptsPath)
    .forEach(function (file) {
      let script = require("./slash_scripts/" + file);
      extend(slash_commands, script);
    });
}

/**
 * Handles messages prefixed with the bot's name
 * @param  {Object} message - Discord message object
 * @param  {Function} callback
 * @return {void}
 */
function onMessage(message, callback) {
  let messageContent = message.content,
    wordsInMessage = messageContent.split(" "),
    firstWord = wordsInMessage[0].toLowerCase(),
    options = {};

  // Do not listen to own name
  if (message.author.username === name) {
    callback();
    return;
  }

  // No commands
  if (wordsInMessage.length == 1) {
    callback();
    return;
  }

  if (isBotCommand(firstWord)) {
    let messageIter = 1,
      nextWord = wordsInMessage[messageIter],
      command;

    // Check if it's a command
    if (!commands[nextWord] && !altCmds[nextWord]) {
      callback();
      return;
    }

    // Use the alt command if that is what was passed in
    if (!!altCmds[nextWord]) {
      nextWord = altCmds[nextWord];
    }

    command = commands[nextWord];
    message.content = "";

    // Parse options to pass in
    while ((nextWord = wordsInMessage[++messageIter]) && isOption(nextWord)) {
      let option = getOptionFromString(nextWord);
      options[option] = true;
    }

    // Add params if it exists
    if (nextWord) {
      let commandParams = getCommandParams(wordsInMessage, messageIter);
      message.content = commandParams;
    }
    command.run(options, message, callback);
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
  let first = message.content.split(" ")[0];
  if (first.substring(0, 1) == "/") {
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
  let wordsInMessage = message.content.split(" ");
  for (let i = 0; i < wordsInMessage.length; i++) {
    if (autoResponses[wordsInMessage[i]] != null) {
      callback(autoResponses[wordsInMessage[i]]);
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
    message.delete().catch(console.log);
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
};

function handleMessageReceived(message, res) {
  if (res) {
    sendMessage(message.channel, res, handleMessageSent);
  }
}

init();

// Bot initializiation
bot.on("ready", function () {
  name = bot.user.username;
  console.log(name + " is online.");
});

// Message handler
bot.on("message", function (message) {
  onMessage(message, handleMessageReceived.bind(this, message));
  onSlash(message, handleMessageReceived.bind(this, message));
  autoResponse(message, handleMessageReceived.bind(this, message));
  autoDelete(message);
});
