import { describe, expect, it } from "vitest";
import { calculateEmi } from "../src/engine/emiEngine";

describe("emiEngine", () => {
  it("computes a positive estimated payment that fully amortizes the principal", () => {
    const result = calculateEmi({ principal: 125000, annualInterestRate: 6.5, tenureMonths: 36, moratoriumMonths: 3 });
    expect(result.estimatedPayment).toBeGreaterThan(0);
    expect(result.repaymentMonths).toBe(33);
    expect(result.schedule).toHaveLength(33);
    expect(result.schedule.at(-1)!.remainingBalance).toBe(0);
    expect(result.totalRepayment).toBe(125000 + result.totalInterest);
  });

  it("handles a zero interest rate without dividing by zero", () => {
    const result = calculateEmi({ principal: 12000, annualInterestRate: 0, tenureMonths: 12, moratoriumMonths: 0 });
    expect(result.estimatedPayment).toBe(1000);
    expect(result.totalInterest).toBe(0);
  });

  it("always marks the result as an estimate via its assumptions text", () => {
    const result = calculateEmi({ principal: 100000, annualInterestRate: 8, tenureMonths: 84, moratoriumMonths: 6 });
    expect(result.assumptions.join(" ")).toMatch(/estimate/i);
  });
});
