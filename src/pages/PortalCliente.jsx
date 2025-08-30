import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cliente } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { TramiteCliente } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Receipt, 
  Truck, 
  CreditCard, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PortalCliente() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tramites, setTramites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.rol_sistema !== 'Cliente') {
        // Redirigir si no es cliente
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      // Buscar cliente por email del usuario
      const clientesEncontrados = await Cliente.filter({ email: user.email });
      if (clientesEncontrados.length === 0) {
        throw new Error('No se encontró información del cliente');
      }

      const cliente = clientesEncontrados[0];
      setClienteData(cliente);

      // Cargar datos relacionados al cliente
      const [contratosData, facturasData, vehiculosData, tramitesData] = await Promise.all([
        Contrato.filter({ cliente_id: cliente.id }),
        Factura.filter({ cliente_id: cliente.id }),
        Vehiculo.filter({ cliente_actual: cliente.nombre_empresa }),
        TramiteCliente.filter({ cliente_id: cliente.id })
      ]);

      setContratos(contratosData);
      setFacturas(facturasData);
      setVehiculos(vehiculosData);
      setTramites(tramitesData);

    } catch (error) {
      console.error('Error cargando datos del cliente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    contratosActivos: contratos.filter(c => c.estatus === 'activo').length,
    facturasPendientes: facturas.filter(f => f.estatus === 'pendiente').length,
    vehiculosActivos: vehiculos.filter(v => v.estatus === 'colocado').length,
    tramitesEnProceso: tramites.filter(t => !['aprobado', 'rechazado', 'contrato_emitido'].includes(t.estatus)).length
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!clienteData) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error de Acceso</h2>
            <p className="text-slate-600 mb-4">
              No se pudo cargar la información de su perfil de cliente.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
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
            Bienvenido, {clienteData.nombre_empresa}
          </h1>
          <p className="text-slate-600 font-medium">
            Portal de Cliente • {new Date().toLocaleDateString('es-ES')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Contratos Activos</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.contratosActivos}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Facturas Pendientes</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.facturasPendientes}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Vehículos Activos</p>
                    <p className="text-3xl font-bold text-green-600">{stats.vehiculosActivos}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Trámites en Proceso</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.tramitesEnProceso}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Facturas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {facturas.slice(0, 5).length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No hay facturas recientes</p>
                ) : (
                  <div className="space-y-3">
                    {facturas.slice(0, 5).map(factura => (
                      <div key={factura.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">{factura.numero_factura}</p>
                          <p className="text-sm text-slate-600">
                            Vence: {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₡{factura.monto?.toLocaleString()}</p>
                          <Badge variant={factura.estatus === 'pendiente' ? 'destructive' : 'default'}>
                            {factura.estatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <Link to={createPageUrl('MisFacturas')}>
                    <Button variant="outline" className="w-full">Ver Todas las Facturas</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Mis Vehículos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehiculos.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No tiene vehículos asignados</p>
                ) : (
                  <div className="space-y-3">
                    {vehiculos.slice(0, 3).map(vehiculo => (
                      <div key={vehiculo.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-slate-900">{vehiculo.placas}</p>
                          <p className="text-sm text-slate-600">{vehiculo.marca} {vehiculo.modelo} {vehiculo.año}</p>
                        </div>
                        <Badge variant={vehiculo.estatus === 'colocado' ? 'default' : 'secondary'}>
                          {vehiculo.estatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <Link to={createPageUrl('MisVehiculos')}>
                    <Button variant="outline" className="w-full">Ver Todos los Vehículos</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">¿Necesita Ayuda?</h3>
                  <p className="text-slate-600 mb-4">
                    Nuestro equipo está disponible para asistirle con cualquier consulta sobre sus contratos o facturas.
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">+506 2222-3333</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">info@easycars.cr</span>
                    </div>
                  </div>
                </div>
                <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                  <Phone className="w-10 h-10 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}