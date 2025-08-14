import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, profileAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  companyInfo: {
    companyName: string;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  stockQuantity: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  notes?: string;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    deliveryArea: user?.area || '',
    deliveryAddress: user?.address || '',
    deliveryCity: user?.city || '',
    paymentMethod: 'cash',
    preferredDeliveryDate: '',
    deliveryInstructions: '',
    notes: ''
  });

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await profileAPI.getUsersByRole('company_rep');
        setCompanies(response.data.users);
      } catch (error) {
        toast.error('Failed to load companies');
      }
    };
    loadCompanies();
  }, []);

  // Load products when company is selected
  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedCompany) return;
      try {
        const response = await ordersAPI.getCompanyProducts(selectedCompany);
        setProducts(response.data.products);
      } catch (error) {
        toast.error('Failed to load products');
      }
    };
    if (selectedCompany) {
      loadProducts();
    }
  }, [selectedCompany]);

  // Handle item changes
  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        companyId: selectedCompany,
        items,
        ...orderDetails
      };

      const response = await ordersAPI.createOrder(orderData);
      toast.success('Order created successfully!');
      navigate(`/orders/${response.data.order.orderNumber}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totals = items.reduce((acc, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        return {
          subtotal: acc.subtotal + itemTotal,
          items: acc.items + item.quantity
        };
      }
      return acc;
    }, { subtotal: 0, items: 0 });

    const tax = totals.subtotal * 0.05;
    const delivery = 50;
    const final = totals.subtotal + tax + delivery;

    return { ...totals, tax, delivery, final };
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Order</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select Company</h2>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyInfo.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 mb-4">
              <select
                value={item.productId}
                onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                className="flex-1 p-2 border rounded"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.price}৳/{product.unit}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                min="1"
                className="w-32 p-2 border rounded"
                required
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            Add Item
          </button>
        </div>

        {/* Delivery Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={orderDetails.deliveryArea}
              onChange={(e) => setOrderDetails({ ...orderDetails, deliveryArea: e.target.value })}
              placeholder="Delivery Area"
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              value={orderDetails.deliveryAddress}
              onChange={(e) => setOrderDetails({ ...orderDetails, deliveryAddress: e.target.value })}
              placeholder="Delivery Address"
              className="p-2 border rounded"
              required
            />
            <input
              type="text"
              value={orderDetails.deliveryCity}
              onChange={(e) => setOrderDetails({ ...orderDetails, deliveryCity: e.target.value })}
              placeholder="City"
              className="p-2 border rounded"
              required
            />
            <select
              value={orderDetails.paymentMethod}
              onChange={(e) => setOrderDetails({ ...orderDetails, paymentMethod: e.target.value })}
              className="p-2 border rounded"
              required
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_banking">Mobile Banking</option>
            </select>
            <input
              type="date"
              value={orderDetails.preferredDeliveryDate}
              onChange={(e) => setOrderDetails({ ...orderDetails, preferredDeliveryDate: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <textarea
              value={orderDetails.deliveryInstructions}
              onChange={(e) => setOrderDetails({ ...orderDetails, deliveryInstructions: e.target.value })}
              placeholder="Delivery Instructions"
              className="p-2 border rounded"
              rows={3}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span>{totals.items}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>৳{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%):</span>
              <span>৳{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span>৳{totals.delivery.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Final Amount:</span>
              <span>৳{totals.final.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrder;
