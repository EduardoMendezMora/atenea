-- =====================================================
-- ATENEAPP - SUPABASE SCHEMA COMPLETO
-- Sistema de Gestión de Arrendamiento de Vehículos
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLAS DE CATÁLOGO Y CONFIGURACIÓN
-- =====================================================

-- Provincias (Costa Rica)
CREATE TABLE provincias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cantones
CREATE TABLE cantones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    provincia_id UUID NOT NULL REFERENCES provincias(id) ON DELETE CASCADE,
    provincia_nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, provincia_id)
);

-- Distritos
CREATE TABLE distritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    canton_id UUID NOT NULL REFERENCES cantones(id) ON DELETE CASCADE,
    canton_nombre VARCHAR(100) NOT NULL,
    provincia_id UUID NOT NULL REFERENCES provincias(id) ON DELETE CASCADE,
    codigo VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, canton_id)
);

-- Marcas de vehículos
CREATE TABLE marcas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modelos de vehículos
CREATE TABLE modelos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    marca_id UUID NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
    marca_nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre, marca_id)
);

-- Carrocerías
CREATE TABLE carrocerias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tipos de combustible
CREATE TABLE combustibles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arrendadoras
CREATE TABLE arrendadoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL UNIQUE,
    id_juridica VARCHAR(50),
    apoderado VARCHAR(200),
    id_apoderado VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transmisiones
CREATE TABLE transmisiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracciones
CREATE TABLE tracciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estados de vehículo
CREATE TABLE estados_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estados de inventario
CREATE TABLE estados_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ubicaciones de vehículos
CREATE TABLE ubicaciones_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bancos
CREATE TABLE bancos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL UNIQUE,
    codigo VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS PRINCIPALES DEL SISTEMA
-- =====================================================

-- Usuarios del sistema (integración con Supabase Auth)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'user',
    rol_sistema VARCHAR(50) DEFAULT 'Empleado',
    modulos_permitidos TEXT[], -- Array de módulos permitidos
    telefono VARCHAR(20),
    estatus VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_empresa VARCHAR(200) NOT NULL,
    rfc VARCHAR(50) UNIQUE,
    telefono VARCHAR(20) DEFAULT '506',
    email VARCHAR(255) UNIQUE,
    fecha_nacimiento DATE,
    genero VARCHAR(20),
    estado_civil VARCHAR(50),
    ocupacion VARCHAR(100),
    cantidad_hijos INTEGER DEFAULT 0,
    edad INTEGER,
    provincia_id UUID REFERENCES provincias(id),
    provincia_nombre VARCHAR(100),
    canton_id UUID REFERENCES cantones(id),
    canton_nombre VARCHAR(100),
    distrito_id UUID REFERENCES distritos(id),
    distrito_nombre VARCHAR(100),
    otras_senas TEXT,
    tipos_licencia TEXT[], -- Array de tipos de licencia
    estatus VARCHAR(20) DEFAULT 'activo',
    asignado_a_id UUID REFERENCES usuarios(id),
    asignado_a_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehículos
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_economico VARCHAR(50) UNIQUE,
    placas VARCHAR(20) UNIQUE,
    marca_id UUID REFERENCES marcas(id),
    marca VARCHAR(100),
    modelo_id UUID REFERENCES modelos(id),
    modelo VARCHAR(100),
    año INTEGER,
    numero_serie VARCHAR(100), -- VIN
    color VARCHAR(50),
    carroceria VARCHAR(100),
    cilindrada VARCHAR(50),
    cilindros INTEGER,
    combustible VARCHAR(50),
    transmision VARCHAR(50),
    traccion VARCHAR(50),
    fotos_url TEXT,
    estatus VARCHAR(50),
    estatus_inventario VARCHAR(50),
    renta_semanal DECIMAL(10,2) DEFAULT 0,
    gastos_administrativos DECIMAL(10,2) DEFAULT 0,
    plazo_semanas INTEGER DEFAULT 0,
    arrendadora_id UUID REFERENCES arrendadoras(id),
    arrendadora_nombre VARCHAR(200),
    arrendadora_id_juridica VARCHAR(50),
    arrendadora_apoderado VARCHAR(200),
    arrendadora_id_apoderado VARCHAR(50),
    valor_adquisicion DECIMAL(12,2),
    fecha_adquisicion DATE,
    ubicacion_actual VARCHAR(100),
    contrato_activo_id UUID,
    cliente_actual VARCHAR(200),
    observaciones TEXT,
    asignado_a_id UUID REFERENCES usuarios(id),
    asignado_a_nombre VARCHAR(200),
    whatsapp_grupo_id VARCHAR(100),
    whatsapp_grupo_nombre VARCHAR(200),
    kilometraje_actual INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contratos
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_contrato VARCHAR(100) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(200) NOT NULL,
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
    vehiculo_numero_economico VARCHAR(50),
    vehiculo_descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    renta_semanal DECIMAL(10,2) NOT NULL,
    gastos_administrativos DECIMAL(10,2) DEFAULT 0,
    plazo_semanas INTEGER NOT NULL,
    vendedor_id UUID REFERENCES usuarios(id),
    vendedor_nombre VARCHAR(200),
    whatsapp_grupo_id VARCHAR(100),
    whatsapp_grupo_nombre VARCHAR(200),
    estatus VARCHAR(20) DEFAULT 'activo',
    facturas_generadas BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Facturas
CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_factura VARCHAR(100) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(200) NOT NULL,
    contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,
    vehiculo_id UUID REFERENCES vehiculos(id),
    vehiculo_numero_economico VARCHAR(50),
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago DATE,
    estatus VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagada, cancelada, futura, vencida
    estatus_pago VARCHAR(20) DEFAULT 'pendiente', -- pendiente, pagada
    metodo_pago VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pagos
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100),
    banco_id UUID REFERENCES bancos(id),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas de crédito
CREATE TABLE notas_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_nota VARCHAR(100) UNIQUE NOT NULL,
    factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    monto DECIMAL(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    fecha_emision DATE NOT NULL,
    estatus VARCHAR(20) DEFAULT 'activa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE GESTIÓN Y SEGUIMIENTO
-- =====================================================

-- Tareas de clientes
CREATE TABLE tareas_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(200) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE,
    fecha_completada DATE,
    estatus VARCHAR(20) DEFAULT 'pendiente', -- pendiente, completada, cancelada
    prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta
    asignado_a_id UUID REFERENCES usuarios(id),
    asignado_a_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tareas de vehículos
CREATE TABLE tareas_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    vehiculo_numero_economico VARCHAR(50),
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE,
    fecha_completada DATE,
    estatus VARCHAR(20) DEFAULT 'pendiente', -- pendiente, completada, cancelada
    prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta
    asignado_a_id UUID REFERENCES usuarios(id),
    asignado_a_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notas de clientes
CREATE TABLE notas_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(200) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensajes de WhatsApp
CREATE TABLE mensajes_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    numero_telefono VARCHAR(20) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'enviado', -- enviado, recibido
    estatus VARCHAR(20) DEFAULT 'enviado', -- enviado, entregado, leido, error
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE VEHÍCULOS Y MANTENIMIENTO
-- =====================================================

-- Kilometraje de vehículos
CREATE TABLE kilometraje_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    kilometraje INTEGER NOT NULL,
    fecha_registro DATE NOT NULL,
    observaciones TEXT,
    registrado_por_id UUID REFERENCES usuarios(id),
    registrado_por_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de vehículos
CREATE TABLE comentarios_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de tareas de vehículos
CREATE TABLE comentarios_tarea_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarea_id UUID NOT NULL REFERENCES tareas_vehiculo(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispositivos GPS
CREATE TABLE dispositivos_gps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    modelo VARCHAR(100),
    numero_telefono VARCHAR(20),
    estatus VARCHAR(20) DEFAULT 'activo',
    fecha_instalacion DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de dispositivos GPS
CREATE TABLE comentarios_dispositivo_gps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispositivo_id UUID NOT NULL REFERENCES dispositivos_gps(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fotos de vehículos
CREATE TABLE fotos_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    descripcion VARCHAR(200),
    fecha_toma DATE,
    subida_por_id UUID REFERENCES usuarios(id),
    subida_por_nombre VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE REPUESTOS Y MANTENIMIENTO
-- =====================================================

-- Solicitudes de repuestos
CREATE TABLE solicitudes_repuesto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    vehiculo_numero_economico VARCHAR(50),
    descripcion TEXT NOT NULL,
    cantidad INTEGER DEFAULT 1,
    estatus VARCHAR(20) DEFAULT 'solicitado', -- solicitado, cotizando, aprobado, comprado
    prioridad VARCHAR(20) DEFAULT 'media', -- baja, media, alta
    solicitado_por_id UUID REFERENCES usuarios(id),
    solicitado_por_nombre VARCHAR(200),
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    fecha_aprobacion DATE,
    fecha_compra DATE,
    costo_estimado DECIMAL(10,2),
    costo_real DECIMAL(10,2),
    proveedor VARCHAR(200),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de solicitudes de repuestos
CREATE TABLE comentarios_solicitud_repuesto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_repuesto(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE INSPECCIONES
-- =====================================================

-- Templates de checklist
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'general', -- entrada, salida, mantenimiento, general
    preguntas JSONB NOT NULL, -- Array de preguntas con opciones
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspecciones de vehículos
CREATE TABLE inspecciones_vehiculo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
    vehiculo_numero_economico VARCHAR(50),
    template_id UUID REFERENCES checklist_templates(id),
    template_nombre VARCHAR(200),
    tipo_inspeccion VARCHAR(50) NOT NULL, -- entrada, salida, mantenimiento
    kilometraje INTEGER,
    inspector_id UUID REFERENCES usuarios(id),
    inspector_nombre VARCHAR(200),
    fecha_inspeccion DATE NOT NULL,
    resultados JSONB NOT NULL, -- Resultados de cada pregunta
    observaciones TEXT,
    estatus VARCHAR(20) DEFAULT 'completada', -- completada, pendiente, cancelada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS DE TRÁMITES
-- =====================================================

-- Trámites de clientes
CREATE TABLE tramites_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(200) NOT NULL,
    tipo_tramite VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estatus VARCHAR(50) DEFAULT 'iniciado', -- iniciado, en_proceso, pendiente_documentos, revision, aprobado, rechazado, contrato_emitido
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    responsable_id UUID REFERENCES usuarios(id),
    responsable_nombre VARCHAR(200),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requisitos maestros
CREATE TABLE requisitos_maestro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo_documento VARCHAR(100),
    obligatorio BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requisitos de trámites
CREATE TABLE requisitos_tramite (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tramite_id UUID NOT NULL REFERENCES tramites_cliente(id) ON DELETE CASCADE,
    requisito_maestro_id UUID REFERENCES requisitos_maestro(id),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    completado BOOLEAN DEFAULT FALSE,
    fecha_completado DATE,
    documento_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de requisitos
CREATE TABLE comentarios_requisito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisito_id UUID NOT NULL REFERENCES requisitos_tramite(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    autor_id UUID REFERENCES usuarios(id),
    autor_nombre VARCHAR(200),
    fecha_comentario TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLAS FINANCIERAS
-- =====================================================

-- Movimientos bancarios
CREATE TABLE movimientos_bancarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banco_id UUID NOT NULL REFERENCES bancos(id),
    numero_cuenta VARCHAR(50),
    tipo_movimiento VARCHAR(20) NOT NULL, -- ingreso, egreso
    monto DECIMAL(12,2) NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    referencia VARCHAR(100),
    fecha_movimiento DATE NOT NULL,
    fecha_contable DATE,
    saldo_anterior DECIMAL(12,2),
    saldo_nuevo DECIMAL(12,2),
    factura_id UUID REFERENCES facturas(id),
    pago_id UUID REFERENCES pagos(id),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_estatus ON clientes(estatus);
CREATE INDEX idx_clientes_asignado ON clientes(asignado_a_id);

CREATE INDEX idx_vehiculos_placas ON vehiculos(placas);
CREATE INDEX idx_vehiculos_numero_economico ON vehiculos(numero_economico);
CREATE INDEX idx_vehiculos_estatus ON vehiculos(estatus);
CREATE INDEX idx_vehiculos_cliente_actual ON vehiculos(cliente_actual);

CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);
CREATE INDEX idx_contratos_vehiculo ON contratos(vehiculo_id);
CREATE INDEX idx_contratos_estatus ON contratos(estatus);
CREATE INDEX idx_contratos_fecha_inicio ON contratos(fecha_inicio);

CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_contrato ON facturas(contrato_id);
CREATE INDEX idx_facturas_estatus ON facturas(estatus);
CREATE INDEX idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);

CREATE INDEX idx_tareas_cliente_cliente ON tareas_cliente(cliente_id);
CREATE INDEX idx_tareas_cliente_asignado ON tareas_cliente(asignado_a_id);
CREATE INDEX idx_tareas_cliente_estatus ON tareas_cliente(estatus);

CREATE INDEX idx_tareas_vehiculo_vehiculo ON tareas_vehiculo(vehiculo_id);
CREATE INDEX idx_tareas_vehiculo_asignado ON tareas_vehiculo(asignado_a_id);
CREATE INDEX idx_tareas_vehiculo_estatus ON tareas_vehiculo(estatus);

CREATE INDEX idx_tramites_cliente_cliente ON tramites_cliente(cliente_id);
CREATE INDEX idx_tramites_cliente_estatus ON tramites_cliente(estatus);

CREATE INDEX idx_solicitudes_repuesto_vehiculo ON solicitudes_repuesto(vehiculo_id);
CREATE INDEX idx_solicitudes_repuesto_estatus ON solicitudes_repuesto(estatus);

-- Índices para relaciones territoriales
CREATE INDEX idx_cantones_provincia ON cantones(provincia_id);
CREATE INDEX idx_distritos_canton ON distritos(canton_id);
CREATE INDEX idx_distritos_provincia ON distritos(provincia_id);

-- Índices para catálogos
CREATE INDEX idx_modelos_marca ON modelos(marca_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER update_provincias_updated_at BEFORE UPDATE ON provincias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cantones_updated_at BEFORE UPDATE ON cantones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distritos_updated_at BEFORE UPDATE ON distritos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marcas_updated_at BEFORE UPDATE ON marcas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modelos_updated_at BEFORE UPDATE ON modelos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carrocerias_updated_at BEFORE UPDATE ON carrocerias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_combustibles_updated_at BEFORE UPDATE ON combustibles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_arrendadoras_updated_at BEFORE UPDATE ON arrendadoras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transmisiones_updated_at BEFORE UPDATE ON transmisiones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracciones_updated_at BEFORE UPDATE ON tracciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estados_vehiculo_updated_at BEFORE UPDATE ON estados_vehiculo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estados_inventario_updated_at BEFORE UPDATE ON estados_inventario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ubicaciones_vehiculo_updated_at BEFORE UPDATE ON ubicaciones_vehiculo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON bancos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON vehiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_credito_updated_at BEFORE UPDATE ON notas_credito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tareas_cliente_updated_at BEFORE UPDATE ON tareas_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tareas_vehiculo_updated_at BEFORE UPDATE ON tareas_vehiculo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notas_cliente_updated_at BEFORE UPDATE ON notas_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dispositivos_gps_updated_at BEFORE UPDATE ON dispositivos_gps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_solicitudes_repuesto_updated_at BEFORE UPDATE ON solicitudes_repuesto FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspecciones_vehiculo_updated_at BEFORE UPDATE ON inspecciones_vehiculo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tramites_cliente_updated_at BEFORE UPDATE ON tramites_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requisitos_maestro_updated_at BEFORE UPDATE ON requisitos_maestro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requisitos_tramite_updated_at BEFORE UPDATE ON requisitos_tramite FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimientos_bancarios_updated_at BEFORE UPDATE ON movimientos_bancarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES (SEED DATA)
-- =====================================================

-- Insertar datos básicos de Costa Rica
INSERT INTO provincias (nombre, codigo) VALUES
('San José', 'SJ'),
('Alajuela', 'AL'),
('Cartago', 'CA'),
('Heredia', 'HE'),
('Guanacaste', 'GU'),
('Puntarenas', 'PU'),
('Limón', 'LI');

-- Insertar estados básicos
INSERT INTO estados_vehiculo (nombre) VALUES
('Disponible'),
('Colocado'),
('Mantenimiento'),
('Fuera de Servicio'),
('Vendido');

INSERT INTO estados_inventario (nombre) VALUES
('En Inventario'),
('En Renta'),
('Mantenimiento'),
('Fuera de Servicio'),
('Vendido');

-- Insertar tipos de combustible básicos
INSERT INTO combustibles (nombre) VALUES
('Gasolina'),
('Diesel'),
('Eléctrico'),
('Híbrido'),
('Gas');

-- Insertar transmisiones básicas
INSERT INTO transmisiones (nombre) VALUES
('Manual'),
('Automática'),
('CVT'),
('Semi-automática');

-- Insertar tracciones básicas
INSERT INTO tracciones (nombre) VALUES
('Delantera'),
('Trasera'),
('4x4'),
('AWD');

-- Insertar carrocerías básicas
INSERT INTO carrocerias (nombre) VALUES
('Sedán'),
('Hatchback'),
('SUV'),
('Pickup'),
('Van'),
('Camión'),
('Motocicleta');

-- Insertar bancos básicos de Costa Rica
INSERT INTO bancos (nombre, codigo) VALUES
('Banco Nacional de Costa Rica', 'BNCR'),
('Banco de Costa Rica', 'BCR'),
('Banco Popular', 'BP'),
('Scotiabank', 'SB'),
('BAC San José', 'BAC'),
('Banco Promerica', 'BPRO'),
('Coopenae', 'COOP');

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE clientes IS 'Información de clientes del sistema de arrendamiento';
COMMENT ON TABLE vehiculos IS 'Inventario de vehículos disponibles para arrendamiento';
COMMENT ON TABLE contratos IS 'Contratos de arrendamiento de vehículos';
COMMENT ON TABLE facturas IS 'Facturas generadas por los contratos';
COMMENT ON TABLE pagos IS 'Registro de pagos realizados por los clientes';
COMMENT ON TABLE tareas_cliente IS 'Tareas y seguimiento relacionadas con clientes';
COMMENT ON TABLE tareas_vehiculo IS 'Tareas de mantenimiento y seguimiento de vehículos';
COMMENT ON TABLE tramites_cliente IS 'Trámites y procesos administrativos de clientes';
COMMENT ON TABLE solicitudes_repuesto IS 'Solicitudes de repuestos y mantenimiento';
COMMENT ON TABLE inspecciones_vehiculo IS 'Inspecciones y checklists de vehículos';

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
