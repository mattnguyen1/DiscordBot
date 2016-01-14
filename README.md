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

#####Roll
	/roll <lower num (optional)> <higher num (optional)>

#####Join Server
	<name-of-bot> join <server-invite-link>
	
#####Leave Server
	<name-of-bot> leave

# To Run:

- Have node.js installed
- npm install
- modify config.json to your preferences

# To Do:

- Create an option to use an auth.json instead of heroku env vars
- Add google search query
- Add torrent link grabber (maybe)
- RSS news feed (maybe with search query)
