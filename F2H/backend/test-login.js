import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/face2hire';

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME || 'face2hire',
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connected successfully');

    // Test login with the existing user
    const email = 'fazilatfatima313@gmail.com';
    const password = 'testpassword123'; // Try a common password

    console.log(`🔍 Testing login for: ${email}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ User found: ${user.firstName} ${user.lastName}`);
    console.log(`🔐 Password hash exists: ${!!user.password}`);

    const isPasswordValid = await user.comparePassword(password);
    console.log(`🔑 Password valid: ${isPasswordValid}`);

    if (isPasswordValid) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Invalid password');
      console.log('💡 Try different passwords or check registration process');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
