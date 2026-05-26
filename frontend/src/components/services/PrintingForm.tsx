import React, { useState } from "react";
import { transactionService } from "../../services/transactionService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { PrintingTransaction } from "../../types";
import {
  calculatePrintingTotal,
  normalizePrintingQuantity,
} from "../../utils/transactionCalculations";

export const PrintingForm: React.FC = () => {
  const [formData, setFormData] = useState<PrintingTransaction>({
    serviceType: "Photocopy",
    paperSize: "Short",
    color: "Grayscale",
    baseAmount: 0,
    quantity: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await transactionService.createPrintingTransaction(formData);
      setSuccess(true);
      setFormData({
        serviceType: "Photocopy",
        paperSize: "Short",
        color: "Grayscale",
        baseAmount: 0,
        quantity: 1,
      });
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
      return updated;
    });
  };

  // Ensure quantity is always at least 1 and is a valid number
  const validQuantity = normalizePrintingQuantity(formData.quantity);
  const subtotal = calculatePrintingTotal(formData.baseAmount, validQuantity);
  const totalAmount = subtotal;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Printing Service
      </h1>

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

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Type
            </label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Service Type"
              required
            >
              <option value="Photocopy">Photocopy</option>
              <option value="Print">Print</option>
              <option value="Rush ID Picture">Rush ID Picture</option>
              <option value="Lamination">Lamination</option>
              <option value="Photoprint">Photoprint</option>
              <option value="Scanning">Scanning</option>
              <option value="Typing Job">Typing Job</option>
            </select>
          </div>

          {/* Paper Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paper Size
            </label>
            <div className="flex gap-4">
              {["Short", "Long"].map((size) => (
                <label key={size} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="paperSize"
                    value={size}
                    checked={formData.paperSize === size}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {size}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color Option
            </label>
            <div className="flex gap-4">
              {["Grayscale", "Colored"].map((colorOption) => (
                <label
                  key={colorOption}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="radio"
                    name="color"
                    value={colorOption}
                    checked={formData.color === colorOption}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {colorOption}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Base Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit Price (₱)
            </label>
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
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity <= 0 ? "" : formData.quantity}
              onChange={handleChange}
              placeholder="1"
              min="1"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total based on unit price and quantity
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              ₱{totalAmount.toFixed(2)}
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          >
            Create Transaction
          </Button>
        </form>
      </Card>
    </div>
  );
};
