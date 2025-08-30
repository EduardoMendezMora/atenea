import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export default function ClientNoteForm({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tipo_nota: "general",
    titulo: "",
    contenido: "",
    importante: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      tipo_nota: "general",
      titulo: "",
      contenido: "",
      importante: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nueva Nota</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipo_nota">Tipo de Nota</Label>
            <Select value={formData.tipo_nota} onValueChange={(value) => setFormData({...formData, tipo_nota: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="llamada">Llamada</SelectItem>
                <SelectItem value="reunion">Reunión</SelectItem>
                <SelectItem value="incidencia">Incidencia</SelectItem>
                <SelectItem value="oportunidad">Oportunidad</SelectItem>
                <SelectItem value="queja">Queja</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="contenido">Contenido *</Label>
            <Textarea
              id="contenido"
              required
              rows={4}
              value={formData.contenido}
              onChange={(e) => setFormData({...formData, contenido: e.target.value})}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="importante"
              checked={formData.importante}
              onCheckedChange={(checked) => setFormData({...formData, importante: checked})}
            />
            <Label htmlFor="importante">Marcar como importante</Label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear Nota
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}