import api from "./api";

export interface DailySalesData {
  date: string;
  sales: number;
  count: number;
}

export interface ServiceSalesData {
  name: string;
  value: number;
  count: number;
}

export const reportsService = {
  // Get sales data grouped by day
  getDailySales: async (days: number = 30): Promise<DailySalesData[]> => {
    const response = await api.get(`/reports/daily-sales?days=${days}`);
    return response.data;
  },

  // Get sales data grouped by service type
  getServiceSales: async (): Promise<ServiceSalesData[]> => {
    const response = await api.get("/reports/service-sales");
    return response.data;
  },

  // Get combined analytics
  getAnalytics: async (days: number = 30) => {
    const [dailySales, serviceSales] = await Promise.all([
      reportsService.getDailySales(days),
      reportsService.getServiceSales(),
    ]);
    return { dailySales, serviceSales };
  },
};
