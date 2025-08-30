
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { Vehiculo } from "@/api/entities";
import { TareaVehiculo } from "@/api/entities";
import { User } from "@/api/entities";
import { Marca } from "@/api/entities";
import { Modelo } from "@/api/entities";
import { Carroceria } from "@/api/entities";
import { Combustible } from "@/api/entities";
import { Arrendadora } from "@/api/entities";
import { Transmision } from "@/api/entities";
import { Traccion } from "@/api/entities";
import { EstadoVehiculo } from "@/api/entities";
import { EstadoInventario } from "@/api/entities";
import { UbicacionVehiculo } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Truck, Wrench, AlertTriangle, Calendar } from "lucide-react";
import { createPageUrl } from '@/utils';

import VehicleCard from "../components/vehiculos/VehicleCard";
import VehicleForm from "../components/vehiculos/VehicleForm";
import TaskForm from "../components/vehiculos/TaskForm";

export default function Vehiculos() {
  const navigate = useNavigate();
  const [vehiculos, setVehiculos] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedVehicleForTask, setSelectedVehicleForTask] = useState(null);

  // Catalog states
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
  const [systemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
        const user = await User.me();
        console.log("=== DEBUG VEHICULOS ===");
        console.log("Current user:", user);
        console.log("User role:", user.role);
        console.log("User rol_sistema:", user.rol_sistema);
        console.log("User email:", user.email);
        
        // SIMPLIFICADO: Por ahora, TODOS los usuarios autenticados ven TODO
        // Excepto si específicamente tienen rol_sistema = 'Cliente'
        const isClient = user.rol_sistema === 'Cliente';
        const canSeeAllData = !isClient;

        console.log("Is client:", isClient);
        console.log("Can see all data:", canSeeAllData);

        // Cargar datos
        let vehiculosData = [];
        let tareasData = [];
        let usersData = [];

        if (canSeeAllData) {
            console.log("Loading all data for non-client user...");
            
            try {
                vehiculosData = await Vehiculo.list('-created_date');
                console.log("✅ Vehiculos loaded:", vehiculosData.length);
            } catch (error) {
                console.error("❌ Error loading vehiculos:", error);
                vehiculosData = [];
            }

            try {
                tareasData = await TareaVehiculo.list('-fecha_programada');
                console.log("✅ Tareas loaded:", tareasData.length);
            } catch (error) {
                console.error("❌ Error loading tareas:", error);
                tareasData = [];
            }

            try {
                usersData = await User.list();
                console.log("✅ Users loaded:", usersData.length);
            } catch (error) {
                console.error("❌ Error loading users:", error);
                usersData = [];
            }
        } else {
            console.log("User is client - loading limited data");
            vehiculosData = [];
            tareasData = [];
            usersData = [];
        }

        // Cargar catálogos SIEMPRE
        console.log("Loading catalogs...");
        let marcasData = [], modelosData = [], carroceriasData = [], 
            combustiblesData = [], arrendadorasData = [], transmisionesData = [], 
            traccionesData = [], estadosVehiculoData = [], estadosInventarioData = [], 
            ubicacionesData = [];

        try {
            [
                marcasData, modelosData, carroceriasData, 
                combustiblesData, arrendadorasData, transmisionesData, traccionesData, 
                estadosVehiculoData, estadosInventarioData, ubicacionesData
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
            
            console.log("✅ Catalogs loaded - Marcas:", marcasData?.length, "Modelos:", modelosData?.length);
        } catch (error) {
            console.error("❌ Error loading catalogs:", error);
        }
        
        // Actualizar estados
        console.log("Setting state with data...");
        setVehiculos(vehiculosData || []);
        setTareas(tareasData || []);
        setSystemUsers(usersData || []);
        setMarcas(marcasData || []);
        setModelos(modelosData || []);
        setCarrocerias(carroceriasData || []);
        setCombustibles(combustiblesData || []);
        setArrendadoras(arrendadorasData || []);
        setTransmisiones(transmisionesData || []);
        setTracciones(traccionesData || []);
        setEstadosVehiculo(estadosVehiculoData || []);
        setEstadosInventario(estadosInventarioData || []);
        setUbicaciones(ubicacionesData || []);

        console.log("=== END DEBUG ===");

    } catch(error) {
        console.error("❌ FATAL ERROR loading data:", error);
        // En caso de error, limpiar estados
        setVehiculos([]);
        setTareas([]);
        setSystemUsers([]);
        setMarcas([]);
        setModelos([]);
        setCarrocerias([]);
        setCombustibles([]);
        setArrendadoras([]);
        setTransmisiones([]);
        setTracciones([]);
        setEstadosVehiculo([]);
        setEstadosInventario([]);
        setUbicaciones([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveVehicle = async (vehiculoData) => {
    try {
      console.log("Saving vehicle:", vehiculoData); // Debug log
      if (editingVehiculo) {
        await Vehiculo.update(editingVehiculo.id, vehiculoData);
      } else {
        await Vehiculo.create(vehiculoData);
      }
      setShowVehicleForm(false);
      setEditingVehiculo(null);
      loadData(); // Recargar todos los datos
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Error al guardar el vehículo: " + error.message);
    }
  };

  const handleEditVehicle = (vehiculo) => {
    console.log("Editing vehicle:", vehiculo); // Debug log
    setEditingVehiculo(vehiculo);
    setShowVehicleForm(true);
  };
  
  const handleViewDetails = (vehiculoId) => {
      const url = createPageUrl('VehiculoDetalle', { id: vehiculoId });
      navigate(url);
  };

  const handleAddTask = (vehiculo) => {
    setEditingTask(null);
    setSelectedVehicleForTask(vehiculo);
    setShowTaskForm(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        await TareaVehiculo.update(editingTask.id, taskData);
      } else {
        await TareaVehiculo.create(taskData);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      setSelectedVehicleForTask(null);
      loadData();
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const filteredVehiculos = vehiculos.filter(vehiculo => {
    const matchesSearch = vehiculo.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehiculo.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehiculo.placas?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "todos" || vehiculo.estatus === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: vehiculos.length,
    disponibles: vehiculos.filter(v => v.estatus === 'disponible').length,
    colocados: vehiculos.filter(v => v.estatus === 'colocado').length,
    enTaller: vehiculos.filter(v => v.estatus === 'en_taller').length,
    tareasPendientes: tareas.filter(t => t.estatus === 'pendiente').length
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
              Gestión de Vehículos
            </h1>
            <p className="text-slate-600 font-medium">
              Control integral de la flota • {vehiculos.length} vehículos registrados
            </p>
          </div>
          <Button
            onClick={() => {
              console.log("Opening vehicle form with catalogs:", { 
                marcas: marcas.length, 
                modelos: modelos.length 
              }); // Debug log
              setEditingVehiculo(null);
              setShowVehicleForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
          </Button>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="flex flex-col items-center justify-center p-4 shadow-sm bg-white border-slate-200">
            <Truck className="w-8 h-8 text-blue-600 mb-2" />
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            <CardContent className="p-0 text-sm text-slate-500">Vehículos Totales</CardContent>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 shadow-sm bg-white border-slate-200">
            <Truck className="w-8 h-8 text-green-600 mb-2" />
            <CardTitle className="text-2xl font-bold">{stats.disponibles}</CardTitle>
            <CardContent className="p-0 text-sm text-slate-500">Disponibles</CardContent>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 shadow-sm bg-white border-slate-200">
            <Truck className="w-8 h-8 text-orange-600 mb-2" />
            <CardTitle className="text-2xl font-bold">{stats.colocados}</CardTitle>
            <CardContent className="p-0 text-sm text-slate-500">Colocados</CardContent>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 shadow-sm bg-white border-slate-200">
            <Wrench className="w-8 h-8 text-red-600 mb-2" />
            <CardTitle className="text-2xl font-bold">{stats.enTaller}</CardTitle>
            <CardContent className="p-0 text-sm text-slate-500">En Taller</CardContent>
          </Card>
          <Card className="flex flex-col items-center justify-center p-4 shadow-sm bg-white border-slate-200">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mb-2" />
            <CardTitle className="text-2xl font-bold">{stats.tareasPendientes}</CardTitle>
            <CardContent className="p-0 text-sm text-slate-500">Tareas Pendientes</CardContent>
          </Card>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar vehículos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="disponible">Disponibles</TabsTrigger>
              <TabsTrigger value="colocado">Colocados</TabsTrigger>
              <TabsTrigger value="en_taller">En Taller</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Vehicle grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredVehiculos.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-500 mb-2">No hay vehículos</h3>
            <p className="text-slate-400">
              {vehiculos.length === 0 
                ? "Aún no se han registrado vehículos en el sistema." 
                : "No se encontraron vehículos con los filtros aplicados."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredVehiculos.map((vehiculo, index) => (
              <VehicleCard
                key={vehiculo.id}
                vehiculo={vehiculo}
                onEdit={handleEditVehicle}
                onViewDetails={() => handleViewDetails(vehiculo.id)}
                onAddTask={handleAddTask}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Debug info - TEMPORAL */}
        {!isLoading && (
          <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-600">
            <strong>Debug Info:</strong> Vehículos: {vehiculos.length} | 
            Marcas: {marcas.length} | Modelos: {modelos.length} | 
            Form Open: {showVehicleForm ? 'Sí' : 'No'}
          </div>
        )}

        {/* Vehicle Form Dialog */}
        {showVehicleForm && (
          <VehicleForm
            isOpen={showVehicleForm}
            onClose={() => {
              console.log("Closing vehicle form"); // Debug log
              setShowVehicleForm(false);
              setEditingVehiculo(null);
            }}
            vehiculo={editingVehiculo}
            onSave={handleSaveVehicle}
            users={systemUsers}
            marcas={marcas}
            modelos={modelos}
            carrocerias={carrocerias}
            combustibles={combustibles}
            arrendadoras={arrendadoras}
            transmisiones={transmisiones}
            tracciones={tracciones}
            estadosVehiculo={estadosVehiculo}
            estadosInventario={estadosInventario}
            ubicaciones={ubicaciones}
            onCatalogUpdate={loadData}
          />
        )}

        {/* Task Form Dialog */}
        {showTaskForm && (
          <TaskForm
            isOpen={showTaskForm}
            onClose={() => {
              setShowTaskForm(false);
              setEditingTask(null);
              setSelectedVehicleForTask(null);
            }}
            vehiculo={editingTask ? editingTask.vehiculo : selectedVehicleForTask}
            vehiculos={vehiculos}
            task={editingTask}
            onSave={handleSaveTask}
            users={systemUsers}
          />
        )}
      </div>
    </div>
  );
}
