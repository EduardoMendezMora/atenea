
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SolicitudRepuesto } from '@/api/entities';
import { ComentarioSolicitudRepuesto } from '@/api/entities';
import ComentarioSolicitudForm from '../components/repuestos/ComentarioSolicitudForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, MessageSquare, Paperclip, User, Calendar, Tag, Car, Wrench, PackageSearch } from 'lucide-react';
import { format } from 'date-fns';

export default function SolicitudRepuestoDetalle() {
  const location = useLocation();
  const navigate = useNavigate(); // Added useNavigate
  const urlParams = new URLSearchParams(location.search);
  const id = urlParams.get('id');

  const [solicitud, setSolicitud] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) {
      // If no ID is present, redirect or show an error
      console.error("No solicitud ID provided.");
      setIsLoading(false);
      navigate(createPageUrl('Repuestos')); // Redirect to dashboard if no ID
      return;
    }
    setIsLoading(true);
    try {
      const [solicitudData, comentariosData] = await Promise.all([
        SolicitudRepuesto.get(id),
        ComentarioSolicitudRepuesto.filter({ solicitud_id: id }, '-fecha_comentario'),
      ]);
      setSolicitud(solicitudData);
      setComentarios(comentariosData);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      setSolicitud(null); // Ensure solicitud is null on error
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]); // Added navigate to dependencies

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Función para determinar si un archivo es imagen
  const isImage = (fileName, url) => {
    if (fileName) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }
    // Si no hay nombre de archivo, revisar la URL
    if (url) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      return imageExtensions.some(ext => url.toLowerCase().includes(ext)) ||
             url.toLowerCase().includes('image'); // Basic check for URLs that might not have extensions but are images (e.g., some CDN links)
    }
    return false;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando detalles de la solicitud...</div>;
  }

  if (!solicitud) {
    return <div className="p-8 text-center text-red-500">No se pudo encontrar la solicitud o hubo un error al cargarla.</div>;
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start">
          {/* New Title Block with Icon */}
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <PackageSearch className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                {solicitud.nombre_repuesto} (x{solicitud.cantidad})
              </h1>
              <p className="text-slate-600 font-medium">
                Para Vehículo: {solicitud.vehiculo_placas || solicitud.numero_economico}
              </p>
            </div>
          </div>

          {/* Action Buttons and Status Badge */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center ml-0 sm:ml-auto">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to={createPageUrl('Repuestos')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Tablero
              </Link>
            </Button>
            <Badge className="text-base capitalize mt-2 sm:mt-0">{solicitud.estatus}</Badge>
          </div>
        </div>

        {/* Main Details Card */}
        <Card className="mb-6 shadow-lg">
          {/* CardHeader content moved to main page header */}
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm p-6"> {/* Added padding here as CardHeader is removed */}
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Solicitó:</span> {solicitud.solicitado_por_nombre}</span></div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Fecha:</span> {format(new Date(solicitud.created_date), 'dd/MM/yyyy')}</span></div>
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Asignado a:</span> {solicitud.asignado_a_nombre || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Nº Parte:</span> {solicitud.numero_parte || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><Car className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Vehículo:</span> {solicitud.numero_economico}</span></div>
            {solicitud.vehiculo_placas && <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-slate-400"/><span><span className="font-semibold">Placas:</span> {solicitud.vehiculo_placas}</span></div>}
            {solicitud.tarea_vehiculo_id && <div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-400"/><span>Tarea asociada</span></div>}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600"/>
              {/* CardTitle is imported, so we can use it here if needed */}
              <h2 className="text-xl font-semibold">Historial y Comentarios</h2> {/* Used h2 instead of CardTitle for semantic structure and smaller size */}
            </div>
            <Button onClick={() => setShowCommentForm(true)}><Plus className="w-4 h-4 mr-2" /> Agregar Comentario</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comentarios.length > 0 ? (
                comentarios.map(comment => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {comment.usuario_nombre.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-slate-800">{comment.usuario_nombre}</p>
                        <p className="text-xs text-slate-400">{format(new Date(comment.fecha_comentario), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <div className="mt-1 bg-slate-100 p-3 rounded-lg">
                        {/* Solo mostrar el comentario si tiene contenido */}
                        {comment.comentario && (
                          <p className="text-slate-700 whitespace-pre-wrap mb-3">{comment.comentario}</p>
                        )}
                        {comment.url_adjunto && (
                          <div className="mt-3">
                            {isImage(comment.nombre_archivo, comment.url_adjunto) ? (
                              // Mostrar solo la imagen, sin texto del nombre de archivo
                              <img
                                src={comment.url_adjunto}
                                alt="Imagen adjunta"
                                className="max-w-full max-h-64 rounded-lg shadow-sm border border-slate-200 object-contain"
                              />
                            ) : (
                              // Mostrar link para otros archivos
                              <a
                                href={comment.url_adjunto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-md"
                              >
                                <Paperclip className="w-4 h-4" />
                                {comment.nombre_archivo || 'Ver adjunto'}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4">No hay comentarios todavía. ¡Sé el primero en agregar uno!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ComentarioSolicitudForm
        isOpen={showCommentForm}
        onClose={() => setShowCommentForm(false)}
        solicitud={solicitud}
        onSave={loadData}
      />
    </div>
  );
}
