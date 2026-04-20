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
  transactionType: "EWallet" | "Printing";
  amount: number;
  serviceCharge: number;
  totalAmount: number;
  status: "Pending" | "Completed" | "Failed";
  failureReason?: string;
  userFullName?: string;
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

// Settings Types
export interface ServiceFee {
  id: string;
  serviceType: string;
  providerType?: string;
  methodType?: string;
  feePercentage?: number;
  flatFee?: number;
}
