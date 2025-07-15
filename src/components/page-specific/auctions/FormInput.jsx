import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CurrencyInput from 'react-currency-input-field';
import { cn } from "@/lib/utils";

const FormInput = ({ name, control, label, type = "text", isCurrency = false, ...props }) => {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            {isCurrency ? (
              <CurrencyInput
                id={name}
                name={field.name}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                intlConfig={{ locale: 'en-US', currency: 'USD' }}
                decimalsLimit={2}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive"
                )}
                {...props}
              />
            ) : (
              <Input
                id={name}
                type={type}
                {...field}
                {...props}
                className={cn(error && "border-destructive", "mt-1")}
              />
            )}
            {error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}
          </>
        )}
      />
    </div>
  );
};

export default FormInput;