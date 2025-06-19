import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getLocalData, setLocalData, localStorageKeys, updateLocalArrayItem } from '@/lib/localStorage';
import FinanceStatsCards from '@/components/admin/FinanceStatsCards';
import BuyingPowerTable from '@/components/admin/BuyingPowerTable';
import DepositsTable from '@/components/admin/DepositsTable';

const AdminFinancePage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [assignAmount, setAssignAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const clientsData = getLocalData(localStorageKeys.CLIENTS) || [];
    const depositsData = getLocalData(localStorageKeys.ADMIN_DEPOSITS) || [];
    
    setClients(clientsData);
    setDeposits(depositsData);
    setLoading(false);
  };

  const handleAssignBuyingPower = () => {
    if (!selectedClient || !assignAmount) return;

    updateLocalArrayItem(localStorageKeys.CLIENTS, selectedClient.id, (client) => ({
      ...client,
      buying_power: parseFloat(assignAmount)
    }));

    setClients(prev => prev.map(client => 
      client.id === selectedClient.id 
        ? { ...client, buying_power: parseFloat(assignAmount) }
        : client
    ));

    toast({
      title: "Poder de Compra Asignado (Demo)",
      description: `Se asignaron $${assignAmount} a ${selectedClient.full_name}`,
    });

    setIsAssignModalOpen(false);
    setAssignAmount('');
    setSelectedClient(null);
  };

  const handleDepositStatusChange = (depositId, newStatus) => {
    updateLocalArrayItem(localStorageKeys.ADMIN_DEPOSITS, depositId, (deposit) => ({
      ...deposit,
      status: newStatus
    }));

    setDeposits(prev => prev.map(dep => 
      dep.id === depositId ? { ...dep, status: newStatus } : dep
    ));

    toast({
      title: "Estado Actualizado (Demo)",
      description: `Depósito marcado como ${newStatus}`,
    });
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setAssignAmount(client.buying_power?.toString() || '');
    setIsAssignModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión Financiera</h1>
          <p className="text-muted-foreground">Administra el poder de compra de los clientes y supervisa depósitos.</p>
        </div>
      </div>

      <FinanceStatsCards clients={clients} deposits={deposits} />

      <Tabs defaultValue="buying-power" className="space-y-4">
        <TabsList>
          <TabsTrigger value="buying-power">Poder de Compra</TabsTrigger>
          <TabsTrigger value="deposits">Depósitos</TabsTrigger>
        </TabsList>

        <TabsContent value="buying-power" className="space-y-4">
          <BuyingPowerTable 
            clients={clients}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onEditClient={handleEditClient}
          />
        </TabsContent>

        <TabsContent value="deposits" className="space-y-4">
          <DepositsTable 
            deposits={deposits}
            onStatusChange={handleDepositStatusChange}
          />
        </TabsContent>
      </Tabs>

      {/* Assign Buying Power Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Poder de Compra</DialogTitle>
            <DialogDescription>
              Modifica el poder de compra para {selectedClient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">Monto (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={assignAmount}
                onChange={(e) => setAssignAmount(e.target.value)}
                placeholder="0"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignBuyingPower}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancePage;
