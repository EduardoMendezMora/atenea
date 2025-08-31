# Configuración de Build para Netlify

## Versiones compatibles:
- Node.js: 20.17.0 (LTS actual)
- NPM: 10.8.2
- Vite: 6.1.0

## Variables de entorno configuradas:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY
- NODE_ENV=production

## Comandos de build:
- Build: `npm run build`
- Publish: `dist/`
- Redirects: SPA mode

## Dependencias críticas:
- @apollo/client: ^3.8.8
- @supabase/supabase-js: ^2.45.4
- vite: ^6.1.0
- @vitejs/plugin-react: ^4.3.4
