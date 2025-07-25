import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Función para combinar clases de Tailwind CSS
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// --- MAPAS DE CONFIGURACIÓN ---

const NOTIFICATION_ICON_MAP = {

  //documentos de Depósito
  pending: 'file-clock',          // <-- ACTUALIZADO
  approved: 'file-check-2',       // <-- ACTUALIZADO
  rejected: 'file-x-2',           // <-- ACTUALIZADO

  // Estados de Legalización
  pending: 'clock',
  processing: 'loader-2',
  in_review: 'file-search-2',
  missing_documents: 'file-minus-2',
  missing_information: 'alert-triangle',
  deposit_required: 'landmark',
  payment_pending: 'dollar-sign',
  ready_for_delivery: 'package-check',
  completed: 'check-circle-2',
  rejected: 'x-circle',
  
// Estados de Poder de Compra 
  approved: 'check-circle-2', 
  pending_payment: 'dollar-sign', 
  cancelled: 'slash-circle',          
  charged_for_debt: 'receipt-text', 
  active: 'shield-check',


  // Tipos de notificación que no tienen 'status'
  new_deposit_request: 'upload', // <-- AÑADIDO
  new_legalization_request: 'file-plus-2',
  new_power_buying_request: 'trending-up', 
  new_auction_bid: 'gavel',
  outbid: 'trending-down',
  auction_won: 'trophy',
  auction_lost: 'shield-off',
  new_inspection: 'search',
  new_user: 'user-plus',
  
  // Icono por defecto
  default: 'bell'
};

const NOTIFICATION_COLOR_MAP = {
  // Estados y Tipos con colores específicos
  pending: 'text-yellow-500',         
  processing: 'text-blue-500',
  active: 'text-green-500',
  approved: 'text-green-500',      
  completed: 'text-green-500',
  auction_won: 'text-yellow-500',
  rejected: 'text-red-500',
  outbid: 'text-red-500',
  auction_lost: 'text-red-500',
  cancelled: 'text-gray-500',         
  charged_for_debt: 'text-red-500', 
  missing_documents: 'text-yellow-500',
  missing_information: 'text-yellow-500',
  payment_pending: 'text-blue-500',
  deposit_required: 'text-blue-500',
  
  // Color por defecto para el resto
  default: 'text-muted-foreground'
};

const NOTIFICATION_CATEGORY_MAP = {
  'new_document_upload': 'Documentos',
  'document_status_update': 'Documentos',
  'new_deposit_request': 'Depósitos',
  'deposit_status_update': 'Depósitos',
  'new_legalization_request': 'Legalizaciones',
  'legalization_status_update': 'Legalizaciones',
  'new_power_buying_request': 'Finanzas', 
  'power_buying_status_update': 'Finanzas', 
  'new_auction_bid': 'Subasta',
  'outbid': 'Subasta',
  'auction_won': 'Subasta',
  'auction_lost': 'Subasta',
  'auction_status_update': 'Subasta',
  'payment_required': 'Pagos',
  'pending_payment': 'Pagos',
  'vin_check_completed': 'Pagos',
  'new_inspection': 'Inspecciones',
  'inspection_status_update': 'Inspecciones',
  'new_user': 'General',
  'document_missing': 'Alertas',
  'vin_check_failed': 'Alertas',
  'default': 'General'
};

const STATUS_DISPLAY_MAP = {
  'pending': 'Pendiente',
  'processing': 'Procesando',
  'in_review': 'En Revisión',
  'missing_documents': 'Documentos Faltantes',
  'missing_information': 'Información Faltante',
  'deposit_required': 'Depósito Requerido',
  'payment_pending': 'Pendiente de Pago',
  'ready_for_delivery': 'Listo para Entrega',
  'completed': 'Completada',
  'rejected': 'Rechazado',
  'scheduled': 'Programada',
  'approved': 'Aprobado',
  'cancelled': 'Cancelada',
  'charged_for_debt': 'Cargo por Deuda',
  'active': 'Activo',
  'won': 'Ganada',
  'in_transit': 'En Tránsito'
};

// --- FUNCIONES DE UTILIDAD ---

export function getNotificationIcon(notification) {
  if (!notification) return NOTIFICATION_ICON_MAP.default;
  const status = notification.metadata?.status;
  if (status && NOTIFICATION_ICON_MAP[status]) {
    return NOTIFICATION_ICON_MAP[status];
  }
  if (NOTIFICATION_ICON_MAP[notification.type]) {
    return NOTIFICATION_ICON_MAP[notification.type];
  }
  return NOTIFICATION_ICON_MAP.default;
}

export function getNotificationColor(notification) {
  if (!notification) return NOTIFICATION_COLOR_MAP.default;
  const status = notification.metadata?.status;
  if (status && NOTIFICATION_COLOR_MAP[status]) {
    return NOTIFICATION_COLOR_MAP[status];
  }
  if (NOTIFICATION_COLOR_MAP[notification.type]) {
    return NOTIFICATION_COLOR_MAP[notification.type];
  }
  return NOTIFICATION_COLOR_MAP.default;
}

export function getNotificationCategory(notificationType) {
  return NOTIFICATION_CATEGORY_MAP[notificationType] || NOTIFICATION_CATEGORY_MAP.default;
}

export function formatStatus(status) {
  if (!status) return 'N/A';
  return STATUS_DISPLAY_MAP[status.toLowerCase()] || status;
}

/**
 * Construye el mensaje completo y dinámico para una notificación.
 * Esta es tu lógica original restaurada.
 * @param {object} notification - El objeto de notificación completo.
 * @returns {string} La descripción final y formateada.
 */
export function buildNotificationDescription(notification) {
  if (!notification) return '';

  const metadata = notification.metadata || {};
  let description = notification.message; // Usa el mensaje del backend como base

  // Tu lógica original para construir mensajes en el frontend
  if (notification.type === 'inspection_status_update' && metadata.status) {
    description = `Tu inspección para Stock# ${metadata.stock_number || ''} cambió a: ${formatStatus(metadata.status)}`;
  } else if (notification.type === 'new_inspection' && metadata.stock_number) {
    description = `Nueva inspección registrada para Stock# ${metadata.stock_number}`;
  } else if (notification.type === 'vin_check_completed' && metadata.vin) {
    description = `La verificación para el VIN ${metadata.vin.substring(0, 17)} está lista.`;
  } else if (notification.type === 'vin_check_failed' && metadata.vin) {
    description = `Falló la verificación para el VIN ${metadata.vin}.`;
  } else if (notification.type === 'vin_check_processing' && metadata.vin) {
    description = `Estamos procesando la verificación para el VIN ${metadata.vin.substring(0, 17)}`;
  } else if (notification.type === 'new_vin_check' && metadata.vin) {
    description = `Nueva verificación de VIN para: ${metadata.vin}`;
  } else if (notification.type === 'new_auction_bid' && metadata.lot_number) {
    const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metadata.amount || 0);
    description = `Nueva puja de ${metadata.user_name || 'un usuario'} por ${formattedAmount} en el lote #${metadata.lot_number}.`;
  } else if (notification.type === 'outbid' && metadata.lot_number) {
    description = `Tu puja para el lote ${metadata.lot_number} fue superada. ¡Haz una nueva oferta!`;
  } else if (notification.type === 'auction_won' && metadata.lot_number) {
    description = `¡Felicidades! Has ganado la subasta para el lote ${metadata.lot_number}.`;
  } else if (notification.type === 'auction_lost' && metadata.lot_number) {
    description = `No ganaste la subasta para el lote ${metadata.lot_number}. Motivo: ${metadata.reason || 'Puja superada'}.`;
  } else if (notification.type === 'legalization_status_update') {
    // Para este tipo, el mensaje del backend ya es descriptivo,
    // así que simplemente lo usamos.
    description = notification.message;
  }

  return description;
}