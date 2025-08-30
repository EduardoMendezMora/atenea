# 🚀 Instrucciones para Conectar con Supabase y Subir a GitHub

## 📋 Pasos para Conectar con Supabase

### 1. Instalar el Esquema en Supabase

1. **Ve a tu Dashboard de Supabase**: https://supabase.com/dashboard
2. **Selecciona tu proyecto**: `sovraqexnkjggbklmbrp`
3. **Ve a SQL Editor** (ícono de `</>` en el menú lateral)
4. **Ejecuta los archivos SQL en este orden**:

   ```sql
   -- 1. Primero ejecuta: supabase_schema.sql
   -- 2. Luego ejecuta: supabase_rls_policies.sql  
   -- 3. Finalmente ejecuta: supabase_indexes_views.sql
   ```

### 2. Obtener la Service Role Key

1. En tu dashboard de Supabase, ve a **Settings** → **API**
2. Copia la **service_role** key (no la anon key)
3. Reemplaza `YOUR_SERVICE_ROLE_KEY_HERE` en `supabase_config.js` y `env.example`

### 3. Configurar Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   cp env.example .env
   ```

2. Edita `.env` y agrega tu service role key:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

## 📤 Pasos para Subir a GitHub

### 1. Inicializar Git (si no está inicializado)

```bash
git init
```

### 2. Crear .gitignore

```bash
# Crear .gitignore si no existe
echo "node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
.vscode/
.idea/" > .gitignore
```

### 3. Agregar archivos al repositorio

```bash
# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "feat: Agregar esquema completo de Supabase para AteneaApp

- Esquema de base de datos completo con 40+ tablas
- Políticas RLS para seguridad
- Índices y vistas optimizadas
- Documentación completa
- Configuración de Supabase lista"
```

### 4. Conectar con GitHub

```bash
# Agregar repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/ateneapp.git

# Subir al repositorio
git push -u origin main
```

## 🔧 Archivos Creados

- ✅ `supabase_schema.sql` - Esquema completo de la base de datos
- ✅ `supabase_rls_policies.sql` - Políticas de seguridad RLS
- ✅ `supabase_indexes_views.sql` - Índices y vistas optimizadas
- ✅ `README_SUPABASE_SCHEMA.md` - Documentación detallada
- ✅ `ESQUEMA_SUPABASE_COMPLETO.md` - Resumen ejecutivo
- ✅ `supabase_config.js` - Configuración de Supabase
- ✅ `env.example` - Plantilla de variables de entorno

## 🎯 Próximos Pasos

1. **Ejecutar el esquema en Supabase** usando el SQL Editor
2. **Obtener la service role key** del dashboard
3. **Configurar las variables de entorno**
4. **Hacer commit y push a GitHub**
5. **Probar la conexión** desde tu aplicación

## 🆘 Si Necesitas Ayuda

- Revisa la documentación en `README_SUPABASE_SCHEMA.md`
- Verifica que todas las tablas se crearon correctamente en Supabase
- Asegúrate de que las políticas RLS estén activas
- Prueba las vistas creadas en el SQL Editor

¡Tu esquema está listo para producción! 🎉
