export function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString("sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} \u20AC`;
}

export function formatCurrencyPlain(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

export function parseDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split(".");
  return `${year}-${month}-${day}`;
}

export function toVariabilnySymbol(invoiceNumber: string): string {
  return invoiceNumber.replace(/[^0-9]/g, "");
}
