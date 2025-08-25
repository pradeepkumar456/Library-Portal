if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 8080;
const session = require("express-session");
const flash = require("connect-flash");
const multer = require("multer");
const MongoStore = require('connect-mongo');
const ExpressError = require("./utils/ExpressError.js");

const path = require("path");
const ejs = require("ejs");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const passport = require("passport");



// routes
const studentRoutes = require("./routes/student");
const indexRoute = require("./routes/index.js");
const adminprofileRoute = require("./routes/adminProfile.js");
const studentLoginRoute = require("./routes/studentLogin.js");





const mongoUrl = process.env.MONGOURL;
main()
  .then(() => {
    console.log("Connected to db ");
  })
     .catch((err) => {
    console.log("Err in connecting", err);
  });

async function main() {
 await  mongoose.connect(mongoUrl);
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); // for form data
app.use(express.json()); // for JSON data
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);


// // Session
app.use(
  session({
    secret:  process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
    mongoUrl,
    crypto :{
      secret : process.env.SECRET
    },
    collectionName: 'session',
    touchAfter:24 * 60 * 60, // 1 day
  }),
    cookie: {
      httpOnly: true,
      // secure: true, // enable when behind HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


// Passport init
app.use(passport.initialize());
app.use(passport.session());

// --- 🔒 Cache-control middleware ---
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1
  res.setHeader('Pragma', 'no-cache'); // HTTP 1.0
  res.setHeader('Expires', '0'); // Proxies
  next();
});


// ✅ Load passport strategies AFTER passport is initialized
require("./config/passport");



// Flash middleware
app.use(flash());

// Global variables (EJS me directly use karne ke liye)
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
   res.locals.currentUser = req.user;
  next();
});


// Dynamic Title Middleware
app.use((req, res, next) => {
  // Convert URL path to a readable title
  const pathName = req.path; // e.g., /admin/dashboard
  const formattedTitle = pathName
    .split("/")                // split by /
    .filter(Boolean)           // remove empty strings
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize
    .join(" - ");              // join with dash

  res.locals.title = formattedTitle || "Student Management System"; // default title for "/"
  next();
});


// Routes
app.use("/",indexRoute);
app.use("/admin",studentRoutes)
app.use("/admin",adminprofileRoute);
app.use("/student",studentLoginRoute);




// 404 Handler
app.use((req, res) => {
  res.status(404).render("error/error.ejs", { 
    statusCode: 404, 
    message: "Page Not Found 😢" 
  });
});

// General Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { 
    statusCode: 500, 
    message: "Something went wrong! ⚡" 
  });
});


app.listen(port, () => {
  console.log(`Server is listening at the port: ${port} `);
});
