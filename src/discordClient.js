import Discord from 'discord.js';
let bot = new Discord.Client();
let name;

bot.on("ready", function() {
	console.log(name)
	name = bot.user.username;
});

function getBotName() {
	return bot && bot.user ? bot.user.username : '<bot name>';
}

module.exports = {
	bot,
	getBotName,
};