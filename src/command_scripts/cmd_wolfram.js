/**
 * @file cmd_wolfram
 * @author mattnguyen1
 */

// ---------------------------------
// Requirements
// ---------------------------------

const conf = require("../config");
const wolframClient = require("node-wolfram");

let wolfram = new wolframClient(process.env.WOLFRAM_KEY);

// ---------------------------------
// Private
// ---------------------------------

/**
 * Searches using the Wolfram search engine
 * @param  {Object} options
 * @param  {Message} message
 * @param  {Function} callback
 * @return {void}
 */
let _wolfram = (options, message, callback) => {
	let suffix = message.content;
	wolfram.query(suffix, (err, result) => {
		if (err) {
			callback("Bad query.");
		} else {
			let response = "";
			if (result.queryresult == undefined) {
				callback("Bad query.");
				return;
			}
			if (result.queryresult.pod == undefined) {
				console.log(result.queryresult);
				callback("Bad query.");
				return;
			}
			for(let a=0; a<result.queryresult.pod.length && a < 5; a++) {
				let pod = result.queryresult.pod[a];
				response += "**" + pod.$.title + "**: \n";
				for(let b=0; b<pod.subpod.length; b++) {
					let subpod = pod.subpod[b];
					for(let c=0; c<subpod.plaintext.length; c++) {
						let text = subpod.plaintext[c];
						response += '\t' + text + "\n";
					}
				}
			}
			response += "\nSee the full answer at " + conf.urls.wolfram + encodeURIComponent(suffix);
			callback(response);
		}
	});
}

module.exports.wolfram = {
	run: _wolfram,
	usage: "wolfram <query>",
	description: "Searches using the Wolfram search engine."
}