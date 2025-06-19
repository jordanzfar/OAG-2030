
import React, { useState, useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { MailCheck, FileText, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const RegistrationStep1 = ({ onSubmit, control, register, errors, watch }) => {
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const { toast } = useToast();
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const watchedPassword = watch('password');
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

  const handleSendOtp = (e) => {
    e.preventDefault();
    console.log("Sending OTP...");
    setShowOtpInput(true);
    toast({ 
      title: "Código OTP Enviado", 
      description: "Revisa tu correo electrónico. Usa el código: 123456" 
    });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    console.log("Verifying OTP:", otp);
    if (otp === '123456') {
      setEmailVerified(true);
      setShowOtpInput(false);
      toast({ 
        title: "Email Verificado", 
        description: "Tu correo ha sido verificado con éxito.",
        variant: "default"
      });
    } else {
      toast({ 
        title: "Código Incorrecto", 
        description: "Intenta nuevamente con el código: 123456",
        variant: "destructive" 
      });
    }
  };

  const isNameValid = watchedFullName && watchedFullName.trim().length >= 2;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: 50 }} 
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          1. Información Básica
        </h3>
        <p className="text-sm text-muted-foreground">
          Completa tus datos para crear tu cuenta
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium">
            Nombre Completo *
          </Label>
          <div className="relative mt-1">
            <Input 
              id="fullName" 
              placeholder="Ej: Juan Pérez" 
              {...register("fullName")} 
              ref={nameInputRef} 
              className={`${errors.fullName ? 'border-destructive' : isNameValid ? 'border-green-500' : ''}`}
            />
            {isNameValid && !errors.fullName && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.fullName.message}
            </p>
          )}
          {!errors.fullName && watchedFullName && watchedFullName.trim().length < 2 && (
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa al menos 2 caracteres
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Correo Electrónico *
            </Label>
            <div className="relative mt-1">
              <Input 
                id="email" 
                type="email" 
                placeholder="tu@email.com" 
                {...register("email")} 
                className={`${errors.email ? 'border-destructive' : emailVerified ? 'border-green-500' : ''}`}
              />
              {emailVerified && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {errors.email && (
              <p className="text-sm text-destructive mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            {!showOtpInput && !emailVerified ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendOtp} 
                className="w-full md:w-auto"
                type="button"
              >
                <MailCheck className="w-4 h-4 mr-2"/> 
                Verificar Email
              </Button>
            ) : emailVerified ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Email verificado
              </div>
            ) : (
              <div className="flex space-x-2">
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="Código OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6} 
                  className="flex-grow" 
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleVerifyOtp}
                  type="button"
                >
                  Verificar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium">
            Teléfono *
          </Label>
          <Input 
            id="phone" 
            type="tel" 
            placeholder="(555) 123-4567 o +1 555 123 4567" 
            {...register("phone")} 
            className={`mt-1 ${errors.phone ? 'border-destructive' : ''}`}
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.phone.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Acepta formatos: (555) 123-4567, +1-555-123-4567, 555.123.4567
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
        Continuar 
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
};

export default RegistrationStep1;
