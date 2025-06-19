
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DollarSign, Plus, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const BuyingPowerWidget = () => {
  const { userProfile, loading } = useSupabaseAuth();
  const [buyingPower, setBuyingPower] = useState(0);

  useEffect(() => {
    if (userProfile) {
      setBuyingPower(userProfile.buying_power || 0);
    }
  }, [userProfile]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border shadow-lg hover:shadow-primary/10 transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Poder de Compra</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(buyingPower)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              buyingPower >= 10000 
                ? 'bg-primary/10 text-primary' 
                : buyingPower >= 5000 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {buyingPower >= 10000 
                ? '✓ Alto' 
                : buyingPower >= 5000 
                ? '⚡ Medio'
                : '⚠️ Bajo'
              }
            </div>
            
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 px-3">
                <Link to="/dashboard/deposits">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Historial
                </Link>
              </Button>
              <Button asChild size="sm" className="h-8 px-3">
                <Link to="/dashboard/power-buying">
                  <Plus className="w-3 h-3 mr-1" />
                  Aumentar
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BuyingPowerWidget;
