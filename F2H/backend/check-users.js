import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      isActive: { type: Boolean, default: true }
    });

    const User = mongoose.model('User', userSchema, 'users');

    const users = await User.find({}).select('firstName lastName email isActive');
    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} (Active: ${user.isActive})`);
    });

    if (users.length === 0) {
      console.log('⚠️  No users found in database. You may need to register first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

connectDB();
