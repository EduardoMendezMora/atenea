-- =====================================================
-- ATENEAPP - ROW LEVEL SECURITY (RLS) POLICIES
-- Políticas de seguridad a nivel de fila para Supabase
-- =====================================================

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE provincias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cantones ENABLE ROW LEVEL SECURITY;
ALTER TABLE distritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrocerias ENABLE ROW LEVEL SECURITY;
ALTER TABLE combustibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrendadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE estados_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE kilometraje_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tarea_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_dispositivo_gps ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_repuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_solicitud_repuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecciones_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tramites_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_tramite ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_requisito ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_bancarios ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIONES AUXILIARES PARA RLS
-- =====================================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT rol_sistema 
        FROM usuarios 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM usuarios 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es cliente
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT rol_sistema = 'Cliente' 
        FROM usuarios 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario tiene acceso a un módulo
CREATE OR REPLACE FUNCTION has_module_access(module_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT module_name = ANY(modulos_permitidos) OR role = 'admin'
        FROM usuarios 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario está asignado a un cliente
CREATE OR REPLACE FUNCTION is_assigned_to_client(client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT asignado_a_id = auth.uid() OR role = 'admin'
        FROM clientes 
        WHERE id = client_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario está asignado a un vehículo
CREATE OR REPLACE FUNCTION is_assigned_to_vehicle(vehicle_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT asignado_a_id = auth.uid() OR role = 'admin'
        FROM vehiculos 
        WHERE id = vehicle_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA TABLAS DE CATÁLOGO
-- =====================================================

-- Provincias - Lectura para todos los usuarios autenticados
CREATE POLICY "Provincias - Lectura para usuarios autenticados" ON provincias
    FOR SELECT USING (auth.role() = 'authenticated');

-- Cantones - Lectura para todos los usuarios autenticados
CREATE POLICY "Cantones - Lectura para usuarios autenticados" ON cantones
    FOR SELECT USING (auth.role() = 'authenticated');

-- Distritos - Lectura para todos los usuarios autenticados
CREATE POLICY "Distritos - Lectura para usuarios autenticados" ON distritos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Marcas - Lectura para todos, escritura solo para admins
CREATE POLICY "Marcas - Lectura para usuarios autenticados" ON marcas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Marcas - Escritura solo para admins" ON marcas
    FOR ALL USING (is_admin());

-- Modelos - Lectura para todos, escritura solo para admins
CREATE POLICY "Modelos - Lectura para usuarios autenticados" ON modelos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Modelos - Escritura solo para admins" ON modelos
    FOR ALL USING (is_admin());

-- Carrocerías - Lectura para todos, escritura solo para admins
CREATE POLICY "Carrocerias - Lectura para usuarios autenticados" ON carrocerias
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Carrocerias - Escritura solo para admins" ON carrocerias
    FOR ALL USING (is_admin());

-- Combustibles - Lectura para todos, escritura solo para admins
CREATE POLICY "Combustibles - Lectura para usuarios autenticados" ON combustibles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Combustibles - Escritura solo para admins" ON combustibles
    FOR ALL USING (is_admin());

-- Arrendadoras - Lectura para todos, escritura solo para admins
CREATE POLICY "Arrendadoras - Lectura para usuarios autenticados" ON arrendadoras
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Arrendadoras - Escritura solo para admins" ON arrendadoras
    FOR ALL USING (is_admin());

-- Transmisiones - Lectura para todos, escritura solo para admins
CREATE POLICY "Transmisiones - Lectura para usuarios autenticados" ON transmisiones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Transmisiones - Escritura solo para admins" ON transmisiones
    FOR ALL USING (is_admin());

-- Tracciones - Lectura para todos, escritura solo para admins
CREATE POLICY "Tracciones - Lectura para usuarios autenticados" ON tracciones
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tracciones - Escritura solo para admins" ON tracciones
    FOR ALL USING (is_admin());

-- Estados de vehículo - Lectura para todos, escritura solo para admins
CREATE POLICY "Estados vehiculo - Lectura para usuarios autenticados" ON estados_vehiculo
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estados vehiculo - Escritura solo para admins" ON estados_vehiculo
    FOR ALL USING (is_admin());

-- Estados de inventario - Lectura para todos, escritura solo para admins
CREATE POLICY "Estados inventario - Lectura para usuarios autenticados" ON estados_inventario
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Estados inventario - Escritura solo para admins" ON estados_inventario
    FOR ALL USING (is_admin());

-- Ubicaciones de vehículos - Lectura para todos, escritura solo para admins
CREATE POLICY "Ubicaciones vehiculo - Lectura para usuarios autenticados" ON ubicaciones_vehiculo
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Ubicaciones vehiculo - Escritura solo para admins" ON ubicaciones_vehiculo
    FOR ALL USING (is_admin());

-- Bancos - Lectura para todos, escritura solo para admins
CREATE POLICY "Bancos - Lectura para usuarios autenticados" ON bancos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Bancos - Escritura solo para admins" ON bancos
    FOR ALL USING (is_admin());

-- =====================================================
-- POLÍTICAS PARA USUARIOS
-- =====================================================

-- Usuarios - Los usuarios pueden ver su propia información y los admins pueden ver todo
CREATE POLICY "Usuarios - Ver propia información" ON usuarios
    FOR SELECT USING (id = auth.uid() OR is_admin());

-- Usuarios - Solo admins pueden modificar información de usuarios
CREATE POLICY "Usuarios - Modificar solo admins" ON usuarios
    FOR ALL USING (is_admin());

-- =====================================================
-- POLÍTICAS PARA CLIENTES
-- =====================================================

-- Clientes - Lectura basada en asignación y rol
CREATE POLICY "Clientes - Lectura basada en asignación" ON clientes
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Clientes') OR
        asignado_a_id = auth.uid()
    );

-- Clientes - Escritura basada en permisos
CREATE POLICY "Clientes - Escritura basada en permisos" ON clientes
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Clientes') OR
        asignado_a_id = auth.uid()
    );

-- =====================================================
-- POLÍTICAS PARA VEHÍCULOS
-- =====================================================

-- Vehículos - Lectura basada en asignación y rol
CREATE POLICY "Vehiculos - Lectura basada en asignación" ON vehiculos
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Vehiculos') OR
        asignado_a_id = auth.uid()
    );

-- Vehículos - Escritura basada en permisos
CREATE POLICY "Vehiculos - Escritura basada en permisos" ON vehiculos
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        asignado_a_id = auth.uid()
    );

-- =====================================================
-- POLÍTICAS PARA CONTRATOS
-- =====================================================

-- Contratos - Lectura basada en asignación y rol
CREATE POLICY "Contratos - Lectura basada en asignación" ON contratos
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Contratos') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = contratos.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Contratos - Escritura basada en permisos
CREATE POLICY "Contratos - Escritura basada en permisos" ON contratos
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Contratos')
    );

-- =====================================================
-- POLÍTICAS PARA FACTURAS
-- =====================================================

-- Facturas - Lectura basada en asignación y rol
CREATE POLICY "Facturas - Lectura basada en asignación" ON facturas
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Facturacion') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = facturas.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Facturas - Escritura basada en permisos
CREATE POLICY "Facturas - Escritura basada en permisos" ON facturas
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Facturacion')
    );

-- =====================================================
-- POLÍTICAS PARA PAGOS
-- =====================================================

-- Pagos - Lectura basada en asignación y rol
CREATE POLICY "Pagos - Lectura basada en asignación" ON pagos
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Pagos') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = pagos.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Pagos - Escritura basada en permisos
CREATE POLICY "Pagos - Escritura basada en permisos" ON pagos
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Pagos')
    );

-- =====================================================
-- POLÍTICAS PARA NOTAS DE CRÉDITO
-- =====================================================

-- Notas de crédito - Lectura basada en asignación y rol
CREATE POLICY "Notas credito - Lectura basada en asignación" ON notas_credito
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Facturacion') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = notas_credito.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Notas de crédito - Escritura basada en permisos
CREATE POLICY "Notas credito - Escritura basada en permisos" ON notas_credito
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Facturacion')
    );

-- =====================================================
-- POLÍTICAS PARA TAREAS
-- =====================================================

-- Tareas de clientes - Lectura basada en asignación
CREATE POLICY "Tareas cliente - Lectura basada en asignación" ON tareas_cliente
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        asignado_a_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = tareas_cliente.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Tareas de clientes - Escritura basada en permisos
CREATE POLICY "Tareas cliente - Escritura basada en permisos" ON tareas_cliente
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        asignado_a_id = auth.uid()
    );

-- Tareas de vehículos - Lectura basada en asignación
CREATE POLICY "Tareas vehiculo - Lectura basada en asignación" ON tareas_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        asignado_a_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = tareas_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Tareas de vehículos - Escritura basada en permisos
CREATE POLICY "Tareas vehiculo - Escritura basada en permisos" ON tareas_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        asignado_a_id = auth.uid()
    );

-- =====================================================
-- POLÍTICAS PARA NOTAS DE CLIENTES
-- =====================================================

-- Notas de clientes - Lectura basada en asignación
CREATE POLICY "Notas cliente - Lectura basada en asignación" ON notas_cliente
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Clientes') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = notas_cliente.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Notas de clientes - Escritura basada en permisos
CREATE POLICY "Notas cliente - Escritura basada en permisos" ON notas_cliente
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Clientes') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = notas_cliente.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA MENSAJES DE WHATSAPP
-- =====================================================

-- Mensajes de WhatsApp - Lectura basada en asignación
CREATE POLICY "Mensajes whatsapp - Lectura basada en asignación" ON mensajes_whatsapp
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Inbox') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = mensajes_whatsapp.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Mensajes de WhatsApp - Escritura basada en permisos
CREATE POLICY "Mensajes whatsapp - Escritura basada en permisos" ON mensajes_whatsapp
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Inbox')
    );

-- =====================================================
-- POLÍTICAS PARA KILOMETRAJE DE VEHÍCULOS
-- =====================================================

-- Kilometraje de vehículos - Lectura basada en asignación
CREATE POLICY "Kilometraje vehiculo - Lectura basada en asignación" ON kilometraje_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = kilometraje_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Kilometraje de vehículos - Escritura basada en permisos
CREATE POLICY "Kilometraje vehiculo - Escritura basada en permisos" ON kilometraje_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = kilometraje_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA COMENTARIOS
-- =====================================================

-- Comentarios de vehículos - Lectura basada en asignación
CREATE POLICY "Comentarios vehiculo - Lectura basada en asignación" ON comentarios_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = comentarios_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de vehículos - Escritura basada en permisos
CREATE POLICY "Comentarios vehiculo - Escritura basada en permisos" ON comentarios_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = comentarios_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de tareas de vehículos - Lectura basada en asignación
CREATE POLICY "Comentarios tarea vehiculo - Lectura basada en asignación" ON comentarios_tarea_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        EXISTS (
            SELECT 1 FROM tareas_vehiculo 
            WHERE tareas_vehiculo.id = comentarios_tarea_vehiculo.tarea_id 
            AND tareas_vehiculo.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de tareas de vehículos - Escritura basada en permisos
CREATE POLICY "Comentarios tarea vehiculo - Escritura basada en permisos" ON comentarios_tarea_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tareas') OR
        EXISTS (
            SELECT 1 FROM tareas_vehiculo 
            WHERE tareas_vehiculo.id = comentarios_tarea_vehiculo.tarea_id 
            AND tareas_vehiculo.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA DISPOSITIVOS GPS
-- =====================================================

-- Dispositivos GPS - Lectura basada en asignación
CREATE POLICY "Dispositivos gps - Lectura basada en asignación" ON dispositivos_gps
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = dispositivos_gps.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Dispositivos GPS - Escritura basada en permisos
CREATE POLICY "Dispositivos gps - Escritura basada en permisos" ON dispositivos_gps
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = dispositivos_gps.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de dispositivos GPS - Lectura basada en asignación
CREATE POLICY "Comentarios dispositivo gps - Lectura basada en asignación" ON comentarios_dispositivo_gps
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM dispositivos_gps 
            JOIN vehiculos ON vehiculos.id = dispositivos_gps.vehiculo_id
            WHERE dispositivos_gps.id = comentarios_dispositivo_gps.dispositivo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de dispositivos GPS - Escritura basada en permisos
CREATE POLICY "Comentarios dispositivo gps - Escritura basada en permisos" ON comentarios_dispositivo_gps
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM dispositivos_gps 
            JOIN vehiculos ON vehiculos.id = dispositivos_gps.vehiculo_id
            WHERE dispositivos_gps.id = comentarios_dispositivo_gps.dispositivo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA FOTOS DE VEHÍCULOS
-- =====================================================

-- Fotos de vehículos - Lectura basada en asignación
CREATE POLICY "Fotos vehiculo - Lectura basada en asignación" ON fotos_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = fotos_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Fotos de vehículos - Escritura basada en permisos
CREATE POLICY "Fotos vehiculo - Escritura basada en permisos" ON fotos_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Vehiculos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = fotos_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA SOLICITUDES DE REPUESTOS
-- =====================================================

-- Solicitudes de repuestos - Lectura basada en asignación
CREATE POLICY "Solicitudes repuesto - Lectura basada en asignación" ON solicitudes_repuesto
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Repuestos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = solicitudes_repuesto.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Solicitudes de repuestos - Escritura basada en permisos
CREATE POLICY "Solicitudes repuesto - Escritura basada en permisos" ON solicitudes_repuesto
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Repuestos') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = solicitudes_repuesto.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de solicitudes de repuestos - Lectura basada en asignación
CREATE POLICY "Comentarios solicitud repuesto - Lectura basada en asignación" ON comentarios_solicitud_repuesto
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Repuestos') OR
        EXISTS (
            SELECT 1 FROM solicitudes_repuesto 
            JOIN vehiculos ON vehiculos.id = solicitudes_repuesto.vehiculo_id
            WHERE solicitudes_repuesto.id = comentarios_solicitud_repuesto.solicitud_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de solicitudes de repuestos - Escritura basada en permisos
CREATE POLICY "Comentarios solicitud repuesto - Escritura basada en permisos" ON comentarios_solicitud_repuesto
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Repuestos') OR
        EXISTS (
            SELECT 1 FROM solicitudes_repuesto 
            JOIN vehiculos ON vehiculos.id = solicitudes_repuesto.vehiculo_id
            WHERE solicitudes_repuesto.id = comentarios_solicitud_repuesto.solicitud_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA INSPECCIONES
-- =====================================================

-- Templates de checklist - Lectura para todos, escritura solo para admins
CREATE POLICY "Checklist templates - Lectura para usuarios autenticados" ON checklist_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Checklist templates - Escritura solo para admins" ON checklist_templates
    FOR ALL USING (is_admin());

-- Inspecciones de vehículos - Lectura basada en asignación
CREATE POLICY "Inspecciones vehiculo - Lectura basada en asignación" ON inspecciones_vehiculo
    FOR SELECT USING (
        is_admin() OR 
        has_module_access('Inspecciones') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = inspecciones_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- Inspecciones de vehículos - Escritura basada en permisos
CREATE POLICY "Inspecciones vehiculo - Escritura basada en permisos" ON inspecciones_vehiculo
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Inspecciones') OR
        EXISTS (
            SELECT 1 FROM vehiculos 
            WHERE vehiculos.id = inspecciones_vehiculo.vehiculo_id 
            AND vehiculos.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA TRÁMITES
-- =====================================================

-- Trámites de clientes - Lectura basada en asignación
CREATE POLICY "Tramites cliente - Lectura basada en asignación" ON tramites_cliente
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = tramites_cliente.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Trámites de clientes - Escritura basada en permisos
CREATE POLICY "Tramites cliente - Escritura basada en permisos" ON tramites_cliente
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM clientes 
            WHERE clientes.id = tramites_cliente.cliente_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Requisitos maestros - Lectura para todos, escritura solo para admins
CREATE POLICY "Requisitos maestro - Lectura para usuarios autenticados" ON requisitos_maestro
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Requisitos maestro - Escritura solo para admins" ON requisitos_maestro
    FOR ALL USING (is_admin());

-- Requisitos de trámites - Lectura basada en asignación
CREATE POLICY "Requisitos tramite - Lectura basada en asignación" ON requisitos_tramite
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM tramites_cliente 
            JOIN clientes ON clientes.id = tramites_cliente.cliente_id
            WHERE tramites_cliente.id = requisitos_tramite.tramite_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Requisitos de trámites - Escritura basada en permisos
CREATE POLICY "Requisitos tramite - Escritura basada en permisos" ON requisitos_tramite
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM tramites_cliente 
            JOIN clientes ON clientes.id = tramites_cliente.cliente_id
            WHERE tramites_cliente.id = requisitos_tramite.tramite_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de requisitos - Lectura basada en asignación
CREATE POLICY "Comentarios requisito - Lectura basada en asignación" ON comentarios_requisito
    FOR SELECT USING (
        is_admin() OR 
        is_client() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM requisitos_tramite 
            JOIN tramites_cliente ON tramites_cliente.id = requisitos_tramite.tramite_id
            JOIN clientes ON clientes.id = tramites_cliente.cliente_id
            WHERE requisitos_tramite.id = comentarios_requisito.requisito_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- Comentarios de requisitos - Escritura basada en permisos
CREATE POLICY "Comentarios requisito - Escritura basada en permisos" ON comentarios_requisito
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Tramites') OR
        EXISTS (
            SELECT 1 FROM requisitos_tramite 
            JOIN tramites_cliente ON tramites_cliente.id = requisitos_tramite.tramite_id
            JOIN clientes ON clientes.id = tramites_cliente.cliente_id
            WHERE requisitos_tramite.id = comentarios_requisito.requisito_id 
            AND clientes.asignado_a_id = auth.uid()
        )
    );

-- =====================================================
-- POLÍTICAS PARA MOVIMIENTOS BANCARIOS
-- =====================================================

-- Movimientos bancarios - Solo admins y usuarios con acceso a bancos
CREATE POLICY "Movimientos bancarios - Solo admins y usuarios autorizados" ON movimientos_bancarios
    FOR ALL USING (
        is_admin() OR 
        has_module_access('Bancos')
    );

-- =====================================================
-- POLÍTICAS ESPECIALES PARA CLIENTES
-- =====================================================

-- Los clientes solo pueden ver sus propios datos
CREATE POLICY "Clientes - Solo sus propios datos" ON clientes
    FOR SELECT USING (
        is_client() AND email = (
            SELECT email FROM usuarios WHERE id = auth.uid()
        )
    );

-- Los clientes no pueden modificar sus datos directamente
CREATE POLICY "Clientes - No pueden modificar sus datos" ON clientes
    FOR UPDATE USING (FALSE);

CREATE POLICY "Clientes - No pueden insertar datos" ON clientes
    FOR INSERT WITH CHECK (FALSE);

CREATE POLICY "Clientes - No pueden eliminar datos" ON clientes
    FOR DELETE USING (FALSE);

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION get_user_role() IS 'Obtiene el rol del usuario actual';
COMMENT ON FUNCTION is_admin() IS 'Verifica si el usuario actual es administrador';
COMMENT ON FUNCTION is_client() IS 'Verifica si el usuario actual es cliente';
COMMENT ON FUNCTION has_module_access(TEXT) IS 'Verifica si el usuario tiene acceso a un módulo específico';
COMMENT ON FUNCTION is_assigned_to_client(UUID) IS 'Verifica si el usuario está asignado a un cliente';
COMMENT ON FUNCTION is_assigned_to_vehicle(UUID) IS 'Verifica si el usuario está asignado a un vehículo';

-- =====================================================
-- FIN DE LAS POLÍTICAS RLS
-- =====================================================
