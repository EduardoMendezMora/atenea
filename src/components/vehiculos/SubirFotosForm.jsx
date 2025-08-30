import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { UploadFile } from "@/api/integrations";
import { FotoVehiculo } from "@/api/entities";
import { User } from "@/api/entities";
import { Upload, X, Image } from "lucide-react";

export default function SubirFotosForm({ isOpen, onClose, vehiculo, onSave }) {
    const [files, setFiles] = useState([]);
    const [categoria, setCategoria] = useState('exterior');
    const [descripcionGeneral, setDescripcionGeneral] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleClose = () => {
        setFiles([]);
        setCategoria('exterior');
        setDescripcionGeneral('');
        setUploadProgress(0);
        onClose();
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length !== selectedFiles.length) {
            alert('Solo se pueden subir archivos de imagen (JPG, PNG, etc.)');
        }
        
        if (imageFiles.length > 20) {
            alert('Máximo 20 fotos por vez');
            return;
        }

        setFiles(imageFiles);
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (files.length === 0) {
            alert('Selecciona al menos una foto');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const user = await User.me();
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Subir archivo
                const { file_url } = await UploadFile({ file });
                
                // Crear registro en la base de datos
                await FotoVehiculo.create({
                    vehiculo_id: vehiculo.id,
                    vehiculo_placas: vehiculo.placas || '',
                    numero_economico: vehiculo.numero_economico || '',
                    url_foto: file_url,
                    nombre_archivo: file.name,
                    descripcion: descripcionGeneral || '',
                    categoria: categoria,
                    fecha_subida: new Date().toISOString(),
                    subida_por: user.full_name,
                    orden: i
                });

                // Actualizar progreso
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }

            onSave();
            handleClose();
        } catch (error) {
            console.error("Error subiendo fotos:", error);
            alert("Error al subir las fotos. Inténtalo de nuevo.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Subir Fotos del Vehículo</DialogTitle>
                    <p className="text-sm text-slate-500">
                        Vehículo: {vehiculo?.placas || vehiculo?.numero_economico}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="files">Seleccionar Fotos (máximo 20)</Label>
                        <Input
                            id="files"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Formatos soportados: JPG, PNG, GIF. Tamaño máximo por archivo: 10MB.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="categoria">Categoría</Label>
                            <Select value={categoria} onValueChange={setCategoria} disabled={isUploading}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exterior">Exterior</SelectItem>
                                    <SelectItem value="interior">Interior</SelectItem>
                                    <SelectItem value="motor">Motor</SelectItem>
                                    <SelectItem value="daños">Daños</SelectItem>
                                    <SelectItem value="documentos">Documentos</SelectItem>
                                    <SelectItem value="otra">Otra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="descripcion">Descripción General (Opcional)</Label>
                        <Textarea
                            id="descripcion"
                            value={descripcionGeneral}
                            onChange={(e) => setDescripcionGeneral(e.target.value)}
                            placeholder="Describe el conjunto de fotos..."
                            disabled={isUploading}
                        />
                    </div>

                    {/* Vista previa de archivos seleccionados */}
                    {files.length > 0 && (
                        <div>
                            <Label>Vista previa ({files.length} fotos)</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                                {files.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-16 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            disabled={isUploading}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b">
                                            {file.name.length > 12 ? `${file.name.substring(0, 12)}...` : file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Barra de progreso */}
                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subiendo fotos...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="w-full" />
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={isUploading}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isUploading || files.length === 0}
                        >
                            {isUploading ? (
                                <>
                                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Subir {files.length} Foto{files.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}