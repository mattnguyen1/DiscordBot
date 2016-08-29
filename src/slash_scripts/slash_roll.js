/**
 * @file slash_roll
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

import { isPositiveInteger } from "../botUtils";

// ---------------------------------
// Private
// ---------------------------------

/**
 * Rolls a random integer between a and b
 * @param  {string} user
 * @param  {int} a - lower bound
 * @param  {int} b - upper bound
 * @return {string}
 */
let _roll = (user, a, b) => {
	if (b === undefined || b === null) {
		let rand_roll = Math.floor(Math.random()*a)+1;
		if (a > 0) {
			return user + " rolls " + rand_roll + " (1-" + a + ")";
		} else {
			return user + " rolls " + rand_roll + " (" + a + "-0)";
		}
	// 2 numbers given, roll from a to b, assuming a < b
	} else {
		if (a > b) {
			return "Rolls require the first number to be less than the second.";
		}
		let rand_roll = Math.floor(Math.random()*(b-a+1))+parseInt(a);
		return user + " rolls " + rand_roll + " (" + a + "-" + b + ")"; 
	}
}

let _rollHandler = (message, callback) => {
	let sfx_arr = message.content.split(' ');
	let lo = sfx_arr[1];
	let hi = sfx_arr[2];

	// Default roll is from 1-100
	if (sfx_arr.length == 1) {
		callback(null,_roll(message.author, 1, 100));
	}
	if (sfx_arr.length == 2) {
		if (lo == "rick") {
			callback(null,"https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		}
		if (isPositiveInteger(lo)) {
			callback(null,_roll(message.author, sfx_arr[1]));
		}
	} else if (sfx_arr.length == 3) {
		callback(null,_roll(message.author, sfx_arr[1], sfx_arr[2]));
	}
}

module.exports.roll = {
	run: _rollHandler,
	usage: "/roll <?low> <?high>",
	description: "Rolls a random number between 1-100, or the given range"
}

