import React, { useState } from 'react';
import { productsAPI } from '../services/api';
import { X, TrendingUp, TrendingDown, Package } from 'lucide-react';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: {
    _id: string;
    name: string;
    currentStock: number;
    unit: string;
  } | null;
}

interface StockUpdateData {
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({ isOpen, onClose, onSuccess, product }) => {
  const [stockData, setStockData] = useState<StockUpdateData>({
    quantity: 0,
    operation: 'add'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setLoading(true);
    try {
      await productsAPI.updateStock(product._id, stockData.quantity, stockData.operation);
      onSuccess();
      onClose();
      setStockData({ quantity: 0, operation: 'add' });
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNewStockValue = () => {
    if (!product) return 0;
    
    switch (stockData.operation) {
      case 'add':
        return product.currentStock + stockData.quantity;
      case 'subtract':
        return Math.max(0, product.currentStock - stockData.quantity);
      case 'set':
        return stockData.quantity;
      default:
        return product.currentStock;
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary-600" />
              Update Stock
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Stock:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {product.currentStock} {product.unit}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStockData({ ...stockData, operation: 'add' })}
                  className={`p-3 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center ${
                    stockData.operation === 'add'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TrendingUp className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockData({ ...stockData, operation: 'subtract' })}
                  className={`p-3 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center ${
                    stockData.operation === 'subtract'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TrendingDown className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Subtract</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockData({ ...stockData, operation: 'set' })}
                  className={`p-3 rounded-lg border-2 transition-colors duration-200 flex flex-col items-center ${
                    stockData.operation === 'set'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Package className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Set</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity ({product.unit})
              </label>
              <input
                type="number"
                required
                min="0"
                value={stockData.quantity}
                onChange={(e) => setStockData({ ...stockData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter quantity"
              />
            </div>

            {stockData.operation !== 'set' && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">New Stock:</span>
                  <span className="text-lg font-semibold text-blue-900">
                    {getNewStockValue()} {product.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Stock'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockUpdateModal;