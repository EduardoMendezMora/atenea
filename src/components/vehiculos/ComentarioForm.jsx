
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ComentarioVehiculo } from "@/api/entities";
import { User } from "@/api/entities";

export default function ComentarioForm({ isOpen, onClose, vehiculo, onSave }) {
    const [formData, setFormData] = useState({
        tipo_comentario: 'general',
        comentario: '',
        importante: false
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                tipo_comentario: 'general',
                comentario: '',
                importante: false
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = await User.me();
        
        const dataToSave = {
            ...formData,
            vehiculo_id: vehiculo.id,
            vehiculo_numero_economico: vehiculo.numero_economico,
            vehiculo_placas: vehiculo.placas, // Added this line
            fecha_comentario: new Date().toISOString(),
            usuario_nombre: user.full_name
        };
        
        await ComentarioVehiculo.create(dataToSave);
        onSave();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Agregar Comentario</DialogTitle>
                    <DialogDescription>
                        Para el vehículo: {vehiculo?.marca} {vehiculo?.modelo} ({vehiculo?.numero_economico})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="tipo_comentario">Tipo de Comentario</Label>
                        <Select value={formData.tipo_comentario} onValueChange={(value) => setFormData({ ...formData, tipo_comentario: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="incidencia">Incidencia</SelectItem>
                                <SelectItem value="ubicacion">Ubicación</SelectItem>
                                <SelectItem value="cliente">Cliente</SelectItem>
                                <SelectItem value="reparacion">Reparación</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="comentario">Comentario *</Label>
                        <Textarea
                            id="comentario"
                            required
                            rows={4}
                            value={formData.comentario}
                            onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                            placeholder="Escriba su comentario o nota aquí..."
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="importante"
                            checked={formData.importante}
                            onCheckedChange={(checked) => setFormData({ ...formData, importante: checked })}
                        />
                        <Label htmlFor="importante">Marcar como comentario importante</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Guardar Comentario
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
