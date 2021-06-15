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
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: 'GHtf9iJdr60A9IYrR0jw',
  redirectUri: 'https://acme.com/oauth2/callback/home',
  appBaseUrl: 'http://localhost:8080',
  scopes: ['openid', 'profile', 'email'],
  postLogoutRedirectUri: 'http://localhost:8080'
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
  authClient.tokenManager.setTokens(authTransaction.tokens);
  response.render('home.html', {"name": "Sathish"});
}
});

app.post("/logout", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});


app.get("/api", (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.send(JSON.stringify({status:"success"}));
});


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
