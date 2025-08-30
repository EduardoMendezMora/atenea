
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react"; // New import for the Plus icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // New import for Tabs

// Importar entidades para creación rápida
import { Marca } from "@/api/entities";
import { Modelo } from "@/api/entities";
import { Carroceria } from "@/api/entities";
import { Combustible } from "@/api/entities";
import { Transmision } from "@/api/entities";
import { Traccion } from "@/api/entities";
import { Arrendadora } from "@/api/entities";
import { Vehiculo } from "@/api/entities"; // Explicitly import Vehiculo for plates validation

import { getWhatsappGroupInfo } from "@/api/functions";
import { getWhatsappGroups } from "@/api/functions";

// Componente para crear elementos rápidamente
const QuickCreateDialog = ({ isOpen, onClose, type, onCreated, marcas = [] }) => {
  const [formData, setFormData] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setFormData({});
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const entityMap = {
        marca: Marca,
        modelo: Modelo,
        carroceria: Carroceria,
        combustible: Combustible,
        transmision: Transmision,
        traccion: Traccion,
        arrendadora: Arrendadora
      };

      const Entity = entityMap[type];
      
      // CORRECCIÓN: Validar que no existan duplicados antes de crear
      if (formData.nombre) {
        const existingItems = await Entity.filter({ nombre: formData.nombre.trim() });
        if (existingItems.length > 0) {
          alert(`El elemento "${formData.nombre.trim()}" ya existe y no se puede crear de nuevo.`);
          setIsCreating(false);
          return;
        }
      }
      
      // CORRECCIÓN: Validar datos antes de crear, especialmente para modelos
      if (type === 'modelo') {
        if (!formData.nombre || !formData.marca_id || !formData.marca_nombre) {
          alert('Por favor, complete todos los campos requeridos para el modelo.');
          setIsCreating(false);
          return;
        }
        console.log('Creando modelo con datos:', formData);
      }
      
      const createdItem = await Entity.create(formData);
      
      onCreated(createdItem);
      onClose();
      resetForm();
    } catch (error) {
      console.error(`Error creando ${type}:`, error);
      alert(`Error al crear ${type}. Por favor, verifique los datos e intente nuevamente.`);
    } finally {
      setIsCreating(false);
    }
  };

  const renderFormFields = () => {
    switch(type) {
      case 'modelo':
        return (
          <>
            <div>
              <Label htmlFor="nombre">Nombre del Modelo *</Label>
              <Input
                id="nombre"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Corolla, F-150, Civic..."
                required
              />
            </div>
            <div>
              <Label htmlFor="marca_id">Marca *</Label>
              <Select 
                value={formData.marca_id || ''} 
                onValueChange={(value) => {
                  // Corrección: Comparar directamente el 'value' (string) con el 'm.id' (string)
                  // Garantizamos que m.id sea string para la comparación estricta.
                  const selectedMarca = marcas.find(m => String(m.id) === value); 
                  setFormData(prev => ({
                    ...prev, 
                    marca_id: value,
                    marca_nombre: selectedMarca ? selectedMarca.nombre : ''
                  }));
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca..." />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map(marca => (
                    <SelectItem key={marca.id} value={String(marca.id)}>{marca.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'arrendadora':
        return (
          <>
            <div>
              <Label htmlFor="nombre">Nombre de la Empresa *</Label>
              <Input
                id="nombre"
                value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Nombre de la arrendadora..."
                required
              />
            </div>
            <div>
              <Label htmlFor="id_juridica">Cédula Jurídica *</Label>
              <Input
                id="id_juridica"
                value={formData.id_juridica || ''}
                onChange={(e) => setFormData({...formData, id_juridica: e.target.value})}
                placeholder="3-101-123456"
                required
              />
            </div>
            <div>
              <Label htmlFor="apoderado_nombre">Nombre del Apoderado *</Label>
              <Input
                id="apoderado_nombre"
                value={formData.apoderado_nombre || ''}
                onChange={(e) => setFormData({...formData, apoderado_nombre: e.target.value})}
                placeholder="Nombre completo del apoderado..."
                required
              />
            </div>
            <div>
              <Label htmlFor="apoderado_id">Cédula del Apoderado *</Label>
              <Input
                id="apoderado_id"
                value={formData.apoderado_id || ''}
                onChange={(e) => setFormData({...formData, apoderado_id: e.target.value})}
                placeholder="1-1234-5678"
                required
              />
            </div>
          </>
        );
        
      default:
        return (
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder={`Nombre del ${type}...`}
              required
            />
          </div>
        );
    }
  };

  const getDialogTitle = () => {
    const titles = {
      marca: 'Nueva Marca',
      modelo: 'Nuevo Modelo',
      carroceria: 'Nueva Carrocería',
      combustible: 'Nuevo Combustible',
      transmision: 'Nueva Transmisión',
      traccion: 'Nueva Tracción',
      arrendadora: 'Nueva Arrendadora'
    };
    return titles[type] || `Nuevo ${type}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Crear un nuevo elemento para usar en el vehículo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


const initialFormState = {
  numero_economico: "",
  placas: "",
  marca_id: "", // Changed from marca
  marca: "", // Added for display name
  modelo_id: "", // Changed from modelo
  modelo: "", // Added for display name
  año: new Date().getFullYear().toString(),
  numero_serie: "", // VIN
  color: "",
  carroceria: "",
  cilindrada: "",
  cilindros: "",
  combustible: "",
  transmision: "",
  traccion: "",
  fotos_url: "",
  estatus: "",
  estatus_inventario: "",
  renta_semanal: "",
  gastos_administrativos: "",
  plazo_semanas: "",
  arrendadora_id: "",
  arrendadora_nombre: "",
  arrendadora_id_juridica: "",
  arrendadora_apoderado: "",
  arrendadora_id_apoderado: "",
  valor_adquisicion: "",
  fecha_adquisicion: "",
  ubicacion_actual: "",
  contrato_activo_id: "",
  cliente_actual: "",
  observaciones: "",
  asignado_a_id: "",
  asignado_a_nombre: "",
  whatsapp_grupo_id: "",
  whatsapp_grupo_nombre: "",
};

export default function VehicleForm({
  isOpen,
  onClose,
  vehiculo: editingVehiculo, // Renamed for clarity as per outline
  onSave,
  contratos = [],
  users = [],
  marcas = [],
  modelos = [],
  carrocerias = [],
  combustibles = [],
  arrendadoras = [],
  transmisiones = [],
  tracciones = [],
  estadosVehiculo = [],
  estadosInventario = [],
  ubicaciones = [],
  onCatalogUpdate
}) {
  const [formData, setFormData] = useState(initialFormState);
  const [numeroEconomico, setNumeroEconomico] = useState("");
  const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [gruposSugeridos, setGruposSugeridos] = useState([]);
  const [placasError, setPlacasError] = useState("");
  const [validandoPlacas, setValidandoPlacas] = useState(false);

  // Estados para diálogos de creación rápida
  const [quickCreateDialog, setQuickCreateDialog] = useState({ isOpen: false, type: '' });

  // CORREGIDO: Los estados locales se inicializan directamente con las props.
  const [localMarcas, setLocalMarcas] = useState(marcas);
  const [localModelos, setLocalModelos] = useState(modelos);
  const [localCarrocerias, setLocalCarrocerias] = useState(carrocerias);
  const [localCombustibles, setLocalCombustibles] = useState(combustibles);
  const [localTransmisiones, setLocalTransmisiones] = useState(transmisiones);
  const [localTracciones, setLocalTracciones] = useState(tracciones);
  const [localArrendadoras, setLocalArrendadoras] = useState(arrendadoras);

  // CORREGIDO: Actualizar catálogos cuando cambien las props, sin filtros complicados
  useEffect(() => {
    setLocalMarcas(marcas);
  }, [marcas]);

  useEffect(() => {
    setLocalModelos(modelos);
  }, [modelos]);

  useEffect(() => {
    setLocalCarrocerias(carrocerias);
  }, [carrocerias]);

  useEffect(() => {
    setLocalCombustibles(combustibles);
  }, [combustibles]);

  useEffect(() => {
    setLocalTransmisiones(transmisiones);
  }, [transmisiones]);

  useEffect(() => {
    setLocalTracciones(tracciones);
  }, [tracciones]);

  useEffect(() => {
    setLocalArrendadoras(arrendadoras);
  }, [arrendadoras]);


  // Effect for generating/setting numero_economico
  useEffect(() => {
    if (isOpen) {
      if (editingVehiculo) {
        setNumeroEconomico(editingVehiculo.numero_economico || "");
      } else {
        const timestamp = Date.now();
        const prefijo = "VEH";
        const sufijo = timestamp.toString().slice(-4);
        setNumeroEconomico(`${prefijo}-${sufijo}`);
      }
    }
  }, [isOpen, editingVehiculo]);

  // CORREGIDO: Effect para cargar datos del vehículo
  useEffect(() => {
    if (isOpen) {
      if (editingVehiculo) {
        // Mapear correctamente todos los campos del vehículo editado
        const vehiculoData = {
          numero_economico: editingVehiculo.numero_economico || "",
          placas: editingVehiculo.placas || "",
          marca_id: editingVehiculo.marca_id || "", // Use marca_id
          marca: editingVehiculo.marca || "", // Also keep display name
          modelo_id: editingVehiculo.modelo_id || "", // Use modelo_id
          modelo: editingVehiculo.modelo || "", // Also keep display name
          año: editingVehiculo.año?.toString() || new Date().getFullYear().toString(),
          numero_serie: editingVehiculo.numero_serie || "",
          color: editingVehiculo.color || "",
          carroceria: editingVehiculo.carroceria || "",
          cilindrada: editingVehiculo.cilindrada || "",
          cilindros: editingVehiculo.cilindros?.toString() || "",
          combustible: editingVehiculo.combustible || "",
          transmision: editingVehiculo.transmision || "",
          traccion: editingVehiculo.traccion || "",
          fotos_url: editingVehiculo.fotos_url || "",
          estatus: editingVehiculo.estatus || "",
          estatus_inventario: editingVehiculo.estatus_inventario || "",
          renta_semanal: editingVehiculo.renta_semanal?.toString() || "",
          gastos_administrativos: editingVehiculo.gastos_administrativos?.toString() || "",
          plazo_semanas: editingVehiculo.plazo_semanas?.toString() || "",
          arrendadora_id: editingVehiculo.arrendadora_id || "",
          arrendadora_nombre: editingVehiculo.arrendadora_nombre || "",
          arrendadora_id_juridica: editingVehiculo.arrendadora_id_juridica || "",
          arrendadora_apoderado: editingVehiculo.apoderado_nombre || "",
          arrendadora_id_apoderado: editingVehiculo.apoderado_id || "",
          valor_adquisicion: editingVehiculo.valor_adquisicion?.toString() || "",
          fecha_adquisicion: editingVehiculo.fecha_adquisicion || "",
          ubicacion_actual: editingVehiculo.ubicacion_actual || "",
          contrato_activo_id: editingVehiculo.contrato_activo_id || "",
          cliente_actual: editingVehiculo.cliente_actual || "",
          observaciones: editingVehiculo.observaciones || "",
          asignado_a_id: editingVehiculo.asignado_a_id || "",
          asignado_a_nombre: editingVehiculo.asignado_a_nombre || "",
          whatsapp_grupo_id: editingVehiculo.whatsapp_grupo_id || "",
          whatsapp_grupo_nombre: editingVehiculo.whatsapp_grupo_nombre || "",
        };

        setFormData(vehiculoData);
      } else {
        // SOLO reiniciar para vehículo nuevo
        setFormData(initialFormState);
      }
      
      // Limpiar estados auxiliares
      setPlacasError("");
      setGruposDisponibles([]);
      setGruposSugeridos([]);
    }
  }, [isOpen, editingVehiculo]);

  // NUEVO: Effect separado SOLO para enriquecer datos de arrendadora cuando cambian los catálogos
  useEffect(() => {
    if (isOpen && editingVehiculo && formData.arrendadora_id && localArrendadoras.length > 0) {
      const selectedArrendadora = localArrendadoras.find(a => String(a.id) === formData.arrendadora_id);
      if (selectedArrendadora) {
        setFormData(prev => ({
          ...prev,
          arrendadora_nombre: selectedArrendadora.nombre,
          arrendadora_id_juridica: selectedArrendadora.id_juridica,
          arrendadora_apoderado: selectedArrendadora.apoderado_nombre,
          arrendadora_id_apoderado: selectedArrendadora.apoderado_id
        }));
      }
    }
  }, [localArrendadoras, isOpen, editingVehiculo, formData.arrendadora_id]);

  // CORREGIDO: Filtrar modelos por marca seleccionada
  const modelosFiltrados = localModelos.filter(modelo => {
    if (!formData.marca_id) return true; // Si no hay marca seleccionada, mostrar todos (though select is disabled)
    return String(modelo.marca_id) === String(formData.marca_id);
  });


  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevenir envío si hay error en las placas
    if (placasError) {
      alert("Por favor, corrija el error en las placas antes de continuar.");
      return;
    }
    
    const dataToSave = {
      ...formData,
      numero_economico: numeroEconomico, // Incluir el número generado
      año: parseInt(formData.año) || 0,
      cilindros: parseInt(formData.cilindros) || 0,
      renta_semanal: parseFloat(formData.renta_semanal) || 0, // Parse como float
      gastos_administrativos: parseFloat(formData.gastos_administrativos) || 0, // Parse como float
      plazo_semanas: parseInt(formData.plazo_semanas) || 0, // Parse como int
      valor_adquisicion: parseFloat(formData.valor_adquisicion) || 0,
      // Convertir el ID de asignación a null if empty
      asignado_a_id: formData.asignado_a_id || null,
      // Convert arrendadora_id to null if empty
      arrendadora_id: formData.arrendadora_id || null
    };
    onSave(dataToSave);
  };

  const handleContratoChange = (contratoId) => {
    const contrato = contratos?.find(c => c.id === contratoId);
    setFormData({
      ...formData,
      contrato_activo_id: contratoId,
      cliente_actual: contrato?.cliente_nombre || "",
    });
  };

  const handleUserChange = (userId) => {
    // Si se selecciona "Sin asignar", limpiar los campos correspondientes
    if (userId === "none") {
      setFormData({
        ...formData,
        asignado_a_id: "",
        asignado_a_nombre: ""
      });
      return;
    }

    const selectedUser = users.find(u => u.id === userId);
    setFormData({
      ...formData,
      asignado_a_id: selectedUser?.id || "",
      asignado_a_nombre: selectedUser?.full_name || ""
    });
  };

  const handleMarcaChange = (marcaId) => {
    const selectedMarca = localMarcas.find(m => String(m.id) === String(marcaId));
    setFormData(prev => ({
        ...prev,
        marca_id: marcaId, // Set the ID
        marca: selectedMarca ? selectedMarca.nombre : '', // Set the name
        modelo_id: '', // Reset modelo ID when changing marca
        modelo: '' // Reset modelo name
    }));
  };

  const handleArrendadoraChange = (arrendadoraId) => {
    const selectedArrendadora = localArrendadoras.find(a => String(a.id) === String(arrendadoraId)); // Ensure string comparison
    if (selectedArrendadora) {
      setFormData(prevFormData => ({ // Use functional update to prevent stale state issues
        ...prevFormData,
        arrendadora_id: String(selectedArrendadora.id), // Store as string
        arrendadora_nombre: selectedArrendadora.nombre,
        arrendadora_id_juridica: selectedArrendadora.id_juridica,
        arrendadora_apoderado: selectedArrendadora.apoderado_nombre,
        arrendadora_id_apoderado: selectedArrendadora.apoderado_id
      }));
    } else {
      // If no arrendadora selected (e.g., if an "unassigned" option existed, or clearing)
      setFormData(prevFormData => ({ // Use functional update
        ...prevFormData,
        arrendadora_id: "",
        arrendadora_nombre: "",
        arrendadora_id_juridica: "",
        arrendadora_apoderado: "",
        arrendadora_id_apoderado: ""
      }));
    }
  };

  const handleWhatsappGroupIdChange = async (groupId) => {
    setFormData(prev => ({ ...prev, whatsapp_grupo_id: groupId }));

    // Si se ingresa un ID de grupo válido, consultar el API para obtener el nombre
    if (groupId && groupId.includes('@g.us')) {
      setIsLoadingGroupInfo(true);
      try {
        const response = await getWhatsappGroupInfo({ groupId });
        if (response.data && response.data.success) {
          setFormData(prev => ({
            ...prev,
            whatsapp_grupo_id: groupId,
            whatsapp_grupo_nombre: response.data.groupName
          }));
        } else {
          // If API call success but data.success is false or no groupName
          console.warn("Failed to retrieve group info or no group name found:", response.data);
          setFormData(prev => ({
            ...prev,
            whatsapp_grupo_nombre: ""
          }));
        }
      } catch (error) {
        console.error("Error obteniendo info del grupo:", error);
        // Mantener el ID pero limpiar el nombre si hay error
        setFormData(prev => ({
          ...prev,
          whatsapp_grupo_nombre: ""
        }));
      } finally {
        setIsLoadingGroupInfo(false);
      }
    } else {
      // Si se borra o no es válido, limpiar el nombre también
      setFormData(prev => ({
        ...prev,
        whatsapp_grupo_nombre: ""
      }));
    }
  };

  const handlePlacasChange = async (nuevasPlacas) => {
    setFormData(prev => ({ ...prev, placas: nuevasPlacas }));
    
    // Limpiar errores anteriores
    setPlacasError("");
    
    if (nuevasPlacas && nuevasPlacas.trim().length >= 3) {
      // Validar placas duplicadas
      setValidandoPlacas(true);
      try {
        const vehiculosConMismasPlacas = await Vehiculo.filter({ 
          placas: nuevasPlacas.trim() 
        });
        
        // Si estamos editando, excluir el vehículo actual de la validación
        const vehiculosDuplicados = editingVehiculo 
          ? vehiculosConMismasPlacas.filter(v => v.id !== editingVehiculo.id)
          : vehiculosConMismasPlacas;
          
        if (vehiculosDuplicados.length > 0) {
          const vehiculoDuplicado = vehiculosDuplicados[0];
          setPlacasError(
            `⚠️ Ya existe un vehículo con estas placas: ${vehiculoDuplicado.marca} ${vehiculoDuplicado.modelo} (${vehiculoDuplicado.numero_economico})`
          );
        }
      } catch (error) {
        console.error("Error validando placas:", error);
      } finally {
        setValidandoPlacas(false);
      }

      // Buscar grupos de WhatsApp (funcionalidad existente)
      setIsLoadingGroups(true);
      try {
        const { data } = await getWhatsappGroups({ placas: nuevasPlacas });
        if (data && data.success) {
          setGruposDisponibles(data.grupos || []);
          setGruposSugeridos(data.gruposSugeridos || []);
        } else {
          setGruposDisponibles([]);
          setGruposSugeridos([]);
        }
      } catch (error) {
        console.error("Error buscando grupos:", error);
        setGruposDisponibles([]);
        setGruposSugeridos([]);
      } finally {
        setIsLoadingGroups(false);
      }
    } else {
      setGruposDisponibles([]);
      setGruposSugeridos([]);
    }
  };

  const seleccionarGrupo = (grupo) => {
    setFormData(prev => ({
      ...prev,
      whatsapp_grupo_id: grupo.id,
      whatsapp_grupo_nombre: grupo.name
    }));
  };

  const handleQuickCreate = (type) => {
    setQuickCreateDialog({ isOpen: true, type });
  };

  // CORREGIDO: handleQuickCreated que NO cause reinicio
  const handleQuickCreated = (createdItem) => {
    const type = quickCreateDialog.type; 

    // Update the local state immediately WITHOUT triggering form reset
    switch(type) {
      case 'marca':
        setLocalMarcas(prev => [...prev, createdItem]);
        // If no brand was selected, select the new one. Use createdItem.id for marca_id
        if (!formData.marca_id) { // Check marca_id, not marca
          setFormData(prev => ({ 
            ...prev, 
            marca_id: String(createdItem.id), // Set ID
            marca: createdItem.nombre, // Set Name
            modelo_id: '', // Reset model if new brand selected
            modelo: ''
          }));
        }
        break;
      case 'modelo':
        setLocalModelos(prev => [...prev, createdItem]);
        // If no model was selected, select the new one. Use createdItem.id for modelo_id
        if (!formData.modelo_id) { // Check modelo_id, not modelo
          setFormData(prev => ({ 
            ...prev, 
            modelo_id: String(createdItem.id), // Set ID
            modelo: createdItem.nombre // Set Name
          }));
        }
        break;
      case 'carroceria':
        setLocalCarrocerias(prev => [...prev, createdItem]);
        if (!formData.carroceria) {
          setFormData(prev => ({ ...prev, carroceria: createdItem.nombre }));
        }
        break;
      case 'combustible':
        setLocalCombustibles(prev => [...prev, createdItem]);
        if (!formData.combustible) {
          setFormData(prev => ({ ...prev, combustible: createdItem.nombre }));
        }
        break;
      case 'transmision':
        setLocalTransmisiones(prev => [...prev, createdItem]);
        if (!formData.transmision) {
          setFormData(prev => ({ ...prev, transmision: createdItem.nombre }));
        }
        break;
      case 'traccion':
        setLocalTracciones(prev => [...prev, createdItem]);
        if (!formData.traccion) {
          setFormData(prev => ({ ...prev, traccion: createdItem.nombre }));
        }
        break;
      case 'arrendadora':
        setLocalArrendadoras(prev => [...prev, createdItem]);
        // If no arrendadora was selected, select the new one
        if (!formData.arrendadora_id) {
          handleArrendadoraChange(String(createdItem.id));
        }
        break;
    }

    // Notificar al componente padre para actualizar los catálogos globalmente (SIN esperar)
    if (onCatalogUpdate) {
      setTimeout(() => onCatalogUpdate(), 100); // Pequeño delay para evitar conflictos
    }
    
    setQuickCreateDialog({ isOpen: false, type: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingVehiculo ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
          </DialogTitle>
          <DialogDescription>
            {editingVehiculo ? `Editando el vehículo con número económico: ${numeroEconomico}` : `Número económico asignado: ${numeroEconomico}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">General</TabsTrigger>
              <TabsTrigger value="comercial">Comercial</TabsTrigger>
              <TabsTrigger value="whatsapp">Comunicación</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="basico" className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">📋 Datos Generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Mostrar el número económico (solo lectura) */}
                <div>
                  <Label htmlFor="numero_economico_display">N° Económico (Automático)</Label>
                  <Input
                    id="numero_economico_display"
                    value={numeroEconomico}
                    disabled
                    className="bg-slate-100 text-slate-600 font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {editingVehiculo ? "Número asignado previamente" : "Se asignará automáticamente"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="placas">Placas</Label>
                  <div className="relative">
                    <Input 
                      id="placas" 
                      value={formData.placas} 
                      onChange={(e) => handlePlacasChange(e.target.value)}
                      placeholder="Ej: ABC-123"
                      className={placasError ? "border-red-500 focus:border-red-500" : ""}
                    />
                    {validandoPlacas && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {placasError && (
                    <p className="text-red-600 text-sm mt-1 font-medium">
                      {placasError}
                    </p>
                  )}
                  {validandoPlacas && (
                    <p className="text-blue-600 text-xs mt-1">
                      Validando placas...
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="numero_serie">VIN (Número de Serie)</Label>
                  <Input id="numero_serie" value={formData.numero_serie} onChange={(e) => setFormData({...formData, numero_serie: e.target.value})} />
                </div>

                {/* Marca con botón de creación rápida */}
                <div>
                  <Label htmlFor="marca_id">Marca *</Label>
                  <div className="flex gap-2">
                    <Select 
                      required 
                      value={formData.marca_id || ''} 
                      onValueChange={handleMarcaChange} 
                      className="flex-1"
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {localMarcas.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuickCreate('marca')}
                      className="shrink-0"
                      title="Crear nueva marca"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Modelo con botón de creación rápida */}
                <div>
                  <Label htmlFor="modelo_id">Modelo *</Label>
                  <div className="flex gap-2">
                    <Select
                      required
                      value={formData.modelo_id || ''}
                      onValueChange={(value) => {
                        const selectedModelo = modelosFiltrados.find(m => String(m.id) === String(value));
                        setFormData(prev => ({
                            ...prev,
                            modelo_id: value,
                            modelo: selectedModelo ? selectedModelo.nombre : ''
                        }));
                      }}
                      disabled={!formData.marca_id || modelosFiltrados.length === 0}
                      className="flex-1"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!formData.marca_id ? "Seleccione una marca primero" : "Seleccione un modelo"} />
                      </SelectTrigger>
                      <SelectContent>
                        {modelosFiltrados.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuickCreate('modelo')}
                      disabled={!formData.marca_id}
                      className="shrink-0"
                      title="Crear nuevo modelo"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="año">Año *</Label>
                  <Input id="año" type="number" required min="1990" max={new Date().getFullYear() + 1} value={formData.año} onChange={(e) => setFormData({...formData, año: e.target.value})} />
                </div>
              </div>
            </TabsContent>

            {/* Commercial Tab */}
            <TabsContent value="comercial" className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">💰 Datos Comerciales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="renta_semanal">Renta Semanal *</Label>
                  <Input
                    id="renta_semanal"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.renta_semanal}
                    onChange={(e) => setFormData({...formData, renta_semanal: e.target.value})}
                    required
                  />
                  <p className="text-xs text-slate-600 mt-1">Precio que se cobrará semanalmente.</p>
                </div>
                <div>
                  <Label htmlFor="gastos_administrativos">Gastos Administrativos</Label>
                  <Input
                    id="gastos_administrativos"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.gastos_administrativos}
                    onChange={(e) => setFormData({...formData, gastos_administrativos: e.target.value})}
                  />
                  <p className="text-xs text-slate-600 mt-1">Gastos únicos de formalización.</p>
                </div>
                <div>
                  <Label htmlFor="plazo_semanas">Plazo Total (Semanas)</Label>
                  <Input
                    id="plazo_semanas"
                    type="number"
                    min="0"
                    placeholder="Ej: 52"
                    value={formData.plazo_semanas}
                    onChange={(e) => setFormData({...formData, plazo_semanas: e.target.value})}
                  />
                  <p className="text-xs text-slate-600 mt-1">Semanas del contrato estándar.</p>
                </div>
              </div>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4 p-4 border rounded-lg bg-green-50/30">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">📱 WhatsApp y Comunicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp_grupo_id">ID del Grupo de WhatsApp</Label>
                  <Input
                    id="whatsapp_grupo_id"
                    value={formData.whatsapp_grupo_id}
                    onChange={(e) => handleWhatsappGroupIdChange(e.target.value)}
                    placeholder="Ej: 120363025517544973@g.us"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    ID completo del grupo. Al ingresarlo, se obtendrá automáticamente el nombre.
                  </p>
                </div>
                <div>
                  <Label htmlFor="whatsapp_grupo_nombre">Nombre del Grupo</Label>
                  <div className="relative">
                    <Input
                      id="whatsapp_grupo_nombre"
                      value={formData.whatsapp_grupo_nombre}
                      onChange={(e) => setFormData({...formData, whatsapp_grupo_nombre: e.target.value})}
                      placeholder="Se obtendrá automáticamente..."
                      disabled={isLoadingGroupInfo}
                    />
                    {isLoadingGroupInfo && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 absolute right-2 top-2"></div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {isLoadingGroupInfo ?
                      "Consultando nombre del grupo..." :
                      "Nombre obtenido automáticamente del API de WhatsApp"
                    }
                  </p>
                </div>
              </div>

              {(gruposSugeridos.length > 0 || isLoadingGroups) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    {isLoadingGroups ? "Buscando grupos..." : "Grupos sugeridos para estas placas:"}
                  </h4>
                  {isLoadingGroups ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-600">Consultando API de WhatsApp...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gruposSugeridos.map(grupo => (
                        <div key={grupo.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="font-medium text-slate-800">{grupo.name}</p>
                            <p className="text-xs text-slate-600">{grupo.participantsCount} participantes</p>
                          </div>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => seleccionarGrupo(grupo)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Seleccionar
                          </Button>
                        </div>
                      ))}
                      {gruposSugeridos.length === 0 && !isLoadingGroups && (
                        <p className="text-sm text-slate-600">No se encontraron grupos que contengan estas placas.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {gruposDisponibles.length > 0 && gruposSugeridos.length === 0 && !isLoadingGroups && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-800">
                    Ver todos los grupos disponibles ({gruposDisponibles.length})
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded">
                    {gruposDisponibles.map(grupo => (
                      <div key={grupo.id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                        <div>
                          <p className="font-medium text-slate-700">{grupo.name}</p>
                          <p className="text-xs text-slate-500">{grupo.participantsCount} participantes</p>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost"
                          onClick={() => seleccionarGrupo(grupo)}
                          className="text-xs"
                        >
                          Seleccionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {formData.whatsapp_grupo_id && formData.whatsapp_grupo_nombre && (
                <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Grupo conectado: {formData.whatsapp_grupo_nombre}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Los mensajes de este grupo aparecerán en la bitácora del vehículo
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Details Tab (Combinación de Especificaciones, Arrendadora, Estatus, Adquisición, Comentarios) */}
            <TabsContent value="detalles" className="space-y-4 p-4 border rounded-lg">
              {/* Sección de Especificaciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">⚙️ Especificaciones Técnicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
                  </div>

                  {/* Carrocería con botón de creación rápida */}
                  <div>
                    <Label htmlFor="carroceria">Carrocería</Label>
                    <div className="flex gap-2">
                      <Select value={formData.carroceria} onValueChange={(value) => setFormData({...formData, carroceria: value})} className="flex-1">
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {localCarrocerias.map(c => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuickCreate('carroceria')}
                        className="shrink-0"
                        title="Crear nueva carrocería"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                   <div>
                    <Label htmlFor="cilindrada">Cilindrada</Label>
                    <Input id="cilindrada" value={formData.cilindrada} onChange={(e) => setFormData({...formData, cilindrada: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="cilindros">Cilindros</Label>
                    <Input id="cilindros" type="number" value={formData.cilindros} onChange={(e) => setFormData({...formData, cilindros: e.target.value})} />
                  </div>

                  {/* Combustible con botón de creación rápida */}
                  <div>
                    <Label htmlFor="combustible">Combustible</Label>
                    <div className="flex gap-2">
                      <Select value={formData.combustible} onValueChange={(value) => setFormData({...formData, combustible: value})} className="flex-1">
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {localCombustibles.map(c => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuickCreate('combustible')}
                        className="shrink-0"
                        title="Crear nuevo combustible"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Transmisión con botón de creación rápida */}
                  <div>
                    <Label htmlFor="transmision">Transmisión</Label>
                    <div className="flex gap-2">
                      <Select value={formData.transmision} onValueChange={(value) => setFormData({...formData, transmision: value})} className="flex-1">
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {localTransmisiones.map(t => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuickCreate('transmision')}
                        className="shrink-0"
                        title="Crear nueva transmisión"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tracción con botón de creación rápida */}
                  <div>
                    <Label htmlFor="traccion">Tracción</Label>
                    <div className="flex gap-2">
                      <Select value={formData.traccion} onValueChange={(value) => setFormData({...formData, traccion: value})} className="flex-1">
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {localTracciones.map(t => <SelectItem key={t.id} value={t.nombre}>{t.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuickCreate('traccion')}
                        className="shrink-0"
                        title="Crear nueva tracción"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

               {/* Sección de Datos de la Arrendadora */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">🏢 Datos de la Arrendadora</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="arrendadora_id">Seleccionar Arrendadora *</Label>
                    <div className="flex gap-2">
                      <Select value={formData.arrendadora_id} onValueChange={handleArrendadoraChange} className="flex-1">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar arrendadora..." />
                        </SelectTrigger>
                        <SelectContent>
                          {localArrendadoras.map(arrendadora => (
                            <SelectItem key={arrendadora.id} value={String(arrendadora.id)}> {/* Ensure value is string */}
                              {arrendadora.nombre} - {arrendadora.id_juridica}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuickCreate('arrendadora')}
                        className="shrink-0"
                        title="Crear nueva arrendadora"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {formData.arrendadora_id || formData.arrendadora_nombre ? ( // Display if an ID is selected OR if a name exists (for legacy)
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                      <div>
                        <Label>Empresa</Label>
                        <p className="font-medium text-slate-800">{formData.arrendadora_nombre || "N/A"}</p>
                      </div>
                      <div>
                        <Label>Cédula Jurídica</Label>
                        <p className="font-medium text-slate-800">{formData.arrendadora_id_juridica || "N/A"}</p>
                      </div>
                      <div>
                        <Label>Apoderado</Label>
                        <p className="font-medium text-slate-800">{formData.arrendadora_apoderado || "N/A"}</p>
                      </div>
                      <div>
                        <Label>ID Apoderado</Label>
                        <p className="font-medium text-slate-800">{formData.arrendadora_id_apoderado || "N/A"}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Sección de Estatus y Operación */}
               <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">📊 Estatus y Operación</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="estatus">Estado del Vehículo</Label>
                    <Select value={formData.estatus} onValueChange={(value) => setFormData({...formData, estatus: value})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {estadosVehiculo.map(e => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estatus_inventario">Estado de Inventario</Label>
                     <Select value={formData.estatus_inventario} onValueChange={(value) => setFormData({...formData, estatus_inventario: value})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {estadosInventario.map(e => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ubicacion_actual">Ubicación Actual</Label>
                    <Select value={formData.ubicacion_actual} onValueChange={(value) => setFormData({...formData, ubicacion_actual: value})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {ubicaciones.map(u => <SelectItem key={u.id} value={u.nombre}>{u.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fotos_url">Link de Fotos</Label>
                    <Input id="fotos_url" value={formData.fotos_url} onChange={(e) => setFormData({...formData, fotos_url: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="asignado_a_id">Asignar a Empleado</Label>
                    <Select value={formData.asignado_a_id || "none"} onValueChange={handleUserChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar un empleado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                 </div>
               </div>

               {/* Sección de Adquisición y Financiera */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">💸 Datos de Adquisición y Financieros</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="valor_adquisicion">Valor de Adquisición</Label>
                    <Input id="valor_adquisicion" type="number" min="0" step="0.01" value={formData.valor_adquisicion} onChange={(e) => setFormData({...formData, valor_adquisicion: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="fecha_adquisicion">Fecha de Adquisición</Label>
                    <Input id="fecha_adquisicion" type="date" value={formData.fecha_adquisicion} onChange={(e) => setFormData({...formData, fecha_adquisicion: e.target.value})} />
                  </div>
                 </div>
              </div>

              {/* Sección de Comentarios */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">💬 Comentarios</h3>
                <div>
                  <Label htmlFor="observaciones">Observaciones Generales</Label>
                  <Textarea id="observaciones" rows={3} value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingVehiculo ? 'Actualizar Vehículo' : 'Crear Vehículo'}
            </Button>
          </div>
        </form>

        {/* Dialog para creación rápida */}
        <QuickCreateDialog
          isOpen={quickCreateDialog.isOpen}
          onClose={() => setQuickCreateDialog({ isOpen: false, type: '' })}
          type={quickCreateDialog.type}
          marcas={localMarcas}
          onCreated={handleQuickCreated}
        />
      </DialogContent>
    </Dialog>
  );
}
