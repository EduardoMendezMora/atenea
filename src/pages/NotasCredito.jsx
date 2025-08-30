
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NotaCredito } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Contrato } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Search, FileMinus, Building2, Calendar, DollarSign, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const CreateCreditNoteDialog = ({ isOpen, onClose, facturas, onCreationSuccess }) => {
  const [selectedFacturaId, setSelectedFacturaId] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaEmision, setFechaEmision] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [motivo, setMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (selectedFacturaId) {
      const factura = facturas.find(f => f.id === selectedFacturaId);
      if (factura) {
        setMonto(factura.monto?.toString() || "");
      }
    } else {
      setMonto("");
    }
  }, [selectedFacturaId, facturas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const factura = facturas.find(f => f.id === selectedFacturaId);
    if (!factura) {
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create credit note
      await NotaCredito.create({
        numero_nota: `NC-${Date.now()}`,
        factura_id: factura.id,
        numero_factura: factura.numero_factura,
        contrato_id: factura.contrato_id,
        cliente_nombre: factura.cliente_nombre,
        monto: parseFloat(monto),
        fecha_emision: fechaEmision,
        motivo: motivo,
        estatus: 'aplicada'
      });

      // 2. Update invoice status
      await Factura.update(factura.id, { estatus: 'cancelada' });

      // 3. If invoice was paid, reverse the contract progress
      if (factura.estatus === 'pagada') {
        const contrato = await Contrato.get(factura.contrato_id);
        if (contrato) {
          await Contrato.update(contrato.id, {
            semanas_pagadas: Math.max(0, (contrato.semanas_pagadas || 0) - 1)
          });
        }
      }
      
      onCreationSuccess();
      handleClose();

    } catch (error) {
      console.error("Error al crear la nota de crédito:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClose = () => {
    setSelectedFacturaId("");
    setMonto("");
    setFechaEmision(format(new Date(), 'yyyy-MM-dd'));
    setMotivo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Crear Nota de Crédito</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="factura_id">Factura a Acreditar *</Label>
            <Select value={selectedFacturaId} onValueChange={setSelectedFacturaId} required>
              <SelectTrigger><SelectValue placeholder="Seleccione una factura..." /></SelectTrigger>
              <SelectContent>
                {facturas.filter(f => f.estatus !== 'cancelada').map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.numero_factura} - {f.cliente_nombre} (₡{f.monto.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Textarea id="motivo" value={motivo} onChange={e => setMotivo(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isProcessing}>
              {isProcessing ? "Procesando..." : "Crear Nota"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function NotasCredito() {
  const [notas, setNotas] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [notasData, facturasData] = await Promise.all([
      NotaCredito.list('-fecha_emision'),
      Factura.list()
    ]);
    setNotas(notasData);
    setFacturas(facturasData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);
  
  const filteredNotas = notas.filter(nota =>
    nota.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nota.numero_nota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nota.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Notas de Crédito
            </h1>
            <p className="text-slate-600 font-medium">
              Gestión de créditos y ajustes a facturas • {notas.length} emitidas
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Nota de Crédito
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
              placeholder="Buscar por cliente, nota o factura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white shadow-sm border-slate-200"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredNotas.map(nota => (
              <motion.div
                key={nota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                          <FileMinus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-900">{nota.numero_nota}</CardTitle>
                          <p className="text-sm text-slate-600">{nota.cliente_nombre}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-orange-600">₡{nota.monto?.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{format(new Date(nota.fecha_emision), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                       <p className="text-sm font-semibold text-slate-800">Acredita Factura: <span className="font-normal text-blue-600">{nota.numero_factura}</span></p>
                       <p className="text-sm font-semibold text-slate-800">Motivo:</p>
                       <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">{nota.motivo}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <CreateCreditNoteDialog 
          isOpen={showDialog} 
          onClose={() => setShowDialog(false)}
          facturas={facturas}
          onCreationSuccess={loadData}
        />
      </div>
    </div>
  );
}
