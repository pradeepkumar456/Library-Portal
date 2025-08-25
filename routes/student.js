const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const Student = require('../models/student.js'); // your schema
const Query = require("../models/query.js");
const multer = require("multer");
const path = require("path");
const {storage} = require("../CloudConfig.js");
const uploads = multer({ storage });
const { ensureAdmin,redirectAdminIfLoggedIn} = require("../middleware.js");
const sendMail = require("../utils/sendMail.js");

// routes/student.js
router.get("/students/check-duplicate", ensureAdmin, async (req, res) => {
  try {
    const { phone, srNo, seatNumber } = req.query;
    const query = [];

    if (phone) query.push({ phone });
    if (srNo) query.push({ srNo });
    if (seatNumber) query.push({ seatNumber });

    if (query.length === 0) return res.json({ exists: false });

    const existingStudent = await Student.findOne({ $or: query });

    if (existingStudent) {
      return res.json({
        exists: true,
        student: {
          name: existingStudent.name,
          phone: existingStudent.phone,
          srNo: existingStudent.srNo,
          seatNumber: existingStudent.seatNumber
        }
      });
    }

    res.json({ exists: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exists: false });
  }
});



// search student


// GET /students (list + search)
// router.get("/students", async (req, res) => {
//   try {
//     const { name, srNo } = req.query;
//     let filter = {};

//     if (name) filter.name = { $regex: name, $options: "i" };
//     if (srNo) filter.srNo = srNo;

//     const students = await Student.find(filter);

//     res.render("student/student", { 
//       students, 
//       search: { name: name || "", srNo: srNo || "" } // 👈 default values
//     });
//   } catch (error) {
//     console.error("Error fetching students:", error);
//     res.status(500).send("Server Error");
//   }
// });




// Get route of all students
// router.get("/students", ensureAdmin, async (req, res) => {
//   try {
//     // Sort by _id descending to get latest added students first
//     const allStudent = await Student.find({}).sort({ _id: -1 });
//     res.render("student/student.ejs", { allStudent });
//   } catch (error) {
//     console.error("Error fetching students:", error);
//     req.flash("error", "Unable to fetch students. Please try again.");
//     res.redirect("/admin/dashboard");
//   }
// });

// All Students 

router.get("/students", ensureAdmin, async (req, res) => {
  try {
    const { search } = req.query; // search box ka value
    let filter = {};

    if (search && search.trim() !== "") {
      // Check if search is number (SR No) or string (name)
      if (!isNaN(search)) {
        filter.srNo = Number(search);
      } else {
        filter.name = { $regex: search, $options: "i" }; // case-insensitive
      }
    }

    const allStudent = await Student.find(filter).sort({ _id: -1 });

    res.render("student/student", { 
      allStudent,
      searchQuery: search || "" // EJS me show karne ke liye
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    req.flash("error", "Unable to fetch students. Please try again.");
    res.redirect("/admin/dashboard");
  }
});





// to add new student 
router.get("/newstudent",ensureAdmin,(req, res) => {
  res.render("student/addStudent.ejs");
});

router.post("/newstudent",ensureAdmin,uploads.single("image"), async (req, res) => {
  try {
    // Handle uploaded image safely
    const image = req.file ? { url: req.file.path, filename: req.file.filename } : null;

    // Destructure request body
    const {name,fatherName,dob,gender,srNo,admissionDate,phone,address,feeAmount,
feeDepositDate,validTo,seatNumber,timeSlot, password   } = req.body;

    // Server-side validation
    const requiredFields = { name, fatherName, dob, gender, srNo, admissionDate, feeAmount, feeDepositDate, validTo, seatNumber, password  };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value) {
        req.flash("error", `${field} is required.`);
        return res.redirect("/admin/students");
      }
    }

    // Validate phone if provided
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      req.flash("error", "Phone must be a 10-digit number.");
      return res.redirect("/admin/student");
    }

    // Create new student object
    const newStudent = new Student({
      name,
      fatherName,
      dob,
      gender,
      srNo,
      admissionDate,
      phone: phone,
      address: address,
      feeAmount,
      feeDepositDate,
      validTo,
      seatNumber,
      image,
      timeSlot: timeSlot || "6 hours",
        role: "student"
    });

     // ✅ Use register() instead of save()
    await Student.register(newStudent, password);
    // // Save student
    //   await newStudent.save();

    // // Send student details to admin email
    // const adminEmail = req.user.email;
    // if(adminEmail){
    //   const htmlContent = `
    //     <p>New Student Added:</p>
    //     <ul>
    //       <li>Name: ${newStudent.name}</li>
    //       <li>Father's Name: ${newStudent.fatherName}</li>
    //       <li>DOB: ${newStudent.dob}</li>
    //       <li>Gender: ${newStudent.gender}</li>
    //       <li>SR No: ${newStudent.srNo}</li>
    //       <li>Phone: ${newStudent.phone}</li>
    //       <li>Seat No: ${newStudent.seatNumber}</li>
    //       <li>Admission Date: ${newStudent.admissionDate}</li>
    //       <li>Time Slot: ${newStudent.timeSlot}</li>
    //     </ul>
    //     <p>Keep this email as backup in case database is lost.</p>
    //   `;
    //   await sendMail(adminEmail, "New Student Added", htmlContent);
    // };


    req.flash("success", `${newStudent.name} added successfully.`);
    res.redirect("/admin/students");
  } catch (err) {
    console.error("Error adding student:", err);

    // Handle duplicate key errors (srNo, phone)
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern)[0];
      req.flash("error", `Duplicate value for ${duplicateField}.`);
      return res.redirect("/admin/newstudent");
    }

    req.flash("error", "Server Error: Unable to add student.");
    res.redirect("/admin/newstudent");
  }
});

// Individual details 
router.get("/students/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid student ID");
    }
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).send("Student not found");
    }
    res.render("student/individualStudent.ejs", { student });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// To edit student details 
router.get("/students/:id/edit",ensureAdmin, async(req,res)=>{
     try {
     
    const { id } = req.params; // get the id from URL
    const student = await Student.findById(id); // pass id directly
    if (!student) {
      return res.status(404).send("Student not found");
    }
   res.render("student/editStudent.ejs",{student});
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }  
});


// Edit Post Route 
router.put("/students/:id",ensureAdmin,uploads.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    // Destructure fields from request body according to your schema
    const {name,fatherName,dob,gender,srNo,admissionDate,phone, address,feeAmount,feeDepositDate,validTo,seatNumber,timeSlot} = req.body;

    // Prepare update data object
    const updateData = {name,fatherName,dob,gender,srNo,admissionDate,phone,
address,feeAmount,feeDepositDate,validTo,seatNumber,timeSlot};

    // If a new image is uploaded, update image field
    if (req.file) {
      updateData.image = {
        url: req.file.path,      // Cloudinary file URL
        filename: req.file.filename // Cloudinary public_id
      };
    }

    // Update student in DB
    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedStudent) {
      return res.status(404).send("Student not found");
    }

    req.flash("success", `${updatedStudent.name}'s details updated successfully.`);
    res.redirect("/admin/students");
  } catch (err) {
    console.error("Error updating student:", err);
    req.flash("error", "Error occurred while updating student.");
    res.status(500).send("Server Error");
  }
});




// Delete student
router.delete("/students/:id",ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).send("Student not found");
    }
    req.flash("success",`Student ${deletedStudent.name} deleted successfully.` );
    res.redirect("/admin/students"); // redirect back to student list page
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).send("Server Error: Unable to delete student");
  }
});


// => Query Routes <= //
// Get Query Route
router.get("/query",ensureAdmin, async (req, res) => {
  const newQuery = await Query.find({});
  const query = await Query.countDocuments({});
  res.render("Query/query.ejs", { newQuery, query });
});


// Query Post Route
router.post("/query",ensureAdmin, async (req, res) => {
  try {
    const { name, email, number, message } = req.body;
    // naya user create karo
    const newQuery = new Query({
      name,
      email,
      number,
      message,
    });

    const query = await newQuery.save();

    // Redirect admin dashboard ya list page pe
    req.flash("success", "Form has submitted , we will contact you soon");
    res.redirect("/");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Server Error");
  }
});

// Query Delete Route 
router.delete("/query/:id",ensureAdmin, async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    req.flash("success", "Query deleted successfully!");
    res.redirect("/admin/query"); // Queries list page par redirect karenge
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to delete query!");
    res.redirect("/admin/query");
  }
});


module.exports = router;