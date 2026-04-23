export const getEWalletAmountBracket = (amount: number): string => {
  if (amount <= 500) return "0-500";
  if (amount <= 1500) return "501-1500";
  if (amount <= 2500) return "1501-2500";
  if (amount <= 3000) return "2501-3000";
  if (amount <= 4000) return "3001-4000";
  if (amount <= 5000) return "4001-5000";
  return "5001+";
};

export const calculateEWalletServiceCharge = (amount: number): number => {
  if (amount <= 500) return 5;
  if (amount <= 1500) return 10;
  if (amount <= 2500) return 15;
  if (amount <= 3000) return 20;

  const thousandBandsAboveThreeThousand = Math.ceil((amount - 3000) / 1000);
  return thousandBandsAboveThreeThousand * 50;
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
