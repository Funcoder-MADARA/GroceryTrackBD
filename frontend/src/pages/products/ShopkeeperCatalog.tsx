import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, Package, Star, MapPin } from 'lucide-react';
import { productsAPI, profileAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';

interface Product {
  _id: string;
  name: string;
  category: string;
  unitPrice: number;
  unit: string;
  stockQuantity: number;
  description?: string;
  companyID: string;
  companyName?: string;
  companyInfo?: {
    companyName: string;
    companyType: string;
  };
  imageUrl?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
}

interface Company {
  _id: string;
  name: string;
  companyInfo: {
    companyName: string;
    companyType: string;
  };
  area: string;
  city: string;
}

const ShopkeeperCatalog: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const companiesResponse = await profileAPI.getUsersByRole('company_rep');
      setCompanies(companiesResponse.data.users);

      // Load all products that are in stock
      const productsResponse = await productsAPI.getProducts({ inStock: 'true' });
      const productsData = productsResponse.data.products || [];
      
      // Enhance products with company information
      const enhancedProducts = productsData.map((product: any) => ({
        ...product,
        companyName: companiesResponse.data.users.find((c: any) => c._id === product.companyID)?.companyInfo?.companyName || 'Unknown Company'
      }));
      
      setProducts(enhancedProducts);

      // Extract unique categories
      const categorySet = new Set(productsData.map((p: any) => p.category).filter(Boolean) as string[]);
      const uniqueCategories = Array.from(categorySet) as string[];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Failed to load catalog data:', error);
      toast.error('Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesCompany = !selectedCompany || product.companyID === selectedCompany;
    
    return matchesSearch && matchesCategory && matchesCompany;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.unitPrice - b.unitPrice;
      case 'price_high':
        return b.unitPrice - a.unitPrice;
      case 'stock':
        return b.stockQuantity - a.stockQuantity;
      case 'company':
        return (a.companyName || '').localeCompare(b.companyName || '');
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleAddToCart = (product: Product) => {
    // This would typically integrate with a cart system
    toast.success(`${product.name} added to your order list!`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse products from companies in your area
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <MapPin className="w-4 h-4 mr-1" />
            {user?.area}, {user?.city}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Company Filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.companyInfo.companyName}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="stock">Stock Quantity</option>
            <option value="company">Company Name</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {sortedProducts.length} of {products.length} products
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map(product => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Product Image Placeholder */}
              <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-t-lg">
                <div className="flex items-center justify-center h-48">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              </div>

              <div className="p-4">
                {/* Product Name & Company */}
                <div className="mb-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.companyName}</p>
                </div>

                {/* Category */}
                {product.category && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mb-2">
                    {product.category}
                  </span>
                )}

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Price & Unit */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xl font-bold text-gray-900">৳{product.unitPrice}</span>
                    <span className="text-sm text-gray-500 ml-1">/{product.unit}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Stock: {product.stockQuantity}
                  </div>
                </div>

                {/* Availability Status */}
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    product.availability === 'in_stock' 
                      ? 'bg-green-100 text-green-800'
                      : product.availability === 'limited'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.availability === 'in_stock' && 'In Stock'}
                    {product.availability === 'limited' && 'Limited Stock'}
                    {product.availability === 'out_of_stock' && 'Out of Stock'}
                  </span>
                </div>

                {/* Order Constraints */}
                {(product.minOrderQuantity || product.maxOrderQuantity) && (
                  <div className="text-xs text-gray-500 mb-3">
                    {product.minOrderQuantity && `Min: ${product.minOrderQuantity}`}
                    {product.minOrderQuantity && product.maxOrderQuantity && ', '}
                    {product.maxOrderQuantity && `Max: ${product.maxOrderQuantity}`}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.availability === 'out_of_stock'}
                  className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md ${
                    product.availability === 'out_of_stock'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.availability === 'out_of_stock' ? 'Out of Stock' : 'Add to Order'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopkeeperCatalog;
