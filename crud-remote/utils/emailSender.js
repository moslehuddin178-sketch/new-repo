const nodemailer = require('nodemailer');
dotenv = require('dotenv');
dotenv.config();
// Create the transporter
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.BREVO_USER || 'a32ae2001@smtp-brevo.com',
        pass: process.env.BREVO_PASS // Store your Master Key in .env
    }
});

/**
 * Send Verification Email
 * @param {string} userEmail - Recipient email
 * @param {string} token - Unique verification token
 */
console.log('Email sender module loaded.'); // Debugging log
const sendVerificationEmail = async (userEmail, token) => {
    console.log('Preparing to send verification email to:', userEmail); // Debugging log

    const url = `${process.env.BASE_URL || 'http://localhost:3000'}/api/verify/${token}`;

    const mailOptions = {
        from: `"admin" <${process.env.EMAIL_FROM}>`, 
        to: userEmail,
        subject: 'Verify Your Email for TapTap',
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                <h3>Welcome to TapTap!</h3>
                <p>Click the button below to verify your email address:</p>
                <a href="${url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify My Email
                </a>
                <p style="margin-top: 20px;">Or copy this link: <br> ${url}</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent: " + info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Email failed to send:", error);
        throw error; // Rethrow so the route knows it failed
    }
};

// Export the function
module.exports = { sendVerificationEmail };