const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use environment variable or fallback to local MongoDB
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/grocerytrackbd';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('Make sure MongoDB is running on your system');
    process.exit(1);
  }
};

module.exports = connectDB;