const express = require("express");
const router = express.Router();
const Student = require("../models/student.js");
const Admin = require("../models/admin.js");
const passport = require("passport");
const Query = require("../models/query.js");
const multer = require("multer");
const { storage } = require("../CloudConfig.js");
const uploads = multer({ storage });
const {
  ensureAdmin,
  redirectAdminIfLoggedIn,
  validateAdminLogin,
  validateAdminUpdate,
  validateAdminRegister,ensureLoggedIn
} = require("../middleware.js");
const sendMail = require("../utils/sendMail.js");


// Update info
router.get("/update-info", ensureAdmin, (req,res)=>{
  try{
    res.render("admin/update-info");
  } catch(err){
    res.send(err);
  }
});

// GET: Login page
router.get("/login", redirectAdminIfLoggedIn, (req, res) => {
  res.render("admin/login"); // form fields: name="email", name="password"
});

// POST: Login
router.post(
  "/login",
  validateAdminLogin,
  passport.authenticate("admin-local", {
    failureRedirect: "/admin/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", `Welcome to admin panel , ${req.user.name}`);
    res.redirect("/admin/dashboard");
  }
);

// // GET: Register page (optional)
// router.get("/register", (req, res) => {
//   res.render("admin/register");
// });

// // POST: Register (Admin.register comes from PLM)
// router.post("/register",validateAdminRegister, async (req, res) => {
//   try {
//     const { email, name, password } = req.body;
//     const admin = new Admin({ email, name, role: "admin" });
//     await Admin.register(admin, password);
//     console.log(admin);
//     req.flash("success", "Admin account created. Please login.");
//     res.redirect("/admin/login");
//   } catch (err) {
//     console.error(err);
//     req.flash("error", err.message || "Registration failed");
//     res.redirect("/register");
//   }
// });

// Admin
router.get("/dashboard", ensureAdmin, async (req, res) => {
  try {
    const admin = await Admin.findOne({});
    const totalStudents = await Student.countDocuments({});
    const totalQuery = await Query.countDocuments({});
    req.flash("success", "Welcome to admin panel");
    res.render("admin/dashboard.ejs", { admin, totalStudents, totalQuery,admin: req.user});
  } catch (err) {
    res.send("err", err);
  }
});

// Admin edit form
router.get("/:id/edit", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    res.render("admin/editAdmit.ejs", { admin });
  } catch (err) {
    res.status(400).send("server error ");
  }
});

// Edit route for updating admin
router.put(
  "/:id/edit",
  ensureAdmin,
 validateAdminUpdate,
  uploads.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role, location } = req.body;

      // Prepare update object
      const updateData = { name, email, role, location };

      // Add image only if uploaded
      if (req.file) {
        updateData.image = {
          url: req.file.path,
          filename: req.file.filename,
        };
      }

      // Update admin profile
      const admin = await Admin.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!admin) {
        req.flash("error", "Admin not found.");
        return res.status(404).redirect("/admin/dashboard");
      }

      req.flash("success", "Admin details changed successfully.");
      res.redirect("/admin/dashboard");
    } catch (err) {
      console.error("Error updating admin:", err);
      req.flash("error", "Server error while updating admin.");
      res.status(500).redirect("/admin/dashboard");
    }
  }
);



router.get("/change-password", (req, res) => {
  res.render("admin/changePassword"); // views/admin/forgot-password.ejs
});

router.post("/change-password", ensureLoggedIn,ensureAdmin, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Check if passwords match
    if(newPassword !== confirmPassword){
      req.flash("error", "Passwords do not match!");
      return res.redirect("/admin/change-password");
    }

    const admin = req.user;
    await admin.setPassword(newPassword);
    await admin.save();

     // ✅ Send Email with new password
    // if (admin.email) {
    //   await transporter.sendMail({
    //     from: `"Admin Panel" <${process.env.EMAIL_USER}>`,
    //     to: admin.email,
    //     subject: "Your Admin Password Updated",
    //     text: `Hello ${admin.name},\n\nYour admin account password has been updated successfully.\n\nYour new password is: ${newPassword}\n\nPlease keep it secure.\n\nRegards,\nAdmin Portal`,
    //   });
    // }

      // Send password to admin email
    if(admin.email){
      const htmlContent = `
        <p>Hello ${admin.name},</p>
        <p>Your password has been updated successfully.</p>
        <p><strong>New Password:</strong> ${newPassword}</p>
        <p>Please keep it safe.</p>
      `;
      await sendMail(admin.email, "Password Changed Successfully", htmlContent);
    }


    req.logout(err => {
      if(err){
        req.flash("error", "Something went wrong!");
        return res.redirect("/admin/change-password");
      }
      req.flash("success", "Password changed successfully! Please login again.");
      res.redirect("/admin/login");
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong! Try again.");
    res.redirect("/admin/change-password");
  }
});



// / routes/admin.js
router.get("/logout", (req, res, next) => {
  // Flash message BEFORE destroying session
  req.flash("success", "Logged out successfully.");

  // Passport logout
  req.logout(function(err){
    if(err) return next(err);

    // Destroy session
    req.session.destroy(err => {
      if(err) console.error("Session destroy error:", err);
      res.redirect("/admin/login");
    });
  });
});


module.exports = router;
