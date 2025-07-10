import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast"; // Se importa para notificaciones

export const useSupabaseAuth = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const { toast } = useToast(); // Se inicializa el hook de notificaciones

    const loadUserProfile = useCallback(async (userId) => {
        if (!userId) {
            setUserProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('users_profile')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setUserProfile(data);
        } catch (error) {
            console.error('[loadUserProfile] ERROR:', error);
            setUserProfile(null);
        }
    }, []);

    useEffect(() => {
        const initializeSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser);
            
            if (currentUser) {
                await loadUserProfile(currentUser.id);
            }
            setLoading(false);
        };

        initializeSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);
                const currentUser = newSession?.user ?? null;
                setUser(currentUser);

                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    await loadUserProfile(currentUser.id);
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [loadUserProfile]);

    // 🔥 --- LÓGICA RESTAURADA --- 🔥
    // Se completa el contenido de las funciones de autenticación.

    const signUp = useCallback(async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
        if (error) toast({ variant: "destructive", title: "Error de registro", description: error.message });
        else toast({ title: "Registro exitoso", description: "Por favor, revisa tu correo para confirmar." });
        return { success: !error, data, error };
    }, [toast]);

    const signIn = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast({ variant: "destructive", title: "Error de inicio de sesión", description: error.message });
        return { success: !error, data, error };
    }, [toast]);

    const signOut = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) toast({ variant: "destructive", title: "Error al cerrar sesión", description: error.message });
        else toast({ title: "Has cerrado sesión" });
        return { success: !error };
    }, [toast]);
    
    const updateProfile = useCallback(async (updates) => {
        if (!user) return { success: false, error: 'No user logged in' };
        try {
            const { data, error } = await supabase.from('users_profile').update(updates).eq('user_id', user.id).select().single();
            if (error) throw error;
            setUserProfile(data); // Actualiza el perfil localmente
            toast({ title: "Perfil actualizado correctamente" });
            return { success: true, data };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al actualizar perfil", description: error.message });
            return { success: false, error };
        }
    }, [user, toast]);

    // El valor del contexto que se pasa a toda la aplicación.
    return useMemo(() => ({
        user,
        session,
        userProfile,
        loading,
        isAuthenticated: !!user,
        userRole: userProfile?.role || null,
        signUp,
        signIn,
        signOut,
        updateProfile,
    }), [user, session, userProfile, loading, signUp, signIn, signOut, updateProfile]);
};