
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function RecentActivity({ facturas = [], contratos = [] }) {
  const activities = [
    ...facturas.slice(0, 3).map(factura => ({
      type: 'factura',
      title: `Factura ${factura.numero_factura}`,
      subtitle: factura.cliente_nombre,
      amount: `₡${factura.monto?.toLocaleString()}`,
      status: factura.estatus,
      date: factura.created_date
    })),
    ...contratos.slice(0, 2).map(contrato => ({
      type: 'contrato',
      title: `Contrato ${contrato.numero_contrato}`,
      subtitle: contrato.cliente_nombre,
      amount: `₡${contrato.renta_semanal?.toLocaleString()}/sem`,
      status: contrato.estatus,
      date: contrato.created_date
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const getStatusColor = (status) => {
    const colors = {
      activo: 'bg-emerald-100 text-emerald-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      pagada: 'bg-emerald-100 text-emerald-800',
      vencida: 'bg-red-100 text-red-800',
      finalizado: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getIcon = (type) => {
    return type === 'factura' ? DollarSign : FileText;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No hay actividad reciente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => {
              const Icon = getIcon(activity.type);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 truncate">{activity.title}</p>
                        <Badge variant="secondary" className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{activity.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{activity.amount}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
