const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

//read config
require('dotenv').config();
console.log('Environment: ', process.env.NODE_ENV);

const app = express();

// set rendering engine to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

// app.set( 'trust proxy', true );

const storeCtrl = require('./sessionStoreController');

const sessionOption = {
  secret: 'mySecret',
  resave: false,
  saveUninitialized: false,
  store: storeCtrl.store,
  // cookie: {},
  // unset: 'destroy',
};

// if ( process.env.NODE_ENV === "production" ) {
//   app.set('trust proxy', 1) // trust first proxy
//   // sessionOption.cookie.secure = true // serve secure cookies
// }
// console.log('Session options: ', sessionOption);

app.use(session( sessionOption));

// app.use(express.json());

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(require('./appRouter'));

app.use( ( req, res, next ) => {
    console.log('Unhandled request. url ', req.url, ', method ', req.method);
    console.log('Session: ', req.session);
    res.status(404).json({message: 'Page could not be found'});
});

//Generic error handler
app.use(function (error, req, res, next) {
    console.error('An error occured: ', error);
    console.log('Session: ', req.session);
    
    // console.log('get error info');
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    console.log('status: ', status, ', message: ', message, ', data: ', data);

    return res.status(status).json( { 
        message: message,
        data: data
    });

    // res.status(500).json({"msg": "An internal error occured"});
});
  
const PORT = process.env.PORT || 3000;

const server = app.listen( PORT, () => {
    console.log('App listens on port ', PORT);
} );

