import React, { createContext, useContext, useMemo } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const authData = useSupabaseAuth();

    // ✅ LA CORRECCIÓN: Usamos useMemo para estabilizar el objeto 'value'.
    // Ahora solo se creará un nuevo objeto si 'authData' cambia,
    // rompiendo el bucle de renderizado infinito.
    const value = useMemo(() => ({
        isLoading: authData.loading,
        isAuthenticated: authData.isAuthenticated,
        user: authData.user,
        userProfile: authData.userProfile,
        userRole: authData.userRole,
        signUp: authData.signUp,
        signIn: authData.signIn,
        signOut: authData.signOut,
        updateProfile: authData.updateProfile,
    }), [authData]);

    // Esta lógica para prevenir el renderizado durante la carga inicial es correcta.
    return (
        <AuthContext.Provider value={value}>
            {!value.isLoading && children}
        </AuthContext.Provider>
    );
};

// Tu hook para consumir el contexto se mantiene igual.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};