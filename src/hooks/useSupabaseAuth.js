
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createDefaultProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .insert([
          {
            user_id: userId,
            full_name: '',
            phone: '',
            role: 'client',
            verification_status: 'pending',
            buying_power: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
        return null;
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error creating default profile:', error);
      return null;
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (data && data.length > 0) {
        setUserProfile(data[0]);
      } else {
        // If no profile exists, create a default one
        console.log('No profile found, creating default profile...');
        await createDefaultProfile(userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    setLoading(true);
    try {
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
        return { success: false, error: error.message };
      }

      // Create user profile automatically
      if (data.user) {
        await createDefaultProfile(data.user.id);
      }

      toast({
        title: "Registro exitoso",
        description: "Cuenta creada correctamente.",
      });
      
      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
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
        return { success: false, error: error.message };
      }

      setUserProfile(null);
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al actualizar perfil",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      setUserProfile(data);
      toast({
        title: "Perfil actualizado",
        description: "Tu perfil se ha actualizado correctamente.",
      });
      
      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
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
