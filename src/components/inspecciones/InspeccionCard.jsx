import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, AlertTriangle, User, Calendar, ListChecks, Gauge, Link as LinkIcon, Eye } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InspeccionCard({ inspeccion }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const getStatusIcon = (estado) => {
        switch (estado) {
            case 'pasa': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'falla': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <span className="w-5 h-5 text-slate-400">-</span>;
        }
    };

    const fallos = inspeccion.resultados?.filter(r => r.estado === 'falla').length || 0;
    const itemsRevisados = inspeccion.resultados?.length || 0;
    
    const resultadosPorCategoria = inspeccion.resultados?.reduce((acc, item) => {
        if (!acc[item.categoria]) {
            acc[item.categoria] = [];
        }
        acc[item.categoria].push(item);
        return acc;
    }, {});


    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-bold">{inspeccion.template_nombre}</CardTitle>
                        <CardDescription className="text-xs">
                            {format(new Date(inspeccion.fecha_inspeccion), 'dd/MM/yyyy HH:mm')}
                        </CardDescription>
                    </div>
                    {inspeccion.fallos_detectados ? (
                        <Badge variant="destructive" className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> {fallos} Fallo(s)
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Sin Fallos
                        </Badge>
                    )}
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{inspeccion.usuario_nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-slate-500" />
                        <span>{inspeccion.kilometraje.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-slate-500" />
                        <span>{itemsRevisados} puntos revisados</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {inspeccion.tarea_generada_id && (
                        <RouterLink to={createPageUrl(`Tareas`)}>
                           <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                                <LinkIcon className="w-4 h-4 mr-2" /> Ver Tarea
                            </Button>
                        </RouterLink>
                    )}
                    <Button size="sm" onClick={() => setIsDetailsOpen(true)}>
                       <Eye className="w-4 h-4 mr-2" /> Ver Detalles
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Inspección</DialogTitle>
                        <DialogDescription>
                            {inspeccion.template_nombre} - {format(new Date(inspeccion.fecha_inspeccion), 'dd/MM/yyyy HH:mm')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-4">
                        {Object.entries(resultadosPorCategoria).map(([categoria, resultados]) => (
                            <div key={categoria} className="mb-4">
                                <h4 className="font-semibold text-slate-700 border-b mb-2 pb-1">{categoria}</h4>
                                <ul className="space-y-2">
                                    {resultados.map((res, index) => (
                                        <li key={index} className="flex flex-col p-2 bg-slate-50 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{res.pregunta}</span>
                                                {getStatusIcon(res.estado)}
                                            </div>
                                            {res.notas && <p className="text-xs text-slate-500 mt-1 pl-2 border-l-2 border-slate-200">Nota: {res.notas}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}