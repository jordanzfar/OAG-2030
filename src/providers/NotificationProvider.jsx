import { NotificationContext } from '@/context/NotificationContext';
// Importa cualquier lógica/hooks necesarios para el proveedor
// ...

const NotificationProvider = ({ children }) => {
    // ... toda la lógica de tu proveedor (useState, useEffect, etc.) ...
    
    const value = { /* ... todos los valores que tu contexto provee ... */ };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;