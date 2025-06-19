
import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const VerificationBadge = ({ isVerified = false, className = "" }) => {
  if (!isVerified) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg ${className}`}
    >
      <Shield className="w-3 h-3 mr-1" />
      <span>Perfil Verificado</span>
      <CheckCircle className="w-3 h-3 ml-1" />
    </motion.div>
  );
};

export default VerificationBadge;
