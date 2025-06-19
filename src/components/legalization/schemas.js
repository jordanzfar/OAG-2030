import * as z from 'zod';

export const legalizationSchema = z.object({
  // Información del Vehículo
  vin: z.string().length(17, "El VIN debe tener 17 caracteres"),
  color: z.string().min(1, "Color del vehículo requerido"),
  marca: z.string().min(1, "Marca del vehículo requerida"),
  modelo: z.string().min(1, "Modelo del vehículo requerido"),
  ano: z.preprocess(
    (val) => Number(val),
    z.number().min(1900, "Año inválido").max(new Date().getFullYear() + 1, "Año inválido")
  ),
  motor: z.string().min(1, "Información del motor requerida"),
  cilindraje: z.string().min(1, "Cilindraje requerido"),
  
  // Datos del Propietario
  ownerName: z.string().min(1, "Nombre del propietario requerido"),
  ownerPhone: z.string().min(10, "Teléfono inválido"),

  // Datos del Título
  titleIssueDate: z.date({ required_error: "Fecha de emisión requerida" }),
  originState: z.string().min(1, "Estado de procedencia requerido"),
  legalizationType: z.enum(['aduana', 'decreto'], { required_error: "Selecciona el tipo de legalización" }),

  // Documentos (opcionales pero con advertencias)
  identificationFront: z.any().optional(),
  identificationBack: z.any().optional(),
  proofOfAddress: z.any().optional(),
  titleFront: z.any().optional(),
  titleBack: z.any().optional(),
  vehiclePhoto1: z.any().optional(),
  vehiclePhoto2: z.any().optional(),
  vehiclePhoto3: z.any().optional(),
  vehiclePhoto4: z.any().optional(),
  windshieldSerial: z.any().optional(),
  doorSticker: z.any().optional(),
});