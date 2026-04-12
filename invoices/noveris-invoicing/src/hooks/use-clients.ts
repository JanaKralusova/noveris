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

  const addClient = useCallback(
    async (client: Omit<Client, "id" | "last_used">) => {
      const newClient: Client = {
        ...client,
        id: uuidv4(),
        last_used: new Date().toISOString(),
      };
      const updated = [...clients, newClient];
      setClients(updated);
      await writeJsonl(FILENAME, updated);
      return newClient;
    },
    [clients]
  );

  const updateClient = useCallback(
    async (updated: Client) => {
      const list = clients.map((c) => (c.id === updated.id ? updated : c));
      setClients(list);
      await writeJsonl(FILENAME, list);
    },
    [clients]
  );

  const upsertClient = useCallback(
    async (client: Omit<Client, "id" | "last_used">) => {
      const existing = clients.find(
        (c) => c.name === client.name && c.ico === client.ico
      );
      if (existing) {
        const updated: Client = {
          ...existing,
          ...client,
          last_used: new Date().toISOString(),
        };
        await updateClient(updated);
        return updated;
      } else {
        return addClient(client);
      }
    },
    [clients, addClient, updateClient]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      const list = clients.filter((c) => c.id !== id);
      setClients(list);
      await writeJsonl(FILENAME, list);
    },
    [clients]
  );

  return { clients, loading, addClient, updateClient, upsertClient, deleteClient };
}
