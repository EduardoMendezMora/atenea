import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Contrato } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Vehiculo } from "@/api/entities";
import { Factura } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Calendar, DollarSign, Edit, Building2, Truck, Send, Loader2, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getWhatsappGroupInfo } from "@/api/functions";
import { sendAccountStatement } from "@/api/functions";
import { regenerateContractInvoices } from "@/api/functions/regenerateContractInvoices";
import { fixInvoicePeriods } from "@/api/functions";

export default function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [isProcessingContract, setIsProcessingContract] = useState(false);
  const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(false);
  const [isSendingStatement, setIsSendingStatement] = useState(null);
  const [isFixingInvoices, setIsFixingInvoices] = useState(null);

  const [formData, setFormData] = useState({
    numero_contrato: "",
    cliente_id: "",
    vehiculo_id: "",
    // En el form capturamos FECHA DE FIRMA
    fecha_inicio: "",
    whatsapp_grupo_id: "",
    whatsapp_grupo_nombre: "",
    vendedor_id: "",
    // Desde vehículo
    renta_semanal: 0,
    gastos_administrativos: 0,
    plazo_semanas: 0,
    vehiculo_descripcion: ""
  });

  // ===================== Fechas seguras (UTC) ======================
  const formatUTCToYMD = (dt) => {
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatYMDToDMY = (ymd) => {
    if (!ymd) return "-";
    const [y, m, d] = ymd.split("-").map(Number);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  };

  // Suma días sobre YYYY-MM-DD, anclado a 12:00 UTC para evitar DST
  const sumarDiasYMD = (fechaYmd, dias) => {
    const [y, m, d] = fechaYmd.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    dt.setUTCDate(dt.getUTCDate() + dias);
    return formatUTCToYMD(dt);
  };

  const todayYMDUTC = () => {
    const now = new Date();
    return formatUTCToYMD(new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
    )));
  };
  // ================================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      const canSeeAllContracts =
        user.role === "admin" || user.rol_sistema === "Gerente" || user.rol_sistema === "Contador";

      let filteredContratos;
      if (canSeeAllContracts) {
        filteredContratos = await Contrato.list("-created_date");
      } else {
        const misClientes = await Cliente.filter({ asignado_a_id: user.id });
        const misClientesIds = misClientes.map((c) => c.id);
        if (misClientesIds.length > 0) {
          const todosContratos = await Contrato.list("-created_date");
          filteredContratos = todosContratos.filter((c) => misClientesIds.includes(c.cliente_id));
        } else {
          filteredContratos = [];
        }
      }

      const [clientesData, vehiculosData, usuariosData] = await Promise.all([
        Cliente.list(),
        Vehiculo.list(),
        User.list(),
      ]);

      setContratos(filteredContratos);
      setClientes(clientesData);
      setVehiculos(vehiculosData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleVehiculoChange = async (vehiculoId) => {
    const vehiculo = vehiculos.find((v) => v.id === vehiculoId);
    if (vehiculo) {
      setFormData((prev) => ({
        ...prev,
        vehiculo_id: vehiculoId,
        renta_semanal: vehiculo.renta_semanal || 0,
        gastos_administrativos: vehiculo.gastos_administrativos || 0,
        plazo_semanas: vehiculo.plazo_semanas || 52,
        vehiculo_descripcion: `${vehiculo.placas || vehiculo.numero_economico} - ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}`,
      }));
    }
  };

  const handleWhatsappGroupIdChange = async (groupId) => {
    setFormData((prev) => ({ ...prev, whatsapp_grupo_id: groupId }));

    if (groupId && groupId.includes("@g.us")) {
      setIsLoadingGroupInfo(true);
      try {
        const response = await getWhatsappGroupInfo({ groupId });
        if (response.data && response.data.success) {
          setFormData((prev) => ({
            ...prev,
            whatsapp_grupo_nombre: response.data.groupName,
          }));
        } else {
          setFormData((prev) => ({ ...prev, whatsapp_grupo_nombre: "" }));
        }
      } catch (error) {
        console.error("Error obteniendo info del grupo:", error);
        setFormData((prev) => ({ ...prev, whatsapp_grupo_nombre: "" }));
      } finally {
        setIsLoadingGroupInfo(false);
      }
    } else {
      setFormData((prev) => ({ ...prev, whatsapp_grupo_nombre: "" }));
    }
  };

  // Genera facturas usando fecha_inicio = INICIO DE PERÍODO (D+1)
  const generateAutomaticInvoices = async (contratoData) => {
    const facturasACrear = [];
    const base = contratoData.fecha_inicio; // inicio de periodo (D+1)

    const todayYMD = todayYMDUTC();
    const todayUtcMidnight = new Date(todayYMD + "T00:00:00Z");

    const contratoNumero =
      (contratoData.numero_contrato?.replace(/[^0-9]/g, "")) ||
      (contratoData.id ? String(contratoData.id).slice(-4) : "0000");

    // 1) Gastos administrativos (vence a los 7 días desde el inicio del período)
    if (Number(contratoData.gastos_administrativos) > 0) {
      const venceGA = sumarDiasYMD(base, 7); // D+8 cuando la base es D+1
      const venceGADate = new Date(venceGA + "T00:00:00Z");
      const estatusGastos = venceGADate > todayUtcMidnight ? "futura" : "pendiente";

      facturasACrear.push({
        numero_factura: `${contratoNumero}-GA1`,
        contrato_id: contratoData.id,
        cliente_id: contratoData.cliente_id,
        cliente_nombre: contratoData.cliente_nombre,
        semana_facturada: 0,
        periodo_inicio: base,
        periodo_fin: base,
        monto: Number(contratoData.gastos_administrativos) || 0,
        fecha_vencimiento: venceGA,
        estatus: estatusGastos,
        concepto: "Gastos Administrativos",
        multa_diaria: 2000,
      });
    }

    // 2) Semanales: inicio=base+(s-1)*7; fin=base+s*7-1; vence=base+s*7  ✅
    const semanas = Number(contratoData.plazo_semanas || 0);
    for (let s = 1; s <= semanas; s++) {
      const inicioSemana = sumarDiasYMD(base, (s - 1) * 7);
      const finSemana = sumarDiasYMD(base, s * 7 - 1);
      const fechaVencimiento = sumarDiasYMD(base, s * 7); // <- FIX crítico

      const vencimientoDate = new Date(fechaVencimiento + "T00:00:00Z");
      const estatus = vencimientoDate > todayUtcMidnight ? "futura" : "pendiente";

      facturasACrear.push({
        numero_factura: `${contratoNumero}-S${s.toString().padStart(2, "0")}`,
        contrato_id: contratoData.id,
        cliente_id: contratoData.cliente_id,
        cliente_nombre: contratoData.cliente_nombre,
        semana_facturada: s,
        periodo_inicio: inicioSemana,
        periodo_fin: finSemana,
        monto: Number(contratoData.renta_semanal) || 0,
        fecha_vencimiento: fechaVencimiento,
        estatus,
        concepto: `Renta Semanal - Semana ${s}`,
        multa_diaria: 2000,
      });
    }

    if (facturasACrear.length > 0) {
      await Factura.bulkCreate(facturasACrear);
    }

    // Relacionar GA si existe
    const facturaGastosCreada = facturasACrear.find((f) => f.semana_facturada === 0);
    if (facturaGastosCreada) {
      const createdInvoice = await Factura.filter({ numero_factura: facturaGastosCreada.numero_factura });
      if (createdInvoice.length > 0) {
        await Contrato.update(contratoData.id, { factura_gastos_id: createdInvoice[0].id });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessingContract(true);

    try {
      const selectedCliente = clientes.find((c) => c.id === formData.cliente_id);
      const selectedVehiculo = vehiculos.find((v) => v.id === formData.vehiculo_id);
      const selectedVendedor = usuarios.find((u) => u.id === formData.vendedor_id);

      // El form captura FECHA DE FIRMA -> convertimos a INICIO DE PERÍODO (D+1)
      const fechaFirma = formData.fecha_inicio;
      const fechaInicioPeriodo = sumarDiasYMD(fechaFirma, 1); // D+1
      const semanas = Number(formData.plazo_semanas) || 52;
      const fechaFinString = sumarDiasYMD(fechaInicioPeriodo, semanas * 7 - 1);

      const dataToSave = {
        ...formData,
        numero_contrato: formData.numero_contrato || `C-${Date.now()}`,
        cliente_nombre: selectedCliente?.nombre_empresa || "",
        vehiculo_numero_economico: selectedVehiculo?.numero_economico || "",
        vendedor_nombre: selectedVendedor?.full_name || "",
        // Guardamos inicio de PERÍODO en BD
        fecha_inicio: fechaInicioPeriodo,
        fecha_fin: fechaFinString,
        facturas_generadas: false,
      };

      let contratoCreado;
      if (editingContrato) {
        await Contrato.update(editingContrato.id, dataToSave);
        contratoCreado = { ...editingContrato, ...dataToSave };
      } else {
        contratoCreado = await Contrato.create(dataToSave);

        if (selectedVehiculo) {
          await Vehiculo.update(selectedVehiculo.id, {
            estatus: "colocado",
            contrato_activo_id: contratoCreado.id,
            cliente_actual: selectedCliente?.nombre_empresa,
          });
        }

        await generateAutomaticInvoices(contratoCreado);
        await Contrato.update(contratoCreado.id, { facturas_generadas: true });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error creating contract:", error);
    } finally {
      setIsProcessingContract(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_contrato: "",
      cliente_id: "",
      vehiculo_id: "",
      fecha_inicio: "",
      whatsapp_grupo_id: "",
      whatsapp_grupo_nombre: "",
      vendedor_id: "",
      renta_semanal: 0,
      gastos_administrativos: 0,
      plazo_semanas: 0,
      vehiculo_descripcion: ""
    });
    setEditingContrato(null);
    setShowForm(false);
  };

  const handleEdit = (contrato) => {
    // El contrato guarda fecha_inicio = INICIO DE PERÍODO (D+1).
    // Para mostrar "Fecha de firma" en el form: restamos 1 día.
    const fechaFirmaParaForm = contrato.fecha_inicio ? sumarDiasYMD(contrato.fecha_inicio, -1) : "";

    setFormData({
      ...contrato,
      renta_semanal: contrato.renta_semanal || 0,
      gastos_administrativos: contrato.gastos_administrativos || 0,
      plazo_semanas: contrato.plazo_semanas || 0,
      fecha_inicio: fechaFirmaParaForm,
    });
    setEditingContrato(contrato);
    setShowForm(true);
  };

  const handleSendStatement = async (contractId) => {
    setIsSendingStatement(contractId);
    try {
      await sendAccountStatement({ contractId });
      console.log(`Estado de cuenta para contrato ${contractId} enviado.`);
    } catch (error) {
      console.error("Error al enviar estado de cuenta:", error);
    } finally {
      setIsSendingStatement(null);
    }
  };

  const handleFixInvoicePeriods = async (contratoId) => {
    setIsFixingInvoices(contratoId);
    try {
      const response = await fixInvoicePeriods({ contratoId });
      console.log("Períodos corregidos:", response.data);
      alert(`✅ Períodos corregidos: ${response.data.facturasCorregidas} facturas`);
      loadData();
    } catch (error) {
      console.error("Error al corregir períodos:", error);
      alert("❌ Error al corregir períodos. Revise la consola.");
    } finally {
      setIsFixingInvoices(null);
    }
  };

  const filteredContratos = contratos.filter(
    (contrato) =>
      contrato.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contrato.vehiculo_descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateProgress = (contrato) => {
    return contrato.plazo_semanas > 0
      ? Math.min(100, (contrato.semanas_pagadas / contrato.plazo_semanas) * 100)
      : 0;
  };

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
              Gestión de Contratos
            </h1>
            <p className="text-slate-600 font-medium">
              Sistema automatizado de contratos de leasing • {contratos.length} registrados
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contrato
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por número, cliente o vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredContratos.map((contrato, index) => (
                <motion.div
                  key={contrato.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                              {contrato.numero_contrato}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                              <Building2 className="w-4 h-4" />
                              {contrato.cliente_nombre}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Truck className="w-4 h-4" />
                              {contrato.vehiculo_descripcion || `${contrato.vehiculo_numero_economico}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendStatement(contrato.id)}
                            disabled={!contrato.whatsapp_grupo_id || isSendingStatement === contrato.id}
                            title="Enviar Estado de Cuenta por WhatsApp"
                          >
                            {isSendingStatement === contrato.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-blue-600" />}
                          </Button>
                          
                          <Button
                            variant="ghost"  
                            size="icon"
                            onClick={() => handleFixInvoicePeriods(contrato.id)}
                            disabled={isFixingInvoices === contrato.id}
                            title="Corregir Períodos de Facturas"
                          >
                            {isFixingInvoices === contrato.id ? <Loader2 className="w-4 h-4 animate-spin text-green-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(contrato)}
                            className="hover:bg-slate-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Renta Semanal</p>
                            <p className="text-lg font-bold text-emerald-600">
                              ₡{contrato.renta_semanal?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">Vendedor</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {contrato.vendedor_nombre || 'Sin asignar'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Progreso del Contrato</span>
                            <span className="font-semibold text-slate-900">
                              {contrato.semanas_pagadas || 0} / {contrato.plazo_semanas} semanas
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculateProgress(contrato)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-slate-500">Inicio (período)</p>
                              <p className="font-semibold text-slate-900">
                                {formatYMDToDMY(contrato.fecha_inicio)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-slate-500">Plazo</p>
                              <p className="font-semibold text-slate-900">{contrato.plazo_semanas} semanas</p>
                            </div>
                          </div>
                        </div>

                        {contrato.whatsapp_grupo_nombre && (
                          <div className="pt-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-medium">WhatsApp</p>
                            <p className="text-sm font-semibold text-green-700">
                              📱 {contrato.whatsapp_grupo_nombre}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingContrato ? 'Editar Contrato' : 'Nuevo Contrato Automatizado'}
              </DialogTitle>
              <DialogDescription>
                {editingContrato 
                  ? 'Modificar los datos del contrato existente.' 
                  : 'Al crear el contrato se generarán automáticamente las facturas correspondientes.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_contrato">Número de Contrato</Label>
                  <Input
                    id="numero_contrato"
                    placeholder="Se genera automáticamente"
                    value={formData.numero_contrato}
                    onChange={(e) => setFormData({...formData, numero_contrato: e.target.value})}
                    disabled={!!editingContrato}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select 
                    value={formData.cliente_id} 
                    onValueChange={(value) => setFormData({...formData, cliente_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre_empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehiculo_id">Vehículo *</Label>
                  <Select 
                    value={formData.vehiculo_id} 
                    onValueChange={handleVehiculoChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vehículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculos.map(vehiculo => (
                        <SelectItem key={vehiculo.id} value={vehiculo.id}>
                          {vehiculo.placas || vehiculo.numero_economico} - {vehiculo.marca} {vehiculo.modelo} ({vehiculo.estatus || 'Sin Estatus'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  {/* Captura FECHA DE FIRMA */}
                  <Label htmlFor="fecha_inicio">Fecha de firma *</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    La primera semana será desde el día siguiente a la firma (D+1) por 7 días; el vencimiento es (D+8).
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="vendedor_id">Vendedor Asignado *</Label>
                  <Select 
                    value={formData.vendedor_id} 
                    onValueChange={(value) => setFormData({...formData, vendedor_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map(usuario => (
                        <SelectItem key={usuario.id} value={usuario.id}>
                          {usuario.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.vehiculo_id && (
                  <>
                    <div>
                      <Label htmlFor="renta_semanal">Renta Semanal *</Label>
                      <Input
                        id="renta_semanal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.renta_semanal}
                        onChange={(e) => setFormData({...formData, renta_semanal: parseFloat(e.target.value) || 0})}
                        className="bg-white"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-slate-600 mt-1">Valor tomado del vehículo, editable.</p>
                    </div>
                    <div>
                      <Label htmlFor="gastos_administrativos">Gastos Administrativos</Label>
                      <Input
                        id="gastos_administrativos"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.gastos_administrativos}
                        onChange={(e) => setFormData({...formData, gastos_administrativos: parseFloat(e.target.value) || 0})}
                        className="bg-white"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-slate-600 mt-1">Valor tomado del vehículo, editable.</p>
                    </div>
                    <div>
                      <Label htmlFor="plazo_semanas">Plazo en Semanas</Label>
                      <Input
                        id="plazo_semanas"
                        type="number"
                        min="1"
                        value={formData.plazo_semanas}
                        onChange={(e) => setFormData({...formData, plazo_semanas: parseInt(e.target.value) || 52})}
                        className="bg-white"
                        placeholder="52"
                      />
                      <p className="text-xs text-slate-600 mt-1">Valor tomado del vehículo, editable.</p>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <Label htmlFor="whatsapp_grupo_id">ID del Grupo de WhatsApp para Estados de Cuenta</Label>
                  <Input
                    id="whatsapp_grupo_id"
                    value={formData.whatsapp_grupo_id}
                    onChange={(e) => handleWhatsappGroupIdChange(e.target.value)}
                    placeholder="Ej: 120363025517544973@g.us"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Se enviará el estado de cuenta diariamente a las 9:00 AM a este grupo.
                  </p>
                </div>

                {formData.whatsapp_grupo_nombre && (
                  <div className="md:col-span-2">
                    <div className="p-3 bg-green-100 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">
                          📱 Grupo conectado: {formData.whatsapp_grupo_nombre}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={isProcessingContract}
                >
                  {isProcessingContract ? 'Procesando...' : editingContrato ? 'Actualizar' : 'Crear'} Contrato
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


