
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Cliente } from "@/api/entities";
import { TareaCliente } from "@/api/entities";
import { NotaCliente } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Pago } from "@/api/entities";
import { TramiteCliente } from "@/api/entities";
import { RequisitoTramite } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { User } from "@/api/entities"; // This is the User entity
import { RequisitoMaestro } from "@/api/entities";
import { NotaCredito } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  CreditCard,
  StickyNote,
  Calendar,
  Plus,
  Send,
  Loader2,
  MessageSquare,
  FileCheck2,
  PlusCircle,
  Check,
  Edit,
  ArrowLeft,
  ClipboardList,
  User as UserIcon
} from "lucide-react";
import { format, addDays } from "date-fns";
import { sendAccountStatement } from "@/api/functions";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import RequisitoItem from "../components/tramites/RequisitoItem";
import InvoiceDetailCard from "../components/invoices/InvoiceDetailCard";
import IntelligentPaymentDialog from "../components/payments/IntelligentPaymentDialog";
import ClientForm from "../components/crm/ClientForm";
import ChatInterface from "../components/inbox/ChatInterface";
import ClientTaskForm from "../components/crm/ClientTaskForm";
import RequisitoForm from "../components/tramites/RequisitoForm";
import AgregarRequisitoDialog from '../components/tramites/AgregarRequisitoDialog';

const CreditNoteDialog = ({ isOpen, onClose, invoice, onCreationSuccess }) => {
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [motivo, setMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (invoice) {
      setMonto(invoice.monto?.toString() || "");
    }
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setIsProcessing(true);

    try {
      // Create credit note
      await NotaCredito.create({
        numero_nota: `NC-${Date.now()}`,
        factura_id: invoice.id,
        numero_factura: invoice.numero_factura,
        contrato_id: invoice.contrato_id,
        cliente_nombre: invoice.cliente_nombre,
        monto: parseFloat(monto),
        fecha_emision: fechaEmision,
        motivo: motivo,
        estatus: 'aplicada'
      });

      // Update invoice status
      await Factura.update(invoice.id, { estatus: 'cancelada' });

      // If invoice was paid, reduce contract weeks paid
      if (invoice.estatus === 'pagada') {
        const contrato = await Contrato.get(invoice.contrato_id);
        if (contrato) {
          await Contrato.update(contrato.id, {
            semanas_pagadas: Math.max(0, (contrato.semanas_pagadas || 0) - 1)
          });
        }
      }
      
      onCreationSuccess();

    } catch (error) {
      console.error("Error al crear nota de crédito:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Crear Nota de Crédito para {invoice?.numero_factura}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monto">Monto *</Label>
              <Input id="monto" type="number" value={monto} onChange={e => setMonto(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="fecha_emision">Fecha de Emisión *</Label>
              <Input id="fecha_emision" type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea id="motivo" value={motivo} onChange={e => setMotivo(e.target.value)} required placeholder="Ej: Error en facturación, ajuste de precios..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
              {isProcessing ? "Procesando..." : "Crear Nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const InvoiceFormDialog = ({ isOpen, onClose, cliente, contratos, onSave, editingFactura }) => {
    const [formData, setFormData] = useState({
        numero_factura: "",
        contrato_id: "",
        monto: "",
        fecha_vencimiento: "",
        concepto: ""
    });

    useEffect(() => {
        if (editingFactura) {
            setFormData({
                numero_factura: editingFactura.numero_factura || `F-${Date.now()}`,
                contrato_id: editingFactura.contrato_id || "",
                monto: editingFactura.monto?.toString() || "",
                fecha_vencimiento: editingFactura.fecha_vencimiento ? format(new Date(editingFactura.fecha_vencimiento + 'T00:00:00'), 'yyyy-MM-dd') : "",
                concepto: editingFactura.concepto || ""
            });
        } else {
            setFormData({
                numero_factura: `F-${Date.now()}`,
                contrato_id: contratos?.[0]?.id || "",
                monto: contratos?.[0]?.renta_semanal?.toString() || "",
                fecha_vencimiento: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                concepto: "Factura Manual"
            });
        }
    }, [isOpen, editingFactura, contratos]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
        
        // Auto-populate amount based on selected contract
        if (id === 'contrato_id') {
            const contrato = contratos.find(c => c.id === value);
            if (contrato) {
                setFormData(prev => ({ ...prev, monto: contrato.renta_semanal?.toString() || "" }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre_empresa,
            monto: parseFloat(formData.monto),
            estatus: 'pendiente'
        };
        await onSave(dataToSave, editingFactura?.id);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingFactura ? 'Editar Factura' : 'Crear Factura Manual'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="contrato_id">Contrato</Label>
                        <Select value={formData.contrato_id} onValueChange={(value) => handleSelectChange('contrato_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un contrato" />
                            </SelectTrigger>
                            <SelectContent>
                                {contratos.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.numero_contrato}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="concepto">Concepto</Label>
                        <Input id="concepto" value={formData.concepto} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="monto">Monto</Label>
                            <Input id="monto" type="number" value={formData.monto} onChange={handleChange} />
                        </div>
                        <div>
                            <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                            <Input id="fecha_vencimiento" type="date" value={formData.fecha_vencimiento} onChange={handleChange} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">{editingFactura ? 'Actualizar' : 'Crear'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ContractFormDialog = ({ isOpen, onClose, cliente, vehiculos, usuarios, onSave }) => {
    const [formData, setFormData] = useState({
        vehiculo_id: '',
        vendedor_id: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Implementation would go here
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nuevo Contrato para {cliente?.nombre_empresa}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Vehículo</Label>
                        <Select onValueChange={(value) => setFormData(p => ({...p, vehiculo_id: value}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {vehiculos.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.marca} {v.modelo} ({v.placas})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Vendedor</Label>
                        <Select onValueChange={(value) => setFormData(p => ({...p, vendedor_id: value}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {usuarios.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Crear Contrato</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Componente para mostrar cada trámite
function TramiteCard({ tramite, allRequisitos, onEditRequisito, onOpenAddRequisito, lastRequisitoUpdate }) {
  const tramiteRequisitos = allRequisitos.filter(r => r.tramite_id === tramite.id);

  const calcularProgreso = () => {
    if (tramiteRequisitos.length === 0) return 0;
    const completados = tramiteRequisitos.filter(r => r.completado).length;
    return Math.round((completados / tramiteRequisitos.length) * 100);
  };
  
  const progreso = calcularProgreso();

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="mb-2">Trámite #{tramite.numero_tramite}</CardTitle>
            <Badge variant={tramite.estatus === 'aprobado' ? 'default' : 'outline'}>
              {tramite.estatus}
            </Badge>
            <p className="text-sm text-slate-600 mt-2">
              Asignado a: {tramite.asignado_a_nombre}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenAddRequisito(tramite)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Agregar Requisito
          </Button>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700">Progreso</span>
            <span className="text-sm font-medium text-slate-700">{progreso}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progreso}%` }}></div>
          </div>
        </div>

        {tramiteRequisitos.length > 0 && (
          <div className="space-y-3 pt-4 mt-4 border-t">
            <h4 className="font-semibold text-slate-900">Lista de Requisitos</h4>
            {tramiteRequisitos.map(requisito => (
              <RequisitoItem
                key={requisito.id}
                requisito={requisito}
                onEdit={onEditRequisito}
                lastUpdated={lastRequisitoUpdate}
              />
            ))}
          </div>
        )}

        {tramiteRequisitos.length === 0 && (
          <div className="pt-4 mt-4 border-t text-center text-slate-500">
            <p>No hay requisitos configurados aún.</p>
            <p className="text-sm">Agrega requisitos para comenzar el proceso.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClienteDetalle() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [tramites, setTramites] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [notas, setNotas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [maestroRequisitos, setMaestroRequisitos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contratos");

  // State for modals
  const [showClientForm, setShowClientForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
  const [selectedInvoiceForCredit, setSelectedInvoiceForCredit] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  
  // AÑADIR: Estados para Tareas
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Estados específicos para trámites
  const [showRequisitoForm, setShowRequisitoForm] = useState(false);
  const [editingRequisito, setEditingRequisito] = useState(null);
  const [showAddRequisitoDialog, setShowAddRequisitoDialog] = useState(false);
  const [selectedTramite, setSelectedTramite] = useState(null);
  const [lastRequisitoUpdate, setLastRequisitoUpdate] = useState(Date.now());
  
  // Other states
  const [isSendingStatement, setIsSendingStatement] = useState(false);

  // No longer needed: Helper para calcular si una factura está vencida
  // const isFacturaVencida = (factura) => {
  //   if (factura.estatus !== 'pendiente') return false;
  //   const hoy = new Date();
  //   hoy.setHours(0, 0, 0, 0);
  //   const fechaVencimiento = new Date(factura.fecha_vencimiento + 'T00:00:00');
  //   fechaVencimiento.setHours(0, 0, 0, 0);
  //   return hoy > fechaVencimiento;
  // };

  // No longer needed: Helper para obtener facturas por estado dinámico
  // const getFacturasByEstado = (estado) => {
  //   switch (estado) {
  //     case 'vencidas':
  //       return facturas.filter(f => isFacturaVencida(f));
  //     case 'canceladas':
  //       return facturas.filter(f => f.estatus === 'cancelada');
  //     case 'futuras':
  //       return facturas.filter(f => f.estatus === 'futura');
  //     default:
  //       return facturas;
  //   }
  // };

  const refreshRequisitos = useCallback(async () => {
    if (!cliente) return;
    try {
        const todosLosRequisitos = await RequisitoTramite.list();
        const tramitesCliente = await TramiteCliente.filter({ cliente_id: cliente.id });
        setTramites(tramitesCliente); // Update tramites in case new ones were added
        setRequisitos(todosLosRequisitos.filter(r => tramitesCliente.some(t => t.id === r.tramite_id)));
        setLastRequisitoUpdate(Date.now()); // Ensure components dependent on this update
    } catch(error) {
        console.error("Error refrescando requisitos:", error);
    }
  }, [cliente]);

  const loadClienteData = useCallback(async (clienteId) => {
    setIsLoading(true);
    try {
      const [
        clienteData,
        contratosData,
        facturasData,
        pagosData,
        tramitesData,
        requisitosData,
        notasData,
        tareasData,
        vehiculosData,
        usuariosData,
        maestroRequisitosData,
        userData
      ] = await Promise.all([
        Cliente.get(clienteId),
        Contrato.filter({ cliente_id: clienteId }),
        Factura.filter({ cliente_id: clienteId }),
        Factura.filter({ cliente_id: clienteId, estatus_pago: 'pagada' }), // Fetch paid invoices for payments tab - Note: This fetches facturas with estatus_pago='pagada', not actual Pago entities. This remains as per original code.
        TramiteCliente.filter({ cliente_id: clienteId }),
        RequisitoTramite.list(),
        NotaCliente.filter({ cliente_id: clienteId }),
        TareaCliente.filter({ cliente_id: clienteId }),
        Vehiculo.list(),
        User.list(),
        RequisitoMaestro.list(),
        User.me()
      ]);
      
      // Removed the logic that modified factura.estatus to 'vencida' or 'futura' here.
      // The status will now be derived dynamically for display purposes.
      // No dynamic status modification is needed anymore. The backend status is the source of truth.

      setCliente(clienteData);
      setContratos(contratosData);
      setFacturas(facturasData); // Store facts with original statuses ('pendiente', 'pagada', 'cancelada', 'futura')
      setPagos(pagosData); 
      setTramites(tramitesData);
      setRequisitos(requisitosData.filter(r => tramitesData.some(t => t.id === r.tramite_id)));
      setNotas(notasData);
      setTareas(tareasData);
      setVehiculos(vehiculosData);
      setUsuarios(usuariosData);
      setMaestroRequisitos(maestroRequisitosData);
      setCurrentUser(userData);

    } catch (error) {
      console.error("Error cargando datos del cliente:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { id } = Object.fromEntries(new URLSearchParams(location.search));
    if (id) {
      loadClienteData(id);
    }
  }, [loadClienteData]);

  const handleSendStatement = async (contrato) => {
    if (!contrato.whatsapp_grupo_id) {
      alert("Este contrato no tiene un grupo de WhatsApp asignado.");
      return;
    }
    
    setIsSendingStatement(true);
    try {
      await sendAccountStatement({ contractId: contrato.id });
      alert("Estado de cuenta enviado exitosamente.");
    } catch (error) {
      console.error("Error al enviar estado de cuenta:", error);
      alert("Error al enviar estado de cuenta.");
    } finally {
      setIsSendingStatement(false);
    }
  };

  const handleSaveClient = async (data, id) => {
    if (id) {
      await Cliente.update(id, data);
    }
    setShowClientForm(false);
    loadClienteData(cliente.id);
  };
  
  const handleSaveInvoice = async (data, id) => {
    if (id) {
      await Factura.update(id, data);
    } else {
      await Factura.create(data);
    }
    setShowInvoiceForm(false);
    setEditingInvoice(null);
    loadClienteData(cliente.id);
  };
  
  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
    loadClienteData(cliente.id);
  };

  const handleCreditNoteSuccess = () => {
    setShowCreditNoteDialog(false);
    setSelectedInvoiceForCredit(null);
    loadClienteData(cliente.id);
  };

  // Handlers para trámites
  const handleEditRequisito = (requisito) => {
    setEditingRequisito(requisito);
    setShowRequisitoForm(true);
  };
  
  const handleSaveRequisito = async (data) => {
    await RequisitoTramite.update(editingRequisito.id, data);
    setRequisitos(prev => prev.map(r => r.id === editingRequisito.id ? {...r, ...data} : r));
    setLastRequisitoUpdate(Date.now()); // Trigger re-render of RequisitoItem
  };

  const handleOpenAddRequisito = (tramite) => {
    setSelectedTramite(tramite);
    setShowAddRequisitoDialog(true);
  };
  
  const handleRequisitoAdded = async (newRequisitoData) => {
    try {
      const createdRequisito = await RequisitoTramite.create(newRequisitoData);
      setRequisitos(prev => [...prev, createdRequisito]);
      setLastRequisitoUpdate(Date.now()); // Trigger re-render of RequisitoItem
    } catch (error) {
      console.error('Error al agregar nuevo requisito:', error);
      alert("Hubo un error al agregar el requisito. Por favor, inténtelo de nuevo.");
      throw error;
    }
  };

  // AÑADIR: Handlers para Tareas
  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await TareaCliente.update(editingTask.id, taskData);
    } else {
      await TareaCliente.create({ ...taskData, cliente_id: cliente.id, cliente_nombre: cliente.nombre_empresa });
    }
    setShowTaskForm(false);
    setEditingTask(null);
    loadClienteData(cliente.id); // Solo recargar para tareas porque necesita actualizar la lista
  };
  
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCreateTramite = async () => {
    if (!cliente || !currentUser) {
      alert("No se pudo obtener la información del cliente o del usuario.");
      return;
    }

    try {
      // 1. Crear el trámite principal
      const nuevoTramite = await TramiteCliente.create({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_empresa,
        cliente_identificacion: cliente.rfc,
        numero_tramite: `TR-${Date.now()}`,
        token_seguimiento: `TKN-${Date.now()}`.slice(-10),
        asignado_a_id: currentUser.id,
        asignado_a_nombre: currentUser.full_name,
        fecha_inicio: new Date().toISOString().split('T')[0],
        estatus: "iniciado"
      });

      // 2. Obtener los requisitos de la plantilla maestra que estén activos
      const requisitosMaestrosActivos = await RequisitoMaestro.filter({ activo: true }, 'orden');
      
      // 3. Crear cada requisito asociado al nuevo trámite
      const requisitosPromises = requisitosMaestrosActivos.map(reqMaestro => 
        RequisitoTramite.create({
          tramite_id: nuevoTramite.id,
          tipo_requisito: reqMaestro.tipo_requisito,
          nombre_requisito: reqMaestro.nombre_requisito,
          descripcion: reqMaestro.descripcion,
          orden: reqMaestro.orden,
          obligatorio: true, // Por defecto, los requisitos de la plantilla son obligatorios
          completado: false
        })
      );
      const nuevosRequisitosCreados = await Promise.all(requisitosPromises);

      // 4. Actualizar el estado local para reflejar los cambios instantáneamente
      setTramites(prev => [...prev, nuevoTramite]);
      setRequisitos(prev => [...prev, ...nuevosRequisitosCreados]);
      
    } catch (error) {
      console.error('Error al crear trámite con requisitos:', error);
      alert('Error al crear el trámite. Verifique la consola para más detalles.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
        <p className="mt-4 text-slate-600">Cargando datos del cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">No se pudo encontrar el cliente.</p>
      </div>
    );
  }

  const stats = {
    contratosActivos: contratos.filter(c => c.estatus === 'activo').length,
    // facturasPendientes counts invoices with estatus 'pendiente' from the backend, including overdue ones.
    facturasPendientes: facturas.filter(f => f.estatus === 'pendiente').length, 
    ingresosTotales: pagos.reduce((sum, p) => sum + (p.monto_pagado || 0), 0)
  };

  // AÑADIR: Helpers para colores de Tareas
  const getPriorityColor = (priority) => {
    const colors = {
      urgente: "bg-red-100 text-red-800 border-red-200",
      alta: "bg-orange-100 text-orange-800 border-orange-200",
      media: "bg-yellow-100 text-yellow-800 border-yellow-200",
      baja: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[priority] || "bg-slate-100 text-slate-800";
  };
  
  const getStatusColor = (status) => {
    const colors = {
      completada: "bg-emerald-100 text-emerald-800 border-emerald-200",
      en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      cancelada: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('Clientes'))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Clientes
          </Button>
        </motion.div>

        {/* Client Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building2 className="w-12 h-12 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {cliente.nombre_empresa}
                      </h1>
                      <p className="text-slate-600 font-mono text-lg">{cliente.rfc}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowClientForm(true)}
                      className="hover:bg-slate-100"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Cliente
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Teléfono</p>
                        <p className="text-slate-900 font-semibold">{cliente.telefono || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Email</p>
                        <p className="text-slate-900 font-semibold truncate">{cliente.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Ubicación</p>
                        <p className="text-slate-900 font-semibold truncate">{cliente.direccion || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Stats Bar */}
            <div className="bg-slate-50 border-t px-6 py-4">
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.contratosActivos}</div>
                  <div className="text-sm text-slate-600">Contratos Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.facturasPendientes}</div>
                  <div className="text-sm text-slate-600">Facturas Pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">₡{stats.ingresosTotales.toLocaleString()}</div>
                  <div className="text-sm text-slate-600">Ingresos Totales</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="contratos" onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto pb-2 mb-8">
                <TabsList className="bg-white shadow-sm w-max">
                  <TabsTrigger value="contratos" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Contratos
                  </TabsTrigger>
                  <TabsTrigger value="facturacion" className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Facturación
                  </TabsTrigger>
                  <TabsTrigger value="pagos" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pagos
                  </TabsTrigger>
                  <TabsTrigger value="tareas" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Tareas
                  </TabsTrigger>
                  <TabsTrigger value="tramites" className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4" />
                    Trámites
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="notas" className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Notas
                  </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="contratos" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Contratos</h2>
                <Button
                  onClick={() => setShowContractForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Contrato
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contratos.map(contrato => (
                  <Card key={contrato.id} className="border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold">
                            {contrato.numero_contrato}
                          </CardTitle>
                          <Badge
                            variant={contrato.estatus === 'activo' ? 'default' : 'outline'}
                            className={contrato.estatus === 'activo' ? 'bg-emerald-500' : ''}
                          >
                            {contrato.estatus}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendStatement(contrato)}
                          disabled={!contrato.whatsapp_grupo_id || isSendingStatement}
                          title="Enviar Estado de Cuenta por WhatsApp"
                        >
                          {isSendingStatement ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Vehículo</p>
                          <p className="font-semibold text-slate-900">
                            {contrato.vehiculo_descripcion}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600">Renta Semanal</p>
                            <p className="text-lg font-bold text-emerald-600">
                              ₡{contrato.renta_semanal?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Progreso</p>
                            <p className="font-semibold text-slate-900">
                              {contrato.semanas_pagadas || 0} / {contrato.plazo_semanas} sem
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, ((contrato.semanas_pagadas || 0) / contrato.plazo_semanas) * 100)}%`
                            }}
                          ></div>
                        </div>
                        {contrato.whatsapp_grupo_nombre && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-slate-500">Grupo WhatsApp</p>
                            <p className="text-sm font-medium text-green-700">
                              📱 {contrato.whatsapp_grupo_nombre}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="facturacion" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Facturación</h2>
                <Button
                  onClick={() => setShowInvoiceForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Factura
                </Button>
              </div>
              
              <Tabs defaultValue="pendientes" className="w-full">
                <TabsList className="bg-white shadow-sm w-full justify-start">
                  <TabsTrigger value="pendientes" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                    Pendientes ({facturas.filter(f => f.estatus === 'pendiente').length})
                  </TabsTrigger>
                  <TabsTrigger value="canceladas" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
                    Canceladas ({facturas.filter(f => f.estatus === 'cancelada').length})
                  </TabsTrigger>
                  <TabsTrigger value="futuras" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                    Futuras ({facturas.filter(f => f.estatus === 'futura').length})
                  </TabsTrigger>
                  <TabsTrigger value="todas" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
                    Todas ({facturas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pendientes" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facturas.filter(f => f.estatus === 'pendiente').map(factura => (
                      <InvoiceDetailCard
                        key={factura.id}
                        factura={factura}
                        onPayment={(factura) => {
                          setSelectedInvoiceForPayment(factura);
                          setShowPaymentDialog(true);
                        }}
                        onEdit={(factura) => {
                          setEditingInvoice(factura);
                          setShowInvoiceForm(true);
                        }}
                        onCreateCreditNote={(factura) => {
                          setSelectedInvoiceForCredit(factura);
                          setShowCreditNoteDialog(true);
                        }}
                        compact={false}
                      />
                    ))}
                    {facturas.filter(f => f.estatus === 'pendiente').length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No hay facturas pendientes.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="canceladas" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facturas.filter(f => f.estatus === 'cancelada').map(factura => (
                      <InvoiceDetailCard
                        key={factura.id}
                        factura={factura}
                        onPayment={null} // No se puede pagar una factura cancelada
                        onEdit={(factura) => {
                          setEditingInvoice(factura);
                          setShowInvoiceForm(true);
                        }}
                        onCreateCreditNote={null} // Ya está cancelada
                        compact={false}
                      />
                    ))}
                    {facturas.filter(f => f.estatus === 'cancelada').length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No hay facturas canceladas.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="futuras" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facturas.filter(f => f.estatus === 'futura').map(factura => (
                      <InvoiceDetailCard
                        key={factura.id}
                        factura={factura}
                        onPayment={null} // No se puede pagar una factura futura
                        onEdit={(factura) => {
                          setEditingInvoice(factura);
                          setShowInvoiceForm(true);
                        }}
                        onCreateCreditNote={null} // No aplica para facturas futuras
                        compact={false}
                      />
                    ))}
                    {facturas.filter(f => f.estatus === 'futura').length === 0 && (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No hay facturas futuras programadas.
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="todas" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facturas.map(factura => (
                      <InvoiceDetailCard
                        key={factura.id}
                        factura={factura}
                        // An invoice can be paid if its backend status is 'pendiente' (which covers both not-yet-due and overdue)
                        onPayment={factura.estatus === 'pendiente' ? (factura) => {
                          setSelectedInvoiceForPayment(factura);
                          setShowPaymentDialog(true);
                        } : null}
                        onEdit={(factura) => {
                          setEditingInvoice(factura);
                          setShowInvoiceForm(true);
                        }}
                        // Credit note can be created for any invoice not cancelled and not future
                        onCreateCreditNote={factura.estatus !== 'cancelada' && factura.estatus !== 'futura' ? (factura) => { // Updated condition to match 'futura' status
                          setSelectedInvoiceForCredit(factura);
                          setShowCreditNoteDialog(true);
                        } : null}
                        compact={false}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="pagos" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Historial de Pagos</h2>
              
              <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200 bg-slate-50">
                        <tr className="text-left">
                          <th className="p-4 font-semibold text-slate-700">Fecha</th>
                          <th className="p-4 font-semibold text-slate-700">Factura</th>
                          <th className="p-4 font-semibold text-slate-700">Monto</th>
                          <th className="p-4 font-semibold text-slate-700">Método</th>
                          <th className="p-4 font-semibold text-slate-700">Referencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map(pago => (
                          <tr key={pago.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 text-slate-900">
                              {format(new Date(pago.fecha_pago), 'dd/MM/yyyy')}
                            </td>
                            <td className="p-4 font-medium text-slate-900">
                              {pago.numero_factura}
                            </td>
                            <td className="p-4 font-bold text-emerald-600">
                              ₡{pago.monto_pagado?.toLocaleString()}
                            </td>
                            <td className="p-4 text-slate-700 capitalize">
                              {pago.metodo_pago}
                            </td>
                            <td className="p-4 text-slate-600">
                              {pago.referencia_pago || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tareas" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Tareas del Cliente</h2>
                <Button
                  onClick={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>

              <div className="space-y-4">
                {tareas.length > 0 ? tareas.map(tarea => (
                  <Card key={tarea.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-slate-900">{tarea.titulo}</h4>
                            <Badge variant="outline" className={getStatusColor(tarea.estatus)}>{tarea.estatus}</Badge>
                            <Badge variant="outline" className={getPriorityColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
                          </div>
                          <p className="text-slate-700 mb-3 text-sm">{tarea.descripcion}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Programada: {format(new Date(tarea.fecha_programada), 'dd/MM/yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" /> {/* Use UserIcon here */}
                                  <span>Asignado a: {tarea.asignado_a_nombre}</span>
                              </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditTask(tarea)}>
                          <Edit className="w-3 h-3 mr-1" /> Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border-dashed border-2 border-slate-300">
                    <CardContent className="p-8 text-center">
                      <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Sin tareas registradas</h3>
                      <p className="text-slate-500">Crea una nueva tarea para este cliente.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tramites" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Trámites</h2>
                <Button
                  onClick={handleCreateTramite}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Trámite
                </Button>
              </div>
              
              <div className="space-y-6">
                {tramites.map(tramite => (
                  <TramiteCard 
                    key={tramite.id} 
                    tramite={tramite} 
                    allRequisitos={requisitos} 
                    onEditRequisito={handleEditRequisito}
                    onOpenAddRequisito={handleOpenAddRequisito}
                    lastRequisitoUpdate={lastRequisitoUpdate}
                  />
                ))}
                
                {tramites.length === 0 && (
                  <Card className="border-dashed border-2 border-slate-300">
                    <CardContent className="p-8 text-center">
                      <FileCheck2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        No hay trámites iniciados
                      </h3>
                      <p className="text-slate-500 mb-4">
                        Inicia un nuevo trámite para comenzar el proceso de solicitud.
                      </p>
                      <Button onClick={handleCreateTramite} variant="outline">
                        Crear Primer Trámite
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Centro de Comunicaciones</h2>
              
              {cliente?.telefono ? (
                <ChatInterface cliente={cliente} />
              ) : (
                <Card className="border-dashed border-2 border-slate-300">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      Sin número de teléfono
                    </h3>
                    <p className="text-slate-500">
                      Este cliente no tiene un número de teléfono registrado para comunicaciones WhatsApp.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notas" className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Notas del Cliente</h2>
              
              <div className="space-y-4">
                {notas.map(nota => (
                  <Card key={nota.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900">{nota.titulo}</h4>
                        <Badge variant="outline" className="text-xs">
                          {nota.tipo_nota}
                        </Badge>
                      </div>
                      <p className="text-slate-700 mb-3">{nota.contenido}</p>
                      <div className="text-xs text-slate-500">
                        Por {nota.autor} • {format(new Date(nota.created_date), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {notas.length === 0 && (
                  <Card className="border-dashed border-2 border-slate-300">
                    <CardContent className="p-8 text-center">
                      <StickyNote className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">
                        Sin notas registradas
                      </h3>
                      <p className="text-slate-500">
                        Las notas sobre este cliente aparecerán aquí.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Modals */}
      {showClientForm && (
        <ClientForm 
          isOpen={showClientForm} 
          onClose={() => setShowClientForm(false)} 
          cliente={cliente}
          onSave={handleSaveClient}
          users={usuarios}
          currentUser={currentUser}
        />
      )}
      
      {showContractForm && (
        <ContractFormDialog
          isOpen={showContractForm}
          onClose={() => setShowContractForm(false)}
          cliente={cliente}
          vehiculos={vehiculos}
          usuarios={usuarios}
          onSave={() => {}}
        />
      )}
      
      {showInvoiceForm && (
        <InvoiceFormDialog
          isOpen={showInvoiceForm}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(null);
          }}
          cliente={cliente}
          contratos={contratos}
          onSave={handleSaveInvoice}
          editingFactura={editingInvoice}
        />
      )}

      {showCreditNoteDialog && (
        <CreditNoteDialog
          isOpen={showCreditNoteDialog}
          onClose={() => setShowCreditNoteDialog(false)}
          invoice={selectedInvoiceForCredit}
          onCreationSuccess={handleCreditNoteSuccess}
        />
      )}

      {showPaymentDialog && (
        <IntelligentPaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          invoice={selectedInvoiceForPayment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <ClientTaskForm
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSave={handleSaveTask}
        users={usuarios}
      />
      
      <RequisitoForm
        isOpen={showRequisitoForm}
        onClose={() => {
          setShowRequisitoForm(false);
          setEditingRequisito(null);
          // When RequisitoForm closes, ensure the TramiteCard updates
          setLastRequisitoUpdate(Date.now()); 
        }}
        requisito={editingRequisito}
        onSave={handleSaveRequisito}
      />

      <AgregarRequisitoDialog
        isOpen={showAddRequisitoDialog}
        onClose={() => {
          setShowAddRequisitoDialog(false);
        }}
        tramite={selectedTramite}
        maestroRequisitos={maestroRequisitos}
        requisitosActuales={requisitos}
        onRequisitoAdded={handleRequisitoAdded}
      />
    </div>
  );
}
