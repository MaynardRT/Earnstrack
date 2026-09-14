export const getEWalletAmountBracket = (amount: number): string => {
  if (amount <= 0) return "";

  const bandIndex = Math.floor((amount - 1) / 500);
  const min = bandIndex * 500 + 1;
  const max = min + 499;

  return `${min}-${max}`;
};

/**
 * Returns the service charge for E-Wallet transactions based on the fixed fee matrix.
 */
export const calculateEWalletServiceCharge = (amount: number): number => {
  if (amount <= 0) return 0;
  return Math.ceil(amount / 250) * 5;
};

export const getEWalletServiceChargeRate = (amount: number): number =>
  amount > 0 ? calculateEWalletServiceCharge(amount) / amount : 0;

export const calculateEWalletTotal = (amount: number): number =>
  amount + calculateEWalletServiceCharge(amount);

export const normalizePrintingQuantity = (quantity: number): number =>
  Math.max(1, quantity || 1);

export const calculatePrintingTotal = (
  baseAmount: number,
  quantity: number,
): number => (baseAmount || 0) * normalizePrintingQuantity(quantity);
