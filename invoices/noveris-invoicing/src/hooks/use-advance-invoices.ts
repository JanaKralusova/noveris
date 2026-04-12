import { useState, useEffect, useCallback, useMemo } from "react";
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

  const addAdvance = useCallback(
    async (advance: Omit<AdvanceInvoice, "id" | "created_at">) => {
      const newAdvance: AdvanceInvoice = {
        ...advance,
        id: uuidv4(),
        created_at: new Date().toISOString(),
      };
      const updated = [...advances, newAdvance];
      setAdvances(updated);
      await writeJsonl(FILENAME, updated);
      return newAdvance;
    },
    [advances]
  );

  const updateAdvance = useCallback(
    async (updated: AdvanceInvoice) => {
      const list = advances.map((a) => (a.id === updated.id ? updated : a));
      setAdvances(list);
      await writeJsonl(FILENAME, list);
    },
    [advances]
  );

  const deleteAdvance = useCallback(
    async (id: string) => {
      const list = advances.filter((a) => a.id !== id);
      setAdvances(list);
      await writeJsonl(FILENAME, list);
    },
    [advances]
  );

  const markAsPaid = useCallback(
    async (id: string, paidDate: string) => {
      const list = advances.map((a) =>
        a.id === id
          ? { ...a, is_paid: true, paid_date: paidDate, status: "uhradená" as const }
          : a
      );
      setAdvances(list);
      await writeJsonl(FILENAME, list);
    },
    [advances]
  );

  const deductFromAdvance = useCallback(
    async (id: string, amount: number) => {
      const list = advances.map((a) =>
        a.id === id
          ? { ...a, remaining_balance: a.remaining_balance - amount }
          : a
      );
      setAdvances(list);
      await writeJsonl(FILENAME, list);
    },
    [advances]
  );

  const availableForSettlement = useMemo(
    () => advances.filter((a) => a.is_paid && a.remaining_balance > 0),
    [advances]
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
