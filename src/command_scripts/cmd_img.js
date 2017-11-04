/**
 * @file cmd_img
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import conf from "../config.json";
import request from "request";

// ---------------------------------
// Private
// ---------------------------------

/**
 * Queries for a google image
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _googleImage = (options, message, callback) => {
	let query = message.content,
		requestParams = {
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
		callback("Images disabled.");
		return;
		if (error || response.statusCode !== 200) {
			console.log(error, response.statusCode);
			callback("Bad Request.");
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.items) {
				if (responseObj.items.length) {
					let random_index = Math.floor(Math.random() * responseObj.items.length);
					let response_url = responseObj.items[random_index].link;
					callback(response_url);
				} else {
					callback("No results :(");
				}
			} else {
				callback("No results :(");
			}
		}
	});
}

module.exports.image = {
	run: _googleImage,
	usage: "image <query>",
	description: "Returns a random image based on search query."
}