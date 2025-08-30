import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DispositivoGPS } from "@/api/entities";

export default function DispositivoGPSForm({ isOpen, onClose, vehiculo, dispositivo, onSave }) {
    const [formData, setFormData] = useState({
        modelo: '',
        serie: '',
        numero_telefono_sim: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (dispositivo) {
                setFormData(dispositivo);
            } else {
                setFormData({ modelo: '', serie: '', numero_telefono_sim: '' });
            }
        }
    }, [isOpen, dispositivo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, vehiculo_id: vehiculo.id };

        if (dispositivo) {
            await DispositivoGPS.update(dispositivo.id, dataToSave);
        } else {
            await DispositivoGPS.create(dataToSave);
        }
        onSave();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{dispositivo ? 'Editar' : 'Agregar'} Dispositivo GPS</DialogTitle>
                    <DialogDescription>
                        Para el vehículo: {vehiculo?.numero_economico}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="modelo">Modelo *</Label>
                        <Input id="modelo" required value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="serie">Serie *</Label>
                        <Input id="serie" required value={formData.serie} onChange={(e) => setFormData({ ...formData, serie: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="numero_telefono_sim">Número de Teléfono (SIM)</Label>
                        <Input id="numero_telefono_sim" value={formData.numero_telefono_sim} onChange={(e) => setFormData({ ...formData, numero_telefono_sim: e.target.value })} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{dispositivo ? 'Actualizar' : 'Guardar'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}