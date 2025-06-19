import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const RegistrationStep3 = ({ onEnterDemo }) => {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
       <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h3 className="text-2xl font-semibold text-foreground">¡Registro Casi Completo!</h3>
      <p className="text-muted-foreground">
        Hemos recibido tu información. Mientras validamos tus documentos (esto puede tomar hasta 24 horas),
        puedes explorar las funcionalidades de la plataforma en modo demo.
      </p>
      <Button onClick={onEnterDemo} size="lg">Comenzar Demo <ArrowRight className="w-5 h-5 ml-2" /></Button>
    </motion.div>
  );
};

export default RegistrationStep3;