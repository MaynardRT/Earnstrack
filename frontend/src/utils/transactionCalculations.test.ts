import { describe, expect, it } from "vitest";
import {
  calculateEWalletServiceCharge,
  calculateEWalletTotal,
  calculatePrintingTotal,
  getEWalletAmountBracket,
  normalizePrintingQuantity,
} from "./transactionCalculations";

describe("transactionCalculations", () => {
  it("uses 500-step fee brackets based on the e-wallet rate card", () => {
    expect(calculateEWalletServiceCharge(500)).toBe(5);
    expect(calculateEWalletServiceCharge(501)).toBe(10);
    expect(calculateEWalletServiceCharge(1000)).toBe(10);
    expect(calculateEWalletServiceCharge(1001)).toBe(15);
    expect(calculateEWalletServiceCharge(1500)).toBe(15);
    expect(calculateEWalletServiceCharge(1501)).toBe(20);
    expect(calculateEWalletServiceCharge(9500)).toBe(140);
    expect(calculateEWalletServiceCharge(9501)).toBe(150);
    expect(calculateEWalletServiceCharge(10000)).toBe(150);
    expect(calculateEWalletServiceCharge(10001)).toBe(160);
    expect(calculateEWalletTotal(10000)).toBe(10150);
  });

  it("returns the current amount brackets used by the form", () => {
    expect(getEWalletAmountBracket(500)).toBe("1-500");
    expect(getEWalletAmountBracket(1000)).toBe("501-1000");
    expect(getEWalletAmountBracket(1500)).toBe("1001-1500");
    expect(getEWalletAmountBracket(1501)).toBe("1501-2000");
    expect(getEWalletAmountBracket(3500)).toBe("3001-3500");
    expect(getEWalletAmountBracket(10000)).toBe("9501-10000");
    expect(getEWalletAmountBracket(10001)).toBe("9501-10000");
  });

  it("uses the starting fee bracket for amounts above 20,000", () => {
    expect(calculateEWalletServiceCharge(20001)).toBe(355);
    expect(calculateEWalletTotal(20001)).toBe(20356);
  });

  it("keeps printing totals as unit price times quantity with a minimum quantity of one", () => {
    expect(normalizePrintingQuantity(0)).toBe(1);
    expect(calculatePrintingTotal(2.5, 4)).toBe(10);
    expect(calculatePrintingTotal(2.5, 0)).toBe(2.5);
  });
});
