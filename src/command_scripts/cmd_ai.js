/**
 * @file cmd_img
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const OpenAi = require("openai");
const conf = require("../config");
const request = require("request");

// ---------------------------------
// Private
// ---------------------------------

const openai = new OpenAi();

/**
 * Generates an open ai image
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _genImage = async (options, message, callback) => {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: message.content,
      n: 1,
      size: "1024x1024",
    });
    const image_url = response.data[0].url;
    callback(image_url);
  } catch (e) {
    console.log("ai error", e);
    callback("Error generating image: " + e.error.message);
  }
};

module.exports.ai = {
  run: _genImage,
  usage: "ai <query>",
  description: "Returns an ai generated image based on query.",
};
