import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';

const VinInputForm = ({ onSubmit, isLoading, errors, register, vinValue, isDemoMode, demoReport }) => {
  const button = (
    <Button type="submit" disabled={isLoading || !vinValue || vinValue.length !== 17} className="mt-[26px]">
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {isLoading ? 'Enviando Solicitud...' : 'Solicitar Verificación'}
    </Button>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-start space-x-2">
        <div className="flex-grow">
          <Label htmlFor="vin-check">VIN del Vehículo</Label>
          <Input
            id="vin-check"
            placeholder="Ingresa el VIN de 17 dígitos"
            {...register("vin")}
            maxLength={17}
            className={`mt-1 ${errors.vin ? 'border-destructive' : ''}`}
            defaultValue={isDemoMode ? demoReport.vin : ''}
            readOnly={isDemoMode}
          />
          {errors.vin && !isDemoMode && <p className="text-sm text-destructive mt-1">{errors.vin.message}</p>}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            {isDemoMode ? (
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent><p>Solicitud simulada en modo demo.</p></TooltipContent>
              </Tooltip>
            ) : (
              button
            )}
          </TooltipTrigger>
          {!isDemoMode && (
            <TooltipContent>
              <p>Tu solicitud será procesada manualmente por nuestro equipo. Recibirás el reporte en 24-48 horas.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </form>
  );
};

export default VinInputForm;
