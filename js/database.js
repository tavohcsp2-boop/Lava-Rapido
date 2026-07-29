/* ==========================================================================
   CAMADA DE BANCO DE DADOS (SUPABASE & OFFLINE)
   Todas as funções retornam { success: boolean, data?, error? }
   ========================================================================== */

const LOCAL_FALLBACK_KEY = 'lavarapido_fallback_atendimentos';

const DB = {
    // Buscar atendimentos que ainda não foram entregues (Pátio + Em Lavagem)
    async getPatioAtendimentos() {
        try {
            const { data, error } = await supabaseClient
                .from('atendimentos')
                .select('*')
                .neq('status', 'ENTREGUE')
                .order('entrada_at', { ascending: false });

            if (error) throw error;
            localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(data || []));
            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Erro ao buscar atendimentos, usando fallback local:', err);
            const cached = JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY) || '[]');
            return { success: true, data: cached, offline: true };
        }
    },

    // Criar novo atendimento
    async createAtendimento(novoAtendimento) {
        try {
            const payload = { ...novoAtendimento, status: novoAtendimento.status || 'PATIO', entrada_at: new Date().toISOString() };
            const { data, error } = await supabaseClient
                .from('atendimentos')
                .insert([payload])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Erro ao criar atendimento:', err);
            return { success: false, error: err.message };
        }
    },

    // Atualizar status do atendimento (PATIO -> LAVAGEM -> ENTREGUE)
    async updateStatusAtendimento(id, novoStatus) {
        try {
            const payload = { status: novoStatus };
            if (novoStatus === 'LAVAGEM') payload.lavagem_at = new Date().toISOString();
            if (novoStatus === 'ENTREGUE') payload.saida_at = new Date().toISOString();

            const { data, error } = await supabaseClient
                .from('atendimentos')
                .update(payload)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            return { success: false, error: err.message };
        }
    },

    // Atalhos usados pela UI
    async iniciarLavagem(id) {
        return this.updateStatusAtendimento(id, 'LAVAGEM');
    },
    async concluirAtendimento(id) {
        return this.updateStatusAtendimento(id, 'ENTREGUE');
    },

    // Buscar clientes CRM
    async getClientes() {
        try {
            const { data, error } = await supabaseClient
                .from('clientes')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            return { success: false, error: err.message, data: [] };
        }
    },

    // Buscar histórico de um veículo pela placa (usado no auto-preenchimento)
    async buscarPorPlaca(placa) {
        if (!placa) return { success: true, data: null };
        try {
            const { data, error } = await supabaseClient
                .from('atendimentos')
                .select('*')
                .eq('placa_snapshot', placa.toUpperCase())
                .order('entrada_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return { success: true, data: (data && data[0]) || null };
        } catch (err) {
            console.error('Erro ao buscar por placa:', err);
            return { success: false, data: null };
        }
    },

    // Relatório do dia: soma de valores e contagem de entregues hoje
    async getRelatorioHoje() {
        try {
            const inicioDia = new Date();
            inicioDia.setHours(0, 0, 0, 0);

            const { data, error } = await supabaseClient
                .from('atendimentos')
                .select('*')
                .eq('status', 'ENTREGUE')
                .gte('saida_at', inicioDia.toISOString());

            if (error) throw error;
            const lista = data || [];
            const faturamento = lista.reduce((acc, item) => acc + parseFloat(item.valor_total || 0), 0);
            return { success: true, data: { faturamento, concluidos: lista.length } };
        } catch (err) {
            console.error('Erro ao buscar relatório:', err);
            return { success: false, data: { faturamento: 0, concluidos: 0 } };
        }
    },

    // Inscreve-se em atualizações em tempo real da tabela de atendimentos
    subscribeRealtime(onChange) {
        if (!supabaseClient) return null;
        return supabaseClient
            .channel('atendimentos-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'atendimentos' }, onChange)
            .subscribe();
    }
};
