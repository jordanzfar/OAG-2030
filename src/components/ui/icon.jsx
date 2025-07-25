import React from 'react';
import {
  Bell, X, Clock, Loader2, FileSearch2, FileMinus2, AlertTriangle, Landmark, DollarSign, PackageCheck, CheckCircle2, XCircle, FilePlus2, Gavel, TrendingDown, Trophy, ShieldOff, Search, UserPlus
} from 'lucide-react';

const iconMap = {
  bell: Bell,
  x: X,
  clock: Clock,
  'loader-2': Loader2,
  'file-search-2': FileSearch2,
  'file-minus-2': FileMinus2,
  'alert-triangle': AlertTriangle,
  landmark: Landmark,
  'dollar-sign': DollarSign,
  'package-check': PackageCheck,
  'check-circle-2': CheckCircle2,
  'x-circle': XCircle,
  'file-plus-2': FilePlus2,
  gavel: Gavel,
  'trending-down': TrendingDown,
  trophy: Trophy,
  'shield-off': ShieldOff,
  search: Search,
  'user-plus': UserPlus,
  default: Bell,
};

export const Icon = ({ name, className, ...props }) => {
  const LucideIcon = iconMap[name] || iconMap.default;
  return <LucideIcon className={className} {...props} />;
};