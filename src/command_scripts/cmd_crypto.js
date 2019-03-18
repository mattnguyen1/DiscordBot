/**
 * @file cmd_crypto
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require('../config');
const request = require('request');
const eachSeries = require('async/eachSeries');

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
const VALIDATE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// ---------------------------------
// Private
// ---------------------------------

function getCurrentDate() {
	const dateToday = new Date();
	return dateToday.getFullYear() + '-' + (dateToday.getMonth() + 1) + '-' + dateToday.getDate();
}

function isDateFormat(dateStr) {
	return !!dateStr.match(VALIDATE_DATE_REGEX);
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

function requestPriceHistorical(fromCurrency, toCurrency, date, callback) {
	fromCurrency = fromCurrency.toUpperCase();
	toCurrency = toCurrency.toUpperCase();
	const CRYPTO_EXCHANGE_URL_PARAM = fromCurrency + SPOT_PRICE_DELIM + toCurrency;
	const requestUrl = conf.urls.coinbase + PRICE_ENDPOINT + CRYPTO_EXCHANGE_URL_PARAM + SPOT_PRICE_ENDPOINT;

	const requestParams = {
			url: requestUrl,
			qs: {
				date,
			}
		};

	request(requestParams, (error, response, body) => {
		if (error || response.statusCode !== 200) {
			callback('Could not fetch price.');
			return;
		}

		let responseObj = JSON.parse(body);
		if (responseObj.data) {
			callback(null, responseObj.data);
		} else {
			callback('Could not fetch price.');
		}
	})
}

function getAllCrypto(optToCurrency, callback) {
	const cryptoPrices = new Map();
	const toCurrency = optToCurrency || 'USD';
	eachSeries(CRYPTO_LIST, function getPrice(currency, getPriceCallback) {
		requestPrice(currency, (err, currencyRates) => {
			if (err) {
				getPriceCallback(err);
				return;
			}

			cryptoPrices.set(currency, currencyRates[toCurrency]);
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

function getAllCryptoHistorical(optToCurrency, date, callback) {
	const cryptoPrices = new Map();
	const toCurrency = CRYPTO_LIST.includes(optToCurrency) ? 'USD' : (optToCurrency ? optToCurrency: 'USD');
	eachSeries(CRYPTO_LIST, function getPrice(currency, getPriceCallback) {
		requestPriceHistorical(currency, toCurrency, date, (err, data) => {
			if (err) {
				getPriceCallback(err);
				return;
			}

			cryptoPrices.set(currency, data.amount);
			getPriceCallback();
		});
	}, (getAllCryptoHistoricalErr) => {
		if (getAllCryptoHistoricalErr) {
			callback('Could not fetch crypto prices.');
			return;
		}

		callback(null, cryptoPrices);
	});
}

function getPriceListString(toCurrency, prices, date) {
	date = date ? ` *(${date})*` : ''
	let outputString = `As ${toCurrency}${date}:\n\`\`\``;

	for (const [currency, price] of prices) {
		outputString += `${currency}: ${price}\n`;
	}
	outputString += '```';
	return outputString;
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
	let fromCurrencyParam = params.length > 0 && !!params[0] ? params[0] : DEFAULT_CRYPTO;
	let toCurrencyParam = params.length > 1 ? params[1] : DEFAULT_CURRENCY;
	let dateParam = params.length > 2 ? params[2] : null;

	// User could put in bot crypto btc 2017-12-23, which should be valid
	if (isDateFormat(toCurrencyParam)) {
		dateParam = toCurrencyParam;
		toCurrencyParam = DEFAULT_CURRENCY;
	} else if (isDateFormat(fromCurrencyParam)) {
		dateParam = fromCurrencyParam;
		fromCurrencyParam = DEFAULT_CRYPTO;
	}

	const FROM_CURRENCY = fromCurrencyParam.toUpperCase();
	const TO_CURRENCY = toCurrencyParam.toUpperCase();
	const requestUrl = conf.urls.coinbase + EXCHANGE_PRICE_ENDPOINT;
	const shouldGetHistoricalPrice = !CRYPTO_LIST.includes(TO_CURRENCY) && !!dateParam;

	// Get all the crypto currency historically as a list
	if (isRequestForList && shouldGetHistoricalPrice) {
		getAllCryptoHistorical(TO_CURRENCY, dateParam, (err, prices) => {
			if (err) {
				callback(err);
				return;
			}

			callback(getPriceListString(TO_CURRENCY, prices, dateParam));
		})
	// Get all the crypto currency as a list
	} else if (isRequestForList) {
		getAllCrypto(TO_CURRENCY, (err, prices) => {
			if (err) {
				callback(err);
				return;
			}

			callback(getPriceListString(TO_CURRENCY, prices));
		});
	} else if (shouldGetHistoricalPrice) {
		requestPriceHistorical(FROM_CURRENCY, TO_CURRENCY, dateParam, (err, data) => {
			if (err) {
				callback(err);
				return;
			}

			callback(`\`${FROM_CURRENCY} to ${TO_CURRENCY} (${dateParam}): ${data.amount}\``);
		});
	// Get the single currency exchange rate
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
