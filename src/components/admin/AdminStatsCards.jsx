import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileStack, FileCheck2, MessageSquare, Banknote } from 'lucide-react'; // Eliminado 'TrendingUp' que ya no se usa
import { motion } from 'framer-motion';

const AdminStatsCards = ({ stats, loading }) => {
    const statsConfig = [
        {
            title: "Total Usuarios",
            value: stats?.totalUsers || 0,
            icon: Users,
            borderColor: "#3b82f6", // Azul Zafiro
        },
        {
            title: "Solicitudes Pendientes",
            value: stats?.pendingRequests || 0,
            icon: FileStack,
            borderColor: "#f59e0b", // Ámbar
        },
        {
            title: "Documentos Pendientes",
            value: stats?.pendingDocuments || 0,
            icon: FileCheck2,
            borderColor: "#eab308", // Amarillo Oro
        },
        {
            title: "Mensajes Sin Leer",
            value: stats?.unreadMessages || 0,
            icon: MessageSquare,
            borderColor: "#a855f7", // Púrpura Amatista
        },
        {
            title: "Depósitos Pendientes",
            value: stats?.pendingDeposits || 0,
            icon: Banknote,
            borderColor: "#f97316", // Naranja Cobre
        },
        // --- SE HA ELIMINADO LA TARJETA "INGRESOS DEL MES" DE AQUÍ ---
    ];

    if (loading) {
        return (
            // Mostramos 5 esqueletos de carga en lugar de 6
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index} className="bg-card border-border animate-pulse h-32">
                        <CardContent className="pt-6">
                           <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                           <div className="h-4 bg-muted rounded w-2/3"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        // El grid ahora se ajustará para 5 elementos, lo que puede ser visualmente mejor
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statsConfig.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
                >
                    <Card 
                        className="bg-card border-border shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                        style={{ borderLeftWidth: '4px', borderLeftColor: stat.borderColor }}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon 
                                className="h-5 w-5 text-muted-foreground" 
                            />
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-end">
                            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default AdminStatsCards;