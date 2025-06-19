// Local storage utilities for demo mode
export const localStorageKeys = {
  USER_DATA: 'opulent_user_data',
  BUYING_POWER: 'opulent_buying_power',
  NOTIFICATIONS: 'opulent_notifications',
  ADMIN_NOTIFICATIONS: 'opulent_admin_notifications',
  CHAT_MESSAGES: 'opulent_chat_messages',
  VIN_CREDITS: 'opulent_vin_credits',
  VIN_HISTORY: 'opulent_vin_history',
  DEPOSITS: 'opulent_deposits',
  CLIENTS: 'opulent_clients',
  ADMIN_DEPOSITS: 'opulent_admin_deposits'
};

// Initialize demo data if not exists
export const initializeDemoData = () => {
  // User data
  if (!localStorage.getItem(localStorageKeys.USER_DATA)) {
    localStorage.setItem(localStorageKeys.USER_DATA, JSON.stringify({
      id: 'demo-user-123',
      full_name: 'Juan Cliente',
      email: 'client@opulent.com',
      role: 'client',
      verification_status: 'verified',
      buying_power: 15000
    }));
  }

  // Notifications
  if (!localStorage.getItem(localStorageKeys.NOTIFICATIONS)) {
    localStorage.setItem(localStorageKeys.NOTIFICATIONS, JSON.stringify([
      {
        id: 1,
        type: 'payment_required',
        message: 'Se requiere pago para completar tu solicitud de legalización',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        type: 'document_missing',
        message: 'Faltan documentos para tu inspección #INS-001',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        type: 'status_update',
        message: 'Tu verificación VIN ha sido completada',
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ]));
  }

  // Chat messages
  if (!localStorage.getItem(localStorageKeys.CHAT_MESSAGES)) {
    localStorage.setItem(localStorageKeys.CHAT_MESSAGES, JSON.stringify([
      { 
        id: 1, 
        sender_id: 'support', 
        content: '¡Hola! Soy María del equipo de soporte de Opulent Auto. ¿En qué podemos ayudarte hoy?', 
        created_at: new Date(Date.now() - 600000).toISOString(),
        is_read: true
      },
      { 
        id: 2, 
        sender_id: 'demo-user-123', 
        content: 'Hola María, tengo una pregunta sobre mi solicitud de legalización. ¿Podrías ayudarme?', 
        created_at: new Date(Date.now() - 300000).toISOString(),
        is_read: true
      },
      { 
        id: 3, 
        sender_id: 'support', 
        content: 'Por supuesto, estaré encantada de ayudarte. ¿Cuál es tu número de solicitud?', 
        created_at: new Date(Date.now() - 180000).toISOString(),
        is_read: true
      },
      {
        id: 4,
        sender_id: 'support',
        content: 'También veo que necesitas completar el pago para procesar tu solicitud. Te enviaré los detalles por separado.',
        created_at: new Date(Date.now() - 120000).toISOString(),
        is_read: false
      }
    ]));
  }

  // VIN Credits
  if (!localStorage.getItem(localStorageKeys.VIN_CREDITS)) {
    localStorage.setItem(localStorageKeys.VIN_CREDITS, JSON.stringify({
      remaining: 8,
      used: 2
    }));
  }

  // Clients for admin
  if (!localStorage.getItem(localStorageKeys.CLIENTS)) {
    localStorage.setItem(localStorageKeys.CLIENTS, JSON.stringify([
      { id: 'demo-1', full_name: 'Juan Cliente', email: 'juan@email.com', buying_power: 6000, verification_status: 'verified' },
      { id: 'demo-2', full_name: 'Ana Gómez', email: 'ana@email.com', buying_power: 12000, verification_status: 'verified' },
      { id: 'demo-3', full_name: 'Carlos Ruiz', email: 'carlos@email.com', buying_power: 0, verification_status: 'pending' },
      { id: 'demo-4', full_name: 'María López', email: 'maria@email.com', buying_power: 25000, verification_status: 'verified' }
    ]));
  }

  // Admin deposits
  if (!localStorage.getItem(localStorageKeys.ADMIN_DEPOSITS)) {
    localStorage.setItem(localStorageKeys.ADMIN_DEPOSITS, JSON.stringify([
      { id: 'dep-1', user_id: 'demo-1', amount: 600, status: 'confirmed', created_at: new Date().toISOString(), method: 'Stripe', client_name: 'Juan Cliente' },
      { id: 'dep-2', user_id: 'demo-2', amount: 1200, status: 'pending', created_at: new Date().toISOString(), method: 'Bank Transfer', client_name: 'Ana Gómez' },
      { id: 'dep-3', user_id: 'demo-4', amount: 2500, status: 'confirmed', created_at: new Date(Date.now() - 86400000).toISOString(), method: 'Stripe', client_name: 'María López' }
    ]));
  }

  // Admin notifications
  if (!localStorage.getItem(localStorageKeys.ADMIN_NOTIFICATIONS)) {
    localStorage.setItem(localStorageKeys.ADMIN_NOTIFICATIONS, JSON.stringify([
      {
        id: 1,
        type: 'new_user',
        message: 'Nuevo usuario registrado: María López requiere verificación',
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        type: 'payment_pending',
        message: 'Pago pendiente de Ana Gómez por $1,200 - Transferencia bancaria',
        is_read: false,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 3,
        type: 'document_review',
        message: 'Documentos de legalización de Carlos Ruiz requieren revisión',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 4,
        type: 'verification_required',
        message: 'Cliente Juan Cliente solicita aumento de poder de compra a $15,000',
        is_read: true,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 5,
        type: 'system_alert',
        message: 'Sistema de pagos Stripe reporta transacción fallida - Revisar configuración',
        is_read: true,
        created_at: new Date(Date.now() - 10800000).toISOString()
      }
    ]));
  }
};

// Get data from localStorage
export const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting local data:', error);
    return null;
  }
};

// Set data to localStorage
export const setLocalData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error setting local data:', error);
    return false;
  }
};

// Update specific item in array
export const updateLocalArrayItem = (key, itemId, updateFn) => {
  const data = getLocalData(key) || [];
  const updatedData = data.map(item => 
    item.id === itemId ? updateFn(item) : item
  );
  return setLocalData(key, updatedData);
};

// Add item to array
export const addLocalArrayItem = (key, newItem) => {
  const data = getLocalData(key) || [];
  const updatedData = [...data, newItem];
  return setLocalData(key, updatedData);
};