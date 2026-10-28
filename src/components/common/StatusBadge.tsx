import React from 'react';
import { OrderStatus } from '../../types';
import {
  Clock,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Truck,
  PackageCheck,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'pending_contact':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {showIcon && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          Pendiente de contacto
        </span>
      );
    case 'contacted':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
          {showIcon && <MessageSquare className="w-3.5 h-3.5 text-sky-600" />}
          Contactado
        </span>
      );
    case 'confirmed_by_vendor':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          Confirmado por vendedor
        </span>
      );
    case 'in_preparation':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          {showIcon && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
          En preparación
        </span>
      );
    case 'on_the_way':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          {showIcon && <Truck className="w-3.5 h-3.5 text-indigo-600" />}
          En camino
        </span>
      );
    case 'delivered':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          {showIcon && <PackageCheck className="w-3.5 h-3.5 text-teal-600" />}
          Entregado
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          Cancelado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {status}
        </span>
      );
  }
};
