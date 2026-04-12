import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UnifiedRow {
  id: string;
  kind: "invoice" | "advance";
  invoice_number: string;
  type_label: string;
  type_key: string;
  client_name: string;
  amount: number;
  date_of_issue: string;
  date_due: string;
  is_paid: boolean;
}

const TYPE_BADGE_CLASSES: Record<string, string> = {
  ostra: "bg-primary/10 text-primary border-primary/20",
  zalohova: "bg-secondary/10 text-secondary border-secondary/20",
  vyuctovacia: "bg-tertiary/10 text-tertiary border-tertiary/20",
};

const TYPE_LABELS: Record<string, string> = {
  ostra: "Ostrá",
  zalohova: "Zálohová",
  vyuctovacia: "Vyúčtovacia",
};

export function InvoiceList() {
  const navigate = useNavigate();
  const { invoices, loading: loadingInvoices } = useInvoices();
  const { advances, loading: loadingAdvances } = useAdvanceInvoices();

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo<UnifiedRow[]>(() => {
    const invoiceRows: UnifiedRow[] = invoices.map((inv) => ({
      id: inv.id,
      kind: "invoice",
      invoice_number: inv.invoice_number,
      type_label: TYPE_LABELS[inv.type] ?? inv.type,
      type_key: inv.type,
      client_name: inv.client_name,
      amount: inv.amount_due,
      date_of_issue: inv.date_of_issue,
      date_due: inv.date_due,
      is_paid: inv.is_paid,
    }));

    const advanceRows: UnifiedRow[] = advances.map((adv) => ({
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

    return [...invoiceRows, ...advanceRows].sort(
      (a, b) =>
        new Date(b.date_of_issue).getTime() - new Date(a.date_of_issue).getTime()
    );
  }, [invoices, advances]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (typeFilter !== "all") {
        if (typeFilter === "ostra" && row.type_key !== "ostra") return false;
        if (typeFilter === "zalohova" && row.type_key !== "zalohova") return false;
        if (typeFilter === "vyuctovacia" && row.type_key !== "vyuctovacia") return false;
      }

      if (statusFilter !== "all") {
        const isOverdue = !row.is_paid && new Date(row.date_due) < new Date();
        if (statusFilter === "paid" && !row.is_paid) return false;
        if (statusFilter === "unpaid" && (row.is_paid || isOverdue)) return false;
        if (statusFilter === "overdue" && !isOverdue) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !row.client_name.toLowerCase().includes(q) &&
          !row.invoice_number.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rows, typeFilter, statusFilter, search]);

  const loading = loadingInvoices || loadingAdvances;

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl text-on-surface">Faktúry</h1>

      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Všetky typy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky typy</SelectItem>
            <SelectItem value="ostra">Ostrá</SelectItem>
            <SelectItem value="zalohova">Zálohová</SelectItem>
            <SelectItem value="vyuctovacia">Vyúčtovacia</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Všetky stavy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky stavy</SelectItem>
            <SelectItem value="paid">Zaplatené</SelectItem>
            <SelectItem value="unpaid">Nezaplatené</SelectItem>
            <SelectItem value="overdue">Po splatnosti</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="w-72"
          placeholder="Hľadať klienta alebo číslo faktúry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Načítavam...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Žiadne faktúry.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead className="text-right">Suma</TableHead>
                <TableHead>Vystavená</TableHead>
                <TableHead>Splatnosť</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/invoices/${row.id}`)}
                >
                  <TableCell className="font-mono text-sm">{row.invoice_number}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={TYPE_BADGE_CLASSES[row.type_key] ?? ""}
                    >
                      {row.type_label}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.client_name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell>{formatDate(row.date_of_issue)}</TableCell>
                  <TableCell>{formatDate(row.date_due)}</TableCell>
                  <TableCell>
                    <StatusBadge isPaid={row.is_paid} dateDue={row.date_due} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
