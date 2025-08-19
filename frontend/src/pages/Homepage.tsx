import React from 'react';
// We don't need IconType anymore for this approach
import { FiBarChart2, FiBox, FiTrendingUp, FiUsers, FiCheckCircle } from 'react-icons/fi';

// --- TYPE DEFINITIONS ---

// Define the types for the FeatureCard props
// Use React.ReactNode for the icon prop for better compatibility
interface FeatureCardProps {
  icon: React.ReactNode; 
  title: string;
  description: string;
}

// Define the types for the Testimonial props
interface TestimonialProps {
  quote: string;
  author: string;
}


// --- REUSABLE COMPONENTS ---

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="bg-gray-800 p-8 rounded-lg transform hover:-translate-y-2 transition-transform duration-300">
    {/* This div wrapper helps ensure consistent sizing for the icon */}
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

const Testimonial: React.FC<TestimonialProps> = ({ quote, author }) => (
    <div className="bg-gray-800 p-8 rounded-lg">
        <p className="text-gray-300 italic">"{quote}"</p>
        <p className="mt-4 font-semibold text-green-400">{author}</p>
    </div>
)


// --- MAIN PAGE COMPONENT ---

const HomePage = () => {
  return (
    <div className="bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="fixed w-full top-0 left-0 z-50 bg-gray-900 bg-opacity-80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-3xl font-bold">
            <a href="/" className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              GroceryTrackBD
            </a>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="hover:text-green-400 transition-colors duration-300">Features</a>
            <a href="#how-it-works" className="hover:text-green-400 transition-colors duration-300">How It Works</a>
            <a href="#testimonials" className="hover:text-green-400 transition-colors duration-300">Testimonials</a>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="/login" className="hidden md:block hover:text-green-400 transition-colors duration-300">Login</a>
            <a href="/register" className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              Get Started Free
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-800 [mask-image:linear-gradient(to_bottom,white_10%,transparent_90%)]"></div>
        <div className="container mx-auto px-6 relative">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Revolutionize
            </span> Your Grocery Business
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            The all-in-one platform to manage inventory, track orders, and grow your profits. Effortlessly.
          </p>
          <div className="flex justify-center items-center space-x-4">
            <a href="#cta" className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              Start Your Free Trial
            </a>
            <a href="#how-it-works" className="border-2 border-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 hover:border-gray-600 transition-colors duration-300">
              See How It Works
            </a>
          </div>
        </div>
      </main>

      {/* "How It Works" Section */}
      <section id="how-it-works" className="py-24 bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Streamline Your Operations in 3 Easy Steps</h2>
          <p className="text-lg text-gray-400 mb-12">Get up and running in minutes.</p>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-green-400 mb-4">1</div>
              <h3 className="text-2xl font-semibold mb-2">Setup Your Store</h3>
              <p className="text-gray-400">Easily import your products and set up your business profile.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-green-400 mb-4">2</div>
              <h3 className="text-2xl font-semibold mb-2">Manage Everything</h3>
              <p className="text-gray-400">Track inventory, manage orders, and view sales from one dashboard.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-green-400 mb-4">3</div>
              <h3 className="text-2xl font-semibold mb-2">Grow Your Business</h3>
              <p className="text-gray-400">Use our analytics to make informed decisions and increase your revenue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-800 bg-opacity-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Powerful Features, Simple Interface</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FiBox className="text-green-400" />}
              title="Real-Time Inventory Management"
              description="Never miss a sale with live stock tracking and low-stock alerts."
            />
            <FeatureCard
              icon={<FiTrendingUp className="text-green-400" />}
              title="Sales & Order Tracking"
              description="A centralized system to manage orders from placement to fulfillment."
            />
            <FeatureCard
              icon={<FiBarChart2 className="text-green-400" />}
              title="Insightful Analytics"
              description="Make data-driven decisions with our comprehensive reports and dashboards."
            />
            <FeatureCard
              icon={<FiUsers className="text-green-400" />}
              title="Customer Management"
              description="Build lasting relationships by keeping track of customer preferences and order history."
            />
             <FeatureCard
              icon={<FiCheckCircle className="text-green-400" />}
              title="Supplier Management"
              description="Effortlessly manage your suppliers and purchase orders in one place."
            />
            <FeatureCard
              icon={<FiCheckCircle className="text-green-400" />}
              title="Multi-Location Support"
              description="Manage multiple stores from a single account and keep your inventory synchronized."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Trusted by Businesses Like Yours</h2>
          <p className="text-lg text-gray-400 mb-12">Here's what our happy customers are saying.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <Testimonial
              quote="GroceryTrackBD has been a game-changer for our business. Inventory management is now a breeze!"
              author="- S. Ahmed, Owner of Dhaka Daily Grocers"
            />
            <Testimonial
              quote="The analytics tools are incredibly powerful. We've increased our profits by 20% since we started using it."
              author="- Fatima Khan, Manager at Chittagong Fresh Mart"
            />
            <Testimonial
              quote="Simple, intuitive, and effective. The best grocery management software on the market."
              author="- R. Islam, Proprietor of Sylhet Super Shop"
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="py-20 bg-gradient-to-r from-green-500 to-blue-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8">Join hundreds of successful grocery businesses in Bangladesh.</p>
          <a href="/register" className="bg-white text-green-500 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105">
            Create Your Account Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} GroceryTrackBD. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;