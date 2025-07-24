
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, AlertTriangle } from "lucide-react";
import { StatusBadge } from '@/components/ui/StatusBadge'; // Importamos nuestro badge

export const columns = [
  {
    accessorKey: "user_profile", // Usamos el objeto anidado como accessor
    header: "Usuario",
    cell: ({ row }) => {
      const user = row.original.user_profile;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user?.full_name || 'Sin Nombre'}</span>
          <span className="text-xs text-muted-foreground font-mono">{user?.short_id || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{user?.email || 'N/A'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "vin",
    header: "VIN",
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "pending_documents_count",
    header: "Docs. Pendientes",
    cell: ({ row }) => {
      const count = row.getValue("pending_documents_count");
      if (count > 0) {
        return (
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" />
            {count}
          </div>
        );
      }
      return <div className="text-muted-foreground">0</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de Solicitud",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const legalization = row.original;
      const { onViewDetails } = table.options.meta;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(legalization)}>
              Ver Detalles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];