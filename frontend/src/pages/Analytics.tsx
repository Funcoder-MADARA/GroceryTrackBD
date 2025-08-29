import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import toast from 'react-hot-toast';

interface ShopkeeperAnalytics {
  totalFlags: number;
  summary: {
    totalQuantityBought: number;
    totalQuantitySold: number;
    totalQuantityRemaining: number;
    avgLossPercentage: number;
  };
  companies: Array<{
    company: string;
    totalQuantityBought: number;
    totalQuantitySold: number;
    totalQuantityRemaining: number;
  }>;
}

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [shopkeeperData, setShopkeeperData] = useState<ShopkeeperAnalytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'shopkeeper') {
        const response = await analyticsAPI.getShopkeeperAnalytics(user._id, {
          period: 'monthly',
          months: getMonthsFromRange(dateRange)
        });
        setShopkeeperData(response.data);
      }
      
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const getMonthsFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 1;
      case '30d': return 1;
      case '3m': return 3;
      case '6m': return 6;
      case '1y': return 12;
      default: return 1;
    }
  };

  const exportData = () => {
    toast('Export feature coming soon', {
      icon: '📄',
    });
  };

  const renderShopkeeperAnalytics = () => {
    if (!shopkeeperData) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Flags</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shopkeeperData.totalFlags}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Quantity Bought</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shopkeeperData.summary.totalQuantityBought?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Quantity Sold</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shopkeeperData.summary.totalQuantitySold?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Loss %</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shopkeeperData.summary.avgLossPercentage?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Performance */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance by Company</h3>
          </div>
          <div className="p-6">
            {shopkeeperData.companies && shopkeeperData.companies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Bought
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loss %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shopkeeperData.companies.map((company, index) => {
                      const lossPercentage = company.totalQuantityBought > 0 
                        ? ((company.totalQuantityBought - company.totalQuantitySold) / company.totalQuantityBought) * 100 
                        : 0;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {company.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.totalQuantityBought?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.totalQuantitySold?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company.totalQuantityRemaining?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              lossPercentage > 20 ? 'bg-red-100 text-red-800' :
                              lossPercentage > 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {lossPercentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-sm text-gray-500">Start flagging products to see analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'shopkeeper' 
              ? 'Track your inventory performance and losses'
              : user?.role === 'company_rep'
              ? 'Monitor your product performance and market insights'
              : 'Overview of system-wide analytics and trends'
            }
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="6m">Last 6 months</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Company Analytics Dashboard (for company_rep) */}
          {user?.role === 'company_rep' && user._id && (
            <AnalyticsDashboard companyId={user._id} userRole="company_rep" />
          )}

          {/* Shopkeeper Analytics */}
          {user?.role === 'shopkeeper' && renderShopkeeperAnalytics()}

          {/* Admin System Analytics */}
          {user?.role === 'admin' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">-</div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">-</div>
                  <div className="text-sm text-gray-500">Active Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">-</div>
                  <div className="text-sm text-gray-500">System Alerts</div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                Detailed system analytics coming soon
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
