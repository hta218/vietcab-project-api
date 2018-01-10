var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var driverSchema = new Schema({
  name: String,
  searchName: String,
  phoneNumber: Number,
  email: String,
  city: String,
  recommender: String,
  code: String,
  approval: Boolean
});

driverSchema.index({searchName: "text"});

module.exports = mongoose.model("driver", driverSchema);
