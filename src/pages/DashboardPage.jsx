import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileBadge, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BuyingPowerWidget from '@/components/dashboard/BuyingPowerWidget';
import { supabase } from '@/lib/supabase';
import VerificationBadge from '@/components/dashboard/VerificationBadge';

const DashboardPage = () => {
    const { user, userRole, userProfile } = useAuth();
    
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isVerified = userProfile?.verification_status === 'verified';

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_client_dashboard_stats', {
                    p_user_id: user.id
                });
                if (rpcError) throw rpcError;

                const clientStats = [
                    { title: "Inspecciones Activas", value: data.active_inspections, icon: Activity, color: "text-blue-400", link: "/dashboard/inspections" },
                    { title: "Legalizaciones en Proceso", value: data.processing_legalizations, icon: FileBadge, color: "text-green-400", link: "/dashboard/legalization" },
                    { title: "Documentos Pendientes", value: data.pending_documents, icon: FileText, color: "text-yellow-400", link: "/dashboard/documents" },
                    { title: "Mensajes Nuevos", value: data.new_messages, icon: MessageSquare, color: "text-purple-400", link: "/dashboard/chat" },
                ];
                setStats(clientStats);
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError("No se pudieron cargar las estadísticas.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user]);

    if (userRole && userRole !== 'client') {
        return <p className="text-destructive">Acceso no autorizado.</p>;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando tu panel...</p>
            </div>
        );
    }
    
    if (error) {
        return <p className="text-destructive">{error}</p>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">Panel del Cliente</h1>
                    {isVerified && <VerificationBadge isVerified={true} />}
                </div>
                <p className="text-muted-foreground mt-1">Bienvenido a tu panel personal de Opulent Auto Gallery.</p>
            </div>
            
            {/* Widget de Buying Power ocupando todo el ancho */}
            <div className="w-full"> 
                <BuyingPowerWidget />
            </div>

            {/* Contenedor para los widgets de estadísticas */}
            {stats && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"> {/* Ajustado a 4 columnas en pantallas grandes */}
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                        >
                            <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow h-full flex flex-col justify-between">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                    {stat.link && (
                                        <Button variant="link" size="sm" className="p-0 h-auto text-primary text-xs mt-2" asChild>
                                            <Link to={stat.link}>Ver detalles</Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-foreground">Mis Solicitudes Recientes</CardTitle>
                    <CardDescription className="text-muted-foreground">Últimas actualizaciones de tus servicios.</CardDescription>
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