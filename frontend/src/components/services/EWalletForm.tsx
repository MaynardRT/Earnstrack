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

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        E-Wallet Transaction
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
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Provider
            </label>
            <div className="flex gap-4">
              {["GCash", "Maya"].map((provider) => (
                <label
                  key={provider}
                  className="flex items-center cursor-pointer"
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

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Method
            </label>
            <div className="flex gap-4">
              {["CashIn", "CashOut"].map((method) => (
                <label
                  key={method}
                  className="flex items-center cursor-pointer"
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

          {/* Amount Bracket */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount Bracket
            </label>
            <select
              name="amountBracket"
              value={formData.amountBracket}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Amount Bracket"
              required
            >
              <option value="">Select bracket</option>
              <option value="0-500">₱0 - ₱500</option>
              <option value="501-1500">₱501 - ₱1,500</option>
              <option value="1501-2500">₱1,501 - ₱2,500</option>
              <option value="2501-3000">₱2,501 - ₱3,000</option>
              <option value="3001-4000">₱3,001 - ₱4,000</option>
              <option value="4001-5000">₱4,001 - ₱5,000</option>
              <option value="5001+">
                ₱5,001+ (add ₱50 per ₱1,000 band above ₱3,000)
              </option>
            </select>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Service Fee Guide
            </p>
            <ul className="text-sm text-blue-900 dark:text-blue-200 space-y-1">
              <li>₱0 - ₱500: ₱5.00</li>
              <li>₱501 - ₱1,500: ₱10.00</li>
              <li>₱1,501 - ₱2,500: ₱15.00</li>
              <li>₱2,501 - ₱3,000: ₱20.00</li>
              <li>₱3,001 and up: add ₱50 per ₱1,000 band above ₱3,000</li>
            </ul>
          </div>

          {/* Reference Number */}
          <div>
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

          {/* Screenshot Upload */}
          <div>
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

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview:
                </p>
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="max-w-xs h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData((prev) => ({
                      ...prev,
                      screenshotBase64: undefined,
                    }));
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          {/* Base Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (₱)
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Service Charge (tiered): ₱{serviceCharge.toFixed(2)}
            </p>
          </div>

          {/* Total Amount */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Amount:
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
