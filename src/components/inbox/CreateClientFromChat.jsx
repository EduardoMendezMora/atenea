import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cliente } from "@/api/entities";
import { MensajeWhatsapp } from "@/api/entities";

export default function CreateClientFromChat({ isOpen, onClose, conversacion, onClientCreated }) {
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    rfc: "",
    contacto_principal: "",
    telefono: conversacion?.telefono || "",
    email: "",
    direccion: "",
    tipo_cliente: "individual",
    estatus: "activo"
  });
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (conversacion) {
      setFormData(prev => ({
        ...prev,
        telefono: conversacion.telefono
      }));
    }
  }, [conversacion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!conversacion) return;

    setIsCreating(true);
    try {
      // Crear el cliente
      const nuevoCliente = await Cliente.create(formData);

      // Actualizar todos los mensajes existentes para asociarlos con el nuevo cliente
      const mensajesDeEstaConversacion = conversacion.mensajes;
      
      for (const mensaje of mensajesDeEstaConversacion) {
        await MensajeWhatsapp.update(mensaje.id, {
          ...mensaje,
          cliente_id: nuevoCliente.id,
          cliente_nombre: nuevoCliente.nombre_empresa
        });
      }

      onClientCreated();
      onClose();
      
      // Reset form
      setFormData({
        nombre_empresa: "",
        rfc: "",
        contacto_principal: "",
        telefono: "",
        email: "",
        direccion: "",
        tipo_cliente: "individual",
        estatus: "activo"
      });

    } catch (error) {
      console.error("Error creando cliente:", error);
      alert("Error al crear el cliente. Por favor intenta de nuevo.");
    }
    setIsCreating(false);
  };

  if (!conversacion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Crear Cliente desde WhatsApp
          </DialogTitle>
          <p className="text-slate-600">
            Número: {conversacion.telefono} • {conversacion.mensajes.length} mensajes en el historial
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
              <Input
                id="nombre_empresa"
                required
                value={formData.nombre_empresa}
                onChange={(e) => setFormData({...formData, nombre_empresa: e.target.value})}
                placeholder="Ej: Transportes López S.A."
              />
            </div>
            <div>
              <Label htmlFor="rfc">RFC *</Label>
              <Input
                id="rfc"
                required
                value={formData.rfc}
                onChange={(e) => setFormData({...formData, rfc: e.target.value})}
                placeholder="Ej: 3-101-123456"
              />
            </div>
            <div>
              <Label htmlFor="contacto_principal">Contacto Principal *</Label>
              <Input
                id="contacto_principal"
                required
                value={formData.contacto_principal}
                onChange={(e) => setFormData({...formData, contacto_principal: e.target.value})}
                placeholder="Nombre de la persona de contacto"
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                placeholder="Número de WhatsApp"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="correo@empresa.com"
              />
            </div>
            <div>
              <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
              <Select value={formData.tipo_cliente} onValueChange={(value) => setFormData({...formData, tipo_cliente: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporativo">Corporativo</SelectItem>
                  <SelectItem value="pyme">PyME</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              rows={2}
              placeholder="Dirección completa del cliente"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>¿Qué pasará al crear el cliente?</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Se creará un nuevo cliente con esta información</li>
              <li>• Los {conversacion.mensajes.length} mensajes existentes se asociarán automáticamente</li>
              <li>• Podrás ver todo el historial en la página del cliente</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isCreating}>
              {isCreating ? "Creando..." : "Crear Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}