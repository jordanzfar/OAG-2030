/* ARCHIVO: src/hooks/useSupabaseAuth.js (Versión Corregida) */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react'; // ✅ 1. Importa el hook correcto
import { useToast } from "@/components/ui/use-toast";

export const useSupabaseAuth = () => {
    // ✅ 2. Obtiene el cliente único del contexto que configuramos en main.jsx
    const supabase = useSupabaseClient();
    
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const { toast } = useToast();

    const loadUserProfile = useCallback(async (userId) => {
        if (!userId || !supabase) {
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
    }, [supabase]); // `supabase` es ahora una dependencia

    useEffect(() => {
        if (!supabase) return;

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
            (event, newSession) => {
                setSession(newSession);
                const currentUser = newSession?.user ?? null;
                setUser(currentUser);
                
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    loadUserProfile(currentUser.id);
                } else if (event === 'SIGNED_OUT') {
                    setUserProfile(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [supabase, loadUserProfile]);

    const signUp = useCallback(async (email, password, metadata = {}) => {
        if (!supabase) return { success: false, error: 'Supabase client not ready' };
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
        if (error) toast({ variant: "destructive", title: "Error de registro", description: error.message });
        else toast({ title: "Registro exitoso", description: "Por favor, revisa tu correo para confirmar." });
        return { success: !error, data, error };
    }, [supabase, toast]);

    const signIn = useCallback(async (email, password) => {
        if (!supabase) return { success: false, error: 'Supabase client not ready' };
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) toast({ variant: "destructive", title: "Error de inicio de sesión", description: error.message });
        return { success: !error, data, error };
    }, [supabase, toast]);

    const signOut = useCallback(async () => {
        if (!supabase) return { success: false, error: 'Supabase client not ready' };
        const { error } = await supabase.auth.signOut();
        if (error) toast({ variant: "destructive", title: "Error al cerrar sesión", description: error.message });
        else toast({ title: "Has cerrado sesión" });
        return { success: !error };
    }, [supabase, toast]);
    
    const updateProfile = useCallback(async (updates) => {
        if (!user || !supabase) return { success: false, error: 'No user or client ready' };
        try {
            const { data, error } = await supabase.from('users_profile').update(updates).eq('user_id', user.id).select().single();
            if (error) throw error;
            setUserProfile(data);
            toast({ title: "Perfil actualizado correctamente" });
            return { success: true, data };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al actualizar perfil", description: error.message });
            return { success: false, error };
        }
    }, [user, supabase, toast]);

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