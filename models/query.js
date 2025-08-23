const mongoose = require('mongoose');
const Schema  = mongoose.Schema;

const querySchema  = new Schema({
    name:    { type: String, required: true },
    email:   { type: String, required: true },

    // Number ko String hi rakho (kyunki +91, 0 prefix etc. store karne hote hain)
    number:  { type: String, required: true, match: [/^[0-9]{10}$/, "Enter valid 10 digit number"] },

    message: { type: String, required: true, maxlength: 500 } // optional limit
});

module.exports = mongoose.model("Query", querySchema);
