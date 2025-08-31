import React, { useEffect, useMemo, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';

interface OrderItem {
  productName: string;
  quantity: number;
  unit: string;
}

interface SimpleOrder {
  companyName: string;
  createdAt: string;
  items: OrderItem[];
}

type CompanyGroups = Record<string, {
  products: Record<string, { totalQty: number; unit: string; lastOrderedAt: string }>
}>;

const ShopkeeperOrderedCatalogue: React.FC = () => {
  const [orders, setOrders] = useState<SimpleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await ordersAPI.getAllOrders({ limit: 200 });
        const list = (res.data.orders || []) as SimpleOrder[];
        setOrders(list);
      } catch (e) {
        console.error('Failed to load ordered catalogue', e);
        toast.error('Failed to load your ordered catalogue');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped: CompanyGroups = useMemo(() => {
    const map: CompanyGroups = {};
    for (const o of orders) {
      const cName = o.companyName || 'Unknown Company';
      map[cName] = map[cName] || { products: {} };
      for (const it of (o.items || [])) {
        const key = `${it.productName}`;
        if (!map[cName].products[key]) {
          map[cName].products[key] = { totalQty: 0, unit: it.unit || 'piece', lastOrderedAt: o.createdAt };
        }
        map[cName].products[key].totalQty += it.quantity || 0;
        // track most recent
        if (new Date(o.createdAt).getTime() > new Date(map[cName].products[key].lastOrderedAt).getTime()) {
          map[cName].products[key].lastOrderedAt = o.createdAt;
        }
      }
    }
    return map;
  }, [orders]);

  const companyNames = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalogue</h1>
          <p className="mt-1 text-sm text-gray-500">Products you have ordered, grouped by company</p>
        </div>
        <div className="mt-4 sm:mt-0 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or product..."
            className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {companyNames.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-100">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No past products</h3>
          <p className="mt-2 text-gray-500">Place some orders to see your catalogue here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {companyNames
            .filter(c => c.toLowerCase().includes(search.toLowerCase()) ||
                        Object.keys(grouped[c].products).some(p => p.toLowerCase().includes(search.toLowerCase())))
            .map((company) => {
            const products = grouped[company].products;
            const productNames = Object.keys(products).sort();
            return (
              <div key={company} className="bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">{company}</h2>
                  <p className="text-sm text-gray-500">Total products: {productNames.length}</p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productNames.map((p) => (
                    <div key={p} className="rounded-lg border border-gray-100 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{p}</div>
                          <div className="text-sm text-gray-500">Total ordered: {products[p].totalQty} {products[p].unit}</div>
                        </div>
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-400 mt-2">Last ordered: {new Date(products[p].lastOrderedAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopkeeperOrderedCatalogue;

