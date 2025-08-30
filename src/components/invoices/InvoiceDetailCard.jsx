
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, XCircle, Edit, FileMinus, CreditCard } from "lucide-react";
import { formatYMDToDMY, formatPeriodo as formatPeriodoString, toSafeUTCDate } from "@/components/utils/fechas"; // Corrected import path
import { format } from "date-fns";

// Función auxiliar para calcular el desglose de una factura con manejo seguro de fechas
export const calcularDesgloseFactura = (factura) => {
  if (!factura) return null;

  const saldoOriginal = factura.monto || 0;
  const pagadoSaldo = factura.monto_pagado_saldo || 0;
  const pagadoMultas = factura.monto_pagado_multas || 0;
  const saldoPendiente = Math.max(0, saldoOriginal - pagadoSaldo);

  // Calcular multas usando fechas seguras
  let multasPendientes = 0;
  const esFacturaSemanal = factura.semana_facturada && factura.semana_facturada > 0;
  
  if (esFacturaSemanal && factura.fecha_vencimiento && factura.estatus === 'pendiente') {
    const hoyYMD = format(new Date(), 'yyyy-MM-dd');
    const hoy = toSafeUTCDate(hoyYMD);
    const vencimiento = toSafeUTCDate(factura.fecha_vencimiento);
    
    if (hoy > vencimiento) {
      const diffTime = hoy - vencimiento;
      const diasVencido = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const multaTotal = diasVencido * (factura.multa_diaria || 2000);
      multasPendientes = Math.max(0, multaTotal - pagadoMultas);
    }
  }

  const totalPendiente = saldoPendiente + multasPendientes;

  return {
    saldoOriginal,
    saldoPendiente,
    multasPendientes,
    totalPendiente,
    pagadoSaldo,
    pagadoMultas
  };
};

export default function InvoiceDetailCard({
  factura,
  onPayment,
  onEdit,
  onCreateCreditNote,
  compact = false,
  // Helpers opcionales que se pueden sobreescribir
  formatYMDToDMY: fmtDMY = formatYMDToDMY,
  formatPeriodo: fmtPeriodo = formatPeriodoString,
}) {
  if (!factura) return null;

  const {
    numero_factura,
    cliente_nombre,
    periodo_inicio,
    periodo_fin,
    monto,
    fecha_vencimiento,
    estatus,
    semana_facturada
  } = factura;

  const desglose = calcularDesgloseFactura(factura);

  // Determinar si está vencida (solo para facturas pendientes)
  const isVencida = () => {
    if (estatus !== 'pendiente') return false;
    const hoyYMD = format(new Date(), 'yyyy-MM-dd');
    const hoy = toSafeUTCDate(hoyYMD);
    const vence = toSafeUTCDate(fecha_vencimiento);
    return hoy > vence;
  };

  const estatusDisplay = isVencida() ? 'vencida' : estatus;

  // Colores y estilos por estatus
  const getStatusColor = (status) => {
    const colors = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pagada: "bg-emerald-100 text-emerald-800 border-emerald-200",
      vencida: "bg-red-100 text-red-800 border-red-200",
      cancelada: "bg-slate-200 text-slate-700 border-slate-300",
      futura: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return colors[status] || "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: AlertTriangle,
      pagada: CheckCircle,
      vencida: AlertTriangle,
      cancelada: XCircle,
      futura: Clock,
    };
    const Icon = icons[status] || AlertTriangle;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusText = (status) => {
    const texts = {
      pendiente: "Pendiente",
      pagada: "Pagada",
      vencida: "Vencida",
      cancelada: "Cancelada",
      futura: "Futura",
    };
    return texts[status] || status;
  };

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg font-bold text-slate-900">
                {numero_factura}
              </CardTitle>
              <Badge className={getStatusColor(estatusDisplay)}>
                {getStatusIcon(estatusDisplay)}
                <span className="ml-1">{getStatusText(estatusDisplay)}</span>
              </Badge>
            </div>
            <p className="text-sm text-slate-600 font-medium">{cliente_nombre}</p>
            {semana_facturada > 0 && (
              <p className="text-xs text-slate-500">Semana {semana_facturada}</p>
            )}
          </div>
          <div className="flex gap-1">
            {onCreateCreditNote && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onCreateCreditNote(factura)} 
                title="Crear nota de crédito"
                className="h-8 w-8 hover:bg-slate-100"
              >
                <FileMinus className="w-4 h-4 text-slate-500" />
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(factura)} 
                title="Editar factura"
                className="h-8 w-8 hover:bg-slate-100"
              >
                <Edit className="w-4 h-4 text-slate-500" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Período */}
        {periodo_inicio && periodo_fin && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Período: {fmtPeriodo(periodo_inicio, periodo_fin)}</span>
          </div>
        )}

        {/* Desglose financiero */}
        <div className="rounded-lg bg-slate-50 p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Saldo original:</span>
            <span className="font-semibold text-slate-900">₡{(desglose?.saldoOriginal || 0).toLocaleString()}</span>
          </div>
          
          {desglose?.pagadoSaldo > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Pagado del saldo:</span>
              <span className="font-semibold text-emerald-600">-₡{desglose.pagadoSaldo.toLocaleString()}</span>
            </div>
          )}

          {desglose?.multasPendientes > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Multas pendientes:</span>
              <span className="font-semibold text-orange-600">+₡{desglose.multasPendientes.toLocaleString()}</span>
            </div>
          )}

          {desglose?.pagadoMultas > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Pagado de multas:</span>
              <span className="font-semibold text-emerald-600">-₡{desglose.pagadoMultas.toLocaleString()}</span>
            </div>
          )}

          {desglose && desglose.totalPendiente !== desglose.saldoOriginal && (
            <div className="border-t pt-2 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-700">Total pendiente:</span>
              <span className="text-slate-900">₡{desglose.totalPendiente.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Fecha de vencimiento */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Vence:</span>
          <span className={`font-semibold ${isVencida() ? 'text-red-600' : 'text-slate-900'}`}>
            {fmtDMY(fecha_vencimiento)}
          </span>
        </div>

        {/* Botón de pago */}
        {onPayment && estatusDisplay === "pendiente" && (
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 w-full" 
            onClick={() => onPayment(factura)}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
        )}

        {onPayment && estatusDisplay === "vencida" && (
          <Button 
            className="bg-red-600 hover:bg-red-700 w-full" 
            onClick={() => onPayment(factura)}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pagar Factura Vencida
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
