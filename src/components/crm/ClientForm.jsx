
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Provincia } from "@/api/entities";
import { Canton } from "@/api/entities";
import { Distrito } from "@/api/entities";

export default function ClientForm({ isOpen, onClose, cliente, onSave, users = [], currentUser }) {
  const [formData, setFormData] = useState({
    nombre_empresa: "", // Changed from nombre_completo
    rfc: "", // Changed from numero_identificacion
    telefono: "506",
    email: "",
    fecha_nacimiento: "",
    genero: "",
    estado_civil: "",
    ocupacion: "",
    cantidad_hijos: 0,
    edad: "",
    provincia_id: "",
    provincia_nombre: "",
    canton_id: "",
    canton_nombre: "",
    distrito_id: "",
    distrito_nombre: "",
    otras_senas: "",
    tipos_licencia: [],
    estatus: "activo",
    asignado_a_id: "",
    asignado_a_nombre: ""
  });

  const [territoriales, setTerritoriales] = useState({
    provincias: [],
    cantones: [],
    distritos: []
  });

  const tiposLicenciaOptions = [
    { value: "A1", label: "A1 - Motocicleta hasta 125cc" },
    { value: "A2", label: "A2 - Motocicleta hasta 400cc" },
    { value: "A3", label: "A3 - Motocicleta sin límite" },
    { value: "B1", label: "B1 - Automóvil liviano" },
    { value: "B2", label: "B2 - Automóvil liviano con remolque" },
    { value: "B3", label: "B3 - Vehículo de trabajo hasta 3500kg" },
    { value: "B4", label: "B4 - Taxi, ambulancia, etc." },
    { value: "C1", label: "C1 - Camión liviano" },
    { value: "C2", label: "C2 - Camión pesado" },
    { value: "D1", label: "D1 - Autobús liviano" },
    { value: "D2", label: "D2 - Autobús pesado" },
    { value: "D3", label: "D3 - Autobús articulado" },
    { value: "E1", label: "E1 - Maquinaria agrícola" },
    { value: "E2", label: "E2 - Maquinaria industrial" }
  ];

  useEffect(() => {
    loadTerritoriales();
  }, []);

  useEffect(() => {
    const initializeForm = async () => {
      if (cliente) {
        // When editing an existing client, spread the client data.
        // Assuming the 'cliente' object itself will have 'nombre_empresa' and 'rfc' fields.
        setFormData({
          ...cliente,
          telefono: cliente.telefono || "506",
          cantidad_hijos: cliente.cantidad_hijos || 0,
          edad: cliente.edad?.toString() || "",
          tipos_licencia: cliente.tipos_licencia || []
        });

        // Pre-cargar cantones y distritos si el cliente ya tiene una dirección
        if (cliente.provincia_id && cliente.provincia_nombre) {
          try {
            const cantonesData = await Canton.filter({ provincia_nombre: cliente.provincia_nombre });
            setTerritoriales(prev => ({ ...prev, cantones: cantonesData }));
            
            if (cliente.canton_id && cliente.canton_nombre) {
              const distritosData = await Distrito.filter({ canton_nombre: cliente.canton_nombre, provincia_id: cliente.provincia_id });
              setTerritoriales(prev => ({ ...prev, distritos: distritosData }));
            }
          } catch (error) {
            console.error("Error precargando cantones/distritos:", error);
          }
        }
      } else {
        // Reset form for a new client
        setFormData({
          nombre_empresa: "", // Changed from nombre_completo
          rfc: "", // Changed from numero_identificacion
          telefono: "506",
          email: "",
          fecha_nacimiento: "",
          genero: "",
          estado_civil: "",
          ocupacion: "",
          cantidad_hijos: 0,
          edad: "",
          provincia_id: "",
          provincia_nombre: "",
          canton_id: "",
          canton_nombre: "",
          distrito_id: "",
          distrito_nombre: "",
          otras_senas: "",
          tipos_licencia: [],
          estatus: "activo",
          asignado_a_id: currentUser?.id || "",
          asignado_a_nombre: currentUser?.full_name || ""
        });
        // Reset lists for a new client
        setTerritoriales(prev => ({ ...prev, cantones: [], distritos: [] }));
      }
    };

    if (isOpen) {
      initializeForm();
    }
  }, [cliente, isOpen, currentUser]);

  const loadTerritoriales = async () => {
    try {
      const provinciasData = await Provincia.list();
      setTerritoriales(prev => ({ ...prev, provincias: provinciasData }));
    } catch (error) {
      console.error("Error cargando provincias:", error);
    }
  };

  const handleProvinciaChange = async (provinciaId) => {
    const provincia = territoriales.provincias.find(p => p.id === provinciaId);
    setFormData(prev => ({
      ...prev,
      provincia_id: provinciaId,
      provincia_nombre: provincia?.nombre || "",
      canton_id: "",
      canton_nombre: "",
      distrito_id: "",
      distrito_nombre: ""
    }));

    if (provincia) {
      try {
        const cantonesData = await Canton.filter({ provincia_nombre: provincia.nombre });
        setTerritoriales(prev => ({ ...prev, cantones: cantonesData, distritos: [] }));
      } catch (error) {
        console.error("Error cargando cantones:", error);
      }
    } else {
        setTerritoriales(prev => ({ ...prev, cantones: [], distritos: [] }));
    }
  };

  const handleCantonChange = async (cantonId) => {
    const canton = territoriales.cantones.find(c => c.id === cantonId);
    setFormData(prev => ({
      ...prev,
      canton_id: cantonId,
      canton_nombre: canton?.nombre || "",
      distrito_id: "",
      distrito_nombre: ""
    }));

    if (canton) {
      try {
        const distritosData = await Distrito.filter({ canton_nombre: canton.nombre, provincia_id: canton.provincia_id });
        setTerritoriales(prev => ({ ...prev, distritos: distritosData }));
      } catch (error) {
        console.error("Error cargando distritos:", error);
      }
    } else {
        setTerritoriales(prev => ({ ...prev, distritos: [] }));
    }
  };

  const handleDistritoChange = (distritoId) => {
    const distrito = territoriales.distritos.find(d => d.id === distritoId);
    setFormData(prev => ({
      ...prev,
      distrito_id: distritoId,
      distrito_nombre: distrito?.nombre || ""
    }));
  };

  const handleTelefonoChange = (value) => {
    // Asegurar que siempre empiece con 506
    let cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue.startsWith('506')) {
      cleanValue = '506' + cleanValue.replace(/^506/, '');
    }
    // Limitar a 11 dígitos (506 + 8 dígitos)
    if (cleanValue.length > 11) {
      cleanValue = cleanValue.substring(0, 11);
    }
    setFormData(prev => ({ ...prev, telefono: cleanValue }));
  };

  const handleLicenciaChange = (licencia, checked) => {
    setFormData(prev => ({
      ...prev,
      tipos_licencia: checked 
        ? [...prev.tipos_licencia, licencia]
        : prev.tipos_licencia.filter(l => l !== licencia)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar teléfono
    if (formData.telefono.length !== 11 || !formData.telefono.startsWith('506')) {
      alert('El teléfono debe tener el formato: 506XXXXXXXX');
      return;
    }

    // Validar RFC
    if (formData.rfc && (formData.rfc.length < 9 || formData.rfc.length > 15)) {
      alert('El RFC debe tener entre 9 y 15 caracteres (dígitos, letras y guiones)');
      return;
    }
    
    // Asegurar que nombre_empresa tenga valor
    if (!formData.nombre_empresa || formData.nombre_empresa.trim() === '') {
      alert('El nombre de la empresa es obligatorio.');
      return;
    }

    // Ensure rfc is provided if the form is for a new client
    // Or if it's required in general
    if (!formData.rfc) {
      alert('La Cédula / RFC es obligatoria.');
      return;
    }


    const dataToSave = {
      ...formData,
      edad: formData.edad ? parseInt(formData.edad) : null,
      nombre_empresa: formData.nombre_empresa.trim() // Limpiar espacios
    };

    onSave(dataToSave);
  };

  const handleUserChange = (userId) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      asignado_a_id: selectedUser?.id || "",
      asignado_a_nombre: selectedUser?.full_name || ""
    }));
  };

  const canReassignClients = currentUser?.role === 'admin' || 
                            currentUser?.rol_sistema === 'Gerente' || 
                            currentUser?.rol_sistema === 'Contador';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_empresa">Nombre Completo o Empresa *</Label>
                <Input
                  id="nombre_empresa"
                  required
                  value={formData.nombre_empresa}
                  onChange={(e) => setFormData({...formData, nombre_empresa: e.target.value})}
                  placeholder="Nombre y apellidos o razón social"
                />
              </div>
              <div>
                <Label htmlFor="rfc">Cédula / RFC *</Label>
                <Input
                  id="rfc"
                  required
                  value={formData.rfc}
                  onChange={(e) => {
                    // Allow digits, letters (case-insensitive), and hyphens
                    const value = e.target.value.replace(/[^0-9a-zA-Z-]/g, '');
                    if (value.length <= 15) {
                      setFormData({...formData, rfc: value});
                    }
                  }}
                  placeholder="9-15 caracteres (ej. RFC123456-XY)"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  required
                  value={formData.telefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  placeholder="506XXXXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  min="18"
                  max="100"
                  value={formData.edad}
                  onChange={(e) => setFormData({...formData, edad: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="genero">Género</Label>
                <Select value={formData.genero} onValueChange={(value) => setFormData({...formData, genero: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado_civil">Estado Civil</Label>
                <Select value={formData.estado_civil} onValueChange={(value) => setFormData({...formData, estado_civil: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viudo">Viudo(a)</SelectItem>
                    <SelectItem value="union_libre">Unión Libre</SelectItem>
                    <SelectItem value="separado">Separado(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ocupacion">Ocupación</Label>
                <Input
                  id="ocupacion"
                  value={formData.ocupacion}
                  onChange={(e) => setFormData({...formData, ocupacion: e.target.value})}
                  placeholder="Profesión u ocupación"
                />
              </div>
              <div>
                <Label htmlFor="cantidad_hijos">Cantidad de Hijos</Label>
                <Input
                  id="cantidad_hijos"
                  type="number"
                  min="0"
                  max="20"
                  value={formData.cantidad_hijos}
                  onChange={(e) => setFormData({...formData, cantidad_hijos: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Select value={formData.provincia_id} onValueChange={handleProvinciaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {territoriales.provincias.map(provincia => (
                      <SelectItem key={provincia.id} value={provincia.id}>
                        {provincia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="canton">Cantón</Label>
                <Select 
                  value={formData.canton_id} 
                  onValueChange={handleCantonChange}
                  disabled={!formData.provincia_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cantón" />
                  </SelectTrigger>
                  <SelectContent>
                    {territoriales.cantones.map(canton => (
                      <SelectItem key={canton.id} value={canton.id}>
                        {canton.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="distrito">Distrito</Label>
                <Select 
                  value={formData.distrito_id} 
                  onValueChange={handleDistritoChange}
                  disabled={!formData.canton_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {territoriales.distritos.map(distrito => (
                      <SelectItem key={distrito.id} value={distrito.id}>
                        {distrito.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="otras_senas">Otras Señas</Label>
              <Textarea
                id="otras_senas"
                value={formData.otras_senas}
                onChange={(e) => setFormData({...formData, otras_senas: e.target.value})}
                rows={2}
                placeholder="Descripción específica de la ubicación"
              />
            </div>
          </div>

          {/* Tipos de Licencia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Tipos de Licencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiposLicenciaOptions.map((opcion) => (
                <div key={opcion.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`licencia-${opcion.value}`}
                    checked={formData.tipos_licencia.includes(opcion.value)}
                    onCheckedChange={(checked) => handleLicenciaChange(opcion.value, checked)}
                  />
                  <Label htmlFor={`licencia-${opcion.value}`} className="text-sm">
                    {opcion.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estatus">Estatus</Label>
                <Select value={formData.estatus} onValueChange={(value) => setFormData({...formData, estatus: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="moroso">Moroso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {canReassignClients && (
              <div>
                <Label htmlFor="asignado_a_id">Asignar a Empleado</Label>
                <Select value={formData.asignado_a_id || ""} onValueChange={handleUserChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar un empleado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Sin asignar</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} {user.id === currentUser?.id && '(Yo)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {cliente ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
