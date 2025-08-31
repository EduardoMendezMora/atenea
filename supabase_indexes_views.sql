-- =====================================================
-- ATENEAPP - ÍNDICES ADICIONALES Y VISTAS
-- Optimizaciones de rendimiento y vistas útiles
-- =====================================================

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_clientes_estatus_asignado ON clientes(estatus, asignado_a_id);
CREATE INDEX idx_vehiculos_estatus_cliente ON vehiculos(estatus, cliente_actual);
CREATE INDEX idx_contratos_cliente_estatus ON contratos(cliente_id, estatus);
CREATE INDEX idx_facturas_cliente_estatus ON facturas(cliente_id, estatus);
CREATE INDEX idx_facturas_fecha_vencimiento_estatus ON facturas(fecha_vencimiento, estatus);
CREATE INDEX idx_tareas_cliente_estatus_fecha ON tareas_cliente(estatus, fecha_programada);
CREATE INDEX idx_tareas_vehiculo_estatus_fecha ON tareas_vehiculo(estatus, fecha_programada);
CREATE INDEX idx_tramites_cliente_estatus ON tramites_cliente(cliente_id, estatus);
CREATE INDEX idx_solicitudes_repuesto_estatus_fecha ON solicitudes_repuesto(estatus, fecha_solicitud);

-- Índices para búsquedas de texto
CREATE INDEX idx_clientes_nombre_empresa_gin ON clientes USING gin(to_tsvector('spanish', nombre_empresa));
CREATE INDEX idx_vehiculos_placas_gin ON vehiculos USING gin(to_tsvector('spanish', placas));
CREATE INDEX idx_vehiculos_numero_economico_gin ON vehiculos USING gin(to_tsvector('spanish', numero_economico));

-- Índices para fechas
CREATE INDEX idx_contratos_fecha_inicio_fin ON contratos(fecha_inicio, fecha_fin);
CREATE INDEX idx_facturas_fecha_emision ON facturas(fecha_emision);
CREATE INDEX idx_pagos_fecha_pago ON pagos(fecha_pago);
CREATE INDEX idx_tareas_cliente_fecha_programada ON tareas_cliente(fecha_programada);
CREATE INDEX idx_tareas_vehiculo_fecha_programada ON tareas_vehiculo(fecha_programada);
CREATE INDEX idx_inspecciones_vehiculo_fecha ON inspecciones_vehiculo(fecha_inspeccion);

-- Índices para relaciones territoriales
CREATE INDEX idx_clientes_provincia_canton ON clientes(provincia_id, canton_id);
CREATE INDEX idx_clientes_canton_distrito ON clientes(canton_id, distrito_id);

-- Índices para catálogos con relaciones
CREATE INDEX idx_modelos_marca_nombre ON modelos(marca_id, nombre);
CREATE INDEX idx_cantones_provincia_nombre ON cantones(provincia_id, nombre);
CREATE INDEX idx_distritos_canton_nombre ON distritos(canton_id, nombre);

-- =====================================================
-- VISTAS ÚTILES PARA REPORTES Y DASHBOARD
-- =====================================================

-- Vista de resumen de clientes
CREATE VIEW vista_resumen_clientes AS
SELECT 
    c.id,
    c.nombre_empresa,
    c.email,
    c.telefono,
    c.estatus,
    c.provincia_nombre,
    c.canton_nombre,
    c.asignado_a_nombre,
    COUNT(DISTINCT co.id) as total_contratos,
    COUNT(DISTINCT CASE WHEN co.estatus = 'activo' THEN co.id END) as contratos_activos,
    COUNT(DISTINCT f.id) as total_facturas,
    COUNT(DISTINCT CASE WHEN f.estatus = 'pendiente' THEN f.id END) as facturas_pendientes,
    COUNT(DISTINCT CASE WHEN f.estatus = 'pagada' THEN f.id END) as facturas_pagadas,
    COALESCE(SUM(CASE WHEN f.estatus = 'pagada' THEN f.monto ELSE 0 END), 0) as total_pagado,
    COALESCE(SUM(CASE WHEN f.estatus = 'pendiente' THEN f.monto ELSE 0 END), 0) as total_pendiente,
    c.created_at,
    c.updated_at
FROM clientes c
LEFT JOIN contratos co ON co.cliente_id = c.id
LEFT JOIN facturas f ON f.cliente_id = c.id
GROUP BY c.id, c.nombre_empresa, c.email, c.telefono, c.estatus, 
         c.provincia_nombre, c.canton_nombre, c.asignado_a_nombre, c.created_at, c.updated_at;

-- Vista de resumen de vehículos
CREATE VIEW vista_resumen_vehiculos AS
SELECT 
    v.id,
    v.numero_economico,
    v.placas,
    v.marca,
    v.modelo,
    v.año,
    v.estatus,
    v.estatus_inventario,
    v.cliente_actual,
    v.renta_semanal,
    v.gastos_administrativos,
    v.asignado_a_nombre,
    COUNT(DISTINCT co.id) as total_contratos,
    COUNT(DISTINCT CASE WHEN co.estatus = 'activo' THEN co.id END) as contratos_activos,
    COUNT(DISTINCT t.id) as total_tareas,
    COUNT(DISTINCT CASE WHEN t.estatus = 'pendiente' THEN t.id END) as tareas_pendientes,
    COUNT(DISTINCT sr.id) as total_solicitudes_repuestos,
    COUNT(DISTINCT CASE WHEN sr.estatus = 'solicitado' THEN sr.id END) as solicitudes_pendientes,
    v.created_at,
    v.updated_at
FROM vehiculos v
LEFT JOIN contratos co ON co.vehiculo_id = v.id
LEFT JOIN tareas_vehiculo t ON t.vehiculo_id = v.id
LEFT JOIN solicitudes_repuesto sr ON sr.vehiculo_id = v.id
GROUP BY v.id, v.numero_economico, v.placas, v.marca, v.modelo, v.año, 
         v.estatus, v.estatus_inventario, v.cliente_actual, v.renta_semanal, 
         v.gastos_administrativos, v.asignado_a_nombre, v.created_at, v.updated_at;

-- Vista de resumen de contratos
CREATE VIEW vista_resumen_contratos AS
SELECT 
    co.id,
    co.numero_contrato,
    co.cliente_nombre,
    co.vehiculo_numero_economico,
    co.fecha_inicio,
    co.fecha_fin,
    co.renta_semanal,
    co.gastos_administrativos,
    co.plazo_semanas,
    co.estatus,
    co.vendedor_nombre,
    COUNT(DISTINCT f.id) as total_facturas,
    COUNT(DISTINCT CASE WHEN f.estatus = 'pendiente' THEN f.id END) as facturas_pendientes,
    COUNT(DISTINCT CASE WHEN f.estatus = 'pagada' THEN f.id END) as facturas_pagadas,
    COALESCE(SUM(CASE WHEN f.estatus = 'pagada' THEN f.monto ELSE 0 END), 0) as total_cobrado,
    COALESCE(SUM(CASE WHEN f.estatus = 'pendiente' THEN f.monto ELSE 0 END), 0) as total_pendiente,
    co.created_at,
    co.updated_at
FROM contratos co
LEFT JOIN facturas f ON f.contrato_id = co.id
GROUP BY co.id, co.numero_contrato, co.cliente_nombre, co.vehiculo_numero_economico,
         co.fecha_inicio, co.fecha_fin, co.renta_semanal, co.gastos_administrativos,
         co.plazo_semanas, co.estatus, co.vendedor_nombre, co.created_at, co.updated_at;

-- Vista de facturas con información adicional
CREATE VIEW vista_facturas_detalladas AS
SELECT 
    f.id,
    f.numero_factura,
    f.cliente_nombre,
    f.vehiculo_numero_economico,
    f.concepto,
    f.monto,
    f.fecha_emision,
    f.fecha_vencimiento,
    f.fecha_pago,
    f.estatus,
    f.estatus_pago,
    f.metodo_pago,
    CASE 
        WHEN f.estatus = 'pendiente' AND f.fecha_vencimiento < CURRENT_DATE THEN 'vencida'
        WHEN f.estatus = 'pendiente' AND f.fecha_vencimiento > CURRENT_DATE THEN 'vigente'
        ELSE f.estatus
    END as estado_real,
    EXTRACT(DAYS FROM (CURRENT_DATE - f.fecha_vencimiento)) as dias_vencimiento,
    co.numero_contrato,
    co.fecha_inicio as contrato_fecha_inicio,
    co.fecha_fin as contrato_fecha_fin,
    f.created_at,
    f.updated_at
FROM facturas f
LEFT JOIN contratos co ON co.id = f.contrato_id;

-- Vista de tareas pendientes
CREATE VIEW vista_tareas_pendientes AS
SELECT 
    'cliente' as tipo,
    tc.id,
    tc.cliente_nombre as entidad_nombre,
    tc.titulo,
    tc.descripcion,
    tc.fecha_programada,
    tc.estatus,
    tc.prioridad,
    tc.asignado_a_nombre,
    tc.created_at
FROM tareas_cliente tc
WHERE tc.estatus = 'pendiente'

UNION ALL

SELECT 
    'vehiculo' as tipo,
    tv.id,
    tv.vehiculo_numero_economico as entidad_nombre,
    tv.titulo,
    tv.descripcion,
    tv.fecha_programada,
    tv.estatus,
    tv.prioridad,
    tv.asignado_a_nombre,
    tv.created_at
FROM tareas_vehiculo tv
WHERE tv.estatus = 'pendiente';

-- Vista de métricas del dashboard
CREATE VIEW vista_metricas_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM clientes WHERE estatus = 'activo') as clientes_activos,
    (SELECT COUNT(*) FROM contratos WHERE estatus = 'activo') as contratos_activos,
    (SELECT COUNT(*) FROM vehiculos WHERE estatus = 'Disponible') as vehiculos_disponibles,
    (SELECT COUNT(*) FROM facturas WHERE estatus = 'pendiente') as facturas_pendientes,
    (SELECT COUNT(*) FROM tareas_cliente WHERE estatus = 'pendiente') as tareas_cliente_pendientes,
    (SELECT COUNT(*) FROM tareas_vehiculo WHERE estatus = 'pendiente') as tareas_vehiculo_pendientes,
    (SELECT COUNT(*) FROM solicitudes_repuesto WHERE estatus = 'solicitado') as solicitudes_repuestos_pendientes,
    (SELECT COALESCE(SUM(monto), 0) FROM facturas WHERE estatus = 'pagada' AND DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)) as ingresos_mes_actual,
    (SELECT COALESCE(SUM(monto), 0) FROM facturas WHERE estatus = 'pendiente') as total_pendiente_cobro;

-- Vista de trámites con progreso
CREATE VIEW vista_tramites_progreso AS
SELECT 
    tc.id,
    tc.cliente_nombre,
    tc.tipo_tramite,
    tc.estatus,
    tc.fecha_inicio,
    tc.fecha_fin,
    tc.responsable_nombre,
    COUNT(rt.id) as total_requisitos,
    COUNT(CASE WHEN rt.completado = true THEN 1 END) as requisitos_completados,
    CASE 
        WHEN COUNT(rt.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN rt.completado = true THEN 1 END)::DECIMAL / COUNT(rt.id)) * 100, 2)
    END as porcentaje_completado,
    tc.created_at,
    tc.updated_at
FROM tramites_cliente tc
LEFT JOIN requisitos_tramite rt ON rt.tramite_id = tc.id
GROUP BY tc.id, tc.cliente_nombre, tc.tipo_tramite, tc.estatus, 
         tc.fecha_inicio, tc.fecha_fin, tc.responsable_nombre, tc.created_at, tc.updated_at;

-- Vista de solicitudes de repuestos por estado
CREATE VIEW vista_solicitudes_repuestos_estado AS
SELECT 
    sr.estatus,
    COUNT(*) as cantidad,
    COALESCE(SUM(sr.costo_estimado), 0) as costo_estimado_total,
    COALESCE(SUM(sr.costo_real), 0) as costo_real_total,
    AVG(EXTRACT(DAYS FROM (CURRENT_DATE - sr.fecha_solicitud))) as dias_promedio_solicitud
FROM solicitudes_repuesto sr
GROUP BY sr.estatus;

-- =====================================================
-- FUNCIONES ÚTILES PARA REPORTES
-- =====================================================

-- Función para calcular ingresos por período
CREATE OR REPLACE FUNCTION calcular_ingresos_periodo(
    fecha_inicio DATE,
    fecha_fin DATE
)
RETURNS TABLE(
    total_ingresos DECIMAL,
    total_facturas INTEGER,
    promedio_factura DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(f.monto), 0) as total_ingresos,
        COUNT(f.id)::INTEGER as total_facturas,
        CASE 
            WHEN COUNT(f.id) = 0 THEN 0
            ELSE COALESCE(SUM(f.monto), 0) / COUNT(f.id)
        END as promedio_factura
    FROM facturas f
    WHERE f.estatus = 'pagada' 
    AND f.fecha_pago BETWEEN fecha_inicio AND fecha_fin;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de vehículos
CREATE OR REPLACE FUNCTION estadisticas_vehiculos()
RETURNS TABLE(
    total_vehiculos INTEGER,
    vehiculos_disponibles INTEGER,
    vehiculos_colocados INTEGER,
    vehiculos_mantenimiento INTEGER,
    vehiculos_fuera_servicio INTEGER,
    ingresos_promedio_mensual DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM vehiculos) as total_vehiculos,
        (SELECT COUNT(*)::INTEGER FROM vehiculos WHERE estatus = 'Disponible') as vehiculos_disponibles,
        (SELECT COUNT(*)::INTEGER FROM vehiculos WHERE estatus = 'Colocado') as vehiculos_colocados,
        (SELECT COUNT(*)::INTEGER FROM vehiculos WHERE estatus = 'Mantenimiento') as vehiculos_mantenimiento,
        (SELECT COUNT(*)::INTEGER FROM vehiculos WHERE estatus = 'Fuera de Servicio') as vehiculos_fuera_servicio,
        (SELECT COALESCE(AVG(renta_semanal * 4.33), 0) FROM vehiculos WHERE estatus = 'Colocado') as ingresos_promedio_mensual;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener clientes con facturas vencidas
CREATE OR REPLACE FUNCTION clientes_con_facturas_vencidas()
RETURNS TABLE(
    cliente_id UUID,
    cliente_nombre VARCHAR,
    total_facturas_vencidas INTEGER,
    monto_total_vencido DECIMAL,
    dias_vencimiento_promedio DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as cliente_id,
        c.nombre_empresa as cliente_nombre,
        COUNT(f.id)::INTEGER as total_facturas_vencidas,
        COALESCE(SUM(f.monto), 0) as monto_total_vencido,
        COALESCE(AVG(EXTRACT(DAYS FROM (CURRENT_DATE - f.fecha_vencimiento))), 0) as dias_vencimiento_promedio
    FROM clientes c
    JOIN facturas f ON f.cliente_id = c.id
    WHERE f.estatus = 'pendiente' 
    AND f.fecha_vencimiento < CURRENT_DATE
    GROUP BY c.id, c.nombre_empresa
    ORDER BY monto_total_vencido DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA MANTENER CONSISTENCIA
-- =====================================================

-- Trigger para actualizar el estatus de facturas basado en fecha de vencimiento
CREATE OR REPLACE FUNCTION actualizar_estatus_facturas_vencidas()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar facturas pendientes que han vencido
    UPDATE facturas 
    SET estatus = 'vencida'
    WHERE estatus = 'pendiente' 
    AND fecha_vencimiento < CURRENT_DATE;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute diariamente (requiere pg_cron)
-- SELECT cron.schedule('actualizar-facturas-vencidas', '0 0 * * *', 'SELECT actualizar_estatus_facturas_vencidas();');

-- Trigger para actualizar información denormalizada
CREATE OR REPLACE FUNCTION actualizar_info_denormalizada()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar nombre del cliente en contratos cuando cambie
    IF TG_TABLE_NAME = 'clientes' AND TG_OP = 'UPDATE' THEN
        IF OLD.nombre_empresa != NEW.nombre_empresa THEN
            UPDATE contratos SET cliente_nombre = NEW.nombre_empresa WHERE cliente_id = NEW.id;
            UPDATE facturas SET cliente_nombre = NEW.nombre_empresa WHERE cliente_id = NEW.id;
            UPDATE pagos SET cliente_id = NEW.id WHERE cliente_id = NEW.id; -- Para mantener consistencia
            UPDATE notas_credito SET cliente_id = NEW.id WHERE cliente_id = NEW.id;
            UPDATE tareas_cliente SET cliente_nombre = NEW.nombre_empresa WHERE cliente_id = NEW.id;
            UPDATE notas_cliente SET cliente_nombre = NEW.nombre_empresa WHERE cliente_id = NEW.id;
            UPDATE mensajes_whatsapp SET cliente_id = NEW.id WHERE cliente_id = NEW.id;
            UPDATE tramites_cliente SET cliente_nombre = NEW.nombre_empresa WHERE cliente_id = NEW.id;
        END IF;
    END IF;
    
    -- Actualizar información del vehículo en contratos cuando cambie
    IF TG_TABLE_NAME = 'vehiculos' AND TG_OP = 'UPDATE' THEN
        IF OLD.numero_economico != NEW.numero_economico THEN
            UPDATE contratos SET vehiculo_numero_economico = NEW.numero_economico WHERE vehiculo_id = NEW.id;
            UPDATE facturas SET vehiculo_numero_economico = NEW.numero_economico WHERE vehiculo_id = NEW.id;
            UPDATE tareas_vehiculo SET vehiculo_numero_economico = NEW.numero_economico WHERE vehiculo_id = NEW.id;
            UPDATE solicitudes_repuesto SET vehiculo_numero_economico = NEW.numero_economico WHERE vehiculo_id = NEW.id;
            UPDATE inspecciones_vehiculo SET vehiculo_numero_economico = NEW.numero_economico WHERE vehiculo_id = NEW.id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER trigger_actualizar_info_denormalizada_clientes
    AFTER UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_info_denormalizada();

CREATE TRIGGER trigger_actualizar_info_denormalizada_vehiculos
    AFTER UPDATE ON vehiculos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_info_denormalizada();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON VIEW vista_resumen_clientes IS 'Vista que proporciona un resumen completo de cada cliente con estadísticas de contratos y facturas';
COMMENT ON VIEW vista_resumen_vehiculos IS 'Vista que proporciona un resumen completo de cada vehículo con estadísticas de contratos y tareas';
COMMENT ON VIEW vista_resumen_contratos IS 'Vista que proporciona un resumen completo de cada contrato con estadísticas de facturas';
COMMENT ON VIEW vista_facturas_detalladas IS 'Vista de facturas con información adicional calculada como días de vencimiento';
COMMENT ON VIEW vista_tareas_pendientes IS 'Vista unificada de todas las tareas pendientes de clientes y vehículos';
COMMENT ON VIEW vista_metricas_dashboard IS 'Vista con las métricas principales para el dashboard';
COMMENT ON VIEW vista_tramites_progreso IS 'Vista de trámites con cálculo de progreso basado en requisitos completados';
COMMENT ON VIEW vista_solicitudes_repuestos_estado IS 'Vista agregada de solicitudes de repuestos por estado';

COMMENT ON FUNCTION calcular_ingresos_periodo(DATE, DATE) IS 'Calcula ingresos totales, número de facturas y promedio por período';
COMMENT ON FUNCTION estadisticas_vehiculos() IS 'Proporciona estadísticas generales del inventario de vehículos';
COMMENT ON FUNCTION clientes_con_facturas_vencidas() IS 'Identifica clientes con facturas vencidas y calcula montos y días de vencimiento';

-- =====================================================
-- FIN DE ÍNDICES Y VISTAS
-- =====================================================
