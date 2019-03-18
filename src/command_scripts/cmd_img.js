/**
 * @file cmd_img
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("../config");
const request = require("request");
const { isImageURLNSFW } = require("../util/sightengine-utils");

// ---------------------------------
// Private
// ---------------------------------

const isQueryNSFWCache = {};

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
		if (error || response.statusCode !== 200) {
			console.log(error, response.statusCode, response);
			callback("Bad Request.");
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.items) {
				if (responseObj.items.length) {
					let random_index = Math.floor(Math.random() * responseObj.items.length);
					let response_url = responseObj.items[random_index].link;

					if (isQueryNSFWCache.hasOwnProperty(query)) {
						if (isQueryNSFWCache[query] > 2000) {
							callback("What's wrong with you?");
							return;
						} else if (isQueryNSFWCache[query] < -2) {
							callback(response_url);
							return;
						}
					}
					isImageURLNSFW(response_url, (err, isNSFW) => {
						if (err) {
							callback("Couldn't detect if NSFW. Bailing out.");
							return;
						}

						
						if (isNSFW) {
							if (isQueryNSFWCache.hasOwnProperty(query)) {
								isQueryNSFWCache[query] += 1000;
							} else {
								isQueryNSFWCache[query] = 1000;
							}
							callback("Image flagged as NSFW.");
						} else {
							if (isQueryNSFWCache.hasOwnProperty(query)) {
								isQueryNSFWCache[query] -= 1;
							} else {
								isQueryNSFWCache[query] = -1;
							}
							callback(response_url);
						}
					})
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
