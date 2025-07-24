import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Función para combinar clases de Tailwind CSS
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Mapa para traducir estados de la base de datos a texto legible
const STATUS_DISPLAY_MAP = {
  'pending_payment': 'Pendiente de Pago',
  'scheduled': 'Programada',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
  'processing': 'Procesando',
  'approved': 'Aprobado',
  'rejected': 'Rechazado',
  'won': 'Ganada',
  'in_transit': 'En Tránsito'
};

// Función que formatea un estado individual
export function formatStatus(status) {
  if (!status) return 'N/A';
  return STATUS_DISPLAY_MAP[status.toLowerCase()] || status;
}

/**
 * Construye el mensaje completo y dinámico para una notificación.
 * Esta es la función clave para asegurar consistencia.
 * @param {object} notification - El objeto de notificación completo.
 * @returns {string} La descripción final y formateada.
 */
export function buildNotificationDescription(notification) {
  if (!notification) return '';

  const metadata = notification.metadata || {};
  let description = notification.message; // Mensaje base

  // Lógica de construcción de mensajes
  if (notification.type === 'inspection_status_update' && metadata.status) {
    description = `Tu inspección para Stock# ${metadata.stock_number || ''} cambió a: ${formatStatus(metadata.status)}`;
  } else if (notification.type === 'new_inspection' && metadata.stock_number) {
    description = `${notification.message} Stock# ${metadata.stock_number}`;
  } else if (notification.type === 'vin_check_completed' && metadata.vin) {
    description = `La verificación para el VIN ${metadata.vin.substring(0, 8)}... está lista.`;
  } else if (notification.type === 'vin_check_failed' && metadata.vin) {
    description = `Falló la verificación para el VIN ${metadata.vin}.`;
  }
  // ... aquí puedes añadir más 'else if' para otros tipos de notificaciones en el futuro ...

  return description;
}