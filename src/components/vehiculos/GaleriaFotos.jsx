import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FotoVehiculo } from "@/api/entities";
import { Trash2, Eye, Download, Plus, Upload } from "lucide-react";
import { motion } from "framer-motion";

export default function GaleriaFotos({ vehiculo, onOpenUpload }) {
    const [fotos, setFotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadFotos = useCallback(async () => {
        if (!vehiculo?.id) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const fotosData = await FotoVehiculo.filter({ vehiculo_id: vehiculo.id }, 'orden');
            setFotos(fotosData || []);
        } catch (error) {
            console.error("Error cargando fotos:", error);
            setFotos([]);
        }
        setIsLoading(false);
    }, [vehiculo?.id]);

    useEffect(() => {
        loadFotos();
    }, [loadFotos]);

    const handleDeletePhoto = async (fotoId) => {
        if (window.confirm('¿Estás seguro de eliminar esta foto?')) {
            try {
                await FotoVehiculo.delete(fotoId);
                loadFotos();
            } catch (error) {
                console.error("Error eliminando foto:", error);
                alert("Error al eliminar la foto");
            }
        }
    };

    const getCategoryColor = (categoria) => {
        const colors = {
            exterior: "bg-blue-100 text-blue-800",
            interior: "bg-green-100 text-green-800", 
            motor: "bg-red-100 text-red-800",
            daños: "bg-orange-100 text-orange-800",
            documentos: "bg-purple-100 text-purple-800",
            otra: "bg-gray-100 text-gray-800"
        };
        return colors[categoria] || colors.otra;
    };

    const fotosPorCategoria = fotos.reduce((acc, foto) => {
        const cat = foto.categoria || 'otra';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(foto);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <p>Cargando fotos...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Galería de Fotos ({fotos.length})</CardTitle>
                    <Button onClick={onOpenUpload}>
                        <Plus className="w-4 h-4 mr-2" />
                        Subir Fotos
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    {fotos.length === 0 ? (
                        <div className="text-center py-12">
                            <Upload className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No hay fotos</h3>
                            <p className="text-slate-500 mb-4">Comienza subiendo algunas fotos de este vehículo</p>
                            <Button onClick={onOpenUpload}>
                                <Plus className="w-4 h-4 mr-2" />
                                Subir Primera Foto
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(fotosPorCategoria).map(([categoria, fotosCat]) => (
                                <div key={categoria}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge className={getCategoryColor(categoria)}>
                                            {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                                        </Badge>
                                        <span className="text-sm text-slate-500">({fotosCat.length} fotos)</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {fotosCat.map((foto, index) => (
                                            <motion.div
                                                key={foto.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="relative group"
                                            >
                                                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                                                    <img
                                                        src={foto.url_foto}
                                                        alt={foto.descripcion || foto.nombre_archivo}
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={() => setSelectedPhoto(foto)}
                                                    />
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            size="icon" 
                                                            variant="secondary" 
                                                            className="w-8 h-8"
                                                            onClick={() => setSelectedPhoto(foto)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="destructive" 
                                                            className="w-8 h-8"
                                                            onClick={() => handleDeletePhoto(foto.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {foto.descripcion && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                                                        {foto.descripcion}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal para ver foto completa */}
            <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedPhoto?.descripcion || selectedPhoto?.nombre_archivo}</DialogTitle>
                    </DialogHeader>
                    {selectedPhoto && (
                        <div className="space-y-4">
                            <img
                                src={selectedPhoto.url_foto}
                                alt={selectedPhoto.descripcion}
                                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                            />
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <span>Subida por: {selectedPhoto.subida_por}</span>
                                <span>{new Date(selectedPhoto.fecha_subida).toLocaleDateString()}</span>
                                <a 
                                    href={selectedPhoto.url_foto} 
                                    download={selectedPhoto.nombre_archivo}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Descargar
                                    </Button>
                                </a>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}