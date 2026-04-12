import { Invoice, AdvanceInvoice } from "./types";
import { formatDate, formatCurrencyPlain } from "./formatting";

const HEADERS = [
  "Číslo faktúry",
  "Typ",
  "Klient",
  "IČO klienta",
  "DIČ klienta",
  "Dátum vystavenia",
  "Dátum splatnosti",
  "Dátum dodania",
  "Suma bez DPH",
  "DPH",
  "Celkom",
  "Záloha",
  "K úhrade",
  "Zaplatené",
  "Dátum úhrady",
].join(";");

export function generateCsv(
  invoices: Invoice[],
  advances: AdvanceInvoice[]
): string {
  const invoiceRows = [...invoices]
    .sort((a, b) => b.date_of_issue.localeCompare(a.date_of_issue))
    .map((inv) => {
      return [
        inv.invoice_number,
        inv.type,
        inv.client_name,
        inv.client_ico,
        inv.client_dic,
        formatDate(inv.date_of_issue),
        formatDate(inv.date_due),
        formatDate(inv.date_of_supply),
        formatCurrencyPlain(inv.price_without_vat),
        formatCurrencyPlain(inv.vat_amount),
        formatCurrencyPlain(inv.total_with_vat),
        formatCurrencyPlain(inv.advance_deduction),
        formatCurrencyPlain(inv.amount_due),
        inv.is_paid ? "áno" : "nie",
        inv.paid_date ? formatDate(inv.paid_date) : "",
      ].join(";");
    });

  const advanceRows = [...advances]
    .sort((a, b) => b.date_of_issue.localeCompare(a.date_of_issue))
    .map((adv) => {
      return [
        adv.invoice_number,
        "zálohová",
        adv.client_name,
        adv.client_ico,
        adv.client_dic,
        formatDate(adv.date_of_issue),
        formatDate(adv.date_due),
        "",
        "",
        "",
        formatCurrencyPlain(adv.advance_amount),
        "",
        formatCurrencyPlain(adv.remaining_balance),
        adv.is_paid ? "áno" : "nie",
        adv.paid_date ? formatDate(adv.paid_date) : "",
      ].join(";");
    });

  const allRows = [...invoiceRows, ...advanceRows];

  return "\uFEFF" + HEADERS + "\n" + allRows.join("\n");
}
