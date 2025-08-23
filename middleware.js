const { adminRegisterSchema,
  adminLoginSchema,
  adminUpdateSchema } = require("./validation/adminValidation");



exports.ensureLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please login first");
  return res.redirect("/");
};

// middleware.js
exports.ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated() || req.user?.role !== "admin") {
    req.flash("error", "Admin login required");
    return res.redirect("/admin/login");
  }

  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  if (!req.session.lastAccess) req.session.lastAccess = now;

  if (now - req.session.lastAccess > fifteenMinutes) {
    // Flash message BEFORE destroying session
    req.flash("error", "Session expired, login again");

    return req.session.destroy(err => {
      if (err) console.error("Session destroy error:", err);

      req.logout(() => {
        return res.redirect("/admin/login");
      });
    });
  }

  req.session.lastAccess = now;
  next();
};



exports.ensureStudent = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === "student") return next();
  req.flash("error", "Login Required");
  return res.redirect("/student/login");
};


// Middleware to redirect if admin is already logged in
exports.redirectAdminIfLoggedIn = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    next();
};

// Middleware to redirect if student/user is already logged in
exports.redirectStudentIfLoggedIn = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'student') {
        return res.redirect('/student/studentDetail');
    }
    next();
};

// Joi Validation for admin login
exports.validateAdminLogin = (req, res, next) => {
  const { error, value } = adminLoginSchema.validate(req.body);
  if (error) {
    req.flash("error", error.details[0].message);
    return res.redirect("/admin/login");
  }
  // Replace req.body with validated data (optional)
  req.body = value;
  next();
};


// Update admin details // adminValidationMiddleware.js
exports.validateAdminUpdate = (req, res, next) => {
    const { error } = adminUpdateSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    next();
};

// Middleware for admin registration validation
exports.validateAdminRegister = (req, res, next) => {
    const { error } = adminRegisterSchema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }
    next();
};
