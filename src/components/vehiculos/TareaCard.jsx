
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function TareaCard({ tarea, onEdit, onDelete, onComment }) {

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
      case 'urgente':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'baja':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="hover:bg-slate-50 transition-colors duration-200">
      <CardContent className="p-4 flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <p className="font-bold text-slate-800">{tarea.descripcion}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={getStatusColor(tarea.estatus)}>{tarea.estatus?.replace('_', ' ')}</Badge>
            <Badge variant="outline" className={getPriorityColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
            <Badge variant="secondary">{tarea.tipo_tarea?.replace('_', ' ')}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Programada para: <span className="font-medium">{tarea.fecha_programada ? format(new Date(tarea.fecha_programada + 'T00:00:00'), 'dd/MM/yyyy') : 'N/A'}</span>
          </p>
          {tarea.asignado_a_nombre && (
            <p className="text-sm text-slate-500">
              Asignado a: <span className="font-medium">{tarea.asignado_a_nombre}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-1">
          <Button variant="ghost" size="icon" title="Comentarios" onClick={() => onComment(tarea)}>
            <MessageSquare className="w-4 h-4 text-slate-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(tarea)}>
            <Edit className="w-4 h-4 text-slate-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Eliminar" onClick={() => onDelete(tarea.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
