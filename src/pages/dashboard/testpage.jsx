// src/pages/dashboard/TestPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'; // Usamos el cliente de Supabase directamente
import { Loader2 } from 'lucide-react';

const TestPage = () => {
    const { user } = useAuth();
    
    // El estado de los datos empieza en `null` para controlar la carga.
    const [testData, setTestData] = useState(null); 

    useEffect(() => {
        // Este console.log es para ver cuándo se dispara el efecto.
        console.log("TEST_PAGE: useEffect se ha disparado. El estado del usuario es:", user);

        const fetchData = async () => {
            // Si no hay usuario, ponemos un array vacío para indicar que la carga terminó.
            if (!user) {
                console.log("TEST_PAGE: No hay usuario, deteniendo carga.");
                setTestData([]); 
                return;
            }
            
            console.log("TEST_PAGE: Usuario encontrado. Empezando a cargar datos de 'deposits'...");
            const { data, error } = await supabase
                .from('deposits') // Usa una tabla simple que sepas que tiene datos
                .select('id, created_at, amount') // Pide solo algunos campos
                .eq('user_id', user.id)
                .limit(5);

            if (error) {
                console.error("TEST_PAGE: Error al cargar datos de prueba:", error);
                setTestData([]); // Ponemos un array vacío para detener la carga en caso de error.
            } else {
                console.log("TEST_PAGE: Datos cargados exitosamente.", data);
                setTestData(data || []);
            }
        };

        fetchData();

    }, [user]); // El efecto SOLO depende del objeto `user`.

    // La condición para mostrar el spinner es si los datos son `null`.
    if (testData === null) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando Página de Prueba...</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-card rounded-lg border">
            <h1 className="text-3xl font-bold">Página de Prueba</h1>
            <p className="text-muted-foreground mb-4">Este componente sirve para aislar el problema de la carga infinita.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-2">Resultados</h2>
            <p>Estado de la carga: **Carga completada.**</p>
            <p>Registros encontrados: <strong>{testData.length}</strong></p>
            
            <h3 className="text-lg font-semibold mt-4">Datos Crudos:</h3>
            <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                {JSON.stringify(testData, null, 2)}
            </pre>
        </div>
    );
};

export default TestPage;