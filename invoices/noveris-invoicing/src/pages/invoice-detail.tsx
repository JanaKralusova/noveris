import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useSettings } from "@/hooks/use-settings";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvoicePdf } from "@/lib/pdf/invoice-pdf";
import { AdvancePdf } from "@/lib/pdf/advance-pdf";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { invoices, deleteInvoice, markAsPaid: markInvoicePaid } = useInvoices();
  const {
    advances,
    deleteAdvance,
    markAsPaid: markAdvancePaid,
  } = useAdvanceInvoices();
  const { settings } = useSettings();

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDeleteOpen, setBlockDeleteOpen] = useState(false);

  const invoice = invoices.find((i) => i.id === id);
  const advance = advances.find((a) => a.id === id);

  if (!invoice && !advance) {
    return (
      <div className="space-y-4">
        <Link to="/invoices" className="text-sm text-primary hover:underline">
          ← Späť na zoznam
        </Link>
        <p className="text-muted-foreground">Faktúra sa nenašla.</p>
      </div>
    );
  }

  const isAdvance = !!advance;
  const isPaid = isAdvance ? advance!.is_paid : invoice!.is_paid;
  const dateDue = isAdvance ? advance!.date_due : invoice!.date_due;
  const invoiceNumber = isAdvance ? advance!.invoice_number : invoice!.invoice_number;
  const title = isAdvance
    ? `Zálohová faktúra č. ${invoiceNumber}`
    : `Faktúra č. ${invoiceNumber}`;

  async function handleMarkPaid() {
    if (!id) return;
    if (isAdvance) {
      await markAdvancePaid(id, payDate);
    } else {
      await markInvoicePaid(id, payDate);
    }
    setPayDialogOpen(false);
  }

  async function handleDelete() {
    if (!id) return;
    if (isAdvance) {
      // Block deletion if any vyuctovacia invoice references this advance
      const referenced = invoices.some((inv) => inv.advance_invoice_id === id);
      if (referenced) {
        setDeleteDialogOpen(false);
        setBlockDeleteOpen(true);
        return;
      }
      await deleteAdvance(id);
    } else {
      await deleteInvoice(id);
    }
    navigate("/invoices");
  }

  async function handleExportPdf() {
    if (isAdvance && advance) {
      const blob = await pdf(
        <AdvancePdf advance={advance} settings={settings} />
      ).toBlob();
      const buffer = await blob.arrayBuffer();
      const path = await saveDialog({
        defaultPath: `zalohova-${advance.invoice_number}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (path) {
        await writeFile(path, new Uint8Array(buffer));
      }
    } else if (!isAdvance && invoice) {
      const blob = await pdf(
        <InvoicePdf invoice={invoice} settings={settings} />
      ).toBlob();
      const buffer = await blob.arrayBuffer();
      const path = await saveDialog({
        defaultPath: `faktura-${invoice.invoice_number}.pdf`,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (path) {
        await writeFile(path, new Uint8Array(buffer));
      }
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Link to="/invoices" className="text-sm text-primary hover:underline">
        ← Späť na zoznam
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-headline text-2xl text-on-surface">{title}</h1>
        <StatusBadge isPaid={isPaid} dateDue={dateDue} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          Exportovať PDF
        </Button>
        {!isPaid && (
          <Button variant="outline" size="sm" onClick={() => setPayDialogOpen(true)}>
            Označiť ako zaplatené
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/invoices/${id}/edit`)}
        >
          Upraviť
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Zmazať
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-4">
          {/* Supplier / Client columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dodávateľ
              </p>
              <p className="font-medium">{settings.supplier_name}</p>
              <p className="text-sm text-muted-foreground">{settings.supplier_street}</p>
              <p className="text-sm text-muted-foreground">{settings.supplier_city}</p>
              {settings.supplier_ico && (
                <p className="text-sm text-muted-foreground">IČO: {settings.supplier_ico}</p>
              )}
              {settings.supplier_dic && (
                <p className="text-sm text-muted-foreground">DIČ: {settings.supplier_dic}</p>
              )}
              {settings.supplier_ic_dph && (
                <p className="text-sm text-muted-foreground">IČ DPH: {settings.supplier_ic_dph}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Odberateľ
              </p>
              {isAdvance ? (
                <>
                  <p className="font-medium">{advance!.client_name}</p>
                  <p className="text-sm text-muted-foreground">{advance!.client_street}</p>
                  <p className="text-sm text-muted-foreground">{advance!.client_city}</p>
                  {advance!.client_ico && (
                    <p className="text-sm text-muted-foreground">IČO: {advance!.client_ico}</p>
                  )}
                  {advance!.client_dic && (
                    <p className="text-sm text-muted-foreground">DIČ: {advance!.client_dic}</p>
                  )}
                  {advance!.client_ic_dph && (
                    <p className="text-sm text-muted-foreground">IČ DPH: {advance!.client_ic_dph}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">{invoice!.client_name}</p>
                  <p className="text-sm text-muted-foreground">{invoice!.client_street}</p>
                  <p className="text-sm text-muted-foreground">{invoice!.client_city}</p>
                  {invoice!.client_ico && (
                    <p className="text-sm text-muted-foreground">IČO: {invoice!.client_ico}</p>
                  )}
                  {invoice!.client_dic && (
                    <p className="text-sm text-muted-foreground">DIČ: {invoice!.client_dic}</p>
                  )}
                  {invoice!.client_ic_dph && (
                    <p className="text-sm text-muted-foreground">IČ DPH: {invoice!.client_ic_dph}</p>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Dátum vystavenia
              </p>
              <p className="text-sm">
                {formatDate(isAdvance ? advance!.date_of_issue : invoice!.date_of_issue)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Splatnosť
              </p>
              <p className="text-sm">{formatDate(dateDue)}</p>
            </div>
            {!isAdvance && invoice!.date_of_supply && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Dátum dodania
                </p>
                <p className="text-sm">{formatDate(invoice!.date_of_supply)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Content */}
          {isAdvance ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Popis
                </p>
                <p className="text-sm">{advance!.description}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Suma zálohy</span>
                <span className="font-medium">{formatCurrency(advance!.advance_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Zostatok zálohy</span>
                <span className="font-medium">{formatCurrency(advance!.remaining_balance)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {invoice!.service_description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Popis služby
                  </p>
                  <p className="text-sm">{invoice!.service_description}</p>
                </div>
              )}
              {invoice!.invoice_text && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Text faktúry
                  </p>
                  <p className="text-sm">{invoice!.invoice_text}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">MJ</p>
                  <p>{invoice!.unit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Množstvo</p>
                  <p>{invoice!.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Cena za MJ</p>
                  <p>{formatCurrency(invoice!.unit_price)}</p>
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Odmena</span>
                  <span>{formatCurrency(invoice!.price_without_vat)}</span>
                </div>
                {settings.is_vat_payer ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">DPH ({invoice!.vat_rate}%)</span>
                    <span>{formatCurrency(invoice!.vat_amount)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nie som platca DPH</p>
                )}
                {invoice!.type === "vyuctovacia" &&
                  invoice!.advance_invoice_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Odpočet zálohy ({invoice!.advance_invoice_number})
                      </span>
                      <span>−{formatCurrency(invoice!.advance_deduction)}</span>
                    </div>
                  )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>
                    {invoice!.type === "vyuctovacia" ? "Na doplatok" : "Celkom"}
                  </span>
                  <span>{formatCurrency(invoice!.amount_due)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Paid date */}
          {isPaid && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Zaplatené dňa:{" "}
                <span className="text-foreground font-medium">
                  {formatDate(
                    (isAdvance ? advance!.paid_date : invoice!.paid_date) ?? ""
                  )}
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pay dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Označiť ako zaplatené</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dátum platby</label>
            <Input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button onClick={handleMarkPaid}>Potvrdiť</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmazať faktúru</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Naozaj chcete zmazať faktúru č. {invoiceNumber}? Táto akcia je nevratná.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Zrušiť
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Zmazať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block delete dialog (advance referenced by vyuctovacia) */}
      <Dialog open={blockDeleteOpen} onOpenChange={setBlockDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nemožno zmazať zálohu</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Táto zálohová faktúra je použitá vo vyúčtovacej faktúre. Najprv zrušte alebo
            zmeňte vyúčtovaciu faktúru, až potom môžete zálohu zmazať.
          </p>
          <DialogFooter>
            <Button onClick={() => setBlockDeleteOpen(false)}>Rozumiem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
