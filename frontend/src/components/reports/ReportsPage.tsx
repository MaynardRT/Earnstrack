import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  reportsService,
  DailySalesData,
  ServiceSalesData,
} from "../../services/reportsService";
import { Card } from "../common/Card";

const COLORS = {
  EWallet: "#3B82F6",
  Printing: "#10B981",
  ELoading: "#F59E0B",
  BillsPayment: "#EF4444",
  Products: "#8B5CF6",
};

export const ReportsPage: React.FC = () => {
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [serviceSales, setServiceSales] = useState<ServiceSalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRange, setDaysRange] = useState(30);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await reportsService.getAnalytics(daysRange);
        setDailySales(data.dailySales);
        setServiceSales(data.serviceSales);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError("Failed to load reports. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [daysRange]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your transaction analytics and performance metrics
          </p>
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range:
            </label>
            <select
              value={daysRange}
              onChange={(e) => setDaysRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading reports...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Bar Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Sales by Day
              </h2>
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6B7280"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                        color: "#F3F4F6",
                      }}
                      formatter={(value: number) =>
                        `₱${Number(value).toFixed(2)}`
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="sales"
                      fill="#3B82F6"
                      name="Sales Amount"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </Card>

            {/* Service Sales Pie Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Sales by Service Type
              </h2>
              {serviceSales.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceSales}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) =>
                        `${entry.name}: ₱${Number(entry.value).toFixed(0)}`
                      }
                    >
                      {serviceSales.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={
                            COLORS[entry.name as keyof typeof COLORS] ||
                            "#9CA3AF"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `₱${Number(value).toFixed(2)}`
                      }
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                        color: "#F3F4F6",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Days
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dailySales.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Service Types
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {serviceSales.length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Sales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₱
                {(
                  serviceSales.reduce((sum, item) => sum + item.value, 0) || 0
                ).toFixed(2)}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
