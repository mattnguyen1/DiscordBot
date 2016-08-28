/**
 * @file cmd_redisUtils
 * @author mattnguyen1
 */

"use strict";

// ---------------------------------
// Requirements
// ---------------------------------

let redisClient = require('../redisClient');

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
	"redis-get": {
		run: (options, message, callback) => {
			let suffix = message.content;
			redisClient.get(suffix, (err, obj) => {
			    console.log(obj);
			});
		}
	},
	"redis-hgetall": {
		run: (options, message, callback) => {
			let suffix = message.content;
			redisClient.hgetall(suffix, (err, obj) => {
			    console.log(obj);
			});
		}
	},
	"redis-del": {
		run: (options, message, callback) => {
			let suffix = message.content;
			redisClient.del(suffix, (err, obj) => {
			    console.log(obj);
			});
		}
	},
	"redis-hget": {
		run: (options, message, callback) => {
			let suffix = message.content;
			let suffix_arr = suffix.split(' ');
			let hash = suffix_arr[0];
			let key = suffix_arr[1];
			redisClient.hget(hash, key, (err, obj) => {
				console.log(obj);
			})
		}
	}
}