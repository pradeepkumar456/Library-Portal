const axios = require("axios");
require("dotenv").config();

const sendMail = async (to, subject, htmlContent, toName) => {
  try {
    // Check if email is provided
    if (!to) {
      console.log("⚠️ No email provided, skipping mail...");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.log("⚠️ Invalid email format, skipping mail...");
      return false;
    }

    

    // Send email using Brevo API
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.FROM_NAME || "Ravendra Kumar",
          email: process.env.FROM_EMAIL, // verified sender
        },
        to: [
          {
            email: to,  
          }
        ],
        subject,
        htmlContent,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    // console.log("✅ Email sent:", response.data.messageId);
    return true;

  } catch (err) {
    console.error(
      "❌ Mail sending failed:",
      err.response?.data || err.message
    );
    return false;
  }
};

module.exports = sendMail;
