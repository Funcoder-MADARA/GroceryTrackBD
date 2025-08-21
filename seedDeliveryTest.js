const mongoose = require('mongoose');
const Order = require('./models/Order');
const Delivery = require('./models/Delivery');
const Product = require('./models/Product');
const User = require('./models/User');

require('dotenv').config();

async function seedDeliveryTest() {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = 'mongodb+srv://abdullahibnasiddiquie12688:gxDHD2HjvwFTb3uO@abdullahibnasiddiquie.rp65brr.mongodb.net/GroceryTrackBD';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB Atlas...');

    // Delivery Worker Info (from your provided data)
    const deliveryWorkerId = new mongoose.Types.ObjectId("68a71f801ddd3382dd52dfa5");

    // Find or create a shopkeeper
    let shopkeeper = await User.findOne({ role: 'shopkeeper', status: 'active' });
    if (!shopkeeper) {
      shopkeeper = new User({
        name: "Sarah Ahmed",
        email: "sarah.shop@grocerytrack.com",
        phone: "+8801711111111",
        password: "$2a$12$nPsqV83gW89Tk2EH4rZgDu.AipuY2EcPgCExOFedt13AHqAHfpvIS", // Shop@2025
        role: "shopkeeper",
        status: "active",
        area: "Dhanmondi",
        city: "Dhaka",
        address: "House 15, Road 7, Dhanmondi",
        shopkeeperInfo: {
          shopName: "Sarah's Fresh Mart",
          businessType: "Grocery Store",
          businessHours: "8 AM - 10 PM",
          shopSize: "Medium"
        }
      });
      await shopkeeper.save();
      console.log('Created shopkeeper:', shopkeeper.name);
    }

    // Find or create a company
    let company = await User.findOne({ role: 'company_rep', status: 'active' });
    if (!company) {
      company = new User({
        name: "Abdullah Ibn Asiddiquie",
        email: "abdullahibnasiddiquie12688@gmail.com",
        phone: "+8801888888888",
        password: "$2a$12$nPsqV83gW89Tk2EH4rZgDu.AipuY2EcPgCExOFedt13AHqAHfpvIS", // AIS@CSE#
        role: "company_rep",
        status: "active",
        area: "Uttara",
        city: "Dhaka",
        address: "Sector 10, Uttara",
        companyInfo: {
          companyName: "Fresh Foods Ltd",
          companyType: "Food Manufacturing",
          businessLicense: "BL123456",
          taxId: "TAX789012"
        }
      });
      await company.save();
      console.log('Created company:', company.companyInfo.companyName);
    }

    // Find or create some products
    let products = await Product.find({ companyId: company._id }).limit(3);
    if (products.length === 0) {
      const newProducts = [
        {
          name: "Fresh Milk",
          description: "Pure cow milk",
          category: "dairy",
          unitPrice: 85.00,
          unit: "liter",
          stockQuantity: 50,
          minOrderQuantity: 1,
          companyId: company._id,
          isActive: true,
          brand: "Fresh Foods",
          tags: ["organic", "fresh", "dairy"]
        },
        {
          name: "Brown Bread",
          description: "Whole wheat brown bread",
          category: "bakery",
          unitPrice: 45.00,
          unit: "piece",
          stockQuantity: 30,
          minOrderQuantity: 1,
          companyId: company._id,
          isActive: true,
          brand: "Fresh Foods",
          tags: ["bakery", "wheat", "healthy"]
        },
        {
          name: "Basmati Rice",
          description: "Premium quality basmati rice",
          category: "grains",
          unitPrice: 120.00,
          unit: "kg",
          stockQuantity: 100,
          minOrderQuantity: 1,
          companyId: company._id,
          isActive: true,
          brand: "Fresh Foods",
          tags: ["premium", "rice", "basmati"]
        }
      ];
      
      products = await Product.insertMany(newProducts);
      console.log('Created products:', products.length);
    }

    // Create an order
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;
    const orderItems = products.map((product, index) => ({
      productId: product._id,
      productName: product.name,
      quantity: index + 2, // 2, 3, 4 quantities
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice * (index + 2),
      unit: product.unit
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = new Order({
      orderNumber,
      shopkeeperId: shopkeeper._id,
      companyId: company._id,
      items: orderItems,
      finalAmount: totalAmount,
      status: 'approved' // Ready for delivery
    });

    await order.save();
    console.log('Created order:', orderNumber);

    // Create a delivery ready to be completed
    const deliveryNumber = `DEL-${Date.now().toString().slice(-4)}`;
    
    const delivery = new Delivery({
      deliveryNumber,
      orderId: order._id,
      deliveryWorkerId: deliveryWorkerId,
      shopkeeperId: shopkeeper._id,
      companyId: company._id,
      items: orderItems,
      pickupLocation: company.address + ", " + company.area + ", " + company.city,
      deliveryLocation: shopkeeper.address + ", " + shopkeeper.area + ", " + shopkeeper.city,
      deliveryArea: shopkeeper.area,
      status: 'in_transit', // Ready to be completed
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      pickedUpAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      inTransitAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      shopkeeperPhone: shopkeeper.phone,
      shopkeeperName: shopkeeper.name,
      deliveryInstructions: "Please call before delivery. Building has security gate.",
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      priority: 'medium',
      issues: [] // No issues yet
    });

    await delivery.save();
    console.log('Created delivery:', deliveryNumber);

    // Create another delivery that can have issues reported
    const deliveryNumber2 = `DEL-${(Date.now() + 1).toString().slice(-4)}`;
    
    const delivery2 = new Delivery({
      deliveryNumber: deliveryNumber2,
      orderId: order._id,
      deliveryWorkerId: deliveryWorkerId,
      shopkeeperId: shopkeeper._id,
      companyId: company._id,
      items: orderItems.slice(0, 2), // Only first 2 items
      pickupLocation: company.address + ", " + company.area + ", " + company.city,
      deliveryLocation: "House 25, Road 12, Dhanmondi, Dhaka", // Different address
      deliveryArea: "Dhanmondi",
      status: 'picked_up', // Ready to mark in transit or report issues
      assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      pickedUpAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      shopkeeperPhone: "+8801722222222",
      shopkeeperName: "Karim Uddin Shop",
      deliveryInstructions: "Ring the bell twice. Ask for Karim bhai.",
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      priority: 'high',
      issues: []
    });

    await delivery2.save();
    console.log('Created second delivery:', deliveryNumber2);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Summary:');
    console.log('- Delivery Worker: Protik Deliverwala');
    console.log('- Shopkeeper:', shopkeeper.name);
    console.log('- Company:', company.companyInfo.companyName);
    console.log('- Order:', orderNumber);
    console.log('- Delivery 1 (in_transit):', deliveryNumber, '- Ready to complete');
    console.log('- Delivery 2 (picked_up):', deliveryNumber2, '- Ready to mark in transit or report issues');
    console.log('\n✅ Go to http://localhost:3000/deliveries to see the deliveries!');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB Atlas.');

  } catch (error) {
    console.error('Error seeding delivery test data:', error);
    process.exit(1);
  }
}

seedDeliveryTest();
