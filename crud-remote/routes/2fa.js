const express = require('express');
const app = express();
const User = require('../models/user');
const QRCode = require('qrcode');
const authenticationMiddleware = require('../middleware/auth');
const { authenticator } = require('@otplib/preset-default');

// Middleware
app.use(express.json());


app.post('/api/2fa/setup', authenticationMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isTwoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled.' });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Create otpauth URL
    const otpauth = authenticator.keyuri(
      user.email,
      'MySecureApp',
      secret
    );

    // Save secret temporarily (DO NOT enable yet)
    user.twoFactorSecret = secret;
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    res.json({
      message: 'Scan QR and verify to activate 2FA.',
      qrCodeUrl,
    });

  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ message: 'Server error during 2FA setup.' });
  }
});



app.post('/api/2fa/verify-activate', authenticationMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required.' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup not initiated.' });
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Enable 2FA
    user.isTwoFactorEnabled = true;
    await user.save();

    res.json({ message: '2FA is now fully active!' });

  } catch (error) {
    console.error('2FA Activation Error:', error);
    res.status(500).json({ message: 'Server error during 2FA activation.' });
  }
});

app.get('/test-2fa', (req, res) => {
  res.send(`
    <h2>2FA Test</h2>
    <button onclick="setup()">Setup 2FA</button>
    <div id="qr"></div>

    <script>
      async function setup() {
        const res = await fetch('/api/2fa/setup', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YThiMTg0MDZhMmNmMzA2NDQzOTM1YSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiZG9lQGdtYWlsLmNvbSIsImlhdCI6MTc3MjY2MzE4MCwiZXhwIjoxNzcyNjY2NzgwfQ.cryvIARIF_aVGsbxxr3zBYY_A58O-HEriD_TPVGJeIg'
          }
        });

        const data = await res.json();
        document.getElementById('qr').innerHTML =
          '<img src="' + data.qrCodeUrl + '" />';
      }
    </script>
  `);
});

module.exports = app;