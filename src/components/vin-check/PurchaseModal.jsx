import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

const PurchaseModal = ({ open, onOpenChange, onPurchase }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <ShoppingCart className="w-5 h-5 mr-2 text-primary" /> 
          ¡Sin Créditos Gratuitos!
        </DialogTitle>
        <DialogDescription>
          Has agotado tus verificaciones VIN gratuitas. Elige un paquete para continuar.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>10 Verificaciones</CardTitle>
            <CardDescription>$15 USD</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onPurchase('10 Verificaciones')}>
              Comprar
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col justify-between border-primary border-2 shadow-lg">
          <CardHeader>
            <CardTitle>25 Verificaciones</CardTitle>
            <CardDescription>$30 USD</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onPurchase('25 Verificaciones')}>
              Comprar
            </Button>
          </CardFooter>
        </Card>
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Ilimitado</CardTitle>
            <CardDescription>$50 USD / mes</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => onPurchase('Ilimitado Mensual')}>
              Suscribirse
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DialogContent>
  </Dialog>
);

export default PurchaseModal;
