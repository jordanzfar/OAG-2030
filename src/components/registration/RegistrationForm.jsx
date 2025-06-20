
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { FileText, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const RegistrationForm = ({ onSubmit, control, register, errors, watch, formState }) => {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { toast } = useToast();
  const phoneInputRef = useRef(null);

  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, []);

  const watchedPassword = watch('password');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedFullName = watch('fullName');

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

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: case 1: return 'bg-destructive';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: case 5: return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: case 1: return 'Débil';
      case 2: return 'Regular';
      case 3: return 'Buena';
      case 4: case 5: return 'Fuerte';
      default: return '';
    }
  };

  // Validación en tiempo real
  const isPhoneValid = watchedPhone && 
    watchedPhone.trim().length > 0 && 
    /.*\d.*/.test(watchedPhone) &&
    !errors.phone;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Información Básica
        </h3>
        <p className="text-sm text-muted-foreground">
          Completa tus datos para crear tu cuenta
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">
            Nombre Completo
          </Label>
          <Input 
            id="fullName" 
            placeholder="Ej: Juan Pérez" 
            {...register("fullName")} 
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Utiliza tu nombre como en tu identificacion oficial
          </p>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Correo Electrónico
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="usuario@email.com" 
            {...register("email")} 
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            No podra ser cambiado por tu cuenta una vez registrado
          </p>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium">
            Teléfono *
          </Label>
          <div className="relative mt-1">
            <Input 
              id="phone" 
              type="tel" 
              placeholder="Ej: 281-123-4567" 
              {...register("phone")} 
              ref={phoneInputRef}
              className={`${
                errors.phone 
                  ? 'border-destructive focus:border-destructive' 
                  : isPhoneValid 
                    ? 'border-green-500 focus:border-green-500' 
                    : 'border-input focus:border-ring'
              }`}
            />
            {isPhoneValid && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.phone.message}
            </p>
          )}
          {isPhoneValid && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Teléfono válido
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Debe contener al menos un número
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña *
            </Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              {...register("password")} 
              className={`mt-1 ${errors.password ? 'border-destructive' : ''}`}
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.password.message}
              </p>
            )}
            {watchedPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`} 
                      style={{ width: `${Math.max((passwordStrength / 4) * 100, 10)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo: 6 caracteres, 1 mayúscula, 1 minúscula, 1 número
                </p>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar Contraseña *
            </Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              {...register("confirmPassword")} 
              className={`mt-1 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-4">
          <Controller 
            name="acceptTerms" 
            control={control} 
            render={({ field }) => (
              <Checkbox 
                id="acceptTerms" 
                checked={field.value} 
                onCheckedChange={field.onChange} 
                className={`mt-1 ${errors.acceptTerms ? 'border-destructive' : ''}`}
              />
            )} 
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
              Acepto los{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto text-primary underline">
                    Términos y Condiciones
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2"/>
                      Términos y Condiciones
                    </DialogTitle>
                    <DialogDescription>
                      Términos de uso de Opulent Auto Gallery
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-muted-foreground py-4">
                    <p>
                      <strong>1. Aceptación de Términos:</strong> Al usar nuestros servicios, 
                      aceptas estos términos y condiciones.
                    </p>
                    <p>
                      <strong>2. Servicios:</strong> Ofrecemos servicios de importación, 
                      inspección y legalización de vehículos.
                    </p>
                    <p>
                      <strong>3. Responsabilidades:</strong> El usuario es responsable de 
                      proporcionar información veraz y completa.
                    </p>
                    <p>
                      <strong>4. Privacidad:</strong> Protegemos tu información personal 
                      según nuestra política de privacidad.
                    </p>
                    <p>
                      <strong>5. Modificaciones:</strong> Nos reservamos el derecho de 
                      modificar estos términos en cualquier momento.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              {" "}y la{" "}
              <Button variant="link" className="p-0 h-auto text-primary underline">
                Política de Privacidad
              </Button>
            </Label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.acceptTerms.message}
              </p>
            )}
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
