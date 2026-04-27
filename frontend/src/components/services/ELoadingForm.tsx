import React, { useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { ELoadingTransaction } from "../../types";

const MOBILE_NETWORKS = [
  "Globe",
  "Smart",
  "Dito",
  "TnT",
  "TM",
  "Sun",
  "SurftoSawa",
] as const;

const getServiceCharge = (network: string) =>
  network === "SurftoSawa" ? 25 : 5;

export const ELoadingForm: React.FC = () => {
  const [formData, setFormData] = useState<ELoadingTransaction>({
    mobileNetwork: "Globe",
    phoneNumber: "",
    baseAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceCharge = getServiceCharge(formData.mobileNetwork);
  const totalAmount = formData.baseAmount + serviceCharge;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value === "" ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    if (formData.baseAmount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await transactionService.createELoadingTransaction(formData);
      setSuccess(true);
      setFormData({ mobileNetwork: "Globe", phoneNumber: "", baseAmount: 0 });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create transaction",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        E-Loading
      </h1>

      {success && (
        <Alert
          type="success"
          title="Success"
          message="E-Load transaction created successfully!"
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

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mobile Network */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mobile Network
            </label>
            <select
              name="mobileNetwork"
              value={formData.mobileNetwork}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {MOBILE_NETWORKS.map((network) => (
                <option key={network} value={network}>
                  {network}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g. 09171234567"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Load Amount (₱)
            </label>
            <input
              type="number"
              name="baseAmount"
              value={formData.baseAmount || ""}
              onChange={handleChange}
              disabled={isLoading}
              min="1"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Fee Summary */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-900/20 space-y-2 text-sm">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Load Amount:</span>
              <span>₱{formData.baseAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Service Charge:</span>
              <span>₱{serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-blue-200 dark:border-blue-700 pt-2">
              <span>Total:</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Processing..." : "Create E-Load Transaction"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
