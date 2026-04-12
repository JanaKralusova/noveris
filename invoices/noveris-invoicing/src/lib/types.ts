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
