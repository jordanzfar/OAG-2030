// src/components/RegistrationForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils"; // Utilidad para unir clases de shadcn/ui
import FormErrorMessage from '@/components/ui/FormErrorMessage'; // Componente de error importado
import { FileText, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import PhoneInput, {
  isPossiblePhoneNumber
} from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Estilos básicos del componente
import './phone-input-styles.css';

// 💡 Mejora: Configuración centralizada para la fortaleza de la contraseña
const strengthLevels = [
  { text: '',      color: 'bg-muted' },       // Nivel 0
  { text: 'Débil',   color: 'bg-destructive' }, // Nivel 1
  { text: 'Regular', color: 'bg-yellow-500' },  // Nivel 2
  { text: 'Buena',   color: 'bg-blue-500' },    // Nivel 3
  { text: 'Fuerte',  color: 'bg-green-500' },   // Nivel 4
  { text: 'Fuerte',  color: 'bg-green-500' },   // Nivel 5
];

const RegistrationForm = () => {
  // 💡 Mejora: Uso de useFormContext para evitar prop-drilling
  const { 
    control, 
    register, 
    watch, 
    formState: { errors, dirtyFields } 
  } = useFormContext();

  const [passwordStrength, setPasswordStrength] = useState(0);

  const watchedPassword = watch('password');
  const watchedPhone = watch('phone');

  // Calcula la fortaleza de la contraseña
  useEffect(() => {
    let strength = 0;
    if (!watchedPassword) {
      setPasswordStrength(0);
      return;
    }
    if (watchedPassword.length >= 6) strength += 1;
    if (/[a-z]/.test(watchedPassword)) strength += 1;
    if (/[A-Z]/.test(watchedPassword)) strength += 1;
    if (/\d/.test(watchedPassword)) strength += 1;
    if (/[!@#$%^&*()_\-+={}[\]|;:'",.<>?/]/.test(watchedPassword)) strength += 1;
    setPasswordStrength(strength);
  }, [watchedPassword]);

  // 💡 Mejora: Lógica de validación de teléfono más robusta
  const isPhoneFieldValid = dirtyFields.phone && !errors.phone && watchedPhone;
  const strengthInfo = useMemo(() => strengthLevels[passwordStrength], [passwordStrength]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Información Básica</h3>
        <p className="text-sm text-muted-foreground">Completa tus datos para crear tu cuenta</p>
      </div>

      <div className="space-y-4">
        {/* Nombre Completo */}
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">Nombre Completo</Label>
          <Input id="fullName" placeholder="Ej: Juan Pérez" {...register("fullName")} className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">Utiliza tu nombre como en tu identificación oficial.</p>
          <FormErrorMessage message={errors.fullName?.message} />
        </div>

        {/* Correo Electrónico */}
        <div>
          <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
          <Input id="email" type="email" placeholder="usuario@email.com" {...register("email")} className="mt-1" />
          <p className="text-xs text-muted-foreground mt-1">No podrá ser cambiado por tu cuenta una vez registrado.</p>
          <FormErrorMessage message={errors.email?.message} />
        </div>
        
        {/* Teléfono */}
         <div>
        <Label htmlFor="phone" className="text-sm font-medium">Teléfono *</Label>
        
        {/* 💡 MEJORA: Usamos Controller para integrar con react-hook-form */}
        <Controller
          name="phone"
          control={control}
          rules={{ validate: (value) => isPossiblePhoneNumber(value || '') || 'Número de teléfono inválido' }}
          render={({ field }) => (
            <PhoneInput
              {...field}
              id="phone"
              international
              defaultCountry="US" // País por defecto (puedes cambiarlo a "MX", "CO", etc.)
              placeholder="Ej: 281 123 4567"
              className="mt-1"
              // Usamos el Input de shadcn para mantener el estilo visual
              inputComponent={Input}
            />
          )}
        />
        <FormErrorMessage message={errors.phone?.message} />
      </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Contraseña *</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} className="mt-1" />
            <FormErrorMessage message={errors.password?.message} />
            {watchedPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthInfo.color}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{strengthInfo.text}</span>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo: 6 caracteres, 1 mayúscula, 1 minúscula, 1 número.</p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} className="mt-1" />
            <FormErrorMessage message={errors.confirmPassword?.message} />
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="flex items-start space-x-3 pt-4">
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptTerms"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="mt-1"
              />
            )}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
              Acepto los{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto text-primary underline">Términos y Condiciones</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center"><FileText className="w-5 h-5 mr-2"/>Términos y Condiciones</DialogTitle>
                    <DialogDescription>Términos de uso de Opulent Auto Gallery</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground py-4">
                    {/* Contenido de los términos */}
                  </div>
                </DialogContent>
              </Dialog>
              {" "}y la{" "}
              {/* ⚠️ AVISO: Este botón aún necesita su propia funcionalidad de Dialog o Link */}
              <Button variant="link" className="p-0 h-auto text-primary underline">
                Política de Privacidad
              </Button>
            </Label>
            <FormErrorMessage message={errors.acceptTerms?.message} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-6" size="lg">
        Crear Cuenta
        <UserPlus className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

export default RegistrationForm;