import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    const connection = await mongoose.connect(MONGO_URI)
    console.log("MongoDB connected: " + MONGO_URI)
  } catch (error) {
    console.log("Error at connectDB: ", error)
  }
}

export default connectDB;