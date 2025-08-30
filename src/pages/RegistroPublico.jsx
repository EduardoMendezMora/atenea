
import React, { useState, useEffect } from 'react';
import { Cliente } from '@/api/entities';
import { TramiteCliente } from '@/api/entities';
import { RequisitoTramite } from '@/api/entities';
import { RequisitoMaestro } from '@/api/entities'; // Added import
import { Provincia } from '@/api/entities';
import { Canton } from '@/api/entities';
import { Distrito } from '@/api/entities';
import { sendWhatsappMessage } from '@/api/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle, ArrowRight } from 'lucide-react';

export default function RegistroPublico() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tramiteCreado, setTramiteCreado] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre_completo: "",
    numero_identificacion: "",
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
    tipos_licencia: []
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
        // Usar la misma lógica que funciona en ClientForm
        const distritosData = await Distrito.filter({ 
          canton_nombre: canton.nombre, 
          provincia_id: formData.provincia_id 
        });
        setTerritoriales(prev => ({ ...prev, distritos: distritosData }));
        console.log("✅ Distritos cargados:", distritosData.length);
      } catch (error) {
        console.error("Error cargando distritos:", error);
        setTerritoriales(prev => ({ ...prev, distritos: [] }));
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
    let cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue.startsWith('506')) {
      cleanValue = '506' + cleanValue.replace(/^506/, '');
    }
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

  const validateStep = (stepNumber) => {
    switch(stepNumber) {
      case 1:
        return formData.nombre_completo && formData.telefono && formData.email;
      case 2:
        return true; // Información personal es opcional
      case 3:
        return true; // Dirección es opcional
      default:
        return true;
    }
  };

  const createTramite = async (clienteId, clienteCreado) => {
    const numeroTramite = `TR-${Date.now()}`;
    const tokenSeguimiento = generateToken();
    
    const tramite = await TramiteCliente.create({
      cliente_id: clienteId,
      cliente_nombre: clienteCreado.nombre_empresa,
      cliente_identificacion: clienteCreado.rfc,
      numero_tramite: numeroTramite,
      token_seguimiento: tokenSeguimiento,
      fecha_inicio: new Date().toISOString().split('T')[0],
      estatus: "iniciado"
    });

    // Crear requisitos desde la plantilla maestra
    const requisitosMaestros = await RequisitoMaestro.filter({ activo: true }, 'orden');

    for (const req of requisitosMaestros) {
      await RequisitoTramite.create({
        tramite_id: tramite.id,
        tipo_requisito: req.tipo_requisito,
        nombre_requisito: req.nombre_requisito,
        descripcion: req.descripcion,
        orden: req.orden,
        obligatorio: true, // Se puede hacer configurable en el futuro
        completado: false
      });
    }

    return tramite;
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar teléfono
      if (formData.telefono.length !== 11 || !formData.telefono.startsWith('506')) {
        alert('El teléfono debe tener el formato: 506XXXXXXXX');
        setIsSubmitting(false);
        return;
      }

      const dataToSave = {
        nombre_empresa: formData.nombre_completo,
        rfc: formData.numero_identificacion,
        telefono: formData.telefono,
        email: formData.email,
        origen_registro: 'formulario_publico',
        asignado_a_id: 'autoasignado_publico', // Placeholder
        asignado_a_nombre: 'Formulario Público',
      };

      const clienteCreado = await Cliente.create(dataToSave);
      const tramite = await createTramite(clienteCreado.id, clienteCreado);
      
      // Enviar WhatsApp de agradecimiento
      const linkSeguimiento = `${window.location.origin}/seguimiento-tramite?token=${tramite.token_seguimiento}`;
      const mensajeWhatsapp = `🎉 ¡Gracias ${formData.nombre_completo}! 

Hemos recibido sus datos correctamente. Su trámite ha sido creado exitosamente.

📋 Número de trámite: ${tramite.numero_tramite}
🔗 Link de seguimiento: ${linkSeguimiento}

Nuestro equipo estará revisando su información y muy pronto nos estaremos comunicando con usted.

¡Gracias por confiar en nosotros! 🚗✨`;

      try {
        await sendWhatsappMessage({
          to: formData.telefono,
          body: mensajeWhatsapp
        });
      } catch (whatsappError) {
        console.error("Error enviando WhatsApp:", whatsappError);
        // No detenemos el flujo si falla el WhatsApp
      }

      setTramiteCreado(tramite);
      setStep(4);
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert("Hubo un error al enviar su registro. Por favor, inténtelo de nuevo.");
    }

    setIsSubmitting(false);
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    } else {
      alert("Por favor complete los campos requeridos.");
    }
  };

  const prevStep = () => setStep(step - 1);

  if (step === 4 && tramiteCreado) {
    const linkSeguimiento = `${window.location.origin}/seguimiento-tramite?token=${tramiteCreado.token_seguimiento}`;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl font-bold mb-2">¡Registro Exitoso!</CardTitle>
            <p className="text-emerald-100">Su información ha sido recibida correctamente</p>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2">Número de Trámite:</h3>
                <p className="text-2xl font-mono text-blue-600 font-bold">{tramiteCreado.numero_tramite}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-bold text-slate-900 mb-3">Link de Seguimiento:</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Guarde este link para dar seguimiento a su trámite en cualquier momento:
                </p>
                <div className="bg-white p-4 rounded border-2 border-dashed border-blue-300">
                  <code className="text-sm break-all text-blue-600">{linkSeguimiento}</code>
                </div>
                <Button 
                  onClick={() => window.open(linkSeguimiento, '_blank')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver Estado del Trámite
                </Button>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2">📱 WhatsApp Enviado</h3>
                <p className="text-sm text-slate-600">
                  Le hemos enviado un mensaje de confirmación a su WhatsApp con toda la información.
                </p>
              </div>

              <p className="text-slate-600">
                Nuestro equipo revisará su información y se comunicará con usted pronto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Registro de Cliente</CardTitle>
                <p className="text-blue-100">Complete sus datos para iniciar el proceso de leasing</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <span className="text-sm">Paso {step} de 3</span>
              <div className="flex gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i <= step ? 'bg-white' : 'bg-blue-400'}`} />
                ))}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Información Básica</h3>
                  
                  <div>
                    <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                    <Input
                      id="nombre_completo"
                      required
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                      placeholder="Ingrese su nombre completo"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero_identificacion">Número de Identificación</Label>
                    <Input
                      id="numero_identificacion"
                      value={formData.numero_identificacion}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 15) {
                          setFormData({...formData, numero_identificacion: value});
                        }
                      }}
                      placeholder="Número de cédula"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      required
                      value={formData.telefono}
                      onChange={(e) => handleTelefonoChange(e.target.value)}
                      placeholder="506XXXXXXXX"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="correo@ejemplo.com"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                      Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Información Personal</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fecha_nacimiento"
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                        className="mt-2"
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
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="genero">Género</Label>
                      <Select value={formData.genero} onValueChange={(value) => setFormData({...formData, genero: value})}>
                        <SelectTrigger className="mt-2">
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
                        <SelectTrigger className="mt-2">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ocupacion">Ocupacion</Label>
                      <Input
                        id="ocupacion"
                        value={formData.ocupacion}
                        onChange={(e) => setFormData({...formData, ocupacion: e.target.value})}
                        placeholder="Profesión u ocupación"
                        className="mt-2"
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
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-4 block">Tipos de Licencia que Posee</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <div className="flex justify-between">
                    <Button type="button" onClick={prevStep} variant="outline">
                      Anterior
                    </Button>
                    <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                      Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Dirección de Residencia</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="provincia">Provincia</Label>
                      <Select value={formData.provincia_id} onValueChange={handleProvinciaChange}>
                        <SelectTrigger className="mt-2">
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
                        <SelectTrigger className="mt-2">
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
                        <SelectTrigger className="mt-2">
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
                      rows={3}
                      placeholder="Descripción específica de la ubicación de su hogar"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" onClick={prevStep} variant="outline">
                      Anterior
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Enviando...' : 'Finalizar Registro'} 
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
