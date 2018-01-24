
// init project
var express = require('express');
var path = require("path");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var passport = require("passport");
var flash = require("connect-flash");
var setUpPassport = require("./config/passport");

var app = express();
setUpPassport();

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://vd1:vd1-master@ds157667.mlab.com:57667/vd1_bar_reservations");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session ({
  secret : process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});


// route for home page
app.get('/', function(req, res) {
    res.render('index.ejs'); // load the index.ejs file
});

// route for login form
// route for processing the login form
// route for signup form
// route for processing the signup form

// route for showing the profile page
app.get('/profile', isAuthenticated, function(req, res) {
    res.render('profile.ejs');
});

// route for facebook authentication and login
app.get('/auth/facebook', passport.authenticate('facebook', { 
  scope : ['public_profile', 'email']
}));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/profile',
    failureRedirect : '/'
}));

// route for logging out
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


function isAuthenticated(req,res,next) {
  if(req.isAuthenticated()){
    next();
  }
  else {
    req.flash("error", "Please log in first");
    res.redirect("/");
  }
}



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
