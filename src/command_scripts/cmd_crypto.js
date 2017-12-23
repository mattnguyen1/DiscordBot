/**
 * @file cmd_crypto
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import conf from "../config.json";
import request from "request";
import each from 'async/each';

// ---------------------------------
// Constants
// ---------------------------------

const PRICE_ENDPOINT = '/prices/';
const SPOT_PRICE_DELIM = '-';
const SPOT_PRICE_ENDPOINT = '/spot';
const EXCHANGE_PRICE_ENDPOINT = '/exchange-rates'
const DEFAULT_CRYPTO = 'BTC';
const DEFAULT_CURRENCY = 'USD';
const CRYPTO_LIST = ['BTC', 'LTC', 'ETH', 'BCH'];

// ---------------------------------
// Private
// ---------------------------------

function getCurrentDate() {
	const dateToday = new Date();
	return dateToday.getFullYear() + '-' + (dateToday.getMonth() + 1) + '-' + dateToday.getDate();
}

function requestPrice(fromCurrency, callback) {
	const requestUrl = conf.urls.coinbase + EXCHANGE_PRICE_ENDPOINT;
	const requestParams = {
			url: requestUrl,
			qs: {
				currency: fromCurrency
			}
		};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback('Could not fetch price.');
			return;
		}

		let responseObj = JSON.parse(body);
		if (responseObj.data) {
			callback(null, responseObj.data.rates);
		} else {
			callback('Could not fetch price.');
		}
	})
}

function getAllCrypto(optToCurrency, callback) {
	const cryptoPrices = {};
	const toCurrency = optToCurrency || 'USD';
	each(CRYPTO_LIST, function getPrice(currency, getPriceCallback) {
		requestPrice(currency, (err, currencyRates) => {
			if (err) {
				getPriceCallback(err);
				return;
			}

			cryptoPrices[currency] = currencyRates[toCurrency];
			getPriceCallback();
		});
	}, (getAllCryptoErr) => {
		if (getAllCryptoErr) {
			callback('Could not fetch crypto prices.');
			return;
		}

		callback(null, cryptoPrices);
	});
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
	const isRequestForList = params.length > 0 && params[0].toLowerCase() === 'list';
	const CRYPTO_TYPE = params.length > 0 && !!params[0] ? params[0] : DEFAULT_CRYPTO;
	const CURRENCY_TYPE = params.length > 1 ? params[1] : DEFAULT_CURRENCY;
	const DATE_PARAM = params.length > 2 ? params[2] : getCurrentDate();
	const CRYPTO_EXCHANGE_URL_PARAM = CRYPTO_TYPE + SPOT_PRICE_DELIM + CURRENCY_TYPE;

	const FROM_CURRENCY = CRYPTO_TYPE.toUpperCase();
	const TO_CURRENCY = CURRENCY_TYPE.toUpperCase();
	const requestUrl = conf.urls.coinbase + EXCHANGE_PRICE_ENDPOINT;

	if (isRequestForList) {
		getAllCrypto(TO_CURRENCY, (err, rates) => {
			if (err) {
				callback(err);
				return;
			}
			let outputString = `As ${TO_CURRENCY}:\n\`\`\``;

			for (const cryptoType in rates) {
				const cryptoPrice = rates[cryptoType];
				outputString += `${cryptoType}: ${cryptoPrice}\n`;
			}
			outputString += '```';
			callback(outputString);
		});
	} else {
		requestPrice(FROM_CURRENCY, (err, rates) => {
			if (err) {
				callback(err);
				return;
			}

			callback(`\`${FROM_CURRENCY} to ${TO_CURRENCY}: ${rates[TO_CURRENCY]}\``);
		});
	}
}

module.exports.crypto = {
	run: _crypto,
	usage: "crypto <currency-from> <currency-to>",
	description: "Returns the crypto exchange price via coinbase"
}
