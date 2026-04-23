import { describe, expect, it } from "vitest";
import {
  calculateEWalletServiceCharge,
  calculateEWalletTotal,
  calculatePrintingTotal,
  getEWalletAmountBracket,
  normalizePrintingQuantity,
} from "./transactionCalculations";

describe("transactionCalculations", () => {
  it("uses fixed fee tiers through 3000 and 50 per 1000-band above 3000", () => {
    expect(calculateEWalletServiceCharge(500)).toBe(5);
    expect(calculateEWalletServiceCharge(501)).toBe(10);
    expect(calculateEWalletServiceCharge(1500)).toBe(10);
    expect(calculateEWalletServiceCharge(1501)).toBe(15);
    expect(calculateEWalletServiceCharge(2500)).toBe(15);
    expect(calculateEWalletServiceCharge(2501)).toBe(20);
    expect(calculateEWalletServiceCharge(3000)).toBe(20);
    expect(calculateEWalletServiceCharge(3001)).toBe(50);
    expect(calculateEWalletServiceCharge(4000)).toBe(50);
    expect(calculateEWalletServiceCharge(4001)).toBe(100);
    expect(calculateEWalletServiceCharge(5000)).toBe(100);
    expect(calculateEWalletServiceCharge(5001)).toBe(150);
    expect(calculateEWalletTotal(5001)).toBe(5151);
  });

  it("returns the current amount brackets used by the form", () => {
    expect(getEWalletAmountBracket(500)).toBe("0-500");
    expect(getEWalletAmountBracket(1000)).toBe("501-1500");
    expect(getEWalletAmountBracket(1500)).toBe("501-1500");
    expect(getEWalletAmountBracket(1501)).toBe("1501-2500");
    expect(getEWalletAmountBracket(2501)).toBe("2501-3000");
    expect(getEWalletAmountBracket(3500)).toBe("3001-4000");
    expect(getEWalletAmountBracket(5001)).toBe("5001+");
  });

  it("keeps printing totals as unit price times quantity with a minimum quantity of one", () => {
    expect(normalizePrintingQuantity(0)).toBe(1);
    expect(calculatePrintingTotal(2.5, 4)).toBe(10);
    expect(calculatePrintingTotal(2.5, 0)).toBe(2.5);
  });
});
