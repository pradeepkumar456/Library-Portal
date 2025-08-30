const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const Fee = require("../models/fee.js");
const Student = require('../models/student.js'); // your schema
const Query = require("../models/query.js");
const multer = require("multer");
const path = require("path");
const {storage} = require("../CloudConfig.js");
const uploads = multer({ storage });
const { ensureAdmin,redirectAdminIfLoggedIn} = require("../middleware.js");
const sendMail = require("../utils/sendMail.js");

// CHECK DUPLICATE ROUTE 
router.get("/students/check-duplicate", ensureAdmin, async (req, res) => {
  try {
    const { phone, srNo, seatNumber,email } = req.query;
    const query = [];

    if (phone) query.push({ phone });
    if (srNo) query.push({ srNo });
    if (seatNumber) query.push({ seatNumber });
     if (email) query.push({ email });

    if (query.length === 0) return res.json({ exists: false });

    const existingStudent = await Student.findOne({ $or: query });

    if (existingStudent) {
      return res.json({
        exists: true,
        student: {
          name: existingStudent.name,
          phone: existingStudent.phone,
          srNo: existingStudent.srNo,
          seatNumber: existingStudent.seatNumber,
          email: existingStudent.email
        }
      });
    }

    res.json({ exists: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exists: false });
  }
});


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

// ALL STUDENTS

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





// ADD NEW STUDENT 
router.get("/newstudent",ensureAdmin,(req, res) => {
  res.render("student/addStudent.ejs");
});


// POST ROUTE FOR NEW STUDENT
router.post("/newstudent",ensureAdmin,uploads.single("image"), async (req, res) => {
  try {
    // Handle uploaded image safely
    const image = req.file ? { url: req.file.path, filename: req.file.filename } : null;

    // Destructure request body
    const {name,fatherName,dob,gender,srNo,phone,address,admissionDate,
 seatNumber,timeSlot, password,email  } = req.body;

    // Server-side validation
    const requiredFields = { name, fatherName, dob, gender, srNo, phone,admissionDate,address,  seatNumber, password,email,timeSlot  };
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
      seatNumber,
      image,
      email,
      timeSlot: timeSlot || "6 hours",
        role: "student"
    });

     // ✅ Use register() instead of save()
    await Student.register(newStudent, password);

    const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};


      // 📩 Send confirmation email
    // ======================
    const htmlContent = `
      <h2>Welcome to Shyam Library 🎓</h2>
      <p>Dear <b>${newStudent.name}</b>,</p>
      <p>Your  has been <b>successfully registered</b>.</p>
      <h3>Admission Details:</h3>
      <ul>
        <li><b>Name:</b> ${newStudent.name}</li>
        <li><b>Father's Name:</b> ${newStudent.fatherName}</li>
       <li><b>DOB:</b> ${formatDate(newStudent.dob)}</li>
        <li><b>Gender:</b> ${newStudent.gender}</li>
        <li><b>SR No:</b> ${newStudent.srNo}</li>
        <li><b>Phone:</b> ${newStudent.phone}</li>
        <li><b>Seat No:</b> ${newStudent.seatNumber}</li>
        <li><b>Admission Date:</b> ${formatDate(newStudent.admissionDate)}</li>
        <li><b>Time Slot:</b> ${newStudent.timeSlot}</li>
      </ul>
      <p>Keep this email as a reference. Wishing you a great journey ahead! 🚀</p>
    <p>Best Regards,<br/>Shyam Library </p>`;

       const mailSent = await sendMail(
      newStudent.email,
      "🎓 Admission Successful - Shyam Library",
      htmlContent
    );

      // ✅ Flash message depending on mail status
    if (mailSent) {
      req.flash(
        "success",
        `${newStudent.name} added successfully  (Confirmation email sent)`
      );
    } else {
      req.flash(
        "success",
        `${newStudent.name} added successfully  (But email not sent ⚠️)`
      );
    }

   
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

// INDIBIDUAL STODENTS ROUTE 
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

//GET ROUTE FOR EDIT STUDENT 
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


// EDIT POST ROUTE FOR INDIBIDUAL STUDENT  
router.put("/students/:id",ensureAdmin,uploads.single("image"), async (req, res) => {
  try {
    const { id } = req.params;

    // Destructure fields from request body according to your schema
    const {name,fatherName,dob,gender,srNo,admissionDate,phone, address,seatNumber,timeSlot,email} = req.body;

    // Prepare update data object
    const updateData = {name,fatherName,dob,gender,srNo,admissionDate,phone,
address,seatNumber,timeSlot,email};

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




// DELETE STUDENT ROUTE 
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



// ---------=><= Fee Routes -------=><=--------- 


// Get all fees of a specific student
router.get("/students/:id/fee",ensureAdmin, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send("Student not found");

    const fees = await Fee.find({ student: studentId }).sort({ feeDepositDate: -1 });

    res.render("fee/index.ejs", { student, fees });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// GET: Show create fee form for a student
router.get("/students/:id/fee/add-fee",ensureAdmin,  async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send("Student not found");

    res.render("fee/create", { student });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// POST: Add new fee for a student
router.post("/students/:id/fee", ensureAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send("Student not found");

    const { feeAmount, paidAmount, feeDepositDate, validTo, notes,month } = req.body;

    const fee = new Fee({
      student: student._id,
      feeAmount,
      paidAmount,
      feeDepositDate,
      validTo,
      notes,
      month
    });

    const newFee = await fee.save();

    
    // Utility function for formatting dates (DD-MM-YYYY)
    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // 3️⃣ Prepare Email Content
    const htmlContent = `
      <h2>Shyam Library - Fee Confirmation </h2>
      <p>Dear <b>${student.name}</b>,</p>
      <p>Your fee payment has been <b>successfully recorded</b>.</p>
      <h3>Payment Details:</h3>
      <ul>
        <li><b>Student Name:</b> ${student.name}</li>
        <li><b>Father's Name:</b> ${student.fatherName}</li>
        <li><b>Total Fee:</b> ₹${feeAmount}</li>
        <li><b>Paid Amount:</b> ₹${paidAmount}</li>
        <li><b>Deposit Date:</b> ${formatDate(feeDepositDate)}</li>
        <li><b>Valid Till:</b> ${formatDate(validTo)}</li>
      </ul>
      <p>Keep this email as confirmation of your payment.</p>
      <p>Thank you for choosing Shyam Library! </p>
      <p>Best Regards,<br/>Shyam Library </p>
    `;

    // 4️⃣ Send Email
    const mailSent = await sendMail(
      student.email,
      " Fee Payment Confirmation - Shyam Library",
      htmlContent
    );

    if (mailSent) {
      req.flash(
        "success",
        `Fee of ₹${paidAmount} recorded for ${student.name}  (Email sent)`
      );
    } else {
      req.flash(
        "success",
        `Fee of ₹${paidAmount} recorded for ${student.name}  (Email not sent ⚠️)`
      );
    }

    req.flash("success",`Fee details added succcessfully for ${student.name}`);
    res.redirect(`/admin/students/${student._id}/fee`);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// ✅ Get edit fee form
router.get('/students/:studentId/fee/:feeId/edit',ensureAdmin, async (req, res) => {
  try {
    const { studentId, feeId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).send('Student not found');

    const fee = await Fee.findById(feeId);
    if (!fee) return res.status(404).send('Fee not found');

    res.render('fee/edit', { student, fee });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


// ✅ Update fee details (PUT method)
router.put('/students/:studentId/fee/:feeId', ensureAdmin,async (req, res) => {
  try {
    const { studentId, feeId } = req.params;
    
    const { feeAmount, paidAmount, feeDepositDate, validTo, month, notes, status, paymentMode } = req.body;
    const fee = await Fee.findByIdAndUpdate(
      feeId,
      {
        feeAmount,
        paidAmount,
        feeDepositDate,
        validTo,
        month,
        notes,
        status,
        paymentMode
      },
      { new: true, runValidators: true }
    );

    if (!fee) return res.status(404).send('Fee not found');
    req.flash("success",`The fee details  has been updated.`);
    res.redirect(`/admin/students/${studentId}/fee`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



// ✅ Delete a fee
router.delete("/students/:studentId/fee/:feeId",ensureAdmin, async (req, res) => {
  try {
    const { studentId, feeId } = req.params;

    // Delete only if fee belongs to that student
    const fee = await Fee.findOneAndDelete({ _id: feeId, student: studentId });


    if (!fee) {
      return res.status(404).json({ message: "Fee not found for this student" });
    }
    req.flash("success", "Fee record deleted successfully.");
    res.redirect(`/admin/students/${studentId}/fee`); // ✅ dynamic redirect
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;