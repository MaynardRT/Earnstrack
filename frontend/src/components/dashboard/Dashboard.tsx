import React, { useEffect, useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Transaction, TransactionSummary } from "../../types";
import { Card, StatCard } from "../common/Card";
import { Alert } from "../common/Alert";
import {
  Banknote,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    // Summary and table data are fetched together so the dashboard reflects one coherent snapshot per period change.
    setLoading(true);
    setError(null);

    try {
      const [summaryData, transactionsData] = await Promise.all([
        transactionService.getSummary(),
        transactionService.getTransactionsByPeriod(period),
      ]);

      setSummary(summaryData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {error && <Alert type="error" title="Error" message={error} />}

      {/* Earnings Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Earnings Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatCard
            label="Daily"
            value={summary?.dailyTotal || 0}
            icon={<Banknote size={24} className="text-blue-600" />}
          />
          <StatCard
            label="Weekly"
            value={summary?.weeklyTotal || 0}
            icon={<TrendingUp size={24} className="text-green-600" />}
          />
          <StatCard
            label="Monthly"
            value={summary?.monthlyTotal || 0}
            icon={<Calendar size={24} className="text-purple-600" />}
          />
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-4">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {summary?.statusBreakdown && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status cards make non-completed work visible without forcing the operator into the raw table first. */}
            <Card>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Pending Transactions
              </p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {summary.statusBreakdown.pendingTransactions}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total amount: ₱{summary.statusBreakdown.pendingTotal.toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Completed Transactions
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {summary.statusBreakdown.completedTransactions}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total amount: ₱
                {summary.statusBreakdown.completedTotal.toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Failed Transactions
              </p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {summary.statusBreakdown.failedTransactions}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total amount: ₱{summary.statusBreakdown.failedTotal.toFixed(2)}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Recorded By
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Service Charge
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {transaction.userFullName || "Unknown user"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1">
                          {transaction.transactionType === "EWallet" ? (
                            <ArrowUpRight
                              size={16}
                              className="text-green-600"
                            />
                          ) : (
                            <ArrowDownLeft
                              size={16}
                              className="text-blue-600"
                            />
                          )}
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        ₱{transaction.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        ₱{transaction.serviceCharge.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        ₱{transaction.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium w-fit ${
                              transaction.status === "Completed"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                : transaction.status === "Pending"
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            }`}
                          >
                            {transaction.status}
                          </span>
                          {transaction.failureReason && (
                            <span className="text-xs text-red-600 dark:text-red-300 max-w-xs">
                              {transaction.failureReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        <div className="flex flex-col leading-tight">
                          <span>
                            {new Date(
                              transaction.createdAt,
                            ).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(transaction.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
