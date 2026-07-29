/* ==========================================================================
   CONFIGURAÇÕES GLOBAIS E CONEXÃO SUPABASE / GROQ
   ========================================================================== */

const SUPABASE_URL = 'https://huslahiuefqquzoggefh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1c2xhaGl1ZWZxcXV6b2dnZWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNzYxOTcsImV4cCI6MjEwMDc1MjE5N30.igdcz9qF0VLHUPKj_j9RtQ7jI4GZrHISbDU7SkQ6yqs';

// ⚠️ IMPORTANTE: a chave da Groq que veio no resumo do projeto foi colada em um chat
// e deve ser considerada exposta. Gere uma NOVA key em https://console.groq.com/keys
// e cole aqui antes de usar a Entrada por Voz.
const GROQ_API_KEY = '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
';
const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

// Inicialização do cliente Supabase
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Conexão inicializada com sucesso.');
} else {
    console.error('[Supabase] SDK não encontrado na página.');
}
