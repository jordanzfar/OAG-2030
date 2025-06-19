import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const CustomAmountSection = ({
  powerAmount,
  maxAmount,
  isCustomAmount,
  onSliderChange,
  onCustomAmountChange,
  onToggleCustomAmount,
  formatCurrency
}) => {
  return (
    <div>
      <Label htmlFor="power-amount-slider" className="text-lg font-semibold text-foreground">
        Monto Deseado: {formatCurrency(powerAmount[0])}
      </Label>
      <Slider
        id="power-amount-slider"
        min={6000}
        max={maxAmount}
        step={100}
        value={powerAmount}
        onValueChange={onSliderChange}
        className="mt-4"
      />
      <div className="flex justify-between text-sm text-muted-foreground mt-1 px-1">
        <span>$6,000</span>
        <span>{formatCurrency(maxAmount)}{maxAmount === 12000 ? '+' : ''}</span>
      </div>
      {maxAmount === 12000 && !isCustomAmount && (
        <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={onToggleCustomAmount}>
          ¿Necesitas más de {formatCurrency(maxAmount)}? Ingresa el monto exacto.
        </Button>
      )}

      <AnimatePresence>
        {isCustomAmount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border">
              <Label htmlFor="custom-amount">Monto Personalizado (Mayor a $12,000)</Label>
              <Input
                id="custom-amount"
                type="number"
                min="12000"
                step="100"
                placeholder="Ingresa el monto exacto"
                value={powerAmount[0] >= 12000 ? powerAmount[0] : ''}
                onChange={onCustomAmountChange}
                className="mt-1"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomAmountSection;