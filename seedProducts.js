const mongoose = require('mongoose');
const Product = require('./models/Product'); // relative path
const { faker } = require('@faker-js/faker');

async function seedProducts() {
  await mongoose.connect('mongodb://localhost:27017/grocery-track-bd', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await Product.deleteMany({}); // clear old

  const categories = [
    'dairy', 'meat', 'seafood', 'fruits', 'vegetables',
    'grains', 'bakery', 'beverages', 'snacks',
    'frozen', 'canned', 'condiments', 'other'
  ];

  // ✅ Match schema enum exactly
  const units = ['piece', 'kg', 'liter', 'box', 'pack', 'dozen'];

  const products = [];

  for (let i = 0; i < 30; i++) {
    const category = faker.helpers.arrayElement(categories);
    const unit = faker.helpers.arrayElement(units);

    products.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      companyId: new mongoose.Types.ObjectId("68a061f67ecbfb09273526cf"),
      category,
      unitPrice: parseFloat(faker.commerce.price({ min: 1, max: 100, dec: 2 })),
      unit,
      stockQuantity: faker.number.int({ min: 10, max: 100 }),
      minOrderQuantity: faker.number.int({ min: 1, max: 5 }),
      brand: faker.company.name(),
      images: [
        faker.image.urlLoremFlickr({
          category: 'food',
          width: 640,
          height: 480
        })
      ],
      isActive: true,
      expiryDate: faker.date.soon({ days: 365 }),
      manufacturingDate: faker.date.past({ years: 1 }),
      tags: faker.helpers.uniqueArray(() => faker.commerce.productAdjective(), 3),
    });
  }

  await Product.insertMany(products);
  console.log('✅ 30 products inserted successfully!');
  await mongoose.disconnect();
}

seedProducts().catch(console.error);
