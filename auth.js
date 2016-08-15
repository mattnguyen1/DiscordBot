// Heroku $PORT error fix
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
    console.log(process.env.EMAIL);
});

var oauth2 = require('simple-oauth2')({
  clientID: process.env.OAUTH2_CLIENT_ID,
  clientSecret: process.env.OAUTH2_CLIENT_SECRET,
  site: 'https://discordapp.com/api/oauth2/authorize',
  tokenPath: '/oauth/access_token',
  authorizationPath: '/oauth/authorize'
});

function login() {

}