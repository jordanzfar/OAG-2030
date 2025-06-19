import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, userProfile, isAuthenticated: supabaseAuth, loading: supabaseLoading } = useSupabaseAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sincroniza estado local con Supabase
  useEffect(() => {
    if (!supabaseLoading) {
      if (supabaseAuth && user) {
        setIsAuthenticated(true);
        const role = userProfile?.role || 'client';
        setUserRole(role);
        // Guardar persistencia en localStorage
        localStorage.setItem('auth', JSON.stringify({ 
          authenticated: true, 
          role,
          userId: user.id
        }));
      } else {
        // No autenticado en Supabase, limpiar estado y localStorage
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem('auth');
      }
      setIsLoading(false);
    }
  }, [supabaseAuth, user, userProfile, supabaseLoading]);

  // En carga inicial, intenta restaurar estado desde localStorage solo si no está autenticado en Supabase
  useEffect(() => {
    if (!supabaseLoading && !supabaseAuth) {
      try {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          const { authenticated, role } = JSON.parse(storedAuth);
          setIsAuthenticated(authenticated);
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error leyendo auth desde localStorage", error);
        localStorage.removeItem('auth');
      } finally {
        setIsLoading(false);
      }
    }
  }, [supabaseAuth, supabaseLoading]);

  // Login local: solo actualiza estado y localStorage
  // Si usas Supabase para login real, este método puede ser distinto o no usarse
  const login = useCallback((role, userId = null) => {
    try {
      localStorage.setItem('auth', JSON.stringify({ authenticated: true, role, userId }));
      setIsAuthenticated(true);
      setUserRole(role);
    } catch (error) {
      console.error("Error guardando estado auth en localStorage", error);
    }
  }, []);

  // Logout local: limpia estados y localStorage
  // El logout en Supabase debe llamarse externamente
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('auth');
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error("Error removiendo estado auth de localStorage", error);
    }
  }, []);

  const value = {
    isAuthenticated,
    userRole,
    isLoading: isLoading || supabaseLoading,
    user,
    userProfile,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
