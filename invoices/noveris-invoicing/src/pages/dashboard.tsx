import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/use-invoices";
import { useAdvanceInvoices } from "@/hooks/use-advance-invoices";
import { formatCurrency, formatDate } from "@/lib/formatting";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function Dashboard() {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const { advances } = useAdvanceInvoices();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isCurrentMonth = (dateStr: string) => {
    const [year, month] = dateStr.split("-").map(Number);
    return year === currentYear && month === currentMonth;
  };

  const stats = useMemo(() => {
    const thisMonthInvoices = invoices.filter((i) => isCurrentMonth(i.date_of_issue));
    const thisMonthAdvances = advances.filter((a) => isCurrentMonth(a.date_of_issue));

    const invoiceCount = thisMonthInvoices.length + thisMonthAdvances.length;
    const revenue =
      thisMonthInvoices.reduce((sum, i) => sum + i.amount_due, 0) +
      thisMonthAdvances.reduce((sum, a) => sum + a.advance_amount, 0);

    const unpaidAmount =
      invoices.filter((i) => !i.is_paid).reduce((sum, i) => sum + i.amount_due, 0) +
      advances.filter((a) => !a.is_paid).reduce((sum, a) => sum + a.advance_amount, 0);
    const unpaidCount =
      invoices.filter((i) => !i.is_paid).length +
      advances.filter((a) => !a.is_paid).length;

    return { invoiceCount, revenue, unpaidAmount, unpaidCount };
  }, [invoices, advances]);

  const recentItems = useMemo(() => {
    type Row = {
      id: string;
      invoice_number: string;
      client_name: string;
      amount: number;
      date_of_issue: string;
      date_due: string;
      is_paid: boolean;
    };

    const invoiceRows: Row[] = invoices.map((i) => ({
      id: i.id,
      invoice_number: i.invoice_number,
      client_name: i.client_name,
      amount: i.amount_due,
      date_of_issue: i.date_of_issue,
      date_due: i.date_due,
      is_paid: i.is_paid,
    }));

    const advanceRows: Row[] = advances.map((a) => ({
      id: a.id,
      invoice_number: a.invoice_number,
      client_name: a.client_name,
      amount: a.advance_amount,
      date_of_issue: a.date_of_issue,
      date_due: a.date_due,
      is_paid: a.is_paid,
    }));

    return [...invoiceRows, ...advanceRows]
      .sort((a, b) => b.date_of_issue.localeCompare(a.date_of_issue))
      .slice(0, 10);
  }, [invoices, advances]);

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-3xl text-on-surface">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">
            Faktúry tento mesiac
          </p>
          <p className="font-headline text-3xl text-primary">{stats.invoiceCount}</p>
        </Card>

        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">
            Tržby tento mesiac
          </p>
          <p className="font-headline text-3xl text-secondary">
            {formatCurrency(stats.revenue)}
          </p>
        </Card>

        <Card className="p-6 bg-surface-container-lowest border-outline-variant/20">
          <p className="font-label text-xs uppercase tracking-widest text-outline mb-2">
            Neuhradené
          </p>
          <p className="font-headline text-3xl text-error">
            {formatCurrency(stats.unpaidAmount)}
          </p>
          <p className="font-label text-xs text-outline mt-1">
            {stats.unpaidCount} {stats.unpaidCount === 1 ? "faktúra" : stats.unpaidCount < 5 ? "faktúry" : "faktúr"}
          </p>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button
          className="bg-primary text-on-primary"
          onClick={() => navigate("/invoices/new")}
        >
          Nová ostrá faktúra
        </Button>
        <Button
          variant="outline"
          className="border-primary text-primary"
          onClick={() => navigate("/invoices/new")}
        >
          Nová zálohová faktúra
        </Button>
        <Button
          variant="outline"
          className="border-primary text-primary"
          onClick={() => navigate("/invoices/new")}
        >
          Nová vyúčtovacia faktúra
        </Button>
      </div>

      {/* Recent invoices */}
      <Card className="bg-surface-container-lowest border-outline-variant/20">
        <div className="p-4 border-b border-outline-variant/20">
          <h2 className="font-headline text-lg text-on-surface">Posledné faktúry</h2>
        </div>
        {recentItems.length === 0 ? (
          <p className="p-6 text-on-surface-variant font-body text-sm">Zatiaľ žiadne faktúry.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Číslo</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead className="text-right">Suma</TableHead>
                <TableHead>Dátum</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-surface-container"
                  onClick={() => navigate(`/invoices/${item.id}`)}
                >
                  <TableCell className="font-mono text-sm">{item.invoice_number}</TableCell>
                  <TableCell>{item.client_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                  <TableCell>{formatDate(item.date_of_issue)}</TableCell>
                  <TableCell>
                    <StatusBadge isPaid={item.is_paid} dateDue={item.date_due} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
