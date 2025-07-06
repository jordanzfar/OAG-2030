import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const { toast } = useToast();

  // ✅ CORRECCIÓN: Se usa useCallback para estabilizar la función y evitar re-renders innecesarios.
  const loadUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', userId)
        .single(); // ✅ Se usa .single() para obtener un solo objeto o null, es más limpio.

      if (error && error.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
        // Solo muestra error si no es porque el perfil aún no existe.
        console.error('Error loading user profile:', error);
        toast({
          variant: "destructive",
          title: "Error al cargar el perfil",
          description: error.message,
        });
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Catch Error loading user profile:', error);
    }
  }, [toast]); // Dependencia de toast para que no se queje el linter.

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  // ❌ ELIMINADO: La función createDefaultProfile se borró por completo.
  // El trigger de la base de datos se encarga de esto.

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
      // ✅ CORRECCIÓN: El signUp ahora solo se preocupa de registrar al usuario en `auth`.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error de registro",
          description: error.message,
        });
        return { success: false, error };
      }

      // ❌ ELIMINADO: La llamada a `createDefaultProfile` fue removida.
      // Esta era la línea que causaba el conflicto.

      toast({
        title: "Registro exitoso",
        description: "Por favor, revisa tu correo para verificar tu cuenta.",
      });
      
      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: error.message,
        });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error al cerrar sesión",
          description: error.message,
        });
        return { success: false, error };
      }

      // ✅ CORRECCIÓN: Se limpian los estados locales explícitamente.
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha actualizado correctamente.",
      });
      
      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al actualizar perfil",
        description: error.message,
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    userProfile,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    loadUserProfile
  };
};