import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI_ONLINE;
    const connection = await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDB connected: " + MONGO_URI)
  } catch (error) {
    console.log("Error at connectDB: ", error)
  }
}

export default connectDB;