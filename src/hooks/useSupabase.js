
import { useState, useEffect } from 'react';
import { supabase, supabaseHelpers, handleSupabaseError } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// Custom hook for Supabase operations
export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabaseHelpers.getCurrentSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          toast({
            title: "Sesión iniciada",
            description: "Has iniciado sesión correctamente.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión correctamente.",
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  // Authentication methods
  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHelpers.signUp(email, password, metadata);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error de registro",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Registro exitoso",
        description: "Cuenta creada correctamente. Revisa tu email para confirmar.",
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHelpers.signIn(email, password);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabaseHelpers.signOut();
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al cerrar sesión",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Database operations
  const createRecord = async (table, data) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabaseHelpers.insertRecord(table, data);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al crear registro",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Registro creado",
        description: "El registro se ha creado correctamente.",
      });
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (table, id, data) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabaseHelpers.updateRecord(table, id, data);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al actualizar registro",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Registro actualizado",
        description: "El registro se ha actualizado correctamente.",
      });
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (table, id) => {
    setLoading(true);
    try {
      const { error } = await supabaseHelpers.deleteRecord(table, id);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al eliminar registro",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Registro eliminado",
        description: "El registro se ha eliminado correctamente.",
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (table, filters = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHelpers.getRecords(table, filters);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al obtener registros",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // File operations
  const uploadFile = async (bucket, path, file) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHelpers.uploadFile(bucket, path, file);
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast({
          variant: "destructive",
          title: "Error al subir archivo",
          description: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente.",
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleSupabaseError(error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    user,
    session,
    isAuthenticated: !!user,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    
    // Database methods
    createRecord,
    updateRecord,
    deleteRecord,
    fetchRecords,
    
    // File methods
    uploadFile,
    
    // Direct access to supabase client
    supabase,
    supabaseHelpers
  };
};

// Hook for real-time subscriptions
export const useRealtimeSubscription = (table, callback, filters = {}) => {
  useEffect(() => {
    const subscription = supabase
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

    return () => {
      subscription.unsubscribe();
    };
  }, [table, callback, filters]);
};
