import dotenv from 'dotenv';
import { connectToDatabase, disconnectFromDatabase } from './db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/order_profile_db';
  await connectToDatabase(mongoUri);

  await User.deleteMany({});
  await Product.deleteMany({});

  const user = await User.create({
    fullName: 'Sample Retailer',
    email: 'retailer@example.com',
    gender: 'Male',
    shopName: 'Brothers Shop',
    shopAddress: 'Merul Badda',
    shopType: 'Large',
    district: 'Dhaka',
  });

  const jamuna = await Product.create([
    { name: 'Soft Drink 250ml', companyName: 'Jamuna Export Limited', unitPrice: 30, imageUrl: '' },
    { name: 'Soft Drink 500ml', companyName: 'Jamuna Export Limited', unitPrice: 50, imageUrl: '' },
    { name: 'Energy Drink 250ml', companyName: 'Jamuna Export Limited', unitPrice: 60, imageUrl: '' },
  ]);

  console.log('Seed complete:', { userId: user._id.toString(), productsCreated: jamuna.length });
  await disconnectFromDatabase();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});