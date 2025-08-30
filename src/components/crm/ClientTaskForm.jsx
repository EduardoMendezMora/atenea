
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function ClientTaskForm({ isOpen, onClose, task, onSave, users = [] }) {
  const [formData, setFormData] = useState({
    tipo_tarea: "seguimiento",
    titulo: "",
    descripcion: "",
    prioridad: "media",
    fecha_programada: format(new Date(), 'yyyy-MM-dd'),
    estatus: "pendiente",
    asignado_a_id: "",
    asignado_a_nombre: "",
    resultado: "",
    proxima_accion: ""
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        fecha_programada: task.fecha_programada || format(new Date(), 'yyyy-MM-dd'),
        fecha_completada: task.fecha_completada || "",
        asignado_a_id: task.asignado_a_id || "", // Ensure these new fields are set from task
        asignado_a_nombre: task.asignado_a_nombre || "", // Ensure these new fields are set from task
      });
    } else {
      setFormData({
        tipo_tarea: "seguimiento",
        titulo: "",
        descripcion: "",
        prioridad: "media",
        fecha_programada: format(new Date(), 'yyyy-MM-dd'),
        estatus: "pendiente",
        asignado_a_id: "",
        asignado_a_nombre: "",
        resultado: "",
        proxima_accion: ""
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    // Si se marca como completada, agregar fecha
    if (dataToSave.estatus === 'completada' && !dataToSave.fecha_completada) {
      dataToSave.fecha_completada = format(new Date(), 'yyyy-MM-dd');
    }
    
    onSave(dataToSave);
  };
  
  const handleUserChange = (userId) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData({
      ...formData,
      asignado_a_id: selectedUser?.id || "",
      asignado_a_nombre: selectedUser?.full_name || ""
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? 'Editar Tarea de Cliente' : 'Nueva Tarea de Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_tarea">Tipo de Tarea *</Label>
              <Select value={formData.tipo_tarea} onValueChange={(value) => setFormData({...formData, tipo_tarea: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="reunion">Reunión</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="cotizacion">Cotización</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                  <SelectItem value="negociacion">Negociación</SelectItem>
                  <SelectItem value="soporte">Soporte</SelectItem>
                  <SelectItem value="cobranza">Cobranza</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prioridad">Prioridad *</Label>
              <Select value={formData.prioridad} onValueChange={(value) => setFormData({...formData, prioridad: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fecha_programada">Fecha Programada *</Label>
              <Input
                id="fecha_programada"
                type="date"
                required
                value={formData.fecha_programada}
                onChange={(e) => setFormData({...formData, fecha_programada: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="asignado_a_id">Asignado a *</Label>
              <Select value={formData.asignado_a_id} onValueChange={handleUserChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {task && (
              <div>
                <Label htmlFor="estatus">Estatus</Label>
                <Select value={formData.estatus} onValueChange={(value) => setFormData({...formData, estatus: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              required
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            />
          </div>
          {task && formData.estatus === 'completada' && (
            <>
              <div>
                <Label htmlFor="resultado">Resultado</Label>
                <Textarea
                  id="resultado"
                  rows={2}
                  value={formData.resultado}
                  onChange={(e) => setFormData({...formData, resultado: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="proxima_accion">Próxima Acción</Label>
                <Textarea
                  id="proxima_accion"
                  rows={2}
                  value={formData.proxima_accion}
                  onChange={(e) => setFormData({...formData, proxima_accion: e.target.value})}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {task ? 'Actualizar' : 'Crear'} Tarea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
