const express = require("express");
const mongoose = require("mongoose");
const foodRouter = require("./routes/FoodRoutes");
const userRouter = require("./routes/user");
const app = express();
const paymentRouter = require("./routes/Payment");
const twofaRouter = require("./routes/2fa");
const otpRouter = require("./routes/otp");
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());
app.use(paymentRouter);
app.use(otpRouter);
app.use(foodRouter);
app.use(userRouter);
app.use(twofaRouter);
mongoose.connect(
  "mongodb+srv://moslehuddin178_db_user:0UNl5OVnPTN2sOVm@cluster1.vrbqgoa.mongodb.net/?appName=Cluster1").catch((err) => console.log(err));

app.use(foodRouter);

app.listen(3000, () => {
  console.log("Server is running...", 3000);
});
