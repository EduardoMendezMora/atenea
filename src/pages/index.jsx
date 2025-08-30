import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Clientes from "./Clientes";

import Contratos from "./Contratos";

import Facturacion from "./Facturacion";

import Pagos from "./Pagos";

import NotasCredito from "./NotasCredito";

import Vehiculos from "./Vehiculos";

import Tareas from "./Tareas";

import ClienteDetalle from "./ClienteDetalle";

import Inbox from "./Inbox";

import Chat from "./Chat";

import Usuarios from "./Usuarios";

import ConfiguracionVehiculos from "./ConfiguracionVehiculos";

import Repuestos from "./Repuestos";

import VehiculoDetalle from "./VehiculoDetalle";

import Automatizacion from "./Automatizacion";

import Bancos from "./Bancos";

import RepuestosArchivados from "./RepuestosArchivados";

import SolicitudRepuestoDetalle from "./SolicitudRepuestoDetalle";

import CatalogoPublico from "./CatalogoPublico";

import InspeccionesConfiguracion from "./InspeccionesConfiguracion";

import RegistroPublico from "./RegistroPublico";

import SeguimientoTramite from "./SeguimientoTramite";

import Tramites from "./Tramites";

import seguimiento-tramite from "./seguimiento-tramite";

import ConfiguracionTramites from "./ConfiguracionTramites";

import PortalCliente from "./PortalCliente";

import MisContratos from "./MisContratos";

import MisFacturas from "./MisFacturas";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Clientes: Clientes,
    
    Contratos: Contratos,
    
    Facturacion: Facturacion,
    
    Pagos: Pagos,
    
    NotasCredito: NotasCredito,
    
    Vehiculos: Vehiculos,
    
    Tareas: Tareas,
    
    ClienteDetalle: ClienteDetalle,
    
    Inbox: Inbox,
    
    Chat: Chat,
    
    Usuarios: Usuarios,
    
    ConfiguracionVehiculos: ConfiguracionVehiculos,
    
    Repuestos: Repuestos,
    
    VehiculoDetalle: VehiculoDetalle,
    
    Automatizacion: Automatizacion,
    
    Bancos: Bancos,
    
    RepuestosArchivados: RepuestosArchivados,
    
    SolicitudRepuestoDetalle: SolicitudRepuestoDetalle,
    
    CatalogoPublico: CatalogoPublico,
    
    InspeccionesConfiguracion: InspeccionesConfiguracion,
    
    RegistroPublico: RegistroPublico,
    
    SeguimientoTramite: SeguimientoTramite,
    
    Tramites: Tramites,
    
    seguimiento-tramite: seguimiento-tramite,
    
    ConfiguracionTramites: ConfiguracionTramites,
    
    PortalCliente: PortalCliente,
    
    MisContratos: MisContratos,
    
    MisFacturas: MisFacturas,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Clientes" element={<Clientes />} />
                
                <Route path="/Contratos" element={<Contratos />} />
                
                <Route path="/Facturacion" element={<Facturacion />} />
                
                <Route path="/Pagos" element={<Pagos />} />
                
                <Route path="/NotasCredito" element={<NotasCredito />} />
                
                <Route path="/Vehiculos" element={<Vehiculos />} />
                
                <Route path="/Tareas" element={<Tareas />} />
                
                <Route path="/ClienteDetalle" element={<ClienteDetalle />} />
                
                <Route path="/Inbox" element={<Inbox />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Usuarios" element={<Usuarios />} />
                
                <Route path="/ConfiguracionVehiculos" element={<ConfiguracionVehiculos />} />
                
                <Route path="/Repuestos" element={<Repuestos />} />
                
                <Route path="/VehiculoDetalle" element={<VehiculoDetalle />} />
                
                <Route path="/Automatizacion" element={<Automatizacion />} />
                
                <Route path="/Bancos" element={<Bancos />} />
                
                <Route path="/RepuestosArchivados" element={<RepuestosArchivados />} />
                
                <Route path="/SolicitudRepuestoDetalle" element={<SolicitudRepuestoDetalle />} />
                
                <Route path="/CatalogoPublico" element={<CatalogoPublico />} />
                
                <Route path="/InspeccionesConfiguracion" element={<InspeccionesConfiguracion />} />
                
                <Route path="/RegistroPublico" element={<RegistroPublico />} />
                
                <Route path="/SeguimientoTramite" element={<SeguimientoTramite />} />
                
                <Route path="/Tramites" element={<Tramites />} />
                
                <Route path="/seguimiento-tramite" element={<seguimiento-tramite />} />
                
                <Route path="/ConfiguracionTramites" element={<ConfiguracionTramites />} />
                
                <Route path="/PortalCliente" element={<PortalCliente />} />
                
                <Route path="/MisContratos" element={<MisContratos />} />
                
                <Route path="/MisFacturas" element={<MisFacturas />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}