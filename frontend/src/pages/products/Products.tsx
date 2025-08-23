import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Package, ShoppingCart } from 'lucide-react';

const Products: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products Management</h1>
          <p className="text-gray-600">Manage your product catalog and inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Company Representative Products */}
          {user?.role === 'company_rep' && (
            <Link
              to="/products"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Product Catalog</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your company's product catalog, update prices, and monitor inventory levels.
              </p>
              <div className="text-primary-600 font-medium">Manage Products →</div>
            </Link>
          )}

          {/* Shopkeeper Catalog */}
          {user?.role === 'shopkeeper' && (
            <Link
              to="/products/catalog"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Shopkeeper Catalog</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Browse products, manage inventory, and place orders efficiently with advanced filtering and search.
              </p>
              <div className="text-primary-600 font-medium">Browse & Order →</div>
            </Link>
          )}

          {/* Admin Products */}
          {user?.role === 'admin' && (
            <Link
              to="/products"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">System Products</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Administer all products across the system, manage categories, and monitor product performance.
              </p>
              <div className="text-primary-600 font-medium">Admin Products →</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;