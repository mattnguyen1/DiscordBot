/**
 * @file cmd_dokkan
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

const DOKKAN_CARD_API_PATH = "/cards";
const DOKKAN_SEARCH_PARAM = "search_q=";
const DEFAULT_LIMIT = 3;
const DEFAULT_OFFSET = 0;

// ---------------------------------
// Private
// ---------------------------------

/**
 * Gets the top dokkan cards based on the search query
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
function dokkan(options, message, callback) {
	const query = message.content;

  let requestUrl = conf.urls.dokkin + DOKKAN_CARD_API_PATH + "?"
    + DOKKAN_SEARCH_PARAM + query
    + "&limit=" + DEFAULT_LIMIT
    + "&offset=" + DEFAULT_OFFSET;


  request(requestUrl, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      callback(new Error("dokk.in error."), "Bad Request.");
    }
    else {
      // console.log("success", response)
      const cardResponse = JSON.parse(body);
      const cards = cardResponse.cards;
      const cardUrls = cards.map((card) => card.url);
      const response = cardUrls.join("\n")
      callback(response);
    }
  });
}

module.exports.dokkan = {
	run: dokkan,
	usage: "dokkan <search query></search> \n",
	description: "Returns dokkan card results."
}