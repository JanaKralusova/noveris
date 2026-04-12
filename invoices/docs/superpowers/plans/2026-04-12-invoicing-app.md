# Noveris Legal Invoicing App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained macOS desktop invoicing app for Noveris Legal using Tauri v2 + React + TypeScript.

**Architecture:** Tauri v2 shell with default Rust scaffolding (no custom commands). All business logic in TypeScript. React SPA with shadcn/ui + Tailwind using the Noveris brand tokens. JSONL flat-file storage via Tauri FS plugin. PDF generation via @react-pdf/renderer with embedded fonts.

**Tech Stack:** Tauri v2, React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, @react-pdf/renderer, vitest, React Router

**Spec:** `docs/superpowers/specs/2026-04-12-invoicing-app-design.md`

**Brand reference:** `/Users/mbr/projects/NoverisLegal/index.html` (website with color palette and typography)

---

## File Structure

```
noveris-invoicing/
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs                    # Tauri setup — generated, not modified
│   │   └── main.rs                   # Entry point — generated, not modified
│   ├── Cargo.toml                    # Tauri deps — generated, add fs+dialog plugins
│   ├── tauri.conf.json               # Window config, permissions, app identifier
│   ├── capabilities/
│   │   └── default.json              # Permissions for fs, dialog, path plugins
│   └── icons/                        # Generated from logo
├── src/
│   ├── main.tsx                      # React entry, renders App
│   ├── App.tsx                       # React Router + Layout shell
│   ├── lib/
│   │   ├── types.ts                  # All TypeScript interfaces
│   │   ├── storage.ts                # JSONL + JSON read/write via Tauri FS
│   │   ├── invoicing.ts              # Auto-numbering, calculations, validation
│   │   ├── csv-export.ts             # CSV generation
│   │   ��── formatting.ts             # Currency, date, variabilný symbol formatters
│   ��   ├── pdf/
│   │   │   ├── register-fonts.ts     # Font.register() for Newsreader + Manrope
│   ���   │   ├── pdf-styles.ts         # Shared @react-pdf StyleSheet
│   │   │   ├── invoice-pdf.tsx       # Ostrá + Vyúčtovacia PDF template
│   │   │   └── advance-pdf.tsx       # Zálohová PDF template
│   │   └── defaults.ts              # Default settings, initial data
│   ├── hooks/
│   │   ├── use-settings.ts           # Settings CRUD hook
│   │   ├── use-clients.ts            # Clients CRUD hook
│   │   ├── use-invoices.ts           # Invoices CRUD hook
│   │   └── use-advance-invoices.ts   # Advance invoices CRUD hook
│   ├── pages/
│   │   ├── dashboard.tsx             # Dashboard with stats + recent invoices
���   │   ├── invoice-list.tsx          # Unified invoice list with filters
│   │   ���── invoice-form.tsx          # Create/edit form for all 3 types
��   │   ├── invoice-detail.tsx        # Read-only detail + actions
│   │   ├── client-list.tsx           # Client directory
│   │   └── settings.tsx              # Supplier settings + export
│   ��── components/
│   ���   ├── layout.tsx                # Sidebar + main content wrapper
��   │   ├── sidebar.tsx               # Nav sidebar
│   ��   ├── client-autocomplete.tsx   # Client search/select with auto-fill
│   │   ├── invoice-summary-card.tsx  # Real-time computed totals
│   │   └── status-badge.tsx          # Invoice status badge component
│   ├── assets/
│   │   ├── fonts/
│   │   │   ├── Newsreader-Regular.ttf
│   │   │   ├── Newsreader-Italic.ttf
│   ���   │   ├── Newsreader-Bold.ttf
│   │   │   ├── Manrope-Regular.ttf
│   │   │   ├── Manrope-Medium.ttf
│   │   │   └── Manrope-Bold.ttf
│   │   └── logo-dark.png            # Copied from parent project
│   └── index.css                     # Tailwind directives + custom tokens
├── tests/
│   ├── invoicing.test.ts             # Auto-numbering, calculations, validation
│   ├── storage.test.ts               # JSONL read/write
│   ├── csv-export.test.ts            # CSV generation
│   └── formatting.test.ts            # Currency, date formatters
├── package.json
├��─ tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── vitest.config.ts
└── components.json                   # shadcn/ui config
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `noveris-invoicing/` (entire scaffold via create-tauri-app)
- Modify: `noveris-invoicing/package.json` (add deps)
- Modify: `noveris-invoicing/src-tauri/tauri.conf.json` (app config)
- Modify: `noveris-invoicing/src-tauri/Cargo.toml` (plugins)
- Create: `noveris-invoicing/src-tauri/capabilities/default.json` (permissions)

- [ ] **Step 1: Create Tauri + React + TS project**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices
npm create tauri-app@latest noveris-invoicing -- --template react-ts --manager npm
```

Expected: Creates `noveris-invoicing/` with Tauri + React + TS + Vite scaffold.

- [ ] **Step 2: Install frontend dependencies**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm install react-router-dom @react-pdf/renderer uuid
npm install -D @types/uuid vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Install Tauri plugins**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm install @tauri-apps/plugin-fs @tauri-apps/plugin-dialog @tauri-apps/api
```

Add the Rust side of the plugins to `src-tauri/Cargo.toml` — add to `[dependencies]`:

```toml
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
```

Register plugins in `src-tauri/src/lib.rs`:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Configure Tauri app settings**

Update `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Noveris Invoicing",
  "version": "1.0.0",
  "identifier": "com.noveris.invoicing",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "title": "Noveris Invoicing",
    "windows": [
      {
        "title": "Noveris Invoicing",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 600,
        "resizable": true
      }
    ]
  }
}
```

- [ ] **Step 5: Configure plugin permissions**

Create `src-tauri/capabilities/default.json`:

```json
{
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    "fs:allow-appdata-read-recursive",
    "fs:allow-appdata-write-recursive",
    "fs:allow-appdata-meta-recursive",
    "dialog:default",
    "dialog:allow-save",
    "dialog:allow-open"
  ]
}
```

- [ ] **Step 6: Configure Vitest**

Create `noveris-invoicing/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: Verify scaffold builds**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm run build
```

Expected: Vite builds successfully to `dist/`.

- [ ] **Step 8: Commit**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
git init
git add -A
git commit -m "Scaffold Tauri + React + TS project"
```

---

## Task 2: Tailwind CSS + shadcn/ui + Noveris Design Tokens

**Files:**
- Modify: `noveris-invoicing/package.json` (tailwind deps)
- Create: `noveris-invoicing/src/index.css` (Tailwind directives + tokens)
- Create: `noveris-invoicing/tailwind.config.ts` (Noveris colors + fonts)
- Create: `noveris-invoicing/components.json` (shadcn config)
- Modify: `noveris-invoicing/src/main.tsx` (import CSS)

- [ ] **Step 1: Install Tailwind CSS v4 + dependencies**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm install -D tailwindcss @tailwindcss/vite
```

Add the Tailwind Vite plugin to `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
```

- [ ] **Step 2: Create Tailwind CSS file with Noveris design tokens**

Create `src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Noveris Legal color palette (from website) */
  --color-primary: #6d5b47;
  --color-primary-container: #c6af97;
  --color-on-primary: #ffffff;
  --color-secondary: #735c00;
  --color-secondary-container: #fed65b;
  --color-on-secondary: #ffffff;
  --color-tertiary: #6c5b4d;
  --color-background: #fcf9f2;
  --color-surface: #fcf9f2;
  --color-surface-dim: #dcdad3;
  --color-surface-bright: #fcf9f2;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f6f3ec;
  --color-surface-container: #f0eee7;
  --color-surface-container-high: #ebe8e1;
  --color-surface-container-highest: #e5e2db;
  --color-on-surface: #1c1c18;
  --color-on-surface-variant: #4d4635;
  --color-outline: #7f7663;
  --color-outline-variant: #d0c5af;
  --color-inverse-surface: #31312c;
  --color-inverse-on-surface: #f3f0ea;
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;

  /* Fonts */
  --font-headline: "Newsreader", serif;
  --font-body: "Manrope", sans-serif;
  --font-label: "Manrope", sans-serif;

  /* Border radius — minimal, matching website */
  --radius-sm: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

/* Google Fonts — loaded from local assets in production */
@font-face {
  font-family: "Newsreader";
  src: url("./assets/fonts/Newsreader-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "Newsreader";
  src: url("./assets/fonts/Newsreader-Italic.ttf") format("truetype");
  font-weight: 400;
  font-style: italic;
}

@font-face {
  font-family: "Newsreader";
  src: url("./assets/fonts/Newsreader-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: "Manrope";
  src: url("./assets/fonts/Manrope-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: "Manrope";
  src: url("./assets/fonts/Manrope-Medium.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
}

@font-face {
  font-family: "Manrope";
  src: url("./assets/fonts/Manrope-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-on-surface);
}
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npx shadcn@latest init
```

When prompted: Style = Default, Base color = Neutral, CSS variables = Yes. This creates `components.json` and adds shadcn utility classes.

- [ ] **Step 4: Install commonly needed shadcn components**

```bash
npx shadcn@latest add button input label select textarea tabs table badge dialog card dropdown-menu separator toast popover command calendar
```

- [ ] **Step 5: Download font files**

Download TTF files from Google Fonts and place in `src/assets/fonts/`:

```bash
mkdir -p src/assets/fonts
# Download Newsreader (Regular, Italic, Bold) and Manrope (Regular, Medium, Bold)
# From https://fonts.google.com/specimen/Newsreader and https://fonts.google.com/specimen/Manrope
# Place .ttf files in src/assets/fonts/
```

Also copy the logo:

```bash
cp /Users/mbr/projects/NoverisLegal/logo-dark.png src/assets/logo-dark.png
```

- [ ] **Step 6: Update main.tsx to import CSS**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Verify Tailwind works**

Replace `src/App.tsx` temporarily:

```typescript
function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="font-headline text-4xl text-primary italic">
        Noveris Invoicing
      </h1>
      <p className="font-body text-on-surface-variant mt-2">
        Design tokens working.
      </p>
    </div>
  );
}

export default App;
```

```bash
npm run dev
```

Expected: Page shows "Noveris Invoicing" in Newsreader italic, warm brown color on cream background.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add Tailwind, shadcn/ui, Noveris design tokens"
```

---

## Task 3: TypeScript Types + Formatting Utilities

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/formatting.ts`
- Create: `src/lib/defaults.ts`
- Create: `tests/formatting.test.ts`

- [ ] **Step 1: Write formatting tests**

Create `tests/formatting.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatCurrencyPlain,
  toVariabilnySymbol,
  parseDate,
} from "../src/lib/formatting";

describe("formatCurrency", () => {
  it("formats with Euro symbol and Slovak locale", () => {
    expect(formatCurrency(1234.56)).toBe("1 234,56 \u20AC");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("0,00 \u20AC");
  });

  it("formats large numbers", () => {
    expect(formatCurrency(99999.99)).toBe("99 999,99 \u20AC");
  });
});

describe("formatCurrencyPlain", () => {
  it("formats without symbol for CSV", () => {
    expect(formatCurrencyPlain(1234.56)).toBe("1234,56");
  });

  it("formats zero", () => {
    expect(formatCurrencyPlain(0)).toBe("0,00");
  });
});

describe("formatDate", () => {
  it("formats ISO date to DD.MM.YYYY", () => {
    expect(formatDate("2026-04-15")).toBe("15.04.2026");
  });

  it("formats first day of year", () => {
    expect(formatDate("2026-01-01")).toBe("01.01.2026");
  });
});

describe("parseDate", () => {
  it("parses DD.MM.YYYY to ISO", () => {
    expect(parseDate("15.04.2026")).toBe("2026-04-15");
  });
});

describe("toVariabilnySymbol", () => {
  it("strips dash from standard invoice number", () => {
    expect(toVariabilnySymbol("202604-01")).toBe("20260401");
  });

  it("extracts digits from advance invoice number", () => {
    expect(toVariabilnySymbol("ZAL26001")).toBe("26001");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm run test
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Create types.ts**

Create `src/lib/types.ts`:

```typescript
export type InvoiceType = "ostra" | "vyuctovacia";
export type BillingType = "hourly" | "fixed";
export type AdvanceStatus = "uhradená" | "neuhradená";

export interface Invoice {
  id: string;
  type: InvoiceType;
  invoice_number: string;
  client_name: string;
  client_street: string;
  client_city: string;
  client_ico: string;
  client_dic: string;
  client_ic_dph: string;
  service_description: string;
  invoice_text: string;
  billing_type: BillingType;
  unit: "hod." | "ks";
  quantity: number;
  unit_price: number;
  price_without_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  advance_invoice_id: string | null;
  advance_invoice_number: string | null;
  advance_deduction: number;
  amount_due: number;
  date_of_supply: string;
  date_of_issue: string;
  date_due: string;
  issued_by: string;
  payment_method: string;
  note: string;
  is_paid: boolean;
  paid_date: string | null;
  created_at: string;
}

export interface AdvanceInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_street: string;
  client_city: string;
  client_ico: string;
  client_dic: string;
  client_ic_dph: string;
  advance_amount: number;
  remaining_balance: number;
  date_of_issue: string;
  date_due: string;
  description: string;
  issued_by: string;
  payment_method: string;
  is_paid: boolean;
  paid_date: string | null;
  status: AdvanceStatus;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  street: string;
  city: string;
  ico: string;
  dic: string;
  ic_dph: string;
  last_used: string;
}

export interface Settings {
  supplier_name: string;
  supplier_street: string;
  supplier_city: string;
  supplier_ico: string;
  supplier_dic: string;
  supplier_ic_dph: string;
  supplier_iban: string;
  supplier_bank: string;
  is_vat_payer: boolean;
  vat_rate: number;
  default_payment_method: string;
  default_due_days: number;
}
```

- [ ] **Step 4: Create formatting.ts**

Create `src/lib/formatting.ts`:

```typescript
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
```

- [ ] **Step 5: Create defaults.ts**

Create `src/lib/defaults.ts`:

```typescript
import { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  supplier_name: "Noveris Legal s. r. o.",
  supplier_street: "Turčianska 42",
  supplier_city: "821 09 Bratislava",
  supplier_ico: "57 493 685",
  supplier_dic: "2122782200",
  supplier_ic_dph: "",
  supplier_iban: "SK00 0000 0000 0000 0000 0000",
  supplier_bank: "",
  is_vat_payer: false,
  vat_rate: 0.2,
  default_payment_method: "bezhotovostne",
  default_due_days: 14,
};
```

- [ ] **Step 6: Run tests**

```bash
npm run test
```

Expected: All formatting tests PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add types, formatting utilities, defaults"
```

---

## Task 4: Storage Layer

**Files:**
- Create: `src/lib/storage.ts`
- Create: `tests/storage.test.ts`

- [ ] **Step 1: Write storage tests**

Create `tests/storage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readJsonl, writeJsonl, readJson, writeJson } from "../src/lib/storage";

// Mock Tauri FS plugin
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  BaseDirectory: { AppData: "AppData" },
}));

vi.mock("@tauri-apps/api/path", () => ({
  appDataDir: vi.fn().mockResolvedValue("/mock/app-data"),
}));

import { readTextFile, writeTextFile, exists, mkdir } from "@tauri-apps/plugin-fs";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readJsonl", () => {
  it("parses JSONL file into array", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue(
      '{"id":"1","name":"Alice"}\n{"id":"2","name":"Bob"}\n'
    );

    const result = await readJsonl("test.jsonl");
    expect(result).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  });

  it("returns empty array if file does not exist", async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await readJsonl("test.jsonl");
    expect(result).toEqual([]);
  });

  it("skips empty lines", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue(
      '{"id":"1"}\n\n{"id":"2"}\n\n'
    );

    const result = await readJsonl("test.jsonl");
    expect(result).toEqual([{ id: "1" }, { id: "2" }]);
  });
});

describe("writeJsonl", () => {
  it("writes array as JSONL", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);

    const data = [{ id: "1", name: "Alice" }, { id: "2", name: "Bob" }];
    await writeJsonl("test.jsonl", data);

    expect(writeTextFile).toHaveBeenCalledWith(
      "test.jsonl",
      '{"id":"1","name":"Alice"}\n{"id":"2","name":"Bob"}\n',
      { baseDir: "AppData" }
    );
  });

  it("writes empty string for empty array", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);

    await writeJsonl("test.jsonl", []);

    expect(writeTextFile).toHaveBeenCalledWith("test.jsonl", "", {
      baseDir: "AppData",
    });
  });
});

describe("readJson", () => {
  it("parses JSON file", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(readTextFile).mockResolvedValue('{"key":"value"}');

    const result = await readJson("test.json");
    expect(result).toEqual({ key: "value" });
  });

  it("returns null if file does not exist", async () => {
    vi.mocked(exists).mockResolvedValue(false);

    const result = await readJson("test.json");
    expect(result).toBeNull();
  });
});

describe("writeJson", () => {
  it("writes object as formatted JSON", async () => {
    vi.mocked(exists).mockResolvedValue(true);
    vi.mocked(writeTextFile).mockResolvedValue(undefined);

    await writeJson("test.json", { key: "value" });

    expect(writeTextFile).toHaveBeenCalledWith(
      "test.json",
      '{\n  "key": "value"\n}',
      { baseDir: "AppData" }
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/storage.test.ts
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement storage.ts**

Create `src/lib/storage.ts`:

```typescript
import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

const BASE_DIR = BaseDirectory.AppData;

async function ensureDataDir(): Promise<void> {
  const dirExists = await exists("", { baseDir: BASE_DIR });
  if (!dirExists) {
    await mkdir("", { baseDir: BASE_DIR, recursive: true });
  }
}

export async function readJsonl<T>(filename: string): Promise<T[]> {
  const fileExists = await exists(filename, { baseDir: BASE_DIR });
  if (!fileExists) {
    return [];
  }

  const content = await readTextFile(filename, { baseDir: BASE_DIR });
  return content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as T);
}

export async function writeJsonl<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const content = data.length === 0
    ? ""
    : data.map((item) => JSON.stringify(item)).join("\n") + "\n";
  await writeTextFile(filename, content, { baseDir: BASE_DIR });
}

export async function readJson<T>(filename: string): Promise<T | null> {
  const fileExists = await exists(filename, { baseDir: BASE_DIR });
  if (!fileExists) {
    return null;
  }

  const content = await readTextFile(filename, { baseDir: BASE_DIR });
  return JSON.parse(content) as T;
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const content = JSON.stringify(data, null, 2);
  await writeTextFile(filename, content, { baseDir: BASE_DIR });
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/storage.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add JSONL and JSON storage layer"
```

---

## Task 5: Invoicing Logic (Numbering, Calculations, Validation)

**Files:**
- Create: `src/lib/invoicing.ts`
- Create: `tests/invoicing.test.ts`

- [ ] **Step 1: Write tests for auto-numbering**

Create `tests/invoicing.test.ts`:

```typescript
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

describe("nextInvoiceNumber", () => {
  it("returns 01 for first invoice of the month", () => {
    expect(nextInvoiceNumber([], "2026-04-15")).toBe("202604-01");
  });

  it("increments from existing invoices", () => {
    const existing = [
      { invoice_number: "202604-01" },
      { invoice_number: "202604-02" },
    ] as Invoice[];
    expect(nextInvoiceNumber(existing, "2026-04-15")).toBe("202604-03");
  });

  it("ignores invoices from other months", () => {
    const existing = [
      { invoice_number: "202603-05" },
      { invoice_number: "202604-01" },
    ] as Invoice[];
    expect(nextInvoiceNumber(existing, "2026-04-15")).toBe("202604-02");
  });

  it("uses date_of_issue month, not current month", () => {
    expect(nextInvoiceNumber([], "2026-12-01")).toBe("202612-01");
  });
});

describe("nextAdvanceNumber", () => {
  it("returns 001 for first advance of the year", () => {
    expect(nextAdvanceNumber([], "2026-04-15")).toBe("ZAL26001");
  });

  it("increments from existing advances", () => {
    const existing = [
      { invoice_number: "ZAL26001" },
      { invoice_number: "ZAL26002" },
    ] as AdvanceInvoice[];
    expect(nextAdvanceNumber(existing, "2026-04-15")).toBe("ZAL26003");
  });

  it("ignores advances from other years", () => {
    const existing = [
      { invoice_number: "ZAL25010" },
      { invoice_number: "ZAL26001" },
    ] as AdvanceInvoice[];
    expect(nextAdvanceNumber(existing, "2026-04-15")).toBe("ZAL26002");
  });

  it("handles year 2027", () => {
    expect(nextAdvanceNumber([], "2027-01-01")).toBe("ZAL27001");
  });
});

describe("computeInvoiceTotals", () => {
  it("computes for hourly billing without VAT", () => {
    const result = computeInvoiceTotals(10, 90, 0);
    expect(result.price_without_vat).toBe(900);
    expect(result.vat_amount).toBe(0);
    expect(result.total_with_vat).toBe(900);
  });

  it("computes with 20% VAT", () => {
    const result = computeInvoiceTotals(10, 90, 0.2);
    expect(result.price_without_vat).toBe(900);
    expect(result.vat_amount).toBe(180);
    expect(result.total_with_vat).toBe(1080);
  });

  it("computes for fixed billing (quantity 1)", () => {
    const result = computeInvoiceTotals(1, 500, 0);
    expect(result.price_without_vat).toBe(500);
    expect(result.total_with_vat).toBe(500);
  });

  it("rounds to 2 decimal places", () => {
    const result = computeInvoiceTotals(3, 33.33, 0.2);
    expect(result.price_without_vat).toBe(99.99);
    expect(result.vat_amount).toBe(20);
    expect(result.total_with_vat).toBe(119.99);
  });
});

describe("computeAdvanceDeduction", () => {
  it("deducts full advance when total exceeds advance", () => {
    const result = computeAdvanceDeduction(1000, 500);
    expect(result.advance_deduction).toBe(500);
    expect(result.amount_due).toBe(500);
  });

  it("caps deduction at total when advance exceeds total", () => {
    const result = computeAdvanceDeduction(500, 1000);
    expect(result.advance_deduction).toBe(500);
    expect(result.amount_due).toBe(0);
  });

  it("handles exact match", () => {
    const result = computeAdvanceDeduction(500, 500);
    expect(result.advance_deduction).toBe(500);
    expect(result.amount_due).toBe(0);
  });
});

describe("validateInvoice", () => {
  const validInvoice: Partial<Invoice> = {
    client_name: "Test Client",
    date_of_issue: "2026-04-15",
    date_due: "2026-04-30",
    date_of_supply: "2026-04-15",
    quantity: 10,
    unit_price: 90,
  };

  it("returns no errors for valid invoice", () => {
    expect(validateInvoice(validInvoice)).toEqual([]);
  });

  it("requires client_name", () => {
    const errors = validateInvoice({ ...validInvoice, client_name: "" });
    expect(errors).toContain("Meno klienta je povinné");
  });

  it("requires quantity > 0", () => {
    const errors = validateInvoice({ ...validInvoice, quantity: 0 });
    expect(errors).toContain("Množstvo musí byť väčšie ako 0");
  });

  it("requires due date >= issue date", () => {
    const errors = validateInvoice({
      ...validInvoice,
      date_of_issue: "2026-04-30",
      date_due: "2026-04-15",
    });
    expect(errors).toContain("Dátum splatnosti musí byť po dátume vystavenia");
  });
});

describe("validateAdvanceInvoice", () => {
  const validAdvance: Partial<AdvanceInvoice> = {
    client_name: "Test Client",
    date_of_issue: "2026-04-15",
    date_due: "2026-04-30",
    advance_amount: 500,
  };

  it("returns no errors for valid advance", () => {
    expect(validateAdvanceInvoice(validAdvance)).toEqual([]);
  });

  it("requires advance_amount > 0", () => {
    const errors = validateAdvanceInvoice({ ...validAdvance, advance_amount: 0 });
    expect(errors).toContain("Suma zálohy musí byť väčšia ako 0");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/invoicing.test.ts
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement invoicing.ts**

Create `src/lib/invoicing.ts`:

```typescript
import { Invoice, AdvanceInvoice } from "./types";

export function nextInvoiceNumber(invoices: Invoice[], dateOfIssue: string): string {
  const prefix = dateOfIssue.slice(0, 7).replace("-", "");
  const existing = invoices
    .filter((inv) => inv.invoice_number.startsWith(prefix))
    .map((inv) => parseInt(inv.invoice_number.split("-")[1], 10));

  const maxNN = existing.length > 0 ? Math.max(...existing) : 0;
  return `${prefix}-${String(maxNN + 1).padStart(2, "0")}`;
}

export function nextAdvanceNumber(advances: AdvanceInvoice[], dateOfIssue: string): string {
  const yy = dateOfIssue.slice(2, 4);
  const prefix = `ZAL${yy}`;
  const existing = advances
    .filter((adv) => adv.invoice_number.startsWith(prefix))
    .map((adv) => parseInt(adv.invoice_number.slice(prefix.length), 10));

  const maxNNN = existing.length > 0 ? Math.max(...existing) : 0;
  return `${prefix}${String(maxNNN + 1).padStart(3, "0")}`;
}

export function computeInvoiceTotals(
  quantity: number,
  unitPrice: number,
  vatRate: number
): { price_without_vat: number; vat_amount: number; total_with_vat: number } {
  const price_without_vat = Math.round(quantity * unitPrice * 100) / 100;
  const vat_amount = Math.round(price_without_vat * vatRate * 100) / 100;
  const total_with_vat = Math.round((price_without_vat + vat_amount) * 100) / 100;
  return { price_without_vat, vat_amount, total_with_vat };
}

export function computeAdvanceDeduction(
  totalWithVat: number,
  remainingBalance: number
): { advance_deduction: number; amount_due: number } {
  const advance_deduction = Math.min(totalWithVat, remainingBalance);
  const amount_due = Math.max(0, totalWithVat - advance_deduction);
  return { advance_deduction, amount_due };
}

export function validateInvoice(invoice: Partial<Invoice>): string[] {
  const errors: string[] = [];

  if (!invoice.client_name?.trim()) {
    errors.push("Meno klienta je povinné");
  }
  if (!invoice.date_of_issue) {
    errors.push("Dátum vystavenia je povinný");
  }
  if (!invoice.date_due) {
    errors.push("Dátum splatnosti je povinný");
  }
  if (!invoice.date_of_supply) {
    errors.push("Dátum dodania je povinn��");
  }
  if (invoice.date_of_issue && invoice.date_due && invoice.date_due < invoice.date_of_issue) {
    errors.push("Dátum splatnosti musí byť po dátume vystavenia");
  }
  if (!invoice.quantity || invoice.quantity <= 0) {
    errors.push("Množstvo musí byť väčšie ako 0");
  }
  if (invoice.unit_price === undefined || invoice.unit_price < 0) {
    errors.push("Jednotková cena musí byť nezáporná");
  }

  return errors;
}

export function validateAdvanceInvoice(advance: Partial<AdvanceInvoice>): string[] {
  const errors: string[] = [];

  if (!advance.client_name?.trim()) {
    errors.push("Meno klienta je povinné");
  }
  if (!advance.date_of_issue) {
    errors.push("Dátum vystavenia je povinný");
  }
  if (!advance.date_due) {
    errors.push("Dátum splatnosti je povinný");
  }
  if (advance.date_of_issue && advance.date_due && advance.date_due < advance.date_of_issue) {
    errors.push("Dátum splatnosti musí byť po dátume vystavenia");
  }
  if (!advance.advance_amount || advance.advance_amount <= 0) {
    errors.push("Suma zálohy musí byť väčšia ako 0");
  }

  return errors;
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/invoicing.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add invoicing logic with numbering and validation"
```

---

## Task 6: CSV Export

**Files:**
- Create: `src/lib/csv-export.ts`
- Create: `tests/csv-export.test.ts`

- [ ] **Step 1: Write CSV export tests**

Create `tests/csv-export.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateCsv } from "../src/lib/csv-export";
import { Invoice, AdvanceInvoice } from "../src/lib/types";

describe("generateCsv", () => {
  const invoice: Invoice = {
    id: "1",
    type: "ostra",
    invoice_number: "202604-01",
    client_name: "EFIBA, s.r.o.",
    client_street: "Kopčianska 15",
    client_city: "851 01 Bratislava",
    client_ico: "51443783",
    client_dic: "2120718985",
    client_ic_dph: "N/A",
    service_description: "Právne služby",
    invoice_text: "",
    billing_type: "hourly",
    unit: "hod.",
    quantity: 10,
    unit_price: 90,
    price_without_vat: 900,
    vat_rate: 0,
    vat_amount: 0,
    total_with_vat: 900,
    advance_invoice_id: null,
    advance_invoice_number: null,
    advance_deduction: 0,
    amount_due: 900,
    date_of_supply: "2026-04-15",
    date_of_issue: "2026-04-20",
    date_due: "2026-04-30",
    issued_by: "Jana",
    payment_method: "bezhotovostne",
    note: "",
    is_paid: true,
    paid_date: "2026-04-25",
    created_at: "2026-04-20T10:00:00Z",
  };

  const advance: AdvanceInvoice = {
    id: "2",
    invoice_number: "ZAL26001",
    client_name: "ZEMONT s. r. o.",
    client_street: "Vavilovova 1182/22",
    client_city: "851 01 Bratislava",
    client_ico: "55820522",
    client_dic: "2122106382",
    client_ic_dph: "SK2122106382",
    advance_amount: 675,
    remaining_balance: 675,
    date_of_issue: "2026-04-15",
    date_due: "2026-04-22",
    description: "Záloha za revíziu VOP",
    issued_by: "Jana",
    payment_method: "bezhotovostne",
    is_paid: false,
    paid_date: null,
    status: "neuhradená",
    created_at: "2026-04-15T09:00:00Z",
  };

  it("generates header with BOM", () => {
    const csv = generateCsv([invoice], [advance]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("uses semicolon delimiter", () => {
    const csv = generateCsv([invoice], []);
    const headerLine = csv.split("\n")[0];
    expect(headerLine).toContain(";");
    expect(headerLine).not.toMatch(/(?<!;)[,](?!;)/);
  });

  it("includes both invoice types", () => {
    const csv = generateCsv([invoice], [advance]);
    const lines = csv.split("\n").filter((l) => l.trim());
    expect(lines.length).toBe(3); // header + 2 data rows
  });

  it("sorts by date of issue descending", () => {
    const csv = generateCsv([invoice], [advance]);
    const lines = csv.split("\n").filter((l) => l.trim());
    // invoice is 2026-04-20, advance is 2026-04-15 — invoice first
    expect(lines[1]).toContain("202604-01");
    expect(lines[2]).toContain("ZAL26001");
  });

  it("formats dates as DD.MM.YYYY", () => {
    const csv = generateCsv([invoice], []);
    expect(csv).toContain("20.04.2026");
  });

  it("formats paid status", () => {
    const csv = generateCsv([invoice], []);
    expect(csv).toContain("Áno");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- tests/csv-export.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement csv-export.ts**

Create `src/lib/csv-export.ts`:

```typescript
import { Invoice, AdvanceInvoice } from "./types";
import { formatDate, formatCurrencyPlain } from "./formatting";

const BOM = "\uFEFF";
const SEP = ";";

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
];

type TypeLabel = "Ostrá" | "Vyúčtovacia" | "Zálohová";

interface CsvRow {
  date_of_issue: string;
  fields: string[];
}

function invoiceToRow(inv: Invoice): CsvRow {
  const typeLabel: TypeLabel = inv.type === "ostra" ? "Ostrá" : "Vyúčtovacia";
  return {
    date_of_issue: inv.date_of_issue,
    fields: [
      inv.invoice_number,
      typeLabel,
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
      inv.is_paid ? "Áno" : "Nie",
      inv.paid_date ? formatDate(inv.paid_date) : "",
    ],
  };
}

function advanceToRow(adv: AdvanceInvoice): CsvRow {
  return {
    date_of_issue: adv.date_of_issue,
    fields: [
      adv.invoice_number,
      "Z��lohová",
      adv.client_name,
      adv.client_ico,
      adv.client_dic,
      formatDate(adv.date_of_issue),
      formatDate(adv.date_due),
      "",
      formatCurrencyPlain(adv.advance_amount),
      "0,00",
      formatCurrencyPlain(adv.advance_amount),
      "0,00",
      formatCurrencyPlain(adv.advance_amount),
      adv.is_paid ? "Áno" : "Nie",
      adv.paid_date ? formatDate(adv.paid_date) : "",
    ],
  };
}

export function generateCsv(
  invoices: Invoice[],
  advances: AdvanceInvoice[]
): string {
  const rows: CsvRow[] = [
    ...invoices.map(invoiceToRow),
    ...advances.map(advanceToRow),
  ];

  rows.sort((a, b) => b.date_of_issue.localeCompare(a.date_of_issue));

  const lines = [
    HEADERS.join(SEP),
    ...rows.map((row) => row.fields.join(SEP)),
  ];

  return BOM + lines.join("\n") + "\n";
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- tests/csv-export.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add CSV export with Slovak formatting"
```

---

## Task 7: Data Hooks (Settings, Clients, Invoices, Advances)

**Files:**
- Create: `src/hooks/use-settings.ts`
- Create: `src/hooks/use-clients.ts`
- Create: `src/hooks/use-invoices.ts`
- Create: `src/hooks/use-advance-invoices.ts`

- [ ] **Step 1: Create use-settings hook**

Create `src/hooks/use-settings.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { Settings } from "@/lib/types";
import { readJson, writeJson } from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

const FILENAME = "settings.json";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJson<Settings>(FILENAME).then((data) => {
      if (data) {
        setSettings(data);
      } else {
        writeJson(FILENAME, DEFAULT_SETTINGS);
      }
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (updated: Settings) => {
    setSettings(updated);
    await writeJson(FILENAME, updated);
  }, []);

  return { settings, loading, updateSettings };
}
```

- [ ] **Step 2: Create use-clients hook**

Create `src/hooks/use-clients.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Client } from "@/lib/types";
import { readJsonl, writeJsonl } from "@/lib/storage";

const FILENAME = "clients.jsonl";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJsonl<Client>(FILENAME).then((data) => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (updated: Client[]) => {
    setClients(updated);
    await writeJsonl(FILENAME, updated);
  }, []);

  const addClient = useCallback(
    async (client: Omit<Client, "id" | "last_used">) => {
      const newClient: Client = {
        ...client,
        id: uuidv4(),
        last_used: new Date().toISOString(),
      };
      const updated = [...clients, newClient];
      await save(updated);
      return newClient;
    },
    [clients, save]
  );

  const updateClient = useCallback(
    async (id: string, changes: Partial<Client>) => {
      const updated = clients.map((c) =>
        c.id === id ? { ...c, ...changes, last_used: new Date().toISOString() } : c
      );
      await save(updated);
    },
    [clients, save]
  );

  const upsertClient = useCallback(
    async (client: Omit<Client, "id" | "last_used">) => {
      const existing = clients.find(
        (c) => c.name === client.name && c.ico === client.ico
      );
      if (existing) {
        await updateClient(existing.id, client);
        return existing;
      }
      return addClient(client);
    },
    [clients, addClient, updateClient]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      const updated = clients.filter((c) => c.id !== id);
      await save(updated);
    },
    [clients, save]
  );

  return { clients, loading, addClient, updateClient, upsertClient, deleteClient };
}
```

- [ ] **Step 3: Create use-invoices hook**

Create `src/hooks/use-invoices.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Invoice } from "@/lib/types";
import { readJsonl, writeJsonl } from "@/lib/storage";

const FILENAME = "invoices.jsonl";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJsonl<Invoice>(FILENAME).then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (updated: Invoice[]) => {
    setInvoices(updated);
    await writeJsonl(FILENAME, updated);
  }, []);

  const addInvoice = useCallback(
    async (invoice: Omit<Invoice, "id" | "created_at">) => {
      const newInvoice: Invoice = {
        ...invoice,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      };
      const updated = [...invoices, newInvoice];
      await save(updated);
      return newInvoice;
    },
    [invoices, save]
  );

  const updateInvoice = useCallback(
    async (id: string, changes: Partial<Invoice>) => {
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, ...changes } : inv
      );
      await save(updated);
    },
    [invoices, save]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      const updated = invoices.filter((inv) => inv.id !== id);
      await save(updated);
    },
    [invoices, save]
  );

  const markAsPaid = useCallback(
    async (id: string, paidDate: string) => {
      await updateInvoice(id, { is_paid: true, paid_date: paidDate });
    },
    [updateInvoice]
  );

  return { invoices, loading, addInvoice, updateInvoice, deleteInvoice, markAsPaid };
}
```

- [ ] **Step 4: Create use-advance-invoices hook**

Create `src/hooks/use-advance-invoices.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { AdvanceInvoice } from "@/lib/types";
import { readJsonl, writeJsonl } from "@/lib/storage";

const FILENAME = "advance_invoices.jsonl";

export function useAdvanceInvoices() {
  const [advances, setAdvances] = useState<AdvanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJsonl<AdvanceInvoice>(FILENAME).then((data) => {
      setAdvances(data);
      setLoading(false);
    });
  }, []);

  const save = useCallback(async (updated: AdvanceInvoice[]) => {
    setAdvances(updated);
    await writeJsonl(FILENAME, updated);
  }, []);

  const addAdvance = useCallback(
    async (advance: Omit<AdvanceInvoice, "id" | "created_at">) => {
      const newAdvance: AdvanceInvoice = {
        ...advance,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      };
      const updated = [...advances, newAdvance];
      await save(updated);
      return newAdvance;
    },
    [advances, save]
  );

  const updateAdvance = useCallback(
    async (id: string, changes: Partial<AdvanceInvoice>) => {
      const updated = advances.map((adv) =>
        adv.id === id ? { ...adv, ...changes } : adv
      );
      await save(updated);
    },
    [advances, save]
  );

  const deleteAdvance = useCallback(
    async (id: string) => {
      const updated = advances.filter((adv) => adv.id !== id);
      await save(updated);
    },
    [advances, save]
  );

  const markAsPaid = useCallback(
    async (id: string, paidDate: string) => {
      await updateAdvance(id, {
        is_paid: true,
        paid_date: paidDate,
        status: "uhradená",
      });
    },
    [updateAdvance]
  );

  const deductFromAdvance = useCallback(
    async (id: string, amount: number) => {
      const advance = advances.find((a) => a.id === id);
      if (!advance) return;
      await updateAdvance(id, {
        remaining_balance: advance.remaining_balance - amount,
      });
    },
    [advances, updateAdvance]
  );

  const availableForSettlement = advances.filter(
    (a) => a.is_paid && a.remaining_balance > 0
  );

  return {
    advances,
    loading,
    addAdvance,
    updateAdvance,
    deleteAdvance,
    markAsPaid,
    deductFromAdvance,
    availableForSettlement,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add data hooks for settings, clients, invoices"
```

---

## Task 8: App Shell (Layout, Sidebar, Routing)

**Files:**
- Create: `src/components/layout.tsx`
- Create: `src/components/sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/sidebar.tsx`:

```typescript
import { NavLink, useNavigate } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/invoices", label: "Faktúry", icon: "receipt_long" },
  { to: "/clients", label: "Klienti", icon: "people" },
  { to: "/settings", label: "Nastavenia", icon: "settings" },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-64 h-screen bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col fixed left-0 top-0">
      <div className="p-6 pb-4">
        <img src={logoDark} alt="Noveris Legal" className="h-8 w-auto invert" />
      </div>

      <div className="px-4 mb-6">
        <button
          onClick={() => navigate("/invoices/new")}
          className="w-full py-3 px-4 rounded-md text-on-primary font-label uppercase tracking-widest text-xs"
          style={{ background: "linear-gradient(45deg, #6d5b47, #c6af97)" }}
        >
          Nová faktúra
        </button>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-label tracking-wide transition-colors mb-1 ${
                isActive
                  ? "bg-surface-container-high text-primary font-medium"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create layout component**

Create `src/components/layout.tsx`:

```typescript
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Set up routing in App.tsx**

Replace `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Dashboard } from "@/pages/dashboard";
import { InvoiceList } from "@/pages/invoice-list";
import { InvoiceForm } from "@/pages/invoice-form";
import { InvoiceDetail } from "@/pages/invoice-detail";
import { ClientList } from "@/pages/client-list";
import { SettingsPage } from "@/pages/settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: Create placeholder pages**

Create stub pages so the app compiles. Each page is a simple placeholder that will be implemented in subsequent tasks.

`src/pages/dashboard.tsx`:

```typescript
export function Dashboard() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Dashboard</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

`src/pages/invoice-list.tsx`:

```typescript
export function InvoiceList() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Faktúry</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

`src/pages/invoice-form.tsx`:

```typescript
export function InvoiceForm() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Nová faktúra</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

`src/pages/invoice-detail.tsx`:

```typescript
export function InvoiceDetail() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Detail faktúry</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

`src/pages/client-list.tsx`:

```typescript
export function ClientList() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Klienti</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

`src/pages/settings.tsx`:

```typescript
export function SettingsPage() {
  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-4">Nastavenia</h1>
      <p className="text-on-surface-variant">Coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 5: Add Material Symbols font**

Add to `src/index.css` (before the body rule):

```css
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24;
}
```

- [ ] **Step 6: Verify app builds and shows layout**

```bash
npm run dev
```

Expected: App shows sidebar with Noveris logo, nav links, and "Nová faktúra" button. Clicking nav items changes the main content area. Tailwind colors match the Noveris palette.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add app shell with sidebar, layout, routing"
```

---

## Task 9: Settings Page

**Files:**
- Modify: `src/pages/settings.tsx`

- [ ] **Step 1: Implement settings page**

Replace `src/pages/settings.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings } from "@/lib/types";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useClients } from "@/hooks/use-clients";
import { generateCsv } from "@/lib/csv-export";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const { invoices } = useInvoices();
  const { advances } = useAdvanceInvoices();
  const { clients } = useClients();
  const [form, setForm] = useState<Settings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (loading) return null;

  function handleChange(field: keyof Settings, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    await updateSettings(form);
  }

  async function handleExportCsv() {
    const csv = generateCsv(invoices, advances);
    const today = new Date().toISOString().slice(0, 10);
    const path = await save({
      defaultPath: `faktury-export-${today}.csv`,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (path) {
      await writeTextFile(path, csv);
    }
  }

  async function handleExportZip() {
    // Read all data files and bundle as JSON for backup
    const backup = {
      invoices,
      advances,
      clients,
      settings: form,
      exported_at: new Date().toISOString(),
    };
    const json = JSON.stringify(backup, null, 2);
    const today = new Date().toISOString().slice(0, 10);
    const path = await save({
      defaultPath: `noveris-backup-${today}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (path) {
      await writeTextFile(path, json);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline text-3xl text-on-surface mb-8">Nastavenia</h1>

      <Card className="p-6 mb-8 bg-surface-container-lowest border-outline-variant/20">
        <h2 className="font-headline text-xl text-primary mb-6">Dodávateľ</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">Názov</Label>
            <Input value={form.supplier_name} onChange={(e) => handleChange("supplier_name", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">Ulica</Label>
            <Input value={form.supplier_street} onChange={(e) => handleChange("supplier_street", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">PSČ / Obec</Label>
            <Input value={form.supplier_city} onChange={(e) => handleChange("supplier_city", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">IČO</Label>
            <Input value={form.supplier_ico} onChange={(e) => handleChange("supplier_ico", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">DIČ</Label>
            <Input value={form.supplier_dic} onChange={(e) => handleChange("supplier_dic", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">IČ DPH</Label>
            <Input value={form.supplier_ic_dph} onChange={(e) => handleChange("supplier_ic_dph", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">IBAN</Label>
            <Input value={form.supplier_iban} onChange={(e) => handleChange("supplier_iban", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">Banka</Label>
            <Input value={form.supplier_bank} onChange={(e) => handleChange("supplier_bank", e.target.value)} />
          </div>
        </div>

        <Separator className="my-6 bg-outline-variant/20" />

        <h2 className="font-headline text-xl text-primary mb-4">DPH</h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_vat_payer}
              onChange={(e) => handleChange("is_vat_payer", e.target.checked)}
              className="rounded border-outline-variant"
            />
            <span className="font-body text-sm">Som platca DPH</span>
          </label>
        </div>
        {!form.is_vat_payer && (
          <p className="text-sm text-on-surface-variant italic">
            Na faktúrach sa zobrazí "Nie som platca DPH"
          </p>
        )}

        <Separator className="my-6 bg-outline-variant/20" />

        <h2 className="font-headline text-xl text-primary mb-4">Predvolby</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">Spôsob úhrady</Label>
            <Input value={form.default_payment_method} onChange={(e) => handleChange("default_payment_method", e.target.value)} />
          </div>
          <div>
            <Label className="font-label text-xs uppercase tracking-widest text-outline">Splatnosť (dni)</Label>
            <Input type="number" value={form.default_due_days} onChange={(e) => handleChange("default_due_days", parseInt(e.target.value) || 0)} />
          </div>
        </div>

        <div className="mt-8">
          <Button onClick={handleSave} className="bg-primary text-on-primary hover:bg-primary/90">
            Uložiť nastavenia
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
        <h2 className="font-headline text-xl text-primary mb-4">Export dát</h2>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleExportCsv} className="border-outline-variant text-on-surface">
            Exportovať CSV
          </Button>
          <Button variant="outline" onClick={handleExportZip} className="border-outline-variant text-on-surface">
            Exportovať dáta (záloha)
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Navigate to Settings. Expected: Form with supplier details, VAT toggle, defaults, save button, and CSV export button. All fields populated with defaults.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Implement settings page"
```

---

## Task 10: Client List Page

**Files:**
- Modify: `src/pages/client-list.tsx`

- [ ] **Step 1: Implement client list page**

Replace `src/pages/client-list.tsx`:

```typescript
import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientFormData = Omit<Client, "id" | "last_used">;

const emptyForm: ClientFormData = {
  name: "",
  street: "",
  city: "",
  ico: "",
  dic: "",
  ic_dph: "",
};

export function ClientList() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (loading) return null;

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setForm({
      name: client.name,
      street: client.street,
      city: client.city,
      ico: client.ico,
      dic: client.dic,
      ic_dph: client.ic_dph,
    });
    setEditingId(client.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editingId) {
      await updateClient(editingId, form);
    } else {
      await addClient(form);
    }
    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    await deleteClient(id);
    setDeleteConfirm(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Klienti</h1>
        <Button onClick={openNew} className="bg-primary text-on-primary hover:bg-primary/90">
          Pridať klienta
        </Button>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant/20">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/20">
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Názov</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Adresa</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">IČO</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">DIČ</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="border-outline-variant/10">
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-on-surface-variant">
                  {client.street}, {client.city}
                </TableCell>
                <TableCell className="text-on-surface-variant">{client.ico}</TableCell>
                <TableCell className="text-on-surface-variant">{client.dic}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(client)} className="text-primary">
                    Upraviť
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(client.id)} className="text-error">
                    Zmazať
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-on-surface-variant py-8">
                  Zatiaľ žiadni klienti.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {editingId ? "Upraviť klienta" : "Nový klient"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="font-label text-xs uppercase tracking-widest text-outline">Názov</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="font-label text-xs uppercase tracking-widest text-outline">Ulica</Label>
              <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            </div>
            <div>
              <Label className="font-label text-xs uppercase tracking-widest text-outline">PSČ / Obec</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">IČO</Label>
                <Input value={form.ico} onChange={(e) => setForm({ ...form, ico: e.target.value })} />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">DIČ</Label>
                <Input value={form.dic} onChange={(e) => setForm({ ...form, dic: e.target.value })} />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">IČ DPH</Label>
                <Input value={form.ic_dph} onChange={(e) => setForm({ ...form, ic_dph: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-primary text-on-primary hover:bg-primary/90">
              Uložiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Zmazať klienta?</DialogTitle>
          </DialogHeader>
          <p className="text-on-surface-variant">Táto akcia je nevratná.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Zrušiť</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-error text-on-error">
              Zmazať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to Klienti. Expected: Empty state message. Add button opens dialog. Can add, edit, delete clients.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Implement client list page"
```

---

## Task 11: Invoice Form (All 3 Types)

**Files:**
- Modify: `src/pages/invoice-form.tsx`
- Create: `src/components/client-autocomplete.tsx`
- Create: `src/components/invoice-summary-card.tsx`

- [ ] **Step 1: Create client autocomplete component**

Create `src/components/client-autocomplete.tsx`:

```typescript
import { useState, useMemo } from "react";
import { Client } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface ClientAutocompleteProps {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: Client) => void;
}

export function ClientAutocomplete({ clients, value, onChange, onSelect }: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const lower = value.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.ico.includes(value)
    );
  }, [clients, value]);

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Začnite písať meno klienta..."
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-container-lowest border border-outline-variant/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-surface-container text-sm"
              onMouseDown={() => {
                onSelect(client);
                setOpen(false);
              }}
            >
              <span className="font-medium">{client.name}</span>
              <span className="text-on-surface-variant ml-2">IČO: {client.ico}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create invoice summary card component**

Create `src/components/invoice-summary-card.tsx`:

```typescript
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatting";

interface InvoiceSummaryProps {
  priceWithoutVat: number;
  vatAmount: number;
  totalWithVat: number;
  advanceDeduction: number;
  amountDue: number;
  isVatPayer: boolean;
  showAdvance: boolean;
}

export function InvoiceSummaryCard({
  priceWithoutVat,
  vatAmount,
  totalWithVat,
  advanceDeduction,
  amountDue,
  isVatPayer,
  showAdvance,
}: InvoiceSummaryProps) {
  return (
    <Card className="p-6 bg-surface-container-low border-outline-variant/20">
      <h3 className="font-headline text-lg text-primary mb-4">Sumár</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Odmena:</span>
          <span className="font-medium">{formatCurrency(priceWithoutVat)}</span>
        </div>
        {isVatPayer ? (
          <div className="flex justify-between">
            <span className="text-on-surface-variant">DPH (20%):</span>
            <span className="font-medium">{formatCurrency(vatAmount)}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-on-surface-variant italic">Nie som platca DPH</span>
          </div>
        )}
        <div className="flex justify-between border-t border-outline-variant/20 pt-2">
          <span className="text-on-surface-variant">Celkom:</span>
          <span className="font-medium">{formatCurrency(totalWithVat)}</span>
        </div>
        {showAdvance && advanceDeduction > 0 && (
          <>
            <div className="flex justify-between text-secondary">
              <span>Odpočet zálohy:</span>
              <span>-{formatCurrency(advanceDeduction)}</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant/20 pt-2 font-bold text-base">
              <span>K úhrade:</span>
              <span className="text-secondary">{formatCurrency(amountDue)}</span>
            </div>
          </>
        )}
        {!showAdvance && (
          <div className="flex justify-between font-bold text-base mt-2">
            <span>K úhrade:</span>
            <span className="text-secondary">{formatCurrency(amountDue)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Implement invoice form page**

Replace `src/pages/invoice-form.tsx`. This is the largest page — it handles all 3 invoice types with adaptive fields.

```typescript
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useClients } from "@/hooks/use-clients";
import { useSettings } from "@/hooks/use-settings";
import { Invoice, AdvanceInvoice, BillingType } from "@/lib/types";
import {
  nextInvoiceNumber,
  nextAdvanceNumber,
  computeInvoiceTotals,
  computeAdvanceDeduction,
  validateInvoice,
  validateAdvanceInvoice,
} from "@/lib/invoicing";
import { ClientAutocomplete } from "@/components/client-autocomplete";
import { InvoiceSummaryCard } from "@/components/invoice-summary-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";
import { AdvancePdf } from "@/lib/pdf/advance-pdf";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { writeBinaryFile } from "@tauri-apps/plugin-fs";

type FormType = "ostra" | "zalohova" | "vyuctovacia";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { invoices, addInvoice, updateInvoice } = useInvoices();
  const { advances, addAdvance, updateAdvance, deductFromAdvance, availableForSettlement } = useAdvanceInvoices();
  const { clients, upsertClient } = useClients();
  const { settings } = useSettings();

  const [formType, setFormType] = useState<FormType>("ostra");
  const [saveClient, setSaveClient] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Client fields
  const [clientName, setClientName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientIco, setClientIco] = useState("");
  const [clientDic, setClientDic] = useState("");
  const [clientIcDph, setClientIcDph] = useState("");

  // Invoice fields
  const [billingType, setBillingType] = useState<BillingType>("hourly");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [serviceDescription, setServiceDescription] = useState("");
  const [invoiceText, setInvoiceText] = useState("");
  const [dateOfSupply, setDateOfSupply] = useState(todayISO());
  const [dateOfIssue, setDateOfIssue] = useState(todayISO());
  const [dateDue, setDateDue] = useState(addDays(todayISO(), settings.default_due_days));
  const [issuedBy, setIssuedBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(settings.default_payment_method);
  const [note, setNote] = useState("");

  // Advance-specific
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceDescription, setAdvanceDescription] = useState("");

  // Settlement-specific
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);

  // Update due date when issue date changes
  useEffect(() => {
    setDateDue(addDays(dateOfIssue, settings.default_due_days));
  }, [dateOfIssue, settings.default_due_days]);

  // Computed totals
  const vatRate = settings.is_vat_payer ? settings.vat_rate : 0;
  const totals = useMemo(
    () => computeInvoiceTotals(quantity, unitPrice, vatRate),
    [quantity, unitPrice, vatRate]
  );

  const selectedAdvance = advances.find((a) => a.id === selectedAdvanceId);
  const settlement = useMemo(
    () =>
      selectedAdvance
        ? computeAdvanceDeduction(totals.total_with_vat, selectedAdvance.remaining_balance)
        : { advance_deduction: 0, amount_due: totals.total_with_vat },
    [totals.total_with_vat, selectedAdvance]
  );

  function handleClientSelect(client: (typeof clients)[0]) {
    setClientName(client.name);
    setClientStreet(client.street);
    setClientCity(client.city);
    setClientIco(client.ico);
    setClientDic(client.dic);
    setClientIcDph(client.ic_dph);
  }

  async function handleSave(exportPdf: boolean) {
    if (saveClient && clientName.trim()) {
      await upsertClient({
        name: clientName,
        street: clientStreet,
        city: clientCity,
        ico: clientIco,
        dic: clientDic,
        ic_dph: clientIcDph,
      });
    }

    if (formType === "zalohova") {
      const validationErrors = validateAdvanceInvoice({
        client_name: clientName,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        advance_amount: advanceAmount,
      });
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const invoiceNumber = nextAdvanceNumber(advances, dateOfIssue);
      const newAdvance = await addAdvance({
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_street: clientStreet,
        client_city: clientCity,
        client_ico: clientIco,
        client_dic: clientDic,
        client_ic_dph: clientIcDph,
        advance_amount: advanceAmount,
        remaining_balance: advanceAmount,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        description: advanceDescription,
        issued_by: issuedBy,
        payment_method: paymentMethod,
        is_paid: false,
        paid_date: null,
        status: "neuhradená",
      });

      if (exportPdf) {
        await exportAdvancePdf(newAdvance);
      }
      navigate(`/invoices`);
      return;
    }

    // Ostrá or Vyúčtovacia
    const invoiceData: Partial<Invoice> = {
      client_name: clientName,
      date_of_issue: dateOfIssue,
      date_due: dateDue,
      date_of_supply: dateOfSupply,
      quantity,
      unit_price: unitPrice,
    };

    const validationErrors = validateInvoice(invoiceData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const invoiceNumber = nextInvoiceNumber(invoices, dateOfIssue);
    const type = formType === "vyuctovacia" ? "vyuctovacia" : "ostra";

    const newInvoice = await addInvoice({
      type,
      invoice_number: invoiceNumber,
      client_name: clientName,
      client_street: clientStreet,
      client_city: clientCity,
      client_ico: clientIco,
      client_dic: clientDic,
      client_ic_dph: clientIcDph,
      service_description: serviceDescription,
      invoice_text: invoiceText,
      billing_type: billingType,
      unit: billingType === "hourly" ? "hod." : "ks",
      quantity,
      unit_price: unitPrice,
      price_without_vat: totals.price_without_vat,
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_with_vat: totals.total_with_vat,
      advance_invoice_id: selectedAdvance?.id ?? null,
      advance_invoice_number: selectedAdvance?.invoice_number ?? null,
      advance_deduction: settlement.advance_deduction,
      amount_due: settlement.amount_due,
      date_of_supply: dateOfSupply,
      date_of_issue: dateOfIssue,
      date_due: dateDue,
      issued_by: issuedBy,
      payment_method: paymentMethod,
      note,
      is_paid: false,
      paid_date: null,
    });

    if (type === "vyuctovacia" && selectedAdvance) {
      await deductFromAdvance(selectedAdvance.id, settlement.advance_deduction);
    }

    if (exportPdf) {
      await exportInvoicePdf(newInvoice);
    }
    navigate(`/invoices`);
  }

  async function exportInvoicePdf(invoice: Invoice) {
    const blob = await pdf(<InvoicePdf invoice={invoice} settings={settings} />).toBlob();
    const buffer = await blob.arrayBuffer();
    const path = await saveDialog({
      defaultPath: `faktura-${invoice.invoice_number}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      await writeBinaryFile(path, new Uint8Array(buffer));
    }
  }

  async function exportAdvancePdf(advance: AdvanceInvoice) {
    const blob = await pdf(<AdvancePdf advance={advance} settings={settings} />).toBlob();
    const buffer = await blob.arrayBuffer();
    const path = await saveDialog({
      defaultPath: `zalohova-faktura-${advance.invoice_number}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      await writeBinaryFile(path, new Uint8Array(buffer));
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-headline text-3xl text-on-surface mb-8">Nová faktúra</h1>

      <Tabs value={formType} onValueChange={(v) => setFormType(v as FormType)} className="mb-8">
        <TabsList className="bg-surface-container">
          <TabsTrigger value="ostra">Ostrá</TabsTrigger>
          <TabsTrigger value="zalohova">Zálohová</TabsTrigger>
          <TabsTrigger value="vyuctovacia">Vyúčtovacia</TabsTrigger>
        </TabsList>
      </Tabs>

      {errors.length > 0 && (
        <Card className="p-4 mb-6 bg-error-container border-error/20">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-error">{e}</p>
          ))}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          {/* Client Section */}
          <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
            <h2 className="font-headline text-xl text-primary mb-4">Odberateľ</h2>
            <div className="space-y-4">
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Klient</Label>
                <ClientAutocomplete
                  clients={clients}
                  value={clientName}
                  onChange={setClientName}
                  onSelect={handleClientSelect}
                />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Ulica</Label>
                <Input value={clientStreet} onChange={(e) => setClientStreet(e.target.value)} />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">PSČ / Obec</Label>
                <Input value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">IČO</Label>
                  <Input value={clientIco} onChange={(e) => setClientIco(e.target.value)} />
                </div>
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">DIČ</Label>
                  <Input value={clientDic} onChange={(e) => setClientDic(e.target.value)} />
                </div>
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">IČ DPH</Label>
                  <Input value={clientIcDph} onChange={(e) => setClientIcDph(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveClient}
                  onChange={(e) => setSaveClient(e.target.checked)}
                  className="rounded border-outline-variant"
                />
                <span className="text-sm text-on-surface-variant">Uložiť klienta</span>
              </label>
            </div>
          </Card>

          {/* Service Section (ostrá/vyúčtovacia) */}
          {formType !== "zalohova" && (
            <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
              <h2 className="font-headline text-xl text-primary mb-4">Služba</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingType"
                      checked={billingType === "hourly"}
                      onChange={() => setBillingType("hourly")}
                    />
                    <span className="text-sm">Hodinová sadzba</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="billingType"
                      checked={billingType === "fixed"}
                      onChange={() => setBillingType("fixed")}
                    />
                    <span className="text-sm">Paušál</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-label text-xs uppercase tracking-widest text-outline">
                      {billingType === "hourly" ? "Počet hodín" : "Množstvo"}
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="font-label text-xs uppercase tracking-widest text-outline">
                      {billingType === "hourly" ? "Hodinová sadzba (€)" : "Cena (€)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">Popis služby</Label>
                  <Input value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} />
                </div>
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">Text faktúry</Label>
                  <Textarea value={invoiceText} onChange={(e) => setInvoiceText(e.target.value)} rows={4} />
                </div>
              </div>
            </Card>
          )}

          {/* Advance Amount Section (zálohová) */}
          {formType === "zalohova" && (
            <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
              <h2 className="font-headline text-xl text-primary mb-4">Záloha</h2>
              <div className="space-y-4">
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">Suma zálohy (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">Popis</Label>
                  <Textarea value={advanceDescription} onChange={(e) => setAdvanceDescription(e.target.value)} rows={3} />
                </div>
              </div>
            </Card>
          )}

          {/* Settlement Advance Selection (vyúčtovacia) */}
          {formType === "vyuctovacia" && (
            <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
              <h2 className="font-headline text-xl text-primary mb-4">Odpočet zálohy</h2>
              {availableForSettlement.length === 0 ? (
                <p className="text-on-surface-variant italic text-sm">
                  Žiadne uhradené zálohy s kladným zostatkom.
                </p>
              ) : (
                <select
                  value={selectedAdvanceId ?? ""}
                  onChange={(e) => setSelectedAdvanceId(e.target.value || null)}
                  className="w-full rounded-md border border-outline-variant/20 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Vybrať zálohovú faktúru...</option>
                  {availableForSettlement.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.invoice_number} — {a.client_name} — zostatok: {a.remaining_balance.toFixed(2)} €
                    </option>
                  ))}
                </select>
              )}
            </Card>
          )}

          {/* Dates Section */}
          <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
            <h2 className="font-headline text-xl text-primary mb-4">Dátumy</h2>
            <div className="grid grid-cols-3 gap-4">
              {formType !== "zalohova" && (
                <div>
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">Dátum dodania</Label>
                  <Input type="date" value={dateOfSupply} onChange={(e) => setDateOfSupply(e.target.value)} />
                </div>
              )}
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Dátum vystavenia</Label>
                <Input type="date" value={dateOfIssue} onChange={(e) => setDateOfIssue(e.target.value)} />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Dátum splatnosti</Label>
                <Input type="date" value={dateDue} onChange={(e) => setDateDue(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Other Fields */}
          <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Vystavil</Label>
                <Input value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} />
              </div>
              <div>
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Spôsob úhrady</Label>
                <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>
            </div>
            {formType !== "zalohova" && (
              <div className="mt-4">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">Poznámka (interná)</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Summary */}
        <div className="space-y-4">
          {formType === "zalohova" ? (
            <Card className="p-6 bg-surface-container-low border-outline-variant/20">
              <h3 className="font-headline text-lg text-primary mb-4">Sumár</h3>
              <div className="flex justify-between font-bold text-base">
                <span>Záloha:</span>
                <span className="text-secondary">
                  {advanceAmount.toLocaleString("sk-SK", { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </Card>
          ) : (
            <InvoiceSummaryCard
              priceWithoutVat={totals.price_without_vat}
              vatAmount={totals.vat_amount}
              totalWithVat={totals.total_with_vat}
              advanceDeduction={settlement.advance_deduction}
              amountDue={settlement.amount_due}
              isVatPayer={settings.is_vat_payer}
              showAdvance={formType === "vyuctovacia"}
            />
          )}

          <div className="space-y-2">
            <Button
              onClick={() => handleSave(false)}
              className="w-full bg-primary text-on-primary hover:bg-primary/90"
            >
              Uložiť
            </Button>
            <Button
              onClick={() => handleSave(true)}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10"
            >
              Uložiť a exportovať PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Note: The `writeBinaryFile` import may need adjustment — in Tauri v2's FS plugin, binary writes use `writeFile` with a `Uint8Array`. Check Tauri v2 docs via Context7 during implementation and adjust accordingly. The function name and signature may be `writeFile(path, contents, { baseDir })`.

- [ ] **Step 2: Verify in browser**

Navigate to /invoices/new. Expected: Type tabs, client autocomplete, adaptive fields per type, real-time summary card, save buttons.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Implement invoice form with all 3 types"
```

---

## Task 12: Invoice List Page

**Files:**
- Modify: `src/pages/invoice-list.tsx`
- Create: `src/components/status-badge.tsx`

- [ ] **Step 1: Create status badge component**

Create `src/components/status-badge.tsx`:

```typescript
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  isPaid: boolean;
  dateDue: string;
}

export function StatusBadge({ isPaid, dateDue }: StatusBadgeProps) {
  if (isPaid) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 font-label text-xs">
        Zaplatená
      </Badge>
    );
  }

  const isOverdue = new Date(dateDue) < new Date();
  if (isOverdue) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 font-label text-xs">
        Po splatnosti
      </Badge>
    );
  }

  return (
    <Badge className="bg-surface-container-high text-on-surface-variant border-outline-variant/20 font-label text-xs">
      Nezaplatená
    </Badge>
  );
}
```

- [ ] **Step 2: Implement invoice list page**

Replace `src/pages/invoice-list.tsx`:

```typescript
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TypeFilter = "all" | "ostra" | "zalohova" | "vyuctovacia";
type StatusFilter = "all" | "paid" | "unpaid" | "overdue";

interface UnifiedRow {
  id: string;
  kind: "invoice" | "advance";
  invoice_number: string;
  type_label: string;
  type_key: TypeFilter;
  client_name: string;
  amount: number;
  date_of_issue: string;
  date_due: string;
  is_paid: boolean;
}

export function InvoiceList() {
  const { invoices, loading: loadingInv } = useInvoices();
  const { advances, loading: loadingAdv } = useAdvanceInvoices();
  const navigate = useNavigate();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const rows: UnifiedRow[] = useMemo(() => {
    const invRows: UnifiedRow[] = invoices.map((inv) => ({
      id: inv.id,
      kind: "invoice",
      invoice_number: inv.invoice_number,
      type_label: inv.type === "ostra" ? "Ostrá" : "Vyúčtovacia",
      type_key: inv.type === "ostra" ? "ostra" : "vyuctovacia",
      client_name: inv.client_name,
      amount: inv.amount_due,
      date_of_issue: inv.date_of_issue,
      date_due: inv.date_due,
      is_paid: inv.is_paid,
    }));

    const advRows: UnifiedRow[] = advances.map((adv) => ({
      id: adv.id,
      kind: "advance",
      invoice_number: adv.invoice_number,
      type_label: "Zálohová",
      type_key: "zalohova",
      client_name: adv.client_name,
      amount: adv.advance_amount,
      date_of_issue: adv.date_of_issue,
      date_due: adv.date_due,
      is_paid: adv.is_paid,
    }));

    return [...invRows, ...advRows].sort(
      (a, b) => b.date_of_issue.localeCompare(a.date_of_issue)
    );
  }, [invoices, advances]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (typeFilter !== "all" && row.type_key !== typeFilter) return false;
      if (statusFilter === "paid" && !row.is_paid) return false;
      if (statusFilter === "unpaid" && row.is_paid) return false;
      if (statusFilter === "overdue" && (row.is_paid || new Date(row.date_due) >= new Date())) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !row.client_name.toLowerCase().includes(q) &&
          !row.invoice_number.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [rows, typeFilter, statusFilter, search]);

  if (loadingInv || loadingAdv) return null;

  const typeBadgeColor: Record<string, string> = {
    Ostrá: "bg-primary/10 text-primary border-primary/20",
    Zálohová: "bg-secondary/10 text-secondary border-secondary/20",
    Vyúčtovacia: "bg-tertiary/10 text-tertiary border-tertiary/20",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl text-on-surface">Faktúry</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded-md border border-outline-variant/20 bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">Všetky typy</option>
          <option value="ostra">Ostrá</option>
          <option value="zalohova">Zálohová</option>
          <option value="vyuctovacia">Vyúčtovacia</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-md border border-outline-variant/20 bg-transparent px-3 py-2 text-sm"
        >
          <option value="all">Všetky stavy</option>
          <option value="paid">Zaplatené</option>
          <option value="unpaid">Nezaplatené</option>
          <option value="overdue">Po splatnosti</option>
        </select>
        <Input
          placeholder="Hľadať klienta alebo číslo faktúry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant/20">
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/20">
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Číslo</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Typ</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Klient</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline text-right">Suma</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Vystavená</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Splatnosť</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Stav</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow
                key={`${row.kind}-${row.id}`}
                className="border-outline-variant/10 cursor-pointer hover:bg-surface-container"
                onClick={() => navigate(`/invoices/${row.id}`)}
              >
                <TableCell className="font-medium font-label">{row.invoice_number}</TableCell>
                <TableCell>
                  <Badge className={typeBadgeColor[row.type_label] ?? ""}>
                    {row.type_label}
                  </Badge>
                </TableCell>
                <TableCell>{row.client_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                <TableCell className="text-on-surface-variant">{formatDate(row.date_of_issue)}</TableCell>
                <TableCell className="text-on-surface-variant">{formatDate(row.date_due)}</TableCell>
                <TableCell>
                  <StatusBadge isPaid={row.is_paid} dateDue={row.date_due} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-on-surface-variant py-8">
                  Žiadne faktúry.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Expected: Table shows all invoices, filters work, search works, clicking a row navigates to detail.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Implement invoice list with filters and search"
```

---

## Task 13: Invoice Detail Page

**Files:**
- Modify: `src/pages/invoice-detail.tsx`

- [ ] **Step 1: Implement invoice detail page**

Replace `src/pages/invoice-detail.tsx`:

```typescript
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useSettings } from "@/hooks/use-settings";
import { formatCurrency, formatDate, toVariabilnySymbol } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { pdf } from "@react-pdf/renderer";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";
import { AdvancePdf } from "@/lib/pdf/advance-pdf";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { writeBinaryFile } from "@tauri-apps/plugin-fs";

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, markAsPaid: markInvoicePaid, deleteInvoice } = useInvoices();
  const { advances, markAsPaid: markAdvancePaid, deleteAdvance } = useAdvanceInvoices();
  const { settings } = useSettings();

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const invoice = invoices.find((inv) => inv.id === id);
  const advance = advances.find((adv) => adv.id === id);
  const isAdvance = !!advance;
  const data = invoice ?? advance;

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-on-surface-variant">Faktúra nenájdená.</p>
        <Button variant="link" onClick={() => navigate("/invoices")} className="text-primary mt-4">
          Späť na zoznam
        </Button>
      </div>
    );
  }

  async function handleExportPdf() {
    let blob: Blob;
    let filename: string;

    if (invoice) {
      blob = await pdf(<InvoicePdf invoice={invoice} settings={settings} />).toBlob();
      filename = `faktura-${invoice.invoice_number}.pdf`;
    } else if (advance) {
      blob = await pdf(<AdvancePdf advance={advance} settings={settings} />).toBlob();
      filename = `zalohova-faktura-${advance.invoice_number}.pdf`;
    } else {
      return;
    }

    const buffer = await blob.arrayBuffer();
    const path = await saveDialog({
      defaultPath: filename,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      await writeBinaryFile(path, new Uint8Array(buffer));
    }
  }

  async function handleMarkPaid() {
    if (invoice) {
      await markInvoicePaid(invoice.id, payDate);
    } else if (advance) {
      await markAdvancePaid(advance.id, payDate);
    }
    setPayDialogOpen(false);
  }

  async function handleDelete() {
    if (invoice) {
      await deleteInvoice(invoice.id);
    } else if (advance) {
      // Check if advance is referenced by any vyúčtovacia
      const referenced = invoices.some((inv) => inv.advance_invoice_id === advance.id);
      if (referenced) {
        alert("Túto zálohovú faktúru nie je možné zmazať — je prepojená s vyúčtovacou faktúrou.");
        setDeleteDialogOpen(false);
        return;
      }
      await deleteAdvance(advance.id);
    }
    navigate("/invoices");
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="link" onClick={() => navigate("/invoices")} className="text-primary p-0 mb-2">
            ← Späť na zoznam
          </Button>
          <h1 className="font-headline text-3xl text-on-surface">
            {isAdvance ? "Zálohová faktúra" : "Faktúra"} č. {data.invoice_number}
          </h1>
        </div>
        <StatusBadge isPaid={data.is_paid} dateDue={data.date_due} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <Button onClick={handleExportPdf} className="bg-primary text-on-primary hover:bg-primary/90">
          Exportovať PDF
        </Button>
        {!data.is_paid && (
          <Button onClick={() => setPayDialogOpen(true)} variant="outline" className="border-green-600 text-green-700">
            Označiť ako zaplatené
          </Button>
        )}
        <Button onClick={() => navigate(`/invoices/${id}/edit`)} variant="outline" className="border-outline-variant text-on-surface">
          Upraviť
        </Button>
        <Button onClick={() => setDeleteDialogOpen(true)} variant="outline" className="border-error text-error">
          Zmazať
        </Button>
      </div>

      {/* Invoice Data */}
      <Card className="p-6 bg-surface-container-lowest border-outline-variant/20 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-outline mb-2">Dodávateľ</h3>
            <p className="font-medium">{settings.supplier_name}</p>
            <p className="text-on-surface-variant text-sm">{settings.supplier_street}</p>
            <p className="text-on-surface-variant text-sm">{settings.supplier_city}</p>
            <p className="text-on-surface-variant text-sm">IČO: {settings.supplier_ico}</p>
            <p className="text-on-surface-variant text-sm">DIČ: {settings.supplier_dic}</p>
          </div>
          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-outline mb-2">Odberateľ</h3>
            <p className="font-medium">{data.client_name}</p>
            <p className="text-on-surface-variant text-sm">{data.client_street}</p>
            <p className="text-on-surface-variant text-sm">{data.client_city}</p>
            <p className="text-on-surface-variant text-sm">IČO: {data.client_ico}</p>
            <p className="text-on-surface-variant text-sm">DIČ: {data.client_dic}</p>
            {data.client_ic_dph && (
              <p className="text-on-surface-variant text-sm">IČ DPH: {data.client_ic_dph}</p>
            )}
          </div>
        </div>

        <Separator className="bg-outline-variant/20" />

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-outline">Dátum vystavenia:</span>
            <p className="font-medium">{formatDate(data.date_of_issue)}</p>
          </div>
          <div>
            <span className="text-outline">Dátum splatnosti:</span>
            <p className="font-medium">{formatDate(data.date_due)}</p>
          </div>
          {invoice && (
            <div>
              <span className="text-outline">Dátum dodania:</span>
              <p className="font-medium">{formatDate(invoice.date_of_supply)}</p>
            </div>
          )}
        </div>

        <Separator className="bg-outline-variant/20" />

        {invoice && (
          <>
            <div>
              <h3 className="font-label text-xs uppercase tracking-widest text-outline mb-2">Služba</h3>
              <p>{invoice.service_description}</p>
              {invoice.invoice_text && (
                <p className="text-on-surface-variant text-sm mt-2 whitespace-pre-line">{invoice.invoice_text}</p>
              )}
              <div className="mt-4 text-sm text-on-surface-variant">
                <span>MJ: {invoice.unit} | Množstvo: {invoice.quantity} | J. cena: {formatCurrency(invoice.unit_price)}</span>
              </div>
            </div>

            <Separator className="bg-outline-variant/20" />

            <div className="text-right space-y-1">
              <p>Odmena: <span className="font-medium">{formatCurrency(invoice.price_without_vat)}</span></p>
              {settings.is_vat_payer ? (
                <p>DPH: <span className="font-medium">{formatCurrency(invoice.vat_amount)}</span></p>
              ) : (
                <p className="italic text-on-surface-variant">Nie som platca DPH</p>
              )}
              <p className="text-lg font-bold">
                Celkom: <span className="text-secondary">{formatCurrency(invoice.total_with_vat)}</span>
              </p>
              {invoice.type === "vyuctovacia" && invoice.advance_deduction > 0 && (
                <>
                  <p className="text-secondary">
                    Odpočet zálohy ({invoice.advance_invoice_number}): -{formatCurrency(invoice.advance_deduction)}
                  </p>
                  <p className="text-xl font-bold">
                    K úhrade: <span className="text-secondary">{formatCurrency(invoice.amount_due)}</span>
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {advance && (
          <div className="text-right">
            <p>{advance.description}</p>
            <p className="text-xl font-bold mt-4">
              Záloha: <span className="text-secondary">{formatCurrency(advance.advance_amount)}</span>
            </p>
            {advance.remaining_balance !== advance.advance_amount && (
              <p className="text-on-surface-variant">
                Zostatok: {formatCurrency(advance.remaining_balance)}
              </p>
            )}
          </div>
        )}

        {data.is_paid && data.paid_date && (
          <>
            <Separator className="bg-outline-variant/20" />
            <p className="text-green-700 font-medium">
              Zaplatené dňa: {formatDate(data.paid_date)}
            </p>
          </>
        )}
      </Card>

      {/* Pay Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Označiť ako zaplatené</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="font-label text-xs uppercase tracking-widest text-outline">Dátum úhrady</label>
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Zrušiť</Button>
            <Button onClick={handleMarkPaid} className="bg-green-600 text-white">Potvrdiť</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Zmazať faktúru?</DialogTitle>
          </DialogHeader>
          <p className="text-on-surface-variant">Táto akcia je nevratná.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Zrušiť</Button>
            <Button onClick={handleDelete} className="bg-error text-on-error">Zmazať</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Expected: Detail view shows all invoice data, supplier/client columns, totals, actions. Pay/delete dialogs work.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Implement invoice detail page"
```

---

## Task 14: PDF Templates

**Files:**
- Create: `src/lib/pdf/register-fonts.ts`
- Create: `src/lib/pdf/pdf-styles.ts`
- Create: `src/lib/pdf/invoice-pdf.tsx`
- Create: `src/lib/pdf/advance-pdf.tsx`

- [ ] **Step 1: Create font registration**

Create `src/lib/pdf/register-fonts.ts`:

```typescript
import { Font } from "@react-pdf/renderer";

import NewsreaderRegular from "@/assets/fonts/Newsreader-Regular.ttf";
import NewsreaderItalic from "@/assets/fonts/Newsreader-Italic.ttf";
import NewsreaderBold from "@/assets/fonts/Newsreader-Bold.ttf";
import ManropeRegular from "@/assets/fonts/Manrope-Regular.ttf";
import ManropeMedium from "@/assets/fonts/Manrope-Medium.ttf";
import ManropeBold from "@/assets/fonts/Manrope-Bold.ttf";

Font.register({
  family: "Newsreader",
  fonts: [
    { src: NewsreaderRegular, fontWeight: 400, fontStyle: "normal" },
    { src: NewsreaderItalic, fontWeight: 400, fontStyle: "italic" },
    { src: NewsreaderBold, fontWeight: 700, fontStyle: "normal" },
  ],
});

Font.register({
  family: "Manrope",
  fonts: [
    { src: ManropeRegular, fontWeight: 400, fontStyle: "normal" },
    { src: ManropeMedium, fontWeight: 500, fontStyle: "normal" },
    { src: ManropeBold, fontWeight: 700, fontStyle: "normal" },
  ],
});
```

- [ ] **Step 2: Create shared PDF styles**

Create `src/lib/pdf/pdf-styles.ts`:

```typescript
import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  primary: "#6d5b47",
  secondary: "#735c00",
  text: "#1c1c18",
  muted: "#7f7663",
  line: "#d0c5af",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Manrope",
    fontSize: 9,
    color: colors.text,
    padding: "20mm",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 30,
  },
  title: {
    fontFamily: "Newsreader",
    fontSize: 18,
    color: colors.secondary,
    textAlign: "right",
  },
  paymentBox: {
    borderWidth: 0.5,
    borderColor: colors.line,
    borderRadius: 2,
    padding: 12,
    marginBottom: 20,
  },
  paymentLabel: {
    fontFamily: "Manrope",
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  paymentKey: {
    fontSize: 9,
    color: colors.muted,
  },
  paymentValue: {
    fontSize: 9,
    fontWeight: 500,
  },
  paymentAmount: {
    fontFamily: "Newsreader",
    fontSize: 14,
    fontWeight: 700,
    color: colors.secondary,
  },
  twoCol: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 20,
  },
  col: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 1,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  dateLabel: {
    width: 150,
    fontSize: 9,
    color: colors.muted,
  },
  dateValue: {
    fontSize: 9,
    fontWeight: 500,
  },
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    marginVertical: 12,
  },
  serviceHeader: {
    fontFamily: "Manrope",
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 9,
    marginBottom: 8,
    lineHeight: 1.4,
  },
  serviceDetail: {
    flexDirection: "row",
    gap: 20,
    fontSize: 8,
    color: colors.muted,
    marginBottom: 12,
  },
  totalsContainer: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 9,
    color: colors.muted,
    marginRight: 20,
    textAlign: "right",
    width: 120,
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 500,
    textAlign: "right",
    width: 80,
  },
  totalMain: {
    fontFamily: "Newsreader",
    fontSize: 13,
    fontWeight: 700,
    color: colors.secondary,
    textAlign: "right",
    width: 80,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 8,
    color: colors.muted,
    borderTopWidth: 0.5,
    borderTopColor: colors.line,
    paddingTop: 4,
  },
  issuedBy: {
    fontSize: 8,
    color: colors.muted,
    marginTop: 20,
  },
  disclaimer: {
    fontSize: 10,
    fontWeight: 700,
    color: colors.primary,
    textAlign: "center",
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  vatNote: {
    fontSize: 9,
    fontStyle: "italic",
    color: colors.muted,
    textAlign: "right",
  },
});
```

- [ ] **Step 3: Create ostrá/vyúčtovacia PDF template**

Create `src/lib/pdf/invoice-pdf.tsx`:

```typescript
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import "./register-fonts";
import { styles, colors } from "./pdf-styles";
import { Invoice, Settings } from "@/lib/types";
import { formatCurrency, formatDate, toVariabilnySymbol } from "@/lib/formatting";
import logoDark from "@/assets/logo-dark.png";

interface InvoicePdfProps {
  invoice: Invoice;
  settings: Settings;
}

export function InvoicePdf({ invoice, settings }: InvoicePdfProps) {
  const vs = toVariabilnySymbol(invoice.invoice_number);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoDark} style={styles.logo} />
          <Text style={styles.title}>FAKTÚRA č. {invoice.invoice_number}</Text>
        </View>

        {/* Payment Box */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Inštrukcie k úhrade faktúry</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Suma k úhrade:</Text>
            <Text style={styles.paymentAmount}>{formatCurrency(invoice.amount_due)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Splatnosť:</Text>
            <Text style={styles.paymentValue}>{formatDate(invoice.date_due)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Číslo účtu:</Text>
            <Text style={styles.paymentValue}>{settings.supplier_iban}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Banka:</Text>
            <Text style={styles.paymentValue}>{settings.supplier_bank}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Variabilný symbol:</Text>
            <Text style={styles.paymentValue}>{vs}</Text>
          </View>
        </View>

        {/* Supplier / Client */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Dodávateľ</Text>
            <Text style={styles.companyName}>{settings.supplier_name}</Text>
            <Text style={styles.companyDetail}>{settings.supplier_street}</Text>
            <Text style={styles.companyDetail}>{settings.supplier_city}</Text>
            <Text style={styles.companyDetail}>IČO: {settings.supplier_ico}</Text>
            <Text style={styles.companyDetail}>DIČ: {settings.supplier_dic}</Text>
            {settings.supplier_ic_dph && (
              <Text style={styles.companyDetail}>IČ DPH: {settings.supplier_ic_dph}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Odberateľ</Text>
            <Text style={styles.companyName}>{invoice.client_name}</Text>
            <Text style={styles.companyDetail}>{invoice.client_street}</Text>
            <Text style={styles.companyDetail}>{invoice.client_city}</Text>
            <Text style={styles.companyDetail}>IČO: {invoice.client_ico}</Text>
            <Text style={styles.companyDetail}>DIČ: {invoice.client_dic}</Text>
            {invoice.client_ic_dph && invoice.client_ic_dph !== "N/A" && (
              <Text style={styles.companyDetail}>IČ DPH: {invoice.client_ic_dph}</Text>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={{ marginBottom: 12 }}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum vystavenia faktúry:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.date_of_issue)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum splatnosti:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.date_due)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum dodania služby:</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.date_of_supply)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Service */}
        <Text style={styles.serviceHeader}>Označenie poskytnutej služby</Text>
        <Text style={styles.serviceText}>{invoice.service_description}</Text>
        {invoice.invoice_text && (
          <Text style={styles.serviceText}>{invoice.invoice_text}</Text>
        )}
        <View style={styles.serviceDetail}>
          <Text>MJ: {invoice.unit}</Text>
          <Text>Množstvo: {invoice.quantity}</Text>
          <Text>J. cena: {formatCurrency(invoice.unit_price)}</Text>
          <Text>Cena bez DPH: {formatCurrency(invoice.price_without_vat)}</Text>
        </View>

        <View style={styles.separator} />

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Odmena:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.price_without_vat)}</Text>
          </View>
          {settings.is_vat_payer ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>DPH (20%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.vat_amount)}</Text>
            </View>
          ) : (
            <Text style={styles.vatNote}>Nie som platca DPH</Text>
          )}
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Celkom k úhrade:</Text>
            <Text style={styles.totalMain}>{formatCurrency(invoice.total_with_vat)}</Text>
          </View>
        </View>

        {/* Vyúčtovacia advance deduction */}
        {invoice.type === "vyuctovacia" && invoice.advance_deduction > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={styles.separator} />
            <Text style={{ fontSize: 9, marginBottom: 8 }}>
              Odpočet zo zálohovej faktúry č. {invoice.advance_invoice_number}:{" "}
              <Text style={{ fontWeight: 700, color: colors.secondary }}>
                -{formatCurrency(invoice.advance_deduction)}
              </Text>
            </Text>
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Spolu na úhradu:</Text>
                <Text style={styles.totalValue}>{formatCurrency(invoice.price_without_vat)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Zálohovo uhradené:</Text>
                <Text style={[styles.totalValue, { color: colors.secondary }]}>
                  -{formatCurrency(invoice.advance_deduction)}
                </Text>
              </View>
              {settings.is_vat_payer && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>DPH:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(invoice.vat_amount)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, { marginTop: 4 }]}>
                <Text style={styles.totalLabel}>K úhrade:</Text>
                <Text style={styles.totalMain}>{formatCurrency(invoice.amount_due)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Dodávateľ</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Za odberateľa faktúru prevzal:</Text>
            <Text style={[styles.footerLabel, { marginTop: 12 }]}>dňa:</Text>
          </View>
        </View>

        <Text style={styles.issuedBy}>Faktúru vystavil: {invoice.issued_by}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Create zálohová PDF template**

Create `src/lib/pdf/advance-pdf.tsx`:

```typescript
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import "./register-fonts";
import { styles, colors } from "./pdf-styles";
import { AdvanceInvoice, Settings } from "@/lib/types";
import { formatCurrency, formatDate, toVariabilnySymbol } from "@/lib/formatting";
import logoDark from "@/assets/logo-dark.png";

interface AdvancePdfProps {
  advance: AdvanceInvoice;
  settings: Settings;
}

export function AdvancePdf({ advance, settings }: AdvancePdfProps) {
  const vs = toVariabilnySymbol(advance.invoice_number);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={logoDark} style={styles.logo} />
          <Text style={styles.title}>ZÁLOHOVÁ FAKTÚRA č. {advance.invoice_number}</Text>
        </View>

        {/* Payment Box */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentLabel}>Inštrukcie k úhrade</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Suma k úhrade:</Text>
            <Text style={styles.paymentAmount}>{formatCurrency(advance.advance_amount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Splatnosť:</Text>
            <Text style={styles.paymentValue}>{formatDate(advance.date_due)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Číslo účtu:</Text>
            <Text style={styles.paymentValue}>{settings.supplier_iban}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Banka:</Text>
            <Text style={styles.paymentValue}>{settings.supplier_bank}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Forma úhrady:</Text>
            <Text style={styles.paymentValue}>{advance.payment_method}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Variabilný symbol:</Text>
            <Text style={styles.paymentValue}>{vs}</Text>
          </View>
        </View>

        {/* Supplier / Client */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Dodávateľ</Text>
            <Text style={styles.companyName}>{settings.supplier_name}</Text>
            <Text style={styles.companyDetail}>{settings.supplier_street}</Text>
            <Text style={styles.companyDetail}>{settings.supplier_city}</Text>
            <Text style={styles.companyDetail}>IČO: {settings.supplier_ico}</Text>
            <Text style={styles.companyDetail}>DIČ: {settings.supplier_dic}</Text>
            {settings.supplier_ic_dph && (
              <Text style={styles.companyDetail}>IČ DPH: {settings.supplier_ic_dph}</Text>
            )}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Odberateľ</Text>
            <Text style={styles.companyName}>{advance.client_name}</Text>
            <Text style={styles.companyDetail}>{advance.client_street}</Text>
            <Text style={styles.companyDetail}>{advance.client_city}</Text>
            <Text style={styles.companyDetail}>IČO: {advance.client_ico}</Text>
            <Text style={styles.companyDetail}>DIČ: {advance.client_dic}</Text>
            {advance.client_ic_dph && advance.client_ic_dph !== "N/A" && (
              <Text style={styles.companyDetail}>IČ DPH: {advance.client_ic_dph}</Text>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={{ marginBottom: 12 }}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum vystavenia:</Text>
            <Text style={styles.dateValue}>{formatDate(advance.date_of_issue)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Dátum splatnosti:</Text>
            <Text style={styles.dateValue}>{formatDate(advance.date_due)}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Description */}
        <Text style={styles.serviceHeader}>Označenie služby, ku ktorej sa skladá záloha</Text>
        <Text style={styles.serviceText}>{advance.description}</Text>

        <View style={styles.separator} />

        {/* Total */}
        <View style={styles.totalsContainer}>
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Celkom:</Text>
            <Text style={styles.totalMain}>{formatCurrency(advance.advance_amount)}</Text>
          </View>
        </View>

        {!settings.is_vat_payer && (
          <Text style={[styles.vatNote, { marginTop: 8 }]}>Nie som platca DPH</Text>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>ZÁLOHOVÁ FAKTÚRA NIE JE DAŇOVÝ DOKLAD!</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Dodávateľ</Text>
          </View>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>Za odberateľa faktúru prevzal:</Text>
            <Text style={[styles.footerLabel, { marginTop: 12 }]}>dňa:</Text>
          </View>
        </View>

        <Text style={styles.issuedBy}>Faktúru vystavil: {advance.issued_by}</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: Verify PDF generation**

Create a test invoice, click "Uložiť a exportovať PDF". Expected: Save dialog opens, PDF is saved with correct layout, embedded fonts, Slovak characters, Noveris branding.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add PDF templates for all invoice types"
```

---

## Task 15: Dashboard Page

**Files:**
- Modify: `src/pages/dashboard.tsx`

- [ ] **Step 1: Implement dashboard**

Replace `src/pages/dashboard.tsx`:

```typescript
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function Dashboard() {
  const { invoices } = useInvoices();
  const { advances } = useAdvanceInvoices();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thisMonthInvoices = invoices.filter((inv) =>
      inv.date_of_issue.startsWith(currentMonth)
    );
    const thisMonthAdvances = advances.filter((adv) =>
      adv.date_of_issue.startsWith(currentMonth)
    );

    const invoiceCount = thisMonthInvoices.length + thisMonthAdvances.length;

    const revenue =
      thisMonthInvoices.reduce((sum, inv) => sum + inv.amount_due, 0) +
      thisMonthAdvances.reduce((sum, adv) => sum + adv.advance_amount, 0);

    const unpaidInvoices = invoices.filter((inv) => !inv.is_paid);
    const unpaidAdvances = advances.filter((adv) => !adv.is_paid);
    const unpaidTotal =
      unpaidInvoices.reduce((sum, inv) => sum + inv.amount_due, 0) +
      unpaidAdvances.reduce((sum, adv) => sum + adv.advance_amount, 0);
    const unpaidCount = unpaidInvoices.length + unpaidAdvances.length;

    return { invoiceCount, revenue, unpaidTotal, unpaidCount };
  }, [invoices, advances]);

  const recentItems = useMemo(() => {
    const all = [
      ...invoices.map((inv) => ({
        id: inv.id,
        number: inv.invoice_number,
        client: inv.client_name,
        amount: inv.amount_due,
        date: inv.date_of_issue,
        dateDue: inv.date_due,
        isPaid: inv.is_paid,
      })),
      ...advances.map((adv) => ({
        id: adv.id,
        number: adv.invoice_number,
        client: adv.client_name,
        amount: adv.advance_amount,
        date: adv.date_of_issue,
        dateDue: adv.date_due,
        isPaid: adv.is_paid,
      })),
    ];
    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [invoices, advances]);

  return (
    <div>
      <h1 className="font-headline text-3xl text-on-surface mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">Faktúry tento mesiac</p>
          <p className="font-headline text-3xl text-primary">{stats.invoiceCount}</p>
        </Card>
        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">Tržby tento mesiac</p>
          <p className="font-headline text-3xl text-secondary">{formatCurrency(stats.revenue)}</p>
        </Card>
        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">Neuhradené</p>
          <p className="font-headline text-3xl text-error">{formatCurrency(stats.unpaidTotal)}</p>
          <p className="text-xs text-on-surface-variant mt-1">{stats.unpaidCount} faktúr</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Button onClick={() => navigate("/invoices/new")} className="bg-primary text-on-primary hover:bg-primary/90">
          Nová ostrá faktúra
        </Button>
        <Button onClick={() => navigate("/invoices/new")} variant="outline" className="border-primary text-primary">
          Nová zálohová faktúra
        </Button>
        <Button onClick={() => navigate("/invoices/new")} variant="outline" className="border-primary text-primary">
          Nová vyúčtovacia faktúra
        </Button>
      </div>

      {/* Recent Invoices */}
      <Card className="bg-surface-container-lowest border-outline-variant/20">
        <div className="p-4 border-b border-outline-variant/20">
          <h2 className="font-headline text-lg text-primary">Posledné faktúry</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/20">
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Číslo</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Klient</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline text-right">Suma</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Dátum</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-widest text-outline">Stav</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentItems.map((item) => (
              <TableRow
                key={item.id}
                className="border-outline-variant/10 cursor-pointer hover:bg-surface-container"
                onClick={() => navigate(`/invoices/${item.id}`)}
              >
                <TableCell className="font-medium font-label">{item.number}</TableCell>
                <TableCell>{item.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                <TableCell className="text-on-surface-variant">{formatDate(item.date)}</TableCell>
                <TableCell>
                  <StatusBadge isPaid={item.isPaid} dateDue={item.dateDue} />
                </TableCell>
              </TableRow>
            ))}
            {recentItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-on-surface-variant py-8">
                  Zatiaľ žiadne faktúry.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Expected: Dashboard shows stats cards, quick action buttons, recent invoices table.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Implement dashboard with stats and recent invoices"
```

---

## Task 16: End-to-End Verification

- [ ] **Step 1: Full workflow test**

Run `npm run tauri dev` and verify the complete flow:

1. Open Settings → verify defaults populated → save IBAN and bank name
2. Create an ostrá invoice → fill client → fill service → save → verify in list
3. Export PDF → verify layout, fonts, Slovak characters, amounts
4. Mark as paid → verify status updates
5. Create a zálohová invoice → save → mark as paid
6. Create a vyúčtovacia invoice → select the paid advance → verify deduction in summary → save → export PDF
7. Check Dashboard stats update correctly
8. Check client autocomplete works for a previously saved client
9. Export CSV → verify semicolons, Slovak dates, BOM encoding
10. Delete an invoice → verify it's gone

- [ ] **Step 2: Run all tests**

```bash
npm run test
```

Expected: All unit tests pass (formatting, invoicing, storage, csv-export).

- [ ] **Step 3: Fix any issues found during verification**

Address any bugs or rendering issues.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Fix issues found during e2e verification"
```

---

## Task 17: Build for Distribution

- [ ] **Step 1: Generate app icons**

Use the Noveris logo SVG to generate Tauri icon set:

```bash
cd /Users/mbr/projects/NoverisLegal/invoices/noveris-invoicing
npm run tauri icon /Users/mbr/projects/NoverisLegal/noveris-legal-logo.svg
```

This generates all required icon sizes in `src-tauri/icons/`.

- [ ] **Step 2: Build the .app**

```bash
npm run tauri build
```

Expected: Produces `src-tauri/target/release/bundle/macos/Noveris Invoicing.app` and a `.dmg`.

- [ ] **Step 3: Test the built app**

Open the `.app` from the build output. Verify:
- App launches correctly
- Data is stored in `~/Library/Application Support/com.noveris.invoicing/`
- PDF export works
- All features functional

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Configure build and app icons for distribution"
```
