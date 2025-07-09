import { useState, useEffect, useCallback, useMemo } from 'react'; // 1. Importa useMemo
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseAuth = () => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const { toast } = useToast();

    // Función para cargar el perfil del usuario, memoizada con useCallback.
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

            // Ignora el error cuando el perfil simplemente no existe todavía.
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            setUserProfile(data);
        } catch (error) {
            console.error('Error crítico al cargar el perfil de usuario:', error);
            setUserProfile(null); // Asegura que el perfil esté nulo si hay un error.
        }
    }, []);

    // Efecto principal que maneja el ciclo de vida de la autenticación.
    useEffect(() => {
        let isMounted = true;

        const initializeSession = async () => {
            try {
                // 1. Obtiene la sesión inicial al cargar la app.
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                
                if (isMounted) {
                    const currentUser = initialSession?.user ?? null;
                    setSession(initialSession);
                    setUser(currentUser);
                    if (currentUser) {
                        await loadUserProfile(currentUser.id);
                    }
                }
            } catch (e) {
                console.error("Error al inicializar la sesión:", e);
            } finally {
                // 2. CRÍTICO: Asegura que el estado de carga siempre se desactive.
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initializeSession();

        // 3. Escucha todos los cambios en el estado de autenticación.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (!isMounted) return;

                const currentUser = newSession?.user ?? null;
                setSession(newSession);
                setUser(currentUser);
                
                // Si el usuario se desloguea, limpia el perfil. Si no, lo carga.
                if (currentUser) {
                    await loadUserProfile(currentUser.id);
                } else {
                    setUserProfile(null);
                }
                
                // Un cambio de estado de auth significa que la carga ha terminado.
                setLoading(false);
            }
        );

        // 4. Limpia la suscripción cuando el componente se desmonta.
        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [loadUserProfile]);

    
    // --- FUNCIONES DE AUTENTICACIÓN Y PERFIL ---
    // Estas funciones inician una acción; el `useEffect` de arriba reaccionará a los cambios.

    const signUp = async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
        if (error) {
            toast({ variant: "destructive", title: "Error de registro", description: error.message });
            return { success: false, error };
        }
        toast({ title: "Registro exitoso", description: "Por favor, revisa tu correo para verificar tu cuenta." });
        return { success: true, data };
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast({ variant: "destructive", title: "Error de inicio de sesión", description: error.message });
            return { success: false, error };
        }
        return { success: true, data };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({ variant: "destructive", title: "Error al cerrar sesión", description: error.message });
            return { success: false, error };
        }
        // El estado se limpiará automáticamente por el listener onAuthStateChange.
        return { success: true };
    };

     const updateProfile = useCallback(async (updates) => {
        if (!user) return { success: false, error: 'No user logged in' };
        try {
            const { data, error } = await supabase.from('users_profile').update(updates).eq('user_id', user.id).select().single();
            if (error) throw error;
            setUserProfile(data);
            toast({ title: "Perfil actualizado" });
            return { success: true, data };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al actualizar perfil", description: error.message });
            return { success: false, error };
        }
    }, [user, toast]);

    // ✅ CORRECCIÓN 2 (LA MÁS IMPORTANTE): Estabilizamos el objeto de retorno.
    // Este objeto solo se volverá a crear si alguna de sus dependencias cambia.
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