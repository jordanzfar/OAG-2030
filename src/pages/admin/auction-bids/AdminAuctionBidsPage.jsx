import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from '../inspections/data-table'; // La ruta a nuestro componente reutilizable
import { ViewBidSheet } from './ViewBidSheet';

const AdminAuctionBidsPage = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);

  // Definimos las opciones para el menú desplegable de estados
  const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'processed', label: 'Procesada' },
    { value: 'won', label: 'Ganada' },
    { value: 'outbid', label: 'Superada' },
    { value: 'lost', label: 'Perdida' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  const loadBids = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auction_bids')
      .select(`*, user_profile:users_profile ( full_name, email )`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching auction bids:", error.message);
      setBids([]);
    } else {
      const formattedData = data.map(bid => ({
        ...bid,
        user_full_name: bid.user_profile?.full_name || 'N/A',
        user_email: bid.user_profile?.email || bid.email,
      }));
      setBids(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadBids(); }, [loadBids]);

  const handleViewDetails = (bid) => setSelectedBid(bid);
  const handleCloseSheet = () => setSelectedBid(null);
  const handleUpdateSuccess = () => { handleCloseSheet(); loadBids(); };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Solicitudes de Puja</CardTitle>
          <CardDescription>Revisa, actualiza y gestiona las solicitudes de puja enviadas por los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? ( <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> ) : 
          ( 
            <DataTable 
              columns={columns({ onViewDetails: handleViewDetails })} 
              data={bids}
              filterColumn="lot_number" // Columna para el filtro de texto
              statusOptions={statusOptions} // Opciones para el filtro de estado
            /> 
          )}
        </CardContent>
      </Card>
      <ViewBidSheet bid={selectedBid} isOpen={!!selectedBid} onClose={handleCloseSheet} onUpdateSuccess={handleUpdateSuccess} />
    </div>
  );
};

export default AdminAuctionBidsPage;