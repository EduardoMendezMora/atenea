
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ComentarioRequisito } from '@/api/entities';
import { RequisitoTramite } from '@/api/entities'; // Added import for RequisitoTramite
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { 
  Send,
  Paperclip,
  Loader2,
  CheckCircle,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

// --- Subcomponente para mostrar cada comentario/evidencia ---
function ComentarioItem({ comentario }) {
  const formatTime = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 flex flex-col items-start">
      <div className="flex items-center gap-2 mb-2 w-full">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-semibold text-sm">
            {comentario.usuario_nombre?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className='flex-grow'>
            <span className="font-medium text-slate-800">{comentario.usuario_nombre}</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(comentario.fecha_comentario)}</span>
            </div>
        </div>
      </div>
      
      {comentario.contenido && (
        <p className="text-slate-800 mb-2 whitespace-pre-wrap">{comentario.contenido}</p>
      )}
      
      {comentario.url_adjunto && (
        <div className="mt-1">
          {isImageUrl(comentario.url_adjunto) ? (
            <a href={comentario.url_adjunto} target="_blank" rel="noopener noreferrer">
              <img
                src={comentario.url_adjunto}
                alt={comentario.nombre_archivo || 'Adjunto'}
                className="max-w-xs max-h-56 object-contain rounded-lg border border-slate-300 bg-white cursor-pointer hover:opacity-90"
              />
            </a>
          ) : (
            <a
              href={comentario.url_adjunto}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-slate-100 transition-colors border"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">
                {comentario.nombre_archivo || 'Ver archivo'}
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// --- Componente principal del formulario/modal ---
export default function RequisitoForm({ isOpen, onClose, requisito, onSave }) {
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [adjunto, setAdjunto] = useState(null); // { file: File, previewUrl: string }
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const loadInitialData = useCallback(async () => {
    if (!requisito?.id) return;
    setIsProcessing(true);
    try {
      const [user, comentariosData] = await Promise.all([
        User.me(),
        ComentarioRequisito.filter({ requisito_id: requisito.id }, 'fecha_comentario')
      ]);
      setCurrentUser(user);
      setComentarios(comentariosData);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
    setIsProcessing(false);
  }, [requisito?.id]);

  useEffect(() => {
    if (isOpen && requisito) {
      loadInitialData();
    } else {
      setComentarios([]); // Clear comments when dialog closes or requisito is null
    }
  }, [isOpen, requisito, loadInitialData]);

  useEffect(() => {
    scrollToBottom();
  }, [comentarios]);

  const crearRegistroEvidencia = useCallback(async (contenido, urlAdjunto = '', nombreArchivo = '') => {
    await ComentarioRequisito.create({
      requisito_id: requisito.id,
      tramite_id: requisito.tramite_id,
      usuario_nombre: currentUser.full_name,
      fecha_comentario: new Date().toISOString(),
      tipo_contenido: urlAdjunto ? 'archivo' : 'texto',
      contenido: contenido || null,
      url_adjunto: urlAdjunto,
      nombre_archivo: nombreArchivo
    });

    let updatedRequisito = { ...requisito };

    // Si el requisito no estaba completado, marcarlo como completo.
    if (!requisito.completado) {
        const updatedFields = {
            completado: true,
            fecha_completado: new Date().toISOString(),
        };
        await RequisitoTramite.update(requisito.id, updatedFields);
        updatedRequisito = { ...requisito, ...updatedFields };
        if (onSave) {
          onSave(updatedRequisito); // Notify parent component of the change
        }
    }

    loadInitialData(); // Re-fetch comments and potentially updated user info
  }, [requisito, currentUser, loadInitialData, onSave]); // Added onSave to dependencies

  const handleSubmitEvidencia = useCallback(async () => {
    if (!nuevoComentario.trim() && !adjunto) return;
    setIsProcessing(true);
    try {
      let fileUrl = '';
      let fileName = '';
      if (adjunto) {
        const { file_url } = await UploadFile({ file: adjunto.file });
        fileUrl = file_url;
        fileName = adjunto.file.name;
      }
      await crearRegistroEvidencia(nuevoComentario, fileUrl, fileName);
      setNuevoComentario('');
      setAdjunto(null);
    } catch (error) {
      console.error('Error al enviar evidencia:', error);
      alert('Hubo un error al enviar la evidencia.');
    } finally {
      setIsProcessing(false);
    }
  }, [nuevoComentario, adjunto, crearRegistroEvidencia]);

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEvidencia();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdjunto({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `screenshot-${timestamp}.png`;
          const imageFile = new File([blob], fileName, { type: 'image/png' });
          setAdjunto({
            file: imageFile,
            previewUrl: URL.createObjectURL(imageFile)
          });
          break;
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">Gestionar Requisito</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-slate-600 pt-2">
            <span className="font-semibold text-slate-800">{requisito?.nombre_requisito}</span>
            <Badge variant={requisito?.completado ? 'default' : 'outline'}>
              {requisito?.completado ? 'Completado' : 'Pendiente'}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{requisito?.descripcion}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {isProcessing && comentarios.length === 0 && <p>Cargando...</p>}
          {comentarios.map(comentario => (
            <ComentarioItem key={comentario.id} comentario={comentario} />
          ))}
          <div ref={commentsEndRef} />
        </div>
        
        <Separator />

        <div className="p-4 bg-slate-50">
          <div className="bg-white border border-slate-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500">
            {adjunto && (
              <div className="relative inline-block m-2">
                <img src={adjunto.previewUrl} alt="Preview" className="h-20 w-auto rounded object-contain border" />
                <Button 
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                  onClick={() => setAdjunto(null)}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onPaste={handlePaste}
              placeholder="Escribe un comentario o pega una imagen..."
              className="w-full border-0 resize-none shadow-none focus-visible:ring-0 p-2"
              rows={2}
              disabled={isProcessing}
            />
            <div className="flex justify-between items-center mt-2">
              <div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  <Paperclip className="w-5 h-5 text-slate-600" />
                </Button>
              </div>
              <Button onClick={handleSubmitEvidencia} disabled={isProcessing || (!nuevoComentario.trim() && !adjunto)}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="ml-2">Enviar</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
