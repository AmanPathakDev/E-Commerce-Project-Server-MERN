import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const isAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      res.status(403).json({ message: "Please login" });
    }

    const decodedData = await jwt.verify(token, process.env.SECRET_KEY);

    req.user = await User.findById(decodedData._id);

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Please login" });
  }
};
