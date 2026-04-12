import { Invoice, AdvanceInvoice } from "./types";

export function nextInvoiceNumber(
  invoices: Invoice[],
  dateOfIssue: string
): string {
  const [year, month] = dateOfIssue.split("-");
  const prefix = `${year}${month}`;

  const existing = invoices
    .filter((inv) => inv.invoice_number.startsWith(prefix + "-"))
    .map((inv) => {
      const parts = inv.invoice_number.split("-");
      return parseInt(parts[parts.length - 1], 10);
    })
    .filter((n) => !isNaN(n));

  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}-${String(next).padStart(2, "0")}`;
}

export function nextAdvanceNumber(
  advances: AdvanceInvoice[],
  dateOfIssue: string
): string {
  const year = dateOfIssue.split("-")[0];
  const yy = year.slice(-2);
  const prefix = `ZAL${yy}`;

  const existing = advances
    .filter((adv) => adv.invoice_number.startsWith(prefix))
    .map((adv) => {
      const suffix = adv.invoice_number.slice(prefix.length);
      return parseInt(suffix, 10);
    })
    .filter((n) => !isNaN(n));

  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export interface InvoiceTotals {
  price_without_vat: number;
  vat_amount: number;
  total_with_vat: number;
}

export function computeInvoiceTotals(
  quantity: number,
  unitPrice: number,
  vatRate: number
): InvoiceTotals {
  const price_without_vat = Math.round(quantity * unitPrice * 100) / 100;
  const vat_amount = Math.round(price_without_vat * vatRate * 100) / 100;
  const total_with_vat = Math.round((price_without_vat + vat_amount) * 100) / 100;
  return { price_without_vat, vat_amount, total_with_vat };
}

export interface AdvanceDeduction {
  advance_deduction: number;
  amount_due: number;
}

export function computeAdvanceDeduction(
  totalWithVat: number,
  remainingBalance: number
): AdvanceDeduction {
  const advance_deduction = Math.min(totalWithVat, remainingBalance);
  const amount_due = Math.round((totalWithVat - advance_deduction) * 100) / 100;
  return { advance_deduction, amount_due };
}

export function validateInvoice(invoice: Partial<Invoice>): string[] {
  const errors: string[] = [];

  if (!invoice.client_name || invoice.client_name.trim() === "") {
    errors.push("Meno klienta je povinné");
  }

  if (invoice.quantity !== undefined && invoice.quantity <= 0) {
    errors.push("Množstvo musí byť väčšie ako 0");
  }

  if (invoice.unit_price !== undefined && invoice.unit_price < 0) {
    errors.push("Jednotková cena nesmie byť záporná");
  }

  if (invoice.date_of_issue && invoice.date_due) {
    if (invoice.date_due < invoice.date_of_issue) {
      errors.push("Dátum splatnosti nesmie byť pred dátumom vystavenia");
    }
  }

  if (invoice.date_of_issue && invoice.date_of_supply) {
    if (invoice.date_of_supply > invoice.date_of_issue) {
      errors.push("Dátum dodania nesmie byť po dátume vystavenia");
    }
  }

  return errors;
}

export function validateAdvanceInvoice(
  advance: Partial<AdvanceInvoice>
): string[] {
  const errors: string[] = [];

  if (!advance.client_name || advance.client_name.trim() === "") {
    errors.push("Meno klienta je povinné");
  }

  if (advance.advance_amount !== undefined && advance.advance_amount <= 0) {
    errors.push("Suma zálohy musí byť väčšia ako 0");
  }

  return errors;
}
