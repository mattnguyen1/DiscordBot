/**
 * @file cmd_redisUtils
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const redisClient = require("../redisClient");

// ---------------------------------
// Public
// ---------------------------------

module.exports = {
  "redis-get": {
    run: (options, message, callback) => {
      let suffix = message.content;
      redisClient.GET(suffix, (err, obj) => {
        console.log(obj);
      });
    },
  },
  "redis-hgetall": {
    run: (options, message, callback) => {
      let suffix = message.content;
      redisClient.HGETALL(suffix, (err, obj) => {
        console.log(obj);
      });
    },
  },
  "redis-del": {
    run: (options, message, callback) => {
      let suffix = message.content;
      redisClient.DEL(suffix, (err, obj) => {
        console.log(obj);
      });
    },
  },
  "redis-hget": {
    run: (options, message, callback) => {
      let suffix = message.content;
      let suffix_arr = suffix.split(" ");
      let hash = suffix_arr[0];
      let key = suffix_arr[1];
      redisClient.HGET(hash, key, (err, obj) => {
        console.log(obj);
      });
    },
  },
};
