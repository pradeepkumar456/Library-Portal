const passport = require("passport");
const Admin = require("../models/admin");
const Student = require("../models/student");

// ----------------- Admin Strategy -----------------
passport.use("admin-local", Admin.createStrategy()); // PLM handles password internally

// ----------------- Student Strategy -----------------
passport.use("student-local", Student.createStrategy());

// ----------------- Serialize -----------------
passport.serializeUser((user, done) => {
  done(null, { id: user._id, role: user.role }); 
});

// ----------------- Deserialize -----------------
passport.deserializeUser(async (key, done) => {
  try {
    if (key.role === "admin") {
      const admin = await Admin.findById(key.id);
      return done(null, admin);
    } else if (key.role === "student") {
      const student = await Student.findById(key.id);
      return done(null, student);
    } else {
      return done(null, false);
    }
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
