const nodemailer = require('nodemailer');

// Use Gmail service as requested
// This automatically handles host and port for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send an email
 * @param {string} to 
 * @param {string} subject 
 * @param {string} text 
 * @param {string} html 
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    // For development without real credentials, we just log the email content
    if (!process.env.SMTP_USER) {
        console.log('--- MOCK EMAIL SEND (No User Configured) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        console.log('-----------------------');
        return true;
    }

    const info = await transporter.sendMail({
      from: '"AfyaLink Admin" <noreply@afyalink.com>',
      to: to, // Ensure this uses the argument 'to'
      subject: subject,
      text: text,
      html: html
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = { sendEmail };
