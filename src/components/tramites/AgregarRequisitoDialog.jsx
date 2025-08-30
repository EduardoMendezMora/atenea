import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function AgregarRequisitoDialog({ isOpen, onClose, tramite, maestroRequisitos, requisitosActuales, onRequisitoAdded }) {
  const [selectedRequisitoId, setSelectedRequisitoId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  // Filtrar para no mostrar requisitos que ya han sido agregados a este trámite.
  const requisitosDisponibles = maestroRequisitos.filter(maestro => {
    return !requisitosActuales.some(actual => actual.nombre_requisito === maestro.nombre_requisito);
  });

  const handleAdd = async () => {
    if (!selectedRequisitoId) {
      alert('Por favor, seleccione un requisito para agregar.');
      return;
    }
    
    setIsAdding(true);
    const reqMaestro = requisitosDisponibles.find(r => r.id === selectedRequisitoId);
    
    if (reqMaestro) {
      try {
        await onRequisitoAdded({
          tramite_id: tramite.id,
          tipo_requisito: reqMaestro.tipo_requisito,
          nombre_requisito: reqMaestro.nombre_requisito,
          descripcion: reqMaestro.descripcion,
          orden: reqMaestro.orden,
          obligatorio: true,
          completado: false
        });
        // --- CAMBIO CLAVE: Limpiar selección para permitir agregar otro ---
        setSelectedRequisitoId(''); 
      } catch (error) {
        console.error("Error al agregar requisito:", error);
        alert('Hubo un error al agregar el requisito.');
      } finally {
        setIsAdding(false);
      }
    } else {
        setIsAdding(false);
    }
    // --- CAMBIO CLAVE: No llamar a onClose() aquí ---
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Requisito al Trámite</DialogTitle>
          <DialogDescription>
            Seleccione los requisitos maestros que desea añadir a este proceso. Puede añadir varios seguidos.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="grid grid-cols-1 gap-4 items-end">
            <div className="flex-grow">
              <Label htmlFor="requisito-maestro">Requisito a agregar</Label>
              <Select value={selectedRequisitoId} onValueChange={setSelectedRequisitoId}>
                <SelectTrigger id="requisito-maestro">
                  <SelectValue placeholder="Seleccionar un requisito..." />
                </SelectTrigger>
                <SelectContent>
                  {requisitosDisponibles.length > 0 ? (
                    requisitosDisponibles.map(req => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.nombre_requisito}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No hay más requisitos disponibles.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={isAdding || !selectedRequisitoId}>
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isAdding ? 'Agregando...' : 'Agregar al Trámite'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}