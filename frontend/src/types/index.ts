// Auth Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "Admin" | "Seller";
  profilePicture?: string;
  createdAt: string;
  isActive?: boolean;
}

export interface AuthResponse {
  token: string;
  user?: User | null;
}

// Transaction Types
export interface Transaction {
  id: string;
  transactionType:
    | "EWallet"
    | "Printing"
    | "ELoading"
    | "BillsPayment"
    | "Products";
  amount: number;
  serviceCharge: number;
  totalAmount: number;
  status: "Pending" | "Completed" | "Failed";
  failureReason?: string;
  userFullName?: string;
  provider?: string;
  method?: string;
  amountBracket?: string;
  referenceNumber?: string;
  screenshotUrl?: string;
  screenshotDataUrl?: string;
  printingServiceType?: string;
  paperSize?: string;
  color?: string;
  quantity?: number;
  eLoadingNetwork?: string;
  eLoadingPhoneNumber?: string;
  billerType?: string;
  productName?: string;
  createdAt: string;
}

export interface TransactionStatusBreakdown {
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  pendingTotal: number;
  completedTotal: number;
  failedTotal: number;
}

export interface TransactionSummary {
  dailyTotal: number;
  weeklyTotal: number;
  monthlyTotal: number;
  totalTransactions: number;
  statusBreakdown?: TransactionStatusBreakdown | null;
}

// Transaction creation request shapes — one interface per transaction type
export interface EWalletTransaction {
  provider: "GCash" | "Maya";
  method: "CashIn" | "CashOut";
  amountBracket: string;
  referenceNumber: string;
  baseAmount: number;
  screenshotBase64?: string;
}

export interface PrintingTransaction {
  serviceType: "Printing" | "Scanning" | "Photocopy";
  paperSize: "Long" | "Short";
  color: "Grayscale" | "Colored";
  baseAmount: number;
  quantity: number;
}

export interface ELoadingTransaction {
  mobileNetwork: string;
  phoneNumber: string;
  baseAmount: number;
  screenshotBase64?: string;
}

export interface BillsPaymentTransaction {
  billerType: string;
  billAmount: number;
  screenshotBase64?: string;
}

// Product Types — catalog items managed in Settings; selling decrements stockCount
export interface Product {
  id: string;
  name: string;
  price: number;
  stockCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  price: number;
  stockCount: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  stockCount?: number;
  isActive?: boolean;
}

// Settings Types
export interface ServiceFee {
  id: string;
  serviceType: string;
  providerType?: string;
  methodType?: string;
  feePercentage?: number;
  flatFee?: number;
  bracketMinAmount?: number;
  bracketMaxAmount?: number;
}
