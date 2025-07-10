// RUTA: src/providers/AuthProvider.jsx

import React from 'react';
import { AuthContext } from '@/context/AuthContext';      // ✅ Paso 1: Importa el contexto PÚBLICO
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';  // ✅ Paso 2: Importa la lógica de Supabase
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// Este componente ya no define su propio contexto ni su propio hook.
// Su única responsabilidad es ser el "Proveedor".
const AuthProvider = ({ children }) => {
    // Obtiene todos los datos del hook de lógica.
    const authData = useSupabaseAuth();

    // Muestra la pantalla de carga si es necesario.
    if (authData.loading) {
        return <FullScreenLoader />;
    }

    // Provee el valor (authData) al resto de la aplicación usando el contexto importado.
    return (
        <AuthContext.Provider value={authData}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;