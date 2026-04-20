import React, { useEffect, useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Transaction, TransactionSummary } from "../../types";
import { Card, StatCard } from "../common/Card";
import { Alert } from "../common/Alert";
import { Modal } from "../common/Modal";
import { resolveApiAssetUrl } from "../../services/api";
import {
  Banknote,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [useEmbeddedScreenshotFallback, setUseEmbeddedScreenshotFallback] =
    useState(false);

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

  const screenshotPreviewUrl = useEmbeddedScreenshotFallback
    ? selectedTransaction?.screenshotDataUrl || null
    : resolveApiAssetUrl(selectedTransaction?.screenshotUrl);
  const screenshotFallbackUrl = selectedTransaction?.screenshotDataUrl || null;

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
                    Details
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
                      colSpan={8}
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
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setUseEmbeddedScreenshotFallback(false);
                            setSelectedTransaction(transaction);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                          <Eye size={16} />
                          View details
                        </button>
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

      <Modal
        title="Transaction Details"
        isOpen={selectedTransaction !== null}
        onClose={() => {
          setUseEmbeddedScreenshotFallback(false);
          setSelectedTransaction(null);
        }}
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Recorded By"
                value={selectedTransaction.userFullName || "Unknown user"}
              />
              <DetailItem
                label="Transaction Type"
                value={selectedTransaction.transactionType}
              />
              <DetailItem
                label="Amount"
                value={`₱${selectedTransaction.amount.toFixed(2)}`}
              />
              <DetailItem
                label="Service Charge"
                value={`₱${selectedTransaction.serviceCharge.toFixed(2)}`}
              />
              <DetailItem
                label="Total"
                value={`₱${selectedTransaction.totalAmount.toFixed(2)}`}
              />
              <DetailItem label="Status" value={selectedTransaction.status} />
              <DetailItem
                label="Created At"
                value={new Date(selectedTransaction.createdAt).toLocaleString()}
              />
              <DetailItem
                label="Failure Reason"
                value={selectedTransaction.failureReason || "None"}
              />
            </div>

            {selectedTransaction.transactionType === "EWallet" ? (
              <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  E-Wallet Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Provider"
                    value={selectedTransaction.provider || "Unknown"}
                  />
                  <DetailItem
                    label="Method"
                    value={selectedTransaction.method || "Unknown"}
                  />
                  <DetailItem
                    label="Amount Bracket"
                    value={selectedTransaction.amountBracket || "None"}
                  />
                  <DetailItem
                    label="Reference Number"
                    value={selectedTransaction.referenceNumber || "None"}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Screenshot Reference
                  </p>
                  {screenshotPreviewUrl ? (
                    <div className="space-y-3">
                      <img
                        src={screenshotPreviewUrl}
                        alt="Transaction screenshot reference"
                        className="max-h-[28rem] w-full rounded-xl border border-gray-200 object-contain dark:border-gray-700"
                        onError={() => {
                          if (
                            screenshotFallbackUrl &&
                            !useEmbeddedScreenshotFallback
                          ) {
                            setUseEmbeddedScreenshotFallback(true);
                          }
                        }}
                      />
                      <a
                        href={screenshotPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                      >
                        Open screenshot in new tab
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No screenshot was attached to this transaction.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Printing Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Service Type"
                    value={selectedTransaction.printingServiceType || "Unknown"}
                  />
                  <DetailItem
                    label="Paper Size"
                    value={selectedTransaction.paperSize || "Unknown"}
                  />
                  <DetailItem
                    label="Color"
                    value={selectedTransaction.color || "Unknown"}
                  />
                  <DetailItem
                    label="Quantity"
                    value={`${selectedTransaction.quantity ?? 0}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

interface DetailItemProps {
  label: string;
  value: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/40">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
};
