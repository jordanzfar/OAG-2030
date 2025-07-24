import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Función para combinar clases de Tailwind CSS
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// En tu archivo src/lib/utils.js

// --- AÑADE ESTE BLOQUE DE CÓDIGO ---

// 1. EL MAPA DE CATEGORÍAS
// Asocia cada 'type' de notificación con una categoría legible.
const NOTIFICATION_CATEGORY_MAP = {
  // Categoría: Subastas
  'new_auction_bid': 'Subasta',
  'outbid': 'Subasta',
  'auction_won': 'Subasta',
  'auction_lost': 'Subasta',
  'auction_status_update': 'Subasta',

  // Categoría: Pagos
  'payment_required': 'Pagos',
  'pending_payment': 'Pagos',
  'vin_check_completed': 'Pagos', // O podría ser 'Vehículos'
  
  // Categoría: Inspecciones
  'new_inspection': 'Inspecciones',
  'inspection_status_update': 'Inspecciones',

  // Categoría: General (para todo lo demás)
  'new_user': 'General',
  'document_missing': 'Alertas',
  'vin_check_failed': 'Alertas'
  // ... añade más tipos según los necesites
};

export function getNotificationCategory(notificationType) {
  if (!notificationType) return 'General';
  return NOTIFICATION_CATEGORY_MAP[notificationType] || 'General';
}

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
    description = `La verificación para el VIN ${metadata.vin.substring(0, 17)} está lista.`;
  } else if (notification.type === 'vin_check_failed' && metadata.vin) {
    description = `Falló la verificación para el VIN ${metadata.vin}.`;
  } else if (notification.type === 'vin_check_processing' && metadata.vin) {
    description = `Estamos procesando la verificación para el VIN ${metadata.vin.substring(0, 17)}`;
  } else if (notification.type === 'new_vin_check' && metadata.vin) {
  description = `${notification.message} VIN: ${metadata.vin}`;

  if (notification.type === 'new_auction_bid' && metadata.lot_number) {
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metadata.amount || 0);
    // Este es el mensaje detallado que queremos mostrar
    description = `Nueva puja de ${metadata.user_name || 'un usuario'} por ${formattedAmount} en el lote #${metadata.lot_number}.`;
  } 
  
  } else if (notification.type === 'outbid' && metadata.lot_number) {
    description = `Tu puja para el lote ${metadata.lot_number} fue superada. ¡Haz una nueva oferta!`;
  } else if (notification.type === 'auction_won' && metadata.lot_number) {
    description = `¡Felicidades! Has ganado la subasta para el lote ${metadata.lot_number}.`;
  } else if (notification.type === 'auction_lost' && metadata.lot_number) {
    description = `No ganaste la subasta para el lote ${metadata.lot_number}. Motivo: ${metadata.reason || 'Puja superada'}.`;

  }

  // ... aquí puedes añadir más 'else if' para otros tipos de notificaciones en el futuro ...

  return description;
}