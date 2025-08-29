const express = require('express');
const router = express.Router();
const Student = require('../models/student.js'); 
const { route } = require('./student.js');
const {ensureStudent, redirectStudentIfLoggedIn} = require("../middleware.js");
const passport = require("passport");
const Fee = require("../models/fee.js");

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
router.get("/studentdetail", ensureStudent, async (req, res) => {
  try {
    // 1️⃣ Get logged-in student
    const student = await Student.findById(req.user._id);

    if (!student) {
      req.flash("error", "Student not found.");
      return res.redirect("/login");
    }

    // 2️⃣ Get all fee records of that student, latest first
    const fees = await Fee.find({ student: student._id })
      .sort({ feeDepositDate: -1 }); // latest month fee सबसे पहले आएगी

    // 3️⃣ Calculate totals (optional)
    let totalPaid = 0;
    fees.forEach(f => totalPaid += f.paidAmount);

    // 4️⃣ Latest fee record निकाल लो (अगर चाहिए तो)
    const latestFee = fees.length > 0 ? fees[0] : null;

    res.render("student/studentDetails", {
      student,
      fees,
      latestFee,
      totalPaid
    });
  } catch (err) {
    console.error("❌ Error in studentdetail route:", err);
    req.flash("error", "Server Error: Unable to load student details.");
    res.redirect("/");
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