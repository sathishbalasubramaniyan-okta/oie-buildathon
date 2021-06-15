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

  // Required for login flow using getWithRedirect()
  clientId: 'GHtf9iJdr60A9IYrR0jw',
  redirectUri: 'https://acme.com/oauth2/callback/home',

  // Parse authorization code from hash fragment instead of search query
  responseMode: 'fragment',

  // Configure TokenManager to use sessionStorage instead of localStorage
  tokenManager: {
    storage: 'sessionStorage'
  }
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

app.post("/home", (request, response) => {
  console.log("Username is: " + request.body.username);
  console.log("Password is: " + request.body.password);
  response.render('home.html', {"name": "Sathish"});
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
