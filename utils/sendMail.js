// const nodemailer = require("nodemailer");

// const sendMail = async (to, subject, htmlContent) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER, // Gmail address
//         pass: process.env.EMAIL_PASS, // App password
//       },
//     });

//     await transporter.sendMail({
//       from: `"Admin Support" <${process.env.EMAIL_USER}>`, // Correct template literal
//       to,
//       subject,
//       html: htmlContent,
//     });

//   } catch (err) {
//     console.error("Error sending email:", err);
//   }
// };

// module.exports = sendMail;


const nodemailer = require("nodemailer");

// Reusable transporter (create once)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // App password
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
      from: `"Ravendra Gangwar" <${process.env.EMAIL_USER}>`,
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
