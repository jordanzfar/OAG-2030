import React from 'react';
import { CheckCircle, Car, UploadCloud } from 'lucide-react';

const Stepper = ({ currentStep, steps }) => (
  <div className="flex justify-between items-center mb-8 border-b pb-4">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${currentStep >= index + 1 ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border text-muted-foreground'}`}>
            {currentStep > index + 1 ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <>
                {step.name === "Información" && <Car className="w-4 h-4" />}
                {step.name === "Documentos" && <UploadCloud className="w-4 h-4" />}
                {step.name === "Confirmación" && <CheckCircle className="w-4 h-4" />}
              </>
            )}
          </div>
          <p className={`mt-1 text-xs font-medium ${currentStep >= index + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
        </div>
        {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > index + 1 ? 'bg-primary' : 'bg-border'}`}></div>}
      </React.Fragment>
    ))}
  </div>
);

export default Stepper;