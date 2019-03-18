/**
 * @file cmd_gifs
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("../config");
const request = require("request");

// ---------------------------------
// Private
// ---------------------------------

/**
 * Requests a Giphy gif based on query
 * @param  {Object}   options
 * @param  {Message}   message
 * @param  {Function} callback
 * @return {void}
 * @private
 */
let _gif = (options, message, callback) => {
	let suffix = message.content;
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
			callback("Bad Request.");
			return;
		}
		let responseObj = JSON.parse(body);
		if (responseObj.data.length) {
			let random_index = Math.floor(Math.random() * responseObj.data.length);
			let response_url = responseObj.data[random_index].images.fixed_height.url;
			callback(response_url);
		} else {
			callback("No results :(");
		}
	});
}

module.exports.gif = {
	run: _gif,
	usage: "gif <query>",
	description: "Searches and outputs a Giphy gif based on query text."
};