import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';
import { columns } from './columns';
import { DataTable } from '../inspections/data-table';
import { ViewBidDialog } from './ViewBidDialog'; // <-- Usamos el nuevo Dialog

const AdminAuctionBidsPage = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState(null);
  const supabase = useSupabaseClient();
  
   const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobada' },
    { value: 'processing', label: 'Procesando' },
    { value: 'won', label: 'Ganada' },
    { value: 'lost', label: 'Perdida' },
    { value: 'pending_payment', label: 'Pendiente de Pago' },
    { value: 'completed', label: 'Completada' },
  ];

  const loadBids = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('auction_bids')
      .select(`*, user_profile:users_profile ( full_name, email, short_id )`)
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
  }, [supabase]);

  useEffect(() => { loadBids(); }, [loadBids]);

  const handleViewDetails = (bid) => setSelectedBid(bid);
  const handleCloseDialog = () => setSelectedBid(null);
  const handleUpdateSuccess = () => { handleCloseDialog(); loadBids(); };

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
              filterColumn="lot_number"
              statusOptions={statusOptions}
            /> 
          )}
        </CardContent>
      </Card>
      
      {/* Usamos el nuevo Dialog en lugar del Sheet */}
      <ViewBidDialog 
        bid={selectedBid} 
        isOpen={!!selectedBid} 
        onClose={handleCloseDialog} 
        onUpdateSuccess={handleUpdateSuccess} 
      />
    </div>
  );
};

export default AdminAuctionBidsPage;