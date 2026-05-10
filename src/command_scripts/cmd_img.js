/**
 * @file cmd_img
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

const BRAVE_IMAGE_SEARCH_URL = "https://api.search.brave.com/res/v1/images/search";
const braveApiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;

function getRandomImageUrl(results) {
	if (!results || !results.length) {
		return null;
	}

	let randomIndex = Math.floor(Math.random() * results.length);
	let result = results[randomIndex];
	return (result.properties && result.properties.url) ||
		(result.image && result.image.src) ||
		(result.thumbnail && result.thumbnail.src) ||
		result.url ||
		null;
}

function handleImageUrl(response_url, callback) {
	if (!response_url) {
		callback("No results :(");
		return;
	}

	callback(response_url);
}

function _braveImage(query, callback) {
	let requestParams = {
		url: BRAVE_IMAGE_SEARCH_URL,
		headers: {
			"Accept": "application/json",
			"X-Subscription-Token": braveApiKey,
		},
		qs: {
			q: query,
			safesearch: "strict",
		},
	};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			let message = "Bad Request.";
			try {
				const parsedBody = JSON.parse(body);
				message = parsedBody.message || parsedBody.error || parsedBody.detail || message;
				if (parsedBody.meta && parsedBody.meta.errors) {
					message = JSON.stringify(parsedBody.meta.errors);
				}
			} catch (parseError) {}

			console.log("Brave image request failed", {
				error: error && error.message,
				statusCode: response && response.statusCode,
				message: message
			});
			callback(message);
			return;
		}

		let responseObj = JSON.parse(body);
		handleImageUrl(getRandomImageUrl(responseObj.results), callback);
	});
}

/**
 * Queries for an image
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _googleImage = (options, message, callback) => {
	let query = message.content;

	if (braveApiKey) {
		_braveImage(query, callback);
		return;
	}

	let requestParams = {
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
			let message = "Bad Request.";
			try {
				const parsedBody = JSON.parse(body);
				if (parsedBody.error && parsedBody.error.message) {
					message = parsedBody.error.message;
				}
			} catch (parseError) {}

			console.log("Google image request failed", {
				error: error && error.message,
				statusCode: response && response.statusCode,
				message: message
			});
			callback(message);
		}
		else {
			let responseObj = JSON.parse(body);
			if (responseObj.items) {
				if (responseObj.items.length) {
					let random_index = Math.floor(Math.random() * responseObj.items.length);
					handleImageUrl(responseObj.items[random_index].link, callback);
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
