import React, { useEffect, useState } from "react";
import { settingsService } from "../../services/settingsService";
import { transactionService } from "../../services/transactionService";
import { ServiceFee, User, Product, CreateProductDto } from "../../types";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { Skeleton } from "../common/Skeleton";
import { Download } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { UserAvatar } from "../common/UserAvatar";

type FeeEditorForm = {
  serviceType: string;
  providerType: string;
  methodType: string;
  feeMode: "flat" | "percentage";
  feeValue: string;
  bracketMinAmount: string;
  bracketMaxAmount: string;
};

const KNOWN_SERVICE_TYPES = [
  "EWallet",
  "Printing",
  "ELoading",
  "BillsPayment",
] as const;
const KNOWN_EWALLET_PROVIDERS = ["GCash", "Maya"] as const;
const KNOWN_EWALLET_METHODS = ["CashIn", "CashOut"] as const;
const KNOWN_PRINTING_TYPES = ["Printing", "Scanning", "Photocopy"] as const;

const getKnownOptions = (currentValue: string, options: readonly string[]) => {
  if (!currentValue || options.includes(currentValue)) {
    return [...options];
  }

  return [currentValue, ...options];
};

const SettingsTableSkeleton: React.FC<{ columns: number; rows: number }> = ({
  columns,
  rows,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 dark:border-gray-700"
            >
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="px-4 py-4">
                  <Skeleton className="h-4 w-full max-w-[12rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [serviceFees, setServiceFees] = useState<ServiceFee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<
    "appearance" | "fees" | "users" | "products"
  >("appearance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductForm, setNewProductForm] = useState<CreateProductDto>({
    name: "",
    price: 0,
    stockCount: 0,
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState<{
    price: number;
    stockCount: number;
    isActive: boolean;
  } | null>(null);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );

  // User creation form state
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "Seller" as "Admin" | "Seller",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [savingFeeId, setSavingFeeId] = useState<string | null>(null);
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [isCreatingFee, setIsCreatingFee] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [feeEditorForm, setFeeEditorForm] = useState<FeeEditorForm | null>(
    null,
  );
  const isServiceFeeMutating =
    savingFeeId !== null || isCreatingFee || deletingFeeId !== null;

  const serviceFeeGroups = Array.from(
    serviceFees.reduce((groups, fee) => {
      const groupKey = fee.serviceType || "Other";
      const groupFees = groups.get(groupKey) ?? [];
      groupFees.push(fee);
      groups.set(groupKey, groupFees);
      return groups;
    }, new Map<string, ServiceFee[]>()),
  ).sort(([left], [right]) => {
    const leftIndex = KNOWN_SERVICE_TYPES.indexOf(
      left as (typeof KNOWN_SERVICE_TYPES)[number],
    );
    const rightIndex = KNOWN_SERVICE_TYPES.indexOf(
      right as (typeof KNOWN_SERVICE_TYPES)[number],
    );

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });

  const serviceFeeSections: Array<[string, ServiceFee[]]> = [
    ...serviceFeeGroups,
    ...(isAddingFee &&
    feeEditorForm &&
    !serviceFeeGroups.some(
      ([serviceType]) => serviceType === feeEditorForm.serviceType,
    )
      ? [
          [feeEditorForm.serviceType || "New Rule", []] as [
            string,
            ServiceFee[],
          ],
        ]
      : []),
  ];

  useEffect(() => {
    if (activeTab === "fees") loadServiceFees();
    if (activeTab === "users" && user?.role === "Admin") loadUsers();
    if (activeTab === "products" && user?.role === "Admin") loadProducts();
  }, [activeTab, user?.role]);

  const loadServiceFees = async () => {
    setLoading(true);
    try {
      const fees = await settingsService.getServiceFees();
      setServiceFees(fees);
    } catch (err) {
      setError("Failed to load service fees");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await settingsService.getUsers();
      setUsers(allUsers);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await settingsService.getProducts();
      setProducts(allProducts);
    } catch (err) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newUserForm.email ||
      !newUserForm.fullName ||
      !newUserForm.password ||
      !newUserForm.role
    ) {
      setError("Please fill in all fields");
      return;
    }

    setCreatingUser(true);
    try {
      await settingsService.createUser(
        newUserForm.email,
        newUserForm.fullName,
        newUserForm.password,
        newUserForm.role,
      );
      setSuccess("User created successfully!");
      setNewUserForm({ email: "", fullName: "", password: "", role: "Seller" });
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleExportTransactions = async () => {
    try {
      const blob = await transactionService.exportTransactions();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      setSuccess("Transactions exported successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to export transactions");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await settingsService.updateUser(userId, { isActive: !isActive });
      loadUsers();
      setSuccess("User status updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update user status");
    }
  };

  const beginEditServiceFee = (fee: ServiceFee) => {
    setError(null);
    setEditingFeeId(fee.id);
    setFeeEditorForm({
      serviceType: fee.serviceType,
      providerType: fee.providerType ?? "",
      methodType: fee.methodType ?? "",
      feeMode: fee.feePercentage !== undefined ? "percentage" : "flat",
      feeValue:
        fee.feePercentage !== undefined
          ? String(fee.feePercentage)
          : String(fee.flatFee ?? 0),
      bracketMinAmount:
        fee.bracketMinAmount !== undefined ? String(fee.bracketMinAmount) : "",
      bracketMaxAmount:
        fee.bracketMaxAmount !== undefined ? String(fee.bracketMaxAmount) : "",
    });
  };

  const cancelEditServiceFee = () => {
    setEditingFeeId(null);
    setIsAddingFee(false);
    setFeeEditorForm(null);
    setError(null);
  };

  const beginAddServiceFee = () => {
    setError(null);
    setEditingFeeId(null);
    setIsAddingFee(true);
    setFeeEditorForm({
      serviceType: "EWallet",
      providerType: "",
      methodType: "",
      feeMode: "flat",
      feeValue: "",
      bracketMinAmount: "",
      bracketMaxAmount: "",
    });
  };

  const updateFeeEditorForm = (updates: Partial<FeeEditorForm>) => {
    if (!feeEditorForm) {
      return;
    }

    const nextForm = {
      ...feeEditorForm,
      ...updates,
    };

    if (updates.serviceType === "EWallet") {
      nextForm.providerType = KNOWN_EWALLET_PROVIDERS.includes(
        nextForm.providerType as (typeof KNOWN_EWALLET_PROVIDERS)[number],
      )
        ? nextForm.providerType
        : "GCash";
      nextForm.methodType = KNOWN_EWALLET_METHODS.includes(
        nextForm.methodType as (typeof KNOWN_EWALLET_METHODS)[number],
      )
        ? nextForm.methodType
        : "CashIn";
    }

    if (updates.serviceType === "Printing") {
      nextForm.providerType = KNOWN_PRINTING_TYPES.includes(
        nextForm.providerType as (typeof KNOWN_PRINTING_TYPES)[number],
      )
        ? nextForm.providerType
        : "Printing";
      nextForm.methodType = "";
    }

    setFeeEditorForm(nextForm);
  };

  const saveServiceFeeEdit = async (fee: ServiceFee) => {
    if (user?.role !== "Admin") {
      setError("Only admins can update service fees.");
      return;
    }

    if (!feeEditorForm) {
      setError("Fee editor is not initialized.");
      return;
    }

    if (!feeEditorForm.serviceType.trim()) {
      setError("Service type is required.");
      return;
    }

    const parsedFeeValue = Number(feeEditorForm.feeValue);
    if (!Number.isFinite(parsedFeeValue) || parsedFeeValue < 0) {
      setError("Please provide a valid non-negative fee value.");
      return;
    }

    const hasBracketMin = feeEditorForm.bracketMinAmount.trim() !== "";
    const hasBracketMax = feeEditorForm.bracketMaxAmount.trim() !== "";
    const parsedBracketMin = hasBracketMin
      ? Number(feeEditorForm.bracketMinAmount)
      : undefined;
    const parsedBracketMax = hasBracketMax
      ? Number(feeEditorForm.bracketMaxAmount)
      : undefined;

    if (
      (hasBracketMin &&
        (!Number.isFinite(parsedBracketMin) || (parsedBracketMin ?? 0) < 0)) ||
      (hasBracketMax &&
        (!Number.isFinite(parsedBracketMax) || (parsedBracketMax ?? 0) < 0))
    ) {
      setError("Bracket values must be valid non-negative numbers.");
      return;
    }

    if (
      parsedBracketMin !== undefined &&
      parsedBracketMax !== undefined &&
      parsedBracketMin > parsedBracketMax
    ) {
      setError("Bracket min amount cannot be greater than bracket max amount.");
      return;
    }

    try {
      setSavingFeeId(fee.id);
      await settingsService.updateServiceFee(fee.id, {
        serviceType: feeEditorForm.serviceType.trim(),
        providerType: feeEditorForm.providerType.trim() || undefined,
        methodType: feeEditorForm.methodType.trim() || undefined,
        feePercentage:
          feeEditorForm.feeMode === "percentage" ? parsedFeeValue : undefined,
        flatFee: feeEditorForm.feeMode === "flat" ? parsedFeeValue : undefined,
        bracketMinAmount: parsedBracketMin,
        bracketMaxAmount: parsedBracketMax,
      });

      await loadServiceFees();
      setSuccess("Service fee updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      cancelEditServiceFee();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update service fee",
      );
    } finally {
      setSavingFeeId(null);
    }
  };

  const createServiceFee = async () => {
    if (user?.role !== "Admin") {
      setError("Only admins can create service fees.");
      return;
    }

    if (!feeEditorForm) {
      setError("Fee editor is not initialized.");
      return;
    }

    if (!feeEditorForm.serviceType.trim()) {
      setError("Service type is required.");
      return;
    }

    const parsedFeeValue = Number(feeEditorForm.feeValue);
    if (!Number.isFinite(parsedFeeValue) || parsedFeeValue < 0) {
      setError("Please provide a valid non-negative fee value.");
      return;
    }

    const hasBracketMin = feeEditorForm.bracketMinAmount.trim() !== "";
    const hasBracketMax = feeEditorForm.bracketMaxAmount.trim() !== "";
    const parsedBracketMin = hasBracketMin
      ? Number(feeEditorForm.bracketMinAmount)
      : undefined;
    const parsedBracketMax = hasBracketMax
      ? Number(feeEditorForm.bracketMaxAmount)
      : undefined;

    if (
      (hasBracketMin &&
        (!Number.isFinite(parsedBracketMin) || (parsedBracketMin ?? 0) < 0)) ||
      (hasBracketMax &&
        (!Number.isFinite(parsedBracketMax) || (parsedBracketMax ?? 0) < 0))
    ) {
      setError("Bracket values must be valid non-negative numbers.");
      return;
    }

    if (
      parsedBracketMin !== undefined &&
      parsedBracketMax !== undefined &&
      parsedBracketMin > parsedBracketMax
    ) {
      setError("Bracket min amount cannot be greater than bracket max amount.");
      return;
    }

    try {
      setIsCreatingFee(true);
      await settingsService.createServiceFee({
        serviceType: feeEditorForm.serviceType.trim(),
        providerType: feeEditorForm.providerType.trim() || undefined,
        methodType: feeEditorForm.methodType.trim() || undefined,
        feePercentage:
          feeEditorForm.feeMode === "percentage" ? parsedFeeValue : undefined,
        flatFee: feeEditorForm.feeMode === "flat" ? parsedFeeValue : undefined,
        bracketMinAmount: parsedBracketMin,
        bracketMaxAmount: parsedBracketMax,
      });

      await loadServiceFees();
      setSuccess("Service fee rule created successfully!");
      setTimeout(() => setSuccess(null), 3000);
      cancelEditServiceFee();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create service fee rule",
      );
    } finally {
      setIsCreatingFee(false);
    }
  };

  const handleDeleteServiceFee = async (fee: ServiceFee) => {
    if (user?.role !== "Admin") {
      setError("Only admins can delete service fees.");
      return;
    }

    const confirmed = window.confirm(
      `Delete fee rule for ${fee.serviceType}${fee.providerType ? ` (${fee.providerType})` : ""}${fee.methodType ? ` - ${fee.methodType}` : ""}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingFeeId(fee.id);
      await settingsService.deleteServiceFee(fee.id);
      await loadServiceFees();
      setSuccess("Service fee rule deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
      if (editingFeeId === fee.id) {
        cancelEditServiceFee();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete service fee rule",
      );
    } finally {
      setDeletingFeeId(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file for your avatar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be 2MB or smaller.");
      return;
    }

    setIsUpdatingAvatar(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const updatedUser = await settingsService.updateProfile(
          reader.result as string,
        );
        updateUser(updatedUser);
        setSuccess("Avatar updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update avatar",
        );
      } finally {
        setIsUpdatingAvatar(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      setError("Failed to read avatar image.");
      setIsUpdatingAvatar(false);
      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setIsUpdatingAvatar(true);
    setError(null);

    try {
      const updatedUser = await settingsService.updateProfile(null);
      updateUser(updatedUser);
      setSuccess("Avatar removed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove avatar");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h1>

      {error && (
        <Alert
          type="error"
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {success && (
        <Alert
          type="success"
          title="Success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab("appearance")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "appearance"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Appearance
        </button>
        <button
          onClick={() => setActiveTab("fees")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "fees"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Service Fees
        </button>
        {user?.role === "Admin" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            User Management
          </button>
        )}
        {user?.role === "Admin" && (
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "products"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Products
          </button>
        )}
      </div>

      {/* Appearance */}
      {activeTab === "appearance" && (
        <Card title="Appearance Settings">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/80">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <UserAvatar
                  fullName={user?.fullName}
                  profilePicture={user?.profilePicture}
                  size="xl"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile Avatar
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Upload a custom avatar to personalize your account across
                    the app.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    JPG, PNG, or GIF. Max size: 2MB.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUpdatingAvatar}
                  />
                  {isUpdatingAvatar ? "Updating..." : "Upload Avatar"}
                </label>
                <Button
                  variant="secondary"
                  onClick={handleRemoveAvatar}
                  disabled={isUpdatingAvatar || !user?.profilePicture}
                >
                  Remove Avatar
                </Button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Theme mode is controlled by the theme toggle in the header.
            </p>
            <Button variant="secondary" fullWidth>
              Reset to Default
            </Button>
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Data Export
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export all your transaction history as CSV for backup or
                analysis.
              </p>
              <Button variant="primary" onClick={handleExportTransactions}>
                <Download size={18} />
                Export Transactions
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Service Fees */}
      {activeTab === "fees" && (
        <Card title="Service Fees Configuration">
          {loading || isServiceFeeMutating ? (
            <div className="space-y-4">
              {user?.role === "Admin" && (
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-28 rounded-lg" />
                </div>
              )}
              <SettingsTableSkeleton columns={4} rows={5} />
            </div>
          ) : (
            <div className="space-y-4">
              {user?.role === "Admin" &&
                !isAddingFee &&
                editingFeeId === null && (
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={beginAddServiceFee}
                    >
                      Add Fee Rule
                    </Button>
                  </div>
                )}
              {serviceFees.length === 0 && !isAddingFee ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No service fees configured
                </div>
              ) : (
                <div className="space-y-6">
                  {serviceFeeSections.map(([serviceType, groupedFees]) => (
                    <div
                      key={serviceType}
                      className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                          {serviceType}
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                Service
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                Provider/Type
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                Fee
                              </th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {isAddingFee &&
                              feeEditorForm &&
                              feeEditorForm.serviceType === serviceType && (
                                <tr className="border-b border-blue-100 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-900/10">
                                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                                    <select
                                      value={feeEditorForm.serviceType}
                                      onChange={(e) =>
                                        updateFeeEditorForm({
                                          serviceType: e.target.value,
                                        })
                                      }
                                      aria-label="New service type"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                      {getKnownOptions(
                                        feeEditorForm.serviceType,
                                        KNOWN_SERVICE_TYPES,
                                      ).map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                    <div className="space-y-2">
                                      {feeEditorForm.serviceType ===
                                      "EWallet" ? (
                                        <>
                                          <select
                                            value={feeEditorForm.providerType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                providerType: e.target.value,
                                              })
                                            }
                                            aria-label="New provider"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          >
                                            {getKnownOptions(
                                              feeEditorForm.providerType,
                                              KNOWN_EWALLET_PROVIDERS,
                                            ).map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                          <select
                                            value={feeEditorForm.methodType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                methodType: e.target.value,
                                              })
                                            }
                                            aria-label="New method"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          >
                                            {getKnownOptions(
                                              feeEditorForm.methodType,
                                              KNOWN_EWALLET_METHODS,
                                            ).map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </>
                                      ) : feeEditorForm.serviceType ===
                                        "Printing" ? (
                                        <select
                                          value={feeEditorForm.providerType}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              providerType: e.target.value,
                                            })
                                          }
                                          aria-label="New printing type"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                          {getKnownOptions(
                                            feeEditorForm.providerType,
                                            KNOWN_PRINTING_TYPES,
                                          ).map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <>
                                          <input
                                            type="text"
                                            value={feeEditorForm.providerType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                providerType: e.target.value,
                                              })
                                            }
                                            placeholder="Provider (optional)"
                                            aria-label="New provider"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          />
                                          <input
                                            type="text"
                                            value={feeEditorForm.methodType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                methodType: e.target.value,
                                              })
                                            }
                                            placeholder="Method (optional)"
                                            aria-label="New method"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          />
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <select
                                          value={feeEditorForm.feeMode}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              feeMode: e.target.value as
                                                | "flat"
                                                | "percentage",
                                            })
                                          }
                                          aria-label="New fee mode"
                                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                          <option value="flat">
                                            Flat Fee (₱)
                                          </option>
                                          <option value="percentage">
                                            Percentage (%)
                                          </option>
                                        </select>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.feeValue}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              feeValue: e.target.value,
                                            })
                                          }
                                          placeholder="Fee value"
                                          aria-label="New fee value"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.bracketMinAmount}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              bracketMinAmount: e.target.value,
                                            })
                                          }
                                          placeholder="Bracket min"
                                          aria-label="New bracket min"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.bracketMaxAmount}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              bracketMaxAmount: e.target.value,
                                            })
                                          }
                                          placeholder="Bracket max (blank = up)"
                                          aria-label="New bracket max"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={createServiceFee}
                                        loading={isCreatingFee}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={cancelEditServiceFee}
                                        disabled={isCreatingFee}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            {groupedFees.map((fee) => (
                              <tr
                                key={fee.id}
                                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <td className="py-3 px-4 text-gray-900 dark:text-white">
                                  {editingFeeId === fee.id && feeEditorForm ? (
                                    <select
                                      value={feeEditorForm.serviceType}
                                      onChange={(e) =>
                                        updateFeeEditorForm({
                                          serviceType: e.target.value,
                                        })
                                      }
                                      aria-label="Service type"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                      {getKnownOptions(
                                        feeEditorForm.serviceType,
                                        KNOWN_SERVICE_TYPES,
                                      ).map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    fee.serviceType
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                  {editingFeeId === fee.id && feeEditorForm ? (
                                    <div className="space-y-2">
                                      {feeEditorForm.serviceType ===
                                      "EWallet" ? (
                                        <>
                                          <select
                                            value={feeEditorForm.providerType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                providerType: e.target.value,
                                              })
                                            }
                                            aria-label="Provider"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          >
                                            {getKnownOptions(
                                              feeEditorForm.providerType,
                                              KNOWN_EWALLET_PROVIDERS,
                                            ).map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                          <select
                                            value={feeEditorForm.methodType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                methodType: e.target.value,
                                              })
                                            }
                                            aria-label="Method"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          >
                                            {getKnownOptions(
                                              feeEditorForm.methodType,
                                              KNOWN_EWALLET_METHODS,
                                            ).map((option) => (
                                              <option
                                                key={option}
                                                value={option}
                                              >
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </>
                                      ) : feeEditorForm.serviceType ===
                                        "Printing" ? (
                                        <select
                                          value={feeEditorForm.providerType}
                                          onChange={(e) =>
                                            updateFeeEditorForm({
                                              providerType: e.target.value,
                                            })
                                          }
                                          aria-label="Printing type"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                          {getKnownOptions(
                                            feeEditorForm.providerType,
                                            KNOWN_PRINTING_TYPES,
                                          ).map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <>
                                          <input
                                            type="text"
                                            value={feeEditorForm.providerType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                providerType: e.target.value,
                                              })
                                            }
                                            placeholder="Provider (optional)"
                                            aria-label="Provider"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          />
                                          <input
                                            type="text"
                                            value={feeEditorForm.methodType}
                                            onChange={(e) =>
                                              updateFeeEditorForm({
                                                methodType: e.target.value,
                                              })
                                            }
                                            placeholder="Method (optional)"
                                            aria-label="Method"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          />
                                        </>
                                      )}
                                    </div>
                                  ) : (
                                    [fee.providerType, fee.methodType]
                                      .filter(Boolean)
                                      .join(" / ") || "-"
                                  )}
                                </td>
                                <td className="py-3 px-4 text-gray-900 dark:text-white">
                                  {editingFeeId === fee.id && feeEditorForm ? (
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <select
                                          value={feeEditorForm.feeMode}
                                          onChange={(e) =>
                                            setFeeEditorForm({
                                              ...feeEditorForm,
                                              feeMode: e.target.value as
                                                | "flat"
                                                | "percentage",
                                            })
                                          }
                                          aria-label="Fee mode"
                                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                          <option value="flat">
                                            Flat Fee (₱)
                                          </option>
                                          <option value="percentage">
                                            Percentage (%)
                                          </option>
                                        </select>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.feeValue}
                                          onChange={(e) =>
                                            setFeeEditorForm({
                                              ...feeEditorForm,
                                              feeValue: e.target.value,
                                            })
                                          }
                                          placeholder="Fee value"
                                          aria-label="Fee value"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.bracketMinAmount}
                                          onChange={(e) =>
                                            setFeeEditorForm({
                                              ...feeEditorForm,
                                              bracketMinAmount: e.target.value,
                                            })
                                          }
                                          placeholder="Bracket min"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={feeEditorForm.bracketMaxAmount}
                                          onChange={(e) =>
                                            setFeeEditorForm({
                                              ...feeEditorForm,
                                              bracketMaxAmount: e.target.value,
                                            })
                                          }
                                          placeholder="Bracket max (blank = up)"
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {fee.feePercentage !== undefined
                                        ? `${fee.feePercentage}%`
                                        : `₱${fee.flatFee?.toFixed(2)}`}
                                      {(fee.bracketMinAmount ??
                                        fee.bracketMaxAmount) !== undefined && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          Bracket: ₱{fee.bracketMinAmount ?? 0}{" "}
                                          - ₱{fee.bracketMaxAmount ?? "up"}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {user?.role === "Admin" ? (
                                    editingFeeId === fee.id ? (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() =>
                                            saveServiceFeeEdit(fee)
                                          }
                                          loading={savingFeeId === fee.id}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={cancelEditServiceFee}
                                          disabled={savingFeeId === fee.id}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            beginEditServiceFee(fee)
                                          }
                                        >
                                          Edit Fee
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteServiceFee(fee)
                                          }
                                          loading={deletingFeeId === fee.id}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      View only
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* User Management */}
      {activeTab === "users" && user?.role === "Admin" && (
        <>
          {/* Create User Form */}
          <Card title="Create New User" className="mb-6">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, email: e.target.value })
                    }
                    placeholder="user@example.com"
                    disabled={creatingUser}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUserForm.fullName}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    disabled={creatingUser}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        password: e.target.value,
                      })
                    }
                    placeholder="Create a secure password"
                    disabled={creatingUser}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="user-role-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Role
                  </label>
                  <select
                    id="user-role-select"
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        role: e.target.value as "Admin" | "Seller",
                      })
                    }
                    disabled={creatingUser}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Seller">Seller</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={creatingUser}
              >
                Create User
              </Button>
            </form>
          </Card>

          {/* Users List */}
          <Card title="User Management">
            {loading ? (
              <SettingsTableSkeleton columns={4} rows={5} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-8 text-gray-500 dark:text-gray-400"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {u.fullName}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {u.email}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {u.role}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                u.isActive
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                              }`}
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant={u.isActive ? "danger" : "success"}
                              size="sm"
                              onClick={() =>
                                handleToggleUserStatus(
                                  u.id,
                                  u.isActive ?? false,
                                )
                              }
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Products Management */}
      {activeTab === "products" && user?.role === "Admin" && (
        <>
          <Card title="Add New Product" className="mb-6">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newProductForm.name.trim() || newProductForm.price <= 0) {
                  setError("Name and a valid price are required");
                  return;
                }
                setIsCreatingProduct(true);
                try {
                  const created =
                    await settingsService.createProduct(newProductForm);
                  setProducts((prev) => [...prev, created]);
                  setNewProductForm({ name: "", price: 0, stockCount: 0 });
                  setSuccess("Product created successfully!");
                  setTimeout(() => setSuccess(null), 3000);
                } catch {
                  setError("Failed to create product");
                } finally {
                  setIsCreatingProduct(false);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Product name"
                  disabled={isCreatingProduct}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (₱)
                </label>
                <input
                  type="number"
                  value={newProductForm.price || ""}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  disabled={isCreatingProduct}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Count
                </label>
                <input
                  type="number"
                  value={newProductForm.stockCount || ""}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      stockCount: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                  placeholder="0"
                  disabled={isCreatingProduct}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={isCreatingProduct}>
                  {isCreatingProduct ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Products">
            {loading ? (
              <SettingsTableSkeleton columns={5} rows={3} />
            ) : products.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No products yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Name
                      </th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Price
                      </th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {editingProductId === product.id &&
                          editProductForm ? (
                            <input
                              type="number"
                              value={editProductForm.price}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              min="0.01"
                              step="0.01"
                              className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          ) : (
                            `₱${product.price.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {editingProductId === product.id &&
                          editProductForm ? (
                            <input
                              type="number"
                              value={editProductForm.stockCount}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  stockCount: parseInt(e.target.value) || 0,
                                })
                              }
                              min="0"
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          ) : (
                            product.stockCount
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingProductId === product.id &&
                          editProductForm ? (
                            <select
                              value={
                                editProductForm.isActive ? "active" : "inactive"
                              }
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  isActive: e.target.value === "active",
                                })
                              }
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {editingProductId === product.id ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={savingProductId === product.id}
                                  onClick={async () => {
                                    if (!editProductForm) return;
                                    setSavingProductId(product.id);
                                    try {
                                      const updated =
                                        await settingsService.updateProduct(
                                          product.id,
                                          editProductForm,
                                        );
                                      setProducts((prev) =>
                                        prev.map((p) =>
                                          p.id === product.id ? updated : p,
                                        ),
                                      );
                                      setEditingProductId(null);
                                      setEditProductForm(null);
                                      setSuccess("Product updated!");
                                      setTimeout(() => setSuccess(null), 3000);
                                    } catch {
                                      setError("Failed to update product");
                                    } finally {
                                      setSavingProductId(null);
                                    }
                                  }}
                                >
                                  {savingProductId === product.id
                                    ? "Saving..."
                                    : "Save"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingProductId(null);
                                    setEditProductForm(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingProductId(product.id);
                                    setEditProductForm({
                                      price: product.price,
                                      stockCount: product.stockCount,
                                      isActive: product.isActive,
                                    });
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  disabled={deletingProductId === product.id}
                                  onClick={async () => {
                                    if (!confirm(`Delete "${product.name}"?`))
                                      return;
                                    setDeletingProductId(product.id);
                                    try {
                                      await settingsService.deleteProduct(
                                        product.id,
                                      );
                                      setProducts((prev) =>
                                        prev.filter((p) => p.id !== product.id),
                                      );
                                    } catch {
                                      setError("Failed to delete product");
                                    } finally {
                                      setDeletingProductId(null);
                                    }
                                  }}
                                >
                                  {deletingProductId === product.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
