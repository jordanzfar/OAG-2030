// src/components/registration/schemas.js

import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

// Esta expresión regular ya impone una longitud mínima de 6 caracteres con {6,}
const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
);

export const registrationSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).optional().or(z.literal('')),
  
  // Permite que el campo sea opcional o un string vacío.
  email: z.string().email("Correo electrónico no válido").optional().or(z.literal('')),
  
  // ✅ Valida el formato del teléfono si se proporciona un valor.
  phone: z.string()
    .refine(value => !value || isValidPhoneNumber(value), {
      message: "El número de teléfono no es válido.",
    })
    .optional(),

  password: z.string()
    .regex(passwordValidation, {
      message: "La contraseña debe tener: mínimo 6 caracteres, 1 mayúscula, 1 minúscula y 1 número.",
    }),
    
  confirmPassword: z.string().min(1, "Debes confirmar tu contraseña."),
  
  acceptTerms: z.boolean()
    .refine(value => value === true, {
      message: "Debes aceptar los términos y condiciones.",
    }),
})
.refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"], // El error se muestra en el campo de confirmación
})
.refine(data => {
  // ✅ Comprueba que al menos uno de los dos campos (email o teléfono) tenga un valor.
  return !!data.email || !!data.phone;
}, {
  message: "Debes proporcionar un email o un teléfono.",
  // Asigna el error a un campo para que se muestre en la UI.
  // Si ambos están vacíos, mostrar el error en el campo de email tiene sentido.
  path: ["email"], 
});