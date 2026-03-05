const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(phone, otp) {
  await client.messages.create({
    body: `Hey,congratulations! You got free voucher from lidl,credit:50€! Your code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}

module.exports = sendSMS;