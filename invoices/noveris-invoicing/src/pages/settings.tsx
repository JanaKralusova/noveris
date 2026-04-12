import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { useClients } from "@/hooks/use-clients";
import { generateCsv } from "@/lib/csv-export";
import { Settings } from "@/lib/types";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const { invoices } = useInvoices();
  const { advances } = useAdvanceInvoices();
  const { clients } = useClients();

  const [form, setForm] = useState<Settings>(settings);

  useEffect(() => {
    if (!loading) {
      setForm(settings);
    }
  }, [loading, settings]);

  function handleChange(field: keyof Settings, value: string | boolean | number) {
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

  if (loading) {
    return <p className="text-on-surface-variant p-6">Načítavam...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="font-headline text-3xl text-on-surface">Nastavenia</h1>

      {/* Supplier + VAT + Defaults card */}
      <Card className="bg-surface-container-lowest border-outline-variant/20 p-6 space-y-5">
        <h2 className="font-headline text-xl text-primary">Údaje dodávateľa</h2>

        <div className="space-y-1">
          <Label className="font-label text-xs uppercase tracking-widest text-outline">
            Názov firmy / meno
          </Label>
          <Input
            value={form.supplier_name}
            onChange={(e) => handleChange("supplier_name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              Ulica
            </Label>
            <Input
              value={form.supplier_street}
              onChange={(e) => handleChange("supplier_street", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              Mesto
            </Label>
            <Input
              value={form.supplier_city}
              onChange={(e) => handleChange("supplier_city", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              IČO
            </Label>
            <Input
              value={form.supplier_ico}
              onChange={(e) => handleChange("supplier_ico", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              DIČ
            </Label>
            <Input
              value={form.supplier_dic}
              onChange={(e) => handleChange("supplier_dic", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              IČ DPH
            </Label>
            <Input
              value={form.supplier_ic_dph}
              onChange={(e) => handleChange("supplier_ic_dph", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              IBAN
            </Label>
            <Input
              value={form.supplier_iban}
              onChange={(e) => handleChange("supplier_iban", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              Banka
            </Label>
            <Input
              value={form.supplier_bank}
              onChange={(e) => handleChange("supplier_bank", e.target.value)}
            />
          </div>
        </div>

        <Separator className="bg-outline-variant/30" />

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.is_vat_payer}
              onChange={(e) => handleChange("is_vat_payer", e.target.checked)}
            />
            <span className="text-on-surface text-sm font-medium">Som platca DPH</span>
          </label>
          {!form.is_vat_payer && (
            <p className="text-xs italic text-on-surface-variant pl-6">
              Na faktúrach sa zobrazí 'Nie som platca DPH'
            </p>
          )}
        </div>

        <Separator className="bg-outline-variant/30" />

        <h2 className="font-headline text-xl text-primary">Predvolené hodnoty</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              Spôsob úhrady
            </Label>
            <Input
              value={form.default_payment_method}
              onChange={(e) =>
                handleChange("default_payment_method", e.target.value)
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="font-label text-xs uppercase tracking-widest text-outline">
              Splatnosť (dni)
            </Label>
            <Input
              type="number"
              min={0}
              value={form.default_due_days}
              onChange={(e) =>
                handleChange("default_due_days", Number(e.target.value))
              }
            />
          </div>
        </div>

        <Button
          className="bg-primary text-on-primary hover:bg-primary/90 w-full"
          onClick={handleSave}
        >
          Uložiť nastavenia
        </Button>
      </Card>

      {/* Export card */}
      <Card className="bg-surface-container-lowest border-outline-variant/20 p-6 space-y-4">
        <h2 className="font-headline text-xl text-primary">Export dát</h2>

        <p className="text-sm text-on-surface-variant">
          Exportujte faktúry ako CSV pre účtovníctvo alebo zálohujte všetky dáta.
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-outline-variant text-on-surface"
            onClick={handleExportCsv}
          >
            Exportovať CSV
          </Button>
          <Button
            variant="outline"
            className="border-outline-variant text-on-surface"
            onClick={handleExportZip}
          >
            Exportovať dáta (záloha)
          </Button>
        </div>
      </Card>
    </div>
  );
}
