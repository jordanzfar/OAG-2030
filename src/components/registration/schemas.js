import * as z from 'zod';

export const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
);

export const registrationSchema = z.object({
  fullName: z.string().optional(), // Sigue siendo opcional
  email: z.string().email("Correo electrónico no válido").optional(), // Añadimos validación de formato
  phone: z.string().optional(), // Lo mantendremos opcional por ahora, la validación cruzada lo manejará
  password: z.string()
    .min(6, "Mínimo 6 caracteres")
    .regex(passwordValidation, "Debe contener al menos: 1 mayúscula, 1 minúscula y 1 número"),
  confirmPassword: z.string()
    .min(1, "Confirma tu contraseña"),
  acceptTerms: z.boolean()
    .refine(value => value === true, "Debes aceptar los términos y condiciones"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})
// --- AÑADIMOS ESTA PARTE PARA LA VALIDACIÓN CRUZADA ---
.refine(data => {
  // Al menos uno de los dos (email o teléfono) debe estar presente y no vacío
  return (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0);
}, {
  message: "Debes introducir un correo electrónico o un número de teléfono.",
  path: ["email"], // Puedes asignar el error a 'email' o a 'phone', o incluso a un campo ficticio.
});