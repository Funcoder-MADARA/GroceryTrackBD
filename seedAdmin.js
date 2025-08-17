const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/User');

function parseArgs(argv) {
  const args = {};
  for (const item of argv.slice(2)) {
    const [key, ...rest] = item.replace(/^--/, '').split('=');
    if (!key) continue;
    args[key] = rest.length ? rest.join('=') : 'true';
  }
  return args;
}

async function run() {
  const args = parseArgs(process.argv);

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGO_URI/MONGODB_URI in environment.');
    process.exit(1);
  }

  const adminEmail = args.email || process.env.ADMIN_EMAIL;
  const adminPassword = args.password || process.env.ADMIN_PASSWORD;
  const adminPhone = args.phone || process.env.ADMIN_PHONE || '01700000000';
  const adminName = args.name || process.env.ADMIN_NAME || 'Admin';
  const adminArea = args.area || process.env.ADMIN_AREA || 'HQ';
  const adminCity = args.city || process.env.ADMIN_CITY || 'Dhaka';
  const adminAddress = args.address || process.env.ADMIN_ADDRESS || 'Head Office';

  if (!adminEmail || !adminPassword) {
    console.error('Usage: node seedAdmin.js --email="you@example.com" --password="YourPass123!" [--phone="017xxxxxxx"]');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    const existingAdminByRole = await User.findOne({ role: 'admin' });
    const existingByEmail = await User.findOne({ email: adminEmail.toLowerCase() });

    if (existingByEmail) {
      // Ensure it is admin and update password if provided
      let updated = false;
      if (existingByEmail.role !== 'admin') {
        existingByEmail.role = 'admin';
        updated = true;
      }
      // Always ensure active status for admin
      if (existingByEmail.status !== 'active') {
        existingByEmail.status = 'active';
        updated = true;
      }
      if (adminPassword) {
        existingByEmail.password = adminPassword; // will be hashed by pre-save hook
        updated = true;
      }
      if (updated) {
        await existingByEmail.save();
        console.log(`✅ Admin updated for email ${adminEmail}`);
      } else {
        console.log(`✅ Admin already exists for email ${adminEmail}`);
      }
      return;
    }

    if (existingAdminByRole && existingAdminByRole.email !== adminEmail.toLowerCase()) {
      console.error('An admin already exists with a different email. Aborting to respect single-admin policy.');
      process.exit(1);
    }

    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: 'admin',
      status: 'active',
      area: adminArea,
      city: adminCity,
      address: adminAddress
    });

    await adminUser.save();
    console.log(`✅ Admin created: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();


