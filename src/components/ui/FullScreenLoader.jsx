import React from 'react';
import { Loader2 } from 'lucide-react'; // Un ícono de spinner de lucide-react

const FullScreenLoader = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen bg-background text-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Cargando aplicación...</p>
    </div>
  );
};

export default FullScreenLoader;