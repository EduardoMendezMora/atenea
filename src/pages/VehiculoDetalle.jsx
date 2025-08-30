
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Vehiculo } from '@/api/entities';
import { TareaVehiculo } from '@/api/entities';
import { KilometrajeVehiculo } from '@/api/entities';
import { ComentarioVehiculo } from '@/api/entities';
import { ComentarioTareaVehiculo } from '@/api/entities';
import { DispositivoGPS } from '@/api/entities';
import { ComentarioDispositivoGPS } from '@/api/entities';
import { SolicitudRepuesto } from '@/api/entities';
import { User } from '@/api/entities';
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
import { ChecklistTemplate } from '@/api/entities';
import { InspeccionVehiculo } from '@/api/entities';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Truck, Edit, Plus, Calendar, Wrench, MessageSquare, Satellite, PackageSearch, Gauge, AlertTriangle, File, Trash2, Paperclip, Camera, ListChecks
} from 'lucide-react';
import { format } from 'date-fns';

// Re-import form components
import VehicleForm from '../components/vehiculos/VehicleForm';
import TaskForm from '../components/vehiculos/TaskForm';
import KilometrajeForm from '../components/vehiculos/KilometrajeForm';
import ComentarioForm from '../components/vehiculos/ComentarioForm';
import DispositivoGPSForm from '../components/vehiculos/DispositivoGPSForm';
import ComentarioGPSForm from '../components/vehiculos/ComentarioGPSForm';
import SolicitudRepuestoForm from '../components/vehiculos/SolicitudRepuestoForm';
import ComentarioTareaForm from '../components/vehiculos/ComentarioTareaForm';
import TareaCard from '../components/vehiculos/TareaCard'; // Importar el nuevo componente
import GaleriaFotos from '../components/vehiculos/GaleriaFotos';
import SubirFotosForm from '../components/vehiculos/SubirFotosForm';
import InspeccionForm from '../components/inspecciones/InspeccionForm';
import InspeccionCard from '../components/inspecciones/InspeccionCard';


export default function VehiculoDetalle() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('id');

  const [vehiculo, setVehiculo] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [kilometrajes, setKilometrajes] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [comentariosTarea, setComentariosTarea] = useState([]);
  const [dispositivosGPS, setDispositivosGPS] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [inspecciones, setInspecciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info"); // Nuevo estado para controlar la pestaña activa
  const [taskStatusFilter, setTaskStatusFilter] = useState("pendiente");

  // States for dialogs
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showKilometrajeForm, setShowKilometrajeForm] = useState(false);
  const [showComentarioForm, setShowComentarioForm] = useState(false);
  const [showGPSDialog, setShowGPSDialog] = useState(false); // This state seems unused, consider removing if not needed.
  const [showSolicitudForm, setShowSolicitudForm] = useState(false);
  const [showComentarioTareaDialog, setShowComentarioTareaDialog] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [showComentarioTareaForm, setShowComentarioTareaForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [galleryKey, setGalleryKey] = useState(Date.now());
  const [showInspeccionForm, setShowInspeccionForm] = useState(false);


  // States for nested GPS dialogs
  const [selectedDispositivo, setSelectedDispositivo] = useState(null);
  const [showGPSForm, setShowGPSForm] = useState(false);
  const [editingGPS, setEditingGPS] = useState(null);
  const [showComentarioGPSForm, setShowComentarioGPSForm] = useState(false);
  const [showComentariosGPSDialog, setShowComentariosGPSDialog] = useState(false);
  const [comentariosGPS, setComentariosGPS] = useState([]);

  // States for catalogs needed by forms
  const [catalogos, setCatalogos] = useState({
      users: [], marcas: [], modelos: [], carrocerias: [], combustibles: [],
      arrendadoras: [], transmisiones: [], tracciones: [], estadosVehiculo: [],
      estadosInventario: [], ubicaciones: [], templates: []
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [
        vehiculoData,
        tareasData,
        kilometrajesData,
        comentariosData,
        comentariosTareaData,
        dispositivosGPSData,
        comentariosGPSData,
        solicitudesData,
        inspeccionesData,
        // Catalog data
        usersData, marcasData, modelosData, carroceriasData, combustiblesData, arrendadorasData,
        transmisionesData, traccionesData, estadosVehiculoData, estadosInventarioData, ubicacionesData, templatesData
      ] = await Promise.all([
        Vehiculo.get(id),
        TareaVehiculo.filter({ vehiculo_id: id }, '-fecha_programada'),
        KilometrajeVehiculo.filter({ vehiculo_id: id }, '-fecha_registro'),
        ComentarioVehiculo.filter({ vehiculo_id: id }, '-fecha_comentario'),
        ComentarioTareaVehiculo.list(), // Fetch all task comments
        DispositivoGPS.filter({ vehiculo_id: id }),
        ComentarioDispositivoGPS.list(),
        SolicitudRepuesto.filter({ vehiculo_id: id }, '-created_date'),
        InspeccionVehiculo.filter({ vehiculo_id: id }, '-fecha_inspeccion'),
        User.list(), Marca.list(), Modelo.list(), Carroceria.list(), Combustible.list(),
        Arrendadora.list(), Transmision.list(), Traccion.list(), EstadoVehiculo.list(),
        EstadoInventario.list(), UbicacionVehiculo.list(), ChecklistTemplate.list()
      ]);

      setVehiculo(vehiculoData);
      setTareas(tareasData);
      setKilometrajes(kilometrajesData);
      setComentarios(comentariosData);
      setComentariosTarea(comentariosTareaData);
      setDispositivosGPS(dispositivosGPSData);
      setComentariosGPS(comentariosGPSData);
      setSolicitudes(solicitudesData);
      setInspecciones(inspeccionesData);
      setCatalogos({
        users: usersData, marcas: marcasData, modelos: modelosData, carrocerias: carroceriasData,
        combustibles: combustiblesData, arrendadoras: arrendadorasData, transmisiones: transmisionesData,
        tracciones: traccionesData, estadosVehiculo: estadosVehiculoData,
        estadosInventario: estadosInventarioData, ubicaciones: ubicacionesData, templates: templatesData
      });

    } catch (error) {
      console.error("Error cargando detalles del vehículo:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleSaveVehicle = async (vehiculoData) => {
    await Vehiculo.update(vehiculo.id, vehiculoData);
    setShowVehicleForm(false);
    loadData();
  };

  const handleSaveTask = async (tareaData, taskId) => {
    if (taskId) {
      await TareaVehiculo.update(taskId, tareaData);
    } else {
      await TareaVehiculo.create({ ...tareaData, vehiculo_id: vehiculo.id, numero_economico: vehiculo.numero_economico, vehiculo_placas: vehiculo.placas });
    }
    setShowTaskForm(false);
    setEditingTask(null);
    loadData();
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleOpenComments = (task) => {
    setSelectedTaskForComments(task);
    setShowComentarioTareaDialog(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        await TareaVehiculo.delete(taskId);
        loadData();
    }
  };

  const handleSaveInspeccion = async (inspeccionData) => {
    const user = await User.me();
    
    const dataToSave = {
        ...inspeccionData,
        vehiculo_id: vehiculo.id,
        vehiculo_placas: vehiculo.placas,
        usuario_id: user.id,
        usuario_nombre: user.full_name,
        fecha_inspeccion: new Date().toISOString(),
    };

    const fallos = dataToSave.resultados.filter(r => r.estado === 'falla');
    dataToSave.fallos_detectados = fallos.length > 0;

    const nuevaInspeccion = await InspeccionVehiculo.create(dataToSave);

    if (dataToSave.fallos_detectados) {
        const descripcionTarea = `Fallos detectados en inspección (${dataToSave.template_nombre}):\n` + 
                                fallos.map(f => `- ${f.categoria}: ${f.pregunta} (${f.notas || 'Sin notas'})`).join('\n');
        
        const nuevaTarea = await TareaVehiculo.create({
            vehiculo_id: vehiculo.id,
            numero_economico: vehiculo.numero_economico,
            vehiculo_placas: vehiculo.placas,
            tipo_tarea: 'reparacion',
            descripcion: descripcionTarea,
            prioridad: 'alta',
            fecha_programada: new Date().toISOString().split('T')[0],
            estatus: 'pendiente',
            observaciones: `Tarea generada automáticamente desde la inspección ID: ${nuevaInspeccion.id}`
        });
        
        await InspeccionVehiculo.update(nuevaInspeccion.id, { tarea_generada_id: nuevaTarea.id });
    }

    setShowInspeccionForm(false);
    loadData();
    setActiveTab("inspecciones");
  };
  
  const handleSaveSolicitud = async (solicitudData) => {
    const user = await User.me();
    const dataToSave = {
      ...solicitudData,
      vehiculo_id: vehiculo.id,
      numero_economico: vehiculo.numero_economico,
      vehiculo_placas: vehiculo.placas,
      solicitado_por_id: user.id,
      solicitado_por_nombre: user.full_name,
      estatus: 'solicitado'
    };
    await SolicitudRepuesto.create(dataToSave);
    setShowSolicitudForm(false);
    loadData();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'disponible':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'alquilado':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'mantenimiento':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'en reparación':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'vendido':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'dado de baja':
          return 'bg-zinc-500 hover:bg-zinc-600 text-white';
      default:
        return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-8">Cargando detalles del vehículo...</div>;
  }

  if (!vehiculo) {
    return <div className="p-8 text-red-500">No se pudo encontrar el vehículo.</div>;
  }
  
  const gpsComentariosForSelected = selectedDispositivo
    ? comentariosGPS.filter(c => c.dispositivo_id === selectedDispositivo.id).sort((a,b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
    : [];

  const statusOrder = { 'pendiente': 1, 'en_proceso': 2, 'completada': 3, 'cancelada': 4 };
  const displayTareas = [...tareas]
    .sort((a, b) => (statusOrder[a.estatus] || 99) - (statusOrder[b.estatus] || 99))
    .filter(tarea => {
        if (taskStatusFilter === 'todas') return true;
        return tarea.estatus === taskStatusFilter;
    });

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                {vehiculo.placas || vehiculo.numero_economico}
              </h1>
              <p className="text-slate-600 font-medium">
                {vehiculo.marca} {vehiculo.modelo} {vehiculo.año} ({vehiculo.numero_economico})
              </p>
            </div>
          </div>
          <Button onClick={() => setShowVehicleForm(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Vehículo
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white shadow-sm mb-6">
            <TabsTrigger value="info">Información General</TabsTrigger>
            <TabsTrigger value="galeria">Galería</TabsTrigger>
            <TabsTrigger value="tareas">Tareas</TabsTrigger>
            <TabsTrigger value="inspecciones">Inspecciones</TabsTrigger>
            <TabsTrigger value="comentarios">Bitácora / Comentarios</TabsTrigger>
            <TabsTrigger value="kilometraje">Kilometraje</TabsTrigger>
            <TabsTrigger value="gps">Dispositivos GPS</TabsTrigger>
            <TabsTrigger value="repuestos">Solicitudes de Repuestos</TabsTrigger>
          </TabsList>

          {/* Información General Tab */}
          <TabsContent value="info">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Estatus y Comercial */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Estatus y Comercial</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Estatus</p>
                        <Badge className={getStatusColor(vehiculo.estatus)}>
                          {vehiculo.estatus ? vehiculo.estatus.charAt(0).toUpperCase() + vehiculo.estatus.slice(1) : 'No definido'}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Estatus Inventario</p>
                        <p className="font-semibold text-slate-800">{vehiculo.estatus_inventario || 'No definido'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Ubicación</p>
                        <p className="font-semibold text-slate-800">{vehiculo.ubicacion_actual || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Renta Semanal</p>
                        <p className="text-xl font-bold text-emerald-600">
                          ₡{vehiculo.renta_semanal ? vehiculo.renta_semanal.toLocaleString() : '0'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 font-medium">Gastos Administrativos</p>
                        <p className="text-lg font-bold text-blue-600">
                          ₡{vehiculo.gastos_administrativos ? vehiculo.gastos_administrativos.toLocaleString() : '0'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 font-medium">Plazo en Semanas</p>
                        <p className="font-semibold text-slate-800">
                          {vehiculo.plazo_semanas ? `${vehiculo.plazo_semanas} semanas` : 'No definido'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Cliente Actual</p>
                        <p className="font-semibold text-slate-800">{vehiculo.cliente_actual || 'No asignado'}</p>
                      </div>

                      {vehiculo.asignado_a_nombre && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Asignado a</p>
                          <p className="font-semibold text-slate-800">{vehiculo.asignado_a_nombre}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Especificaciones */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Especificaciones</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Placas</p>
                        <p className="font-semibold text-slate-800">{vehiculo.placas || 'Sin placas'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">VIN / Serie</p>
                        <p className="font-mono text-sm text-slate-800">{vehiculo.numero_serie || 'No registrado'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 font-medium">Año</p>
                        <p className="font-semibold text-slate-800">{vehiculo.año || 'No especificado'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Color</p>
                        <p className="font-semibold text-slate-800">{vehiculo.color || 'No especificado'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Carrocería</p>
                        <p className="font-semibold text-slate-800">{vehiculo.carroceria || 'No especificado'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Combustible</p>
                        <p className="font-semibold text-slate-800">{vehiculo.combustible || 'No especificado'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Transmisión</p>
                        <p className="font-semibold text-slate-800">{vehiculo.transmision || 'No especificado'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 font-medium">Tracción</p>
                        <p className="font-semibold text-slate-800">{vehiculo.traccion || 'No especificado'}</p>
                      </div>

                      {vehiculo.cilindrada && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Cilindrada</p>
                          <p className="font-semibold text-slate-800">{vehiculo.cilindrada}</p>
                        </div>
                      )}

                      {vehiculo.cilindros && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Cilindros</p>
                          <p className="font-semibold text-slate-800">{vehiculo.cilindros} cilindros</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrendadora */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Arrendadora</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Empresa</p>
                        <p className="font-semibold text-slate-800">{vehiculo.arrendadora_nombre || 'No asignada'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Cédula Jurídica</p>
                        <p className="font-mono text-sm text-slate-800">{vehiculo.arrendadora_id_juridica || 'No registrada'}</p>
                      </div>

                      {vehiculo.arrendadora_apoderado && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Apoderado</p>
                          <p className="font-semibold text-slate-800">{vehiculo.arrendadora_apoderado}</p>
                        </div>
                      )}

                      {vehiculo.arrendadora_id_apoderado && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Cédula Apoderado</p>
                          <p className="font-mono text-sm text-slate-800">{vehiculo.arrendadora_id_apoderado}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Valor Adquisicion</p>
                        <p className="font-semibold text-slate-800">
                          {vehiculo.valor_adquisicion ? `₡${vehiculo.valor_adquisicion.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Fecha Adquisicion</p>
                        <p className="font-semibold text-slate-800">
                          {vehiculo.fecha_adquisicion ? format(new Date(vehiculo.fecha_adquisicion + 'T00:00:00'), 'dd/MM/yyyy') : 'N/A'}
                        </p>
                      </div>

                      {vehiculo.whatsapp_grupo_nombre && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Grupo WhatsApp</p>
                          <p className="font-semibold text-green-700">📱 {vehiculo.whatsapp_grupo_nombre}</p>
                        </div>
                      )}

                      {vehiculo.fotos_url && (
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Galería de Fotos</p>
                          <a 
                            href={vehiculo.fotos_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Ver fotos →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Galería Tab */}
          <TabsContent value="galeria">
            <GaleriaFotos 
              vehiculo={vehiculo}
              onOpenUpload={() => setShowUploadForm(true)}
              key={galleryKey}
            />
          </TabsContent>

          {/* Tareas Tab */}
          <TabsContent value="tareas">
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tareas del Vehículo</CardTitle>
                    <Button onClick={() => { setEditingTask(null); setShowTaskForm(true); }}><Plus className="w-4 h-4 mr-2" /> Nueva Tarea</Button>
                </CardHeader>
                <CardContent>
                    <Tabs value={taskStatusFilter} onValueChange={setTaskStatusFilter} className="w-full mb-6">
                        <TabsList>
                            <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                            <TabsTrigger value="en_proceso">En Proceso</TabsTrigger>
                            <TabsTrigger value="completada">Completadas</TabsTrigger>
                            <TabsTrigger value="todas">Todas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="space-y-4">
                        {displayTareas.length > 0 ? (
                            displayTareas.map(tarea => (
                                <TareaCard 
                                    key={tarea.id} 
                                    tarea={tarea}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                    onComment={handleOpenComments}
                                />
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-8">No hay tareas para el filtro seleccionado.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          {/* Inspecciones Tab */}
          <TabsContent value="inspecciones">
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Historial de Inspecciones</CardTitle>
                    <Button onClick={() => setShowInspeccionForm(true)}><Plus className="w-4 h-4 mr-2" /> Nueva Inspección</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {inspecciones.length > 0 ? (
                            inspecciones.map(inspeccion => (
                                <InspeccionCard 
                                    key={inspeccion.id} 
                                    inspeccion={inspeccion}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <ListChecks className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">No hay inspecciones registradas para este vehículo.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* Comentarios Tab */}
          <TabsContent value="comentarios">
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Bitácora del Vehículo</CardTitle>
                    <Button onClick={() => setShowComentarioForm(true)}><Plus className="w-4 h-4 mr-2" /> Agregar Comentario</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {comentarios.map(c => (
                        <Card key={c.id} className={`${c.importante ? 'border-amber-400' : 'border-slate-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <Badge variant={c.importante ? 'destructive' : 'secondary'}>{c.tipo_comentario.toUpperCase()}</Badge>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Por: {c.usuario_nombre} - {format(new Date(c.fecha_comentario), 'dd/MM/yyyy HH:mm')}
                                    </p>
                                </div>
                                {c.importante && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                            </div>
                            <p className="text-slate-700">{c.comentario}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {comentarios.length === 0 && <p className="text-slate-500 text-center py-4">No hay comentarios.</p>}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* Kilometraje Tab */}
          <TabsContent value="kilometraje">
             <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Historial de Kilometraje</CardTitle>
                    <Button onClick={() => setShowKilometrajeForm(true)}><Plus className="w-4 h-4 mr-2" /> Registrar Kilometraje</Button>
                </CardHeader>
                <CardContent>
                    {/* List of odometers */}
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* GPS Tab */}
          <TabsContent value="gps">
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Dispositivos GPS</CardTitle>
                    <Button onClick={() => { setEditingGPS(null); setShowGPSForm(true); }}><Plus className="w-4 h-4 mr-2" /> Agregar Dispositivo</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                   {dispositivosGPS.map(gps => (
                        <Card key={gps.id}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{gps.modelo}</p>
                                    <p className="text-sm text-slate-600">Serie: {gps.serie}</p>
                                    <p className="text-sm text-slate-600">SIM: {gps.numero_telefono_sim}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedDispositivo(gps); setShowComentariosGPSDialog(true); }}>Comentarios</Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingGPS(gps); setShowGPSForm(true); }}><Edit className="w-4 h-4"/></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {dispositivosGPS.length === 0 && <p className="text-slate-500 text-center py-4">No hay dispositivos GPS.</p>}
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* Repuestos Tab */}
          <TabsContent value="repuestos">
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Solicitudes de Repuestos</CardTitle>
                    <Button onClick={() => setShowSolicitudForm(true)}><Plus className="w-4 h-4 mr-2" /> Nueva Solicitud</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {solicitudes.map(s => (
                            <Link key={s.id} to={createPageUrl(`Repuestos`)}>
                                <Card className="hover:bg-slate-50">
                                    <CardContent className="p-4 flex justify-between items-center">
                                      <div>
                                        <p className="font-bold">{s.nombre_repuesto} (x{s.cantidad})</p>
                                        <p className="text-sm">Solicitado por: {s.solicitado_por_nombre}</p>
                                      </div>
                                      <Badge>{s.estatus}</Badge>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {solicitudes.length === 0 && <p className="text-slate-500 text-center py-4">No hay solicitudes de repuestos.</p>}
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </motion.div>

      {/* DIALOGS FOR FORMS */}
      <VehicleForm
          isOpen={showVehicleForm}
          onClose={() => setShowVehicleForm(false)}
          vehiculo={vehiculo}
          onSave={handleSaveVehicle}
          {...catalogos}
        />
        
      <TaskForm
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          vehiculo={vehiculo}
          task={editingTask}
          onSave={handleSaveTask}
          users={catalogos.users}
          vehiculos={[vehiculo]}
        />
        
      <KilometrajeForm 
          isOpen={showKilometrajeForm}
          onClose={() => setShowKilometrajeForm(false)}
          vehiculo={vehiculo}
          onSave={loadData}
        />
        
       <ComentarioForm
          isOpen={showComentarioForm}
          onClose={() => setShowComentarioForm(false)}
          vehiculo={vehiculo}
          onSave={loadData}
        />

        <DispositivoGPSForm 
            isOpen={showGPSForm}
            onClose={() => setShowGPSForm(false)}
            vehiculo={vehiculo}
            dispositivo={editingGPS}
            onSave={() => {
                setShowGPSForm(false);
                loadData();
            }}
        />
        
        {/* DIALOG FOR TASK COMMENTS */}
        <Dialog open={showComentarioTareaDialog} onOpenChange={setShowComentarioTareaDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Comentarios de la Tarea</DialogTitle>
                {selectedTaskForComments && (
                    <DialogDescription className="text-sm text-slate-500 mt-1">
                        {selectedTaskForComments.descripcion}
                    </DialogDescription>
                )}
            </DialogHeader>
            <div className="py-4">
                 <Button onClick={() => {
                    setShowComentarioTareaForm(true);
                 }}>
                    <Plus className="w-4 h-4 mr-2" /> Agregar Comentario
                </Button>
            </div>
            <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-4">Historial de Comentarios</h3>
                <div className="max-h-80 overflow-y-auto space-y-3 py-4 pr-2">
                    {selectedTaskForComments && comentariosTarea
                        .filter(c => c.tarea_id === selectedTaskForComments.id)
                        .sort((a,b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
                        .map(comment => {
                            const isImage = comment.nombre_archivo && /\.(jpg|jpeg|png|gif)$/i.test(comment.nombre_archivo);
                            return (
                                <Card key={comment.id}>
                                    <CardContent className="p-3">
                                        <p className="text-xs text-slate-500">{comment.usuario_nombre} - {format(new Date(comment.fecha_comentario), 'dd/MM/yyyy HH:mm')}</p>
                                        
                                        {comment.comentario && <p className="my-2 text-sm">{comment.comentario}</p>}
                                        
                                        {comment.url_adjunto && (
                                            isImage ? (
                                                <a href={comment.url_adjunto} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                                    <img 
                                                        src={comment.url_adjunto} 
                                                        alt={comment.nombre_archivo || 'Imagen adjunta'} 
                                                        className="max-w-full h-auto max-h-48 object-contain rounded border border-slate-200 bg-slate-50"
                                                    />
                                                </a>
                                            ) : (
                                                <a href={comment.url_adjunto} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-2">
                                                    <Paperclip className="w-3 h-3" /> {comment.nombre_archivo || 'Ver adjunto'}
                                                </a>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    }
                     {selectedTaskForComments && comentariosTarea.filter(c => c.tarea_id === selectedTaskForComments.id).length === 0 && (
                        <p className="text-slate-500 text-center text-sm py-4">No hay comentarios para esta tarea.</p>
                     )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowComentarioTareaDialog(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ComentarioTareaForm
            isOpen={showComentarioTareaForm}
            onClose={() => setShowComentarioTareaForm(false)}
            tarea={selectedTaskForComments}
            onSave={() => {
                setShowComentarioTareaForm(false);
                loadData();
            }}
        />

        <Dialog open={showComentariosGPSDialog} onOpenChange={setShowComentariosGPSDialog}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Comentarios del GPS {selectedDispositivo?.modelo}</DialogTitle>
                    <Button size="sm" className="w-fit" onClick={() => setShowComentarioGPSForm(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Agregar Comentario
                    </Button>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto space-y-3 py-4">
                    {gpsComentariosForSelected.length === 0 ? (
                        <p className="text-slate-500 text-center">No hay comentarios.</p>
                    ) : (
                        gpsComentariosForSelected.map(comment => {
                            const isImage = comment.nombre_archivo && /\.(jpg|jpeg|png|gif)$/i.test(comment.nombre_archivo);
                            return (
                                <Card key={comment.id}>
                                    <CardContent className="p-3">
                                        <p className="text-xs text-slate-500">{comment.usuario_nombre} - {format(new Date(comment.fecha_comentario), 'dd/MM/yyyy HH:mm')}</p>
                                        
                                        {comment.comentario && <p className="my-2">{comment.comentario}</p>}
                                        
                                        {comment.url_adjunto && (
                                            isImage ? (
                                                <a href={comment.url_adjunto} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                                                    <img 
                                                        src={comment.url_adjunto} 
                                                        alt={comment.nombre_archivo || 'Imagen adjunta'} 
                                                        className="max-w-full h-auto max-h-48 object-contain rounded border border-slate-200 bg-slate-50"
                                                    />
                                                </a>
                                            ) : (
                                                <a href={comment.url_adjunto} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-2">
                                                    <File className="w-3 h-3" /> {comment.nombre_archivo || 'Ver adjunto'}
                                                </a>
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
        
        {selectedDispositivo && (
            <ComentarioGPSForm 
                isOpen={showComentarioGPSForm}
                onClose={() => setShowComentarioGPSForm(false)}
                dispositivo={selectedDispositivo}
                onSave={() => {
                    setShowComentarioGPSForm(false);
                    loadData();
                }}
            />
        )}
        
        <SolicitudRepuestoForm
          isOpen={showSolicitudForm}
          onClose={() => setShowSolicitudForm(false)}
          vehiculo={vehiculo}
          tareas={tareas}
          users={catalogos.users}
          onSave={handleSaveSolicitud}
        />

        <SubirFotosForm
          isOpen={showUploadForm}
          onClose={() => setShowUploadForm(false)}
          vehiculo={vehiculo}
          onSave={() => {
              setGalleryKey(Date.now()); // Force re-render of GaleriaFotos
              setShowUploadForm(false);
          }}
        />

        <InspeccionForm
            isOpen={showInspeccionForm}
            onClose={() => setShowInspeccionForm(false)}
            onSave={handleSaveInspeccion}
            vehiculo={vehiculo}
            templates={catalogos.templates}
        />

    </div>
  );
}
