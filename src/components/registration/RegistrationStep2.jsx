import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, CheckCircle } from 'lucide-react';

const RegistrationStep2 = ({ onSubmit, register, errors }) => {
  const [uploadProgress, setUploadProgress] = useState({}); // { fileName: progress }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const fieldName = event.target.name;

    files.forEach(file => {
      console.log(`Uploading ${file.name} for ${fieldName}...`);
      let progress = 0;
      setUploadProgress(prev => ({ ...prev, [file.name]: progress }));

      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        } else {
          clearInterval(interval);
        }
      }, 200);
    });
  };

  const renderFileUpload = (id, label, description, fieldName) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className={`flex items-center justify-center w-full`}>
        <label htmlFor={id} className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 border-border ${errors[fieldName] ? 'border-destructive' : ''}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
            <UploadCloud className="w-8 h-8 mb-2" />
            <p className="mb-1 text-sm"><span className="font-semibold">Haz clic para subir</span></p>
            <p className="text-xs">{description}</p>
            <p className="text-xs mt-1">PDF, JPG, PNG (Máx. 100MB)</p>
          </div>
          <Input id={id} type="file" className="hidden" {...register(fieldName)} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
        </label>
      </div>
      {errors[fieldName] && <p className="text-sm text-destructive mt-1">{errors[fieldName].message}</p>}
      {Object.entries(uploadProgress)
         .map(([fileName, progress]) => (
           <div key={fileName} className="mt-2">
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>{fileName}</span>
               <span>{progress}%</span>
             </div>
             <Progress value={progress} className="h-2" />
           </div>
      ))}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground mb-3">2. Carga de Documentos</h3>
      <p className="text-sm text-muted-foreground">Sube los documentos requeridos para verificar tu cuenta. Recomendamos comprimir archivos pesados.</p>
      {renderFileUpload("identificationDoc", "Identificación Oficial", "INE/Pasaporte (frontal y reverso)", "identificationDoc")}
      {renderFileUpload("proofOfAddress", "Comprobante de Domicilio", "Recibo no mayor a 3 meses", "proofOfAddress")}
      <Button type="submit" className="w-full">Finalizar Registro <CheckCircle className="w-4 h-4 ml-2" /></Button>
    </motion.div>
  );
};

export default RegistrationStep2;