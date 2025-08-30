import React, { useState, useEffect } from "react";
import { Vehiculo } from "@/api/entities";
import { FotoVehiculo } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Truck } from "lucide-react";

// Componente para la tarjeta de cada vehículo en el catálogo
function CatalogoCard({ vehiculo, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="w-full"
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 flex flex-col h-full">
        <div className="aspect-video bg-slate-200 overflow-hidden">
          {vehiculo.foto_principal ? (
            <img 
              src={vehiculo.foto_principal} 
              alt={`${vehiculo.marca} ${vehiculo.modelo}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
              <Truck className="w-16 h-16" />
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-slate-900 mb-1">{vehiculo.marca} {vehiculo.modelo}</h3>
          <p className="text-sm text-slate-600 mb-3 font-medium">Año: {vehiculo.año}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {vehiculo.transmision && <Badge variant="secondary">{vehiculo.transmision}</Badge>}
            {vehiculo.combustible && <Badge variant="secondary">{vehiculo.combustible}</Badge>}
            {vehiculo.carroceria && <Badge variant="secondary">{vehiculo.carroceria}</Badge>}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Renta semanal desde</p>
            <p className="text-2xl font-extrabold text-blue-600">
              ₡{vehiculo.renta_semanal ? vehiculo.renta_semanal.toLocaleString() : '0'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Página principal del catálogo
export default function CatalogoPublico() {
  const [vehiculos, setVehiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [vehiculosDisponibles, todasLasFotos] = await Promise.all([
          Vehiculo.filter({ estatus: 'disponible' }),
          FotoVehiculo.list()
        ]);
        
        // Mapear la primera foto a cada vehículo
        const vehiculosConFotos = vehiculosDisponibles.map(vehiculo => {
          const fotoPrincipal = todasLasFotos.find(foto => foto.vehiculo_id === vehiculo.id);
          return {
            ...vehiculo,
            foto_principal: fotoPrincipal?.url_foto || null
          };
        });

        setVehiculos(vehiculosConFotos);
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
        <p className="text-lg text-slate-600 animate-pulse">Cargando catálogo de vehículos...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">ArrendautosAPP</h1>
        </div>
        <h2 className="text-2xl font-semibold text-blue-700">Catálogo de Vehículos Disponibles</h2>
        <p className="text-slate-600 mt-2">Explore nuestra flota de vehículos listos para arrendamiento.</p>
      </header>

      <main className="max-w-6xl mx-auto">
        {vehiculos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehiculos.map((vehiculo, index) => (
              <CatalogoCard key={vehiculo.id} vehiculo={vehiculo} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Truck className="w-20 h-20 mx-auto text-slate-300 mb-6" />
            <h3 className="text-xl font-semibold text-slate-700">No hay vehículos disponibles en este momento</h3>
            <p className="text-slate-500 mt-2">Por favor, vuelve a consultar más tarde.</p>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto text-center mt-12 pt-8 border-t border-slate-200">
        <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} ArrendautosAPP. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}