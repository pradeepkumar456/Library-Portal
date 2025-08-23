const express = require('express');
const router = express.Router();
const Student = require('../models/student.js');
const Query = require("../models/query.js");


router.get("/", async(req, res) => {
  try {
    const totalStudents = await Student.countDocuments(); // get total number of students
    res.render('routes/index.ejs', { totalStudents });
  } catch (err) {
    console.error(err);
    res.render('routes/index.ejs', { totalStudents: 0 });
  }
});

router.get("/about",(req,res)=>{
  res.render("routes/about.ejs");
});

router.get("/contact",async(req,res)=>{
  const query = await Query.find({});
  res.render("routes/contact.ejs",{query});
});

module.exports = router;