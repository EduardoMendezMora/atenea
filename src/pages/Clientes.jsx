
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cliente } from "@/api/entities";
import { TareaCliente } from "@/api/entities";
import { NotaCliente } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Factura } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Edit,
  Calendar,
  ClipboardList,
  StickyNote,
  TrendingUp,
  FileText,
  Users,
  Eye,
  UserCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ClientForm from "../components/crm/ClientForm";

export default function Clientes() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // CORREGIDO: Permitir que más roles vean todos los datos
      const canSeeAll = user.role === 'admin' || 
                        user.rol_sistema === 'Gerente' || 
                        user.rol_sistema === 'Jefatura' ||
                        user.rol_sistema === 'Vendedor' ||
                        user.rol_sistema === 'Contador' ||
                        user.rol_sistema === 'Operaciones';

      let clientesData;
      if (canSeeAll) {
        clientesData = await Cliente.list('-created_date');
      } else {
        clientesData = await Cliente.filter({ asignado_a_id: user.id }, '-created_date');
      }
      setClientes(clientesData);

      // Cargar todos los datos relacionados
      const [
        allTareas, 
        allNotas, 
        allContratos, 
        allFacturas, 
        allUsers
      ] = await Promise.all([
        TareaCliente.list(),
        NotaCliente.list(),
        Contrato.list(),
        Factura.list(),
        User.list()
      ]);

      if (canSeeAll) {
        // Si puede ver todo, usar todos los datos
        setTareas(allTareas);
        setNotas(allNotas);
        setContratos(allContratos);
        setFacturas(allFacturas);
        setSystemUsers(allUsers);
      } else {
        // Si no, filtrar los datos relacionados a sus clientes
        const misClienteIds = new Set(clientesData.map(c => c.id));
        
        setTareas(allTareas.filter(t => misClienteIds.has(t.cliente_id)));
        setNotas(allNotas.filter(n => misClienteIds.has(n.cliente_id)));
        setContratos(allContratos.filter(c => misClienteIds.has(c.cliente_id)));
        setFacturas(allFacturas.filter(f => misClienteIds.has(f.cliente_id)));
        setSystemUsers(allUsers);
      }
      
    } catch (error) {
      console.error("❌ Error cargando datos en Clientes:", error);
    }
    setIsLoading(false);
  };

  const handleSaveClient = async (clienteData) => {
    if (editingCliente) {
      await Cliente.update(editingCliente.id, clienteData);
    } else {
      await Cliente.create(clienteData);
    }
    setShowForm(false);
    setEditingCliente(null);
    loadData();
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleViewDetail = (cliente) => {
    const url = createPageUrl(`ClienteDetalle?id=${cliente.id}`);
    navigate(url);
  };

  const getClientStats = (clienteId) => {
    return {
      contratos: contratos.filter(c => c.cliente_id === clienteId).length,
      contratosActivos: contratos.filter(c => c.cliente_id === clienteId && c.estatus === 'activo').length,
      tareasPendientes: tareas.filter(t => t.cliente_id === clienteId && t.estatus === 'pendiente').length,
      ultimaFactura: facturas.filter(f => f.cliente_id === clienteId).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0],
      ingresosTotales: facturas.filter(f => f.cliente_id === clienteId && f.estatus === 'pagada').reduce((sum, f) => sum + (f.monto || 0), 0)
    };
  };

  const filteredClientes = clientes.filter(cliente =>
    (cliente.nombre_empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.rfc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.contacto_principal || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    const colors = {
      activo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      inactivo: 'bg-slate-100 text-slate-800 border-slate-200',
      moroso: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getTipoColor = (tipo) => {
    const colors = {
      corporativo: 'bg-blue-100 text-blue-800',
      pyme: 'bg-purple-100 text-purple-800',
      individual: 'bg-orange-100 text-orange-800'
    };
    return colors[tipo] || 'bg-slate-100 text-slate-800';
  };

  const stats = {
    total: clientes.length,
    activos: clientes.filter(c => c.estatus === 'activo').length,
    tareasPendientes: tareas.filter(t => t.estatus === 'pendiente').length,
    oportunidades: tareas.filter(t => t.tipo_tarea === 'cotizacion' && t.estatus === 'pendiente').length
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
              CRM - Gestión de Clientes
            </h1>
            <p className="text-slate-600 font-medium">
              Centro de relaciones con clientes • {clientes.length} registrados
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Clientes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Activos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.activos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tareas Pendientes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.tareasPendientes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Oportunidades</p>
                <p className="text-3xl font-bold text-slate-900">{stats.oportunidades}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por empresa, RFC o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClientes.map((cliente, index) => {
                const clientStats = getClientStats(cliente.id);

                return (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white group h-full flex flex-col">
                      <CardHeader className="border-b border-slate-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                                {cliente.nombre_empresa}
                              </CardTitle>
                              <p className="text-sm text-slate-600 font-mono">{cliente.rfc}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetail(cliente)}
                              className="hover:bg-slate-100 text-blue-600"
                              title="Ver detalles del cliente"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cliente)}
                              className="hover:bg-slate-100"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow flex flex-col">
                        <div className="space-y-3 flex-grow">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">{cliente.contacto_principal}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 truncate">{cliente.email}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Badge className={getTipoColor(cliente.tipo_cliente)}>
                              {cliente.tipo_cliente}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(cliente.estatus)}>
                              {cliente.estatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Contratos</p>
                              <p className="text-sm font-bold text-slate-900">
                                {clientStats.contratosActivos}/{clientStats.contratos}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium">Ingresos</p>
                              <p className="text-sm font-bold text-emerald-600">
                                ₡{clientStats.ingresosTotales.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {clientStats.tareasPendientes > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-500" />
                                <span className="text-sm text-orange-600 font-medium">
                                  {clientStats.tareasPendientes} tarea{clientStats.tareasPendientes > 1 ? 's' : ''} pendiente{clientStats.tareasPendientes > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 mt-auto">
                           {cliente.asignado_a_nombre && (
                            <div className="pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-500 font-medium">Asignado a:</span>
                                <span className="text-xs text-slate-800 font-semibold">{cliente.asignado_a_nombre}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <ClientForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingCliente(null);
          }}
          cliente={editingCliente}
          onSave={handleSaveClient}
          users={systemUsers}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
