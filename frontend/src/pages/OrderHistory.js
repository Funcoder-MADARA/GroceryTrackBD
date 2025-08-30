import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const columns = [
  { key: 'orderNumber', label: 'Order #' },
  { key: 'product', label: 'Product(s)' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date' },
];

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Previous orders only
  const defaultStatuses = 'delivered,cancelled,rejected,shipped';

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const params = { page, limit: 10, status: defaultStatuses };
        const res = await ordersAPI.getOrderHistory(params);
        const data = res.data;
        if (!isMounted) return;
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.response?.data?.message || e?.message || 'Failed to load orders');
        setOrders([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Minimal: only table with previous orders */}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No orders found.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="text-left font-medium px-4 py-3 border-b">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b font-mono">{o.orderNumber}</td>
                    <td className="px-4 py-3 border-b text-gray-700">
                      {Array.isArray(o.items) && o.items.length > 0
                        ? o.items.map((it) => it.productName).slice(0,3).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 border-b capitalize">{o.status}</td>
                    <td className="px-4 py-3 border-b">{o.createdAt ? format(new Date(o.createdAt), 'MMM dd, yyyy') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
