/* ==========================================================================
   CAMADA DE BANCO DE DADOS (SUPABASE & OFFLINE)
   ========================================================================== */

const DB = {
    // Buscar atendimentos no pátio
    async getPatioAtendimentos() {
        try {
            const { data, error } = await supabaseClient
                .from('atendimentos')
                .select('*')
                .neq('status', 'ENTREGUE')
                .order('entrada_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Erro ao buscar atendimentos:', err);
            return [];
        }
    },

    // Criar novo atendimento
    async createAtendimento(novoAtendimento) {
        try {
            const { data, error } = await supabaseClient
                .from('atendimentos')
                .insert([novoAtendimento])
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Erro ao criar atendimento:', err);
            return { success: false, error: err.message };
        }
    },

    // Atualizar status do atendimento
    async updateStatusAtendimento(id, novoStatus) {
        try {
            const payload = { status: novoStatus };
            if (novoStatus === 'ENTREGUE') {
                payload.saida_at = new Date().toISOString();
            }

            const { data, error } = await supabaseClient
                .from('atendimentos')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            return { success: false, error: err.message };
        }
    },

    // Buscar clientes CRM
    async getClientes() {
        try {
            const { data, error } = await supabaseClient
                .from('clientes')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            return [];
        }
    }
};