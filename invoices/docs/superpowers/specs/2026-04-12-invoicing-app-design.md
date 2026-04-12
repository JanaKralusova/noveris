# Noveris Legal Invoicing App — Design Spec

## Overview

A self-contained macOS desktop app (Tauri v2) for Noveris Legal s. r. o. that replaces an Excel-based invoicing workflow. Single user (Jana Králusová), no accounts, no server. All data stored as flat files (JSONL) on the local filesystem. Generates branded PDF invoices and supports CSV export for accounting.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Shell | Tauri v2 | Lightweight .app (~10 MB), native macOS WebKit, built-in FS plugins |
| Frontend | React + TypeScript | Ecosystem, type safety, pairs with @react-pdf |
| Styling | shadcn/ui + Tailwind CSS | Pre-built form components + Noveris design tokens |
| PDF | @react-pdf/renderer | JSX-based PDF templates, font embedding, no native deps |
| Storage | JSONL flat files via @tauri-apps/plugin-fs | Simple, inspectable, matches original spec |
| Routing | React Router | Client-side navigation |
| Build | Vite | Fast dev server, Tauri default |

No custom Rust backend commands. The Rust side is default Tauri scaffolding only. All business logic lives in TypeScript.

---

## Architecture

```
Tauri shell (default Rust scaffolding)
└── React + TypeScript SPA
    ├── UI: shadcn/ui + Tailwind (Noveris design tokens)
    ├── State: React hooks for JSONL CRUD
    ├── Storage: @tauri-apps/plugin-fs
    │   → ~/Library/Application Support/com.noveris.invoicing/
    │   ├── invoices.jsonl
    │   ├── advance_invoices.jsonl
    │   ├── clients.jsonl
    │   └── settings.json
    ├── PDF: @react-pdf/renderer (Newsreader + Manrope embedded)
    └── Export: CSV in TS, PDF save via plugin-dialog
```

---

## Project Structure

```
noveris-invoicing/
├── src-tauri/
│   ├── src/
│   │   └── lib.rs              # Default Tauri setup, no custom commands
│   ├── Cargo.toml
│   ├── tauri.conf.json         # App config, permissions, window settings
│   └── icons/                  # App icons derived from noveris-legal-logo.svg
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Router + layout shell
│   ├── lib/
│   │   ├── storage.ts          # JSONL read/write via Tauri FS plugin
│   │   ├── invoicing.ts        # Auto-numbering, calculations, validation
│   │   ├── pdf/
│   │   │   ├── invoice-pdf.tsx     # @react-pdf ostrá/vyúčtovacia template
│   │   │   └── advance-pdf.tsx     # @react-pdf zálohová template
│   │   ├── csv-export.ts       # CSV generation for all invoice types
│   │   └── types.ts            # TypeScript types
│   ├── hooks/
│   │   ├── use-invoices.ts     # CRUD + query hooks for invoices
│   │   ├── use-advance-invoices.ts
│   │   ├── use-clients.ts
│   │   └── use-settings.ts
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── invoice-list.tsx
│   │   ├── invoice-form.tsx    # Create/edit — all 3 types
│   │   ├── invoice-detail.tsx
│   │   ├── client-list.tsx
│   │   └── settings.tsx
│   ├── components/
│   │   └── ...                 # Shared UI (layout, nav, sidebar, etc.)
│   └── assets/
│       └── fonts/
│           ├── Newsreader-*.ttf
│           └── Manrope-*.ttf
├── package.json
├── tsconfig.json
├── tailwind.config.ts          # Noveris design tokens
└── vite.config.ts
```

---

## Data Types

### Invoice (ostrá + vyúčtovacia)

```typescript
type InvoiceType = "ostra" | "vyuctovacia"
type BillingType = "hourly" | "fixed"

interface Invoice {
  id: string                          // UUID v4
  type: InvoiceType
  invoice_number: string              // "YYYYMM-NN"
  client_name: string
  client_street: string
  client_city: string
  client_ico: string
  client_dic: string
  client_ic_dph: string
  service_description: string
  invoice_text: string                // Full multiline description
  billing_type: BillingType
  unit: "hod." | "ks"                // Auto-set from billing_type
  quantity: number
  unit_price: number
  price_without_vat: number           // Computed: quantity * unit_price
  vat_rate: number                    // 0 or 0.20
  vat_amount: number                  // Computed: price_without_vat * vat_rate
  total_with_vat: number              // Computed: price_without_vat + vat_amount
  advance_invoice_id: string | null   // Only for vyuctovacia
  advance_invoice_number: string | null
  advance_deduction: number           // 0 for ostra
  amount_due: number                  // Computed: total_with_vat - advance_deduction
  date_of_supply: string              // ISO date "YYYY-MM-DD"
  date_of_issue: string
  date_due: string
  issued_by: string
  payment_method: string
  note: string                        // Internal, not shown on PDF
  is_paid: boolean
  paid_date: string | null
  created_at: string                  // ISO datetime
}
```

### AdvanceInvoice (zálohová)

```typescript
interface AdvanceInvoice {
  id: string
  invoice_number: string              // "ZAL{YY}{NNN}"
  client_name: string
  client_street: string
  client_city: string
  client_ico: string
  client_dic: string
  client_ic_dph: string
  advance_amount: number
  remaining_balance: number           // Decremented on settlement
  date_of_issue: string
  date_due: string
  description: string
  issued_by: string
  payment_method: string
  is_paid: boolean
  paid_date: string | null
  status: "uhradená" | "neuhradená"
  created_at: string
}
```

### Client

```typescript
interface Client {
  id: string
  name: string
  street: string
  city: string
  ico: string
  dic: string
  ic_dph: string
  last_used: string                   // ISO datetime
}
```

### Settings

```typescript
interface Settings {
  supplier_name: string               // Default: "Noveris Legal s. r. o."
  supplier_street: string             // Default: "Turčianska 42"
  supplier_city: string               // Default: "821 09 Bratislava"
  supplier_ico: string                // Default: "57 493 685"
  supplier_dic: string                // Default: "2122782200"
  supplier_ic_dph: string             // Default: ""
  supplier_iban: string               // Default: "SK00 0000 0000 0000 0000 0000"
  supplier_bank: string               // Default: ""
  is_vat_payer: boolean               // Default: false
  vat_rate: number                    // Default: 0.20
  default_payment_method: string      // Default: "bezhotovostne"
  default_due_days: number            // Default: 14
}
```

---

## Data Layer

### Storage

All data stored in `~/Library/Application Support/com.noveris.invoicing/` via `@tauri-apps/plugin-fs`.

- **On app start**: Each hook reads its JSONL file, parses each line as JSON into an array
- **On mutation**: Update React state, rewrite the full JSONL file to disk
- **Settings**: Single `settings.json` file (not JSONL)
- **File creation**: If a file doesn't exist on first read, create it (empty JSONL or default settings)

### Auto-numbering

**Ostrá / Vyúčtovacia** (`YYYYMM-NN`):
1. Extract YYYYMM from date_of_issue
2. Filter existing invoices for that prefix
3. Find highest NN, return NN+1 zero-padded to 2 digits
4. If none exist, start at 01

**Zálohová** (`ZAL{YY}{NNN}`):
1. Extract last 2 digits of year from date_of_issue
2. Filter existing advance invoices for that ZAL{YY} prefix
3. Find highest NNN, return NNN+1 zero-padded to 3 digits
4. If none exist, start at 001

### Validation Rules

- Required: client_name, dates, quantity > 0 (ostrá/vyúčtovacia), advance_amount > 0 (zálohová)
- date_due >= date_of_issue
- Invoice number uniqueness enforced
- Vyúčtovacia: selected advance must be paid with remaining_balance > 0
- advance_deduction = min(total_with_vat, remaining_balance)
- amount_due = max(0, total_with_vat - advance_deduction)

### Settlement Logic

When saving a vyúčtovacia:
1. Set advance_deduction = min(total_with_vat, selected_advance.remaining_balance)
2. Set amount_due = max(0, total_with_vat - advance_deduction)
3. Update the selected advance's remaining_balance -= advance_deduction

---

## UI Design

### Design Tokens

Lifted from the Noveris Legal website (`index.html`):

- **Fonts**: Newsreader (serif — headings), Manrope (sans-serif — body, labels)
- **Colors**: Full Material Design 3 palette from the website:
  - Primary: `#6d5b47` (warm brown)
  - Secondary: `#735c00` (dark gold)
  - Background: `#fcf9f2` (warm cream)
  - Surface variants: `#f6f3ec`, `#f0eee7`, `#ebe8e1`, `#e5e2db`
  - On-surface: `#1c1c18`
  - Outline: `#7f7663`
  - Outline-variant: `#d0c5af`
  - Gradient accent: `linear-gradient(45deg, #6d5b47, #c6af97)`
- **Typography**: Uppercase tracking-widest on labels, italic serif for emphasis
- **Borders**: Subtle, `border-outline-variant/20`
- **Shadows**: Soft editorial shadows (`0 10px 32px -4px rgba(28,28,24,0.06)`)
- **Border radius**: Minimal (`0.125rem` default, `0.25rem` lg)

### Layout

Persistent left sidebar + main content area:
- Sidebar: Noveris logo at top, nav links (Dashboard, Faktúry, Klienti, Nastavenia), "Nová faktúra" primary action button
- Main: Page content with consistent padding

### Pages

**Dashboard**:
- Three stat cards: invoices this month, revenue this month, unpaid total
- Quick action buttons for each invoice type
- Recent invoices table (last 10 with status indicators)

**Faktúry (Invoice List)**:
- Filter bar: type dropdown, status dropdown, month/year picker, client search text
- Table columns: number, type (badge), client, amount, issue date, due date, status (badge)
- Status badges: zaplatená (green), nezaplatená (neutral), po splatnosti (red/warm)
- Overdue highlighting on rows
- Click row → detail view
- Both regular and advance invoices in one unified list

**Nová faktúra (Invoice Form)**:
- Type selector tabs at top: Ostrá / Zálohová / Vyúčtovacia
- Client section with autocomplete from saved clients (auto-fill on select)
- "Uložiť klienta" checkbox
- Fields adapt per type:
  - Ostrá/Vyúčtovacia: billing type toggle, quantity, unit price, service description, invoice text
  - Zálohová: amount, description
- Vyúčtovacia: dropdown of paid advances with remaining_balance > 0
- Real-time computed summary card (subtotal, VAT, total, advance deduction, amount due)
- Actions: "Uložiť", "Uložiť a exportovať PDF"

**Detail faktúry**:
- Clean read-only layout of all invoice data
- Actions: "Exportovať PDF", "Označiť ako zaplatené" (date picker), "Upraviť", "Zmazať" (confirmation dialog)
- Vyúčtovacia: shows linked advance with clickable link

**Klienti**:
- Table of saved clients
- Add / edit / delete

**Nastavenia**:
- Supplier details form (all Settings fields)
- VAT toggle with explanation text
- Default due days
- Export section: "Exportovať CSV" (all invoices as semicolon-delimited CSV), "Exportovať dáta" (zip of all 4 data files: invoices.jsonl, advance_invoices.jsonl, clients.jsonl, settings.json — for backup/migration)

---

## PDF Templates

### Shared Styling

- Fonts: Newsreader (title, amounts) + Manrope (body, labels) — TTF files embedded via `Font.register()`
- Colors: `#6d5b47` for headings/lines, `#1c1c18` for body, `#735c00` for invoice number and amount due
- Separators: 0.5pt lines in `#d0c5af`
- A4 portrait, ~20mm margins
- Noveris logo at top-left (embedded from SVG/PNG asset)
- Currency: Slovak locale (`1 234,56 €`)
- Dates: `DD.MM.YYYY`

### Variabilný Symbol

Derived from invoice number by stripping non-numeric characters:
- `202604-01` → `20260401`
- `ZAL26001` → `26001`

### Ostrá Faktúra Layout

```
[Logo]                          FAKTÚRA č. {invoice_number}

Inštrukcie k úhrade faktúry:
┌─────────────────────────────────────────────┐
│ Suma k úhrade:      {amount_due} €          │
│ Splatnosť:          {date_due}              │
│ Číslo účtu:         {supplier_iban}         │
│ Banka:              {supplier_bank}         │
│ Variabilný symbol:  {variabilny_symbol}     │
└─────────────────────────────────────────────┘

Dodávateľ:                    Odberateľ:
{supplier details}            {client details}

Dátum vystavenia:    {date_of_issue}
Dátum splatnosti:    {date_due}
Dátum dodania:       {date_of_supply}

Označenie poskytnutej služby:
{description}    MJ   Množstvo   J.cena   Cena bez DPH

                              Odmena:          {price_without_vat} €
                              DPH:             {vat_amount} €
                              (or "Nie som platca DPH")
                              Celkom k úhrade: {total_with_vat} €

Dodávateľ:                    Za odberateľa prevzal:
                              dňa:

Faktúru vystavil: {issued_by}
```

### Zálohová Faktúra Layout

Same structure but:
- Title: "ZÁLOHOVÁ FAKTÚRA č. {invoice_number}"
- No service line table — just description and total
- No "Dátum dodania služby"
- Footer: "ZÁLOHOVÁ FAKTÚRA NIE JE DAŇOVÝ DOKLAD!"

### Vyúčtovacia Faktúra Layout

Same as ostrá but after the service totals:
```
Zálohovo uhradené:
Odpočet zo zálohovej faktúry č. {advance_number}: -{advance_deduction} €

                              spolu na úhradu:    {price_without_vat} €
                              zálohovo uhradené:  -{advance_deduction} €
                              DPH:                {vat_amount} €
                              k úhrade:           {amount_due} €
```

---

## CSV Export

- **Content**: All invoices (ostrá, vyúčtovacia, zálohová) combined, sorted by date of issue descending
- **Columns**: Číslo faktúry, Typ, Klient, IČO klienta, DIČ klienta, Dátum vystavenia, Dátum splatnosti, Dátum dodania, Suma bez DPH, DPH, Celkom, Záloha, K úhrade, Zaplatené, Dátum úhrady
- **Encoding**: UTF-8 with BOM (for Excel on Windows compatibility)
- **Delimiter**: Semicolon (`;`) — standard for European CSV where comma is decimal separator
- **Decimal separator**: Comma (`1234,56`)
- **Dates**: `DD.MM.YYYY`
- **No currency symbols** in data cells
- **Trigger**: Button in Settings page
- **Default filename**: `faktury-export-YYYY-MM-DD.csv`
- **Save**: Via Tauri dialog plugin (user picks location)

---

## Edge Cases & Safeguards

- Invoice number uniqueness enforced before save
- Deleting a zálohová referenced by a vyúčtovacia: blocked with explanation
- Editing an already-exported-as-PDF invoice: warning shown
- Vyúčtovacia advance dropdown: only paid advances with remaining_balance > 0
- If advance fully covers the invoice (amount_due <= 0): set amount_due to 0
- Settings file missing on first launch: created with hardcoded Noveris Legal defaults
- JSONL file missing on first launch: created empty
- All dates validated: due >= issue

---

## Distribution

- `tauri build` produces a signed `.app` bundle and `.dmg`
- Bundle size: ~10 MB (uses macOS native WebKit)
- Data directory: `~/Library/Application Support/com.noveris.invoicing/` (invisible to user in Finder, survives app updates)
- App icons derived from `noveris-legal-logo.svg`
