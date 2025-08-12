import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
);

// QUÉ CAMBIÓ: Se eliminó CUALQUIER validación de email contra la base de datos de este archivo.
// POR QUÉ: No podemos usar hooks aquí. Este archivo ahora solo valida la forma y estructura de los datos.
export const registrationSchema = z.object({
  fullName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }).optional().or(z.literal('')),
  
  // La validación de email ahora solo comprueba el formato, no si existe en la BD.
  email: z.string().email("Correo electrónico no válido").min(1, "Debes proporcionar un email o un teléfono."),
  
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
  path: ["confirmPassword"],
});