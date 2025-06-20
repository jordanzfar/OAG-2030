import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// Se mantiene la creación de tu Context.
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Tu hook sigue siendo la fuente de datos principal. Esto está perfecto.
    const { user, userProfile, isAuthenticated: supabaseAuth, loading: supabaseLoading } = useSupabaseAuth();

    // Se mantienen tus variables de estado, pero ahora se alimentarán de una única fuente.
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- INICIO DE LA CORRECCIÓN ---
    // Hemos combinado tus dos useEffect en uno solo que es más robusto y elimina el conflicto.
    useEffect(() => {
        // Mientras Supabase está cargando, nosotros también estamos cargando.
        if (supabaseLoading) {
            setIsLoading(true);
            return;
        }

        // Una vez que Supabase termina de cargar, sincronizamos el estado.
        // Esta es ahora la ÚNICA fuente de verdad.
        if (supabaseAuth && user) {
            // Caso 1: El usuario está autenticado en Supabase.
            setIsAuthenticated(true);
            setUserRole(userProfile?.role || 'client');
        } else {
            // Caso 2: El usuario NO está autenticado en Supabase (sesión expirada, logout, etc.)
            setIsAuthenticated(false);
            setUserRole(null);
        }

        // Ya hemos terminado la sincronización, quitamos el estado de carga.
        setIsLoading(false);

        // Se ELIMINA toda la lógica de `localStorage.setItem` y `localStorage.getItem`.
        // Esta era la causa del bucle y Supabase ya lo maneja internamente.

    }, [supabaseAuth, user, userProfile, supabaseLoading]); // Este efecto se ejecuta cada vez que cambia el estado de Supabase.
    // --- FIN DE LA CORRECCIÓN ---


    // Se ELIMINAN las funciones `login` y `logout` que manipulaban localStorage.
    // El login (con supabase.auth.signInWith...) y logout (con supabase.auth.signOut())
    // deben llamarse desde los componentes, y este AuthProvider reaccionará automáticamente.


    // El valor que se provee al resto de la app.
    const value = {
        isAuthenticated,
        userRole,
        isLoading, // Usamos nuestro estado de carga local que está sincronizado con Supabase.
        user,
        userProfile,
        // Ya no se exportan login/logout locales.
    };

    // Renderizamos los hijos solo cuando la carga inicial ha terminado.
    // Esto es CRÍTICO para prevenir que las rutas protegidas se rendericen prematuramente.
    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

// Se mantiene tu hook para consumir el contexto. Esto está perfecto.
export const useAuth = () => {
    const context = useContext(AuthContext.Provider);
    if(context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}