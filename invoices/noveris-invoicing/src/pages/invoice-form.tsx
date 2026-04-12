import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientAutocomplete } from "@/components/client-autocomplete";
import { InvoiceSummaryCard } from "@/components/invoice-summary-card";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useClients } from "@/hooks/use-clients";
import { useSettings } from "@/hooks/use-settings";
import {
  nextInvoiceNumber,
  nextAdvanceNumber,
  computeInvoiceTotals,
  computeAdvanceDeduction,
  validateInvoice,
  validateAdvanceInvoice,
} from "@/lib/invoicing";
import { formatCurrency } from "@/lib/formatting";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";
import { AdvancePdf } from "@/lib/pdf/advance-pdf";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { InvoiceType, BillingType, Invoice, AdvanceInvoice } from "@/lib/types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type FormType = "ostra" | "zalohova" | "vyuctovacia";

export function InvoiceForm() {
  const navigate = useNavigate();
  const { invoices, addInvoice } = useInvoices();
  const { advances, addAdvance, deductFromAdvance, availableForSettlement } =
    useAdvanceInvoices();
  const { clients, upsertClient } = useClients();
  const { settings } = useSettings();

  // --- Form type ---
  const [formType, setFormType] = useState<FormType>("ostra");

  // --- Client fields ---
  const [clientName, setClientName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientIco, setClientIco] = useState("");
  const [clientDic, setClientDic] = useState("");
  const [clientIcDph, setClientIcDph] = useState("");
  const [saveClient, setSaveClient] = useState(false);

  // --- Service fields (ostra/vyuctovacia) ---
  const [billingType, setBillingType] = useState<BillingType>("hourly");
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [serviceDescription, setServiceDescription] = useState("");
  const [invoiceText, setInvoiceText] = useState("");

  // --- Advance fields (zalohova) ---
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceDescription, setAdvanceDescription] = useState("");

  // --- Settlement fields (vyuctovacia) ---
  const [selectedAdvanceId, setSelectedAdvanceId] = useState("");

  // --- Date fields ---
  const [dateOfSupply, setDateOfSupply] = useState(todayISO());
  const [dateOfIssue, setDateOfIssue] = useState(todayISO());
  const [dateDue, setDateDue] = useState(
    addDays(todayISO(), settings.default_due_days)
  );

  // --- Other fields ---
  const [issuedBy, setIssuedBy] = useState(settings.supplier_name);
  const [paymentMethod, setPaymentMethod] = useState(
    settings.default_payment_method
  );
  const [note, setNote] = useState("");

  // --- Errors ---
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-update due date when issue date changes
  useEffect(() => {
    setDateDue(addDays(dateOfIssue, settings.default_due_days));
  }, [dateOfIssue, settings.default_due_days]);

  // Sync defaults from settings
  useEffect(() => {
    setIssuedBy(settings.supplier_name);
    setPaymentMethod(settings.default_payment_method);
  }, [settings.supplier_name, settings.default_payment_method]);

  // --- Computed totals ---
  const vatRate = settings.is_vat_payer ? settings.vat_rate : 0;
  const totals = useMemo(
    () => computeInvoiceTotals(quantity, unitPrice, vatRate),
    [quantity, unitPrice, vatRate]
  );

  const selectedAdvance = useMemo(
    () => availableForSettlement.find((a) => a.id === selectedAdvanceId),
    [availableForSettlement, selectedAdvanceId]
  );

  const deduction = useMemo(() => {
    if (formType !== "vyuctovacia" || !selectedAdvance) {
      return { advance_deduction: 0, amount_due: totals.total_with_vat };
    }
    return computeAdvanceDeduction(
      totals.total_with_vat,
      selectedAdvance.remaining_balance
    );
  }, [formType, selectedAdvance, totals.total_with_vat]);

  // --- Client autocomplete handler ---
  function handleClientSelect(client: (typeof clients)[number]) {
    setClientName(client.name);
    setClientStreet(client.street);
    setClientCity(client.city);
    setClientIco(client.ico);
    setClientDic(client.dic);
    setClientIcDph(client.ic_dph);
  }

  // --- Save logic ---
  async function handleSave() {
    setErrors([]);

    if (formType === "zalohova") {
      const validationErrors = validateAdvanceInvoice({
        client_name: clientName,
        advance_amount: advanceAmount,
      });
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (saveClient) {
        await upsertClient({
          name: clientName,
          street: clientStreet,
          city: clientCity,
          ico: clientIco,
          dic: clientDic,
          ic_dph: clientIcDph,
        });
      }

      const invoiceNumber = nextAdvanceNumber(advances, dateOfIssue);

      await addAdvance({
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
    } else {
      const invoiceType: InvoiceType = formType === "ostra" ? "ostra" : "vyuctovacia";

      const validationErrors = validateInvoice({
        client_name: clientName,
        quantity,
        unit_price: unitPrice,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        date_of_supply: dateOfSupply,
      });
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (saveClient) {
        await upsertClient({
          name: clientName,
          street: clientStreet,
          city: clientCity,
          ico: clientIco,
          dic: clientDic,
          ic_dph: clientIcDph,
        });
      }

      const invoiceNumber = nextInvoiceNumber(invoices, dateOfIssue);
      const computed = computeInvoiceTotals(quantity, unitPrice, vatRate);

      let advInvoiceId: string | null = null;
      let advInvoiceNumber: string | null = null;
      let advDeduction = 0;
      let finalAmountDue = computed.total_with_vat;

      if (formType === "vyuctovacia" && selectedAdvance) {
        const ded = computeAdvanceDeduction(
          computed.total_with_vat,
          selectedAdvance.remaining_balance
        );
        advInvoiceId = selectedAdvance.id;
        advInvoiceNumber = selectedAdvance.invoice_number;
        advDeduction = ded.advance_deduction;
        finalAmountDue = ded.amount_due;
      }

      await addInvoice({
        type: invoiceType,
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
        price_without_vat: computed.price_without_vat,
        vat_rate: vatRate,
        vat_amount: computed.vat_amount,
        total_with_vat: computed.total_with_vat,
        advance_invoice_id: advInvoiceId,
        advance_invoice_number: advInvoiceNumber,
        advance_deduction: advDeduction,
        amount_due: finalAmountDue,
        date_of_supply: dateOfSupply,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        issued_by: issuedBy,
        payment_method: paymentMethod,
        note,
        is_paid: false,
        paid_date: null,
      });

      // Deduct from advance after invoice is saved
      if (formType === "vyuctovacia" && selectedAdvance && advDeduction > 0) {
        await deductFromAdvance(selectedAdvance.id, advDeduction);
      }
    }

    navigate("/invoices");
  }

  async function exportInvoicePdf(invoice: Invoice) {
    const blob = await pdf(<InvoicePdf invoice={invoice} settings={settings} />).toBlob();
    const buffer = await blob.arrayBuffer();
    const path = await saveDialog({
      defaultPath: `faktura-${invoice.invoice_number}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      await writeFile(path, new Uint8Array(buffer));
    }
  }

  async function exportAdvancePdf(advance: AdvanceInvoice) {
    const blob = await pdf(<AdvancePdf advance={advance} settings={settings} />).toBlob();
    const buffer = await blob.arrayBuffer();
    const path = await saveDialog({
      defaultPath: `zalohova-${advance.invoice_number}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (path) {
      await writeFile(path, new Uint8Array(buffer));
    }
  }

  async function handleSaveAndExport() {
    setErrors([]);

    if (formType === "zalohova") {
      const validationErrors = validateAdvanceInvoice({
        client_name: clientName,
        advance_amount: advanceAmount,
      });
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (saveClient) {
        await upsertClient({
          name: clientName,
          street: clientStreet,
          city: clientCity,
          ico: clientIco,
          dic: clientDic,
          ic_dph: clientIcDph,
        });
      }

      const invoiceNumber = nextAdvanceNumber(advances, dateOfIssue);
      const advanceData: Omit<AdvanceInvoice, "id" | "created_at"> = {
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
      };
      const saved = await addAdvance(advanceData);
      await exportAdvancePdf(saved);
    } else {
      const invoiceType: InvoiceType = formType === "ostra" ? "ostra" : "vyuctovacia";

      const validationErrors = validateInvoice({
        client_name: clientName,
        quantity,
        unit_price: unitPrice,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        date_of_supply: dateOfSupply,
      });
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      if (saveClient) {
        await upsertClient({
          name: clientName,
          street: clientStreet,
          city: clientCity,
          ico: clientIco,
          dic: clientDic,
          ic_dph: clientIcDph,
        });
      }

      const invoiceNumber = nextInvoiceNumber(invoices, dateOfIssue);
      const computed = computeInvoiceTotals(quantity, unitPrice, vatRate);

      let advInvoiceId: string | null = null;
      let advInvoiceNumber: string | null = null;
      let advDeduction = 0;
      let finalAmountDue = computed.total_with_vat;

      if (formType === "vyuctovacia" && selectedAdvance) {
        const ded = computeAdvanceDeduction(
          computed.total_with_vat,
          selectedAdvance.remaining_balance
        );
        advInvoiceId = selectedAdvance.id;
        advInvoiceNumber = selectedAdvance.invoice_number;
        advDeduction = ded.advance_deduction;
        finalAmountDue = ded.amount_due;
      }

      const invoiceData: Omit<Invoice, "id" | "created_at"> = {
        type: invoiceType,
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
        price_without_vat: computed.price_without_vat,
        vat_rate: vatRate,
        vat_amount: computed.vat_amount,
        total_with_vat: computed.total_with_vat,
        advance_invoice_id: advInvoiceId,
        advance_invoice_number: advInvoiceNumber,
        advance_deduction: advDeduction,
        amount_due: finalAmountDue,
        date_of_supply: dateOfSupply,
        date_of_issue: dateOfIssue,
        date_due: dateDue,
        issued_by: issuedBy,
        payment_method: paymentMethod,
        note,
        is_paid: false,
        paid_date: null,
      };
      const saved = await addInvoice(invoiceData);

      if (formType === "vyuctovacia" && selectedAdvance && advDeduction > 0) {
        await deductFromAdvance(selectedAdvance.id, advDeduction);
      }

      await exportInvoicePdf(saved);
    }

    navigate("/invoices");
  }

  const isZalohova = formType === "zalohova";
  const isVyuctovacia = formType === "vyuctovacia";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-headline text-3xl text-on-surface">Nová faktúra</h1>

      {/* Type selection */}
      <Tabs
        value={formType}
        onValueChange={(v) => setFormType(v as FormType)}
      >
        <TabsList>
          <TabsTrigger value="ostra">Ostrá</TabsTrigger>
          <TabsTrigger value="zalohova">Zálohová</TabsTrigger>
          <TabsTrigger value="vyuctovacia">Vyúčtovacia</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-error/30 bg-error-container/20 p-4 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-error">
              {err}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — form cards */}
        <div className="col-span-2 space-y-6">
          {/* Client section */}
          <Card className="bg-surface-container-lowest border-outline-variant/20">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">
                Klient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  Názov / Meno
                </Label>
                <ClientAutocomplete
                  clients={clients}
                  value={clientName}
                  onChange={setClientName}
                  onSelect={handleClientSelect}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Ulica
                  </Label>
                  <Input
                    value={clientStreet}
                    onChange={(e) => setClientStreet(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Mesto a PSČ
                  </Label>
                  <Input
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    IČO
                  </Label>
                  <Input
                    value={clientIco}
                    onChange={(e) => setClientIco(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    DIČ
                  </Label>
                  <Input
                    value={clientDic}
                    onChange={(e) => setClientDic(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    IČ DPH
                  </Label>
                  <Input
                    value={clientIcDph}
                    onChange={(e) => setClientIcDph(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveClient}
                  onChange={(e) => setSaveClient(e.target.checked)}
                  className="rounded border-outline-variant"
                />
                Uložiť klienta
              </label>
            </CardContent>
          </Card>

          {/* Service section (ostra / vyuctovacia) */}
          {!isZalohova && (
            <Card className="bg-surface-container-lowest border-outline-variant/20">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">
                  Služba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Typ fakturácie
                  </Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={billingType === "hourly"}
                        onChange={() => setBillingType("hourly")}
                      />
                      Hodinová sadzba
                    </label>
                    <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                      <input
                        type="radio"
                        name="billingType"
                        checked={billingType === "fixed"}
                        onChange={() => setBillingType("fixed")}
                      />
                      Paušál
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-label text-xs uppercase tracking-widest text-outline">
                      Množstvo ({billingType === "hourly" ? "hod." : "ks"})
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={billingType === "hourly" ? 0.25 : 1}
                      value={quantity || ""}
                      onChange={(e) =>
                        setQuantity(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-label text-xs uppercase tracking-widest text-outline">
                      Jednotková cena (EUR)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={unitPrice || ""}
                      onChange={(e) =>
                        setUnitPrice(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Popis služby
                  </Label>
                  <Input
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="napr. Právne služby"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Text faktúry
                  </Label>
                  <Textarea
                    value={invoiceText}
                    onChange={(e) => setInvoiceText(e.target.value)}
                    rows={3}
                    placeholder="Doplňujúci text na faktúre"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advance section (zalohova only) */}
          {isZalohova && (
            <Card className="bg-surface-container-lowest border-outline-variant/20">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">
                  Záloha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Suma zálohy (EUR)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={advanceAmount || ""}
                    onChange={(e) =>
                      setAdvanceAmount(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Popis
                  </Label>
                  <Textarea
                    value={advanceDescription}
                    onChange={(e) => setAdvanceDescription(e.target.value)}
                    rows={3}
                    placeholder="Popis zálohovej faktúry"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settlement section (vyuctovacia only) */}
          {isVyuctovacia && (
            <Card className="bg-surface-container-lowest border-outline-variant/20">
              <CardHeader>
                <CardTitle className="font-headline text-xl text-primary">
                  Odpočet zálohy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Zálohová faktúra
                  </Label>
                  {availableForSettlement.length > 0 ? (
                    <Select
                      value={selectedAdvanceId}
                      onValueChange={setSelectedAdvanceId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Vyberte zálohovú faktúru" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForSettlement.map((adv) => (
                          <SelectItem key={adv.id} value={adv.id}>
                            {adv.invoice_number} &mdash; {adv.client_name}{" "}
                            &mdash; zostatok:{" "}
                            {formatCurrency(adv.remaining_balance)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-outline">
                      Žiadne uhradené zálohy na odpočet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates section */}
          <Card className="bg-surface-container-lowest border-outline-variant/20">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">
                Dátumy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`grid gap-4 ${isZalohova ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {!isZalohova && (
                  <div className="space-y-1.5">
                    <Label className="font-label text-xs uppercase tracking-widest text-outline">
                      Dátum dodania
                    </Label>
                    <Input
                      type="date"
                      value={dateOfSupply}
                      onChange={(e) => setDateOfSupply(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Dátum vystavenia
                  </Label>
                  <Input
                    type="date"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Dátum splatnosti
                  </Label>
                  <Input
                    type="date"
                    value={dateDue}
                    onChange={(e) => setDateDue(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other fields */}
          <Card className="bg-surface-container-lowest border-outline-variant/20">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">
                Ostatné
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Vystavil
                  </Label>
                  <Input
                    value={issuedBy}
                    onChange={(e) => setIssuedBy(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Spôsob úhrady
                  </Label>
                  <Input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
              </div>

              {!isZalohova && (
                <div className="space-y-1.5">
                  <Label className="font-label text-xs uppercase tracking-widest text-outline">
                    Interná poznámka
                  </Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Poznámka (nezobrazí sa na faktúre)"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSave}>Uložiť</Button>
            <Button variant="outline" onClick={handleSaveAndExport}>
              Uložiť a exportovať PDF
            </Button>
          </div>
        </div>

        {/* Right column — summary */}
        <div className="col-span-1">
          <div className="sticky top-6">
            {isZalohova ? (
              <Card className="bg-surface-container-lowest border-outline-variant/20">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">
                    Súhrn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-on-surface">
                      Záloha
                    </span>
                    <span className="text-sm tabular-nums font-semibold text-on-surface">
                      {formatCurrency(advanceAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <InvoiceSummaryCard
                priceWithoutVat={totals.price_without_vat}
                vatAmount={totals.vat_amount}
                totalWithVat={totals.total_with_vat}
                advanceDeduction={deduction.advance_deduction}
                amountDue={deduction.amount_due}
                isVatPayer={settings.is_vat_payer}
                showAdvance={isVyuctovacia && !!selectedAdvance}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
