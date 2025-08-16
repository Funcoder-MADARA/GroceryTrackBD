import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Package, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalProducts: number;
    totalQuantityBought: number;
    totalQuantitySold: number;
    totalQuantityRemaining: number;
    avgLossPercentage: number;
    avgSellThroughRate: number;
    highRiskProducts: number;
    improvingProducts: number;
    decliningProducts: number;
  };
  riskAssessment: Array<{
    _id: string;
    count: number;
    products: string[];
    avgLossPercentage: number;
  }>;
  performance: {
    totalProducts: number;
    avgLossPercentage: number;
    avgSellThroughRate: number;
  };
}

interface PerformanceData {
  productName: string;
  productDescription: string;
  totalQuantityBought: number;
  totalQuantitySold: number;
  totalQuantityRemaining: number;
  avgLossPercentage: number;
  avgSellThroughRate: number;
  riskLevel: string;
  trendDirection: string;
}

interface AnalyticsDashboardProps {
  companyId: string;
  userRole: 'company_rep' | 'shopkeeper' | 'admin';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ companyId, userRole }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedMonths, setSelectedMonths] = useState(6);

  useEffect(() => {
    fetchAnalyticsData();
  }, [companyId, selectedPeriod, selectedMonths]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardData, performance] = await Promise.all([
        analyticsAPI.getCompanyDashboard(companyId),
        analyticsAPI.getCompanyPerformance(companyId, { period: selectedPeriod, limit: 20 })
      ]);

      setAnalyticsData(dashboardData.data);
      setPerformanceData(performance.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trendDirection: string) => {
    switch (trendDirection) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center text-gray-500 py-8">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Performance insights and loss analytics</p>
        </div>
        
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
          
          <select
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.summary.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Loss %</p>
              <p className="text-2xl font-bold text-red-600">
                {analyticsData.summary.avgLossPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sell-through Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.summary.avgSellThroughRate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Risk Products</p>
              <p className="text-2xl font-bold text-orange-600">
                {analyticsData.summary.highRiskProducts}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Quantity Bought</span>
              <span className="font-semibold">{analyticsData.summary.totalQuantityBought.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Quantity Sold</span>
              <span className="font-semibold text-green-600">{analyticsData.summary.totalQuantitySold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quantity Remaining</span>
              <span className="font-semibold text-orange-600">{analyticsData.summary.totalQuantityRemaining.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Improving Products</span>
              <span className="font-semibold text-green-600">{analyticsData.summary.improvingProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Stable Products</span>
              <span className="font-semibold text-blue-600">
                {analyticsData.summary.totalProducts - analyticsData.summary.improvingProducts - analyticsData.summary.decliningProducts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Declining Products</span>
              <span className="font-semibold text-red-600">{analyticsData.summary.decliningProducts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {analyticsData.riskAssessment.map((risk) => (
            <div key={risk._id} className="text-center p-4 rounded-lg border">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getRiskLevelColor(risk._id)}`}>
                {risk._id.charAt(0).toUpperCase() + risk._id.slice(1)} Risk
              </div>
              <div className="text-2xl font-bold text-gray-900">{risk.count}</div>
              <div className="text-sm text-gray-600">Products</div>
              <div className="text-sm text-gray-500 mt-1">
                Avg Loss: {risk.avgLossPercentage.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loss %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sell-through
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceData.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                      <div className="text-sm text-gray-500">{product.productDescription}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>Bought: {product.totalQuantityBought}</div>
                    <div>Sold: {product.totalQuantitySold}</div>
                    <div>Remaining: {product.totalQuantityRemaining}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      product.avgLossPercentage > 60 ? 'text-red-600' :
                      product.avgLossPercentage > 30 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {product.avgLossPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.avgSellThroughRate.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(product.riskLevel)}`}>
                      {product.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTrendIcon(product.trendDirection)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchAnalyticsData}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
