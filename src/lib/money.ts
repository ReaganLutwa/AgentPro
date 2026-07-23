export function fmtMoney(v: number, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("en-US").format(v)}`;
}

export const TXN_TYPES = [
  { value: "WITHDRAWAL", label: "Withdrawal (customer cashes out)" },
  { value: "DEPOSIT", label: "Deposit (customer cashes in)" },
  { value: "AIRTIME", label: "Airtime / bill payment" },
  { value: "FLOAT_BUY", label: "Float purchase" },
  { value: "ADJUSTMENT", label: "Adjustment" },
] as const;

export const TXN_LABEL: Record<string, string> = {
  WITHDRAWAL: "Withdrawal",
  DEPOSIT: "Deposit",
  AIRTIME: "Airtime/Bill",
  FLOAT_BUY: "Float purchase",
  ADJUSTMENT: "Adjustment",
};
