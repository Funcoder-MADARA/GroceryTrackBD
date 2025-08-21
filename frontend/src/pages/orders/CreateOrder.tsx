import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, profileAPI, productsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { generateOrderPDF, OrderPDFData } from '../../utils/pdfGenerator';

interface Company {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  companyInfo?: {
    companyName: string;
  };
}

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  unitPrice?: number;
  price?: number; // Fallback for seed data
  unit: string;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  images: string[];
  inStock: boolean;
}

interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([{ productName: '', quantity: 1, unitPrice: 0, unit: 'piece' }]);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    deliveryArea: user?.area || '',
    deliveryAddress: user?.address || '',
    deliveryCity: user?.city || '',
    paymentMethod: 'cash_on_delivery',
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
      if (!selectedCompany) {
        setProducts([]);
        // Reset items when no company is selected
        setItems([{ productName: '', quantity: 1, unitPrice: 0, unit: 'piece' }]);
        return;
      }
      
      try {
        const response = await productsAPI.getProductsByCompany(selectedCompany, { inStock: 'true' });
        setProducts(response.data.products);
        // Reset items when company changes to clear any previously selected products
        setItems([{ productName: '', quantity: 1, unitPrice: 0, unit: 'piece' }]);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load company products');
      }
    };
    
    loadProducts();
  }, [selectedCompany]);

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p._id === productId);
    if (!selectedProduct) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      unitPrice: selectedProduct.unitPrice || selectedProduct.price || 0,
      unit: selectedProduct.unit,
      // Reset quantity to minimum order or 1
      quantity: Math.max(selectedProduct.minOrderQuantity || 1, 1)
    };
    setItems(newItems);
  };

  // Handle item changes (for manual fields like quantity)
  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 0, unit: 'piece' }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Stock validation function
  const validateStock = () => {
    const validationErrors: string[] = [];
    
    for (const item of items) {
      if (!item.productId || !item.productName) {
        validationErrors.push(`Please select a product for all order items`);
        continue;
      }
      
      const product = products.find(p => p._id === item.productId);
      if (!product) {
        validationErrors.push(`Product "${item.productName}" not found`);
        continue;
      }
      
      // Check if product is in stock
      if (!product.inStock) {
        validationErrors.push(`Product "${product.name}" is out of stock`);
        continue;
      }
      
      // Check if requested quantity exceeds available stock
      if (item.quantity > product.stockQuantity) {
        validationErrors.push(`Quantity for "${product.name}" (${item.quantity}) exceeds available stock (${product.stockQuantity})`);
        continue;
      }
      
      // Check minimum order quantity
      const minOrderQty = product.minOrderQuantity || 1;
      if (item.quantity < minOrderQty) {
        validationErrors.push(`Quantity for "${product.name}" (${item.quantity}) is below minimum order quantity (${minOrderQty})`);
        continue;
      }
      
      // Check maximum order quantity if defined
      if (product.maxOrderQuantity && item.quantity > product.maxOrderQuantity) {
        validationErrors.push(`Quantity for "${product.name}" (${item.quantity}) exceeds maximum order quantity (${product.maxOrderQuantity})`);
        continue;
      }
    }
    
    return validationErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate stock before submission
      const validationErrors = validateStock();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        setLoading(false);
        return;
      }

      const orderData = {
        companyId: selectedCompany,
        items,
        ...orderDetails
      };

      console.log('Submitting order data:', orderData); // Debug log
      const response = await ordersAPI.createOrder(orderData);
      
      // Generate PDF transcript
      const selectedCompanyData = companies.find(c => c._id === selectedCompany);
      const totals = calculateTotals();
      
      const pdfData: OrderPDFData = {
        orderNumber: response.data.order.orderNumber,
        createdAt: response.data.order.createdAt || new Date().toISOString(),
        status: response.data.order.status || 'pending',
        totalAmount: totals.final,
        shopkeeper: {
          name: user?.name || '',
          shopName: (user as any)?.shopName,
          email: user?.email,
          phone: (user as any)?.phone,
          area: (user as any)?.area,
          address: (user as any)?.address,
          city: (user as any)?.city
        },
        company: {
          name: selectedCompanyData?.name || '',
          companyName: selectedCompanyData?.companyInfo?.companyName,
          email: selectedCompanyData?.email,
          phone: selectedCompanyData?.phone
        },
        items: items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          totalPrice: item.quantity * item.unitPrice
        })),
        deliveryDetails: {
          deliveryArea: orderDetails.deliveryArea,
          deliveryAddress: orderDetails.deliveryAddress,
          deliveryCity: orderDetails.deliveryCity,
          paymentMethod: orderDetails.paymentMethod,
          preferredDeliveryDate: orderDetails.preferredDeliveryDate,
          deliveryInstructions: orderDetails.deliveryInstructions
        },
        pricing: {
          subtotal: totals.subtotal,
          tax: totals.tax,
          delivery: totals.delivery,
          total: totals.final
        }
      };
      
      // Generate and download PDF
      try {
        generateOrderPDF(pdfData);
        toast.success('Order created successfully! PDF transcript downloaded.');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        toast.success('Order created successfully! (PDF generation failed)');
      }
      
      navigate(`/orders/${response.data.order.orderNumber}`);
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totals = items.reduce((acc, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return {
        subtotal: acc.subtotal + itemTotal,
        items: acc.items + item.quantity
      };
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
              <option key={company._id} value={company._id}>
                {company.companyInfo?.companyName || company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Product *
                </label>
                {selectedCompany && products.length > 0 ? (
                  <select
                    value={item.productId || ''}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ৳{(product.unitPrice || product.price || 0).toFixed(2)}/{product.unit}
                        {product.stockQuantity <= 10 && ` (Low Stock: ${product.stockQuantity})`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full p-2 border rounded bg-gray-100 text-gray-500">
                    {!selectedCompany ? 'Please select a company first' : 'Loading products...'}
                  </div>
                )}
                {item.productName && (
                  <div className="mt-1 text-sm text-gray-600">
                    Selected: {item.productName} - ৳{item.unitPrice.toFixed(2)}/{item.unit}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  min={item.productId ? products.find(p => p._id === item.productId)?.minOrderQuantity || 1 : 1}
                  max={item.productId ? products.find(p => p._id === item.productId)?.maxOrderQuantity : undefined}
                  className="w-full p-2 border rounded"
                  required
                />
                {item.productId && (() => {
                  const product = products.find(p => p._id === item.productId);
                  return product && (
                    <div className="mt-1 text-xs text-gray-500">
                      Min: {product.minOrderQuantity || 1}
                      {product.maxOrderQuantity && `, Max: ${product.maxOrderQuantity}`}
                      {product.stockQuantity <= 10 && (
                        <span className="text-orange-600"> (Low Stock: {product.stockQuantity})</span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-end">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="md:col-span-4">
                <p className="text-sm text-gray-600">
                  Total for this item: ৳{(item.quantity * item.unitPrice).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
              <option value="cash_on_delivery">Cash on Delivery</option>
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
