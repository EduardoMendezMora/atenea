import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function TemplateForm({ isOpen, onClose, onSave, template }) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [items, setItems] = useState([{ categoria: '', pregunta: '' }]);

    useEffect(() => {
        if (template) {
            setNombre(template.nombre || '');
            setDescripcion(template.descripcion || '');
            setItems(template.items?.length > 0 ? template.items : [{ categoria: '', pregunta: '' }]);
        } else {
            setNombre('');
            setDescripcion('');
            setItems([{ categoria: '', pregunta: '' }]);
        }
    }, [template, isOpen]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { categoria: '', pregunta: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const filteredItems = items.filter(item => item.pregunta.trim() !== '' && item.categoria.trim() !== '');
        if (filteredItems.length === 0) {
            alert("Debe agregar al menos un punto de revisión con categoría y pregunta.");
            return;
        }
        onSave({ nombre, descripcion, items: filteredItems });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{template ? 'Editar' : 'Nueva'} Plantilla de Checklist</DialogTitle>
                    <DialogDescription>
                        Define los puntos que se revisarán durante una inspección con esta plantilla.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
                        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                    </div>

                    <div>
                        <Label className="text-lg font-semibold">Puntos de Revisión</Label>
                        <div className="space-y-4 mt-2 max-h-64 overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-end gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-3 flex-grow">
                                        <div className="space-y-1">
                                            <Label htmlFor={`categoria-${index}`} className="text-xs">Categoría</Label>
                                            <Input
                                                id={`categoria-${index}`}
                                                value={item.categoria}
                                                onChange={(e) => handleItemChange(index, 'categoria', e.target.value)}
                                                placeholder="Ej: Exterior"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`pregunta-${index}`} className="text-xs">Punto a revisar</Label>
                                            <Input
                                                id={`pregunta-${index}`}
                                                value={item.pregunta}
                                                onChange={(e) => handleItemChange(index, 'pregunta', e.target.value)}
                                                placeholder="Ej: Estado de llantas"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveItem(index)}
                                        disabled={items.length === 1}
                                        className="text-red-500 hover:bg-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-4">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Agregar Punto
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Guardar Plantilla</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}