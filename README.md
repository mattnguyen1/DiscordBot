# Discord Bot
A Discord chat bot running off of <a href="https://github.com/hydrabolt/discord.js/">discord.js</a>
# Features
#####Giphy Search
	<name-of-bot> gif <gif-query>
	
	Using https://github.com/Giphy/GiphyAPI

#####Meme Generator
	<name-of-bot> meme help
	<name-of-bot> meme <meme-id> <top-text> <bottom-text>
	
	Using https://api.imgflip.com/

#####Image Search
	<name-of-bot> image <image-query>
	
	Using https://developers.google.com/custom-search/json-api/v1/using_rest
	
#####Weather
	<name-of-bot> weather <weather-query>
	
	Query can be US state/city, US zipcode, country/city, (latitude,longitude), airport code.
	Using http://www.wunderground.com/weather/api/d/docs

#####Remind
	<name-of-bot> remind <reminder-with-time>

#####Wolfram
	<name-of-bot> wolfram <query>

#####Todo
	<name-of-bot> todo
	<name-of-bot> -add todo <task>
	<name-of-bot> -remove todo <task-index>

#####Delete
	// Delete the last bot message on the channel 
	<name-of-bot> delete

	// Delete the last 100 bot message on the channel
	<name-of-bot> flush

#####Roll
	/roll <lower num (optional)> <higher num (optional)>

# To Run:

- setup an application on Heroku using the .env-template to fill out config settings
- setup .env using the .env-template for local Heroku development
- modify config.json to your preferences
