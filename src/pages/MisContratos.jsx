
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cliente } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Calendar, Truck, DollarSign, Download } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils"; 

export default function MisContratos() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.rol_sistema !== 'Cliente') {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      const clientesEncontrados = await Cliente.filter({ email: user.email });
      if (clientesEncontrados.length === 0) {
        throw new Error('No se encontró información del cliente');
      }

      const cliente = clientesEncontrados[0];
      setClienteData(cliente);

      const [contratosData, vehiculosData] = await Promise.all([
        Contrato.filter({ cliente_id: cliente.id }, '-created_date'),
        Vehiculo.list()
      ]);

      setContratos(contratosData);
      setVehiculos(vehiculosData);

    } catch (error) {
      console.error('Error cargando contratos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehiculoInfo = (vehiculoId) => {
    return vehiculos.find(v => v.id === vehiculoId) || {};
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: 'bg-emerald-100 text-emerald-800',
      finalizado: 'bg-slate-100 text-slate-800',
      cancelado: 'bg-red-100 text-red-800',
      en_mora: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const filteredContratos = contratos.filter(contrato =>
    contrato.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.vehiculo_descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-slate-200 rounded mb-4 animate-pulse"></div>
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Mis Contratos
          </h1>
          <p className="text-slate-600 font-medium">
            Consulte el detalle de todos sus contratos de leasing
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
        </motion.div>

        <div className="space-y-6">
          {filteredContratos.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No se encontraron contratos</h3>
                <p className="text-slate-600">
                  {searchTerm ? 'No hay contratos que coincidan con su búsqueda.' : 'Aún no tiene contratos registrados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContratos.map((contrato, index) => {
              const vehiculo = getVehiculoInfo(contrato.vehiculo_id);
              
              return (
                <motion.div
                  key={contrato.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">
                              Contrato {contrato.numero_contrato}
                            </CardTitle>
                            <p className="text-slate-600">
                              {contrato.vehiculo_descripcion || `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}`}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(contrato.estatus)}>
                          {contrato.estatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-600">Vehículo</span>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {vehiculo.placas || contrato.vehiculo_numero_economico}
                            </p>
                            <p className="text-sm text-slate-600">
                              {vehiculo.marca} {vehiculo.modelo} {vehiculo.año}
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-600">Periodo</span>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {format(new Date(contrato.fecha_inicio), 'dd/MM/yyyy')} - {' '}
                              {contrato.fecha_fin ? format(new Date(contrato.fecha_fin), 'dd/MM/yyyy') : 'N/A'}
                            </p>
                            <p className="text-sm text-slate-600">
                              {contrato.plazo_semanas} semanas
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-600">Renta Semanal</span>
                            </div>
                            <p className="font-bold text-2xl text-emerald-600">
                              ₡{contrato.renta_semanal?.toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-slate-600">Gastos Administrativos</span>
                            <p className="font-semibold text-slate-900">
                              ₡{contrato.gastos_administrativos?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Progreso</span>
                            <p className="font-semibold text-slate-900">
                              {contrato.semanas_pagadas || 0} / {contrato.plazo_semanas} semanas
                            </p>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${Math.min(100, ((contrato.semanas_pagadas || 0) / contrato.plazo_semanas) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-slate-600">Vendedor</span>
                            <p className="font-semibold text-slate-900">
                              {contrato.vendedor_nombre || 'No asignado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
