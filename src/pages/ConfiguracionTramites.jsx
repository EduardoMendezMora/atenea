
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RequisitoMaestro } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge'; // Added this import

function RequisitoForm({ isOpen, onClose, onSave, requisito }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(requisito || {
      tipo_requisito: 'documento_general',
      nombre_requisito: '',
      descripcion: '',
      orden: 100,
      activo: true
    });
  }, [requisito]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{requisito ? 'Editar' : 'Nuevo'} Requisito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre_requisito">Nombre del Requisito</Label>
            <Input id="nombre_requisito" value={formData.nombre_requisito || ''} onChange={e => setFormData({...formData, nombre_requisito: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" value={formData.descripcion || ''} onChange={e => setFormData({...formData, descripcion: e.target.value})} required />
          </div>
          <div>
            <Label htmlFor="tipo_requisito">Tipo de Requisito</Label>
            <Select value={formData.tipo_requisito} onValueChange={val => setFormData({...formData, tipo_requisito: val})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="datos_avalista">Datos Avalista</SelectItem>
                <SelectItem value="contactos_cercanos">Contactos Cercanos</SelectItem>
                <SelectItem value="ubicacion_gps">Ubicación GPS</SelectItem>
                <SelectItem value="foto_cochera">Foto Cochera</SelectItem>
                <SelectItem value="foto_cedula_deudor">Foto Cédula Deudor</SelectItem>
                <SelectItem value="foto_cedula_avalista">Foto Cédula Avalista</SelectItem>
                <SelectItem value="selfie_deudor">Selfie Deudor</SelectItem>
                <SelectItem value="selfie_avalista">Selfie Avalista</SelectItem>
                <SelectItem value="documento_general">Documento General</SelectItem>
                <SelectItem value="firma_digital">Firma Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="orden">Orden</Label>
              <Input id="orden" type="number" value={formData.orden || ''} onChange={e => setFormData({...formData, orden: parseInt(e.target.value) || 100})} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch id="activo" checked={formData.activo} onCheckedChange={val => setFormData({...formData, activo: val})} />
              <Label htmlFor="activo">Activo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ConfiguracionTramites() {
  const [requisitos, setRequisitos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState(null);

  useEffect(() => {
    loadRequisitos();
  }, []);

  const loadRequisitos = async () => {
    setIsLoading(true);
    try {
      const data = await RequisitoMaestro.list('orden');
      setRequisitos(data);
    } catch (error) {
      console.error("Error cargando requisitos:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (data) => {
    try {
      if (editingRequisito) {
        await RequisitoMaestro.update(editingRequisito.id, data);
      } else {
        await RequisitoMaestro.create(data);
      }
      setShowForm(false);
      setEditingRequisito(null);
      loadRequisitos();
    } catch (error) {
      console.error("Error guardando requisito:", error);
    }
  };

  const handleEdit = (requisito) => {
    setEditingRequisito(requisito);
    setShowForm(true);
  };
  
  const handleDelete = async (id) => {
      if(confirm('¿Está seguro que desea eliminar este requisito? Esta acción no se puede deshacer.')) {
          try {
              await RequisitoMaestro.delete(id);
              loadRequisitos();
          } catch(error) {
              console.error("Error eliminando requisito:", error);
          }
      }
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ajustes de Trámites</h1>
            <p className="text-slate-600">Configure los requisitos que se solicitarán a los nuevos clientes.</p>
          </div>
          <Button onClick={() => { setEditingRequisito(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Requisito
          </Button>
        </motion.div>

        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <Card className="shadow-lg border-0">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {requisitos.map(req => (
                  <div key={req.id} className="flex items-center p-4 hover:bg-slate-50">
                    <div className="flex-1">
                      <p className={`font-semibold ${req.activo ? 'text-slate-900' : 'text-slate-400'}`}>{req.nombre_requisito}</p>
                      <p className={`text-sm ${req.activo ? 'text-slate-600' : 'text-slate-400'}`}>{req.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Badge variant={req.activo ? "default" : "outline"}>{req.activo ? 'Activo' : 'Inactivo'}</Badge>
                       <Button variant="ghost" size="icon" onClick={() => handleEdit(req)}><Edit className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(req.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <RequisitoForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        requisito={editingRequisito}
      />
    </div>
  );
}
