// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require('body-parser');
const mustacheExpress = require('mustache-express');
const OktaAuth = require('@okta/okta-auth-js').OktaAuth;

var config = {
  // Required config
  issuer: 'https://oie-9004654.oktapreview.com/oauth2/default',
  clientId: '0oausgtcbUm0u8Z8b1d6',
  clientSecret:'T6hW-amIlYH8v_rrzMLTn8B9RyFDv6PDgdyunFIv',
  redirectUri: 'https://oie-buildathon.glitch.me/callback',
  appBaseUrl: 'https://oie-buildathon.glitch.me',
  scopes: ['openid', 'profile', 'email'],
  postLogoutRedirectUri: 'https://oie-buildathon.glitch.me',
  responseType: 'code',
  pkce: false
};

var authClient = new OktaAuth(config);
const app = express();

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('html', mustacheExpress());
app.set('view engine', 'html'); 
app.set('views', __dirname + '/views'); 

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

app.post("/home", async (request, response) => {
  console.log("Username is: " + request.body.username);
  console.log("Password is: " + request.body.password);
  var username = request.body.username;
  var password = request.body.password;
  const authenticationOptions = {
    username,
    password
  };
const authTransaction = await authClient.idx.authenticate(authenticationOptions);
if (authTransaction.status === 'SUCCESS') {
  // handle tokens with authTransaction.tokens
  console.log('Authentication Success');
  authClient.tokenManager.setTokens(authTransaction.tokens);
  response.render('home.html', {"name": "Sathish"});
}
});

app.post("/logout", async (request, response) => {
  await authClient.revokeAccessToken();
  const signoutRedirectUrl = authClient.getSignOutRedirectUrl();
  response.redirect(signoutRedirectUrl);
});


app.get("/api", (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.send(JSON.stringify({status:"success"}));
});


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
