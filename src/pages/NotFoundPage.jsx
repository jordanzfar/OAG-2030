import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-br from-background via-secondary to-background">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        className="flex flex-col items-center"
      >
        <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
        <h1 className="text-6xl font-extrabold text-foreground mb-4">404</h1>
        <p className="text-2xl font-medium text-muted-foreground mb-8">
          ¡Ups! La página que buscas no existe.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Button asChild variant="outline" size="lg">
          <Link to="/">Volver al Inicio</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;