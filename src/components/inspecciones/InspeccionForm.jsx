import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Minus } from 'lucide-react';

export default function InspeccionForm({ isOpen, onClose, onSave, vehiculo, templates }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [kilometraje, setKilometraje] = useState('');
    const [tipoInspeccion, setTipoInspeccion] = useState('entrada');
    const [resultados, setResultados] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    useEffect(() => {
        if (vehiculo) {
            setKilometraje(vehiculo.kilometraje_actual || '');
        }
        if (!isOpen) {
            // Reset form on close
            setSelectedTemplateId('');
            setKilometraje('');
            setTipoInspeccion('entrada');
            setResultados({});
        }
    }, [vehiculo, isOpen]);

    const handleResultadoChange = (pregunta, campo, valor) => {
        setResultados(prev => ({
            ...prev,
            [pregunta]: {
                ...prev[pregunta],
                [campo]: valor,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const itemsCompletos = selectedTemplate.items.map(item => ({
            categoria: item.categoria,
            pregunta: item.pregunta,
            estado: resultados[item.pregunta]?.estado || 'n/a',
            notas: resultados[item.pregunta]?.notas || '',
        }));

        await onSave({
            template_id: selectedTemplateId,
            template_nombre: selectedTemplate.nombre,
            kilometraje: Number(kilometraje),
            tipo_inspeccion: tipoInspeccion,
            resultados: itemsCompletos,
        });

        setIsSaving(false);
    };

    const itemsPorCategoria = selectedTemplate?.items.reduce((acc, item) => {
        if (!acc[item.categoria]) {
            acc[item.categoria] = [];
        }
        acc[item.categoria].push(item);
        return acc;
    }, {});

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Realizar Nueva Inspección</DialogTitle>
                    <DialogDescription>
                        Complete el checklist para el vehículo {vehiculo?.placas}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sticky top-0 bg-white dark:bg-gray-900 py-4 z-10">
                        <div>
                            <Label htmlFor="template">Plantilla de Checklist *</Label>
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar plantilla..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="tipoInspeccion">Tipo de Inspección *</Label>
                            <Select value={tipoInspeccion} onValueChange={setTipoInspeccion} required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="salida">Salida</SelectItem>
                                    <SelectItem value="rutina">Rutina</SelectItem>
                                    <SelectItem value="taller">Taller</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="kilometraje">Kilometraje *</Label>
                            <Input id="kilometraje" type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} required />
                        </div>
                    </div>

                    {selectedTemplate && (
                        <div className="space-y-6">
                            {Object.entries(itemsPorCategoria).map(([categoria, items]) => (
                                <div key={categoria}>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b pb-2">{categoria}</h3>
                                    <div className="space-y-4">
                                        {items.map((item, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-3 bg-slate-50 rounded-lg">
                                                <Label className="font-medium pt-2">{item.pregunta}</Label>
                                                <div className="space-y-2">
                                                    <RadioGroup
                                                        defaultValue="n/a"
                                                        onValueChange={(value) => handleResultadoChange(item.pregunta, 'estado', value)}
                                                        className="flex gap-4"
                                                    >
                                                        <Label className="flex items-center gap-2 p-2 rounded-md bg-green-100 text-green-800 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-green-500">
                                                            <RadioGroupItem value="pasa" id={`pasa-${index}`} className="sr-only" />
                                                            <Check className="w-4 h-4"/> Pasa
                                                        </Label>
                                                        <Label className="flex items-center gap-2 p-2 rounded-md bg-red-100 text-red-800 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-red-500">
                                                            <RadioGroupItem value="falla" id={`falla-${index}`} className="sr-only" />
                                                            <X className="w-4 h-4"/> Falla
                                                        </Label>
                                                        <Label className="flex items-center gap-2 p-2 rounded-md bg-slate-200 text-slate-800 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-slate-500">
                                                            <RadioGroupItem value="n/a" id={`na-${index}`} className="sr-only" />
                                                            <Minus className="w-4 h-4"/> N/A
                                                        </Label>
                                                    </RadioGroup>
                                                    <Textarea
                                                        placeholder="Añadir notas..."
                                                        className="text-sm"
                                                        onChange={(e) => handleResultadoChange(item.pregunta, 'notas', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </form>
                <DialogFooter className="mt-auto">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" form="inspeccion-form" disabled={!selectedTemplateId || isSaving} onClick={handleSubmit}>
                        {isSaving ? "Guardando..." : "Guardar Inspección"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}