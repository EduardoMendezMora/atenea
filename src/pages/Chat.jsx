import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Phone,
  UserPlus,
  Plus,
  Calendar,
  Paperclip,
  Image as ImageIcon,
  File as FileIcon,
  X,
  Loader2
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Cliente } from "@/api/entities";
import { MensajeWhatsapp } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

import CreateClientFromChat from "../components/inbox/CreateClientFromChat";
import CreateTaskFromChat from "../components/inbox/CreateTaskFromChat";
import { sendWhatsappMessage } from "@/api/functions";

export default function Chat() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const telefono = searchParams.get('telefono');

  const [mensajes, setMensajes] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newWhatsappMessage, setNewWhatsappMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (telefono) {
      loadData();
      const interval = setInterval(refreshMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [telefono]);

  const loadData = async () => {
    if (!telefono) return;
    
    setIsLoading(true);
    try {
      // Buscar cliente por teléfono
      const clientes = await Cliente.list();
      const clienteEncontrado = clientes.find(c => 
        c.telefono === telefono || 
        c.telefono === `+${telefono}` ||
        (c.telefono && c.telefono.replace(/[^0-9]/g, '').slice(-8) === telefono.slice(-8))
      );
      
      setCliente(clienteEncontrado);

      // Cargar mensajes por teléfono
      const mensajesData = await MensajeWhatsapp.filter({ telefono_destino: telefono }, 'created_date');
      setMensajes(mensajesData);
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error("Error loading chat data:", error);
    }
    setIsLoading(false);
  };

  const refreshMessages = async () => {
    if (!telefono) return;
    try {
      const freshMessages = await MensajeWhatsapp.filter({ telefono_destino: telefono }, 'created_date');
      const shouldScroll = isScrolledToBottom();
      
      if (freshMessages.length !== mensajes.length) {
        setMensajes(freshMessages);
        if (shouldScroll) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    } catch (error) {
      console.error("Error refreshing messages:", error);
    }
  };

  const scrollToBottom = () => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  const isScrolledToBottom = () => {
    const chatContainer = document.getElementById('chat-container');
    if (!chatContainer) return false;
    return chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      setAttachment({
        file: file,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
        type: isImage ? 'imagen' : 'documento'
      });
      e.target.value = null;
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setAttachment({
            file: file,
            previewUrl: URL.createObjectURL(file),
            type: 'imagen'
          });
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!newWhatsappMessage.trim() && !attachment) || !telefono) return;
    
    setIsSendingMessage(true);
    try {
      let attachmentUrl = null;
      let attachmentFilename = null;
      let messageType = 'texto';

      if (attachment) {
        const uploadResponse = await UploadFile({ file: attachment.file });
        if (uploadResponse && uploadResponse.file_url) {
          attachmentUrl = uploadResponse.file_url;
          attachmentFilename = attachment.file.name;
          messageType = attachment.type;
        } else {
          throw new Error("Error al subir el archivo.");
        }
      }

      const apiAttachment = attachmentUrl ? {
        url: attachmentUrl,
        type: messageType === 'imagen' ? 'image' : (messageType === 'documento' ? 'document' : 'text'),
        filename: attachmentFilename
      } : null;

      const sendResult = await sendWhatsappMessage({
        to: telefono,
        body: newWhatsappMessage,
        attachment: apiAttachment,
      });

      if (sendResult?.data?.error) {
        throw new Error(`Error de la API de WhatsApp: ${sendResult.data.error.message || JSON.stringify(sendResult.data.error)}`);
      }

      await MensajeWhatsapp.create({
        cliente_id: cliente?.id || null,
        cliente_nombre: cliente?.nombre_empresa || "Cliente Desconocido",
        telefono_destino: telefono,
        tipo_mensaje: messageType,
        contenido: newWhatsappMessage,
        url_adjunto: attachmentUrl,
        nombre_archivo: attachmentFilename,
        direccion: "saliente",
        estatus_entrega: "enviado",
        fecha_mensaje: new Date().toISOString()
      });

      setNewWhatsappMessage("");
      setAttachment(null);
      await refreshMessages();
      setTimeout(() => scrollToBottom(), 100);

    } catch (error) {
      console.error("Error enviando mensaje:", error);
      const errorMessage = error.response?.data?.error || error.message || "";
      if (errorMessage.includes("Ultramsg credentials missing")) {
        alert("¡Error de Configuración! Faltan las credenciales de WhatsApp.");
      } else {
        alert(`Error al enviar el mensaje: ${errorMessage}`);
      }
    }
    setIsSendingMessage(false);
  };

  const handleClientCreated = () => {
    setShowCreateClientModal(false);
    loadData(); // Recargar para ver el nuevo cliente
  };

  const conversacion = {
    telefono,
    cliente,
    mensajes
  };

  const formatTelefono = (tel) => {
    if (tel && tel.startsWith('506')) {
      return `+${tel}`;
    }
    return tel;
  };

  if (isLoading) {
    return <div className="p-8">Cargando chat...</div>;
  }

  if (!telefono) {
    return <div className="p-8">Número de teléfono no especificado.</div>;
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Inbox")} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver al Inbox
        </Link>
        
        <Card className="mb-8 shadow-lg">
          <CardHeader className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  {cliente ? cliente.nombre_empresa : "Cliente Desconocido"}
                </h1>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  {formatTelefono(telefono)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!cliente && (
                <Button 
                  onClick={() => setShowCreateClientModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Cliente
                </Button>
              )}
              {cliente && (
                <Button 
                  onClick={() => setShowCreateTaskModal(true)}
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div id="chat-container" className="h-96 overflow-y-auto space-y-4 p-4 bg-slate-100 rounded-lg mb-4">
              {mensajes.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md p-3 rounded-xl ${msg.direccion === 'saliente' ? 'bg-blue-500 text-white' : 'bg-white shadow'}`}>
                    {msg.tipo_mensaje === 'imagen' && msg.url_adjunto && (
                       <a href={msg.url_adjunto} target="_blank" rel="noopener noreferrer">
                         <img src={msg.url_adjunto} alt={msg.nombre_archivo || 'Imagen adjunta'} className="rounded-lg mb-2 max-h-60 w-full object-cover" />
                       </a>
                    )}
                    {msg.tipo_mensaje === 'documento' && msg.url_adjunto && (
                       <a href={msg.url_adjunto} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-slate-200 p-2 rounded-lg hover:bg-slate-300 transition-colors">
                         <FileIcon className="w-6 h-6 text-slate-700" />
                         <span className="font-medium text-slate-800 truncate">{msg.nombre_archivo || "Archivo adjunto"}</span>
                       </a>
                    )}
                    {msg.contenido && <p className="mt-1">{msg.contenido}</p>}
                    <p className="text-xs mt-1 opacity-75">
                      {format(new Date(msg.fecha_mensaje || msg.created_date), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {attachment && (
              <div className="relative p-2 border rounded-lg mb-2 max-w-sm flex items-center justify-between">
                {attachment.type === 'imagen' && attachment.previewUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={attachment.previewUrl} alt="Vista previa" className="max-h-16 rounded-md object-cover" />
                    <span className="text-sm font-medium truncate">{attachment.file.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-6 w-6 text-slate-600" />
                    <span className="text-sm truncate">{attachment.file.name}</span>
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                  setAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = null;
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSendingMessage}>
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                placeholder="Escribe un mensaje o pega una imagen..."
                value={newWhatsappMessage}
                onChange={(e) => setNewWhatsappMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                onPaste={handlePaste}
                disabled={isSendingMessage}
              />
              <Button onClick={handleSendMessage} disabled={isSendingMessage || (!newWhatsappMessage.trim() && !attachment)}>
                {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <CreateClientFromChat
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          conversacion={conversacion}
          onClientCreated={handleClientCreated}
        />

        <CreateTaskFromChat
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          conversacion={conversacion}
          onTaskCreated={() => setShowCreateTaskModal(false)}
        />
      </div>
    </div>
  );
}