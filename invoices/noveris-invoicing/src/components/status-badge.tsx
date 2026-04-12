import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  isPaid: boolean;
  dateDue: string;
}

export function StatusBadge({ isPaid, dateDue }: StatusBadgeProps) {
  if (isPaid) {
    return <Badge className="bg-green-100 text-green-800 border-green-200 font-label text-xs">Zaplatená</Badge>;
  }
  const isOverdue = new Date(dateDue) < new Date();
  if (isOverdue) {
    return <Badge className="bg-red-100 text-red-800 border-red-200 font-label text-xs">Po splatnosti</Badge>;
  }
  return <Badge className="bg-surface-container-high text-on-surface-variant border-outline-variant/20 font-label text-xs">Nezaplatená</Badge>;
}
