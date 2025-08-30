
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MensajeWhatsapp } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Plus, 
  User, 
  UserPlus,
  Calendar,
  Eye,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CreateClientFromChat from "../components/inbox/CreateClientFromChat";
import CreateTaskFromChat from "../components/inbox/CreateTaskFromChat";

export default function Inbox() {
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [conversaciones, setConversaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // New state variable
  
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    loadData();
    // Refrescar cada 30 segundos (menos frecuente)
    const interval = setInterval(() => {
      refreshData(); // Usar función diferente para refresh silencioso
    }, 30000); // Changed refresh interval from 10s to 30s
    return () => clearInterval(interval);
  }, []);

  // New function: fetchData - encapsulates the core logic for fetching and processing data
  const fetchData = async () => {
    const [mensajesData, clientesData] = await Promise.all([
      MensajeWhatsapp.list('-created_date', 500), // <-- OPTIMIZACIÓN: Cargar solo los 500 más recientes
      Cliente.list()
    ]);
    
    setMensajes(mensajesData);
    setClientes(clientesData);
    
    // Agrupar mensajes por teléfono
    const conversacionesMap = new Map();
    
    mensajesData.forEach(mensaje => {
      const telefono = mensaje.telefono_destino;
      if (!conversacionesMap.has(telefono)) {
        // Buscar cliente asociado
        const cliente = clientesData.find(c => 
          c.telefono === telefono || 
          c.telefono === `+${telefono}` ||
          (c.telefono && c.telefono.replace(/[^0-9]/g, '').slice(-8) === telefono.slice(-8))
        );
        
        conversacionesMap.set(telefono, {
          telefono,
          cliente: cliente || null,
          mensajes: [],
          ultimoMensaje: null,
          mensajesNoLeidos: 0
        });
      }
      
      const conversacion = conversacionesMap.get(telefono);
      conversacion.mensajes.push(mensaje);
      
      // Actualizar último mensaje
      if (!conversacion.ultimoMensaje || new Date(mensaje.created_date) > new Date(conversacion.ultimoMensaje.created_date)) {
        conversacion.ultimoMensaje = mensaje;
      }
      
      // Contar mensajes entrantes (simular "no leídos")
      if (mensaje.direccion === 'entrante') {
        conversacion.mensajesNoLeidos++;
      }
    });
    
    // Convertir a array y ordenar por último mensaje
    const conversacionesArray = Array.from(conversacionesMap.values())
      .sort((a, b) => {
        if (!a.ultimoMensaje) return 1;
        if (!b.ultimoMensaje) return -1;
        return new Date(b.ultimoMensaje.created_date) - new Date(a.ultimoMensaje.created_date);
      });
    
    setConversaciones(conversacionesArray);
  };

  // Function for initial data load, shows full loading spinner
  const loadData = async () => {
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);
  };

  // Function for background data refresh, shows a subtle refreshing indicator
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleCreateClient = (conversacion) => {
    setSelectedConversation(conversacion);
    setShowCreateClientModal(true);
  };

  const handleCreateTask = (conversacion) => {
    setSelectedConversation(conversacion);
    setShowCreateTaskModal(true);
  };

  // New function: handleOpenConversation - determines where to navigate when a conversation card is clicked
  const handleOpenConversation = (conversacion) => {
    if (conversacion.cliente) {
      // If a client is associated, navigate to the client's detail page
      const url = createPageUrl(`ClienteDetalle?id=${conversacion.cliente.id}`);
      navigate(url);
    } else {
      // If no client, navigate to a generic chat view with the phone number
      const url = createPageUrl(`Chat?telefono=${conversacion.telefono}`);
      navigate(url);
    }
  };

  const handleViewClient = (cliente) => {
    const url = createPageUrl(`ClienteDetalle?id=${cliente.id}`);
    navigate(url);
  };

  const handleClientCreated = () => {
    setShowCreateClientModal(false);
    setSelectedConversation(null);
    loadData(); // Recargar para ver el nuevo cliente con full loading
  };

  const handleTaskCreated = () => {
    setShowCreateTaskModal(false);
    setSelectedConversation(null);
    // Task creation doesn't directly affect the inbox conversation list itself, so no full reload needed.
  };

  const formatTelefono = (telefono) => {
    // Formatear número para mostrar mejor
    if (telefono.startsWith('506')) {
      return `+${telefono}`;
    }
    return telefono;
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Inbox WhatsApp
            </h1>
            <p className="text-slate-600 font-medium">
              Centro de comunicaciones • {conversaciones.length} conversaciones activas
              {isRefreshing && <span className="text-blue-600 ml-2 animate-pulse">• Actualizando...</span>} {/* Refreshing indicator */}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <MessageSquare className="w-4 h-4 mr-1" />
              {mensajes.length} mensajes totales
            </Badge>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {conversaciones.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No hay conversaciones de WhatsApp aún</p>
              </Card>
            ) : (
              conversaciones.map((conversacion, index) => (
                <motion.div
                  key={conversacion.telefono}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleOpenConversation(conversacion)} // Now always clickable and uses new handler
                  className="cursor-pointer" // Always has cursor-pointer style
                >
                  <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:bg-slate-50"> {/* Added hover background */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            {conversacion.cliente ? (
                              <User className="w-6 h-6 text-white" />
                            ) : (
                              <MessageSquare className="w-6 h-6 text-white" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 truncate">
                                {conversacion.cliente 
                                  ? conversacion.cliente.nombre_empresa 
                                  : "Cliente Desconocido"
                                }
                              </h3>
                              {!conversacion.cliente && (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Nuevo
                                </Badge>
                              )}
                              {conversacion.mensajesNoLeidos > 0 && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  {conversacion.mensajesNoLeidos}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              📞 {formatTelefono(conversacion.telefono)}
                            </p>
                            {conversacion.ultimoMensaje && (
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-700 truncate flex-1">
                                  {conversacion.ultimoMensaje.direccion === 'entrante' ? '📥' : '📤'} 
                                  {conversacion.ultimoMensaje.contenido}
                                </p>
                                <p className="text-xs text-slate-500 whitespace-nowrap">
                                  {format(new Date(conversacion.ultimoMensaje.created_date), 'HH:mm dd/MM', { locale: es })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {conversacion.cliente ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleViewClient(conversacion.cliente); }}
                                className="hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Cliente
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCreateTask(conversacion); }}
                                className="hover:bg-green-50"
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                Tarea
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCreateClient(conversacion); }}
                                className="hover:bg-blue-50 border-blue-200 text-blue-700"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Crear Cliente
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        <CreateClientFromChat
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          conversacion={selectedConversation}
          onClientCreated={handleClientCreated}
        />

        <CreateTaskFromChat
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          conversacion={selectedConversation}
          onTaskCreated={handleTaskCreated}
        />
      </div>
    </div>
  );
}
