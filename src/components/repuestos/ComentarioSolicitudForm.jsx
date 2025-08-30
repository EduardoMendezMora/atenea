
import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadFile } from "@/api/integrations";
import { ComentarioSolicitudRepuesto } from "@/api/entities";
import { User } from "@/api/entities";
import { Loader2, Paperclip, Image as ImageIcon } from "lucide-react";

export default function ComentarioSolicitudForm({ isOpen, onClose, solicitud, onSave }) {
    const [comentario, setComentario] = useState('');
    const [file, setFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPastingImage, setIsPastingImage] = useState(false);
    const textareaRef = useRef(null);

    // Efecto para crear y limpiar la URL de vista previa de la imagen
    useEffect(() => {
        if (!file || !file.type.startsWith('image/')) {
            setImagePreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);

        // Limpiar la URL del objeto cuando el componente se desmonte o el archivo cambie
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    // Función para manejar el pegado de imágenes
    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                setIsPastingImage(true);

                try {
                    const blob = item.getAsFile();
                    if (blob) {
                        const timestamp = new Date().getTime();
                        const fileName = `pantalla-${timestamp}.png`;
                        const imageFile = new File([blob], fileName, { type: blob.type });
                        setFile(imageFile);
                        
                        // REMOVIDO: Ya no agregamos texto automático
                        // if (!comentario.trim()) {
                        //     setComentario('📷 Imagen pegada desde portapapeles');
                        // }
                    }
                } catch (error) {
                    console.error('Error al pegar imagen:', error);
                    alert('Error al pegar la imagen. Intenta nuevamente.');
                } finally {
                    setIsPastingImage(false);
                }
                break;
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // CAMBIO: Permitir envío si hay comentario O archivo adjunto
        if (!comentario.trim() && !file) {
            alert("Debes escribir un comentario o adjuntar un archivo.");
            return;
        }
        
        setIsSubmitting(true);

        try {
            const user = await User.me();
            let fileUrl = '';
            let fileName = '';

            if (file) {
                const { file_url } = await UploadFile({ file });
                fileUrl = file_url;
                fileName = file.name;
            }

            const dataToSave = {
                solicitud_id: solicitud.id,
                fecha_comentario: new Date().toISOString(),
                usuario_nombre: user.full_name,
                comentario: comentario.trim() || '', // Permitir comentario vacío
                url_adjunto: fileUrl,
                nombre_archivo: fileName
            };
            
            await ComentarioSolicitudRepuesto.create(dataToSave);
            onSave();
            handleClose();
        } catch (error) {
            console.error("Error al guardar comentario:", error);
            alert("Hubo un error al guardar el comentario.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClose = () => {
        setComentario('');
        setFile(null);
        setImagePreview(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Agregar Comentario</DialogTitle>
                    <DialogDescription>Solicitud: {solicitud?.nombre_repuesto}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="comentario">Comentario (opcional si adjuntas archivo)</Label>
                        <Textarea 
                            ref={textareaRef}
                            id="comentario" 
                            value={comentario} 
                            onChange={(e) => setComentario(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Escribe tu comentario... También puedes pegar pantallazos directamente aquí (Ctrl+V)" 
                            className="min-h-[100px]"
                        />
                        {isPastingImage && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Procesando imagen pegada...
                            </div>
                        )}
                    </div>
                    
                    {/* Sección de Vista Previa y Archivo Adjunto */}
                    {file && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                            {imagePreview && (
                                <img 
                                    src={imagePreview} 
                                    alt="Vista previa" 
                                    className="max-h-48 w-full object-contain rounded-md"
                                />
                            )}
                            <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-700 font-medium truncate flex-1">
                                    {file.name}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFile(null)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                                >
                                    Quitar
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <Label htmlFor="file">O selecciona un archivo</Label>
                        <Input 
                            id="file" 
                            type="file" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            💡 Tip: Puedes pegar pantallazos directamente en el campo de comentario con Ctrl+V
                        </p>
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isPastingImage}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                            {isSubmitting ? 'Guardando...' : 'Guardar Comentario'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
