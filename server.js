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
  response.render('index.html', {"greeting": "Sign into the OIE experience!"});
});

app.get("/existinguser", (request, response) => {
  response.render('index.html', {"greeting": "Sign into the OIE experience!"});
});

app.get("/newuser", (request, response) => {
  response.render('registeruser.html', {"greeting": "Register for the OIE experience!"});
});

app.get("/username", (request, response) => {
  response.sendFile(__dirname + "/views/username.html");
});

app.post("/register", async (request, response) => {
  var username = request.body.firstname;
  var username = request.body.lastname;
  var username = request.body.email;
  var username = request.body.registerpassword;

  response.sendFile(__dirname + "/views/username.html");
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
    authClient.transactionManager.clear();
    response.render('index.html', {"greeting": "Invalid Credentials!"});
  } else if (authTransaction.status === IdxStatus.PENDING) {
    console.log("In IdxStatus Pending: ");
    if (authTransaction.nextStep) {
      console.log("Next Step name:" + authTransaction.nextStep.name);
      console.log("Can Skip:" + authTransaction.nextStep.canSkip);
      if (authTransaction.nextStep.name === 'select-authenticator-authenticate') {
        console.log('In select-authenticator-authenticate');
        for (var i=0; i<authTransaction.nextStep.options.length; i++) {
          console.log("Options label: " + authTransaction.nextStep.options[i].label);
          console.log("Options value: " + authTransaction.nextStep.options[i].value);
        }
        var authTransactionEmail = await authClient.idx.authenticate({ authenticator: 'email' });
        response.render('otp.html', {"otp_text": "Enter the OTP you received to authenticate!"});
      } else {
        authClient.transactionManager.clear();
        response.render('index.html', {"greeting": "Invalid Credentials!"});
      }
    } 
  } else {
    console.log("In IdxStatus not SUCCESS, FAILURE, PENDING: ");
    authClient.transactionManager.clear();
    response.render('index.html', {"greeting": "Invalid Credentials!"});
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
    response.render('otp.html', {"otp_text": "Incorrect OTP!"});
  }
});


app.post("/verifyotppasswordreset", async (request, response) => {
  console.log('In Verify OTP password reset');
  var otp = request.body.otp;
  var authTransaction = await authClient.idx.recoverPassword({verificationCode: otp});
  if (authTransaction.status === IdxStatus.PENDING) {
    console.log("Auth Transaction Status Pending after verifying OTP for password reset");
    // handle tokens with authTransaction.tokens
    if (authTransaction.nextStep) {
        console.log("Next Step name:" + authTransaction.nextStep.name);
        if (authTransaction.nextStep.name === 'reset-authenticator') {
          response.render('collectnewpassword.html', {"new_password_text": "Enter your new password"});
        } else {
          response.render('verifyotppasswordreset.html', {"otp_passwordreset_text": "Invalid OTP!"});
        }
      }
  } else {
    console.log("Incorrect OTP: " + otp);
    response.render('verifyotppasswordreset.html', {"otp_passwordreset_text": "Invalid OTP!"});
  }
});

app.post("/submitnewpassword", async (request, response) => {
  console.log('In submit new password');
  var newpassword = request.body.newpassword;
  console.log('New Password: ' + newpassword);
  var authTransaction = await authClient.idx.recoverPassword({password: newpassword});
  if (authTransaction.status === IdxStatus.SUCCESS) {
      console.log("In IdxStatus Success for recover password: ");
      // handle tokens with authTransaction.tokens
      authClient.tokenManager.setTokens(authTransaction.tokens);
      const name = authTransaction.tokens.idToken.claims.name;
      response.render('home.html', {"name": name});
  } else if (authTransaction.status === IdxStatus.FAILURE) {
      console.log("In IdxStatus Failure: ");
      response.render('collectnewpassword.html', {"new_password_text": "Enter your new password"});
  } else if (authTransaction.status === IdxStatus.PENDING) {
      console.log("In IdxStatus Pending for recover password: ");
      if (authTransaction.messages) {
        response.render('collectnewpassword.html', {"new_password_text": authTransaction.messages[0].message});
      } else {
        response.render('collectnewpassword.html', {"new_password_text": "Enter your new password"});
      } 
  } else {
    console.log("In IdxStatus not SUCCESS, FAILURE, PENDING for recover password: ");
    response.render('collectnewpassword.html', {"new_password_text": "Enter your new password"});
  }
});

app.post("/otppasswordreset", async (request, response) => {
  console.log('In otppasswordreset');
  var username = request.body.username;
  var authTransaction = await authClient.idx.recoverPassword({
      username: username,
      authenticators: ['email']
    });
  if (authTransaction.status === IdxStatus.PENDING) {
      console.log("Auth Transaction Status Pending OTP password reset");
      if (authTransaction.nextStep) {
        console.log("Next Step name:" + authTransaction.nextStep.name);
        if (authTransaction.nextStep.name === 'challenge-authenticator' || authTransaction.nextStep.name === 'authenticator-verification-data') {
          response.render('verifyotppasswordreset.html', {"otp_passwordreset_text": "Enter the OTP you received to reset your password!"});
        } else {
          response.sendFile(__dirname + "/views/username.html");
        }
      }
  } else {
    console.log("Auth Transaction Status OTP password reset: " + authTransaction.status);
    response.sendFile(__dirname + "/views/username.html");
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
