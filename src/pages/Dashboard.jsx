
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cliente } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { TareaCliente } from "@/api/entities";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Truck,
  AlertTriangle,
  ClipboardList,
  Hourglass
} from "lucide-react";

import MetricCard from "../components/dashboard/MetricCard";
import RecentActivity from "../components/dashboard/RecentActivity";

// Helper function to determine the type of an activity item
// This function is inferred from the outline's logic.
const getItemType = (item) => {
  if (item && (item.hasOwnProperty('numero_economico') || item.hasOwnProperty('placas'))) return 'vehiculo';
  if (item && item.hasOwnProperty('nombre_empresa') && item.hasOwnProperty('identificacion')) return 'cliente';
  if (item && item.hasOwnProperty('numero_contrato') && item.hasOwnProperty('monto')) return 'contrato';
  if (item && item.hasOwnProperty('numero_factura') && item.hasOwnProperty('monto')) return 'factura';
  if (item && item.hasOwnProperty('descripcion') && item.hasOwnProperty('fecha_creacion')) return 'tarea'; // Assuming structure for TareaCliente
  return 'desconocido';
};

// Helper function to get display information for an activity item
// This function is constructed based on the outline's explicit cases and inferred needs.
const getItemInfo = (item) => {
  const type = getItemType(item);
  switch(type) {
    case 'vehiculo':
      return {
        icon: Truck,
        title: item.placas || item.numero_economico || 'Vehículo',
        description: `Vehículo ${item.marca || ''} ${item.modelo || ''} - ${item.estatus || 'Desconocido'}`,
        link: item.id ? `/vehiculos/${item.id}` : null
      };
    case 'cliente':
      return {
        icon: Users,
        title: item.nombre_empresa || item.nombre_completo || 'Cliente',
        description: `ID: ${item.identificacion || ''}`,
        link: item.id ? `/clientes/${item.id}` : null
      };
    case 'contrato':
      return {
        icon: FileText,
        title: `Contrato ${item.numero_contrato || ''}`,
        description: `Monto: ₡${item.monto?.toLocaleString() || 'N/A'} - Estatus: ${item.estatus || 'Desconocido'}`,
        link: item.id ? `/contratos/${item.id}` : null
      };
    case 'factura':
      return {
        icon: DollarSign,
        title: `Factura ${item.numero_factura || ''}`,
        description: `Monto: ₡${item.monto?.toLocaleString() || 'N/A'} - Cliente: ${item.cliente_nombre || 'N/A'} - Estatus: ${item.estatus || 'Desconocido'}`,
        link: item.id ? `/facturas/${item.id}` : null
      };
    case 'tarea': // New case for tasks
      return {
        icon: ClipboardList,
        title: `Tarea: ${item.titulo || 'Sin título'}`,
        description: `Asignada a: ${item.asignado_a || 'N/A'} - Estatus: ${item.estatus || 'Desconocido'}`,
        link: item.id ? `/tareas/${item.id}` : null // Assuming a path for tasks
      };
    default:
      return {
        icon: null,
        title: 'Item desconocido',
        description: 'Información no disponible',
        link: null
      };
  }
};


export default function Dashboard() {
  // Keeping individual state variables to ensure RecentActivity and other components still receive lists
  // and to avoid breaking existing functionality, while also implementing the new stats logic.
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tareas, setTareas] = useState([]); // New state for tareas

  const [stats, setStats] = useState({
    clientesActivos: 0,
    contratosActivos: 0,
    vehiculosDisponibles: 0,
    facturasPendientes: 0,
    tareasPendientes: 0,
    ingresosMesActual: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch data for individual lists (used by RecentActivity and other sections)
        const [allClientes, allContratos, allFacturas, allVehiculos] = await Promise.all([
          Cliente.list(), // All clients
          Contrato.list('-created_date'), // All contracts, sorted
          Factura.list('-created_date'), // All invoices, sorted
          Vehiculo.list() // All vehicles
        ]);
        setClientes(allClientes);
        setContratos(allContratos);
        setFacturas(allFacturas);
        setVehiculos(allVehiculos);

        // Fetch filtered data specifically for dashboard stats, as per outline
        const [
          activeClientesData,
          activeContratosData,
          availableVehiculosData,
          pendingFacturasData,
          pendingTareasData,
          paidFacturasThisMonthData
        ] = await Promise.all([
          Cliente.filter({ estatus: 'activo' }),
          Contrato.filter({ estatus: 'activo' }),
          Vehiculo.filter({ estatus: 'Disponible' }),
          Factura.filter({ estatus: 'pendiente' }),
          TareaCliente.filter({ estatus: 'pendiente' }),
          Factura.filter({ estatus: 'pagada' }), // For monthly income calculation
        ]);

        setTareas(pendingTareasData); // Update tasks state

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const ingresos = paidFacturasThisMonthData
          .filter(f => {
            const paymentDate = new Date(f.fecha_pago);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
          })
          .reduce((sum, f) => sum + (f.monto || 0), 0);

        setStats({
          clientesActivos: activeClientesData.length,
          contratosActivos: activeContratosData.length,
          vehiculosDisponibles: availableVehiculosData.length,
          facturasPendientes: pendingFacturasData.length,
          tareasPendientes: pendingTareasData.length,
          ingresosMesActual: ingresos,
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setIsLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
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
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Dashboard General
          </h1>
          <p className="text-slate-600 font-medium">
            Resumen de la operación de leasing • {new Date().toLocaleDateString('es-ES')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Clientes Activos"
            value={stats.clientesActivos}
            icon={Users}
            color="blue"
            delay={0}
          />
          <MetricCard
            title="Contratos Activos"
            value={stats.contratosActivos}
            icon={FileText}
            color="purple"
            delay={0.1}
          />
          <MetricCard
            title="Vehículos Disponibles"
            value={stats.vehiculosDisponibles}
            icon={Truck}
            color="green"
            delay={0.2}
          />
          <MetricCard
            title="Facturas Pendientes"
            value={stats.facturasPendientes}
            icon={Hourglass}
            color="orange"
            delay={0.3}
          />
          <MetricCard
            title="Tareas Pendientes"
            value={stats.tareasPendientes}
            icon={ClipboardList}
            color="blue"
            delay={0.4}
          />
          <MetricCard
            title="Ingresos del Mes"
            value={`₡${stats.ingresosMesActual.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            delay={0.5}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity
              facturas={facturas}
              contratos={contratos}
              // Optionally include other recent activities if getItemType and getItemInfo are expanded:
              // vehiculos={vehiculos}
              // tareas={tareas}
              // getItemInfo={getItemInfo} // Pass the helper if RecentActivity is generic
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Crecimiento</h3>
                  <p className="text-blue-100">Este mes</p>
                </div>
              </div>
              <div className="text-3xl font-bold mb-2">
                +{Math.max(0, contratos.filter(c => {
                  const createdDate = new Date(c.created_date);
                  const oneMonthAgo = new Date();
                  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                  return createdDate >= oneMonthAgo;
                }).length)}
              </div>
              <p className="text-blue-100">nuevos contratos</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-0">
              <div className="flex items-center gap-3 mb-4">
                <Hourglass className="w-5 h-5 text-slate-600" />
                <h3 className="font-bold text-slate-900">Próximos Vencimientos</h3>
              </div>
              {facturas.filter(f => f.estatus === 'pendiente').slice(0, 3).length === 0 ? (
                <p className="text-slate-500 text-center py-4">Sin vencimientos próximos</p>
              ) : (
                <div className="space-y-3">
                  {facturas.filter(f => f.estatus === 'pendiente').slice(0, 3).map(factura => (
                    <div key={factura.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{factura.cliente_nombre}</p>
                        <p className="text-xs text-slate-600">{factura.numero_factura}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">₡{factura.monto?.toLocaleString()}</p>
                        <p className="text-xs text-orange-600">Vence pronto</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
