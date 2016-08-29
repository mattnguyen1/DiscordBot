/**
 * @file cmd_wcl
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import conf from "../config.json";
import jsdom from "jsdom";

// ---------------------------------
// Private
// ---------------------------------

/**
 * Obtain the latest warcraft logs for the guild ID
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _wcl = (options, message, callback) => {
	let suffix = message.content;
	if (options['setalias']) {
		let suffix_arr = suffix.split(' ');
		let guildId = suffix_arr[0];
		suffix_arr.shift();
		redisClient.hset("wcl", suffix_arr[0], suffix_arr.join(' '));
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
	});
}

module.exports.wcl = {
	run: _wcl,
	usage: "wcl <guild-alias> \n"
		+ "Options: \n"
		+ "\t -set: wcl <wcl-id> <guild-alias>\n\n"
		+ "Example: wcl 123 my cool guild",
	description: "Obtain the latest Warcraft Log for the given guild ID"
}