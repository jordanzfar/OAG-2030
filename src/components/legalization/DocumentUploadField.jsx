import React from 'react';
import { UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DocumentUploadField = ({ id, label, description, register, error, required = false, icon: Icon = UploadCloud }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center">
      <Icon className="w-4 h-4 mr-2" />
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
    <div className={`flex items-center justify-center w-full`}>
      <label htmlFor={id} className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 border-border ${error ? 'border-destructive' : ''}`}>
        <div className="flex flex-col items-center justify-center pt-4 pb-5 text-muted-foreground">
          <UploadCloud className="w-6 h-6 mb-1" />
          <p className="text-xs"><span className="font-semibold">Subir archivo</span></p>
          <p className="text-xs text-center px-2">{description}</p>
        </div>
        <Input id={id} type="file" className="hidden" {...register(id)} accept=".pdf,.jpg,.jpeg,.png" />
      </label>
    </div>
    {error && <p className="text-sm text-destructive mt-1">{error.message}</p>}
  </div>
);

export default DocumentUploadField;