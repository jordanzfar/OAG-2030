import React from 'react';
import { Clock, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'processing':
        return { label: 'En Proceso', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 };
      case 'completed':
        return { label: 'Completado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'failed':
        return { label: 'Error', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle };
      default:
        return { label: 'Desconocido', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Info };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  );
};

export default StatusBadge;
