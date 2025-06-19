
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzttivkstakohnjhhqoi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dHRpdmtzdGFrb2huamhocW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMDI4MTgsImV4cCI6MjA2NTc3ODgxOH0.LzHKN4cUy5aqaQOJSUBJ0U1pNJZgKjJQ8HdnUncN79g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const supabaseHelpers = {
  // Authentication helpers
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Database helpers
  async insertRecord(table, data) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    return { data: result, error };
  },

  async updateRecord(table, id, data) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    return { data: result, error };
  },

  async deleteRecord(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    return { error };
  },

  async getRecords(table, filters = {}) {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    return { data, error };
  },

  // Storage helpers
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  async downloadFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  async getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { error };
  }
};

// Real-time subscription helper
export const createRealtimeSubscription = (table, callback, filters = {}) => {
  let subscription = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table,
        ...filters
      }, 
      callback
    )
    .subscribe();

  return subscription;
};

// Error handling helper
export const handleSupabaseError = (error) => {
  if (!error) return null;
  
  console.error('Supabase Error:', error);
  
  // Common error messages in Spanish
  const errorMessages = {
    'Invalid login credentials': 'Credenciales de acceso inválidas',
    'User already registered': 'El usuario ya está registrado',
    'Email not confirmed': 'Email no confirmado',
    'Invalid email': 'Email inválido',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Network request failed': 'Error de conexión. Verifica tu internet.',
    'Database error': 'Error en la base de datos',
    'Unauthorized': 'No autorizado',
    'Forbidden': 'Acceso denegado'
  };

  return errorMessages[error.message] || error.message || 'Ha ocurrido un error inesperado';
};
