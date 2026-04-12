import { describe, it, expect } from "vitest";
import { generateCsv } from "../src/lib/csv-export";
import { Invoice, AdvanceInvoice } from "../src/lib/types";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "1",
    type: "ostra",
    invoice_number: "202604-01",
    client_name: "Test Client s. r. o.",
    client_street: "Main St 1",
    client_city: "Bratislava",
    client_ico: "12345678",
    client_dic: "SK12345678",
    client_ic_dph: "",
    service_description: "Legal services",
    invoice_text: "Legal services rendered",
    billing_type: "hourly",
    unit: "hod.",
    quantity: 5,
    unit_price: 200,
    price_without_vat: 1000,
    vat_rate: 0,
    vat_amount: 0,
    total_with_vat: 1000,
    advance_invoice_id: null,
    advance_invoice_number: null,
    advance_deduction: 0,
    amount_due: 1000,
    date_of_supply: "2026-04-01",
    date_of_issue: "2026-04-12",
    date_due: "2026-04-26",
    issued_by: "Marek",
    payment_method: "bezhotovostne",
    note: "",
    is_paid: false,
    paid_date: null,
    created_at: "2026-04-12T10:00:00Z",
    ...overrides,
  };
}

function makeAdvance(overrides: Partial<AdvanceInvoice> = {}): AdvanceInvoice {
  return {
    id: "1",
    invoice_number: "ZAL26001",
    client_name: "Test Client s. r. o.",
    client_street: "Main St 1",
    client_city: "Bratislava",
    client_ico: "12345678",
    client_dic: "SK12345678",
    client_ic_dph: "",
    advance_amount: 500,
    remaining_balance: 500,
    date_of_issue: "2026-03-01",
    date_due: "2026-03-15",
    description: "Advance payment",
    issued_by: "Marek",
    payment_method: "bezhotovostne",
    is_paid: true,
    paid_date: "2026-03-10",
    status: "uhradená",
    created_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

describe("generateCsv", () => {
  it("starts with UTF-8 BOM", () => {
    const csv = generateCsv([], []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("uses semicolons as delimiters", () => {
    const csv = generateCsv([makeInvoice()], []);
    const lines = csv.split("\n");
    const headerLine = lines[0].replace("\uFEFF", "");
    expect(headerLine).toContain(";");
    expect(headerLine.split(";").length).toBeGreaterThan(1);
  });

  it("includes Slovak column headers", () => {
    const csv = generateCsv([], []);
    expect(csv).toContain("Číslo faktúry");
    expect(csv).toContain("Klient");
    expect(csv).toContain("Dátum vystavenia");
    expect(csv).toContain("K úhrade");
    expect(csv).toContain("Zaplatené");
  });

  it("includes invoice data in the output", () => {
    const csv = generateCsv([makeInvoice()], []);
    expect(csv).toContain("202604-01");
    expect(csv).toContain("Test Client s. r. o.");
  });

  it("includes advance invoice data in the output", () => {
    const csv = generateCsv([], [makeAdvance()]);
    expect(csv).toContain("ZAL26001");
    expect(csv).toContain("zálohová");
  });

  it("includes both invoice types when both provided", () => {
    const csv = generateCsv([makeInvoice()], [makeAdvance()]);
    expect(csv).toContain("202604-01");
    expect(csv).toContain("ZAL26001");
  });

  it("sorts invoices by date_of_issue descending", () => {
    const inv1 = makeInvoice({ invoice_number: "202603-01", date_of_issue: "2026-03-01" });
    const inv2 = makeInvoice({ invoice_number: "202604-01", date_of_issue: "2026-04-12" });
    const inv3 = makeInvoice({ invoice_number: "202601-01", date_of_issue: "2026-01-15" });
    const csv = generateCsv([inv1, inv3, inv2], []);
    const pos1 = csv.indexOf("202604-01");
    const pos2 = csv.indexOf("202603-01");
    const pos3 = csv.indexOf("202601-01");
    expect(pos1).toBeLessThan(pos2);
    expect(pos2).toBeLessThan(pos3);
  });

  it("formats dates as DD.MM.YYYY", () => {
    const csv = generateCsv([makeInvoice()], []);
    expect(csv).toContain("12.04.2026");
    expect(csv).toContain("26.04.2026");
  });

  it("formats paid status as 'áno' or 'nie'", () => {
    const paidInvoice = makeInvoice({ is_paid: true, paid_date: "2026-04-20" });
    const unpaidInvoice = makeInvoice({ invoice_number: "202604-02", is_paid: false });
    const csv = generateCsv([paidInvoice, unpaidInvoice], []);
    expect(csv).toContain("áno");
    expect(csv).toContain("nie");
  });

  it("formats paid_date as DD.MM.YYYY when present", () => {
    const paidInvoice = makeInvoice({ is_paid: true, paid_date: "2026-04-20" });
    const csv = generateCsv([paidInvoice], []);
    expect(csv).toContain("20.04.2026");
  });

  it("leaves paid_date empty when not paid", () => {
    const csv = generateCsv([makeInvoice({ is_paid: false, paid_date: null })], []);
    const lines = csv.split("\n");
    const dataLine = lines[1];
    expect(dataLine.endsWith(";nie;")).toBe(true);
  });

  it("uses comma as decimal separator for currency", () => {
    const csv = generateCsv([makeInvoice({ price_without_vat: 1234.56 })], []);
    expect(csv).toContain("1234,56");
    // Currency values should use comma, not dot as decimal separator
    // (dates like 01.04.2026 also contain dots but those are not decimals)
    expect(csv).not.toContain("1234.56");
  });
});
