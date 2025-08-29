// models/Fee.js
const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  feeAmount: { type: Number, required: true },
  paidAmount: { type: Number,required:true},
  feeDepositDate: { type: Date, required:true },
  validTo: { type: Date, required: true },
  month:{
    type: String,
    enum : ["January","Febrauary","March","April","May","June","July","August","September","October","November","December"]
  },
  notes: {
    type: String
  }
}, { timestamps: true });

feeSchema.index({ student: 1, feeDepositDate: -1 });

module.exports = mongoose.model("Fee", feeSchema);
