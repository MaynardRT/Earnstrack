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
  // Fee matrix as [min, max, fee]
  const feeMatrix: [number, number, number][] = [
    [1, 500, 5],
    [501, 1000, 10],
    [1001, 1500, 15],
    [1501, 2000, 20],
    [2001, 2500, 25],
    [2501, 3000, 30],
    [3001, 3500, 35],
    [3501, 4000, 40],
    [4001, 4500, 45],
    [4501, 5000, 50],
    [5001, 5500, 60],
    [5501, 6000, 70],
    [6001, 6500, 80],
    [6501, 7000, 90],
    [7001, 7500, 100],
    [7501, 8000, 110],
    [8001, 8500, 120],
    [8501, 9000, 130],
    [9001, 9500, 140],
    [9501, 10000, 150],
    [10001, 10500, 160],
    [10501, 11000, 170],
    [11001, 11500, 180],
    [11501, 12000, 190],
    [12001, 12500, 200],
    [12501, 13000, 210],
    [13001, 13500, 220],
    [13501, 14000, 230],
    [14001, 14500, 240],
    [14501, 15000, 250],
    [15001, 15500, 260],
    [15501, 16000, 270],
    [16001, 16500, 280],
    [16501, 17000, 290],
    [17001, 17500, 300],
    [17501, 18000, 310],
    [18001, 18500, 320],
    [18501, 19000, 330],
    [19001, 19500, 340],
    [19501, 20000, 350],
    [20001, 20500, 355],
    [20501, 21000, 360],
    [21001, 21500, 365],
    [21501, 22000, 370],
    [22001, 22500, 375],
    [22501, 23000, 380],
    [23001, 23500, 385],
    [23501, 24000, 390],
    [24001, 24500, 395],
    [24501, 25000, 400],
    [25001, 25500, 405],
    [25501, 26000, 410],
    [26001, 26500, 415],
    [26501, 27000, 420],
    [27001, 27500, 425],
    [27501, 28000, 430],
    [28001, 28500, 435],
    [28501, 29000, 440],
    [29001, 29500, 445],
    [29501, 30000, 450],
  ];

  for (const [min, max, fee] of feeMatrix) {
    if (amount >= min && amount <= max) return fee;
  }

  if (amount > 30000) {
    const overflowBandIndex = Math.floor((amount - 1) / 500) - 59;
    return overflowBandIndex * 5;
  }

  return 450; // Default to max fee if something goes wrong, though this should never be hit with the current matrix
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
