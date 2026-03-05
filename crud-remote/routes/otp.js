const express = require("express");
const router = express.Router();
const User = require("../models/user");

// helper function
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


/* VERIFY OTP */
router.post("/verify-otp", async (req, res) => {

  try {

    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired"
      });
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;

    await user.save();

    res.json({
      message: "Phone verified successfully"
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


/* RESEND OTP */
router.post("/resend-otp", async (req, res) => {

  try {

    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const otp = generateOTP();

    user.otpCode = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;

    await user.save();

    // For Postman testing
    res.json({
      message: "OTP resent successfully",
      otp: otp
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});


module.exports = router;