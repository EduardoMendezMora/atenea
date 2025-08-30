
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Calendar,
  ClipboardList,
  StickyNote,
  MessageSquare,
  TrendingUp,
  FileText,
  Plus,
  Send,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { TareaCliente } from "@/api/entities";
import { NotaCliente } from "@/api/entities";
import { MensajeWhatsapp } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Factura } from "@/api/entities";

import ClientTaskForm from "./ClientTaskForm";
import ClientNoteForm from "./ClientNoteForm";

export default function ClientDetail({ isOpen, onClose, cliente, onDataChange }) {
  console.log("🤫 Componente ClientDetail renderizando. Abierto:", isOpen);

  const [tareas, setTareas] = useState([]);
  const [notas, setNotas] = useState([]);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newWhatsappMessage, setNewWhatsappMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState("tareas");

  // Esta función es EXACTAMENTE la que ejecuta el botón "Actualizar Chat"
  const refreshWhatsappMessages = async () => {
    if (!cliente) return;
    try {
      console.log("📱 Buscando mensajes para:", cliente.nombre_empresa);
      const whatsappData = await MensajeWhatsapp.filter({ cliente_id: cliente.id }, 'created_date');
      console.log("📨 Mensajes encontrados:", whatsappData.length);
      setWhatsappMessages(whatsappData);

      // Auto-scroll al final
      setTimeout(() => {
        const chatContainer = document.getElementById('whatsapp-chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error("❌ Error:", error);
    }
  };

  useEffect(() => {
    if (cliente && isOpen) {
      loadClientData();
    }
  }, [cliente, isOpen]);

  const loadClientData = async () => {
    if (!cliente) return;
    setIsLoading(true);
    try {
      const [tareasData, notasData, whatsappData, contratosData, facturasData] = await Promise.all([
        TareaCliente.filter({ cliente_id: cliente.id }, '-fecha_programada'),
        NotaCliente.filter({ cliente_id: cliente.id }, '-created_date'),
        MensajeWhatsapp.filter({ cliente_id: cliente.id }, 'created_date'),
        Contrato.filter({ cliente_id: cliente.id }),
        Factura.filter({ cliente_id: cliente.id })
      ]);
      setTareas(tareasData);
      setNotas(notasData);
      // whatsappData is already handled by refreshWhatsappMessages, but for initial load consistency:
      setWhatsappMessages(whatsappData);
      setContratos(contratosData);
      setFacturas(facturasData);
    } catch (error) {
      console.error("Error loading client data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveTask = async (taskData) => {
    await TareaCliente.create({
      ...taskData,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_empresa
    });
    setShowTaskForm(false);
    loadClientData();
    onDataChange();
  };

  const handleSaveNote = async (noteData) => {
    await NotaCliente.create({
      ...noteData,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_empresa
    });
    setShowNoteForm(false);
    loadClientData();
  };

  const handleSendWhatsapp = async () => {
    if (!newWhatsappMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await MensajeWhatsapp.create({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_empresa,
        telefono_destino: cliente.telefono,
        contenido: newWhatsappMessage,
        direccion: "saliente",
        estatus_entrega: "enviado",
        fecha_mensaje: new Date().toISOString()
      });

      setNewWhatsappMessage("");
      // Refrescar inmediatamente después de enviar
      await refreshWhatsappMessages();
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
    setIsSendingMessage(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgente: 'bg-red-100 text-red-800',
      alta: 'bg-orange-100 text-orange-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-blue-100 text-blue-800'
    };
    return colors[priority] || 'bg-slate-100 text-slate-800';
  };

  // TEST SIMPLE en el render
  console.log("🔥 RENDER - Cliente:", cliente?.nombre_empresa, "IsOpen:", isOpen);

  // ANTES del return
  console.log("🔥 ANTES DEL RETURN - Mostrando modal:", isOpen);

  if (!cliente) {
    console.log("🔥 NO HAY CLIENTE - retornando null");
    return null;
  }

  const stats = {
    contratosActivos: contratos.filter(c => c.estatus === 'activo').length,
    tareasPendientes: tareas.filter(t => t.estatus === 'pendiente').length,
    ingresosTotales: facturas.filter(f => f.estatus === 'pagada').reduce((sum, f) => sum + (f.monto || 0), 0),
    ultimaFactura: facturas.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2>{cliente.nombre_empresa}</h2>
              <p className="text-sm font-normal text-slate-600">{cliente.rfc}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Contratos Activos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.contratosActivos}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-xs text-slate-500">Tareas Pendientes</p>
                <p className="text-2xl font-bold text-slate-900">{stats.tareasPendientes}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Ingresos Totales</p>
                <p className="text-lg font-bold text-emerald-600">₡{stats.ingresosTotales.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-xs text-slate-500">Mensajes WhatsApp</p>
                <p className="text-2xl font-bold text-slate-900">{whatsappMessages.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{cliente.telefono}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{cliente.direccion}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tareas">
              <ClipboardList className="w-4 h-4 mr-2" />
              Tareas ({tareas.length})
            </TabsTrigger>
            <TabsTrigger value="notas">
              <StickyNote className="w-4 h-4 mr-2" />
              Notas ({notas.length})
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp ({whatsappMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whatsapp" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    Chat WhatsApp
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshWhatsappMessages}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Actualizar Chat
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chat Container */}
                <div
                  id="whatsapp-chat-container"
                  className="h-96 overflow-y-auto border border-slate-200 rounded-lg p-4 mb-4 bg-slate-50 space-y-3"
                >
                  {whatsappMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500">No hay mensajes aún</p>
                    </div>
                  ) : (
                    whatsappMessages.map(mensaje => (
                      <div
                        key={mensaje.id}
                        className={`flex ${mensaje.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${
                          mensaje.direccion === 'saliente'
                            ? 'bg-green-500 text-white'
                            : 'bg-white border border-slate-200'
                        }`}>
                          <p className="text-sm">{mensaje.contenido}</p>
                          <p className={`text-xs mt-1 ${
                            mensaje.direccion === 'saliente' ? 'text-green-100' : 'text-slate-500'
                          }`}>
                            {mensaje.fecha_mensaje ? format(new Date(mensaje.fecha_mensaje), 'dd/MM HH:mm') : 'Ahora'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Message */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={newWhatsappMessage}
                    onChange={(e) => setNewWhatsappMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendWhatsapp()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendWhatsapp}
                    disabled={isSendingMessage || !newWhatsappMessage.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tareas" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tareas del Cliente</CardTitle>
                  <Button onClick={() => setShowTaskForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tareas.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No hay tareas registradas</p>
                ) : (
                  <div className="space-y-4">
                    {tareas.map(tarea => (
                      <div key={tarea.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{tarea.titulo}</h4>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(tarea.prioridad)}>
                              {tarea.prioridad}
                            </Badge>
                            <Badge variant="outline">
                              {tarea.estatus}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{tarea.descripcion}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Tipo: {tarea.tipo_tarea}</span>
                          <span>Programada: {format(new Date(tarea.fecha_programada), 'dd/MM/yyyy')}</span>
                          {tarea.asignado_a && <span>Asignado: {tarea.asignado_a}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notas" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Notas del Cliente</CardTitle>
                  <Button onClick={() => setShowNoteForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Nota
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notas.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No hay notas registradas</p>
                ) : (
                  <div className="space-y-4">
                    {notas.map(nota => (
                      <div key={nota.id} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{nota.titulo}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="capitalize">
                              {nota.tipo_nota}
                            </Badge>
                            {nota.importante && (
                              <Badge className="bg-red-100 text-red-800">
                                Importante
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{nota.contenido}</p>
                        <div className="text-xs text-slate-500">
                          <span>Por: {nota.autor}</span>
                          <span className="ml-4">{format(new Date(nota.created_date), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ClientTaskForm
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onSave={handleSaveTask}
        />

        <ClientNoteForm
          isOpen={showNoteForm}
          onClose={() => setShowNoteForm(false)}
          onSave={handleSaveNote}
        />
      </DialogContent>
    </Dialog>
  );
}
