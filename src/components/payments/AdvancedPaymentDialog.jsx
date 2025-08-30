import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Pago } from '@/api/entities';
import { Factura } from '@/api/entities';
import { Contrato } from '@/api/entities';

export default function AdvancedPaymentDialog({ isOpen, onClose, facturasPendientes, onPaymentSuccess }) {
  const [montoPagado, setMontoPagado] = useState('');
  const [fechaPago, setFechaPago] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [referencia, setReferencia] = useState('');
  const [aplicaciones, setAplicaciones] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Agregar una nueva línea de aplicación
  const agregarAplicacion = () => {
    setAplicaciones(prev => [...prev, {
      factura_id: '',
      monto_aplicado: ''
    }]);
  };

  // Eliminar línea de aplicación
  const eliminarAplicacion = (index) => {
    setAplicaciones(prev => prev.filter((_, i) => i !== index));
  };

  // Actualizar aplicación específica
  const actualizarAplicacion = (index, field, value) => {
    setAplicaciones(prev => prev.map((app, i) => 
      i === index ? { ...app, [field]: value } : app
    ));
  };

  // Calcular totales
  const totalAplicado = aplicaciones.reduce((sum, app) => sum + (parseFloat(app.monto_aplicado) || 0), 0);
  const diferencia = parseFloat(montoPagado || 0) - totalAplicado;

  // Auto-distribuir el pago entre las facturas seleccionadas
  const autoDistribuir = () => {
    const montoDisponible = parseFloat(montoPagado || 0);
    let montoRestante = montoDisponible;
    const nuevasAplicaciones = [];

    // Ordenar facturas por fecha de vencimiento (más antiguas primero)
    const facturasOrdenadas = facturasPendientes.sort((a, b) => 
      new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento)
    );

    for (const factura of facturasOrdenadas) {
      if (montoRestante <= 0) break;

      const montoFactura = factura.monto || 0;
      const montoAplicar = Math.min(montoRestante, montoFactura);

      nuevasAplicaciones.push({
        factura_id: factura.id,
        monto_aplicado: montoAplicar.toString()
      });

      montoRestante -= montoAplicar;
    }

    setAplicaciones(nuevasAplicaciones);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (diferencia !== 0) {
      alert('El total aplicado debe ser igual al monto pagado');
      return;
    }

    setIsProcessing(true);

    try {
      // Crear registro de pago principal
      const pagoCreado = await Pago.create({
        monto_pagado: parseFloat(montoPagado),
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        referencia_pago: referencia,
        estatus: 'aplicado',
        tipo_pago: 'multiple' // Para distinguir de pagos simples
      });

      // Aplicar a cada factura
      for (const aplicacion of aplicaciones) {
        const factura = facturasPendientes.find(f => f.id === aplicacion.factura_id);
        if (!factura) continue;

        // Crear registro de aplicación específico
        await Pago.create({
          factura_id: factura.id,
          numero_factura: factura.numero_factura,
          contrato_id: factura.contrato_id,
          cliente_nombre: factura.cliente_nombre,
          monto_pagado: parseFloat(aplicacion.monto_aplicado),
          fecha_pago: fechaPago,
          metodo_pago: metodoPago,
          referencia_pago: referencia,
          estatus: 'aplicado',
          pago_principal_id: pagoCreado.id
        });

        // Verificar si la factura está completamente pagada
        const todosPagosFactura = await Pago.filter({ factura_id: factura.id });
        const totalPagado = todosPagosFactura.reduce((sum, p) => sum + (p.monto_pagado || 0), 0);

        if (totalPagado >= factura.monto) {
          // Marcar factura como pagada
          await Factura.update(factura.id, {
            estatus: 'pagada',
            fecha_pago: fechaPago,
            metodo_pago: metodoPago
          });

          // Actualizar progreso del contrato
          const contrato = await Contrato.get(factura.contrato_id);
          if (contrato) {
            await Contrato.update(contrato.id, {
              semanas_pagadas: (contrato.semanas_pagadas || 0) + 1
            });
          }
        }
      }

      onPaymentSuccess();
      handleClose();

    } catch (error) {
      console.error('Error procesando pago:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setMontoPagado('');
    setFechaPago(format(new Date(), 'yyyy-MM-dd'));
    setMetodoPago('transferencia');
    setReferencia('');
    setAplicaciones([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Registrar Pago Avanzado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del pago */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              />
            </div>
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

          {/* Aplicación del pago */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Aplicar Pago a Facturas</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={autoDistribuir}
                  disabled={!montoPagado}
                >
                  Auto-Distribuir
                </Button>
                <Button type="button" variant="outline" onClick={agregarAplicacion}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Factura
                </Button>
              </div>
            </div>

            {aplicaciones.map((aplicacion, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <Label>Factura</Label>
                    <Select
                      value={aplicacion.factura_id}
                      onValueChange={(value) => actualizarAplicacion(index, 'factura_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar factura" />
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
                  <div>
                    <Label>Monto a Aplicar</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={aplicacion.monto_aplicado}
                      onChange={(e) => actualizarAplicacion(index, 'monto_aplicado', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => eliminarAplicacion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumen */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Monto Recibido:</span>
              <span className="font-bold">₡{parseFloat(montoPagado || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Aplicado:</span>
              <span className="font-bold">₡{totalAplicado.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Diferencia:</span>
              <span className={`font-bold ${diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₡{diferencia.toLocaleString()}
              </span>
            </div>
            {diferencia !== 0 && (
              <Badge variant="destructive" className="mt-2">
                El total aplicado debe ser igual al monto recibido
              </Badge>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isProcessing || diferencia !== 0}
            >
              {isProcessing ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}