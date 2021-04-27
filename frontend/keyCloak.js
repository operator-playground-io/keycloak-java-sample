const session = require('express-session');
const { default: axios } = require("axios");
const qs = require("qs");

//read config
require('dotenv').config();

const storeCtrl = require('./sessionStoreController');
const store = storeCtrl.store; //new session.MemoryStore();

const environment = process.env.NODE_ENV || 'production';
const authURL = process.env.AUTH_SERVER_URL || 'http://localhost:8080';
const authRealm = process.env.AUTH_REALM;
const authClient = process.env.AUTH_CLIENT || "myclient";
const authClientSecret = process.env.AUTH_CLIENT_SECRET;
const authDefaultUser = process.env.AUTH_DEFAULT_USER;
const authDefaultPwd = process.env.AUTH_DEFAULT_SECRET;
let ALWAYS_CONNECTED = process.env.ALWAYS_CONNECTED;
if ( ALWAYS_CONNECTED !== '' && ALWAYS_CONNECTED === 'true' ) {
  ALWAYS_CONNECTED = true;
} else {
  ALWAYS_CONNECTED = false;
}

console.log('Environment: ', environment);
console.log('authURL: ', authURL);
console.log('authRealm: ', authRealm);
console.log('authClient: ', authClient);
console.log('authClientSecret: ', authClientSecret);
console.log('authDefaultUser: ', authDefaultUser);
console.log('authDefaultPwd: ', authDefaultPwd);
console.log('ALWAYS_CONNECTED: ', ALWAYS_CONNECTED);
// console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED)

const checkAccessToken = async (request, response, next) => {
  console.log("-----------------Check access token---------------");

  // console.log("Session: ", request.session.id, ' - ',request.session);

  let token = request.session.token;
  console.log("Token: ", token);

  if (!token && ALWAYS_CONNECTED) {
    await authenticate(request, response, authDefaultUser, authDefaultPwd);
    // throw new Error("No access token");
  }

  if ( next ) {
    next();
  }
};

const authenticate = async (request, response, user, password) => {
  console.log("-----------------Authenticate user---------------");

  console.log("user: ", user, ", password: ", password);
  let token = request.session.token;
  // console.log("Token: ", token);

  if (!token) {
    let token = await getAccessToken(user, password);

    if (token) {
      request.session.token = token;
      request.session.isAuthenticated = true;
      request.session.isAdmin = false;
      request.session.user = { name: user, email: "Unknown" };

      // console.log("Session: ", request.session.id, ' - ',request.session);

      return true;
    }
    
    //user is already authenticated
    return true;
  }

};

const getDefaultAccessToken = async () => {
  console.log("-----------------Get default access token---------------");
  let token = await getAccessToken(authDefaultUser, authDefaultPwd);
  return token;
};

const getAccessToken = async (user, password) => {
  console.log("-----------------Get access token---------------");

  console.log("user: ", user, ", password: ", password);
  let url = `${authURL}realms/${authRealm}/protocol/openid-connect/token`;
  console.log("Token url: ", url);

  let authData = {
    client_id: authClient,
    grant_type: "password",
    client_secret: authClientSecret,
    username: user,
    password: password,
    scope: "openid",
  };
  console.log("Token request data: ", authData);

  try {
    const response = await axios.post(url, qs.stringify(authData), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const { status, data } = response;
    console.log("Access token request status: ", status, ", data: ", data);

    if (status != 200) {""
      throw new Error("Failed to get the access token!");
    }

    let token = data; //data.access_token;
    console.log("Token: ", token);

    return token;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Data: ", error.response.data);
      console.log("status: ", error.response.status);
      console.log("headers: ", error.response.headers);
      throw new Error(error.response.data.error_description);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log("Request: ", error.request);
      console.log("Error message: ", error.message);
      if ( error.message && error.message.includes("ECONNREFUSED") ){
        throw new Error("Failed to authenticate: Cannot connect to Keycloak server.");
      }
      throw new Error("Failed to authenticate.");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message);
      throw new Error(error.message);
    }
    console.log("Config: ", error.config);
  }
};


module.exports = {
  checkAccessToken,
  authenticate,
  getDefaultAccessToken,
  getAccessToken
};

// getDefaultAccessToken();
// getAccessToken("rose.white", "rose.white");