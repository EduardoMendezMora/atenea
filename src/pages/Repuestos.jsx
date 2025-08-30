
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SolicitudRepuesto } from '@/api/entities';
import { Vehiculo } from '@/api/entities';
import { User } from '@/api/entities'; // Added User import
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PackageSearch, Clock, Check, ShoppingCart, Archive, X, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  solicitado: { icon: Clock, label: 'Solicitado', color: 'bg-yellow-500 border-yellow-500/50' },
  cotizando: { icon: PackageSearch, label: 'Cotizando', color: 'bg-blue-500 border-blue-500/50' },
  aprobado: { icon: Check, label: 'Aprobado', color: 'bg-teal-500 border-teal-500/50' },
  comprado: { icon: ShoppingCart, label: 'Comprado', color: 'bg-indigo-500 border-indigo-500/50' },
};

const initialColumns = {
  solicitado: { name: 'Solicitado', items: [] },
  cotizando: { name: 'Cotizando', items: [] },
  aprobado: { name: 'Aprobado', items: [] },
  comprado: { name: 'Comprado', items: [] },
};

export default function Repuestos() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    setIsLoading(true);
    try {
      // REFORZADO: Operaciones tiene acceso a todas las solicitudes
      const user = await User.me();
      const canSeeAll = user.role === 'admin' || user.rol_sistema === 'Gerente' || user.rol_sistema === 'Jefatura' || user.rol_sistema === 'Operaciones';

      let solicitudesData;
      if (canSeeAll) {
        solicitudesData = await SolicitudRepuesto.filter({ archivado: false }, '-created_date');
      } else {
        // Filtrar por usuario asignado si no tiene permisos completos
        solicitudesData = await SolicitudRepuesto.filter({ 
          archivado: false, 
          $or: [
            { solicitado_por_id: user.id },
            { asignado_a_id: user.id }
          ]
        }, '-created_date');
      }

      const vehiculosData = await Vehiculo.list();
      const vehiculosMap = new Map(vehiculosData.map(v => [v.id, v]));
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      
      solicitudesData.forEach(solicitud => {
        const vehiculo = vehiculosMap.get(solicitud.vehiculo_id);
        const solicitudConDetalles = {
          ...solicitud,
          placas: vehiculo?.placas || 'N/A',
          modelo: vehiculo?.modelo || 'N/A',
          año: vehiculo?.año || '',
          numero_economico: vehiculo?.numero_economico || '',
        };

        if (newColumns[solicitud.estatus]) {
          newColumns[solicitud.estatus].items.push(solicitudConDetalles);
        }
      });

      setColumns(newColumns);
    } catch (error) {
      console.error("Error cargando solicitudes de repuestos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) return;

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];
    const [removed] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, removed);

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceColumn, items: sourceItems },
      [destination.droppableId]: { ...destColumn, items: destItems },
    });

    try {
      await SolicitudRepuesto.update(removed.id, { estatus: destination.droppableId });
    } catch (error) {
      console.error("Failed to update status", error);
      loadSolicitudes(); // Revert state on error
    }
  };

  const handleArchive = async (solicitud, newStatus) => {
    const confirmMessage = `¿Estás seguro de que quieres marcar esta solicitud como "${newStatus}" y archivarla?`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      // Actualizar el estado en la base de datos
      await SolicitudRepuesto.update(solicitud.id, { estatus: newStatus, archivado: true });

      // Recargar todo el tablero para asegurar sincronización
      loadSolicitudes();

    } catch (error) {
      console.error("Error archivando solicitud:", error);
      alert("Hubo un error al archivar la solicitud.");
    }
  };

  const handleCardClick = (solicitudId) => {
    navigate(createPageUrl(`SolicitudRepuestoDetalle?id=${solicitudId}`));
  };

  if (isLoading) return <div className="p-8">Cargando tablero...</div>;
  
  // Filtrar las columnas basado en el término de búsqueda
  const filteredColumns = Object.entries(columns).reduce((acc, [columnId, column]) => {
    const filteredItems = column.items.filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.nombre_repuesto?.toLowerCase().includes(searchLower) ||
        item.placas?.toLowerCase().includes(searchLower) ||
        item.numero_economico?.toLowerCase().includes(searchLower) ||
        item.modelo?.toLowerCase().includes(searchLower) ||
        item.año?.toString().includes(searchLower) ||
        item.solicitado_por_nombre?.toLowerCase().includes(searchLower)
      );
    });

    acc[columnId] = {
      ...column,
      items: filteredItems,
    };
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Solicitudes de Repuestos</h1>
            <p className="text-slate-600 font-medium">Gestiona el flujo de solicitudes de repuestos arrastrando las tarjetas.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(createPageUrl('RepuestosArchivados'))}>
            <Archive className="w-4 h-4 mr-2" />
            Ver Archivados
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por repuesto, placas, modelo, N. Eco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {Object.entries(filteredColumns).map(([columnId, column]) => {
              const config = statusConfig[columnId] || {};
              return (
                <div key={columnId}>
                  <div className={`flex items-center gap-2 mb-3 pb-2 border-b-4 ${config.color}`}>
                    {config.icon && <config.icon className={`w-5 h-5 ${config.color?.replace('bg-', 'text-')}`} />}
                    <h2 className="font-bold text-slate-800 text-lg">{column.name}</h2>
                    <Badge variant="secondary" className="rounded-full">{column.items.length}</Badge>
                  </div>
                  <Droppable droppableId={columnId} key={columnId}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-2 rounded-lg min-h-[500px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-slate-100'}`}
                      >
                        {column.items.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps} 
                                className="mb-3"
                                onClick={() => handleCardClick(item.id)}
                              >
                                <Card className={`hover:shadow-md transition-shadow duration-200 cursor-pointer ${snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'}`}>
                                  <CardContent className="p-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 mb-1 truncate">{item.nombre_repuesto} (x{item.cantidad})</p>
                                        <p className="text-sm text-slate-600 mb-2">
                                          Para: {item.placas && item.placas !== 'N/A' ? item.placas : (item.numero_economico || 'N/A')}
                                          {item.modelo && ` • ${item.modelo}`}
                                          {item.año && ` ${item.año}`}
                                        </p>
                                      </div>
                                      <div className="flex gap-1 ml-2">
                                        {columnId === 'comprado' && (
                                          <Button variant="ghost" size="icon" className="text-green-500 hover:bg-green-100" onClick={(e) => { e.stopPropagation(); handleArchive(item, 'entregado'); }} title="Marcar como Entregado y Archivar">
                                            <Check className="w-5 h-5"/>
                                          </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); handleArchive(item, 'cancelado'); }} title="Cancelar y Archivar">
                                          <X className="w-5 h-5"/>
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-100">
                                      <span className="text-slate-500">{item.solicitado_por_nombre}</span>
                                      <span className="text-slate-400">{format(new Date(item.created_date), 'dd/MM/yy')}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
