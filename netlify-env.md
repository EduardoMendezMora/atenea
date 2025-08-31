# Variables de Entorno para Netlify

Configura estas variables en tu dashboard de Netlify:

## Variables de Entorno Requeridas

```
VITE_SUPABASE_URL=https://sovraqexnkjggbklmbrp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdnJhcWV4bmtqZ2dia2xtYnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODkzNTQsImV4cCI6MjA3MjE2NTM1NH0.dwGBbr5HFgtyQS2Jsvsihp06AjIFGILUIPM8fdX5oXM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdnJhcWV4bmtqZ2dia2xtYnJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4OTM1NCwiZXhwIjoyMDcyMTY1MzU0fQ.OS6A06i4usR4esV38BoLagT_27FI6RHodWpONITHDq8
NODE_ENV=production
```

## Cómo configurar en Netlify:

1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio
3. Ve a **Site settings** → **Environment variables**
4. Agrega cada variable una por una
5. Haz **Redeploy** del sitio

## Notas importantes:

- Las variables que empiezan con `VITE_` son accesibles en el frontend
- `SUPABASE_SERVICE_ROLE_KEY` es solo para el backend (no se expone al frontend)
- Después de agregar las variables, necesitas hacer un redeploy
