/**
 * @file sightengineUtils
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import conf from "../config.json";
import request from "request";

// ---------------------------------
// Constants
// ---------------------------------

// The safety threshold between 0 and 1 where 1 is absolutely safe
const SAFETY_THRESHOLD = .65;

// ---------------------------------
// Private
// ---------------------------------

const isNSFWURLCache = {};

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
	/**
	 * Returns whether the environment contains sightengine credentials
	 * @return {boolean}
	 */
	hasSightEngineConfigs: () => {
		return !!process.env.SIGHTENGINE_USER && !!process.env.SIGHTENGINE_SECRET;
	},

	/**
	 * Returns whether an image url is nsfw
	 * @param  {string} url
	 * @return {boolean}
	 */
	isImageURLNSFW: (url, callback) => {
		if (isNSFWURLCache.hasOwnProperty(url)) {
			callback(null, isNSFWURLCache[url]);
			return;
		}

		const requestParams = {
			url: conf.urls.sightengine,
			qs: {
				models: "nudity",
				api_user: process.env.SIGHTENGINE_USER,
				api_secret: process.env.SIGHTENGINE_SECRET,
				url,
			}
		}

		request(requestParams, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				callback("Bad request.");
				return;
			}
			let responseObj = JSON.parse(body);
			if (responseObj.status !== "success" || !responseObj.nudity) {
				callback('Bad request.');
				return;
			}

			isNSFWURLCache[url] = responseObj.nudity.safe <= SAFETY_THRESHOLD;

			if (responseObj.nudity.safe > SAFETY_THRESHOLD) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		});
	}
}