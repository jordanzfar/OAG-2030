import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FileBadge, FileText, MessageSquare, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BuyingPowerWidget from '@/components/dashboard/BuyingPowerWidget';

const DashboardPage = () => {
    const { userRole } = useAuth();

    if (userRole && userRole !== 'client') {
        return <p className="text-destructive">Acceso no autorizado.</p>;
    }

    const clientStats = [
        { title: "Inspecciones Activas", value: "2", icon: Activity, color: "text-blue-400", link: "/dashboard/inspections" },
        { title: "Legalizaciones en Proceso", value: "1", icon: FileBadge, color: "text-green-400", link: "/dashboard/legalization" },
        { title: "Documentos Pendientes", value: "3", icon: FileText, color: "text-yellow-400", link: "/dashboard/documents" },
        { title: "Mensajes Nuevos", value: "1", icon: MessageSquare, color: "text-purple-400", link: "/dashboard/chat" },
    ];

    const stats = clientStats;

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

            {/* Grid simétrico con el widget de poder de compra */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Widget de Poder de Compra - ocupa 2 columnas en lg */}
                <div className="md:col-span-2">
                    <BuyingPowerWidget />
                </div>
                
                {/* Primeras dos estadísticas */}
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
                
                {/* Espacios vacíos para mantener la simetría */}
                <div></div>
                <div></div>
            </div>

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
                      Estado de tu última inspección, pago realizado, etc. (Contenido dinámico próximamente)
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