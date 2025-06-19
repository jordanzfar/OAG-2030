import React from 'react';
import { User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const OwnerInfoSection = ({ register, errors }) => (
  <div className="space-y-4 rounded-md border p-4">
    <h3 className="text-lg font-medium text-foreground mb-2 flex items-center">
      <User className="w-5 h-5 mr-2" />
      Datos del Propietario
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="ownerName">Nombre Completo</Label>
        <Input id="ownerName" placeholder="A nombre de quien quedará el vehículo" {...register("ownerName")} className={`mt-1 ${errors.ownerName ? 'border-destructive' : ''}`} />
        {errors.ownerName && <p className="text-sm text-destructive mt-1">{errors.ownerName.message}</p>}
      </div>
      <div>
        <Label htmlFor="ownerPhone">Teléfono de Contacto</Label>
        <Input id="ownerPhone" type="tel" placeholder="Tu número de contacto" {...register("ownerPhone")} className={`mt-1 ${errors.ownerPhone ? 'border-destructive' : ''}`} />
        {errors.ownerPhone && <p className="text-sm text-destructive mt-1">{errors.ownerPhone.message}</p>}
      </div>
    </div>
  </div>
);

export default OwnerInfoSection;