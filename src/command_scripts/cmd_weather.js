/**
 * @file cmd_weather
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("../config");
const request = require("request");
const redisClient = require("../redisClient");
const querystring = require("query-string");

// ---------------------------------
// Private
// ---------------------------------

const WEATHER_API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

function isZipcode(str) {
	return str.match("[0-9]+") && str.length() === 6;
}

/**
 * Gets the weather information based on the location query
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
const getWeather = (options, message, callback) => {
	let query = message.content,
		userWeatherLocation = "";
	if (options['set']) {
		redisClient.hset("weather", message.author.toString(), message.content);
	}

	redisClient.hget("weather", message.author.toString(), (err, res) => {
		if (err) {
			userWeatherLocation = null;
		} else {
			userWeatherLocation = res;
		}
		if (!!userWeatherLocation && !query) {
			query = userWeatherLocation;
		}

		const isQueryZipcode = isZipcode(query);
		const queryParams = {
			appid: process.env.WEATHER,
			units: "imperial"
		};
		if (isQueryZipcode) {
			queryParams.zip = query;
		} else {
			queryParams.q = query;
		}
		const queryParamsStr = querystring.stringify(queryParams);
		let request_url = `${WEATHER_API_BASE_URL}?${queryParamsStr}`;

		request(request_url, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				callback(new Error("Error processing request."), "Bad Request.");
			}
			else {
				let responseObj = JSON.parse(body);
				if (!responseObj.message) {
					const weatherTemp = responseObj.main.temp;
					const weatherDescription = responseObj.weather[0].main;
					const responseMessage = "It is currently " + weatherTemp
						+ " in " + responseObj.name + ".\n"
						+ "The weather there is currently " + weatherDescription + ".";
					callback(responseMessage);
				} else {
					callback(responseObj.message);
				}
			}
		});
	});
}
module.exports.weather = {
	run: getWeather,
	usage: "weather <?location_query> \n"
		+ "Options: \n"
		+ "\t -set: Will save the query for the user.",
	description: "Gets the weather information based on the location query"
}