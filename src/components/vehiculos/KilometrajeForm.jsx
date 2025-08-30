
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { KilometrajeVehiculo } from "@/api/entities";
import { format } from 'date-fns';

export default function KilometrajeForm({ isOpen, onClose, vehiculo, onSave }) {
    const [formData, setFormData] = useState({
        fecha_registro: format(new Date(), 'yyyy-MM-dd'),
        kilometraje: '',
        unidad: 'km',
        observaciones: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                fecha_registro: format(new Date(), 'yyyy-MM-dd'),
                kilometraje: '',
                unidad: 'km',
                observaciones: ''
            });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            vehiculo_id: vehiculo.id,
            vehiculo_numero_economico: vehiculo.numero_economico,
            vehiculo_placas: vehiculo.placas,
            kilometraje: parseInt(formData.kilometraje)
        };
        await KilometrajeVehiculo.create(dataToSave);
        onSave();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Registrar Kilometraje</DialogTitle>
                    <DialogDescription>
                        Para el vehículo: {vehiculo?.marca} {vehiculo?.modelo} ({vehiculo?.numero_economico})
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="kilometraje">Lectura del Odómetro *</Label>
                        <Input
                            id="kilometraje"
                            type="number"
                            required
                            min="0"
                            value={formData.kilometraje}
                            onChange={(e) => setFormData({ ...formData, kilometraje: e.target.value })}
                            placeholder="Ej: 50123"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="unidad">Unidad *</Label>
                            <Select value={formData.unidad} onValueChange={(value) => setFormData({...formData, unidad: value})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="km">Kilómetros (km)</SelectItem>
                                    <SelectItem value="mi">Millas (mi)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="fecha_registro">Fecha del Registro *</Label>
                            <Input
                                id="fecha_registro"
                                type="date"
                                required
                                value={formData.fecha_registro}
                                onChange={(e) => setFormData({ ...formData, fecha_registro: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="observaciones">Observaciones</Label>
                        <Textarea
                            id="observaciones"
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            placeholder="Anotaciones adicionales (opcional)"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Guardar Registro
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
