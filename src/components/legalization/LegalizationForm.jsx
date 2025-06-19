
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import Stepper from '@/components/legalization/Stepper';
import DocumentWarning from '@/components/legalization/DocumentWarning';
import VehicleInfoSection from '@/components/legalization/VehicleInfoSection';
import OwnerInfoSection from '@/components/legalization/OwnerInfoSection';
import TitleInfoSection from '@/components/legalization/TitleInfoSection';
import DocumentUploadSection from '@/components/legalization/DocumentUploadSection';
import { legalizationSchema } from '@/components/legalization/schemas';
import { requiredDocuments, formSteps } from '@/components/legalization/constants';

const LegalizationForm = ({ onSubmit, isSubmitting }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const { register, handleSubmit, control, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(legalizationSchema),
  });

  const getMissingDocuments = () => {
    return requiredDocuments.filter(doc => !uploadedFiles[doc.key]).map(doc => doc.name);
  };

  const handleFileUpload = (fieldName, files) => {
    if (files && files.length > 0) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: files[0] }));
    }
  };

  const handleFileChange = (fieldName, e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(fieldName, [file]);
      const label = document.getElementById(`${fieldName}-label`);
      if (label) {
        label.textContent = file.name;
      }
    }
  };

  const handleNextStep = async () => {
    const isValid = await trigger();
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({ 
        title: "Campos Incompletos", 
        description: "Por favor revisa los campos marcados.", 
        variant: "destructive" 
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFormSubmit = async (data) => {
    await onSubmit(data, uploadedFiles);
    setCurrentStep(3);
    setUploadedFiles({});
  };

  const onSubmitWithoutDocuments = async (data) => {
    const missingDocs = getMissingDocuments();
    
    if (missingDocs.length > 0) {
      toast({
        title: "Documentos Pendientes",
        description: `Se enviará la solicitud sin ${missingDocs.length} documentos. Podrás subirlos posteriormente desde el historial.`,
        variant: "default"
      });
    }

    await handleFormSubmit(data);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setUploadedFiles({});
  };

  return (
    <div>
      <Stepper currentStep={currentStep} steps={formSteps} />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Step 1: Information */}
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <VehicleInfoSection register={register} errors={errors} />
            <OwnerInfoSection register={register} errors={errors} />
            <TitleInfoSection control={control} errors={errors} />
            <Button type="button" onClick={handleNextStep} className="w-full">
              Siguiente: Documentos
            </Button>
          </motion.div>
        )}

        {/* Step 2: Documents */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <DocumentWarning missingDocs={getMissingDocuments()} />
            
            <DocumentUploadSection 
              uploadedFiles={uploadedFiles}
              onFileChange={handleFileChange}
            />

            <div className="flex justify-between mt-6 space-x-4">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                Anterior
              </Button>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleSubmit(onSubmitWithoutDocuments)}
                  disabled={isSubmitting}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Sin Documentos'}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitud Completa'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-xl font-semibold text-foreground">Solicitud Enviada</h3>
            <p className="text-muted-foreground">
              Hemos recibido tu solicitud de legalización. 
              {getMissingDocuments().length > 0 && (
                <span className="block mt-2 text-yellow-600">
                  Recuerda subir los documentos faltantes desde el historial para completar el proceso.
                </span>
              )}
              Recibirás notificaciones sobre el estado del proceso.
            </p>
            <Button variant="outline" onClick={resetForm}>
              Iniciar Nueva Solicitud
            </Button>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default LegalizationForm;
