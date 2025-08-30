
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MensajeWhatsapp } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { sendWhatsappMessage } from '@/api/functions';
import { UploadFile } from '@/api/integrations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Loader2, Paperclip, X, Image, FileText } from 'lucide-react';

export default function ChatInterface({ cliente }) {
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textAreaRef = useRef(null); // Added for paste event

  const telefono = cliente?.telefono;

  const loadMessages = useCallback(async () => {
    if (!telefono) return;
    setIsLoading(true);
    const cleanNumber = telefono.replace(/[^0-9]/g, '');
    const mensajesData = await MensajeWhatsapp.filter({ telefono_destino: cleanNumber }, '-created_date', 100);
    setMensajes(mensajesData.reverse());
    setIsLoading(false);
  }, [telefono]);
  
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  // Manejar paste de imágenes (pantallazos)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          setSelectedFile(file);
          
          // Crear preview para la imagen pegada
          const reader = new FileReader();
          reader.onload = (e) => setFilePreview(e.target.result);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Manejar drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!nuevoMensaje.trim() && !selectedFile) || !telefono) return;

    setIsSending(true);
    setIsUploadingFile(!!selectedFile);

    // CORRECCIÓN: Mover tempId fuera del bloque try
    const tempId = `temp-${Date.now()}`;

    try {
      const fullPhoneNumber = telefono.startsWith('506') ? telefono : `506${telefono}`;
      let attachment = null;
      let fileUrl = '';
      let fileName = '';

      // Subir archivo si existe
      if (selectedFile) {
        const { file_url } = await UploadFile({ file: selectedFile });
        fileUrl = file_url;
        fileName = selectedFile.name;
        
        attachment = {
          url: file_url,
          filename: selectedFile.name,
          type: selectedFile.type.startsWith('image/') ? 'image' : 'document'
        };
      }

      const messageToSend = {
          id: tempId,
          contenido: nuevoMensaje || (selectedFile ? `📎 ${selectedFile.name}` : ''),
          direccion: 'saliente',
          created_date: new Date().toISOString(),
          estatus_entrega: 'enviando',
          url_adjunto: fileUrl,
          nombre_archivo: fileName,
          tipo_mensaje: attachment ? attachment.type : 'texto'
      };

      setMensajes(prev => [...prev, messageToSend]);
      setNuevoMensaje('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsUploadingFile(false);

      // Enviar mensaje por WhatsApp
      await sendWhatsappMessage({ 
        to: fullPhoneNumber, 
        body: nuevoMensaje,
        attachment: attachment
      });

      // Guardar en base de datos
      await MensajeWhatsapp.create({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_empresa,
          telefono_destino: telefono.replace(/[^0-9]/g, ''),
          es_grupo: false,
          contenido: nuevoMensaje || `📎 ${fileName}`,
          direccion: 'saliente',
          estatus_entrega: 'sent',
          tipo_mensaje: attachment ? attachment.type : 'texto',
          url_adjunto: fileUrl,
          nombre_archivo: fileName
      });

      await loadMessages();

    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setMensajes(prev => prev.map(m => m.id === tempId ? { ...m, estatus_entrega: 'fallido' } : m));
    } finally {
      setIsSending(false);
      setIsUploadingFile(false);
    }
  };

  const renderMessage = (mensaje) => {
    const isOutgoing = mensaje.direccion === 'saliente';
    
    return (
      <motion.div
        key={mensaje.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        layout
        className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${
            isOutgoing 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-slate-200 text-slate-800 rounded-bl-none'
        }`}>
          
          {/* Mostrar imagen si existe */}
          {mensaje.tipo_mensaje === 'image' && mensaje.url_adjunto && (
            <div className="mb-2">
              <img 
                src={mensaje.url_adjunto} 
                alt="Imagen enviada"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                onClick={() => window.open(mensaje.url_adjunto, '_blank')}
              />
            </div>
          )}
          
          {/* Mostrar documento si existe */}
          {mensaje.tipo_mensaje === 'document' && mensaje.url_adjunto && (
            <div className="mb-2">
              <div 
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:opacity-90 ${
                  isOutgoing ? 'bg-blue-400' : 'bg-slate-300'
                }`}
                onClick={() => window.open(mensaje.url_adjunto, '_blank')}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm truncate">{mensaje.nombre_archivo}</span>
              </div>
            </div>
          )}
          
          {/* Contenido del mensaje */}
          {mensaje.contenido && (
            <p className="whitespace-pre-wrap">{mensaje.contenido}</p>
          )}
          
          <div className={`text-xs mt-1 ${isOutgoing ? 'text-blue-200' : 'text-slate-500'}`}>
            {format(new Date(mensaje.created_date), 'HH:mm dd/MM', { locale: es })}
            {mensaje.estatus_entrega === 'enviando' && ' (Enviando...)'}
            {mensaje.estatus_entrega === 'fallido' && ' (Error al enviar)'}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      className="flex flex-col h-[70vh] bg-white rounded-xl shadow-inner"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <AnimatePresence>
            {mensajes.map(renderMessage)}
          </AnimatePresence>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-200">
        {/* Preview de archivo seleccionado */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <FileText className="w-8 h-8 text-slate-500" />
                )}
                <div>
                  <p className="text-sm font-medium truncate max-w-48">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              ref={textAreaRef}
              value={nuevoMensaje}
              onChange={e => setNuevoMensaje(e.target.value)}
              onPaste={handlePaste}
              placeholder={selectedFile ? "Agregar mensaje (opcional)..." : "Escribe un mensaje o pega una imagen (Ctrl+V)..."}
              className="resize-none"
              rows={1}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                  }
              }}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            title="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSending || isUploadingFile || (!nuevoMensaje.trim() && !selectedFile)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        {isUploadingFile && (
          <p className="text-xs text-blue-600 mt-2 animate-pulse">Subiendo archivo...</p>
        )}
        
        <div className="text-xs text-slate-500 mt-2 text-center">
          💡 Tip: Puedes pegar pantallazos directamente con Ctrl+V o arrastrar archivos aquí
        </div>
      </div>
    </div>
  );
}
