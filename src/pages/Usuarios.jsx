
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, UserCheck, KeyRound, Briefcase } from "lucide-react";
import PermissionsForm from "../components/users/PermissionsForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionsForm, setShowPermissionsForm] = useState(false);
  const [showInviteInstructions, setShowInviteInstructions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setIsLoading(false);
  };

  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    setShowPermissionsForm(true);
  };

  const handleSavePermissions = async (userId, rol, modulos) => {
    try {
      await User.update(userId, { 
        rol_sistema: rol,
        modulos_permitidos: modulos 
      });
      setShowPermissionsForm(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error saving permissions:", error);
    }
  };
  
  const getRoleBadgeColor = (role) => {
    const colors = {
        "Gerente": "bg-purple-100 text-purple-800",
        "Vendedor": "bg-blue-100 text-blue-800",
        "Contador": "bg-emerald-100 text-emerald-800",
        "Operaciones": "bg-orange-100 text-orange-800",
        "Sin Asignar": "bg-slate-200 text-slate-700"
    };
    return colors[role] || "bg-slate-200 text-slate-700";
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
              Gestión de Empleados
            </h1>
            <p className="text-slate-600 font-medium">
              Asigna roles a los usuarios de tu sistema.
            </p>
          </div>
          <Button
            onClick={() => setShowInviteInstructions(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Invitar Nuevo Empleado
          </Button>
        </motion.div>

        {isLoading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full flex flex-col">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-slate-200'}`}>
                        {user.role === 'admin'
                          ? <ShieldCheck className="w-6 h-6 text-white" />
                          : <Briefcase className="w-6 h-6 text-slate-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-slate-900 truncate">
                          {user.full_name || "Usuario sin nombre"}
                        </CardTitle>
                        <p className="text-sm text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-800 mb-2">Rol en el Sistema:</p>
                      <div className="flex flex-wrap gap-2">
                        {user.role === 'admin' ? (
                          <Badge className="bg-blue-100 text-blue-800 text-base py-1 px-3">Administrador del Sistema</Badge>
                        ) : (
                          <Badge className={`${getRoleBadgeColor(user.rol_sistema)} text-base py-1 px-3`}>
                            {user.rol_sistema || 'Sin Asignar'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-6">
                      {user.role !== 'admin' ? (
                        <Button
                          className="w-full"
                          onClick={() => handleManagePermissions(user)}
                        >
                          <KeyRound className="w-4 h-4 mr-2" />
                          Asignar Rol
                        </Button>
                      ) : (
                         <div className="text-center p-2 rounded-lg bg-slate-50">
                            <p className="text-xs text-slate-500 font-medium">Los administradores tienen acceso a todo.</p>
                         </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <PermissionsForm
          isOpen={showPermissionsForm}
          onClose={() => setShowPermissionsForm(false)}
          user={selectedUser}
          onSave={handleSavePermissions}
        />
      )}

      {/* Modal de instrucciones para invitar */}
      <Dialog open={showInviteInstructions} onOpenChange={setShowInviteInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              ¿Cómo Invitar un Empleado?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 mb-4 font-medium">
                La invitación se hace desde el panel de administración de Base44:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-sm text-blue-700">Haz clic en <strong>"Ir al Dashboard de Usuarios"</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-sm text-blue-700">Haz clic en el botón <strong>"+ Invite User"</strong></p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p className="text-sm text-blue-700">Ingresa el email y envía la invitación</p>
                </div>
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <p className="text-xs text-emerald-700">
                <strong>💡 Una vez que se registre</strong>, el nuevo empleado aparecerá en esta página y podrás asignarle su rol.
              </p>
            </div>
          </div>
          <div className="flex justify-between gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowInviteInstructions(false)}>
              Cerrar
            </Button>
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowInviteInstructions(false)}
            >
              <a href="https://base44.app/dashboard/users" target="_blank" rel="noopener noreferrer">
                Ir al Dashboard de Usuarios
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
