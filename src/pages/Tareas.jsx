
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TareaVehiculo } from "@/api/entities";
import { TareaCliente } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { User } from "@/api/entities";
import { ComentarioTareaVehiculo } from '@/api/entities'; // New import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Wrench, Clock, CheckCircle, Edit, ClipboardList, Users, MessageSquare, Paperclip } from "lucide-react"; // Added MessageSquare, Paperclip
import { Badge }
from "@/components/ui/badge";
import { format } from "date-fns";
import TaskForm from "../components/vehiculos/TaskForm";
import ClientTaskForm from "../components/crm/ClientTaskForm";
import ComentarioTareaForm from '../components/vehiculos/ComentarioTareaForm'; // New import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; // New import

export default function Tareas() {
  const [tareasVehiculo, setTareasVehiculo] = useState([]);
  const [tareasCliente, setTareasCliente] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pendiente"); // Changed initial state from "todas" to "pendiente"
  const [tipoTarea, setTipoTarea] = useState("todas");
  const [isLoading, setIsLoading] = useState(true);
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showClientTaskForm, setShowClientTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // New states for comments functionality
  const [comentarios, setComentarios] = useState([]);
  const [showComentarioForm, setShowComentarioForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Task for which comments are being viewed/added
  const [showComentariosDialog, setShowComentariosDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      
      // REFORZADO: Operaciones tiene acceso a todas las tareas
      const canSeeAll = user.role === 'admin' || user.rol_sistema === 'Gerente' || user.rol_sistema === 'Jefatura' || user.rol_sistema === 'Operaciones';

      let tareasClienteData;
      let tareasVehiculoData;
      let vehiculosData;
      let clientesData;
      let usersData = [];
      
      // Always fetch comments, as they might be visible regardless of task assignment.
      const [comentariosData] = await Promise.all([
        ComentarioTareaVehiculo.list('-fecha_comentario')
      ]);

      if (canSeeAll) {
        [
            tareasClienteData, 
            tareasVehiculoData, 
            vehiculosData, 
            clientesData, 
            usersData
        ] = await Promise.all([
            TareaCliente.list('-created_date'),
            TareaVehiculo.list('-created_date'),
            Vehiculo.list(),
            Cliente.list(),
            User.list() // If canSeeAll is true, fetch all users.
        ]);
      } else {
        [
            tareasClienteData, 
            tareasVehiculoData, 
            vehiculosData, 
            clientesData
        ] = await Promise.all([
            TareaCliente.filter({ asignado_a_id: user.id }, '-created_date'),
            TareaVehiculo.filter({ asignado_a_id: user.id }, '-created_date'),
            Vehiculo.filter({ asignado_a_id: user.id }),
            Cliente.filter({ asignado_a_id: user.id })
        ]);
      }
      
      setTareasCliente(tareasClienteData || []);
      setTareasVehiculo(tareasVehiculoData || []);
      setVehiculos(vehiculosData || []);
      setClientes(clientesData || []);
      setSystemUsers(usersData || []);
      setComentarios(comentariosData || []);
    } catch (error) {
      console.error("Error loading tasks data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async (tareaData, taskId) => {
    if (taskId) {
      await TareaVehiculo.update(taskId, tareaData);
    } else {
      await TareaVehiculo.create(tareaData);
    }
    setShowTaskForm(false);
    setEditingTask(null);
    loadData(); // Reload data after saving task, including comments
  };

  const handleSaveClientTask = async (taskData) => {
    await TareaCliente.create(taskData);
    setShowClientTaskForm(false);
    loadData(); // Reload data after saving client task
  };

  const handleEditTask = (task, tipo) => {
    setEditingTask({ ...task, tipo });
    if (tipo === 'vehiculo') {
      setShowTaskForm(true);
    } else {
      console.log("La edición de tareas de cliente se gestiona desde el detalle del cliente.");
    }
  };

  const handleCreateTask = (type) => {
    setEditingTask(null);
    if (type === 'cliente') {
      setShowClientTaskForm(true);
    } else {
      setShowTaskForm(true);
    }
  };

  // New handler to open comments dialog
  const handleOpenComments = (task) => {
    setSelectedTask(task);
    setShowComentariosDialog(true);
  };

  // New handler to open comment addition form
  const handleAddComment = (task) => {
    setSelectedTask(task);
    setShowComentarioForm(true);
  };

  const todasLasTareas = [
    ...tareasVehiculo.map(t => ({ ...t, tipoTarea: 'vehiculo' })),
    ...tareasCliente.map(t => ({ ...t, tipoTarea: 'cliente' }))
  ].sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

  const filteredTareas = todasLasTareas.filter(tarea => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (tarea.numero_economico?.toLowerCase().includes(searchTermLower)) ||
      (tarea.vehiculo_placas?.toLowerCase().includes(searchTermLower)) ||
      (tarea.cliente_nombre?.toLowerCase().includes(searchTermLower)) ||
      (tarea.descripcion?.toLowerCase().includes(searchTermLower)) ||
      (tarea.titulo?.toLowerCase().includes(searchTermLower)) ||
      (tarea.asignado_a_nombre?.toLowerCase().includes(searchTermLower));
    
    // Adjusted logic for activeTab if "todas" is no longer the default
    const matchesTab = activeTab === "todas" || tarea.estatus === activeTab; 
    const matchesTipo = tipoTarea === "todas" || tarea.tipoTarea === tipoTarea;
    
    return matchesSearch && matchesTab && matchesTipo;
  });

  const getVehiculoInfo = (vehiculoId) => {
    return vehiculos.find(v => v.id === vehiculoId) || {};
  };

  const getClienteInfo = (clienteId) => {
    return clientes.find(c => c.id === clienteId) || {};
  };
  
  const stats = {
    total: todasLasTareas.length,
    pendientes: todasLasTareas.filter(t => t.estatus === 'pendiente').length,
    en_proceso: todasLasTareas.filter(t => t.estatus === 'en_proceso').length,
    completadas: todasLasTareas.filter(t => t.estatus === 'completada').length,
    vehiculos: tareasVehiculo.length,
    clientes: tareasCliente.length
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgente: 'bg-red-500',
      alta: 'bg-orange-500',
      media: 'bg-yellow-500',
      baja: 'bg-blue-500',
    };
    return colors[priority] || 'bg-slate-400';
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'vehiculo' ? '🚛' : '👤';
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Centro de Tareas
            </h1>
            <p className="text-slate-600 font-medium">
              Gestión integral de tareas de vehículos y clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateTask('vehiculo')}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tarea Vehículo
            </Button>
            <Button
              onClick={() => handleCreateTask('cliente')}
              className="bg-green-600 hover:bg-green-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tarea Cliente
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Pendientes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.pendientes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">En Proceso</p>
                <p className="text-3xl font-bold text-slate-900">{stats.en_proceso}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Completadas</p>
                <p className="text-3xl font-bold text-slate-900">{stats.completadas}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Clientes: {stats.clientes}</p>
                <p className="text-sm text-slate-600">Vehículos: {stats.vehiculos}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
              <TabsTrigger value="en_proceso">En Proceso</TabsTrigger>
              <TabsTrigger value="completada">Completadas</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger> {/* Moved "Todas" to the end */}
            </TabsList>
          </Tabs>

          <Tabs value={tipoTarea} onValueChange={setTipoTarea}>
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="todas">Todos los Tipos</TabsTrigger>
              <TabsTrigger value="vehiculo">Vehículos</TabsTrigger>
              <TabsTrigger value="cliente">Clientes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Prioridad</th>
                  <th className="p-4 font-semibold">Tarea</th>
                  <th className="p-4 font-semibold">Cliente/Vehículo</th>
                  <th className="p-4 font-semibold">Fecha Prog.</th>
                  <th className="p-4 font-semibold">Asignado</th>
                  <th className="p-4 font-semibold">Estatus</th>
                  <th className="p-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTareas.map(tarea => (
                  <tr key={`${tarea.tipoTarea}-${tarea.id}`} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <span className="text-2xl" title={tarea.tipoTarea}>
                        {getTipoIcon(tarea.tipoTarea)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(tarea.prioridad)}`} title={tarea.prioridad}></div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {tarea.titulo || `${tarea.descripcion?.substring(0, 30)}${tarea.descripcion?.length > 30 ? '...' : ''}`}
                      </div>
                      <div className="text-xs text-slate-500 capitalize">{tarea.tipo_tarea.replace(/_/g, " ")}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {tarea.tipoTarea === 'vehiculo' ? (
                        <div>
                          <div className="font-bold">{tarea.vehiculo_placas || tarea.numero_economico}</div>
                          <div className="text-xs text-slate-500">
                            {getVehiculoInfo(tarea.vehiculo_id).marca} {getVehiculoInfo(tarea.vehiculo_id).modelo}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold">{tarea.cliente_nombre}</div>
                          <div className="text-xs text-slate-500">Cliente</div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {format(new Date(tarea.fecha_programada), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 text-slate-600">
                      {tarea.asignado_a_nombre || '-'}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">{tarea.estatus}</Badge>
                    </td>
                    <td className="p-4">
                      {tarea.tipoTarea === 'vehiculo' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenComments(tarea)}
                            title="Ver comentarios"
                          >
                            <MessageSquare className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditTask(tarea, 'vehiculo')}
                            title="Editar tarea"
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {showTaskForm && (
            <TaskForm
              isOpen={showTaskForm}
              onClose={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
              task={editingTask?.tipo === 'vehiculo' ? editingTask : null}
              vehiculos={vehiculos}
              onSave={handleSaveTask}
              users={systemUsers}
            />
          )}
          {showClientTaskForm && (
             <ClientTaskForm
                isOpen={showClientTaskForm}
                onClose={() => setShowClientTaskForm(false)}
                onSave={handleSaveClientTask}
                clientes={clientes}
                users={systemUsers}
              />
          )}
          {showComentarioForm && ( // New: ComentarioTareaForm
            <ComentarioTareaForm
              isOpen={showComentarioForm}
              onClose={() => setShowComentarioForm(false)}
              tarea={selectedTask}
              onSave={() => {
                loadData(); // Reload all data including comments after saving
                setShowComentarioForm(false);
              }}
            />
          )}
        </AnimatePresence>
        
        {/* New: Dialog for viewing comments */}
        <Dialog open={showComentariosDialog} onOpenChange={setShowComentariosDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comentarios de la Tarea</DialogTitle>
              {selectedTask && (
                <p className="text-sm text-slate-500 mt-1">
                  {selectedTask.descripcion}
                </p>
              )}
            </DialogHeader>
            <div className="py-4">
              <div className="mb-4">
                <Button onClick={() => handleAddComment(selectedTask)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Agregar Comentario
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-3">
                {selectedTask && comentarios
                  .filter(c => c.tarea_id === selectedTask.id)
                  .sort((a,b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
                  .map(comment => {
                    const isImage = comment.nombre_archivo && /\.(jpg|jpeg|png|gif|webp)$/i.test(comment.nombre_archivo);
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
                {selectedTask && comentarios.filter(c => c.tarea_id === selectedTask.id).length === 0 && (
                  <p className="text-slate-500 text-center text-sm py-4">No hay comentarios para esta tarea.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComentariosDialog(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
