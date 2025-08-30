
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Edit, MoreVertical, Eye, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function VehicleCard({ vehiculo, onEdit, onViewDetails, onAddTask, index = 0 }) {
  const getStatusColor = (status) => {
    const colors = {
      disponible: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      colocado: 'bg-blue-100 text-blue-800 border-blue-200',
      en_taller: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      fuera_servicio: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getTipoColor = (tipo) => {
    const colors = {
      camion: 'bg-blue-100 text-blue-800',
      montacargas: 'bg-purple-100 text-purple-800',
      excavadora: 'bg-orange-100 text-orange-800',
      otro: 'bg-slate-100 text-slate-800'
    };
    return colors[tipo] || 'bg-slate-100 text-slate-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="cursor-pointer"
      onClick={onViewDetails}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-300 bg-white">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                  {vehiculo.placas || vehiculo.numero_economico}
                </CardTitle>
                <p className="text-sm text-slate-600">{vehiculo.marca} {vehiculo.modelo} {vehiculo.año}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-2" /> Ver Detalles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(vehiculo)}>
                  <Edit className="w-4 h-4 mr-2" /> Edición Rápida
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddTask(vehiculo)}>
                  <Calendar className="w-4 h-4 mr-2" /> Crear Tarea
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getStatusColor(vehiculo.estatus)}>
                {vehiculo.estatus?.replace('_', ' ') || 'Sin estatus'}
              </Badge>
              <Badge className={getTipoColor(vehiculo.carroceria)}>
                {vehiculo.carroceria || 'Sin carrocería'}
              </Badge>
            </div>

            {vehiculo.placas && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Placas</p>
                <p className="font-semibold text-slate-900">{vehiculo.placas}</p>
              </div>
            )}
            
            {vehiculo.cliente_actual && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Cliente Actual</p>
                <p className="font-semibold text-blue-600">{vehiculo.cliente_actual}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
