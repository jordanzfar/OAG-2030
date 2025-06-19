import React from 'react';
import { Car } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const VehicleInfoSection = ({ register, errors }) => (
  <div className="space-y-4 rounded-md border p-4">
    <h3 className="text-lg font-medium text-foreground mb-2 flex items-center">
      <Car className="w-5 h-5 mr-2" />
      Información del Vehículo
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="vin">VIN</Label>
        <Input id="vin" placeholder="17 dígitos" {...register("vin")} className={`mt-1 ${errors.vin ? 'border-destructive' : ''}`} maxLength={17} />
        {errors.vin && <p className="text-sm text-destructive mt-1">{errors.vin.message}</p>}
      </div>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input id="color" placeholder="Ej: Rojo, Azul Metálico" {...register("color")} className={`mt-1 ${errors.color ? 'border-destructive' : ''}`} />
        {errors.color && <p className="text-sm text-destructive mt-1">{errors.color.message}</p>}
      </div>
      <div>
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" placeholder="Ej: Toyota, Ford" {...register("marca")} className={`mt-1 ${errors.marca ? 'border-destructive' : ''}`} />
        {errors.marca && <p className="text-sm text-destructive mt-1">{errors.marca.message}</p>}
      </div>
      <div>
        <Label htmlFor="modelo">Modelo</Label>
        <Input id="modelo" placeholder="Ej: Camry, F-150" {...register("modelo")} className={`mt-1 ${errors.modelo ? 'border-destructive' : ''}`} />
        {errors.modelo && <p className="text-sm text-destructive mt-1">{errors.modelo.message}</p>}
      </div>
      <div>
        <Label htmlFor="ano">Año</Label>
        <Input id="ano" type="number" placeholder="Ej: 2020" {...register("ano")} className={`mt-1 ${errors.ano ? 'border-destructive' : ''}`} min="1900" max={new Date().getFullYear() + 1} />
        {errors.ano && <p className="text-sm text-destructive mt-1">{errors.ano.message}</p>}
      </div>
      <div>
        <Label htmlFor="motor">Motor</Label>
        <Input id="motor" placeholder="Ej: 2.5L 4 cilindros" {...register("motor")} className={`mt-1 ${errors.motor ? 'border-destructive' : ''}`} />
        {errors.motor && <p className="text-sm text-destructive mt-1">{errors.motor.message}</p>}
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="cilindraje">Cilindraje</Label>
        <Input id="cilindraje" placeholder="Ej: 2500cc, 3.5L" {...register("cilindraje")} className={`mt-1 ${errors.cilindraje ? 'border-destructive' : ''}`} />
        {errors.cilindraje && <p className="text-sm text-destructive mt-1">{errors.cilindraje.message}</p>}
      </div>
    </div>
  </div>
);

export default VehicleInfoSection;