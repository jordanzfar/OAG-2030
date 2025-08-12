import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const membershipPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Acceso a subastas', 'Notificaciones básicas', 'Soporte por email'],
    isPopular: false,
  },
  {
    id: 'explorador',
    name: 'Plan Explorador',
    price: 49,
    features: [
      '10 reportes VIN al año',
      'Acceso total a la plataforma',
      'Inspecciones físicas a solo $130',
      'Fee por compra: $399',
      'Asesoría ilimitada',
    ],
    isPopular: false,
  },
  {
    id: 'comercial',
    name: 'Plan Comercial',
    price: 199,
    features: [
      '30 reportes VIN anuales',
      'Fee por compra reducido: $349',
      'Inspecciones físicas a solo $110',
      'Soporte por Plataforma y email',
    ],
    isPopular: true,
  },
  {
    id: 'socio_pro',
    name: 'Plan Socio PRO',
    price: 499,
    features: [
      '50 reportes VIN al año',
      'Fee por compra reducido: $299',
      'Inspecciones adicionales a solo $100',
      'Soporte prioritario vía WhatsApp',
    ],
    isPopular: false,
  },
];

const PlanSelector = ({ selectedPlan, onSelectPlan, onNextStep }) => {
  const chosenPlan = membershipPlans.find(p => p.id === selectedPlan);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Elige tu Plan</h2>
        <p className="text-muted-foreground mt-2">Comienza gratis o desbloquea beneficios exclusivos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              onClick={() => onSelectPlan(plan.id)}
              className={cn(
                "cursor-pointer transition-all duration-300 flex flex-col h-full relative overflow-hidden",
                selectedPlan === plan.id 
                  ? "border-primary ring-2 ring-primary shadow-2xl" 
                  : "hover:shadow-lg hover:-translate-y-1"
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 20% 50%)'}}>
                    <Star className="w-3 h-3 inline-block mr-1.5" />
                    Popular
                  </div>
                </div>
              )}
              <CardHeader className="pt-8">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-4 w-4 mr-3 mt-0.5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="text-center pt-4">
        <Button
          size="lg"
          onClick={onNextStep}
          disabled={!selectedPlan}
          className="w-full sm:w-auto text-lg px-8 py-6"
        >
          {chosenPlan?.price > 0 
            ? `Continuar con ${chosenPlan.name} - $${chosenPlan.price}/año`
            : `Continuar con el plan ${chosenPlan?.name}`
          }
        </Button>
      </div>
    </div>
  );
};

export default PlanSelector;