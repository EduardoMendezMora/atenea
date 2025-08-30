
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, differenceInDays } from 'date-fns'; // Added differenceInDays
import { Pago } from '@/api/entities';
import { Factura } from '@/api/entities';
import { Contrato } from '@/api/entities';
import { MovimientoBancario } from '@/api/entities';
import { calcularDesgloseFactura } from '../invoices/InvoiceDetailCard';
import { CheckCircle, Download, Loader2, Eye } from 'lucide-react';
import { generateReceipt } from '@/api/functions';

export default function IntelligentPaymentDialog({ isOpen, onClose, invoice, onPaymentSuccess }) {
  const [montoPagado, setMontoPagado] = useState('');
  const [fechaPago, setFechaPago] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [referencia, setReferencia] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [montoInicializado, setMontoInicializado] = useState(false);
  
  // NUEVOS ESTADOS PARA MANEJAR EL PROCESO
  const [paymentResult, setPaymentResult] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  // NUEVO: Estado para la multa calculada dinámicamente
  const [multaCalculada, setMultaCalculada] = useState(0);

  // NUEVO: Estados para movimientos bancarios
  const [movimientosBancarios, setMovimientosBancarios] = useState([]);
  const [selectedMovimiento, setSelectedMovimiento] = useState('');
  const [modoRegistro, setModoRegistro] = useState('manual'); // 'manual' o 'bancario'
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);

  const desglose = invoice ? calcularDesgloseFactura(invoice) : null;

  // NUEVO: Cargar movimientos bancarios pendientes
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
    if (isOpen && !paymentResult) { // Load only if dialog is open and not showing success screen
      loadMovimientosBancarios();
    }
  }, [isOpen, paymentResult]);

  // CORREGIDO: Solo inicializar el monto una vez cuando se abre el diálogo
  // Sugerir el total pendiente a hoy, el usuario puede ajustarlo
  useEffect(() => {
    if (isOpen && invoice && desglose && !montoInicializado && modoRegistro === 'manual' && !paymentResult) {
      setMontoPagado(desglose.totalPendiente.toString());
      setMontoInicializado(true);
    }
  }, [isOpen, invoice, desglose, montoInicializado, modoRegistro, paymentResult]);
  
  // NUEVO: Efecto para calcular la multa dinámicamente cuando cambia la fecha de pago
  useEffect(() => {
    if (invoice && fechaPago) {
      const esFacturaSemanal = invoice.semana_facturada && invoice.semana_facturada > 0;
      if (!esFacturaSemanal) {
        setMultaCalculada(0);
        return;
      }

      // CORRECCIÓN: Usar UTC para evitar problemas de zona horaria
      const [pagoYear, pagoMonth, pagoDay] = fechaPago.split('-').map(Number);
      const fechaDePagoUTC = new Date(Date.UTC(pagoYear, pagoMonth - 1, pagoDay));
      
      const [vencYear, vencMonth, vencDay] = invoice.fecha_vencimiento.split('-').map(Number);
      const fechaVencimientoUTC = new Date(Date.UTC(vencYear, vencMonth - 1, vencDay));
      
      if (fechaDePagoUTC > fechaVencimientoUTC) {
        const diasDeAtraso = differenceInDays(fechaDePagoUTC, fechaVencimientoUTC);
        const multaTotal = diasDeAtraso * (invoice.multa_diaria || 2000);
        setMultaCalculada(multaTotal);
      } else {
        setMultaCalculada(0);
      }
    } else {
      setMultaCalculada(0); // Reset if no invoice or date is selected
    }
  }, [invoice, fechaPago]);


  // NUEVO: Cuando se selecciona un movimiento bancario, llenar los campos automáticamente
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

  // Reset cuando se cierra el diálogo
  useEffect(() => {
    if (!isOpen) {
      setMontoInicializado(false);
      setSelectedMovimiento('');
      setModoRegistro('manual');
      setPaymentResult(null); // Resetear el resultado
      setMultaCalculada(0); // Reset multa calculada
    }
  }, [isOpen]);

  // CORREGIDO: La función ahora usa la multa dinámica calculada
  const calcularAplicacionPago = (monto, multaPendienteDinamica) => {
    if (!desglose) return null;

    const montoFloat = parseFloat(monto) || 0;
    let montoRestante = montoFloat;
    
    // Primero se aplica al saldo original
    const aplicarASaldo = Math.min(montoRestante, desglose.saldoPendiente);
    montoRestante -= aplicarASaldo;
    
    // Luego a las multas
    const aplicarAMultas = Math.min(montoRestante, multaPendienteDinamica);
    montoRestante -= aplicarAMultas;
    
    const sobrante = montoRestante;

    return {
      aplicarASaldo,
      aplicarAMultas,
      sobrante,
      nuevoSaldoPendiente: desglose.saldoPendiente - aplicarASaldo,
      nuevasMultasPendientes: multaPendienteDinamica - aplicarAMultas
    };
  };

  // Se calcula la multa pendiente real en base a la multa calculada y lo ya pagado
  // Es importante restar el monto_pagado_multas para que la aplicación solo considere la porción de la multa
  // que aún no ha sido cubierta por pagos anteriores, basándose en la multa calculada a la fecha de pago.
  const multasPendientesReales = Math.max(0, multaCalculada - (invoice?.monto_pagado_multas || 0));
  const aplicacion = montoPagado ? calcularAplicacionPago(montoPagado, multasPendientesReales) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoice || !aplicacion) return;

    setIsProcessing(true);

    try {
      // Crear registro de pago
      const nuevoPago = await Pago.create({
        factura_id: invoice.id,
        numero_factura: invoice.numero_factura,
        contrato_id: invoice.contrato_id,
        cliente_id: invoice.cliente_id,
        cliente_nombre: invoice.cliente_nombre,
        monto_pagado: parseFloat(montoPagado),
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        referencia_pago: referencia,
        estatus: 'aplicado',
        monto_aplicado_saldo: aplicacion.aplicarASaldo,
        monto_aplicado_multas: aplicacion.aplicarAMultas
      });

      // NUEVO: Si se usó un movimiento bancario, actualizarlo
      if (modoRegistro === 'bancario' && selectedMovimiento) {
        const movimiento = movimientosBancarios.find(m => m.id === selectedMovimiento);
        if (movimiento) {
          await MovimientoBancario.update(selectedMovimiento, {
            estatus_conciliacion: 'aplicado',
            factura_id: invoice.id,
            cliente_id: invoice.cliente_id,
            cliente_nombre: invoice.cliente_nombre,
            numero_factura: invoice.numero_factura,
            fecha_aplicacion: fechaPago
          });
        }
      }

      // Actualizar la factura
      const nuevosMontos = {
        monto_pagado_saldo: (invoice.monto_pagado_saldo || 0) + aplicacion.aplicarASaldo,
        monto_pagado_multas: (invoice.monto_pagado_multas || 0) + aplicacion.aplicarAMultas
      };

      // CORRECCIÓN CRÍTICA: Solo marcar como pagada si el saldo original está 100% cubierto
      if (nuevosMontos.monto_pagado_saldo >= invoice.monto) {
        nuevosMontos.estatus = 'pagada';
        nuevosMontos.fecha_pago = fechaPago;
        nuevosMontos.metodo_pago = metodoPago;

        // Solo actualizar progreso del contrato si es una factura semanal
        if (invoice.semana_facturada && invoice.semana_facturada > 0) {
          const contrato = await Contrato.get(invoice.contrato_id);
          if (contrato) {
            await Contrato.update(contrato.id, {
              semanas_pagadas: (contrato.semanas_pagadas || 0) + 1
            });
          }
        }
      } else {
        // Si no está completamente pagada, mantener como pendiente
        nuevosMontos.estatus = 'pendiente';
      }

      await Factura.update(invoice.id, nuevosMontos);

      onPaymentSuccess(); // Recargar datos en la vista principal
      setPaymentResult(nuevoPago); // MOSTRAR VISTA DE ÉXITO

    } catch (error) {
      console.error('Error procesando pago:', error);
      alert('Error al procesar el pago. Por favor, intente de nuevo.');
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
        // No es necesario revocar la URL, la nueva pestaña la mantiene viva.
    } catch(error) {
        console.error("Error al visualizar recibo:", error);
        alert("No se pudo generar el recibo.");
    } finally {
        setIsViewing(false);
    }
  };

  const handleClose = () => {
    setMontoPagado('');
    setFechaPago(format(new Date(), 'yyyy-MM-dd'));
    setMetodoPago('transferencia');
    setReferencia('');
    setMontoInicializado(false);
    setSelectedMovimiento('');
    setModoRegistro('manual');
    setPaymentResult(null); // Resetear el resultado
    setMultaCalculada(0); // Reset multa calculada
    onClose();
  };

  // Función para sugerir montos rápidos
  const sugerirMonto = (monto) => {
    setMontoPagado(monto.toString());
  };

  if (!isOpen) return null; // Only render if dialog is open

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        {paymentResult ? (
          <div className="text-center p-8 flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <DialogTitle className="text-2xl font-bold mb-2">¡Pago Registrado!</DialogTitle>
            <p className="text-slate-600 mb-6 max-w-sm">
              El pago ha sido aplicado exitosamente a la factura {invoice.numero_factura}.
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
              <DialogTitle className="text-2xl font-bold">
                Pago para {invoice.numero_factura}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-3">
              {/* Resumen de la factura */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-slate-900">Desglose Original</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Saldo pendiente:</span>
                    <span className="font-bold text-red-600 ml-2">
                      ₡{desglose?.saldoPendiente.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Multas (a hoy):</span>
                    <span className="font-bold text-orange-600 ml-2">
                      ₡{desglose?.multasPendientes.toLocaleString()}
                    </span>
                  </div>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between font-bold">
                  <span>Total pendiente (a hoy):</span>
                  <span>₡{desglose?.totalPendiente.toLocaleString()}</span>
                </div>
              </div>

              {/* NUEVO: Tabs para elegir modo de registro */}
              <Tabs value={modoRegistro} onValueChange={setModoRegistro}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Registro Manual</TabsTrigger>
                  <TabsTrigger value="bancario">Desde Movimiento Bancario</TabsTrigger>
                </TabsList>

                <TabsContent value="bancario" className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <Label htmlFor="movimiento_bancario">Seleccionar Movimiento Bancario</Label>
                      {loadingMovimientos ? (
                        <div className="p-4 text-center">Cargando movimientos...</div>
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  {/* Datos del pago manual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha del Pago first */}
                    <div>
                      <Label htmlFor="fecha_pago">Fecha del Pago *</Label>
                      <Input
                        id="fecha_pago"
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        required
                      />
                    </div>
                    {/* Monto Recibido second */}
                    <div>
                      <Label htmlFor="monto_pagado">Monto Recibido *</Label>
                      <Input
                        id="monto_pagado"
                        type="number"
                        step="0.01"
                        value={montoPagado}
                        onChange={(e) => setMontoPagado(e.target.value)}
                        required
                        className="text-lg font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Botones de sugerencia rápida now span 2 columns */}
                    <div className="md:col-span-2">
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {desglose?.saldoPendiente > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sugerirMonto(desglose.saldoPendiente)}
                            className="text-xs"
                          >
                            Solo saldo: ₡{desglose.saldoPendiente.toLocaleString()}
                          </Button>
                        )}
                        {/* Show total button if it's different from saldo or if only penalties are pending */}
                        {((desglose?.totalPendiente !== desglose?.saldoPendiente) || (desglose?.saldoPendiente === 0 && desglose?.totalPendiente > 0)) && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sugerirMonto(desglose?.totalPendiente)}
                            className="text-xs"
                          >
                            Total a hoy: ₡{desglose?.totalPendiente.toLocaleString()}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Methodo de pago and referencia now span 1 column each */}
                    <div>
                      <Label htmlFor="metodo_pago">Método de Pago *</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="deposito">Depósito</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="referencia">Referencia</Label>
                      <Input
                        id="referencia"
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                        placeholder="# transacción"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Simulación de aplicación - Solo mostrar si hay datos válidos */}
              {aplicacion && montoPagado && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-blue-900">Aplicación del Pago</h3>
                  
                  {/* NUEVO: Mostrar la multa calculada */}
                  {multaCalculada > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Multas calculadas a la fecha de pago:</span>
                      <span className="font-bold text-blue-900">
                        ₡{multaCalculada.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <hr className="border-blue-200" />
                  
                  {aplicacion.aplicarASaldo > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Se aplicará al saldo original:</span>
                      <span className="font-bold text-blue-900">
                        ₡{aplicacion.aplicarASaldo.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {aplicacion.aplicarAMultas > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-800">Se aplicará a multas:</span>
                      <span className="font-bold text-blue-900">
                        ₡{aplicacion.aplicarAMultas.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {aplicacion.sobrante > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-800">Sobrante (se devolverá):</span>
                      <span className="font-bold text-amber-900">
                        ₡{aplicacion.sobrante.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <hr className="border-blue-200" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-800">Nuevo saldo pendiente:</span>
                      <span className="font-bold text-blue-900 ml-2">
                        ₡{aplicacion.nuevoSaldoPendiente.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-800">Nuevas multas pendientes:</span>
                      <span className="font-bold text-blue-900 ml-2">
                        ₡{aplicacion.nuevasMultasPendientes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {aplicacion.nuevoSaldoPendiente === 0 && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 mt-2">
                      ✅ El saldo original quedará completamente pagado
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isProcessing || !montoPagado || (modoRegistro === 'bancario' && !selectedMovimiento) || !desglose}
                >
                  {isProcessing ? 'Procesando...' : 'Registrar Pago'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
