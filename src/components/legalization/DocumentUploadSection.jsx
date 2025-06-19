
import React from 'react';
import { CheckCircle, User, FileText, FileImage as ImageIcon, Car, Upload, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DocumentUploadSection = ({ uploadedFiles, onFileChange }) => {
  const DocumentUploadField = ({ id, label, description, required = false }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        <Upload className="w-4 h-4 mr-2" />
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex items-center justify-center w-full">
        <label htmlFor={id} className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 border-border">
          <div className="flex flex-col items-center justify-center pt-4 pb-5 text-muted-foreground">
            <Upload className="w-6 h-6 mb-1" />
            <p id={`${id}-label`} className="text-xs">
              <span className="font-semibold">Subir archivo</span>
            </p>
            <p className="text-xs text-center px-2">{description}</p>
          </div>
          <Input 
            id={id} 
            type="file" 
            className="hidden" 
            accept=".pdf,.jpg,.jpeg,.png" 
            onChange={(e) => onFileChange(id, e)}
          />
        </label>
      </div>
      {uploadedFiles[id] && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="w-4 h-4 mr-1" />
          Archivo subido: {uploadedFiles[id].name}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Información sobre documentos opcionales */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Documentos Opcionales</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Puedes enviar la solicitud sin todos los documentos. Los documentos faltantes se pueden subir posteriormente desde el historial.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Nota:</strong> El proceso de legalización no podrá completarse hasta que todos los documentos requeridos estén disponibles.
            </p>
          </div>
        </div>
      </div>

      {/* Document upload sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center">
            <User className="w-4 h-4 mr-2" />
            Documentos de Identificación
          </h4>
          <DocumentUploadField 
            id="identificationFront" 
            label="Identificación (Frontal)" 
            description="INE, Pasaporte o Cédula - Lado frontal"
            required={true}
          />
          <DocumentUploadField 
            id="identificationBack" 
            label="Identificación (Trasero)" 
            description="INE, Pasaporte o Cédula - Lado trasero"
            required={true}
          />
          <DocumentUploadField 
            id="proofOfAddress" 
            label="Comprobante de Domicilio" 
            description="Recibo de luz, agua o teléfono (máx. 3 meses)"
            required={true}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Documentos del Vehículo
          </h4>
          <DocumentUploadField 
            id="titleFront" 
            label="Título de Propiedad (Frontal)" 
            description="Title del vehículo - Lado frontal"
            required={true}
          />
          <DocumentUploadField 
            id="titleBack" 
            label="Título de Propiedad (Trasero)" 
            description="Title del vehículo - Lado trasero"
            required={true}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-foreground flex items-center">
          <ImageIcon className="w-4 h-4 mr-2" />
          Fotografías del Vehículo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentUploadField 
            id="vehiclePhoto1" 
            label="Foto Frontal" 
            description="Vista frontal completa del vehículo"
          />
          <DocumentUploadField 
            id="vehiclePhoto2" 
            label="Foto Trasera" 
            description="Vista trasera completa del vehículo"
          />
          <DocumentUploadField 
            id="vehiclePhoto3" 
            label="Foto Lateral Izquierda" 
            description="Vista lateral izquierda completa"
          />
          <DocumentUploadField 
            id="vehiclePhoto4" 
            label="Foto Lateral Derecha" 
            description="Vista lateral derecha completa"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-foreground flex items-center">
          <Car className="w-4 h-4 mr-2" />
          Detalles del Vehículo
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentUploadField 
            id="windshieldSerial" 
            label="Número de Serie del Parabrisas" 
            description="Foto clara del número en el parabrisas"
          />
          <DocumentUploadField 
            id="doorSticker" 
            label="Sticker de la Puerta" 
            description="Etiqueta de información en el marco de la puerta"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;
