const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  twoFactorSecret: { type: String }, // The secret shared with the App
  isTwoFactorEnabled: { type: Boolean, default: false },
  role: { type: String, required: true, enum: ['user', 'admin'] }, // 'user' or 'admin'
  expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000) },
  isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String 
    },
    verifiedAt: {
        type: Date
    }
});

module.exports = mongoose.model('User', UserSchema);