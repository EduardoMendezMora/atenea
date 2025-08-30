import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadFile } from "@/api/integrations";
import { ComentarioTareaVehiculo } from "@/api/entities";
import { User } from "@/api/entities";
import { ImageIcon, Paperclip } from "lucide-react";

export default function ComentarioTareaForm({ isOpen, onClose, tarea, onSave }) {
    const [comentario, setComentario] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pastedImage, setPastedImage] = useState(null);

    const handleClose = () => {
        setComentario('');
        setFile(null);
        setPastedImage(null);
        setIsSubmitting(false);
        onClose();
    };

    const handlePaste = async (e) => {
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
                    
                    setFile(imageFile);
                    setPastedImage(URL.createObjectURL(blob));
                }
                break;
            }
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (selectedFile.type.startsWith('image/')) {
                setPastedImage(URL.createObjectURL(selectedFile));
            } else {
                setPastedImage(null);
            }
        }
    };

    const removeFile = () => {
        setFile(null);
        setPastedImage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validar que hay al menos comentario O archivo
        const hasComment = comentario && comentario.trim().length > 0;
        const hasFile = file !== null;
        
        if (!hasComment && !hasFile) {
            alert("Debes escribir un comentario o adjuntar un archivo.");
            return;
        }
        
        setIsSubmitting(true);

        try {
            const user = await User.me();
            let fileUrl = '';
            let fileName = '';

            if (file) {
                const { file_url } = await UploadFile({ file: file });
                fileUrl = file_url;
                fileName = file.name;
            }

            const dataToSave = {
                tarea_id: tarea.id,
                fecha_comentario: new Date().toISOString(),
                usuario_nombre: user.full_name,
                comentario: comentario.trim() || '',
                url_adjunto: fileUrl,
                nombre_archivo: fileName
            };
            
            await ComentarioTareaVehiculo.create(dataToSave);
            
            // Llamar onSave y cerrar
            if (onSave) {
                onSave();
            }
            handleClose();
            
        } catch (error) {
            console.error("Error al guardar comentario de tarea:", error);
            alert("Hubo un error al guardar el comentario. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Comentario a Tarea</DialogTitle>
                    <DialogDescription>Tarea: {tarea?.descripcion?.substring(0, 50)}...</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="comentario">Comentario</Label>
                        <Textarea 
                            id="comentario" 
                            value={comentario} 
                            onChange={(e) => setComentario(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Escribe un comentario o pega una captura de pantalla (Ctrl+V)..."
                            className="min-h-20"
                            disabled={isSubmitting}
                        />
                         <p className="text-xs text-slate-500 mt-1">
                            💡 Puedes pegar capturas de pantalla directamente con Ctrl+V
                        </p>
                    </div>
                    
                    <div>
                        <Label htmlFor="file">O seleccionar archivo</Label>
                        <Input 
                            id="file" 
                            type="file" 
                            onChange={handleFileSelect}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                            disabled={isSubmitting}
                        />
                    </div>

                    {pastedImage && (
                        <div className="border rounded-lg p-3 bg-slate-50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">Imagen adjunta:</span>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={removeFile}
                                    className="text-red-600 hover:text-red-800"
                                    disabled={isSubmitting}
                                >
                                    Quitar
                                </Button>
                            </div>
                            <img 
                                src={pastedImage} 
                                alt="Preview" 
                                className="max-w-full h-32 object-contain border rounded" 
                            />
                            <p className="text-xs text-slate-600 mt-1">{file?.name}</p>
                        </div>
                    )}

                    {file && !pastedImage && (
                        <div className="border rounded-lg p-3 bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={removeFile}
                                    className="text-red-600 hover:text-red-800"
                                    disabled={isSubmitting}
                                >
                                    Quitar
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}