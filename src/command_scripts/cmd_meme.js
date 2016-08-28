/**
 * @file cmd_meme
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

let conf = require('../config.json'),
	request = require('request');

// ---------------------------------
// Private
// ---------------------------------

/**
 * Creates an imgflip meme
 * @param  {string} template_id - ID for the meme template to use
 * @param  {string} top_text - String for the text at the top of the meme
 * @param  {string} bot_text - String for the text at the bottom of the meme
 * @param  {Function} callback
 * @return {void}
 * @private
 */
let _imgflip = (template_id, top_text, bot_text, callback) => {
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
 * Creates a meme using imgflip
 * @param  {Object}   options
 * @param  {Message}   message
 * @param  {Function} callback
 * @return {void}
 * @private          
 */
let _meme = (options, message, callback) => {
	let suffix = message.content;
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

		_imgflip(conf.meme_ids[template_id], top_text, bot_text, callback);		
	}
}

module.exports = {
	"meme" : {
		run: _meme,
		usage: "meme <template_id> \"<top-text>\" \"<?bottom-text>\"",
		description: "Creates a meme from imgflip. Templates can be found with \"meme help\""
	}
}