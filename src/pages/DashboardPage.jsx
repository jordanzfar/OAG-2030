import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FileBadge, FileText, MessageSquare, Loader2 } from 'lucide-react'; // Importa Loader2 para el spinner
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BuyingPowerWidget from '@/components/dashboard/BuyingPowerWidget';
import { supabase } from '@/lib/supabase'; // Asegúrate que la ruta a tu cliente Supabase sea correcta

const DashboardPage = () => {
    // Asumimos que useAuth devuelve el objeto 'user' completo y el 'userRole'
    const { user, userRole } = useAuth();
    
    // Estados para manejar los datos, la carga y los errores
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Función asíncrona para obtener los datos del dashboard
        const fetchDashboardData = async () => {
            // No hacer nada si no hay un usuario logueado
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // 1. Llamada a la función RPC de Supabase que creamos
                const { data, error: rpcError } = await supabase.rpc('get_client_dashboard_stats', {
                    p_user_id: user.id
                });

                if (rpcError) {
                    throw rpcError;
                }

                // 2. Mapeamos la respuesta del RPC a la estructura que el UI espera
                const clientStats = [
                    { title: "Inspecciones Activas", value: data.active_inspections, icon: Activity, color: "text-blue-400", link: "/dashboard/inspections" },
                    { title: "Legalizaciones en Proceso", value: data.processing_legalizations, icon: FileBadge, color: "text-green-400", link: "/dashboard/legalization" },
                    { title: "Documentos Pendientes", value: data.pending_documents, icon: FileText, color: "text-yellow-400", link: "/dashboard/documents" },
                    { title: "Mensajes Nuevos", value: data.new_messages, icon: MessageSquare, color: "text-purple-400", link: "/dashboard/chat" },
                ];
                
                setStats(clientStats);

            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("No se pudieron cargar las estadísticas. Inténtalo de nuevo más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]); // El efecto se ejecuta solo cuando el objeto 'user' cambia

    // ---- Renderizado condicional ----

    // Renderiza un mensaje si el rol no es el correcto
    if (userRole && userRole !== 'client') {
        return <p className="text-destructive">Acceso no autorizado.</p>;
    }

    // 3. Muestra un indicador de carga mientras se obtienen los datos
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando tu panel...</p>
            </div>
        );
    }
    
    // Muestra un mensaje de error si la llamada a la API falló
    if (error) {
        return <p className="text-destructive">{error}</p>;
    }

    // ---- Renderizado del Dashboard ----

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <h1 className="text-3xl font-bold text-foreground">
                Panel del Cliente
            </h1>
            <p className="text-muted-foreground">Bienvenido a tu panel personal de Opulent Auto Gallery.</p>
            
            {/* Solo renderiza las estadísticas si existen */}
            {stats && (
                <>
                    {/* Grid simétrico con el widget de poder de compra */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="md:col-span-2">
                            <BuyingPowerWidget />
                        </div>
                        
                        {stats.slice(0, 2).map((stat, index) => (
                             <motion.div
                                 key={index}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.3, delay: index * 0.1 }}
                             >
                                 <Card className="bg-card border-border shadow-lg hover:shadow-primary/20 transition-shadow h-full">
                                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                         <CardTitle className="text-sm font-medium text-muted-foreground">
                                             {stat.title}
                                         </CardTitle>
                                         <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                     </CardHeader>
                                     <CardContent>
                                         <div className="text-xl font-bold text-foreground mb-1">{stat.value}</div>
                                         {stat.link && (
                                             <Button variant="link" size="sm" className="p-0 h-auto text-primary text-xs" asChild>
                                                 <Link to={stat.link}>Ver detalles</Link>
                                             </Button>
                                         )}
                                     </CardContent>
                                 </Card>
                             </motion.div>
                        ))}
                    </div>

                    {/* Segunda fila - estadísticas restantes */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.slice(2).map((stat, index) => (
                             <motion.div
                                 key={index + 2}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.3, delay: (index + 2) * 0.1 }}
                             >
                             <Card className="bg-card border-border shadow-lg hover:shadow-primary/20 transition-shadow flex flex-col h-full">
                                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                     <CardTitle className="text-sm font-medium text-muted-foreground">
                                         {stat.title}
                                     </CardTitle>
                                     <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                 </CardHeader>
                                 <CardContent className="flex-grow flex flex-col justify-between">
                                     <div className="text-2xl font-bold text-foreground mb-2">{stat.value}</div>
                                     {stat.link && (
                                         <Button variant="link" size="sm" className="p-0 h-auto self-start text-primary" asChild>
                                             <Link to={stat.link}>Ver detalles</Link>
                                         </Button>
                                     )}
                                 </CardContent>
                             </Card>
                             </motion.div>
                        ))}
                        
                        <div />
                        <div />
                    </div>
                </>
            )}

            {/* Sección de Acciones Rápidas o Resumen */}
            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-foreground">
                        Mis Solicitudes Recientes
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Últimas actualizaciones de tus servicios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">
                        (Próximamente verás aquí un resumen de tus actividades más recientes)
                    </p>
                    <Button className="mt-4" asChild>
                        <Link to="/dashboard/inspections">Solicitar Nueva Inspección</Link>
                    </Button>
                </CardContent>
            </Card>

        </motion.div>
    );
};

export default DashboardPage;