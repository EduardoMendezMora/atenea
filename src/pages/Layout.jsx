

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Settings,
  Building2,
  CreditCard,
  FileMinus,
  Truck,
  Wrench,
  MessageSquare,
  PackageSearch,
  ChevronDown,
  ChevronRight,
  Calendar,
  Zap,
  ListChecks, // Added ListChecks icon for inspections
  FileCheck2, // Adding icon for Trámites
  LogOut, // Added LogOut icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Added DropdownMenu components

const allNavigationItems = [
  // Items para empleados
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, group: "principal", pageName: "Dashboard" },
  { title: "Inbox", url: createPageUrl("Inbox"), icon: MessageSquare, group: "principal", pageName: "Inbox" },
  {
    title: "Vehículos",
    icon: Truck,
    group: "principal",
    isExpandable: true,
    subItems: [
      { title: "Gestión de Vehículos", url: createPageUrl("Vehiculos"), icon: Truck, pageName: "Vehiculos" },
      { title: "Solicitudes de Repuestos", url: createPageUrl("Repuestos"), icon: PackageSearch, pageName: "Repuestos" },
      { title: "Ajustes de Vehículos", url: createPageUrl("ConfiguracionVehiculos"), icon: Wrench, pageName: "ConfiguracionVehiculos" },
      { title: "Config. Inspecciones", url: createPageUrl("InspeccionesConfiguracion"), icon: ListChecks, pageName: "InspeccionesConfiguracion" }
    ]
  },
  { title: "Tareas", url: createPageUrl("Tareas"), icon: Calendar, group: "principal", pageName: "Tareas" },
  {
    title: "Clientes",
    icon: Users,
    group: "principal",
    isExpandable: true,
    subItems: [
      { title: "Gestión de Clientes", url: createPageUrl("Clientes"), icon: Users, pageName: "Clientes" },
      { title: "Trámites", url: createPageUrl("Tramites"), icon: FileCheck2, pageName: "Tramites" }
    ]
  },
  { title: "Contratos", url: createPageUrl("Contratos"), icon: FileText, group: "principal", pageName: "Contratos" },
  { title: "Facturación", url: createPageUrl("Facturacion"), icon: Receipt, group: "principal", pageName: "Facturacion" },
  { title: "Pagos", url: createPageUrl("Pagos"), icon: CreditCard, group: "principal", pageName: "Pagos" },
  { title: "Bancos", url: createPageUrl("Bancos"), icon: Building2, group: "principal", pageName: "Bancos" },
  { title: "Notas de Crédito", url: createPageUrl("NotasCredito"), icon: FileMinus, group: "principal", pageName: "NotasCredito" },
  { title: "Ajustes de Trámites", url: createPageUrl("ConfiguracionTramites"), icon: Settings, group: "configuracion", pageName: "ConfiguracionTramites" },
  { title: "Automatización", url: createPageUrl("Automatizacion"), icon: Zap, group: "configuracion", pageName: "Automatizacion" },
  { title: "Usuarios", url: createPageUrl("Usuarios"), icon: Settings, group: "configuracion", pageName: "Usuarios" }
];

// Items específicos para clientes
const clienteNavigationItems = [
  { title: "Mi Portal", url: createPageUrl("PortalCliente"), icon: LayoutDashboard, group: "principal", pageName: "PortalCliente" },
  { title: "Mis Contratos", url: createPageUrl("MisContratos"), icon: FileText, group: "principal", pageName: "MisContratos" },
  { title: "Mis Facturas", url: createPageUrl("MisFacturas"), icon: Receipt, group: "principal", pageName: "MisFacturas" },
  { title: "Mis Vehículos", url: createPageUrl("MisVehiculos"), icon: Truck, group: "principal", pageName: "MisVehiculos" },
  { title: "Mis Trámites", url: createPageUrl("MisTramites"), icon: FileCheck2, group: "principal", pageName: "MisTramites" },
  { title: "Mi Perfil", url: createPageUrl("MiPerfil"), icon: Users, group: "configuracion", pageName: "MiPerfil" }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleItems, setVisibleItems] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // New state for mobile menu

  useEffect(() => {
    document.title = "ATENEAPP"; // Set the document title here

    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("No user logged in", error);
        setCurrentUser(null); // Set currentUser to null on error
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        // Los admins ven todo (menú de empleados)
        setVisibleItems(allNavigationItems);
      } else if (currentUser.rol_sistema === 'Cliente') {
        // Los clientes ven solo su menú específico
        setVisibleItems(clienteNavigationItems);
      } else {
        // Empleados con permisos específicos
        const modulosPermitidos = currentUser.modulos_permitidos || [];

        const userVisibleItems = allNavigationItems.filter(item => {
          if (item.isExpandable) {
            const hasPermittedSubItem = item.subItems.some(subItem => {
              return modulosPermitidos.includes(subItem.pageName);
            });
            return hasPermittedSubItem;
          }
          return modulosPermitidos.includes(item.pageName);
        }).map(item => {
          if (item.isExpandable) {
            return {
              ...item,
              subItems: item.subItems.filter(subItem => {
                return modulosPermitidos.includes(subItem.pageName);
              })
            };
          }
          return item;
        });

        setVisibleItems(userVisibleItems);
      }
    } else {
      setVisibleItems([]);
    }
  }, [currentUser]);

  // Auto-expandir menús que contienen la página activa
  useEffect(() => {
    setExpandedMenus(prev => {
        const updated = { ...prev };
        visibleItems.forEach(item => {
            if (item.isExpandable) {
                const isActive = item.subItems?.some(subItem => location.pathname === subItem.url);
                if (isActive) {
                    updated[item.title] = true; // Ensure active parent is expanded
                }
            }
        });
        return updated;
    });
  }, [location.pathname, visibleItems]); // Dependencies include visibleItems because structure can change based on user

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const publicPages = ['CatalogoPublico', 'RegistroPublico', 'seguimiento-tramite'];
  if (publicPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  const toggleMenu = (menuTitle) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle]
    }));
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload(); // Recargar la página para ir al login
  };

  const getGroupName = (group) => {
    switch(group) {
      case 'principal': return 'Principal';
      case 'operaciones': return 'Operaciones';
      case 'configuracion': return 'Configuración'; // Added for completeness based on existing groups
      default: return '';
    }
  };

  const principalItems = visibleItems.filter(item => item.group === 'principal');
  const configuracionItems = visibleItems.filter(item => item.group === 'configuracion');

  if (!currentUser) {
    return <div className="w-screen h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  }

  // Helper function to render a menu item (regular or expandable)
  const renderMenuItem = (item) => {
    if (item.isExpandable) {
      const isExpanded = expandedMenus[item.title] || item.subItems?.some(subItem => location.pathname === subItem.url);
      const hasActiveSubItem = item.subItems?.some(subItem => location.pathname === subItem.url);

      return (
        <SidebarMenuItem key={item.title}>
          <Collapsible open={isExpanded} onOpenChange={() => toggleMenu(item.title)}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 font-medium ${
                  hasActiveSubItem ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 px-3 py-3 w-full">
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.title}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-6 mt-1 space-y-1">
                {item.subItems?.map(subItem => (
                  <SidebarMenuButton
                    key={subItem.title}
                    asChild
                    className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg font-medium text-sm ${
                      location.pathname === subItem.url ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <Link to={subItem.url} className="flex items-center gap-3 px-3 py-2">
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      );
    }

    // Render for regular (non-expandable) items
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 font-medium ${
            location.pathname === item.url ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 flex items-center justify-center">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/54a9b266c_LogotipoEasyCarsFondoBlancoconSlogan-Copy1.jpg" 
                  alt="Easy Cars Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  {currentUser?.rol_sistema === 'Cliente' ? 'Portal Cliente' : 'Atenea'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {currentUser?.rol_sistema === 'Cliente' 
                    ? 'Sistema de Consulta Easy Cars' 
                    : 'Sistema de Gestión Easy Cars'
                  }
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            {principalItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-3">
                  {currentUser?.rol_sistema === 'Cliente' ? 'Mi Información' : 'Gestión Principal'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {principalItems.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {configuracionItems.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-3">
                  {currentUser?.rol_sistema === 'Cliente' ? 'Mi Cuenta' : 'Configuración'}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {configuracionItems.map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                  <div className="w-9 h-9 bg-slate-300 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-slate-700 font-semibold text-sm">{currentUser.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{currentUser.full_name}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/54a9b266c_LogotipoEasyCarsFondoBlancoconSlogan-Copy1.jpg" 
                    alt="Easy Cars Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {currentUser?.rol_sistema === 'Cliente' ? 'Portal Cliente' : 'Atenea'}
                </h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

