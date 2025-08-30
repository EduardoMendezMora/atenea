import React, { useState, useEffect } from 'react';
import { ChecklistTemplate } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Plus, Edit, Trash2, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import TemplateForm from '../components/inspecciones/TemplateForm';

export default function InspeccionesConfiguracion() {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const loadTemplates = async () => {
        setIsLoading(true);
        const data = await ChecklistTemplate.list();
        setTemplates(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.')) {
            await ChecklistTemplate.delete(id);
            loadTemplates();
        }
    };

    const handleSave = async (templateData) => {
        if (editingTemplate) {
            await ChecklistTemplate.update(editingTemplate.id, templateData);
        } else {
            await ChecklistTemplate.create(templateData);
        }
        setIsFormOpen(false);
        setEditingTemplate(null);
        loadTemplates();
    };

    if (isLoading) {
        return <div className="p-8">Cargando plantillas...</div>;
    }

    return (
        <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                            Configuración de Inspecciones
                        </h1>
                        <p className="text-slate-600 font-medium">
                            Crea y administra las plantillas de checklist para las inspecciones de vehículos.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingTemplate(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Plantilla
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <ListChecks className="w-6 h-6 text-blue-600" />
                                    {template.nombre}
                                </CardTitle>
                                <CardDescription>{template.descripcion}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-slate-600 mb-4">
                                    <span className="font-semibold">{template.items?.length || 0}</span> puntos de revisión.
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                                        <Edit className="w-4 h-4 mr-2" /> Editar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {templates.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <ListChecks className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Aún no hay plantillas</h3>
                        <p className="text-slate-500 mb-4">Crea tu primera plantilla para empezar a realizar inspecciones.</p>
                        <Button onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primera Plantilla
                        </Button>
                    </div>
                )}
            </div>

            <TemplateForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingTemplate(null); }}
                onSave={handleSave}
                template={editingTemplate}
            />
        </div>
    );
}