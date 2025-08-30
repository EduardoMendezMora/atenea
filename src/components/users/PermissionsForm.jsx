
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define los permisos para cada rol - CORREGIDOS para coincidir con los pageNames
const PERMISOS_POR_ROL = {
  "Vendedor": ["Dashboard", "Inbox", "Clientes", "Contratos", "Tareas", "Tramites"],
  "Contador": ["Dashboard", "Facturacion", "Pagos", "NotasCredito", "Clientes", "Contratos", "Bancos"],
  "Operaciones": ["Dashboard", "Vehiculos", "Tareas", "Repuestos", "ConfiguracionVehiculos", "InspeccionesConfiguracion"],
  "Gerente": ["Dashboard", "Inbox", "Vehiculos", "Tareas", "Clientes", "Contratos", "Facturacion", "Pagos", "NotasCredito", "Usuarios", "Repuestos", "ConfiguracionVehiculos", "InspeccionesConfiguracion", "Bancos", "Tramites", "ConfiguracionTramites", "Automatizacion"],
  "Jefatura": ["Dashboard", "Inbox", "Vehiculos", "Tareas", "Clientes", "Contratos", "Facturacion", "Pagos", "NotasCredito", "Usuarios", "Repuestos", "ConfiguracionVehiculos", "InspeccionesConfiguracion", "Bancos", "Tramites", "ConfiguracionTramites", "Automatizacion"],
  "Cliente": ["PortalCliente", "MisContratos", "MisFacturas", "MisVehiculos", "MisTramites", "MiPerfil"],
  "Sin Asignar": ["Dashboard"]
};

export default function PermissionsForm({ isOpen, onClose, user, onSave }) {
  const [selectedRole, setSelectedRole] = useState("Sin Asignar");

  useEffect(() => {
    if (user && user.rol_sistema) {
      setSelectedRole(user.rol_sistema);
    } else {
      setSelectedRole("Sin Asignar");
    }
  }, [user]);

  const handleSave = () => {
    const modulos = PERMISOS_POR_ROL[selectedRole] || [];
    onSave(user.id, selectedRole, modulos);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Asignar Rol a {user.full_name}</DialogTitle>
          <DialogDescription>
            Selecciona el puesto de este empleado. El sistema le asignará los permisos automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <Label htmlFor="role-select" className="text-base font-medium text-slate-800 mb-2 block">
            Rol del Empleado
          </Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="role-select" className="w-full">
              <SelectValue placeholder="Seleccionar un rol..." />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PERMISOS_POR_ROL).map(rol => (
                <SelectItem key={rol} value={rol}>
                  {rol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Mostrar los módulos que tendrá acceso */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Módulos con acceso:</h4>
            <div className="flex flex-wrap gap-2">
              {PERMISOS_POR_ROL[selectedRole]?.map(modulo => (
                <span key={modulo} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {modulo}
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
