import api from "./api";
import {
  Transaction,
  TransactionSummary,
  EWalletTransaction,
  PrintingTransaction,
} from "../types";

export const transactionService = {
  getSummary: async (): Promise<TransactionSummary> => {
    // Dashboard always opts into the shared summary view so every user reads from the same operational totals.
    const response = await api.get("/transactions/summary", {
      params: { includeStatusBreakdown: true, includeAllUsers: true },
    });
    return response.data;
  },

  getRecentTransactions: async (days: number = 30): Promise<Transaction[]> => {
    const response = await api.get("/transactions/recent", {
      params: { days, includeAllUsers: true },
    });
    return response.data;
  },

  getTransactionsByPeriod: async (
    period: "daily" | "weekly" | "monthly",
  ): Promise<Transaction[]> => {
    // Period filters stay server-driven so date window logic is owned in one place.
    const response = await api.get("/transactions/by-period", {
      params: { period, includeAllUsers: true },
    });
    return response.data;
  },

  createEWalletTransaction: async (
    data: EWalletTransaction,
  ): Promise<Transaction> => {
    const response = await api.post("/transactions/ewallet", data);
    return response.data;
  },

  createPrintingTransaction: async (
    data: PrintingTransaction,
  ): Promise<Transaction> => {
    const response = await api.post("/transactions/printing", data);
    return response.data;
  },

  exportTransactions: async (): Promise<Blob> => {
    const response = await api.get("/settings/export/transactions", {
      responseType: "blob",
    });
    return response.data;
  },
};
