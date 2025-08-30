
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pago } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { MovimientoBancario } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle, // Added for receipt success
  Download, // Added for receipt download
  Eye, // Added for receipt view
  Loader2 // Added for loading state in buttons
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { generateReceipt } from "@/api/functions";

const AdvancedPaymentDialog = ({ isOpen, onClose, facturasPendientes, onPaymentSuccess }) => {
  const [selectedFacturaId, setSelectedFacturaId] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaPago, setFechaPago] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [referencia, setReferencia] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // NUEVOS ESTADOS PARA RECIBOS
  const [paymentResult, setPaymentResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  // Estados para movimientos bancarios
  const [movimientosBancarios, setMovimientosBancarios] = useState([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState('');
  const [modoRegistro, setModoRegistro] = useState('manual');
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  // Cargar movimientos bancarios pendientes
  const loadMovimientosBancarios = async () => {
    setLoadingMovimientos(true);
    try {
      const movimientos = await MovimientoBancario.filter({ 
        estatus_conciliacion: 'pendiente',
        tipo_movimiento: 'ingreso'
      });
      setMovimientosBancarios(movimientos);
    } catch (error) {
      console.error('Error cargando movimientos bancarios:', error);
    }
    setLoadingMovimientos(false);
  };

  // Cargar movimientos bancarios cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      loadMovimientosBancarios();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFacturaId) {
      const factura = facturasPendientes.find(f => f.id === selectedFacturaId);
      if (factura && modoRegistro === 'manual') {
        setMontoPagado(factura.monto?.toString() || "");
      }
    } else {
      if (modoRegistro === 'manual') {
        setMontoPagado("");
      }
    }
  }, [selectedFacturaId, facturasPendientes, modoRegistro]);

  // Cuando se selecciona un movimiento bancario, llenar los campos automáticamente
  useEffect(() => {
    if (selectedMovimiento && modoRegistro === 'bancario') {
      const movimiento = movimientosBancarios.find(m => m.id === selectedMovimiento);
      if (movimiento) {
        setMontoPagado(movimiento.monto.toString());
        setFechaPago(movimiento.fecha_movimiento);
        setReferencia(movimiento.referencia || '');
        // Determinar método de pago basado en la descripción
        const descripcion = movimiento.descripcion.toLowerCase();
        if (descripcion.includes('sinpe') || descripcion.includes('movil')) {
          setMetodoPago('transferencia');
        } else if (descripcion.includes('tef')) {
          setMetodoPago('transferencia');
        } else if (descripcion.includes('deposito')) {
          setMetodoPago('deposito');
        } else {
          setMetodoPago('transferencia');
        }
      }
    }
  }, [selectedMovimiento, movimientosBancarios, modoRegistro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const factura = facturasPendientes.find(f => f.id === selectedFacturaId);
    if (!factura) {
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create payment record
      const nuevoPago = await Pago.create({
        factura_id: factura.id,
        numero_factura: factura.numero_factura,
        contrato_id: factura.contrato_id,
        cliente_id: factura.cliente_id,
        cliente_nombre: factura.cliente_nombre,
        monto_pagado: parseFloat(montoPagado),
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        referencia_pago: referencia,
        estatus: "aplicado"
      });

      // Si se usó un movimiento bancario, actualizarlo
      if (modoRegistro === 'bancario' && selectedMovimiento) {
        const movimiento = movimientosBancarios.find(m => m.id === selectedMovimiento);
        if (movimiento) {
          await MovimientoBancario.update(selectedMovimiento, {
            estatus_conciliacion: 'aplicado',
            factura_id: factura.id,
            cliente_id: factura.cliente_id,
            cliente_nombre: factura.cliente_nombre,
            numero_factura: factura.numero_factura,
            fecha_aplicacion: fechaPago
          });
        }
      }

      // 2. Update invoice
      await Factura.update(factura.id, {
        estatus: 'pagada',
        fecha_pago: fechaPago,
        metodo_pago: metodoPago
      });

      // 3. Update contract
      const contrato = await Contrato.get(factura.contrato_id);
      if (contrato) {
        await Contrato.update(contrato.id, {
          semanas_pagadas: (contrato.semanas_pagadas || 0) + 1
        });
      }
      
      onPaymentSuccess();
      setPaymentResult(nuevoPago); // MOSTRAR VISTA DE ÉXITO CON RECIBO

    } catch (error) {
      console.error("Error al registrar el pago:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!paymentResult) return;
    setIsDownloading(true);
    try {
        const { data } = await generateReceipt({ paymentId: paymentResult.id });
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo_${paymentResult.id.slice(-6)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch(error) {
        console.error("Error al descargar recibo:", error);
        alert("No se pudo generar el recibo.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleViewReceipt = async () => {
    if (!paymentResult) return;
    setIsViewing(true);
    try {
        const { data } = await generateReceipt({ paymentId: paymentResult.id });
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch(error) {
        console.error("Error al visualizar recibo:", error);
        alert("No se pudo generar el recibo.");
    } finally {
        setIsViewing(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFacturaId("");
    setMontoPagado("");
    setFechaPago(format(new Date(), 'yyyy-MM-dd'));
    setMetodoPago("transferencia");
    setReferencia("");
    setSelectedMovimiento('');
    setModoRegistro('manual');
    setPaymentResult(null); // RESETEAR RESULTADO
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {paymentResult ? (
          <div className="text-center p-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl font-bold mb-2">¡Pago Registrado!</DialogTitle>
            <p className="text-slate-600 mb-6 max-w-sm">
              El pago ha sido aplicado exitosamente a la factura {facturasPendientes.find(f => f.id === selectedFacturaId)?.numero_factura}.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button onClick={handleViewReceipt} disabled={isViewing} className="bg-blue-600 hover:bg-blue-700">
                    {isViewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                    Visualizar Recibo
                </Button>
                <Button onClick={handleDownloadReceipt} disabled={isDownloading} variant="outline">
                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Descargar Recibo
                </Button>
                <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Registrar Nuevo Pago</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="factura_id">Factura Pendiente *</Label>
                <Select value={selectedFacturaId} onValueChange={setSelectedFacturaId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una factura..." />
                  </SelectTrigger>
                  <SelectContent>
                    {facturasPendientes.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.numero_factura} - {f.cliente_nombre} (₡{f.monto?.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={modoRegistro} onValueChange={setModoRegistro}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Registro Manual</TabsTrigger>
                  <TabsTrigger value="bancario">Desde Movimiento Bancario</TabsTrigger>
                </TabsList>

                <TabsContent value="bancario" className="space-y-4">
                  <div>
                    <Label htmlFor="movimiento_bancario">Seleccionar Movimiento Bancario</Label>
                    {loadingMovimientos ? (
                      <div className="p-4 text-center text-slate-500">Cargando movimientos...</div>
                    ) : (
                      <Select value={selectedMovimiento} onValueChange={setSelectedMovimiento}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un movimiento bancario..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {movimientosBancarios.length > 0 ? (
                            movimientosBancarios.map(mov => (
                              <SelectItem key={mov.id} value={mov.id}>
                                <div className="flex flex-col">
                                  <div className="font-medium">
                                    ₡{mov.monto?.toLocaleString()} - {format(new Date(mov.fecha_movimiento), 'dd/MM/yyyy')}
                                  </div>
                                  <div className="text-xs text-slate-600 truncate max-w-xs">
                                    {mov.descripcion} - {mov.banco_nombre}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-slate-500">
                              No hay movimientos bancarios pendientes
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {selectedMovimiento && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        {(() => {
                          const movimiento = movimientosBancarios.find(m => m.id === selectedMovimiento);
                          return movimiento ? (
                            <div className="space-y-2 text-sm">
                              <div><strong>Banco:</strong> {movimiento.banco_nombre}</div>
                              <div><strong>Fecha:</strong> {format(new Date(movimiento.fecha_movimiento), 'dd/MM/yyyy')}</div>
                              <div><strong>Descripción:</strong> {movimiento.descripcion}</div>
                              <div><strong>Referencia:</strong> {movimiento.referencia || 'Sin referencia'}</div>
                              <div><strong>Monto:</strong> ₡{movimiento.monto?.toLocaleString()}</div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monto_pagado">Monto Pagado *</Label>
                      <Input 
                        id="monto_pagado" 
                        type="number" 
                        value={montoPagado} 
                        onChange={e => setMontoPagado(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_pago">Fecha de Pago *</Label>
                      <Input 
                        id="fecha_pago" 
                        type="date" 
                        value={fechaPago} 
                        onChange={e => setFechaPago(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="metodo_pago">Método de Pago *</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                      <Input 
                        id="referencia" 
                        value={referencia} 
                        onChange={e => setReferencia(e.target.value)} 
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={isProcessing || !selectedFacturaId || (modoRegistro === 'bancario' && !selectedMovimiento)}
                >
                  {isProcessing ? "Procesando..." : "Registrar Pago"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(null); // State for individual receipt loading

  const loadData = async () => {
    setIsLoading(true);
    const [pagosData, facturasData] = await Promise.all([
      Pago.list('-fecha_pago'),
      Factura.filter({ estatus: 'pendiente' })
    ]);
    setPagos(pagosData);
    setFacturasPendientes(facturasData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewReceipt = async (paymentId) => {
    setLoadingReceipt(paymentId);
    try {
      const { data } = await generateReceipt({ paymentId });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error al visualizar recibo:", error);
      alert("No se pudo generar el recibo.");
    } finally {
      setLoadingReceipt(null);
    }
  };

  const filteredPagos = pagos.filter(pago =>
    pago.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pago.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pago.referencia_pago?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Historial de Pagos
            </h1>
            <p className="text-slate-600 font-medium">
              Todos los pagos aplicados a facturas • {pagos.length} registros
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
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
              placeholder="Buscar por cliente, factura o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200">
                  <tr className="text-left text-slate-600">
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Factura</th>
                    <th className="p-4 font-semibold">Monto Pagado</th>
                    <th className="p-4 font-semibold">Fecha de Pago</th>
                    <th className="p-4 font-semibold">Método</th>
                    <th className="p-4 font-semibold">Referencia</th>
                    <th className="p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPagos.map(pago => (
                    <tr key={pago.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900">{pago.cliente_nombre}</td>
                      <td className="p-4 text-slate-600">{pago.numero_factura}</td>
                      <td className="p-4 font-semibold text-emerald-600">₡{pago.monto_pagado?.toLocaleString()}</td>
                      <td className="p-4 text-slate-600">{format(new Date(pago.fecha_pago), 'dd/MM/yyyy')}</td>
                      <td className="p-4 text-slate-600 capitalize">{pago.metodo_pago}</td>
                      <td className="p-4 text-slate-600">{pago.referencia_pago}</td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReceipt(pago.id)}
                          disabled={loadingReceipt === pago.id}
                          className="text-blue-600 hover:bg-blue-100"
                        >
                          {loadingReceipt === pago.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          <span className="ml-2">Recibo</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AdvancedPaymentDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          facturasPendientes={facturasPendientes}
          onPaymentSuccess={loadData}
        />
      </div>
    </div>
  );
}
