// Este archivo solo define y exporta el hook para consumir el contexto.
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext'; // Importa el contexto del archivo anterior.

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};