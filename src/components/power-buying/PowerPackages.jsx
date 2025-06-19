import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

const PowerPackages = ({ packages, selectedAmount, onPackageSelect, formatCurrency }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {packages.map((pkg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 ${
                  pkg.popular ? 'border-primary shadow-primary/20' : 'border-border'
                } ${selectedAmount === pkg.amount ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}
                onClick={() => onPackageSelect(pkg.amount)}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl">{pkg.title}</CardTitle>
                    <CardDescription className="text-sm">{pkg.description}</CardDescription>
                    <div className="space-y-2 mt-4">
                      <div className="text-3xl font-bold text-foreground">
                        {pkg.amount === 'custom' ? '$12,000+' : formatCurrency(pkg.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Depósito: <span className="font-semibold">
                          {pkg.deposit === 'variable' ? '10% del monto' : formatCurrency(pkg.deposit)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Haz clic para seleccionar este plan</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </div>
      
      {/* Explicación del depósito */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-start space-x-3">
          <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">¿Cómo se calcula el depósito?</h4>
            <p className="text-sm text-muted-foreground">
              El depósito requerido es el <strong>10% del monto de poder de compra</strong> que elijas. 
              No hay límite máximo - mientras mayor sea el monto, mayor será el depósito. Este monto se mantiene 
              como garantía (holding) en tu tarjeta hasta que uses el poder de compra o expire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerPackages;