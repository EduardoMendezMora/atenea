
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Factura } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Receipt, Calendar, DollarSign, Edit, CheckCircle,
  AlertTriangle, FileText, Download, CreditCard, MoreVertical, FileMinus,
  XCircle, Clock, Hourglass
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format, addDays } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Pago } from "@/api/entities";
import { NotaCredito } from "@/api/entities";
import InvoiceDetailCard from "../components/invoices/InvoiceDetailCard";
import IntelligentPaymentDialog from "../components/payments/IntelligentPaymentDialog";

// Helpers de fecha seguros
import { formatYMDToDMY, toSafeUTCDate, formatPeriodo as formatPeriodoString } from "@/components/utils/fechas";

export default function Facturacion() {
  const [facturas, setFacturas] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);

  // Diálogos de pago (viejo y nuevo inteligente)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [showIntelligentPaymentDialog, setShowIntelligentPaymentDialog] = useState(false);
  const [selectedInvoiceForIntelligentPayment, setSelectedInvoiceForIntelligentPayment] = useState(null);

  // Nota de crédito
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
  const [selectedInvoiceForCredit, setSelectedInvoiceForCredit] = useState(null);

  const [formData, setFormData] = useState({
    numero_factura: "",
    contrato_id: "",
    cliente_id: "",
    cliente_nombre: "",
    semana_facturada: "",
    periodo_inicio: "",
    periodo_fin: "",
    monto: "",
    fecha_vencimiento: "",
    estatus: "pendiente",
    fecha_pago: "",
    metodo_pago: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const user = await User.me();

    const canSeeAllInvoices =
      user.role === "admin" || user.rol_sistema === "Gerente" || user.rol_sistema === "Contador";

    let filteredFacturas = [];
    if (canSeeAllInvoices) {
      filteredFacturas = await Factura.list("-created_date");
    } else {
      const misClientes = await Cliente.filter({ asignado_a_id: user.id });
      const misClientesIds = misClientes.map((c) => c.id);
      if (misClientesIds.length > 0) {
        const todasFacturas = await Factura.list("-created_date");
        filteredFacturas = todasFacturas.filter((f) => misClientesIds.includes(f.cliente_id));
      } else {
        filteredFacturas = [];
      }
    }

    const contratosData = await Contrato.filter({ estatus: "activo" });
    setFacturas(filteredFacturas);
    setContratos(contratosData);
    setIsLoading(false);
  };

  /* =========================== FECHAS / ESTADOS ============================ */
  // ¿Está vencida? Comparar mediodía UTC para evitar desfases
  const isFacturaVencida = (factura) => {
    if (!factura.fecha_vencimiento || factura.estatus !== "pendiente") return false;
    const hoyYMD = format(new Date(), "yyyy-MM-dd");
    const hoy = toSafeUTCDate(hoyYMD);
    const vence = toSafeUTCDate(factura.fecha_vencimiento);
    return hoy > vence;
  };

  const getFacturasByEstado = (estado) => {
    switch (estado) {
      case "pendientes": return facturas.filter((f) => f.estatus === "pendiente");
      case "pagadas":    return facturas.filter((f) => f.estatus === "pagada");
      case "canceladas": return facturas.filter((f) => f.estatus === "cancelada");
      case "futuras":    return facturas.filter((f) => f.estatus === "futura");
      default:           return facturas;
    }
  };
  /* ======================================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedContrato = contratos.find((c) => c.id === formData.contrato_id);

    const dataToSave = {
      ...formData,
      cliente_id: selectedContrato?.cliente_id || "",
      cliente_nombre: selectedContrato?.cliente_nombre || "",
      semana_facturada: parseInt(formData.semana_facturada) || 1,
      monto: parseFloat(formData.monto) || 0
    };

    if (editingFactura) {
      await Factura.update(editingFactura.id, dataToSave);
    } else {
      await Factura.create(dataToSave);
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({
      numero_factura: "",
      contrato_id: "",
      cliente_id: "",
      cliente_nombre: "",
      semana_facturada: "",
      periodo_inicio: "",
      periodo_fin: "",
      monto: "",
      fecha_vencimiento: "",
      estatus: "pendiente",
      fecha_pago: "",
      metodo_pago: ""
    });
    setEditingFactura(null);
    setShowForm(false);
  };

  const handleEdit = (factura) => {
    setFormData({
      ...factura,
      monto: factura.monto?.toString() || "",
      semana_facturada: factura.semana_facturada?.toString() || ""
    });
    setEditingFactura(factura);
    setShowForm(true);
  };

  const handleContratoChange = (contratoId) => {
    const contrato = contratos.find((c) => c.id === contratoId);
    if (contrato) {
      const numeroFactura = `F-${Date.now()}`;
      const fechaVencimiento = format(addDays(new Date(), 7), "yyyy-MM-dd");

      setFormData({
        ...formData,
        contrato_id: contratoId,
        cliente_id: contrato.cliente_id,
        cliente_nombre: contrato.cliente_nombre,
        numero_factura: numeroFactura,
        monto: contrato.renta_semanal?.toString() || "",
        fecha_vencimiento: fechaVencimiento,
        semana_facturada: ((contrato.semanas_pagadas || 0) + 1).toString()
      });
    }
  };

  const marcarComoPagada = async (factura) => {
    await Factura.update(factura.id, {
      ...factura,
      estatus: "pagada",
      fecha_pago: format(new Date(), "yyyy-MM-dd"),
      metodo_pago: "transferencia"
    });
    loadData();
  };

  const registrarPago = (factura) => {
    setSelectedInvoiceForPayment(factura);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedInvoiceForPayment(null);
    loadData();
  };

  const registrarPagoInteligente = (factura) => {
    setSelectedInvoiceForIntelligentPayment(factura);
    setShowIntelligentPaymentDialog(true);
  };

  const handleIntelligentPaymentSuccess = () => {
    setShowIntelligentPaymentDialog(false);
    setSelectedInvoiceForIntelligentPayment(null);
    loadData();
  };

  const crearNotaCredito = (factura) => {
    setSelectedInvoiceForCredit(factura);
    setShowCreditNoteDialog(true);
  };

  const handleCreditNoteSuccess = () => {
    setShowCreditNoteDialog(false);
    setSelectedInvoiceForCredit(null);
    loadData();
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pagada: "bg-emerald-100 text-emerald-800 border-emerald-200",
      vencida: "bg-red-100 text-red-800 border-red-200",
      cancelada: "bg-slate-200 text-slate-700 border-slate-300",
      futura: "bg-blue-50 text-blue-700 border-blue-200"
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: AlertTriangle,
      pagada: CheckCircle,
      vencida: AlertTriangle,
      cancelada: XCircle,
      futura: Clock
    };
    return icons[status] || FileText;
  };

  // Mostrar fechas: pasar strings y helpers al card (si tu card los usa)
  const formatPeriodo = (inicio, fin) => formatPeriodoString(inicio, fin);

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Facturación</h1>
            <p className="text-slate-600 mt-1">Administra todas las facturas del sistema</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura Manual
          </Button>
        </motion.div>

        {/* KPIs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Kpi title="Pendientes"  value={getFacturasByEstado("pendientes").length}  icon={Hourglass} bg="bg-orange-100"  color="text-orange-600" />
            <Kpi title="Canceladas"  value={getFacturasByEstado("canceladas").length}  icon={XCircle}    bg="bg-slate-100"   color="text-slate-600" />
            <Kpi title="Futuras"     value={getFacturasByEstado("futuras").length}     icon={Clock}      bg="bg-blue-100"    color="text-blue-600" />
            <Kpi title="Pagadas"     value={getFacturasByEstado("pagadas").length}     icon={CheckCircle} bg="bg-emerald-100" color="text-emerald-600" />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList className="bg-white shadow-sm w-full justify-start mb-6">
              <TabsTrigger value="pendientes" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                Pendientes ({getFacturasByEstado("pendientes").length})
              </TabsTrigger>
              <TabsTrigger value="canceladas" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
                Canceladas ({getFacturasByEstado("canceladas").length})
              </TabsTrigger>
              <TabsTrigger value="futuras" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                Futuras ({getFacturasByEstado("futuras").length})
              </TabsTrigger>
              <TabsTrigger value="pagadas" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
                Pagadas ({getFacturasByEstado("pagadas").length})
              </TabsTrigger>
              <TabsTrigger value="todas" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
                Todas ({facturas.length})
              </TabsTrigger>
            </TabsList>

            {["pendientes", "canceladas", "futuras", "pagadas", "todas"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {(tab === "todas" ? facturas : getFacturasByEstado(tab)).map((factura, index) => (
                      <motion.div
                        key={factura.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <InvoiceDetailCard
                          factura={factura}
                          onPayment={
                            tab === "pendientes" || (tab === "todas" && factura.estatus === "pendiente")
                              ? registrarPagoInteligente
                              : null
                          }
                          onEdit={(fx) => {
                            setEditingFactura(fx);
                            setShowForm(true);
                          }}
                          onCreateCreditNote={
                            factura.estatus !== "cancelada" && factura.estatus !== "futura"
                              ? crearNotaCredito
                              : null
                          }
                          compact={false}
                          // Props opcionales por si tu InvoiceDetailCard las soporta:
                          formatYMDToDMY={formatYMDToDMY}
                          formatPeriodo={formatPeriodo}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {(tab === "pendientes" && getFacturasByEstado("pendientes").length === 0) && (
                    <EmptyState icon={CheckCircle} title="No hay facturas pendientes" subtitle="¡Excelente trabajo manteniendo todo al día!" />
                  )}
                  {(tab === "canceladas" && getFacturasByEstado("canceladas").length === 0) && (
                    <EmptyState icon={XCircle} title="No hay facturas canceladas" />
                  )}
                  {(tab === "futuras" && getFacturasByEstado("futuras").length === 0) && (
                    <EmptyState icon={Clock} title="No hay facturas futuras programadas" />
                  )}
                  {(tab === "pagadas" && getFacturasByEstado("pagadas").length === 0) && (
                    <EmptyState icon={CheckCircle} title="No hay facturas pagadas" />
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* FORMULARIO NUEVA/EDITAR FACTURA */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingFactura ? "Editar Factura" : "Nueva Factura"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormRow label="Número de Factura *">
                  <Input
                    required
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Contrato *">
                  <Select value={formData.contrato_id} onValueChange={handleContratoChange} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
                    <SelectContent>
                      {contratos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numero_contrato} - {c.cliente_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>

                <FormRow label="Semana a Facturar *">
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.semana_facturada}
                    onChange={(e) => setFormData({ ...formData, semana_facturada: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Monto *">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Período Inicio">
                  <Input
                    type="date"
                    value={formData.periodo_inicio}
                    onChange={(e) => setFormData({ ...formData, periodo_inicio: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Período Fin">
                  <Input
                    type="date"
                    value={formData.periodo_fin}
                    onChange={(e) => setFormData({ ...formData, periodo_fin: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Fecha de Vencimiento *">
                  <Input
                    type="date"
                    required
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  />
                </FormRow>

                <FormRow label="Estatus">
                  <Select value={formData.estatus} onValueChange={(value) => setFormData({ ...formData, estatus: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagada">Pagada</SelectItem>
                      <SelectItem value="futura">Futura</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </FormRow>

                {formData.estatus === "pagada" && (
                  <>
                    <FormRow label="Fecha de Pago">
                      <Input
                        type="date"
                        value={formData.fecha_pago}
                        onChange={(e) => setFormData({ ...formData, fecha_pago: e.target.value })}
                      />
                    </FormRow>

                    <FormRow label="Método de Pago">
                      <Select value={formData.metodo_pago} onValueChange={(value) => setFormData({ ...formData, metodo_pago: value })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormRow>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingFactura ? "Actualizar" : "Crear"} Factura
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diálogo de pago (antiguo) */}
        {selectedInvoiceForPayment && (
          <PaymentDialog
            isOpen={showPaymentDialog}
            onClose={() => setShowPaymentDialog(false)}
            invoice={selectedInvoiceForPayment}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* Diálogo de pago inteligente */}
        {selectedInvoiceForIntelligentPayment && (
          <IntelligentPaymentDialog
            isOpen={showIntelligentPaymentDialog}
            onClose={() => setShowIntelligentPaymentDialog(false)}
            invoice={selectedInvoiceForIntelligentPayment}
            onPaymentSuccess={handleIntelligentPaymentSuccess}
          />
        )}

        {/* Nota de crédito */}
        {selectedInvoiceForCredit && (
          <CreditNoteDialog
            isOpen={showCreditNoteDialog}
            onClose={() => setShowCreditNoteDialog(false)}
            invoice={selectedInvoiceForCredit}
            onCreationSuccess={handleCreditNoteSuccess}
          />
        )}
      </div>
    </div>
  );
}

/* ======================== Subcomponentes utilitarios ======================== */
const Kpi = ({ title, value, icon: Icon, bg, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg border-0">
    <div className="flex items-center">
      <div className={`p-2 ${bg} rounded-lg`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="col-span-full text-center py-12">
    <Icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
    <p className="text-slate-500 text-lg">{title}</p>
    {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
  </div>
);

const FormRow = ({ label, children }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

/* ============================ PaymentDialog ============================ */
const PaymentDialog = ({ isOpen, onClose, invoice, onPaymentSuccess }) => {
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaPago, setFechaPago] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [referencia, setReferencia] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (invoice) setMontoPagado(invoice.monto?.toString() || "");
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setIsProcessing(true);

    try {
      await Pago.create({
        factura_id: invoice.id,
        numero_factura: invoice.numero_factura,
        contrato_id: invoice.contrato_id,
        cliente_id: invoice.cliente_id,
        cliente_nombre: invoice.cliente_nombre,
        monto_pagado: parseFloat(montoPagado),
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        referencia_pago: referencia,
        estatus: "aplicado"
      });

      await Factura.update(invoice.id, {
        estatus: "pagada",
        fecha_pago: fechaPago,
        metodo_pago: metodoPago
      });

      const contrato = await Contrato.get(invoice.contrato_id);
      if (contrato) {
        await Contrato.update(contrato.id, {
          semanas_pagadas: (contrato.semanas_pagadas || 0) + 1
        });
      }

      onPaymentSuccess();
    } catch (error) {
      console.error("Error al registrar el pago:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Registrar Pago para Factura {invoice?.numero_factura}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monto_pagado">Monto Pagado *</Label>
              <Input id="monto_pagado" type="number" value={montoPagado} onChange={(e) => setMontoPagado(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="fecha_pago">Fecha de Pago *</Label>
              <Input id="fecha_pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metodo_pago">Método de Pago *</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="deposito">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referencia">Referencia</Label>
              <Input id="referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
              {isProcessing ? "Procesando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* =========================== CreditNoteDialog =========================== */
const CreditNoteDialog = ({ isOpen, onClose, invoice, onCreationSuccess }) => {
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), "yyyy-MM-dd"));
  const [motivo, setMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (invoice) setMonto(invoice.monto?.toString() || "");
  }, [invoice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice) return;
    setIsProcessing(true);

    try {
      await NotaCredito.create({
        numero_nota: `NC-${Date.now()}`,
        factura_id: invoice.id,
        numero_factura: invoice.numero_factura,
        contrato_id: invoice.contrato_id,
        cliente_nombre: invoice.cliente_nombre,
        monto: parseFloat(monto),
        fecha_emision: fechaEmision,
        motivo: motivo,
        estatus: "aplicada"
      });

      await Factura.update(invoice.id, { estatus: "cancelada" });

      if (invoice.estatus === "pagada") {
        const contrato = await Contrato.get(invoice.contrato_id);
        if (contrato) {
          await Contrato.update(contrato.id, {
            semanas_pagadas: Math.max(0, (contrato.semanas_pagadas || 0) - 1)
          });
        }
      }

      onCreationSuccess();
      onClose();
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
          <DialogTitle className="text-2xl font-bold">
            Crear Nota de Crédito para {invoice?.numero_factura}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monto">Monto *</Label>
              <Input id="monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="fecha_emision">Fecha de Emisión *</Label>
              <Input id="fecha_emision" type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required placeholder="Ej: Error en facturación, ajuste de precios..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
              {isProcessing ? "Procesando..." : "Crear Nota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
