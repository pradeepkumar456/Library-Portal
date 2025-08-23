const nodemailer = require("nodemailer");

const sendMail = async (to, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail address
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    await transporter.sendMail({
      from: `"Admin Support" <${process.env.EMAIL_USER}>`, // Correct template literal
      to,
      subject,
      html: htmlContent,
    });

  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = sendMail;
