var mongoose = require("mongoose");

var bookingSchema = mongoose.Schema({
  business           : String,
  people: { type : Array , "default" : [] },
  people_ids: { type : Array , "default" : [] }
});

var Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;