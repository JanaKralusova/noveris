import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyPlain,
  formatDate,
  parseDate,
  toVariabilnySymbol,
} from "../src/lib/formatting";

describe("formatCurrency", () => {
  it("formats a typical amount with Slovak locale", () => {
    const result = formatCurrency(1234.56);
    // sk-SK locale uses non-breaking space (U+00A0) as thousands separator
    expect(result).toBe("1\u00A0234,56 €");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toBe("0,00 €");
  });

  it("formats large numbers", () => {
    const result = formatCurrency(1000000.00);
    expect(result).toBe("1\u00A0000\u00A0000,00 €");
  });

  it("appends euro sign", () => {
    const result = formatCurrency(99.99);
    expect(result).toContain("€");
  });

  it("uses comma as decimal separator", () => {
    const result = formatCurrency(1.5);
    expect(result).toContain(",");
    expect(result).not.toContain(".");
  });
});

describe("formatCurrencyPlain", () => {
  it("formats with comma decimal for CSV", () => {
    expect(formatCurrencyPlain(1234.56)).toBe("1234,56");
  });

  it("formats zero", () => {
    expect(formatCurrencyPlain(0)).toBe("0,00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrencyPlain(99.999)).toBe("100,00");
  });

  it("pads to 2 decimal places", () => {
    expect(formatCurrencyPlain(5)).toBe("5,00");
  });
});

describe("formatDate", () => {
  it("converts ISO date to DD.MM.YYYY", () => {
    expect(formatDate("2026-04-12")).toBe("12.04.2026");
  });

  it("handles January correctly", () => {
    expect(formatDate("2026-01-01")).toBe("01.01.2026");
  });

  it("handles end of year", () => {
    expect(formatDate("2025-12-31")).toBe("31.12.2025");
  });
});

describe("parseDate", () => {
  it("converts DD.MM.YYYY to ISO", () => {
    expect(parseDate("12.04.2026")).toBe("2026-04-12");
  });

  it("handles January correctly", () => {
    expect(parseDate("01.01.2026")).toBe("2026-01-01");
  });

  it("handles end of year", () => {
    expect(parseDate("31.12.2025")).toBe("2025-12-31");
  });
});

describe("toVariabilnySymbol", () => {
  it("strips non-numeric chars from invoice number", () => {
    expect(toVariabilnySymbol("202604-01")).toBe("20260401");
  });

  it("strips letters from advance number", () => {
    expect(toVariabilnySymbol("ZAL26001")).toBe("26001");
  });

  it("returns empty string for all non-numeric", () => {
    expect(toVariabilnySymbol("ABC-XYZ")).toBe("");
  });

  it("returns unchanged for already numeric string", () => {
    expect(toVariabilnySymbol("20260401")).toBe("20260401");
  });
});
