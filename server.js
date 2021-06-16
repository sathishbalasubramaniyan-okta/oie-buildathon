// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require("express");
const bodyParser = require('body-parser');
const mustacheExpress = require('mustache-express');
const OktaAuth = require('@okta/okta-auth-js').OktaAuth;
const { IdxStatus } = require('@okta/okta-auth-js');

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
  pkce: true
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
  var username = request.body.username;
  var password = request.body.password;
  const authenticationOptions = {
    username,
    password
  };
  console.log("Username: " + username);
  console.log("Password: " + password);
  var authTransaction = await authClient.idx.authenticate(authenticationOptions);
  if (authTransaction.status === IdxStatus.SUCCESS) {
    // handle tokens with authTransaction.tokens
    authClient.tokenManager.setTokens(authTransaction.tokens);
    const name = authTransaction.tokens.idToken.claims.name;
    response.render('home.html', {"name": name});
  } else if (authTransaction.status === IdxStatus.FAILURE) {
    console.log("In IdxStatus Failure: ");
    if (authTransaction.nextStep) {
      console.log(Object.keys(authTransaction.nextStep));
      if (authTransaction.nextStep.inputs) {
        for (var i=0; i<authTransaction.nextStep.inputs.length; i++) {
          console.log("Input name: " + authTransaction.nextStep.inputs[i].name);
          console.log("Input required: " + authTransaction.nextStep.inputs[i].required);
        }
      }
    }
    
    if (authTransaction.error) {
      console.log("Error keys are:" + Object.keys(authTransaction.error));
      console.log("Error messages are:" + Object.keys(authTransaction.error.messages));
    }
    response.redirect("https://oie-buildathon.glitch.me?error=Invalid Credentials");
  } else if (authTransaction.status === IdxStatus.PENDING) {
    console.log("In IdxStatus Pending: ");
    if (authTransaction.nextStep) {
      console.log(Object.keys(authTransaction.nextStep));
      console.log("Next Step name:" + authTransaction.nextStep.name);
      console.log("Can Skip:" + authTransaction.nextStep.canSkip);
      if (authTransaction.nextStep.inputs) {
        for (var i=0; i<authTransaction.nextStep.inputs.length; i++) {
          console.log("Input name: " + authTransaction.nextStep.inputs[i].name);
          console.log("Input required: " + authTransaction.nextStep.inputs[i].required);
        }
      }
      if (authTransaction.nextStep.name === 'select-authenticator-authenticate') {
        for (var i=0; i<authTransaction.nextStep.options.length; i++) {
          console.log("Options label: " + authTransaction.nextStep.options[i].label);
          console.log("Options value: " + authTransaction.nextStep.options[i].value);
        }
        console.log('In select-authenticator-authenticate');
        var authTransactionEmail = await authClient.idx.authenticate({ authenticator: 'email' });
        response.sendFile(__dirname + "/views/otp.html");
      } else {
        authClient.transactionManager.clear();
        response.redirect("https://oie-buildathon.glitch.me?error=Invalid Credentials");
      }
    }
    
  } else {
    console.log("In IdxStatus not SUCCESS, FAILURE, PENDING: ");
    if (authTransaction.nextStep) {
      console.log(Object.keys(authTransaction.nextStep));
      if (authTransaction.nextStep.inputs) {
        for (var i=0; i<authTransaction.nextStep.inputs.length; i++) {
          console.log("Input name: " + authTransaction.nextStep.inputs[i].name);
          console.log("Input required: " + authTransaction.nextStep.inputs[i].required);
        }
      }
    }
    
    if (authTransaction.error) {
      console.log("Error keys are:" + Object.keys(authTransaction.error));
      console.log("Error messages are:" + Object.keys(authTransaction.error.messages));
    }
    response.redirect("https://oie-buildathon.glitch.me?error=Invalid Credentials");
  }
});


app.post("/verifyotp", async (request, response) => {
  console.log('In Verify OTP');
  var otp = request.body.otp;
  var authTransaction = await authClient.idx.authenticate({verificationCode: otp});
  if (authTransaction.status === IdxStatus.SUCCESS) {
    console.log("Correct OTP: " + otp);
    // handle tokens with authTransaction.tokens
    authClient.tokenManager.setTokens(authTransaction.tokens);
    const name = authTransaction.tokens.idToken.claims.name;
    response.render('home.html', {"name": name});
  } else {
    console.log("Incorrect OTP: " + otp);
    response.sendFile(__dirname + "/views/otp.html");
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
