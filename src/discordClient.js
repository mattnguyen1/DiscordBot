import Discord from 'discord.js';
let bot = new Discord.Client();
let name;

bot.on("ready", function() {
	name = bot.user.username;
});

module.exports = {
	bot,
	name
};