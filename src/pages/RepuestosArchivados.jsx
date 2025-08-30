
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SolicitudRepuesto } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Archive, Search, ArrowLeft, Truck, X, RefreshCcw } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function RepuestosArchivados() {
  const navigate = useNavigate();
  const [solicitudesArchivadas, setSolicitudesArchivadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArchivados();
  }, []);

  const loadArchivados = async () => {
    setIsLoading(true);
    try {
      const data = await SolicitudRepuesto.filter(
        { archivado: true },
        '-updated_date'
      );
      setSolicitudesArchivadas(data);
    } catch (error) {
      console.error("Error cargando solicitudes archivadas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = async (solicitud) => {
    if (!window.confirm("¿Seguro que quieres desarchivar esta solicitud? Volverá al tablero principal en estado 'Solicitado'.")) {
        return;
    }
    try {
        await SolicitudRepuesto.update(solicitud.id, { 
            archivado: false, 
            estatus: 'solicitado' 
        });
        
        // Remove from the local state to update UI immediately
        setSolicitudesArchivadas(prev => prev.filter(s => s.id !== solicitud.id));

    } catch (error) {
        console.error("Error al desarchivar la solicitud:", error);
        alert("Hubo un error al intentar desarchivar la solicitud.");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      entregado: { icon: Truck, color: 'text-green-600 bg-green-100' },
      cancelado: { icon: X, color: 'text-red-600 bg-red-100' },
    };
    return configs[status] || { icon: Archive, color: 'text-slate-600 bg-slate-100' };
  };

  const filteredSolicitudes = solicitudesArchivadas.filter(s => 
    s.nombre_repuesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.solicitado_por_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('Repuestos'))}>
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                    Solicitudes Archivadas
                </h1>
                <p className="text-slate-600 font-medium">
                    Historial de solicitudes de repuestos entregadas y canceladas.
                </p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar en el archivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b">
                            <tr className="text-left text-slate-600">
                                <th className="p-3 font-semibold">Repuesto</th>
                                <th className="p-3 font-semibold">Vehículo</th>
                                <th className="p-3 font-semibold">Solicitante</th>
                                <th className="p-3 font-semibold">Fecha Solicitud</th>
                                <th className="p-3 font-semibold">Fecha Archivo</th>
                                <th className="p-3 font-semibold">Estatus Final</th>
                                <th className="p-3 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center p-8">Cargando...</td></tr>
                            ) : filteredSolicitudes.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8 text-slate-500">No hay solicitudes archivadas.</td></tr>
                            ) : (
                                filteredSolicitudes.map(solicitud => {
                                    const { icon: Icon, color } = getStatusConfig(solicitud.estatus);
                                    return (
                                        <tr key={solicitud.id} className="border-b hover:bg-slate-50">
                                            <td className="p-3 font-semibold text-slate-800">{solicitud.nombre_repuesto} (x{solicitud.cantidad})</td>
                                            <td className="p-3">{solicitud.numero_economico}</td>
                                            <td className="p-3">{solicitud.solicitado_por_nombre}</td>
                                            <td className="p-3">{format(new Date(solicitud.created_date), 'dd/MM/yyyy')}</td>
                                            <td className="p-3">{format(new Date(solicitud.updated_date), 'dd/MM/yyyy')}</td>
                                            <td className="p-3">
                                                <Badge className={`capitalize ${color}`}>
                                                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                                                    {solicitud.estatus}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleUnarchive(solicitud)}
                                                    title="Desarchivar y devolver al tablero"
                                                >
                                                    <RefreshCcw className="w-4 h-4 text-blue-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
