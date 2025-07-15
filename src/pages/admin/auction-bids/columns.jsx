import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const getStatusBadge = (status) => { const map = { won: 'bg-green-100 text-green-800', processed: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800', outbid: 'bg-orange-100 text-orange-800', lost: 'bg-red-100 text-red-800', cancelled: 'bg-red-100 text-red-800' }; return map[status] || 'bg-gray-100 text-gray-800'; };
const getStatusText = (status) => { const map = { won: 'Ganada', processed: 'Procesada', pending: 'Pendiente', outbid: 'Superada', lost: 'Perdida', cancelled: 'Cancelada' }; return map[status] || 'Desconocido'; };

export const columns = ({ onViewDetails }) => [
  { 
    accessorKey: "vin", // CORREGIDO: accessorKey único y correcto
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
  },
  {
    accessorKey: "auction_type",
    header: "Subasta",
  },
  { 
    accessorKey: "max_bid", 
    header: () => <div className="text-right">Puja Máx.</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">{currencyFormatter.format(parseFloat(row.getValue("max_bid")))}</div>
    )
  },
  { 
    accessorKey: "status", 
    header: "Estado",
    cell: ({ row }) => (
      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(row.getValue("status"))}`}>
          {getStatusText(row.getValue("status"))}
      </div>
    )
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