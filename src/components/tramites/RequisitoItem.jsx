import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Edit, FileText, Clock, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { ComentarioRequisito } from '@/api/entities';
import { format } from 'date-fns';

const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

// Componente para mostrar una evidencia individual
const EvidencePreview = ({ comentario }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-md bg-white border border-slate-200 mb-2">
      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-slate-600 font-semibold text-xs">
          {comentario.usuario_nombre?.substring(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {comentario.contenido && (
          <p className="text-sm text-slate-800 mb-1 line-clamp-2">{comentario.contenido}</p>
        )}
        {comentario.url_adjunto && (
          <div className="mt-1">
            {isImageUrl(comentario.url_adjunto) ? (
              <a href={comentario.url_adjunto} target="_blank" rel="noopener noreferrer">
                <img
                  src={comentario.url_adjunto}
                  alt={comentario.nombre_archivo || 'Adjunto'}
                  className="max-h-16 rounded border border-slate-300 hover:opacity-80 transition-opacity"
                />
              </a>
            ) : (
              <a
                href={comentario.url_adjunto}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
              >
                <FileText className="w-4 h-4" />
                <span className="truncate">{comentario.nombre_archivo || 'Ver Archivo'}</span>
              </a>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(comentario.fecha_comentario), 'dd/MM HH:mm')}</span>
        </div>
      </div>
    </div>
  );
};

// Componente principal del Requisito
export default function RequisitoItem({ requisito, onEdit, lastUpdated }) {
  const [evidencias, setEvidencias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvidencias = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ComentarioRequisito.filter({ requisito_id: requisito.id }, '-fecha_comentario', 3); // Cargar las 3 más recientes
      setEvidencias(data);
    } catch (error) {
      console.error('Error cargando evidencias:', error);
    }
    setIsLoading(false);
  }, [requisito.id]);

  useEffect(() => {
    loadEvidencias();
  }, [requisito.id, lastUpdated, loadEvidencias]);

  const getRequisitoIcon = (tipo) => {
    const icons = {
      datos_avalista: '👤',
      contactos_cercanos: '📞',
      ubicacion_gps: '📍',
      foto_cochera: '🏠',
      foto_cedula_deudor: '🆔',
      foto_cedula_avalista: '🆔',
      selfie_deudor: '🤳',
      selfie_avalista: '🤳',
      documento_general: '📄',
      firma_digital: '✍️'
    };
    return icons[tipo] || '📋';
  };

  const hasImages = evidencias.some(ev => ev.url_adjunto && isImageUrl(ev.url_adjunto));
  const hasFiles = evidencias.some(ev => ev.url_adjunto && !isImageUrl(ev.url_adjunto));
  const hasText = evidencias.some(ev => ev.contenido);

  return (
    <div className={`border rounded-lg transition-all duration-300 ${requisito.completado ? 'bg-emerald-50/70 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
      {/* Header del requisito */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl mt-1">{getRequisitoIcon(requisito.tipo_requisito)}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">{requisito.nombre_requisito}</h4>
              {!requisito.completado && (
                <p className="text-sm text-slate-600 mt-1">{requisito.descripcion}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {requisito.completado ? (
              <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-300 text-slate-600">
                Pendiente
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(requisito)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {evidencias.length > 0 ? 'Ver Evidencias' : 'Añadir Evidencia'}
            </Button>
          </div>
        </div>

        {/* Indicadores de contenido */}
        {evidencias.length > 0 && (
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{evidencias.length} evidencia{evidencias.length !== 1 ? 's' : ''}</span>
            </div>
            {hasImages && (
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                <span>Imágenes</span>
              </div>
            )}
            {hasFiles && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Archivos</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vista previa de evidencias */}
      {evidencias.length > 0 && (
        <div className="p-4">
          <div className="space-y-2">
            {evidencias.map(evidencia => (
              <EvidencePreview key={evidencia.id} comentario={evidencia} />
            ))}
          </div>
          
          {evidencias.length === 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(requisito)}
              className="w-full mt-2 text-blue-600 hover:text-blue-700"
            >
              Ver todas las evidencias →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}