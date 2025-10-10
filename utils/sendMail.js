
const nodemailer = require("nodemailer");

// Reusable transporter (create once)
const transporter = nodemailer.createTransport({
 host: "smtp.gmail.com",
  port : 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.ADMIN_MAIL, // Gmail address
    pass: process.env.ADMIN_PASS, // App password
  },
});

const sendMail = async (to, subject, htmlContent) => {
  try {
    if (!to) {
      console.log("⚠️ No email provided, skipping mail...");
      return false; // mail नहीं गया
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.log("⚠️ Invalid email format, skipping mail...");
      return false;
    }

    await transporter.sendMail({
      from: `"Ravendra Gangwar" <${process.env.ADMIN_MAIL}>`,
      to,
      subject,
      html: htmlContent,
    });

   
    return true; // mail successfully गया
  } catch (err) {
    console.error("⚠️ Mail sending failed:", err.message);
    return false; // mail fail हो गया
  }
};

module.exports = sendMail;
