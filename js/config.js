/* ==========================================================================
   CONFIGURAÇÕES GLOBAIS E CONEXÃO SUPABASE
   ========================================================================== */

const SUPABASE_URL = 'https://huslahiuefqquzoggefh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2xhaGl1ZWZxcXV6b2dnZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE5Mzg3MjksImV4cCI6MjAzNzUxNDcyOX0.4wD-dM-M-0N2Yj1yM2X8J9K0L1M2N3O4P5Q6R7S8T9U';

// Inicialização do cliente Supabase
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Conexão inicializada com sucesso.');
} else {
    console.error('[Supabase] SDK não encontrado na página.');
}