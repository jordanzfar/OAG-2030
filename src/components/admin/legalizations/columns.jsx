"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, AlertTriangle } from "lucide-react";

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'in_review':
      return 'secondary';
    case 'pending':
    default:
      return 'outline';
  }
};

export const columns = [
  {
     accessorKey: "short_id",
    header: "Usuario",
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
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {status}
        </Badge>
      );
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
      return <div>{date.toLocaleDateString()}</div>;
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