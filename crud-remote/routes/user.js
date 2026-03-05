const express = require('express');
const router = express.Router(); // Change 'app' to 'router'
const { body, validationResult } = require('express-validator')
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailSender');
const authenticator = require('otplib').authenticator;
const sendSMS = require('../utils/smsHelper');
// const timeMiddleware = require('../middleware/time');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// Change app.post to router.post
router.post('/register', async (req, res) => {
      const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
     
     console.log('Validation passed, proceeding with registration...', !errors.isEmpty()); // Debugging log
    const { username, email, password, role, phone } = req.body;



    try {
      console.log('Checking if user already exists with email:', email); // Debugging log

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Hashed Password:', hashedPassword); // Debugging log

      const token = crypto.randomBytes(32).toString('hex');

      console.log('token:', token); // Debugging log
      console.log('Received registration request with body:', req.body), // Debugging log
      console.log('Hashed Password:', hashedPassword); // Debugging log
      
      const otp = generateOTP();
      console.log('Generated OTP:', otp); // Debugging log

      const user = new User({ username, email, password: hashedPassword, role, phone, otpCode: otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000), verificationToken: token });

    // await sendVerificationEmail(email, token);
     await user.save();

     await sendSMS(phone, otp); // Replace with user's phone number
      console.log('OTP sent via SMS'); // Debugging log

         res.json({
      message: "OTP sent to your phone. Please verify to complete registration.",
      otp: otp   // only for testing
    });

    } catch (err) {
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  }

);

router.post('/login', async (req, res) => {
  console.log('Login route hit with body:', req.body.email); // Debugging log
const { email, password } = req.body;
console.log('Login attempt with email:', email); // Debugging log
try {
    
    const user = await User.findOne({ email });

    console.log('User found:', user); // Debugging log
    if (!user) return res.status(400).json({ message: 'Invalid email' });

    console.log('Comparing password:', password, 'with hashed password:', user.password); // Debugging log
    const isMatch = await bcrypt.compare(password, user.password);

     console.log('Password match result:', isMatch); // Debugging log
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });


      if (user.isTwoFactorEnabled) {
    // DO NOT give the final token yet. Give a temporary "Pre-Auth" token.
    const preAuthToken = jwt.sign({ id: user._id, mfa: true }, 'fgdsfdgs', { expiresIn: '5m' });
    return res.json({ mfaRequired: true, preAuthToken });
  }
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, 'fgdsfdgs', { expiresIn: '1h' });
    console.log('Generated JWT:', token); // Debugging log
    res.status(200).json({ token, message: 'Logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});


router.post('/api/login/verify-otp', async (req, res) => {
  const { code, preAuthToken } = req.body;

  const decoded = jwt.verify(preAuthToken, 'SECRET');
  
  const user = await User.findById(decoded.id);
  const isValid = authenticator.check(code, user.twoFactorSecret);

  if (!isValid) return res.status(401).json({ message: "Invalid 2FA Code" });

  // FINALLY issue the real Access Token
  const accessToken = jwt.sign({ id: user._id }, 'SECRET', { expiresIn: '1h' });
  res.json({ accessToken });
});

// This route "catches" the click from the email
router.get('/api/verify/:token', async (req, res) => {
    // 1. Extract the token from the URL
    const { token } = req.params;
    console.log('Verification token received:', token); // Debugging log

    try {
        // 2. Look for a user with this specific token in your DB
        const user = await User.findOne({ verificationToken: token });
        // const expiresAt = new Date();
        // expiresAt.setHours(expiresAt.getHours() + 1); 
        
// For 24 hours: expiresAt.setDate(expiresAt.getDate() + 1);

         console.log('User found for verification:', user); // Debugging log
        if (!user) {
            return res.status(404).send("<h1>Invalid or expired verification link!</h1><p>Please try registering again.</p>");
        }

        // 3. Update the user status
        user.isVerified = true;
        user.verificationToken = null; // Clear it so it's a one-time use link
        await user.save();
 
        // 4. Send a response or redirect to your frontend
        res.send("<h1>Account Verified!</h1><p>You can now close this tab and log in.</p>");
        
    } catch (err) {
        res.status(500).send("Server error during verification.");
    }
});



module.exports = router; 