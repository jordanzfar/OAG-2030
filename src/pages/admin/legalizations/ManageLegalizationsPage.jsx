import { useEffect, useState, useCallback } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { columns } from '@/components/admin/legalizations/columns';
import { LegalizationsDataTable } from '@/components/admin/legalizations/LegalizationsDataTable';
import { LegalizationDetailsModal } from '@/components/admin/legalizations/LegalizationDetailsModal';
import { Loader2, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
// ✅ CORRECCIÓN: Se eliminó la importación de 'DateRange' que causaba el error.

const ManageLegalizationsPage = () => {
  const { fetchAllLegalizations } = useAdminData();
  
  const [legalizations, setLegalizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('all');
  // ✅ CORRECCIÓN: Se ajustó el estado para JavaScript simple.
  const [dateRange, setDateRange] = useState(undefined);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLegalization, setSelectedLegalization] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const filters = {
      status: statusFilter === 'all' ? null : statusFilter,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
    };
    const result = await fetchAllLegalizations(filters);
    if (result.success) {
      setLegalizations(result.data || []);
    }
    setIsLoading(false);
  }, [fetchAllLegalizations, statusFilter, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewDetails = (legalization) => {
    setSelectedLegalization(legalization);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLegalization(null);
  };
  
  const handleUpdate = () => {
    loadData();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Legalizaciones</h1>
        <p className="text-muted-foreground">Filtra y gestiona todas las solicitudes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_review">En Revisión</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button id="date" variant={"outline"} className="w-[300px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Selecciona un rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
          </PopoverContent>
        </Popover>
        {dateRange && (
          <Button variant="ghost" onClick={() => setDateRange(undefined)} className="h-9 px-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <LegalizationsDataTable columns={columns} data={legalizations} onViewDetails={handleViewDetails} />
      )}

      <LegalizationDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} legalization={selectedLegalization} onUpdate={handleUpdate} />
    </div>
  );
};

export default ManageLegalizationsPage;