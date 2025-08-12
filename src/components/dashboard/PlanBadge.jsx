import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Shield, User } from 'lucide-react'; // Se importa el ícono de Escudo

// Objeto actualizado con los nuevos estilos de degradado y efectos
const planDetails = {
  free: {
    name: 'Gratuito',
    icon: <User className="w-3 h-3 mr-1.5" />,
    className: 'bg-gray-100 text-gray-800 border-gray-300', // El plan gratuito se queda simple
  },
  explorador: {
    name: 'Explorador',
    icon: <Shield className="w-3 h-3 mr-1.5 fill-blue-300 text-blue-800" />,
    // Degradado azul con efectos de sombra y transición
    className: 'text-white border-transparent bg-gradient-to-r from-blue-500 to-blue-700 shadow-md hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300',
  },
  comercial: {
    name: 'Comercial',
    icon: <Shield className="w-3 h-3 mr-1.5 fill-purple-300 text-purple-800" />,
    // Degradado morado/índigo con efectos
    className: 'text-white border-transparent bg-gradient-to-r from-purple-500 to-indigo-700 shadow-md hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300',
  },
  socio_pro: {
    name: 'Socio PRO',
    icon: <Shield className="w-3 h-3 mr-1.5 fill-yellow-300 text-yellow-800" />,
    // Degradado dorado/naranja con efectos
    className: 'text-white border-transparent bg-gradient-to-r from-yellow-500 to-orange-600 shadow-md hover:shadow-yellow-500/40 hover:scale-105 transition-all duration-300',
  },
  default: {
    name: 'Plan',
    icon: <User className="w-3 h-3 mr-1.5" />,
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  }
};

const PlanBadge = ({ planId }) => {
  const details = planDetails[planId] || planDetails.default;

  return (
    <Badge className={`capitalize font-semibold text-xs py-1 px-2.5 ${details.className}`}>
      {details.icon}
      <span>{details.name}</span>
    </Badge>
  );
};

export default PlanBadge;