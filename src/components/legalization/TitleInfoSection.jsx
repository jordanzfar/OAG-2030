import React from 'react';
import { Controller } from 'react-hook-form';
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion'; // <-- Añadido para animación
import { Calendar as CalendarIcon, FileText, Globe } from "lucide-react"; // <-- Añadido Globe
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import { usStates } from '@/components/legalization/constants';

// --- NUEVO: Lista de países de destino ---
const destinationCountries = [
  { value: 'MX', label: 'México' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'HN', label: 'Honduras' },
  // Puedes añadir más países aquí
];

const TitleInfoSection = ({ control, errors }) => (
  <div className="space-y-4 rounded-md border p-4">
    <h3 className="text-lg font-medium text-foreground mb-2 flex items-center">
      <FileText className="w-5 h-5 mr-2" />
      Datos del Título
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="titleIssueDate">Fecha de Emisión del Título</Label>
        <Controller 
          name="titleIssueDate" 
          control={control} 
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal mt-1", !field.value && "text-muted-foreground", errors.titleIssueDate ? 'border-destructive' : '')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} disabled={(date) => date > new Date()} />
              </PopoverContent>
            </Popover>
          )} 
        />
        {errors.titleIssueDate && <p className="text-sm text-destructive mt-1">{errors.titleIssueDate.message}</p>}
      </div>
      <div>
        <Label htmlFor="originState">Estado de Procedencia (USA)</Label>
        <Controller 
          name="originState" 
          control={control} 
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className={`mt-1 w-full ${errors.originState ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Selecciona el estado de USA" />
              </SelectTrigger>
              <SelectContent>
                {usStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} 
        />
        {errors.originState && <p className="text-sm text-destructive mt-1">{errors.originState.message}</p>}
      </div>
    </div>
    
    {/* --- SECCIÓN MODIFICADA --- */}
    <div>
      <Label>Tipo de Legalización</Label>
      <Controller 
        name="legalizationType" 
        control={control} 
        render={({ field }) => (
          <div className="space-y-4"> {/* Envolvemos en un div para el espaciado */}
            <RadioGroup 
              onValueChange={field.onChange} 
              value={field.value} 
              className="flex space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aduana" id="type-aduana" />
                <Label htmlFor="type-aduana" className="font-normal">Vía Aduana</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decreto" id="type-decreto" />
                <Label htmlFor="type-decreto" className="font-normal">Por Decreto</Label>
              </div>
            </RadioGroup>
            
            {/* --- NUEVO: Campo condicional para el país de destino --- */}
            <AnimatePresence>
              {field.value && (
                <motion.div
                  key="destination-country-field"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="destinationCountry">País de Destino</Label>
                  <Controller 
                    name="destinationCountry" 
                    control={control} 
                    render={({ field: countryField }) => (
                      <Select onValueChange={countryField.onChange} defaultValue={countryField.value}>
                        <SelectTrigger className={`mt-1 w-full ${errors.destinationCountry ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Selecciona el país de destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationCountries.map(country => (
                            <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} 
                  />
                  {errors.destinationCountry && <p className="text-sm text-destructive mt-1">{errors.destinationCountry.message}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )} 
      />
      {errors.legalizationType && <p className="text-sm text-destructive mt-1">{errors.legalizationType.message}</p>}
    </div>
  </div>
);

export default TitleInfoSection;