import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatusBadge } from '../../../components/ui/StatusBadge';

export const columns = ({ onEdit }) => [
  {
    accessorKey: "stock_number",
    header: "Stock #",
    cell: ({ row }) => {
        const inspection = row.original;
        return (
            <div className="flex flex-col">
                <span className="font-medium">{inspection.stock_number}</span>
                <span className="text-xs text-muted-foreground">{inspection.location_details?.name || 'N/A'}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "user_full_name",
    header: "Usuario",
    cell: ({ row }) => {
        const inspection = row.original;
        return (
            <div className="flex flex-col">
                <span className="font-medium">{inspection.user_full_name || 'Sin Nombre'}</span>
                {/* --- CORRECCIÓN AQUÍ --- */}
                {/* Se accede al short_id a través de users_profile */}
                <span className="text-xs text-muted-foreground">{inspection.user_email}</span>
            </div>
        );
    }
  },
  {
    accessorKey: "inspection_date",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Fecha Inspección
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("inspection_date");
      if (!date) return <div className="text-center text-muted-foreground">—</div>;
      return <div className="text-center">{format(new Date(date.replace(/-/g, '/')), "PP", { locale: es })}</div>;
    },
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
    accessorKey: "completed_at",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Completada
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("completed_at");
      if (!date) return <div className="text-center text-muted-foreground">—</div>;
      return <div className="text-center">{format(new Date(date), "PP", { locale: es })}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inspection = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(inspection)}>
              Ver / Editar Detalles
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];