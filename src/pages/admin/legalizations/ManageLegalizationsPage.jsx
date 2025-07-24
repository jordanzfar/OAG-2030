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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ManageLegalizationsPage = () => {
  const { fetchAllLegalizations } = useAdminData();
  
  const [legalizations, setLegalizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('all');
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
      {/* ✅ --- INICIO: Contenedor Card Añadido --- ✅ */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Legalizaciones</CardTitle>
          <CardDescription>Filtra y gestiona todas las solicitudes de legalización de vehículos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="missing_documents">Documentos faltantes</SelectItem>
                <SelectItem value="missing_information">Información faltante</SelectItem>
                <SelectItem value="deposit_required">Depósito requerido</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="final_payment_required">Pago final requerido</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
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
        </CardContent>
      </Card>
      {/* ✅ --- FIN: Contenedor Card Añadido --- ✅ */}

      <LegalizationDetailsModal isOpen={isModalOpen} onClose={handleCloseModal} legalization={selectedLegalization} onUpdate={handleUpdate} />
    </div>
  );
};

export default ManageLegalizationsPage;