
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileStack, FileCheck2, MessageSquare, Banknote, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStatsCards = ({ stats, loading }) => {
  const statsConfig = [
    {
      title: "Total Usuarios",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Solicitudes Totales",
      value: stats?.totalRequests || 0,
      icon: FileStack,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      title: "Documentos Pendientes",
      value: stats?.pendingDocuments || 0,
      icon: FileCheck2,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
    },
    {
      title: "Mensajes Sin Leer",
      value: stats?.unreadMessages || 0,
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      title: "Depósitos Pendientes",
      value: stats?.pendingDeposits || 0,
      icon: Banknote,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      title: "Ingresos del Mes",
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-1"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`}></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.title === "Ingresos del Mes" ? "Depósitos confirmados" : "Total registrado"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
