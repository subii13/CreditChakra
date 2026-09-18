import type { EmiInput, EmiResult, EmiScheduleEntry } from "../types/domain";

// Standard reducing-balance EMI over the repayment period (i.e. after
// the moratorium). This is always an ESTIMATE (Section 59/87) — never
// presented as a guaranteed/approved figure.
export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualInterestRate, tenureMonths, moratoriumMonths } = input;
  const repaymentMonths = Math.max(1, tenureMonths - moratoriumMonths);
  const monthlyRate = annualInterestRate / 12 / 100;

  let estimatedPayment: number;
  if (monthlyRate === 0) {
    estimatedPayment = principal / repaymentMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, repaymentMonths);
    estimatedPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const schedule: EmiScheduleEntry[] = [];
  let balance = principal;
  let totalInterest = 0;

  for (let month = 1; month <= repaymentMonths; month++) {
    const interestComponent = balance * monthlyRate;
    let principalComponent = estimatedPayment - interestComponent;
    if (month === repaymentMonths) {
      // absorb rounding drift into the final installment
      principalComponent = balance;
    }
    balance = Math.max(0, balance - principalComponent);
    totalInterest += interestComponent;
    schedule.push({
      month,
      payment: Math.round(interestComponent + principalComponent),
      principalComponent: Math.round(principalComponent),
      interestComponent: Math.round(interestComponent),
      remainingBalance: Math.round(balance),
    });
  }

  return {
    estimatedPayment: Math.round(estimatedPayment),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(principal + totalInterest),
    repaymentMonths,
    schedule,
    assumptions: [
      "Reducing-balance EMI on the beneficiary-facing interest rate published for this scheme.",
      `Moratorium of ${moratoriumMonths} month(s) assumed before quarterly/monthly repayment begins.`,
      "This is an estimate for planning purposes, not a sanctioned repayment schedule.",
    ],
  };
}
