
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
var methodOverride = require("method-override");
var fetch = require("node-fetch");
var Booking = require("./models/booking");

var app = express();
setUpPassport();

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://vd1:vd1-master@ds157667.mlab.com:57667/vd1_bar_reservations");

/* middleware */
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
app.use(methodOverride());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});




app.get('/', function(req, res) {
    if(req.cookies.initLogin == 1) {
      console.log("saw initLogin"); 
      res.cookie('initLogin', 0);
      res.locals.loginReturn = 1;
      res.locals.previousS= req.cookies.previousSearch;
      console.log("Grabbed previous as:"+res.locals.previousS);
    }
    else {
      res.locals.loginReturn = 0;
    }
    res.render('index.ejs');
});

app.get('/search/:term', function(req, res, next) {
  var term = req.params.term;
  res.cookie('previousSearch', term);
  
  var options = {
    method: 'GET',
    headers: {"Authorization": "Bearer j6GM5D7sGhjXE1-2NbspX7sRmdHZAOqOKy32007tuP0sy2QT5MAUoKNhjfnmAivUkz0teo5fVps1mkS6opEUSVGMxYgTyFIUuOTNEGNjsUVdgmqIBCBinamGotJoWnYx"}    
  };
  
  var fetchTerm = "https://api.yelp.com/v3/businesses/search?location="+term;
  var fetchJson = fetch(fetchTerm, options).then(function(res) {
    console.log("got fetch result");
    return res.json();
  }).then(function(json) {
    var ids = [];
    for(var ii = 0; ii < 20; ii++) {
      ids.push(json.businesses[ii].id);
    }
    
    Booking.find({business: { $in: ids } }, function(err, bookings) {
      if(err) { return next(err); }
      
      for(var ii = 0; ii < 20; ii++) {
        json.businesses[ii].people = [];
        for(var bb = 0; bb < bookings.length; bb++) {
          if(json.businesses[ii].id == bookings[bb].business) {
             json.businesses[ii].people = bookings[bb].people;
          }
        }
      }
      res.json(json);
    });      
    
  });   
  
});

app.post("/book", function(req, res, next) {
  console.log("post book business="+req.body.business_id+" user="+req.user.facebook.name);
  
  Booking.findOne({business: req.body.business_id }, function(err, booking) {
    if(err) { return next(err); }
    
    var curPeople = [];
    var curPeopleIds = [];
    
    if(booking) {
      if(booking.people_ids.indexOf(req.user.facebook.id) !== -1) {
        console.log("User already saved in booking");
        return res.json({people: []});    
      }
      curPeople = booking.people;
      curPeopleIds = booking.people_ids;
      curPeople.push(req.user.facebook.name);
      curPeopleIds.push(req.user.facebook.id);
      Booking.update({business: req.body.business_id}, {people: curPeople, people_ids: curPeopleIds}, function(err) {
        if(err) {
          console.log(err);
          next(err);
          return;
        }      
        console.log("Updated booking");        
        return res.json({people: curPeople});        
      });
    }
    else {    
      curPeople.push(req.user.facebook.name);
      curPeopleIds.push(req.user.facebook.id);
      var newBooking = new Booking({
        business: req.body.business_id,
        people: curPeople, 
        people_ids: curPeopleIds
      });
      newBooking.save();
      console.log("Saved new booking");        
      return res.json({people: curPeople});    
    }
    
  });    
});



app.get("/profile/:id", function(req, res, next) {
  res.locals.user_id = req.params.id;
  
  Booking.find({people_ids: req.params.id}, function(err, bookings) {
    if(err) { return next(err); }
    
    res.locals.userBookings = [];
    if(bookings) {
      for(var ii = bookings.length - 1; ii >= 0; ii--) {
        var title = bookings[ii].business;
        var deleteLink = "/delete/"+bookings[ii].business;
        res.locals.userBookings.push({title: title, deleteLink: deleteLink});
      }
    }    
    res.render("profile");
  });
  
});

app.get("/delete/:num", isAuthenticated, function(req, res, next) {
  var business_id = req.params.num;
  
  Booking.findOne({business: business_id}, function(err, booking) {
    if(err) { return next(err); }
    if(!booking) {
      req.flash("error", "Deletion error. Booking not found.");
      return res.redirect("/");
    }
    var userIdx = booking.people_ids.indexOf(req.user.facebook.id);
    if(userIdx == -1) {
      req.flash("error", "Deletion error. User not found in booking");
      return res.redirect("/");
    }
    booking.people_ids.splice(userIdx,1);
    booking.people.splice(userIdx,1);
    Booking.update({business: business_id}, {people: booking.people, people_ids: booking.people_ids}, function(err) {
      if(err) {
        console.log(err);
        next(err);
        return;
      }      
      console.log("Removed user from booking");      
      res.redirect("/profile/"+res.locals.currentUser.facebook.id);
    });   
  });
});
     


/* authentication */

// route for facebook authentication and login
app.get('/auth/facebook', setLoginFlag, passport.authenticate('facebook', { 
  scope : ['public_profile', 'email']
}));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : "/",
    failureRedirect : '/'
}));

// route for logging out
app.get('/logout', clearSearch, function(req, res) {
    req.logout();
    res.redirect('/');
});

function setLoginFlag(req,res,next) {
  res.cookie('initLogin', 1);
  next();
}

function clearSearch(req, res, next) {
  res.cookie('previousSearch', "");
  next();
}

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
