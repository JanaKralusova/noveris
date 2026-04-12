import { useState } from "react";
import { useClients } from "@/hooks/use-clients";
import { Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientFormData = Omit<Client, "id" | "last_used">;

const EMPTY_FORM: ClientFormData = {
  name: "",
  street: "",
  city: "",
  ico: "",
  dic: "",
  ic_dph: "",
};

export function ClientList() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  function openAddDialog() {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      street: client.street,
      city: client.city,
      ico: client.ico,
      dic: client.dic,
      ic_dph: client.ic_dph,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(client: Client) {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  }

  function handleFormChange(field: keyof ClientFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (editingClient) {
      await updateClient({ ...editingClient, ...form });
    } else {
      await addClient(form);
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id);
    }
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  }

  if (loading) {
    return <p className="text-on-surface-variant p-6">Načítavam...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl text-on-surface">Klienti</h1>
        <Button
          className="bg-primary text-on-primary hover:bg-primary/90"
          onClick={openAddDialog}
        >
          Pridať klienta
        </Button>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant/20">
        {clients.length === 0 ? (
          <p className="p-6 text-on-surface-variant text-sm">
            Zatiaľ žiadni klienti.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-label text-xs uppercase tracking-widest text-outline">
                  Názov
                </TableHead>
                <TableHead className="font-label text-xs uppercase tracking-widest text-outline">
                  Adresa
                </TableHead>
                <TableHead className="font-label text-xs uppercase tracking-widest text-outline">
                  IČO
                </TableHead>
                <TableHead className="font-label text-xs uppercase tracking-widest text-outline">
                  DIČ
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium text-on-surface">
                    {client.name}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {[client.street, client.city].filter(Boolean).join(", ")}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {client.ico}
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {client.dic}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => openEditDialog(client)}
                    >
                      Upraviť
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error"
                      onClick={() => openDeleteDialog(client)}
                    >
                      Zmazať
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-on-surface">
              {editingClient ? "Upraviť klienta" : "Pridať klienta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="font-label text-xs uppercase tracking-widest text-outline">
                Názov
              </Label>
              <Input
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  Ulica
                </Label>
                <Input
                  value={form.street}
                  onChange={(e) => handleFormChange("street", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  Mesto
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => handleFormChange("city", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  IČO
                </Label>
                <Input
                  value={form.ico}
                  onChange={(e) => handleFormChange("ico", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  DIČ
                </Label>
                <Input
                  value={form.dic}
                  onChange={(e) => handleFormChange("dic", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-label text-xs uppercase tracking-widest text-outline">
                  IČ DPH
                </Label>
                <Input
                  value={form.ic_dph}
                  onChange={(e) => handleFormChange("ic_dph", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-outline-variant text-on-surface"
              onClick={() => setDialogOpen(false)}
            >
              Zrušiť
            </Button>
            <Button
              className="bg-primary text-on-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              {editingClient ? "Uložiť zmeny" : "Pridať"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-surface-container-lowest">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-on-surface">
              Zmazať klienta
            </DialogTitle>
          </DialogHeader>

          <p className="text-on-surface-variant text-sm py-2">
            Naozaj chcete zmazať klienta{" "}
            <span className="font-medium text-on-surface">
              {clientToDelete?.name}
            </span>
            ? Táto akcia sa nedá vrátiť.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-outline-variant text-on-surface"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Zrušiť
            </Button>
            <Button
              className="bg-error text-on-error hover:bg-error/90"
              onClick={handleDelete}
            >
              Zmazať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
