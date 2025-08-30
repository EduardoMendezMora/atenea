
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cliente } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Receipt, Search, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { createPageUrl } from "@/utils";

export default function MisFacturas() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pendientes");
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

      const [facturasData, contratosData] = await Promise.all([
        Factura.filter({ cliente_id: cliente.id }, '-created_date'),
        Contrato.filter({ cliente_id: cliente.id })
      ]);

      setFacturas(facturasData);
      setContratos(contratosData);

    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-orange-100 text-orange-800',
      pagada: 'bg-emerald-100 text-emerald-800',
      vencida: 'bg-red-100 text-red-800',
      cancelada: 'bg-slate-100 text-slate-800',
      futura: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusIcon = (factura) => {
    const daysDiff = differenceInDays(new Date(factura.fecha_vencimiento), new Date());
    
    if (factura.estatus === 'pagada') {
      return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    } else if (factura.estatus === 'vencida' || daysDiff < 0) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    } else {
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getDaysUntilDue = (fecha_vencimiento) => {
    const days = differenceInDays(new Date(fecha_vencimiento), new Date());
    if (days < 0) {
      return `Vencida hace ${Math.abs(days)} días`;
    } else if (days === 0) {
      return "Vence hoy";
    } else if (days === 1) {
      return "Vence mañana";
    } else {
      return `Vence en ${days} días`;
    }
  };

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.concepto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "todas" || factura.estatus === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    pendientes: facturas.filter(f => f.estatus === 'pendiente').length,
    pagadas: facturas.filter(f => f.estatus === 'pagada').length,
    vencidas: facturas.filter(f => f.estatus === 'vencida').length,
    totalPendiente: facturas
      .filter(f => f.estatus === 'pendiente')
      .reduce((sum, f) => sum + (f.monto || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 bg-slate-200 rounded mb-4 animate-pulse"></div>
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
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
            Mis Facturas
          </h1>
          <p className="text-slate-600 font-medium">
            Consulte el estado de todas sus facturas y pagos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pendientes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendientes}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pagadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.pagadas}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Vencidas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total por Pagar</p>
                  <p className="text-xl font-bold text-slate-900">₡{stats.totalPendiente.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white shadow-sm">
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="pagadas">Pagadas</TabsTrigger>
              <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
              <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          {filteredFacturas.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Receipt className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No se encontraron facturas</h3>
                <p className="text-slate-600">
                  {searchTerm ? 'No hay facturas que coincidan con su búsqueda.' : 'No tiene facturas en esta categoría.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFacturas.map((factura, index) => (
              <motion.div
                key={factura.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          {getStatusIcon(factura)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">
                            Factura {factura.numero_factura}
                          </h3>
                          <p className="text-slate-600">
                            {factura.concepto || `Semana ${factura.semana_facturada}`}
                          </p>
                          <p className="text-sm text-slate-500">
                            Periodo: {factura.periodo_inicio ? format(new Date(factura.periodo_inicio), 'dd/MM') : 'N/A'} - {factura.periodo_fin ? format(new Date(factura.periodo_fin), 'dd/MM/yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 mb-2">
                          ₡{factura.monto?.toLocaleString()}
                        </p>
                        <Badge className={getStatusColor(factura.estatus)}>
                          {factura.estatus}
                        </Badge>
                        <p className="text-sm text-slate-500 mt-1">
                          {getDaysUntilDue(factura.fecha_vencimiento)}
                        </p>
                      </div>
                    </div>

                    {factura.estatus === 'pendiente' && (
                      <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">
                              Vencimiento: {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-xs text-orange-600">
                              Para realizar su pago, comuníquese con nuestro departamento de cobros
                            </p>
                          </div>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            Contactar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
