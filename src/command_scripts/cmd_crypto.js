/**
 * @file cmd_crypto
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

const PRICE_ENDPOINT = '/prices/';
const SPOT_PRICE_DELIM = '-';
const SPOT_PRICE_ENDPOINT = '/spot';
const EXCHANGE_PRICE_ENDPOINT = '/exchange-rates'
const DEFAULT_CRYPTO = 'BTC';
const DEFAULT_CURRENCY = 'USD';

// ---------------------------------
// Private
// ---------------------------------

function getCurrentDate() {
	const dateToday = new Date();
	return dateToday.getFullYear() + '-' + (dateToday.getMonth() + 1) + '-' + dateToday.getDate();
}

/**
 * Gets crypto prices from coinbase
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
const _crypto = (options, message, callback) => {
	const params = message.content.split(' ');
	const CRYPTO_TYPE = params.length > 0 && !!params[0] ? params[0] : DEFAULT_CRYPTO;
	const CURRENCY_TYPE = params.length > 1 ? params[1] : DEFAULT_CURRENCY;
	const DATE_PARAM = params.length > 2 ? params[2] : getCurrentDate();
	const CRYPTO_EXCHANGE_URL_PARAM = CRYPTO_TYPE + SPOT_PRICE_DELIM + CURRENCY_TYPE;

	const FROM_CURRENCY = CRYPTO_TYPE.toUpperCase();
	const TO_CURRENCY = CURRENCY_TYPE.toUpperCase();
	const requestUrl = conf.urls.coinbase + EXCHANGE_PRICE_ENDPOINT;

	const requestParams = {
			url: requestUrl,
			qs: {
				currency: FROM_CURRENCY
			}
		};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback("Bad Request.");
		} else {
			let responseObj = JSON.parse(body);
			if (responseObj.data) {
				callback(`\`${FROM_CURRENCY} to ${TO_CURRENCY}: ${responseObj.data.rates[TO_CURRENCY]}\``);
			} else {
				callback("No results :(");
			}
		}
	});
}

module.exports.crypto = {
	run: _crypto,
	usage: "crypto <currency-from> <currency-to>",
	description: "Returns the crypto exchange price via coinbase"
}
