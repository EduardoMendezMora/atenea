
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MovimientoBancario } from "@/api/entities";
import { Banco } from "@/api/entities";
import { Factura } from "@/api/entities";
import { Cliente } from "@/api/entities";
import { Pago } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Search, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  FileSpreadsheet,
  Link as LinkIcon,
  X,
  Plus,
  CreditCard
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { format } from "date-fns";
import { processExcelBank } from "@/api/functions"; // New import

export default function Bancos() {
  const [movimientos, setMovimientos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("movimientos");

  // States for dialogs
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [movimientosData, bancosData, facturasData] = await Promise.all([
        MovimientoBancario.list('-fecha_movimiento'),
        Banco.list(),
        Factura.filter({ estatus: 'pendiente' })
      ]);

      setMovimientos(movimientosData);
      setBancos(bancosData);
      setFacturasPendientes(facturasData);
    } catch (error) {
      console.error("Error loading bank data:", error);
    }
    setIsLoading(false);
  };

  const stats = {
    totalMovimientos: movimientos.length,
    pendientes: movimientos.filter(m => m.estatus_conciliacion === 'pendiente').length,
    emparejados: movimientos.filter(m => m.estatus_conciliacion === 'emparejado').length,
    aplicados: movimientos.filter(m => m.estatus_conciliacion === 'aplicado').length,
    montoIngresos: movimientos.filter(m => m.tipo_movimiento === 'ingreso' && m.estatus_conciliacion !== 'ignorado').reduce((sum, m) => sum + (m.monto || 0), 0)
  };

  const filteredMovimientos = movimientos.filter(mov =>
    mov.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Conciliación Bancaria
            </h1>
            <p className="text-slate-600 font-medium">
              Gestión automática de movimientos bancarios y aplicación de pagos
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowBankForm(true)}
              variant="outline"
              className="shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Banco
            </Button>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar Excel
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Movimientos</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalMovimientos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pendientes</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Emparejados</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.emparejados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Aplicados</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.aplicados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Ingresos</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ₡{stats.montoIngresos.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white shadow-sm mb-6">
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="bancos">Bancos</TabsTrigger>
            <TabsTrigger value="conciliacion">Conciliación</TabsTrigger>
          </TabsList>

          <TabsContent value="movimientos">
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar movimientos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white shadow-sm border-slate-200"
                />
              </div>
            </div>

            <MovimientosList 
              movimientos={filteredMovimientos}
              onMatch={(movimiento) => {
                setSelectedMovimiento(movimiento);
                setShowMatchDialog(true);
              }}
            />
          </TabsContent>

          <TabsContent value="bancos">
            <BancosList bancos={bancos} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="conciliacion">
            <ConciliacionView movimientos={movimientos} facturas={facturasPendientes} />
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <UploadExcelDialog
          isOpen={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          bancos={bancos}
          onSuccess={loadData}
        />

        {/* Bank Form */}
        <BankFormDialog
          isOpen={showBankForm}
          onClose={() => setShowBankForm(false)}
          onSuccess={loadData}
        />

        {/* Match Dialog */}
        {selectedMovimiento && (
          <MatchMovimientoDialog
            isOpen={showMatchDialog}
            onClose={() => {
              setShowMatchDialog(false);
              setSelectedMovimiento(null);
            }}
            movimiento={selectedMovimiento}
            facturas={facturasPendientes}
            onSuccess={loadData}
          />
        )}
      </div>
    </div>
  );
}

// Componente para lista de movimientos
const MovimientosList = ({ movimientos, onMatch }) => {
  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      emparejado: 'bg-blue-100 text-blue-800 border-blue-200',
      aplicado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      ignorado: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: Clock,
      emparejado: LinkIcon,
      aplicado: CheckCircle,
      ignorado: X
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="p-4 font-semibold">Fecha</th>
              <th className="p-4 font-semibold">Descripción</th>
              <th className="p-4 font-semibold">Referencia</th>
              <th className="p-4 font-semibold">Monto</th>
              <th className="p-4 font-semibold">Cliente</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map(movimiento => (
              <tr key={movimiento.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-slate-600">
                  {format(new Date(movimiento.fecha_movimiento), 'dd/MM/yyyy')}
                </td>
                <td className="p-4 text-slate-900 max-w-xs truncate" title={movimiento.descripcion}>
                  {movimiento.descripcion}
                </td>
                <td className="p-4 text-slate-600 font-mono">
                  {movimiento.referencia}
                </td>
                <td className="p-4">
                  <span className={`font-bold ${movimiento.monto > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₡{movimiento.monto?.toLocaleString()}
                  </span>
                </td>
                <td className="p-4 text-slate-600">
                  {movimiento.cliente_nombre || '-'}
                </td>
                <td className="p-4">
                  <Badge variant="outline" className={getStatusColor(movimiento.estatus_conciliacion)}>
                    {getStatusIcon(movimiento.estatus_conciliacion)}
                    <span className="ml-1 capitalize">{movimiento.estatus_conciliacion}</span>
                  </Badge>
                </td>
                <td className="p-4">
                  {movimiento.estatus_conciliacion === 'pendiente' && movimiento.monto > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMatch(movimiento)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      Emparejar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para lista de bancos  
const BancosList = ({ bancos, onRefresh }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {bancos.map(banco => (
      <Card key={banco.id} className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{banco.nombre}</CardTitle>
              <p className="text-sm text-slate-600">{banco.numero_cuenta}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Tipo:</span>
              <span className="font-medium capitalize">{banco.tipo_cuenta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Saldo:</span>
              <span className="font-bold text-emerald-600">
                ₡{banco.saldo_actual?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Estado:</span>
              <Badge className={banco.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}>
                {banco.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Componente para vista de conciliación
const ConciliacionView = ({ movimientos, facturas }) => {
  const movimientosPendientes = movimientos.filter(m => 
    m.estatus_conciliacion === 'pendiente' && m.tipo_movimiento === 'ingreso'
  );
  
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Emparejamiento Automático Sugerido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            El sistema analiza automáticamente los movimientos para encontrar coincidencias con facturas pendientes.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <LinkIcon className="w-4 h-4 mr-2" />
            Ejecutar Emparejamiento Automático
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Dialog para cargar Excel - VERSION SIMPLIFICADA
const UploadExcelDialog = ({ isOpen, onClose, bancos, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBanco, setSelectedBanco] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBanco) {
      alert('Por favor, seleccione un archivo y un banco.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Upload file
      const uploadResponse = await UploadFile({ file: selectedFile });
      
      if (!uploadResponse?.file_url) {
        throw new Error('Error subiendo el archivo');
      }

      const banco = bancos.find(b => b.id === selectedBanco);

      // 2. Usar nuestra función personalizada para procesar el Excel
      const processResponse = await processExcelBank({
        file_url: uploadResponse.file_url,
        banco_id: selectedBanco,
        banco_nombre: banco.nombre
      });

      if (!processResponse.data?.success) {
        throw new Error(processResponse.data?.error || 'Error procesando el archivo');
      }

      alert(`✅ ${processResponse.data.message}`);
      onSuccess();
      onClose();
      setSelectedFile(null);
      setSelectedBanco('');
      
    } catch (error) {
      console.error('Error completo procesando Excel:', error);
      alert(`Error procesando el archivo: ${error.message}\n\nPor favor verifique:\n- Que el archivo sea un Excel válido\n- Que contenga las columnas: Fecha, Descripción, Monto (o Débito/Crédito)\n- Que tenga al menos una fila de datos`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar Movimientos Bancarios</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="banco">Banco *</Label>
            <Select value={selectedBanco} onValueChange={setSelectedBanco}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar banco..." />
              </SelectTrigger>
              <SelectContent>
                {bancos.map(banco => (
                  <SelectItem key={banco.id} value={banco.id}>
                    {banco.nombre} - {banco.numero_cuenta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="file">Archivo Excel *</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-xs text-slate-600 mt-1">
              Archivos Excel (.xlsx, .xls)
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">📋 Formato detectado del Excel:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Columna A:</strong> Fecha (dd/mm/yyyy)</li>
              <li>• <strong>Columna B:</strong> Referencia</li>
              <li>• <strong>Columna C:</strong> Descripción</li>
              <li>• <strong>Columna D:</strong> Créditos (21.000,00)</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-semibold text-amber-900 text-sm mb-2">⚡ Versión Actualizada</h4>
            <p className="text-xs text-amber-800">
              Ahora procesa el formato real de su Excel bancario. Los movimientos se crearán automáticamente en el sistema.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isProcessing || !selectedFile || !selectedBanco}
            >
              {isProcessing ? 'Procesando...' : 'Cargar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Dialog para crear banco
const BankFormDialog = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    numero_cuenta: '',
    tipo_cuenta: 'corriente',
    saldo_actual: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await Banco.create(formData);
      onSuccess();
      onClose();
      setFormData({ nombre: '', numero_cuenta: '', tipo_cuenta: 'corriente', saldo_actual: 0 });
    } catch (error) {
      console.error('Error creating bank:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Banco</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre del Banco *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="numero_cuenta">Número de Cuenta *</Label>
            <Input
              id="numero_cuenta"
              value={formData.numero_cuenta}
              onChange={(e) => setFormData({...formData, numero_cuenta: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="tipo_cuenta">Tipo de Cuenta</Label>
            <Select value={formData.tipo_cuenta} onValueChange={(value) => setFormData({...formData, tipo_cuenta: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corriente">Corriente</SelectItem>
                <SelectItem value="ahorros">Ahorros</SelectItem>
                <SelectItem value="empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Crear</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Dialog para emparejar movimiento con factura
const MatchMovimientoDialog = ({ isOpen, onClose, movimiento, facturas, onSuccess }) => {
  const [selectedFactura, setSelectedFactura] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMatch = async () => {
    if (!selectedFactura) return;

    setIsProcessing(true);
    try {
      const factura = facturas.find(f => f.id === selectedFactura);
      
      // Update movimiento with match
      await MovimientoBancario.update(movimiento.id, {
        factura_id: selectedFactura,
        cliente_id: factura.cliente_id,
        cliente_nombre: factura.cliente_nombre,
        numero_factura: factura.numero_factura,
        estatus_conciliacion: 'emparejado',
        confianza_emparejado: 100
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error matching movement:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emparejar Movimiento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">Movimiento Bancario</h4>
            <p><strong>Monto:</strong> ₡{movimiento.monto?.toLocaleString()}</p>
            <p><strong>Descripción:</strong> {movimiento.descripcion}</p>
            <p><strong>Referencia:</strong> {movimiento.referencia}</p>
          </div>

          <div>
            <Label>Seleccionar Factura</Label>
            <Select value={selectedFactura} onValueChange={setSelectedFactura}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar factura..." />
              </SelectTrigger>
              <SelectContent>
                {/* CORRECCIÓN: Mostrar todas las facturas pendientes, sin filtro agresivo */}
                {facturas.length > 0 ? (
                  facturas.map(factura => (
                    <SelectItem key={factura.id} value={factura.id}>
                      {factura.numero_factura} - {factura.cliente_nombre} - ₡{factura.monto?.toLocaleString()}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No se encontraron facturas pendientes.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
              onClick={handleMatch} 
              disabled={isProcessing || !selectedFactura}
            >
              {isProcessing ? 'Emparejando...' : 'Emparejar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
