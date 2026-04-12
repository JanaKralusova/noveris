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

  const addInvoice = useCallback(
    async (invoice: Omit<Invoice, "id" | "created_at">) => {
      const newInvoice: Invoice = {
        ...invoice,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      };
      const updated = [...invoices, newInvoice];
      setInvoices(updated);
      await writeJsonl(FILENAME, updated);
      return newInvoice;
    },
    [invoices]
  );

  const updateInvoice = useCallback(
    async (updated: Invoice) => {
      const list = invoices.map((i) => (i.id === updated.id ? updated : i));
      setInvoices(list);
      await writeJsonl(FILENAME, list);
    },
    [invoices]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      const list = invoices.filter((i) => i.id !== id);
      setInvoices(list);
      await writeJsonl(FILENAME, list);
    },
    [invoices]
  );

  const markAsPaid = useCallback(
    async (id: string, paidDate: string) => {
      const list = invoices.map((i) =>
        i.id === id ? { ...i, is_paid: true, paid_date: paidDate } : i
      );
      setInvoices(list);
      await writeJsonl(FILENAME, list);
    },
    [invoices]
  );

  return { invoices, loading, addInvoice, updateInvoice, deleteInvoice, markAsPaid };
}
