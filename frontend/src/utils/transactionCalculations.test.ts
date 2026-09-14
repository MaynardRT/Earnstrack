import { describe, expect, it } from "vitest";
import {
  calculateEWalletServiceCharge,
  calculateEWalletTotal,
  calculatePrintingTotal,
  getEWalletAmountBracket,
  normalizePrintingQuantity,
} from "./transactionCalculations";

describe("transactionCalculations", () => {
  it("uses 250-step fee brackets based on the e-wallet rate card", () => {
    expect(calculateEWalletServiceCharge(250)).toBe(5);
    expect(calculateEWalletServiceCharge(251)).toBe(10);
    expect(calculateEWalletServiceCharge(1000)).toBe(20);
    expect(calculateEWalletServiceCharge(1001)).toBe(25);
    expect(calculateEWalletServiceCharge(9500)).toBe(190);
    expect(calculateEWalletServiceCharge(9501)).toBe(195);
    expect(calculateEWalletServiceCharge(10000)).toBe(200);
    expect(calculateEWalletServiceCharge(10001)).toBe(205);
    expect(calculateEWalletTotal(10001)).toBe(10206);
  });

  it("returns the current amount brackets used by the form", () => {
    expect(getEWalletAmountBracket(500)).toBe("1-500");
    expect(getEWalletAmountBracket(1000)).toBe("501-1000");
    expect(getEWalletAmountBracket(1500)).toBe("1001-1500");
    expect(getEWalletAmountBracket(1501)).toBe("1501-2000");
    expect(getEWalletAmountBracket(3500)).toBe("3001-3500");
    expect(getEWalletAmountBracket(10000)).toBe("9501-10000");
    expect(getEWalletAmountBracket(10001)).toBe("10001-10500");
    expect(getEWalletAmountBracket(20001)).toBe("20001-20500");
    expect(getEWalletAmountBracket(20501)).toBe("20501-21000");
  });

  it("uses the overflow fee bands for amounts above 20,000", () => {
    expect(calculateEWalletServiceCharge(20001)).toBe(405);
    expect(calculateEWalletServiceCharge(20501)).toBe(415);
    expect(calculateEWalletServiceCharge(21001)).toBe(425);
    expect(calculateEWalletTotal(20001)).toBe(20406);
    expect(calculateEWalletTotal(20501)).toBe(20916);
    expect(calculateEWalletTotal(21001)).toBe(21426);
  });

  it("keeps printing totals as unit price times quantity with a minimum quantity of one", () => {
    expect(normalizePrintingQuantity(0)).toBe(1);
    expect(calculatePrintingTotal(2.5, 4)).toBe(10);
    expect(calculatePrintingTotal(2.5, 0)).toBe(2.5);
  });
});
