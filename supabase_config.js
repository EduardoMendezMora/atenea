// Configuración de Supabase
export const supabaseConfig = {
  url: 'https://sovraqexnkjggbklmbrp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdnJhcWV4bmtqZ2dia2xtYnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODkzNTQsImV4cCI6MjA3MjE2NTM1NH0.dwGBbr5HFgtyQS2Jsvsihp06AjIFGILUIPM8fdX5oXM',
  serviceRoleKey: 'YOUR_SERVICE_ROLE_KEY_HERE' // Necesitarás obtener esta clave desde tu dashboard de Supabase
};

// Configuración para el cliente de Supabase
export const createSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(supabaseConfig.url, supabaseConfig.anonKey);
};
