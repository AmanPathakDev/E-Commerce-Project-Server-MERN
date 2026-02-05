import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "Ecommerce2" });
    console.log("Mongodb connected successfully");
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;
