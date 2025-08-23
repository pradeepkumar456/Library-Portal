const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email : {type : String , required: true},
  role : {type : String ,default: "admin"},
   image:{
    url : String,
    filename : String
   },
  location : {type: String },

});

// Tell PLM to use "email" as the username field
adminSchema.plugin(passportLocalMongoose, { usernameField: "email" });

module.exports = mongoose.model('admin',adminSchema);
