import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Funciones de ayuda para el estado (sin cambios) ---
const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'pending_payment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'completed': return 'Completada';
        case 'scheduled': return 'Programada';
        case 'pending_payment': return 'Pago Pendiente';
        case 'cancelled': return 'Cancelada';
        case 'on_hold': return 'En Espera';
        default: return 'Desconocido';
    }
};

// --- Definición de columnas (VERSIÓN ACTUALIZADA) ---
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
        const userFullName = row.original.user_full_name;
        const userEmail = row.original.user_email;
        return (
            <div className="flex flex-col">
                <span className="font-medium">{userFullName || 'Sin Nombre'}</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
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
      // Se añade .replace para compatibilidad entre navegadores con fechas YYYY-MM-DD
      return <div className="text-center">{format(new Date(date.replace(/-/g, '/')), "PP", { locale: es })}</div>;
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
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(status)}`}>
            {getStatusText(status)}
        </div>
      );
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