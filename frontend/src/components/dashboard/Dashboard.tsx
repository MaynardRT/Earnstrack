import React, { useEffect, useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Transaction, TransactionSummary } from "../../types";
import { Card, StatCard } from "../common/Card";
import { Alert } from "../common/Alert";
import { Modal } from "../common/Modal";
import { Skeleton } from "../common/Skeleton";
import { resolveApiAssetUrl } from "../../services/api";
import {
  Banknote,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  ArrowUpDown,
} from "lucide-react";

type SortKey =
  | "userFullName"
  | "transactionType"
  | "amount"
  | "serviceCharge"
  | "totalAmount"
  | "status"
  | "createdAt";

type SortDirection = "asc" | "desc";

const DashboardLoadingSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="text-center space-y-3">
              <div className="flex justify-center">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-28" />
              </div>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-28" />
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <th key={index} className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    {Array.from({ length: 8 }).map((_, columnIndex) => (
                      <td key={columnIndex} className="px-4 py-4">
                        <Skeleton className="h-4 w-full max-w-[9rem]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const DashboardSummarySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="text-center space-y-3">
            <div className="flex justify-center">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-28" />
          </Card>
        ))}
      </div>
    </div>
  );
};

const DashboardTransactionsSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: 8 }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 dark:border-gray-700"
              >
                {Array.from({ length: 8 }).map((_, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-4">
                    <Skeleton className="h-4 w-full max-w-[9rem]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [useEmbeddedScreenshotFallback, setUseEmbeddedScreenshotFallback] =
    useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    // Summary and table data are fetched together so the dashboard reflects one coherent snapshot per period change.
    const shouldUseInitialSkeleton = summary === null;

    if (shouldUseInitialSkeleton) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

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
      setIsRefreshing(false);
    }
  };

  if (loading) return <DashboardLoadingSkeleton />;

  const screenshotPreviewUrl = useEmbeddedScreenshotFallback
    ? resolveApiAssetUrl(selectedTransaction?.screenshotUrl)
    : selectedTransaction?.screenshotDataUrl ||
      resolveApiAssetUrl(selectedTransaction?.screenshotUrl);
  const screenshotFallbackUrl = selectedTransaction?.screenshotDataUrl || null;

  const handleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc",
      );
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "createdAt" ? "desc" : "asc");
  };

  const getComparableValue = (transaction: Transaction, key: SortKey) => {
    switch (key) {
      case "userFullName":
        return (transaction.userFullName || "Unknown user").toLowerCase();
      case "transactionType":
        return transaction.transactionType.toLowerCase();
      case "amount":
        return transaction.amount;
      case "serviceCharge":
        return transaction.serviceCharge;
      case "totalAmount":
        return transaction.totalAmount;
      case "status":
        return transaction.status.toLowerCase();
      case "createdAt":
        return new Date(transaction.createdAt).getTime();
    }
  };

  const sortedTransactions = [...transactions].sort((left, right) => {
    const leftValue = getComparableValue(left, sortKey);
    const rightValue = getComparableValue(right, sortKey);

    if (leftValue < rightValue) {
      return sortDirection === "asc" ? -1 : 1;
    }

    if (leftValue > rightValue) {
      return sortDirection === "asc" ? 1 : -1;
    }

    return 0;
  });

  const renderSortableHeader = (label: string, key: SortKey) => {
    const isActive = sortKey === key;
    const indicator = isActive ? (sortDirection === "asc" ? "↑" : "↓") : "";

    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        className="inline-flex items-center gap-2 font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
      >
        <span>{label}</span>
        {isActive ? (
          <span className="text-xs text-blue-600 dark:text-blue-300">
            {indicator}
          </span>
        ) : (
          <ArrowUpDown size={14} className="text-gray-400 dark:text-gray-500" />
        )}
      </button>
    );
  };

  const getSortColumnClassName = (key: SortKey) =>
    sortKey === key ? "bg-blue-50/70 dark:bg-blue-900/10" : "";

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {error && <Alert type="error" title="Error" message={error} />}

      {/* Earnings Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Earnings Summary
        </h2>

        {isRefreshing ? (
          <DashboardSummarySkeleton />
        ) : (
          <>
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
                    Total earnings: ₱
                    {summary.statusBreakdown.pendingTotal.toFixed(2)}
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
                    Total earnings: ₱
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
                    Total earnings: ₱
                    {summary.statusBreakdown.failedTotal.toFixed(2)}
                  </p>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Period Filter */}
        <div className="flex gap-2 mb-4 mt-6">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              disabled={isRefreshing}
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
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>

        {isRefreshing ? (
          <DashboardTransactionsSkeleton />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("userFullName")}`}
                    >
                      {renderSortableHeader("Recorded By", "userFullName")}
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("transactionType")}`}
                    >
                      {renderSortableHeader("Type", "transactionType")}
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("amount")}`}
                    >
                      {renderSortableHeader("Amount", "amount")}
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("serviceCharge")}`}
                    >
                      {renderSortableHeader("Service Charge", "serviceCharge")}
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("totalAmount")}`}
                    >
                      {renderSortableHeader("Total", "totalAmount")}
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("status")}`}
                    >
                      {renderSortableHeader("Status", "status")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Details
                    </th>
                    <th
                      className={`text-left py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("createdAt")}`}
                    >
                      {renderSortableHeader("Date & Time", "createdAt")}
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
                    sortedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td
                          className={`py-3 px-4 text-gray-900 dark:text-white ${getSortColumnClassName("userFullName")}`}
                        >
                          {transaction.userFullName || "Unknown user"}
                        </td>
                        <td
                          className={`py-3 px-4 ${getSortColumnClassName("transactionType")}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {transaction.transactionType === "EWallet" &&
                            transaction.method === "CashOut" ? (
                              <ArrowDownLeft
                                size={16}
                                className="text-blue-600"
                              />
                            ) : (
                              <ArrowUpRight
                                size={16}
                                className="text-green-600"
                              />
                            )}
                            {transaction.transactionType}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-gray-900 dark:text-white ${getSortColumnClassName("amount")}`}
                        >
                          ₱{transaction.amount.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 text-gray-900 dark:text-white ${getSortColumnClassName("serviceCharge")}`}
                        >
                          ₱{transaction.serviceCharge.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 font-semibold text-gray-900 dark:text-white ${getSortColumnClassName("totalAmount")}`}
                        >
                          ₱{transaction.totalAmount.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 ${getSortColumnClassName("status")}`}
                        >
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
                        <td
                          className={`py-3 px-4 text-gray-600 dark:text-gray-400 text-sm ${getSortColumnClassName("createdAt")}`}
                        >
                          <div className="flex flex-col leading-tight">
                            <span>
                              {new Date(
                                transaction.createdAt,
                              ).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(
                                transaction.createdAt,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
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
        )}
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
            ) : selectedTransaction.transactionType === "Printing" ? (
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
            ) : selectedTransaction.transactionType === "Products" ? (
              <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Product Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Item Name"
                    value={selectedTransaction.productName || "Unknown"}
                  />
                  <DetailItem
                    label="Price"
                    value={`₱${selectedTransaction.totalAmount.toFixed(2)}`}
                  />
                </div>
              </div>
            ) : selectedTransaction.transactionType === "ELoading" ? (
              <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  E-Loading Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Mobile Network"
                    value={selectedTransaction.eLoadingNetwork || "Unknown"}
                  />
                  <DetailItem
                    label="Phone Number"
                    value={selectedTransaction.eLoadingPhoneNumber || "Unknown"}
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
            ) : selectedTransaction.transactionType === "BillsPayment" ? (
              <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bills Payment Details
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Biller"
                    value={selectedTransaction.billerType || "Unknown"}
                  />
                  <DetailItem
                    label="Bill Amount"
                    value={`₱${selectedTransaction.amount.toFixed(2)}`}
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
            ) : null}
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
