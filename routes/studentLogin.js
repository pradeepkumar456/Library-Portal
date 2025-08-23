const express = require('express');
const router = express.Router();
const Student = require('../models/student.js'); 
const { route } = require('./student.js');
const {ensureStudent, redirectStudentIfLoggedIn} = require("../middleware.js");
const passport = require("passport");


// =================== Student Login Form ===================
router.get("/login",redirectStudentIfLoggedIn,(req, res) => {
  res.render("student/login"); // EJS template for login page
});


// =================== Student Login (POST) ===================
router.post(
  "/login",
  passport.authenticate("student-local", {
    failureRedirect: "/student/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", `Welcome ${req.user.name}`);
    res.redirect("/student/studentdetail");
  }
);


// Student Detail 
router.get("/studentdetail",ensureStudent,async (req,res)=>{
 try{
 const student = await Student.findById(req.user._id);
 res.render("student/studentDetails",{student});
 } catch(err){
  console.log(err,"Err in code ");
 }
});



// =================== Student Logout ===================
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully.");
    res.redirect("/student/login");
  });
});

// Student Change Password Form
router.get("/change-password", (req, res) => {
  res.render("student/changePassword"); // views/student/changePassword.ejs
});


router.post("/change-password",ensureStudent, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // ✅ Check if both match
    if (newPassword !== confirmPassword) {
      req.flash("error", "Passwords do not match!");
      return res.redirect("/student/change-password");
    }

    // ✅ Get the logged-in student
    const student = req.user;

    if (!student) {
      req.flash("error", "You must be logged in as a student.");
      return res.redirect("/student/login");
    }

    // ✅ Change password
    await student.setPassword(newPassword);
    await student.save();

    // ✅ Logout student after password change
    req.logout(err => {
      if (err) {
        req.flash("error", "Something went wrong!");
        return res.redirect("/student/change-password");
      }
      req.flash("success", "Password changed successfully! Please login again.");
      res.redirect("/student/login");
    });

  } catch (err) {
    console.error("Error changing student password:", err);
    req.flash("error", "Something went wrong! Try again.");
    res.redirect("/students/change-password");
  }
});


module.exports = router;