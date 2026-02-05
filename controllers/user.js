import { OTP } from "../models/Otp.js";
import { User } from "../models/User.js";
import sendOtp from "../utils/sendOtp.js";
import TryCatch from "../utils/TryCatch.js";
import jwt from "jsonwebtoken";

export const loginUser = TryCatch(async (req, res) => {
  const { email } = req.body;

  const subject = "E-Commerce Project";

  const otp = Math.floor(Math.random() * 1000000);

  // Checking previous opt available or not and deleting if available
  const prevOtp = await OTP.findOne({ email });

  if (prevOtp) {
    await prevOtp.deleteOne();
  }

  // Sending otp
  await sendOtp({ email, subject, otp });

  // Creating new otp
  await OTP.create({ email, otp });

  res.json({ message: "OTP sent to your mail" });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  // Checking if user has otp or not
  const haveOtp = await OTP.findOne({ email, otp });

  if (!haveOtp) {
    return res.status(400).json({ message: "Wrong OTP" });
  }

  // Finding user in db
  let user = await User.findOne({ email });

  if (user) {
    const token = await jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "15d",
    });

    // Deleting otp
    await haveOtp.deleteOne();

    res.json({
      message: "User LoggedIn",
      token,
      user,
    });
  } else {
    // Create user
    user = await User.create({ email });

    const token = await jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "15d",
    });

    await haveOtp.deleteOne();

    res.json({ message: "User LoggedIn", token, user });
  }
});

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json(user);
});
