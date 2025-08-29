import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Package, 
  BarChart3, 
  Shield, 
  Truck, 
  Bell,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Globe,
  Zap,
  Heart,
  Award
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode; 
  title: string;
  description: string;
  delay?: string;
}

interface StatCardProps {
  number: string;
  label: string;
  delay?: string;
}

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = "0ms" }) => (
  <div 
    className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100"
    style={{ animationDelay: delay }}
  >
    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const StatCard: React.FC<StatCardProps> = ({ number, label, delay = "0ms" }) => (
  <div 
    className="text-center animate-fade-in-up"
    style={{ animationDelay: delay }}
  >
    <div className="text-4xl md:text-5xl font-bold text-white mb-2">{number}</div>
    <div className="text-emerald-100 text-lg">{label}</div>
  </div>
);

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, company, avatar, content, rating }) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
    <p className="text-gray-700 mb-6 leading-relaxed">"{content}"</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
        {avatar}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-gray-600 text-sm">{role} at {company}</div>
      </div>
    </div>
  </div>
);

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Package className="h-8 w-8 text-white" />,
      title: "Smart Inventory Management",
      description: "Real-time stock tracking with automated alerts and predictive analytics to prevent stockouts."
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-white" />,
      title: "Seamless Order Processing",
      description: "Streamlined order management from placement to delivery with automated workflow optimization."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-white" />,
      title: "Advanced Analytics",
      description: "Comprehensive business insights with AI-powered recommendations for growth optimization."
    },
    {
      icon: <Truck className="h-8 w-8 text-white" />,
      title: "Delivery Management",
      description: "End-to-end delivery tracking with route optimization and real-time status updates."
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Multi-Role Access",
      description: "Role-based dashboards for shopkeepers, suppliers, delivery partners, and administrators."
    },
    {
      icon: <Bell className="h-8 w-8 text-white" />,
      title: "Smart Notifications",
      description: "Intelligent alerts and notifications to keep all stakeholders informed in real-time."
    }
  ];

  const stats = [
    { number: "500+", label: "Active Stores" },
    { number: "50K+", label: "Orders Processed" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const testimonials = [
    {
      name: "Ahmed Rahman",
      role: "Owner",
      company: "Dhaka Fresh Mart",
      avatar: "AR",
      content: "GroceryTrackBD transformed our business completely. Our inventory management is now effortless and our profits have increased by 35%.",
      rating: 5
    },
    {
      name: "Fatima Begum",
      role: "Manager",
      company: "Chittagong Grocery Hub",
      avatar: "FB",
      content: "The analytics dashboard gives us insights we never had before. We can now predict demand and optimize our stock levels perfectly.",
      rating: 5
    },
    {
      name: "Mohammad Islam",
      role: "CEO",
      company: "Sylhet Super Chain",
      avatar: "MI",
      content: "Outstanding platform! The delivery management system has reduced our delivery times by 40% and improved customer satisfaction.",
      rating: 5
    }
  ];

  const handleGetStarted = (role: string) => {
    navigate('/register', { state: { selectedRole: role } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              GroceryTrackBD
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors">Features</a>
              <a href="#analytics" className="text-gray-700 hover:text-emerald-600 transition-colors">Analytics</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition-colors">Reviews</a>
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-emerald-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
          </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fade-in-up">
              Revolutionize Your
              <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Grocery Business
              </span>
          </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              The most advanced grocery supply chain management platform in Bangladesh. 
              Streamline operations, boost profits, and scale your business with AI-powered insights.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <button
                onClick={() => handleGetStarted('shopkeeper')}
                className="group bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group flex items-center text-gray-700 hover:text-emerald-600 transition-colors">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md mr-3 group-hover:shadow-lg transition-shadow">
                  <Play className="h-5 w-5 text-emerald-600" />
            </div>
                Watch Demo
              </button>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 text-white animate-fade-in-up" style={{ animationDelay: "600ms" }}>
              {stats.map((stat, index) => (
                <StatCard
                  key={index}
                  number={stat.number}
                  label={stat.label}
                  delay={`${800 + index * 100}ms`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for
              <span className="block text-emerald-600">Modern Businesses</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage, scale, and optimize your grocery business in one comprehensive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
            <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={`${index * 100}ms`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Access Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Every Role
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Customized dashboards and features for different stakeholders in your supply chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                role: 'Shopkeeper',
                icon: <ShoppingCart className="h-8 w-8 text-white" />,
                features: ['Inventory Management', 'Order Processing', 'Sales Analytics', 'Customer Insights'],
                color: 'from-emerald-500 to-emerald-600'
              },
              {
                role: 'Company Rep',
                icon: <BarChart3 className="h-8 w-8 text-white" />,
                features: ['Product Management', 'Order Approval', 'Supply Analytics', 'Performance Reports'],
                color: 'from-blue-500 to-blue-600'
              },
              {
                role: 'Delivery Worker',
                icon: <Truck className="h-8 w-8 text-white" />,
                features: ['Route Optimization', 'Delivery Tracking', 'Status Updates', 'Issue Reporting'],
                color: 'from-purple-500 to-purple-600'
              },
              {
                role: 'Administrator',
                icon: <Shield className="h-8 w-8 text-white" />,
                features: ['User Management', 'System Analytics', 'Security Controls', 'Platform Monitoring'],
                color: 'from-orange-500 to-orange-600'
              }
            ].map((roleCard, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className={`w-16 h-16 bg-gradient-to-r ${roleCard.color} rounded-xl flex items-center justify-center mb-4`}>
                  {roleCard.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{roleCard.role}</h3>
                <ul className="space-y-2">
                  {roleCard.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleGetStarted(roleCard.role.toLowerCase().replace(' ', '_'))}
                  className={`w-full mt-6 bg-gradient-to-r ${roleCard.color} text-white py-2 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                >
                  Get Started as {roleCard.role}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Preview */}
      <section id="analytics" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Data-Driven
                <span className="block text-emerald-600">Decisions</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Make informed decisions with comprehensive analytics and real-time insights into your business performance.
              </p>
              <div className="space-y-4">
                {[
                  { icon: <TrendingUp className="h-6 w-6 text-emerald-600" />, text: "Sales trends and forecasting" },
                  { icon: <BarChart3 className="h-6 w-6 text-emerald-600" />, text: "Inventory optimization insights" },
                  { icon: <Globe className="h-6 w-6 text-emerald-600" />, text: "Area-based demand analysis" },
                  { icon: <Zap className="h-6 w-6 text-emerald-600" />, text: "Real-time performance metrics" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    {item.icon}
                    <span className="ml-3 text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8">
                                              <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
                    <span className="text-emerald-600 text-sm font-medium">+24.5%</span>
                  </div>
                  <div className="h-32 bg-gradient-to-r from-emerald-200 to-blue-200 rounded-lg flex items-end justify-center">
                    <div className="text-2xl font-bold text-gray-700">৳2,45,000</div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Business Owners
              <span className="block text-emerald-600">Across Bangladesh</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join hundreds of successful grocery businesses who have transformed their operations with GroceryTrackBD.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-emerald-100 mb-12">
            Join the grocery revolution. Start your free trial today and see the difference in 30 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-emerald-600 transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
                GroceryTrackBD
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The leading grocery supply chain management platform in Bangladesh. 
                Empowering businesses with technology-driven solutions.
              </p>
              <div className="flex space-x-4">
                {[
                  { icon: <Heart className="h-5 w-5" />, label: "Made with love in Bangladesh" },
                  { icon: <Award className="h-5 w-5" />, label: "Award-winning platform" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center text-gray-400 text-sm">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#analytics" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} GroceryTrackBD. All rights reserved. Built for Bangladesh's grocery ecosystem.</p>
          </div>
        </div>
      </footer>


    </div>
  );
};

export default Homepage;