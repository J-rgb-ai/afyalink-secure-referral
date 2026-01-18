const nodemailer = require('nodemailer');

// Use Ethereal for testing if no real SMTP is provided
// In a real app, use environment variables for host, port, user, pass
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user', 
    pass: process.env.SMTP_PASS || 'ethereal_pass'
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
    if (!process.env.SMTP_HOST) {
        console.log('--- MOCK EMAIL SEND ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        console.log('-----------------------');
        return true;
    }

    const info = await transporter.sendMail({
      from: '"AfyaLink Admin" <noreply@afyalink.com>',
      to,
      subject,
      text,
      html
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = { sendEmail };
