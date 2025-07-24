import React from 'react';
import {
  CheckCircle2, CalendarClock, Hourglass, PauseCircle, XCircle, HelpCircle,
  RefreshCw, Award, TrendingDown, ThumbsUp, CircleDollarSign, BadgeCheck, FileSearch,
  FileWarning, AlertCircle, CreditCard, Zap // ✅ Se añade el icono 'Zap'
} from 'lucide-react';

const statusConfig = {
  // --- ESTADOS DE POWER BUYING ---
  active: { text: 'Activo', icon: <Zap className="h-3.5 w-3.5" />, className: 'bg-teal-100 text-teal-800' },
  
  // --- ESTADOS DE LEGALIZACIONES ---
  pending: { text: 'Pendiente', icon: <Hourglass className="h-3.5 w-3.5" />, className: 'bg-yellow-100 text-yellow-800' },
  missing_documents: { text: 'Documentos Faltantes', icon: <FileWarning className="h-3.5 w-3.5" />, className: 'bg-orange-100 text-orange-800' },
  missing_information: { text: 'Información Faltante', icon: <AlertCircle className="h-3.5 w-3.5" />, className: 'bg-orange-100 text-orange-800' },
  deposit_required: { text: 'Depósito Requerido', icon: <CircleDollarSign className="h-3.5 w-3.5" />, className: 'bg-blue-100 text-blue-800' },
  processing: { text: 'Procesando', icon: <RefreshCw className="h-3.5 w-3.5" />, className: 'bg-blue-100 text-blue-800' },
  final_payment_required: { text: 'Pago Final Requerido', icon: <CreditCard className="h-3.5 w-3.5" />, className: 'bg-blue-100 text-blue-800' },
  completed: { text: 'Completado', icon: <BadgeCheck className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-800' },
  
  // Otros estados
  approved: { text: 'Aprobada', icon: <ThumbsUp className="h-3.5 w-3.5" />, className: 'bg-cyan-100 text-cyan-800' },
  rejected: { text: 'Rechazado', icon: <XCircle className="h-3.5 w-3.5" />, className: 'bg-red-100 text-red-800' },
  in_review: { text: 'En Revisión', icon: <FileSearch className="h-3.5 w-3.5" />, className: 'bg-purple-100 text-purple-800' },
  won: { text: 'Ganada', icon: <Award className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-800' },
  lost: { text: 'Perdida', icon: <TrendingDown className="h-3.5 w-3.5" />, className: 'bg-red-100 text-red-800' },
  
  // Fallback
  default: { text: 'Desconocido', icon: <HelpCircle className="h-3.5 w-3.5" />, className: 'bg-gray-100 text-gray-700' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.default;
  return (
    <div className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};