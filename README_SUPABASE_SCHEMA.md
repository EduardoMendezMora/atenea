# ATENEAPP - Esquema Completo de Supabase

## Descripción General

Este esquema de base de datos está diseñado para **ATENEAPP**, un sistema integral de gestión de arrendamiento de vehículos. El sistema maneja todo el ciclo de vida de los vehículos, desde su adquisición hasta la gestión de contratos, facturación, mantenimiento y seguimiento de clientes.

## Estructura del Sistema

### 🏗️ Arquitectura de Base de Datos

El esquema está organizado en las siguientes categorías principales:

1. **Tablas de Catálogo y Configuración** - Datos maestros y de referencia
2. **Tablas Principales del Sistema** - Entidades centrales del negocio
3. **Tablas de Gestión y Seguimiento** - Tareas, notas y comunicación
4. **Tablas de Vehículos y Mantenimiento** - Gestión técnica de vehículos
5. **Tablas de Repuestos y Mantenimiento** - Gestión de inventario y repuestos
6. **Tablas de Inspecciones** - Checklists e inspecciones de vehículos
7. **Tablas de Trámites** - Procesos administrativos
8. **Tablas Financieras** - Movimientos bancarios y contabilidad

## 📋 Entidades Principales

### 👥 Gestión de Clientes
- **`clientes`** - Información completa de clientes
- **`tramites_cliente`** - Procesos administrativos de clientes
- **`requisitos_tramite`** - Requisitos específicos por trámite
- **`notas_cliente`** - Notas y seguimiento de clientes
- **`tareas_cliente`** - Tareas asignadas a clientes

### 🚗 Gestión de Vehículos
- **`vehiculos`** - Inventario completo de vehículos
- **`tareas_vehiculo`** - Tareas de mantenimiento y seguimiento
- **`kilometraje_vehiculo`** - Registro de kilometraje
- **`comentarios_vehiculo`** - Comentarios y observaciones
- **`dispositivos_gps`** - Dispositivos de seguimiento
- **`fotos_vehiculo`** - Galería de fotos
- **`inspecciones_vehiculo`** - Inspecciones y checklists

### 📄 Gestión de Contratos y Facturación
- **`contratos`** - Contratos de arrendamiento
- **`facturas`** - Facturación automática y manual
- **`pagos`** - Registro de pagos
- **`notas_credito`** - Notas de crédito y devoluciones

### 🔧 Gestión de Repuestos y Mantenimiento
- **`solicitudes_repuesto`** - Solicitudes de repuestos
- **`comentarios_solicitud_repuesto`** - Seguimiento de solicitudes

### 🏦 Gestión Financiera
- **`movimientos_bancarios`** - Movimientos de cuentas bancarias
- **`bancos`** - Catálogo de bancos

### 👤 Gestión de Usuarios
- **`usuarios`** - Usuarios del sistema (integración con Supabase Auth)
- **`provincias`**, **`cantones`**, **`distritos`** - División territorial de Costa Rica

## 🔐 Seguridad y Permisos

### Row Level Security (RLS)

El sistema implementa **Row Level Security** completo con las siguientes características:

#### Roles del Sistema
- **`admin`** - Acceso completo a todo el sistema
- **`Cliente`** - Acceso limitado solo a sus propios datos
- **`Empleado`** - Acceso basado en módulos permitidos
- **`Gerente`**, **`Jefatura`**, **`Operaciones`** - Roles específicos con permisos ampliados

#### Políticas de Acceso
- **Lectura**: Basada en asignación y módulos permitidos
- **Escritura**: Solo usuarios con permisos específicos
- **Clientes**: Solo pueden ver sus propios datos
- **Catálogos**: Lectura para todos, escritura solo para admins

### Funciones de Seguridad
- `get_user_role()` - Obtiene el rol del usuario actual
- `is_admin()` - Verifica si es administrador
- `is_client()` - Verifica si es cliente
- `has_module_access(module_name)` - Verifica acceso a módulos
- `is_assigned_to_client(client_id)` - Verifica asignación a cliente
- `is_assigned_to_vehicle(vehicle_id)` - Verifica asignación a vehículo

## 📊 Vistas y Reportes

### Vistas Principales
- **`vista_resumen_clientes`** - Resumen completo de clientes
- **`vista_resumen_vehiculos`** - Resumen completo de vehículos
- **`vista_resumen_contratos`** - Resumen completo de contratos
- **`vista_facturas_detalladas`** - Facturas con información calculada
- **`vista_tareas_pendientes`** - Tareas pendientes unificadas
- **`vista_metricas_dashboard`** - Métricas para dashboard
- **`vista_tramites_progreso`** - Progreso de trámites
- **`vista_solicitudes_repuestos_estado`** - Estado de solicitudes

### Funciones de Reportes
- `calcular_ingresos_periodo(fecha_inicio, fecha_fin)` - Ingresos por período
- `estadisticas_vehiculos()` - Estadísticas del inventario
- `clientes_con_facturas_vencidas()` - Clientes con facturas vencidas

## 🚀 Optimizaciones de Rendimiento

### Índices Implementados
- **Índices simples** en campos de búsqueda frecuente
- **Índices compuestos** para consultas complejas
- **Índices GIN** para búsquedas de texto
- **Índices en fechas** para consultas temporales

### Triggers Automáticos
- **Actualización de `updated_at`** en todas las tablas
- **Mantenimiento de consistencia** en datos denormalizados
- **Actualización automática** de estatus de facturas vencidas

## 📈 Estados y Flujos de Trabajo

### Estados de Vehículos
- `Disponible` - Listo para arrendamiento
- `Colocado` - En contrato activo
- `Mantenimiento` - En reparación
- `Fuera de Servicio` - No disponible
- `Vendido` - Vendido definitivamente

### Estados de Facturas
- `pendiente` - Por cobrar
- `pagada` - Cobrada
- `cancelada` - Cancelada
- `futura` - Programada para el futuro
- `vencida` - Vencida (calculada automáticamente)

### Estados de Trámites
- `iniciado` - Trámite iniciado
- `en_proceso` - En proceso
- `pendiente_documentos` - Esperando documentos
- `revision` - En revisión
- `aprobado` - Aprobado
- `rechazado` - Rechazado
- `contrato_emitido` - Contrato generado

### Estados de Solicitudes de Repuestos
- `solicitado` - Solicitud creada
- `cotizando` - En proceso de cotización
- `aprobado` - Aprobado para compra
- `comprado` - Comprado

## 🔄 Relaciones Principales

### Cliente → Contrato → Factura
```
clientes (1) → (N) contratos (1) → (N) facturas
```

### Vehículo → Contrato
```
vehiculos (1) → (N) contratos
```

### Cliente → Tareas/Notas/Trámites
```
clientes (1) → (N) tareas_cliente
clientes (1) → (N) notas_cliente
clientes (1) → (N) tramites_cliente
```

### Vehículo → Tareas/Mantenimiento
```
vehiculos (1) → (N) tareas_vehiculo
vehiculos (1) → (N) kilometraje_vehiculo
vehiculos (1) → (N) inspecciones_vehiculo
vehiculos (1) → (N) solicitudes_repuesto
```

## 📝 Datos Iniciales (Seed Data)

El esquema incluye datos iniciales para:
- **Provincias de Costa Rica** (7 provincias)
- **Estados de vehículos** (5 estados básicos)
- **Estados de inventario** (5 estados básicos)
- **Tipos de combustible** (5 tipos)
- **Transmisiones** (4 tipos)
- **Tracciones** (4 tipos)
- **Carrocerías** (7 tipos)
- **Bancos de Costa Rica** (7 bancos principales)

## 🛠️ Instalación y Configuración

### 1. Ejecutar el Esquema Principal
```sql
-- Ejecutar en orden:
\i supabase_schema.sql
```

### 2. Aplicar Políticas de Seguridad
```sql
\i supabase_rls_policies.sql
```

### 3. Crear Índices y Vistas
```sql
\i supabase_indexes_views.sql
```

### 4. Configurar Usuarios Iniciales
```sql
-- Insertar usuario administrador inicial
INSERT INTO usuarios (id, email, full_name, role, rol_sistema, modulos_permitidos)
VALUES (
    'uuid-del-usuario-admin',
    'admin@ateneapp.com',
    'Administrador',
    'admin',
    'Admin',
    ARRAY['Clientes', 'Vehiculos', 'Contratos', 'Facturacion', 'Pagos', 'Tareas', 'Tramites', 'Repuestos', 'Inspecciones', 'Bancos', 'Usuarios']
);
```

## 🔍 Consultas Útiles

### Obtener Dashboard Principal
```sql
SELECT * FROM vista_metricas_dashboard;
```

### Clientes con Facturas Vencidas
```sql
SELECT * FROM clientes_con_facturas_vencidas();
```

### Estadísticas de Vehículos
```sql
SELECT * FROM estadisticas_vehiculos();
```

### Ingresos del Mes Actual
```sql
SELECT * FROM calcular_ingresos_periodo(
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
);
```

## 📚 Módulos del Sistema

El sistema está organizado en los siguientes módulos:
- **Clientes** - Gestión de clientes
- **Vehículos** - Inventario y gestión de vehículos
- **Contratos** - Gestión de contratos de arrendamiento
- **Facturación** - Facturación y cobros
- **Pagos** - Gestión de pagos
- **Tareas** - Sistema de tareas y seguimiento
- **Trámites** - Procesos administrativos
- **Repuestos** - Gestión de repuestos y mantenimiento
- **Inspecciones** - Inspecciones y checklists
- **Bancos** - Movimientos bancarios
- **Usuarios** - Gestión de usuarios y permisos

## 🔧 Mantenimiento

### Tareas de Mantenimiento Recomendadas
1. **Actualización diaria** de estatus de facturas vencidas
2. **Limpieza periódica** de datos temporales
3. **Backup regular** de la base de datos
4. **Monitoreo de rendimiento** de consultas
5. **Actualización de índices** según uso

### Monitoreo de Rendimiento
- Revisar consultas lentas en `pg_stat_statements`
- Monitorear uso de índices
- Verificar fragmentación de tablas
- Optimizar consultas frecuentes

## 📞 Soporte

Para soporte técnico o consultas sobre el esquema:
- Revisar la documentación de Supabase
- Consultar los comentarios en el código SQL
- Verificar las vistas y funciones disponibles
- Revisar las políticas de seguridad implementadas

---

**Nota**: Este esquema está diseñado específicamente para el sistema ATENEAPP y las necesidades del mercado costarricense de arrendamiento de vehículos. Asegúrese de adaptar los datos iniciales y configuraciones según sus necesidades específicas.
