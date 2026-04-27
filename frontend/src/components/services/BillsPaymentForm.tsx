import React, { useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { BillsPaymentTransaction } from "../../types";

const BILLERS = [
  "Meralco",
  "Maynilad",
  "Manila Water",
  "PLDT",
  "Converge",
  "Globe",
] as const;

const SERVICE_CHARGE = 25;

export const BillsPaymentForm: React.FC = () => {
  const [formData, setFormData] = useState<BillsPaymentTransaction>({
    billerType: "Meralco",
    billAmount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = formData.billAmount + SERVICE_CHARGE;

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
    if (formData.billAmount <= 0) {
      setError("Bill amount must be greater than zero");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await transactionService.createBillsPaymentTransaction(formData);
      setSuccess(true);
      setFormData({ billerType: "Meralco", billAmount: 0 });
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
        Bills Payment
      </h1>

      {success && (
        <Alert
          type="success"
          title="Success"
          message="Bills payment transaction created successfully!"
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
          {/* Biller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Biller
            </label>
            <select
              name="billerType"
              value={formData.billerType}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {BILLERS.map((biller) => (
                <option key={biller} value={biller}>
                  {biller}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bill Amount (₱)
            </label>
            <input
              type="number"
              name="billAmount"
              value={formData.billAmount || ""}
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
              <span>Bill Amount:</span>
              <span>₱{formData.billAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Service Charge:</span>
              <span>₱{SERVICE_CHARGE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-blue-200 dark:border-blue-700 pt-2">
              <span>Total:</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Processing..." : "Create Bills Payment Transaction"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
