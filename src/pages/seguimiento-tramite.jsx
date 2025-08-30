import React, { useState, useEffect } from 'react';
import { TramiteCliente } from '@/api/entities';
import { RequisitoTramite } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, FileText, Building2 } from 'lucide-react';

export default function SeguimientoTramite() {
  const [tramite, setTramite] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      loadTramiteData(token);
    } else {
      setError("Token de seguimiento no válido");
      setIsLoading(false);
    }
  }, []);

  const loadTramiteData = async (token) => {
    try {
      const tramiteData = await TramiteCliente.filter({ token_seguimiento: token });
      
      if (tramiteData.length === 0) {
        setError("Trámite no encontrado");
        setIsLoading(false);
        return;
      }

      const tramiteFound = tramiteData[0];
      setTramite(tramiteFound);
      
      const requisitosData = await RequisitoTramite.filter(
        { tramite_id: tramiteFound.id },
        'orden'
      );
      setRequisitos(requisitosData);
      
    } catch (error) {
      console.error("Error cargando trámite:", error);
      setError("Error cargando información del trámite");
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      iniciado: 'bg-blue-100 text-blue-800',
      en_proceso: 'bg-yellow-100 text-yellow-800',
      pendiente_documentos: 'bg-orange-100 text-orange-800',
      revision: 'bg-purple-100 text-purple-800',
      aprobado: 'bg-emerald-100 text-emerald-800',
      rechazado: 'bg-red-100 text-red-800',
      contrato_emitido: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      iniciado: <Clock className="w-5 h-5" />,
      en_proceso: <Clock className="w-5 h-5 text-yellow-600" />,
      pendiente_documentos: <AlertCircle className="w-5 h-5 text-orange-600" />,
      revision: <FileText className="w-5 h-5 text-purple-600" />,
      aprobado: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      rechazado: <AlertCircle className="w-5 h-5 text-red-600" />,
      contrato_emitido: <CheckCircle className="w-5 h-5 text-green-600" />
    };
    return icons[status] || <Clock className="w-5 h-5" />;
  };

  const calcularProgreso = () => {
    if (requisitos.length === 0) return 0;
    const completados = requisitos.filter(r => r.completado).length;
    return Math.round((completados / requisitos.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando información del trámite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progreso = calcularProgreso();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="shadow-2xl border-0 mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold">Estado del Trámite</CardTitle>
                <p className="text-blue-100">Seguimiento de su solicitud de leasing</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Número de Trámite</p>
                <p className="text-xl font-mono font-bold">{tramite.numero_tramite}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Información del Cliente</h3>
                <p className="text-slate-700 mb-1"><strong>Nombre:</strong> {tramite.cliente_nombre}</p>
                <p className="text-slate-700 mb-1"><strong>Fecha de Inicio:</strong> {new Date(tramite.fecha_inicio).toLocaleDateString('es-ES')}</p>
                {tramite.asignado_a_nombre && (
                  <p className="text-slate-700"><strong>Vendedor Asignado:</strong> {tramite.asignado_a_nombre}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Estado Actual</h3>
                <div className="flex items-center gap-3 mb-4">
                  {getStatusIcon(tramite.estatus)}
                  <Badge className={getStatusColor(tramite.estatus)}>
                    {tramite.estatus.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso del trámite</span>
                    <span>{progreso}%</span>
                  </div>
                  <Progress value={progreso} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Requisitos */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">
              Requisitos del Trámite
            </CardTitle>
            <p className="text-slate-600">
              Revise el estado de cada requisito para completar su solicitud
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {requisitos.map((requisito, index) => (
                <div
                  key={requisito.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    requisito.completado
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    requisito.completado
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}>
                    {requisito.completado ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="font-bold text-sm">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {requisito.nombre_requisito}
                    </h4>
                    <p className="text-sm text-slate-600 mb-2">
                      {requisito.descripcion}
                    </p>
                    
                    {requisito.completado && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800">
                          Completado
                        </Badge>
                        {requisito.fecha_completado && (
                          <span className="text-xs text-slate-500">
                            {new Date(requisito.fecha_completado).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {!requisito.completado && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información de Contacto */}
        <Card className="shadow-lg border-0 mt-8">
          <CardContent className="p-6 text-center bg-slate-50">
            <h3 className="font-semibold text-slate-900 mb-2">¿Necesita Ayuda?</h3>
            <p className="text-slate-600 mb-4">
              Si tiene preguntas sobre su trámite o necesita asistencia, 
              no dude en contactar a nuestro equipo.
            </p>
            <div className="flex justify-center gap-4 text-sm text-slate-600">
              <p>📞 WhatsApp: +506 8888-8888</p>
              <p>✉️ Email: soporte@empresa.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}