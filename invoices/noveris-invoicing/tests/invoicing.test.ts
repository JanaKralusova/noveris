import { describe, it, expect } from "vitest";
import {
  nextInvoiceNumber,
  nextAdvanceNumber,
  computeInvoiceTotals,
  computeAdvanceDeduction,
  validateInvoice,
  validateAdvanceInvoice,
} from "../src/lib/invoicing";
import { Invoice, AdvanceInvoice } from "../src/lib/types";

// Helper to create a minimal Invoice stub
function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "1",
    type: "ostra",
    invoice_number: "202604-01",
    client_name: "Test Client",
    client_street: "Main St",
    client_city: "Bratislava",
    client_ico: "12345678",
    client_dic: "SK12345678",
    client_ic_dph: "",
    service_description: "Legal services",
    invoice_text: "Legal services",
    billing_type: "hourly",
    unit: "hod.",
    quantity: 1,
    unit_price: 100,
    price_without_vat: 100,
    vat_rate: 0,
    vat_amount: 0,
    total_with_vat: 100,
    advance_invoice_id: null,
    advance_invoice_number: null,
    advance_deduction: 0,
    amount_due: 100,
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

// Helper to create a minimal AdvanceInvoice stub
function makeAdvance(overrides: Partial<AdvanceInvoice> = {}): AdvanceInvoice {
  return {
    id: "1",
    invoice_number: "ZAL26001",
    client_name: "Test Client",
    client_street: "Main St",
    client_city: "Bratislava",
    client_ico: "12345678",
    client_dic: "SK12345678",
    client_ic_dph: "",
    advance_amount: 500,
    remaining_balance: 500,
    date_of_issue: "2026-04-12",
    date_due: "2026-04-26",
    description: "Advance for legal services",
    issued_by: "Marek",
    payment_method: "bezhotovostne",
    is_paid: false,
    paid_date: null,
    status: "neuhradená",
    created_at: "2026-04-12T10:00:00Z",
    ...overrides,
  };
}

describe("nextInvoiceNumber", () => {
  it("returns '202604-01' when no invoices exist for that month", () => {
    expect(nextInvoiceNumber([], "2026-04-12")).toBe("202604-01");
  });

  it("increments from existing invoice in same month", () => {
    const invoices = [makeInvoice({ invoice_number: "202604-01" })];
    expect(nextInvoiceNumber(invoices, "2026-04-12")).toBe("202604-02");
  });

  it("increments to 03 when 01 and 02 exist", () => {
    const invoices = [
      makeInvoice({ invoice_number: "202604-01" }),
      makeInvoice({ invoice_number: "202604-02" }),
    ];
    expect(nextInvoiceNumber(invoices, "2026-04-12")).toBe("202604-03");
  });

  it("ignores invoices from other months", () => {
    const invoices = [
      makeInvoice({ invoice_number: "202603-05" }),
      makeInvoice({ invoice_number: "202605-01" }),
    ];
    expect(nextInvoiceNumber(invoices, "2026-04-01")).toBe("202604-01");
  });

  it("pads single-digit number with leading zero", () => {
    const result = nextInvoiceNumber([], "2026-04-01");
    expect(result).toMatch(/^\d{6}-\d{2}$/);
  });
});

describe("nextAdvanceNumber", () => {
  it("returns 'ZAL26001' when no advances exist for that year", () => {
    expect(nextAdvanceNumber([], "2026-04-12")).toBe("ZAL26001");
  });

  it("increments from existing advance in same year", () => {
    const advances = [makeAdvance({ invoice_number: "ZAL26001" })];
    expect(nextAdvanceNumber(advances, "2026-01-01")).toBe("ZAL26002");
  });

  it("increments to 003 when 001 and 002 exist", () => {
    const advances = [
      makeAdvance({ invoice_number: "ZAL26001" }),
      makeAdvance({ invoice_number: "ZAL26002" }),
    ];
    expect(nextAdvanceNumber(advances, "2026-06-01")).toBe("ZAL26003");
  });

  it("ignores advances from other years", () => {
    const advances = [
      makeAdvance({ invoice_number: "ZAL25005" }),
      makeAdvance({ invoice_number: "ZAL24003" }),
    ];
    expect(nextAdvanceNumber(advances, "2026-01-01")).toBe("ZAL26001");
  });

  it("handles year 2027 correctly", () => {
    const advances = [makeAdvance({ invoice_number: "ZAL27001" })];
    expect(nextAdvanceNumber(advances, "2027-03-15")).toBe("ZAL27002");
  });

  it("pads with leading zeros to 3 digits", () => {
    const result = nextAdvanceNumber([], "2026-04-01");
    expect(result).toMatch(/^ZAL\d{2}\d{3}$/);
  });
});

describe("computeInvoiceTotals", () => {
  it("returns correct totals with no VAT (rate=0)", () => {
    const result = computeInvoiceTotals(10, 100, 0);
    expect(result.price_without_vat).toBe(1000);
    expect(result.vat_amount).toBe(0);
    expect(result.total_with_vat).toBe(1000);
  });

  it("returns correct totals with 20% VAT", () => {
    const result = computeInvoiceTotals(10, 100, 0.2);
    expect(result.price_without_vat).toBe(1000);
    expect(result.vat_amount).toBe(200);
    expect(result.total_with_vat).toBe(1200);
  });

  it("handles fixed billing (quantity=1)", () => {
    const result = computeInvoiceTotals(1, 500, 0.2);
    expect(result.price_without_vat).toBe(500);
    expect(result.vat_amount).toBe(100);
    expect(result.total_with_vat).toBe(600);
  });

  it("rounds correctly: 3 * 33.33 = 99.99, VAT=20.00, total=119.99", () => {
    const result = computeInvoiceTotals(3, 33.33, 0.2);
    expect(result.price_without_vat).toBe(99.99);
    expect(result.vat_amount).toBe(20.00);
    expect(result.total_with_vat).toBe(119.99);
  });

  it("handles fractional hours correctly", () => {
    const result = computeInvoiceTotals(2.5, 80, 0);
    expect(result.price_without_vat).toBe(200);
    expect(result.vat_amount).toBe(0);
    expect(result.total_with_vat).toBe(200);
  });
});

describe("computeAdvanceDeduction", () => {
  it("partial deduction: advance covers part of invoice", () => {
    const result = computeAdvanceDeduction(1000, 300);
    expect(result.advance_deduction).toBe(300);
    expect(result.amount_due).toBe(700);
  });

  it("full cover: advance covers entire invoice", () => {
    const result = computeAdvanceDeduction(500, 1000);
    expect(result.advance_deduction).toBe(500);
    expect(result.amount_due).toBe(0);
  });

  it("exact match: advance equals invoice total", () => {
    const result = computeAdvanceDeduction(500, 500);
    expect(result.advance_deduction).toBe(500);
    expect(result.amount_due).toBe(0);
  });

  it("no advance: zero remaining balance", () => {
    const result = computeAdvanceDeduction(1000, 0);
    expect(result.advance_deduction).toBe(0);
    expect(result.amount_due).toBe(1000);
  });
});

describe("validateInvoice", () => {
  it("valid invoice passes with no errors", () => {
    const errors = validateInvoice(makeInvoice());
    expect(errors).toHaveLength(0);
  });

  it("returns error for missing client_name", () => {
    const errors = validateInvoice(makeInvoice({ client_name: "" }));
    expect(errors).toContain("Meno klienta je povinné");
  });

  it("returns error for quantity <= 0", () => {
    const errorsZero = validateInvoice(makeInvoice({ quantity: 0 }));
    expect(errorsZero.some((e) => e.includes("Množstvo"))).toBe(true);

    const errorsNeg = validateInvoice(makeInvoice({ quantity: -1 }));
    expect(errorsNeg.some((e) => e.includes("Množstvo"))).toBe(true);
  });

  it("returns error when date_due is before date_of_issue", () => {
    const errors = validateInvoice(
      makeInvoice({ date_of_issue: "2026-04-12", date_due: "2026-04-01" })
    );
    expect(errors.some((e) => e.includes("splatnosti"))).toBe(true);
  });

  it("returns error when date_of_supply is after date_of_issue", () => {
    const errors = validateInvoice(
      makeInvoice({ date_of_issue: "2026-04-12", date_of_supply: "2026-04-15" })
    );
    expect(errors.some((e) => e.includes("dodania"))).toBe(true);
  });

  it("can return multiple errors", () => {
    const errors = validateInvoice({ client_name: "", quantity: -1 });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("validateAdvanceInvoice", () => {
  it("valid advance invoice passes with no errors", () => {
    const errors = validateAdvanceInvoice(makeAdvance());
    expect(errors).toHaveLength(0);
  });

  it("returns error for missing client_name", () => {
    const errors = validateAdvanceInvoice(makeAdvance({ client_name: "" }));
    expect(errors).toContain("Meno klienta je povinné");
  });

  it("returns error for advance_amount <= 0", () => {
    const errorsZero = validateAdvanceInvoice(makeAdvance({ advance_amount: 0 }));
    expect(errorsZero.some((e) => e.includes("zálohy"))).toBe(true);

    const errorsNeg = validateAdvanceInvoice(makeAdvance({ advance_amount: -100 }));
    expect(errorsNeg.some((e) => e.includes("zálohy"))).toBe(true);
  });
});
