
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function SolicitudRepuestoForm({ isOpen, onClose, vehiculo, tareas, users, onSave }) {
  const [formData, setFormData] = useState({
    nombre_repuesto: '',
    cantidad: 1,
    tarea_vehiculo_id: '',
    asignado_a_id: '',
    observaciones: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre_repuesto: '',
        cantidad: 1,
        tarea_vehiculo_id: '',
        asignado_a_id: '',
        observaciones: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const assignedUser = users.find(u => u.id === formData.asignado_a_id);
    onSave({
      ...formData,
      cantidad: Number(formData.cantidad),
      asignado_a_nombre: assignedUser ? assignedUser.full_name : ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Nueva Solicitud de Repuesto</DialogTitle>
          <p className="text-slate-500">Para el vehículo: {vehiculo?.placas || vehiculo?.numero_economico}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre_repuesto">Nombre del Repuesto *</Label>
            <Input
              id="nombre_repuesto"
              required
              value={formData.nombre_repuesto}
              onChange={(e) => setFormData({ ...formData, nombre_repuesto: e.target.value })}
              placeholder="Ej: Filtro de aceite"
            />
          </div>
          <div>
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              required
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="tarea_vehiculo_id">Tarea Asociada (Opcional)</Label>
            <Select
              value={formData.tarea_vehiculo_id}
              onValueChange={(value) => setFormData({ ...formData, tarea_vehiculo_id: value })}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar tarea..." /></SelectTrigger>
              <SelectContent>
                {tareas.map(tarea => (
                  <SelectItem key={tarea.id} value={tarea.id}>
                    {tarea.tipo_tarea.replace(/_/g, ' ')} - {tarea.descripcion.substring(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="asignado_a_id">Asignar a (Encargado de Compras)</Label>
            <Select
              value={formData.asignado_a_id}
              onValueChange={(value) => setFormData({ ...formData, asignado_a_id: value })}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea 
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Añadir detalles importantes..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Crear Solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
