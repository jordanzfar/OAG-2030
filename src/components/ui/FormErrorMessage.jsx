// src/components/ui/FormErrorMessage.jsx

import { AlertCircle } from 'lucide-react';

const FormErrorMessage = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-destructive mt-1 flex items-center">
      <AlertCircle className="w-3 h-3 mr-1.5" />
      {message}
    </p>
  );
};

export default FormErrorMessage;