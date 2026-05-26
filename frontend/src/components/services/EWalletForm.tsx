import React, { useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { EWalletTransaction } from "../../types";
import {
  calculateEWalletServiceCharge,
  calculateEWalletTotal,
  getEWalletAmountBracket,
} from "../../utils/transactionCalculations";

const EWALLET_BRACKETS = Array.from({ length: 20 }, (_, index) => {
  const min = index * 500 + 1;
  const max = min + 499;
  const fee = (index + 1) * 5;

  return {
    value: `${min}-${max}`,
    label: `P${min.toLocaleString()} - P${max.toLocaleString()}`,
    fee,
  };
});

export const EWalletForm: React.FC = () => {
  const [formData, setFormData] = useState<EWalletTransaction>({
    provider: "GCash",
    method: "CashIn",
    amountBracket: "",
    referenceNumber: "",
    baseAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await transactionService.createEWalletTransaction(formData);
      setSuccess(true);
      setFormData({
        provider: "GCash",
        method: "CashIn",
        amountBracket: "",
        referenceNumber: "",
        baseAmount: 0,
      });
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "number" ? (value === "" ? 0 : parseFloat(value)) : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Auto-update bracket if baseAmount changes
      if (name === "baseAmount") {
        updated.amountBracket = getEWalletAmountBracket(newValue as number);
      }
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          screenshotBase64: base64String,
        }));
        setImagePreview(base64String);
        setError(null);
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const serviceCharge = calculateEWalletServiceCharge(formData.baseAmount);
  const totalAmount = calculateEWalletTotal(formData.baseAmount);
  const activeBracketValue = getEWalletAmountBracket(formData.baseAmount);
  const showsOverflowFee = formData.baseAmount > 20000;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          E-Wallet Transaction
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Fill in the transaction details on the left and review the fee
          breakdown on the right.
        </p>
      </div>

      {success && (
        <Alert
          type="success"
          title="Success"
          message="Transaction created successfully!"
        />
      )}
      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <Card className="overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Provider
                </label>
                <div className="flex flex-wrap gap-4">
                  {["GCash", "Maya"].map((provider) => (
                    <label
                      key={provider}
                      className="flex items-center cursor-pointer rounded-full border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <input
                        type="radio"
                        name="provider"
                        value={provider}
                        checked={formData.provider === provider}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {provider}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Method
                </label>
                <div className="flex flex-wrap gap-4">
                  {["CashIn", "CashOut"].map((method) => (
                    <label
                      key={method}
                      className="flex items-center cursor-pointer rounded-full border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <input
                        type="radio"
                        name="method"
                        value={method}
                        checked={formData.method === method}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (₱)
                  </label>
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                    {activeBracketValue || "Select an amount"}
                  </span>
                </div>
                <input
                  type="number"
                  name="baseAmount"
                  value={formData.baseAmount === 0 ? "" : formData.baseAmount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Supported amount range: P1.00 and above. Amounts above P20,000
                  use the overflow fee rule.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receipt/Screenshot (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer hover:file:bg-blue-600"
                  aria-label="Upload receipt screenshot"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max file size: 5MB (JPG, PNG, GIF)
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Current fee tier
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {activeBracketValue || "No amount selected"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Service charge
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    ₱{serviceCharge.toFixed(2)}
                  </p>
                </div>
              </div>
              {showsOverflowFee && (
                <p className="mt-3 text-sm text-blue-800 dark:text-blue-100">
                  Overflow fee applied:{" "}
                  <span className="font-semibold">₱355.00</span>
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total amount
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ₱{totalAmount.toFixed(2)}
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                >
                  Create Transaction
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="mb-3">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Service fee matrix
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  The current amount highlights the applicable tier.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-blue-200 dark:border-blue-700">
                <table className="min-w-full text-sm text-blue-900 dark:text-blue-200">
                  <thead className="bg-blue-100 dark:bg-blue-900/60">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Range
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200 dark:divide-blue-800">
                    {EWALLET_BRACKETS.map((bracket) => (
                      <tr
                        key={bracket.value}
                        className={
                          bracket.value === activeBracketValue
                            ? "bg-blue-200/70 font-semibold dark:bg-blue-800/60"
                            : ""
                        }
                      >
                        <td className="px-3 py-2">{bracket.label}</td>
                        <td className="px-3 py-2 text-right">
                          ₱{bracket.fee.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {imagePreview && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/60">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Receipt preview
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData((prev) => ({
                        ...prev,
                        screenshotBase64: undefined,
                      }));
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
