// Estados de Estados Unidos de América
export const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

// Documentos requeridos para legalización
export const requiredDocuments = [
  { key: 'identificationFront', name: 'Identificación (lado frontal)' },
  { key: 'identificationBack', name: 'Identificación (lado trasero)' },
  { key: 'proofOfAddress', name: 'Comprobante de domicilio' },
  { key: 'titleFront', name: 'Título de propiedad (lado frontal)' },
  { key: 'titleBack', name: 'Título de propiedad (lado trasero)' },
  { key: 'vehiclePhoto1', name: 'Foto del vehículo (ángulo 1)' },
  { key: 'vehiclePhoto2', name: 'Foto del vehículo (ángulo 2)' },
  { key: 'vehiclePhoto3', name: 'Foto del vehículo (ángulo 3)' },
  { key: 'vehiclePhoto4', name: 'Foto del vehículo (ángulo 4)' },
  { key: 'windshieldSerial', name: 'Foto del número de serie del parabrisas' },
  { key: 'doorSticker', name: 'Foto del sticker de la puerta' },
];

// Pasos del formulario
export const formSteps = [
  { id: 1, name: "Información" },
  { id: 2, name: "Documentos" },
  { id: 3, name: "Confirmación" },
];