import React, { useState, useEffect } from 'react';
import { Marca } from '@/api/entities';
import { Modelo } from '@/api/entities';
import { Carroceria } from '@/api/entities';
import { Combustible } from '@/api/entities';
import { Arrendadora } from '@/api/entities';
import { Transmision } from '@/api/entities';
import { Traccion } from '@/api/entities';
import { EstadoVehiculo } from '@/api/entities';
import { EstadoInventario } from '@/api/entities';
import { UbicacionVehiculo } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfiguracionVehiculos() {
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [carrocerias, setCarrocerias] = useState([]);
  const [combustibles, setCombustibles] = useState([]);
  const [arrendadoras, setArrendadoras] = useState([]);
  const [transmisiones, setTransmisiones] = useState([]);
  const [tracciones, setTracciones] = useState([]);
  const [estadosVehiculo, setEstadosVehiculo] = useState([]);
  const [estadosInventario, setEstadosInventario] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const loadData = async () => {
    setIsLoading(true);
    const [
      marcasData, 
      modelosData, 
      carroceriasData, 
      combustiblesData, 
      arrendadorasData, 
      transmisionesData, 
      traccionesData, 
      estadosVehiculoData, 
      estadosInventarioData, 
      ubicacionesData
    ] = await Promise.all([
      Marca.list(),
      Modelo.list(),
      Carroceria.list(),
      Combustible.list(),
      Arrendadora.list(),
      Transmision.list(),
      Traccion.list(),
      EstadoVehiculo.list(),
      EstadoInventario.list(),
      UbicacionVehiculo.list()
    ]);
    setMarcas(marcasData);
    setModelos(modelosData);
    setCarrocerias(carroceriasData);
    setCombustibles(combustiblesData);
    setArrendadoras(arrendadorasData);
    setTransmisiones(transmisionesData);
    setTracciones(traccionesData);
    setEstadosVehiculo(estadosVehiculoData);
    setEstadosInventario(estadosInventarioData);
    setUbicaciones(ubicacionesData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const entityMap = {
      marca: Marca,
      modelo: Modelo,
      carroceria: Carroceria,
      combustible: Combustible,
      arrendadora: Arrendadora,
      transmision: Transmision,
      traccion: Traccion,
      estado_vehiculo: EstadoVehiculo,
      estado_inventario: EstadoInventario,
      ubicacion: UbicacionVehiculo
    };
    const Entity = entityMap[dialogType];

    if (editingItem) {
      await Entity.update(editingItem.id, formData);
    } else {
      await Entity.create(formData);
    }
    
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({});
    loadData();
  };

  const handleDelete = async (type, id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
        const entityMap = {
            marca: Marca,
            modelo: Modelo,
            carroceria: Carroceria,
            combustible: Combustible,
            arrendadora: Arrendadora,
            transmision: Transmision,
            traccion: Traccion,
            estado_vehiculo: EstadoVehiculo,
            estado_inventario: EstadoInventario,
            ubicacion: UbicacionVehiculo
        };
        await entityMap[type].delete(id);
        loadData();
    }
  };

  const renderDialogContent = () => {
    switch(dialogType) {
      case 'marca':
      case 'carroceria':
      case 'combustible':
      case 'transmision':
      case 'traccion':
      case 'estado_vehiculo':
      case 'estado_inventario':
      case 'ubicacion':
        return (
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ingresa el nombre..."
            />
          </div>
        );
      case 'modelo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre del Modelo</Label>
              <Input
                id="nombre"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ingresa el nombre del modelo..."
              />
            </div>
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Select 
                value={formData.marca_id || ''} 
                onValueChange={(value) => {
                  const selectedMarca = marcas.find(m => m.id === value);
                  setFormData({
                    ...formData, 
                    marca_id: value,
                    marca_nombre: selectedMarca ? selectedMarca.nombre : ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca..." />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map(marca => (
                    <SelectItem key={marca.id} value={marca.id}>{marca.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'arrendadora':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Empresa</Label>
              <Input
                id="nombre"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre de la arrendadora..."
              />
            </div>
            <div>
              <Label htmlFor="id_juridica">Cédula Jurídica</Label>
              <Input
                id="id_juridica"
                value={formData.id_juridica || ''}
                onChange={(e) => setFormData({...formData, id_juridica: e.target.value})}
                placeholder="3-101-123456"
              />
            </div>
            <div>
              <Label htmlFor="apoderado_nombre">Nombre del Apoderado</Label>
              <Input
                id="apoderado_nombre"
                value={formData.apoderado_nombre || ''}
                onChange={(e) => setFormData({...formData, apoderado_nombre: e.target.value})}
                placeholder="Nombre completo del apoderado..."
              />
            </div>
            <div>
              <Label htmlFor="apoderado_id">Cédula del Apoderado</Label>
              <Input
                id="apoderado_id"
                value={formData.apoderado_id || ''}
                onChange={(e) => setFormData({...formData, apoderado_id: e.target.value})}
                placeholder="1-1234-5678"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const AdminSection = ({ title, items, onAddItem, onEditItem, onDeleteItem, renderItem }) => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
          <Button onClick={onAddItem} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No hay elementos registrados
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-slate-50"
              >
                <div className="flex-1">
                  {renderItem(item)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditItem(item)}
                    className="hover:bg-blue-100 text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteItem(item.id)}
                    className="hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Ajustes de Vehículos
              </h1>
              <p className="text-slate-600 font-medium">
                Administra los catálogos de información para vehículos
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="marcas">
          <TabsList className="bg-white shadow-sm mb-6 flex-wrap h-auto p-2">
            <TabsTrigger value="marcas">Marcas</TabsTrigger>
            <TabsTrigger value="modelos">Modelos</TabsTrigger>
            <TabsTrigger value="carrocerias">Carrocerías</TabsTrigger>
            <TabsTrigger value="combustibles">Combustibles</TabsTrigger>
            <TabsTrigger value="transmisiones">Transmisiones</TabsTrigger>
            <TabsTrigger value="tracciones">Tracciones</TabsTrigger>
            <TabsTrigger value="estados">Estados</TabsTrigger>
            <TabsTrigger value="inventario">Est. Inventario</TabsTrigger>
            <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
            <TabsTrigger value="arrendadoras">Arrendadoras</TabsTrigger>
          </TabsList>

          <TabsContent value="marcas">
            <AdminSection 
              title="Marcas de Vehículos"
              items={marcas}
              onAddItem={() => handleOpenDialog('marca')}
              onEditItem={(item) => handleOpenDialog('marca', item)}
              onDeleteItem={(id) => handleDelete('marca', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="modelos">
            <AdminSection 
              title="Modelos de Vehículos"
              items={modelos}
              onAddItem={() => handleOpenDialog('modelo')}
              onEditItem={(item) => handleOpenDialog('modelo', item)}
              onDeleteItem={(id) => handleDelete('modelo', id)}
              renderItem={(item) => (
                <div>
                  <span className="font-medium text-slate-800">{item.nombre}</span>
                  <span className="text-slate-500 ml-2">({item.marca_nombre})</span>
                </div>
              )}
            />
          </TabsContent>
          
          <TabsContent value="carrocerias">
            <AdminSection 
              title="Tipos de Carrocería"
              items={carrocerias}
              onAddItem={() => handleOpenDialog('carroceria')}
              onEditItem={(item) => handleOpenDialog('carroceria', item)}
              onDeleteItem={(id) => handleDelete('carroceria', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>
          
          <TabsContent value="combustibles">
             <AdminSection 
              title="Tipos de Combustible"
              items={combustibles}
              onAddItem={() => handleOpenDialog('combustible')}
              onEditItem={(item) => handleOpenDialog('combustible', item)}
              onDeleteItem={(id) => handleDelete('combustible', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="transmisiones">
             <AdminSection 
              title="Tipos de Transmisión"
              items={transmisiones}
              onAddItem={() => handleOpenDialog('transmision')}
              onEditItem={(item) => handleOpenDialog('transmision', item)}
              onDeleteItem={(id) => handleDelete('transmision', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="tracciones">
             <AdminSection 
              title="Tipos de Tracción"
              items={tracciones}
              onAddItem={() => handleOpenDialog('traccion')}
              onEditItem={(item) => handleOpenDialog('traccion', item)}
              onDeleteItem={(id) => handleDelete('traccion', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="estados">
             <AdminSection 
              title="Estados de Vehículos"
              items={estadosVehiculo}
              onAddItem={() => handleOpenDialog('estado_vehiculo')}
              onEditItem={(item) => handleOpenDialog('estado_vehiculo', item)}
              onDeleteItem={(id) => handleDelete('estado_vehiculo', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="inventario">
             <AdminSection 
              title="Estados de Inventario"
              items={estadosInventario}
              onAddItem={() => handleOpenDialog('estado_inventario')}
              onEditItem={(item) => handleOpenDialog('estado_inventario', item)}
              onDeleteItem={(id) => handleDelete('estado_inventario', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="ubicaciones">
             <AdminSection 
              title="Ubicaciones de Vehículos"
              items={ubicaciones}
              onAddItem={() => handleOpenDialog('ubicacion')}
              onEditItem={(item) => handleOpenDialog('ubicacion', item)}
              onDeleteItem={(id) => handleDelete('ubicacion', id)}
              renderItem={(item) => <span className="font-medium text-slate-800">{item.nombre}</span>}
            />
          </TabsContent>

          <TabsContent value="arrendadoras">
             <AdminSection 
              title="Empresas Arrendadoras"
              items={arrendadoras}
              onAddItem={() => handleOpenDialog('arrendadora')}
              onEditItem={(item) => handleOpenDialog('arrendadora', item)}
              onDeleteItem={(id) => handleDelete('arrendadora', id)}
              renderItem={(item) => (
                <div>
                  <div className="font-medium text-slate-800">{item.nombre}</div>
                  <div className="text-sm text-slate-500">Cédula Jurídica: {item.id_juridica}</div>
                  <div className="text-sm text-slate-500">Apoderado: {item.apoderado_nombre} ({item.apoderado_id})</div>
                </div>
              )}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar' : 'Agregar'} {
                  {
                    marca: 'Marca',
                    modelo: 'Modelo',
                    carroceria: 'Carrocería',
                    combustible: 'Combustible',
                    transmision: 'Transmisión',
                    traccion: 'Tracción',
                    estado_vehiculo: 'Estado de Vehículo',
                    estado_inventario: 'Estado de Inventario',
                    ubicacion: 'Ubicación',
                    arrendadora: 'Arrendadora'
                  }[dialogType]
                }
              </DialogTitle>
            </DialogHeader>
            {renderDialogContent()}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}