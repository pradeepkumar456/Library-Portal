const mongoose = require('mongoose');
const Student = require("../models/student.js");
const mongoUrl = "mongodb://127.0.0.1:27017/studentManagement";

main().then(()=>{
    console.log("Connected to db ");
})
.catch(()=>{
    console.log("Err in connecting",err);
});

async function main(){
    mongoose.connect(mongoUrl);
};

// Sample student data
const students = [
  {
    name: 'Adi Kumar',
    dob: new Date('2001-10-03'),
    gender: 'Male',
    studentId: 'S001',
    admissionDate: new Date('2023-06-01'),
    email: 'adi.kumar@example.com',
    phone: '9876543210',
    address: '123 Main Street',
    city: 'Delhi',
    zipCode: '110001',
    timeSlot: '6 hours'
  },
  {
    name: 'Rita Sharma',
    dob: new Date('2002-05-10'),
    gender: 'Female',
    studentId: 'S002',
    admissionDate: new Date('2023-06-02'),
    email: 'rita.sharma@example.com',
    phone: '9876543211',
    address: '456 Park Avenue',
    city: 'Mumbai',
    zipCode: '400001',
    timeSlot: '12 hours'
  },
  {
    name: 'Vikram Singh',
    dob: new Date('2001-12-15'),
    gender: 'Male',
    studentId: 'S003',
    admissionDate: new Date('2023-06-03'),
    email: 'vikram.singh@example.com',
    phone: '9876543212',
    address: '789 MG Road',
    city: 'Bangalore',
    zipCode: '560001',
    timeSlot: '18 hours'
  }
];

// Function to seed data
const seedDB = async () => {
  try {
    await Student.deleteMany({}); // Clear existing students
    await Student.insertMany(students); // Insert sample students
    console.log('✅ Students data seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding students:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
