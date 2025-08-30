import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TareaCliente } from "@/api/entities";
import { format } from "date-fns";

export default function CreateTaskFromChat({ isOpen, onClose, conversacion, onTaskCreated }) {
  const [formData, setFormData] = useState({
    tipo_tarea: "seguimiento",
    titulo: "",
    descripcion: "",
    prioridad: "media",
    fecha_programada: format(new Date(), 'yyyy-MM-dd'),
    asignado_a: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (conversacion) {
      // Pre-rellenar con información del contexto
      const ultimoMensaje = conversacion.ultimoMensaje;
      const clienteNombre = conversacion.cliente?.nombre_empresa || "Cliente Desconocido";
      
      setFormData(prev => ({
        ...prev,
        titulo: `Seguimiento WhatsApp - ${clienteNombre}`,
        descripcion: ultimoMensaje 
          ? `Tarea creada desde conversación de WhatsApp.\nÚltimo mensaje: "${ultimoMensaje.contenido}"`
          : "Tarea creada desde conversación de WhatsApp."
      }));
    }
  }, [conversacion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!conversacion) return;

    setIsCreating(true);
    try {
      await TareaCliente.create({
        ...formData,
        cliente_id: conversacion.cliente?.id || null,
        cliente_nombre: conversacion.cliente?.nombre_empresa || `WhatsApp ${conversacion.telefono}`,
        estatus: "pendiente"
      });

      onTaskCreated();
      onClose();
      
      // Reset form
      setFormData({
        tipo_tarea: "seguimiento",
        titulo: "",
        descripcion: "",
        prioridad: "media",
        fecha_programada: format(new Date(), 'yyyy-MM-dd'),
        asignado_a: ""
      });

    } catch (error) {
      console.error("Error creando tarea:", error);
      alert("Error al crear la tarea. Por favor intenta de nuevo.");
    }
    setIsCreating(false);
  };

  if (!conversacion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Crear Tarea desde WhatsApp
          </DialogTitle>
          <p className="text-slate-600">
            {conversacion.cliente 
              ? `Cliente: ${conversacion.cliente.nombre_empresa}`
              : `Número: ${conversacion.telefono} (Cliente Desconocido)`
            }
          </p>
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

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="asignado_a">Asignado a</Label>
              <Input
                id="asignado_a"
                value={formData.asignado_a}
                onChange={(e) => setFormData({...formData, asignado_a: e.target.value})}
                placeholder="Usuario responsable"
              />
            </div>
          </div>

          {conversacion.ultimoMensaje && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Contexto del último mensaje:</p>
              <p className="text-sm text-green-700 mt-1">
                "{conversacion.ultimoMensaje.contenido}"
              </p>
              <p className="text-xs text-green-600 mt-1">
                {conversacion.ultimoMensaje.direccion === 'entrante' ? 'Recibido' : 'Enviado'} • {format(new Date(conversacion.ultimoMensaje.created_date), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}