/**
 * @file cmd_weather
 * @author mattnguyen1
 */

"use strict";

// ---------------------------------
// Requirements
// ---------------------------------

let conf = require('../config.json'),
	request = require('request');

// ---------------------------------
// Private
// ---------------------------------

/**
 * Gets the weather information based on the location query
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _weather = (options, message, callback) => {
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

		let request_url = conf.urls.weatherstart 
			+ process.env.WEATHER 
			+ conf.urls.weatherend
			+ query + '.json';


		request(request_url, (error, response, body) => {
			if (error || response.statusCode !== 200) {
				callback(new Error("Wunderground error."), "Bad Request.");
			}
			else {
				let responseObj = JSON.parse(body);
				if (responseObj.location != undefined) {
					let cityweather = responseObj.current_observation;
					let cityloc = responseObj.location;
					let response = "It is currently " + cityweather.temperature_string
						+ " in " + cityloc.city + ".\n"
						+ "The weather there is currently " + cityweather.weather + ".";
					callback(null, response);
				} else {
					callback(null, "No city :(");
				}
			}
		});
	});
}

module.exports = {
	"weather" : {
		run: _weather,
		usage: "weather <?location_query> \n"
			+ "Options: \n"
			+ "\t -set: Will save the query for the user.",
		description: "Gets the weather information based on the location query"
	}
}