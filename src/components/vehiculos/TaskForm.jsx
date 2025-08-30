
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TaskForm({ isOpen, onClose, vehiculo, vehiculos = [], task, onSave, users = [] }) {
  const isEditing = !!task;

  // Helper to get default data for a new task
  const getNewTaskDefaultData = () => ({
    vehiculo_id: "",
    numero_economico: "",
    vehiculo_placas: "", // Added: Field for vehicle license plates
    tipo_tarea: "mantenimiento",
    descripcion: "",
    prioridad: "media",
    fecha_programada: new Date().toISOString().split('T')[0], // Default to today's date
    estatus: "pendiente",
    costo_estimado: "",
    kilometraje_actual: "",
    asignado_a_id: "",
    asignado_a_nombre: ""
  });

  const [formData, setFormData] = useState(() => {
    // Initial state based on whether we're editing or creating
    if (isEditing) {
      return {
        ...task,
        costo_estimado: task.costo_estimado?.toString() || "",
        kilometraje_actual: task.kilometraje_actual?.toString() || ""
      };
    } else {
      const newData = getNewTaskDefaultData();
      if (vehiculo) {
        // If a vehicle is pre-selected, populate relevant fields
        newData.vehiculo_id = vehiculo.id;
        newData.numero_economico = vehiculo.numero_economico;
        newData.vehiculo_placas = vehiculo.placas; // Set placas from pre-selected vehicle
        newData.kilometraje_actual = vehiculo.kilometraje?.toString() || "";
      }
      return newData;
    }
  });

  useEffect(() => {
    // Effect to reset/update form data when dialog opens or task/vehicle changes
    if (isOpen) {
      if (task) {
        // When editing an existing task
        setFormData({
          ...task,
          costo_estimado: task.costo_estimado?.toString() || "",
          kilometraje_actual: task.kilometraje_actual?.toString() || ""
        });
      } else {
        // When creating a new task
        const newData = getNewTaskDefaultData();
        if (vehiculo) {
          newData.vehiculo_id = vehiculo.id;
          newData.numero_economico = vehiculo.numero_economico;
          newData.vehiculo_placas = vehiculo.placas; // Set placas from pre-selected vehicle
          newData.kilometraje_actual = vehiculo.kilometraje?.toString() || "";
        }
        setFormData(newData);
      }
    }
  }, [task, vehiculo, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };

    // Convert string inputs to numbers if they exist, otherwise remove them
    if (dataToSave.costo_estimado && dataToSave.costo_estimado.toString().trim()) {
      dataToSave.costo_estimado = parseFloat(dataToSave.costo_estimado);
    } else {
      delete dataToSave.costo_estimado;
    }
    
    if (dataToSave.kilometraje_actual && dataToSave.kilometraje_actual.toString().trim()) {
      dataToSave.kilometraje_actual = parseInt(dataToSave.kilometraje_actual);
    } else {
      delete dataToSave.kilometraje_actual;
    }
    
    // Auto-populate numero_economico and vehiculo_placas if vehiculo_id is selected and they are missing
    if (dataToSave.vehiculo_id) {
        const selectedVehiculo = vehiculos.find(v => v.id === dataToSave.vehiculo_id);
        if (selectedVehiculo) {
            if (!dataToSave.numero_economico) {
                dataToSave.numero_economico = selectedVehiculo.numero_economico;
            }
            if (!dataToSave.vehiculo_placas) {
                dataToSave.vehiculo_placas = selectedVehiculo.placas;
            }
        }
    }

    // Call onSave with the prepared data and task ID for update if editing
    onSave(dataToSave, task?.id);
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
            {task ? 'Editar Tarea de Vehículo' : 'Nueva Tarea de Vehículo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehiculo_id">Vehículo *</Label>
              <Select
                value={formData.vehiculo_id}
                onValueChange={(value) => {
                  const selectedVehicle = vehiculos.find(v => v.id === value);
                  setFormData({
                    ...formData,
                    vehiculo_id: value,
                    numero_economico: selectedVehicle ? selectedVehicle.numero_economico : "",
                    vehiculo_placas: selectedVehicle ? selectedVehicle.placas : "", // Update placas on vehicle selection
                    kilometraje_actual: selectedVehicle ? (selectedVehicle.kilometraje?.toString() || "") : ""
                  })
                }}
                disabled={isEditing || !!vehiculo} // Disable if editing or if vehicle is pre-selected
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo..." />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos?.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.placas || v.numero_economico} - {v.marca} {v.modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_tarea">Tipo de Tarea *</Label>
              <Select value={formData.tipo_tarea} onValueChange={(value) => setFormData({...formData, tipo_tarea: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="reparacion">Reparación</SelectItem>
                  <SelectItem value="inspeccion">Inspección</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
                  <SelectItem value="revision_tecnica">Revisión Técnica</SelectItem>
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
              <Label htmlFor="asignado_a_id">Asignar a Empleado</Label>
              <Select value={formData.asignado_a_id} onValueChange={handleUserChange}>
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
            <div>
              <Label htmlFor="costo_estimado">Costo Estimado</Label>
              <Input
                id="costo_estimado"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo_estimado}
                onChange={(e) => setFormData({...formData, costo_estimado: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="kilometraje_actual">Kilometraje Actual</Label>
              <Input
                id="kilometraje_actual"
                type="number"
                min="0"
                value={formData.kilometraje_actual}
                onChange={(e) => setFormData({...formData, kilometraje_actual: e.target.value})}
              />
            </div>
            {isEditing && ( // Only show status when editing an existing task
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
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              required
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Describe la tarea a realizar..."
            />
          </div>
          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? 'Actualizar Tarea' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
