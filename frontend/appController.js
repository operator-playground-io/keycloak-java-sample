const { default: axios } = require("axios");
const storeCtrl = require('./sessionStoreController');

const keycloak = require('./keyCloak');
const e = require("express");

const TITLE = "Keycloak demo";

const backendURL = process.env.BACKEND_URL;
console.log('backendURL: ', backendURL);

let ALWAYS_CONNECTED = process.env.ALWAYS_CONNECTED;
if ( ALWAYS_CONNECTED !== '' && ALWAYS_CONNECTED === 'true' ) {
  ALWAYS_CONNECTED = true;
} else {
  ALWAYS_CONNECTED = false;
}
console.log('ALWAYS_CONNECTED: ', ALWAYS_CONNECTED);

const getHomePage = async (req, res, next) => {
  console.log("request to /  - NOT PROTECTED PAGE");
  console.log("Session: ", req.session.id, ' - ',req.session);
  // storeCtrl.printStore();

  if ( ALWAYS_CONNECTED ) { 
    try {
      await keycloak.checkAccessToken(req,res);      
    } catch (error) {
      console.log("An error occured when authenticate user: ", error);
      req.session.errorMsg = error.message;
    }
  }

  const errorMsg = req.session.errorMsg;
    if ( errorMsg ) {
      req.session.errorMsg = null;
    }

  return res.render("public/main", {
    pageTitle: TITLE,
    isAuthenticated: req.session.isAuthenticated,
    isAdmin: req.session.isAdmin,
    path: "/",
    user: req.session.user,
    errorMsg: errorMsg,
    alwaysConnected: ALWAYS_CONNECTED,
  });
};

const getLoginPage = async (req, res, next) => {
  console.log("request to /login  - PROTECTED PAGE");
  
  const errorMsg = req.session.errorMsg;
    if ( errorMsg ) {
      req.session.errorMsg = null;
    }

  return res.render("public/login", {
    pageTitle: TITLE,
    isAuthenticated: false,
    isAdmin:false,
    path: "/",
    user: null,
    errorMsg: errorMsg,
    alwaysConnected: ALWAYS_CONNECTED,
  });
};

const authenticate = async (req, res, next) => {
  console.log("request to authenticate user");
  
  const {user,password} = req.body;
  console.log("login user: ", user, ", password: ", password);

  let success = false;
  try {
    success = await keycloak.authenticate(req, res, user, password);
    console.log("user: ", user, " authenticated: ", success);
  } catch (error) {
    console.log("An error occured when authenticate user: ", error);

    req.session.errorMsg = error.message;

    return res.redirect("/login");
  }

  return res.redirect("/");
};

const getLogoffPage = async (req, res, next) => {
  console.log("request to /logoff  - NOT PROTECTED PAGE");
  console.log("Session: ", req.session.id, ' - ',req.session);

  req.session.destroy((err) => {
    console.log("Session was destroyed.")
    if ( err ) {
      console.log("Error occured when destroing session: ", err)
    }
  });

  return res.redirect("/");
};

const getCourses = async (req, res, next) => {
  console.log("request to /courses  - the user IS authenticated");
  console.log("Session: ", req.session);

  const url = backendURL;
  console.log("url: ", url);

  try {
    let token =  req.session.token;

    const response = await axios.get(
      url,
      { headers: {
        'Authorization': 'Bearer ' + token
      }}
    );
    const {data, status} = response;
    console.log("request status: ", status, ", data: ", data);

    const errorMsg = req.session.errorMsg;
    if ( errorMsg ) {
      req.session.errorMsg = null;
    }

    return res.render("private/courses", {
      pageTitle: TITLE,
      isAuthenticated: req.session.isAuthenticated,
      isAdmin: req.session.isAdmin,
      path: "/courses",
      user: req.session.user,
      data: data,
      errorMsg: errorMsg,
      alwaysConnected: ALWAYS_CONNECTED,
    });
  } catch (error) {
    console.log("Failed to retrieve the courses");

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Data: ', error.response.data);
      console.log('status: ', error.response.status);
      console.log('headers: ', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log('Request: ', error.request);
      console.log("Error message: ", error.message);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log('Config: ', error.config);

    return res.render("private/courses", {
      pageTitle: TITLE,
      isAuthenticated: req.session.isAuthenticated,
      isAdmin: req.session.isAdmin,
      path: "/courses",
      user: req.session.user,
      data: null,
      errorMsg: "Failed to retrieve the courses!",
      alwaysConnected: ALWAYS_CONNECTED,
    });
  }
};

const deleteCourse = async (req, res, next) => {
  console.log("request to /deleteUser  - the user IS authenticated");
  console.log("Session: ", req.session);

  console.log("Request body: ", req.body);

  const courseId = req.body.courseId;
  console.log("trying to delete course: ", courseId);

  const url = `${backendURL}/${courseId}`;
  console.log("url: ", url);

  try {
    let token = req.session.token;

    const response = await axios.delete(
      url,
      { headers: {
        'Authorization': 'Bearer ' + token
      }}
    );
    console.log("Delete course successful...");
    const {data, status} = response;
    console.log("request status: ", status, ", data: ", data);

    res.redirect('/courses');
  } catch (error) {
    console.log("Failed to delete the course");

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Data: ', error.response.data);
      console.log('status: ', error.response.status);
      console.log('headers: ', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.log('Request: ', error.request);
      console.log("Error message: ", error.message);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log('Config: ', error.config);

    req.session.errorMsg = "You don't have rights to perform this operation.";

    res.redirect('/courses');
  }
};

const getAccessToken = async (req, res, next) => {
  console.log("request to /access to get the access token");

  const {user,password} = req.body;
  console.log("requested access token for user: ", user, ", password: ", password);

  let token;
  try {
    entireToken = await keycloak.getAccessToken(user, password);
    if ( entireToken ) {
      token = entireToken.access_token;
    }
    console.log("user: ", user, " token: ", token);
  } catch (error) {
    console.log("An error occured when gettting access token for user: ", error);
    return res.status(403).send({errorMsg:error.message});
  }

  return res.send({token});
};

const getAccessDeniedPage = async (req, res, next) => {
  console.log("request to /denied  - NOT PROTECTED PAGE, statusCode: ", res.statusCode);
  console.log("Session: ", req.session.id, ' - ',req.session);
  // storeCtrl.printStore();

  const msg = res.statusCode === 500 ? "" : "You don't have access to this page";

  return res.render("public/403", {
    pageTitle: TITLE,
    isAuthenticated: req.session.isAuthenticated,
    isAdmin: req.session.isAdmin,
    path: "/",
    user: req.session.user,
    errorMsg: msg,
    alwaysConnected: ALWAYS_CONNECTED,
  });
};

const getErrorPage = async (req, res, next) => {
  console.log("request to /500  - NOT PROTECTED PAGE, statusCode: ", res.statusCode);
  console.log("Session: ", req.session.id, ' - ',req.session);
  // storeCtrl.printStore();
  console.log("Query: ", req.query);

  const {err} = req.query;

  let msg = "";
  if ( err === '1' ) {
    msg = "An internal error occured: Connection refused. Click on the Login link to try again.";
  // } else if ( err === '2' ) {
  //   msg = "An internal error occured: Bad request";
  } else {
    msg = "An internal error occured.";
  }
  console.log("msg: ", msg);

  return res.render("public/500", {
    pageTitle: TITLE,
    isAuthenticated: req.session.isAuthenticated,
    isAdmin: req.session.isAdmin,
    path: "/",
    user: req.session.user,
    errorMsg: msg,
    alwaysConnected: ALWAYS_CONNECTED,
  });
};


module.exports = {
  getHomePage,
  getLoginPage,
  authenticate,
  getCourses,
  deleteCourse,
  getLogoffPage,
  getAccessToken,
  getAccessDeniedPage,
  getErrorPage,
};
