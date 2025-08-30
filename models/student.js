const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },

    srNo: { type: String, unique: true, required: true, index: true },
    admissionDate: { type: Date, required: true },

    phone: {
      type: String,
      unique: true,
      sparse: true,
       index: true,
      match: /^[0-9]{10}$/,
      required: true,
    },
    address: { type: String },
      role: { type: String, default: "student" },

    seatNumber: { type: Number, required: true },
     email : {type : String , required: true, unique:true},

    image: {
      url: String,
      filename: String,
    },
     fee: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee"
    }
  ],
    timeSlot: {
      type: String,
      enum: ["6 hours", "12 hours", "18 hours", "24 hours"],
      default: "6 hours",
    },
  },
  { timestamps: true }
);

studentSchema.plugin(passportLocalMongoose, { usernameField: "phone" });


module.exports = mongoose.model("Student", studentSchema);
