import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
// ✅ RUTA CORREGIDA: Apuntando a la carpeta de componentes compartidos
import { StatusBadge } from '@/components/ui/StatusBadge'; 

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const columns = ({ onViewDetails }) => [
  { 
    accessorKey: "vin",
    header: "Vehículo",
    cell: ({ row }) => {
      const bid = row.original;
      return (
        <div>
          <div className="font-medium">{bid.year} {bid.make} {bid.model}</div>
          <div className="text-xs text-muted-foreground">VIN: {bid.vin}</div>
        </div>
      )
    }
  },
  {
    accessorKey: "lot_number",
    header: "Lote #",
  },
  {
    accessorKey: "user_full_name",
    header: "Cliente",
    cell: ({ row }) => {
      const bid = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{bid.user_full_name || 'Sin Nombre'}</span>
          <span className="text-xs text-muted-foreground font-mono">{bid.user_profile?.short_id || 'N/A'}</span>
          <span className="text-xs text-muted-foreground">{bid.user_email}</span>
        </div>
      );
    }
  },
  { 
    accessorKey: "max_bid", 
    header: () => <div className="text-right">Puja Máx.</div>,
    cell: ({ row }) => (<div className="text-right font-semibold">{currencyFormatter.format(parseFloat(row.getValue("max_bid")))}</div>)
  },
  { 
    accessorKey: "status", 
    header: "Estado",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />
  },
  { 
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onViewDetails(row.original)}>Ver / Actualizar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];