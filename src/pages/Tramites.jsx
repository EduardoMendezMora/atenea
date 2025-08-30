
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TramiteCliente } from '@/api/entities';
import { RequisitoTramite } from '@/api/entities';
import { RequisitoMaestro } from '@/api/entities';
import { Cliente } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, PlusCircle, Eye, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Reusable Detail Dialog from ClienteDetalle
function TramiteDetailDialog({ tramite, requisitos, isOpen, onClose, onUpdate, users }) {
  // This component is not defined in the provided original code.
  // Assuming it's a placeholder for future implementation or resides elsewhere.
  // If it were functional, it would need its full implementation here.
  return null; // Placeholder to avoid syntax errors
}

// Dialog to create a new Trámite
function NewTramiteDialog({ isOpen, onClose, clientes, currentUser, onTramiteCreated }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreate = async () => {
    if (!selectedClientId) {
      alert("Por favor, seleccione un cliente.");
      return;
    }
    setIsCreating(true);
    const cliente = clientes.find(c => c.id === selectedClientId);

    try {
      const numeroTramite = `TR-${Date.now()}`;
      const tokenSeguimiento = generateToken();
      
      const tramite = await TramiteCliente.create({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_empresa,
        cliente_identificacion: cliente.rfc,
        numero_tramite: numeroTramite,
        token_seguimiento: tokenSeguimiento,
        fecha_inicio: new Date().toISOString().split('T')[0],
        estatus: "iniciado",
        asignado_a_id: currentUser?.id,
        asignado_a_nombre: currentUser?.full_name
      });

      const requisitosMaestros = await RequisitoMaestro.filter({ activo: true }, 'orden');
      for (const reqMaestro of requisitosMaestros) {
        await RequisitoTramite.create({
          tramite_id: tramite.id,
          tipo_requisito: reqMaestro.tipo_requisito,
          nombre_requisito: reqMaestro.nombre_requisito,
          descripcion: reqMaestro.descripcion,
          orden: reqMaestro.orden,
          obligatorio: true,
          completado: false
        });
      }
      
      onTramiteCreated();
      onClose();

    } catch (error) {
      console.error("Error creando el trámite:", error);
      alert("Hubo un error al crear el trámite.");
    } finally {
      setIsCreating(false);
      setSelectedClientId('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Nuevo Trámite</DialogTitle>
          <DialogDescription>Seleccione un cliente para crear un nuevo proceso de trámite.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar y seleccionar un cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes
                  .filter(cliente => cliente.nombre_empresa) // Filtrar clientes sin nombre
                  .sort((a, b) => (a.nombre_empresa || '').localeCompare(b.nombre_empresa || '')) // Validación de undefined
                  .map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre_empresa} ({cliente.rfc})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={isCreating || !selectedClientId}>
            {isCreating ? "Creando..." : "Crear Trámite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function Tramites() {
  const [tramites, setTramites] = useState([]);
  const [requisitos, setRequisitos] = useState([]); // This will hold all reqs for progress calculation
  const [clientes, setClientes] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTramiteDialog, setShowNewTramiteDialog] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const canSeeAll = user.role === 'admin' || user.rol_sistema === 'Gerente' || user.rol_sistema === 'Contador';
      
      let tramitesData;
      if (canSeeAll) {
        tramitesData = await TramiteCliente.list('-created_date');
      } else {
        tramitesData = await TramiteCliente.filter({ asignado_a_id: user.id }, '-created_date');
      }

      const [requisitosData, clientesData, usersData] = await Promise.all([
        RequisitoTramite.list(),
        Cliente.list(),
        User.list()
      ]);

      setTramites(tramitesData);
      setRequisitos(requisitosData);
      setClientes(clientesData);
      setUsers(usersData);

    } catch (error) {
      console.error('Error cargando datos de trámites:', error);
    }
    setIsLoading(false);
  };
  
  const calcularProgreso = useCallback((tramiteId) => {
    const requisitosDelTramite = requisitos.filter(r => r.tramite_id === tramiteId);
    if (requisitosDelTramite.length === 0) return 0;
    const completados = requisitosDelTramite.filter(r => r.completado).length;
    return Math.round((completados / requisitosDelTramite.length) * 100);
  }, [requisitos]);

  const getStatusColor = (status) => {
    const colors = {
      iniciado: 'bg-blue-100 text-blue-800',
      en_proceso: 'bg-yellow-100 text-yellow-800',
      pendiente_documentos: 'bg-orange-100 text-orange-800',
      revision: 'bg-purple-100 text-purple-800',
      aprobado: 'bg-emerald-100 text-emerald-800',
      rechazado: 'bg-red-100 text-red-800',
      contrato_emitido: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const filteredTramites = tramites.filter(tramite => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      tramite.cliente_nombre?.toLowerCase().includes(searchLower) ||
      tramite.numero_tramite?.toLowerCase().includes(searchLower) ||
      tramite.asignado_a_nombre?.toLowerCase().includes(searchLower);
    
    const matchesTab = activeTab === 'todos' || tramite.estatus === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: tramites.length,
    iniciado: tramites.filter(t => t.estatus === 'iniciado').length,
    en_proceso: tramites.filter(t => t.estatus === 'en_proceso').length,
    pendiente_documentos: tramites.filter(t => t.estatus === 'pendiente_documentos').length,
    aprobado: tramites.filter(t => t.estatus === 'aprobado').length
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Gestión de Trámites
            </h1>
            <p className="text-slate-600 font-medium">
              Centro de control para todos los procesos de solicitud de clientes.
            </p>
          </div>
           <Button onClick={() => setShowNewTramiteDialog(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Nuevo Trámite
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="border-0 shadow-lg"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-slate-600">Total</p><p className="text-3xl font-bold text-slate-900">{stats.total}</p></div></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-slate-600">Iniciados</p><p className="text-3xl font-bold text-slate-900">{stats.iniciado}</p></div></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-yellow-600" /></div><div><p className="text-sm text-slate-600">En Proceso</p><p className="text-3xl font-bold text-slate-900">{stats.en_proceso}</p></div></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-orange-600" /></div><div><p className="text-sm text-slate-600">Pend. Docs</p><p className="text-3xl font-bold text-slate-900">{stats.pendiente_documentos}</p></div></CardContent></Card>
            <Card className="border-0 shadow-lg"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-600" /></div><div><p className="text-sm text-slate-600">Aprobados</p><p className="text-3xl font-bold text-slate-900">{stats.aprobado}</p></div></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, número de trámite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="iniciado">Iniciados</TabsTrigger>
              <TabsTrigger value="en_proceso">En Proceso</TabsTrigger>
              <TabsTrigger value="pendiente_documentos">Pend. Docs</TabsTrigger>
              <TabsTrigger value="aprobado">Aprobados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tramites List */}
        {isLoading ? (
          <p>Cargando trámites...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTramites.map((tramite) => (
                <motion.div
                  key={tramite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white h-full flex flex-col">
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                            {tramite.cliente_nombre}
                          </CardTitle>
                          <p className="text-sm text-slate-600 font-mono">
                            {tramite.numero_tramite}
                          </p>
                        </div>
                        <Badge className={getStatusColor(tramite.estatus)}>
                          {tramite.estatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 flex-grow">
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600">
                                Asignado a: <span className="font-medium text-slate-800">{tramite.asignado_a_nombre || "Sin Asignar"}</span>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Progreso</span>
                                    <span>{calcularProgreso(tramite.id)}%</span>
                                </div>
                                <Progress value={calcularProgreso(tramite.id)} className="h-2 mt-1" />
                            </div>
                        </div>
                        <Button
                          onClick={() => alert(`Próximamente: Ver detalles de ${tramite.numero_tramite}`)}
                          className="w-full mt-4"
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Gestionar Trámite
                        </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </div>

       <NewTramiteDialog
        isOpen={showNewTramiteDialog}
        onClose={() => setShowNewTramiteDialog(false)}
        clientes={clientes}
        currentUser={currentUser}
        onTramiteCreated={loadData}
      />
    </div>
  );
}
