const mongoose = require('mongoose');
const Product = require('./models/Products'); // relative path
const { faker } = require('@faker-js/faker');

async function seedProducts() {
  await mongoose.connect('mongodb://localhost:27017/grocery-track-bd', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Product.deleteMany({}); // clear old

  const categories = ['groceries', 'beverages', 'snacks', 'household', 'personal_care', 'frozen_foods', 'dairy', 'bakery', 'others'];
  const units = ['kg', 'gram', 'liter', 'ml', 'piece', 'pack', 'dozen', 'bottle', 'can', 'box'];
  const weightUnits = ['kg', 'gram', 'liter', 'ml'];

  const products = [];

  for (let i = 0; i < 30; i++) {
    const category = faker.helpers.arrayElement(categories);
    const unit = faker.helpers.arrayElement(units);
    const weightUnit = faker.helpers.arrayElement(weightUnits);

    products.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      companyId: new mongoose.Types.ObjectId("689887fa0f48b8187ad706ea"), // ensure ObjectId type
      category,
      subCategory: faker.commerce.department(),
      price: parseFloat(faker.commerce.price({ min: 1, max: 100, dec: 2 })),
      unit,
      stockQuantity: faker.number.int({ min: 10, max: 100 }),
      minOrderQuantity: faker.number.int({ min: 1, max: 5 }),
      brand: faker.company.name(),
      weight: parseFloat(faker.number.float({ min: 0.1, max: 10, precision: 0.01 }).toFixed(2)),
      weightUnit,
      images: [faker.image.urlLoremFlickr({ category: 'food', width: 640, height: 480 })],
      isActive: true,
      isAvailable: true,
      totalOrders: 0,
      totalSold: 0,
      isFeatured: faker.datatype.boolean(),
      isSeasonal: faker.datatype.boolean(),
      expiryDate: faker.date.soon({ days: 365 }),
      manufacturingDate: faker.date.past({ years: 1 }),
      tags: faker.helpers.uniqueArray(() => faker.commerce.productAdjective(), 3),
    });
  }

  await Product.insertMany(products);
  console.log('✅ 30 products inserted!');
  await mongoose.disconnect();
}

seedProducts().catch(console.error);
