import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Connected to MongoDB ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
