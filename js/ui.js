/* ==========================================================================
   INTERFACE DO USUÁRIO (UI) E NAVEGAÇÃO
   ========================================================================== */

const SENHA_ADMIN = "1234"; // 🔒 Senha para acessar Relatórios e Consultoria
const ABAS_PROTEGIDAS = ['relatorios', 'consultoria'];

const UI = {
    realtimeChannel: null,

    // ---------- Utilitários ----------
    showLoader(show) {
        const loader = document.getElementById('global-loader');
        if (loader) loader.style.display = show ? 'flex' : 'none';
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // ---------- Login / Sessão ----------
    showLoginModal() {
        const modal = document.getElementById('modal-login');
        if (modal) modal.style.display = 'flex';
    },

    hideLoginModal() {
        const modal = document.getElementById('modal-login');
        if (modal) modal.style.display = 'none';
    },

    updateUserDisplay(email) {
        const el = document.getElementById('current-user-name');
        if (el) el.textContent = email;
    },

    // Chamado após o login ser confirmado
    startApp() {
        this.loadPatio();
        if (!this.realtimeChannel) {
            this.realtimeChannel = DB.subscribeRealtime(() => this.loadPatio());
        }
    },

    // ---------- Navegação entre abas ----------
    switchTab(nomeAba) {
        if (ABAS_PROTEGIDAS.includes(nomeAba)) {
            const pin = prompt("🔒 Área Restrita! Digite a senha administrativa:");
            if (pin !== SENHA_ADMIN) {
                this.showToast("❌ Senha incorreta! Acesso negado.", "error");
                return;
            }
        }

        document.querySelectorAll('.tab-content').forEach(secao => secao.classList.remove('active'));
        const abaAlvo = document.getElementById(`tab-${nomeAba}`);
        if (abaAlvo) abaAlvo.classList.add('active');

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const btnAtivo = document.getElementById(`tab-btn-${nomeAba}`);
        if (btnAtivo) btnAtivo.classList.add('active');

        if (nomeAba === 'crm') this.loadCRM();
        if (nomeAba === 'relatorios') this.loadRelatorios();
    },

    // ---------- Modal de Nova Entrada ----------
    showNovoAtendimentoModal(show) {
        const modal = document.getElementById('modal-atendimento');
        if (modal) modal.style.display = show ? 'flex' : 'none';
    },

    // ---------- Pátio ----------
    async loadPatio() {
        this.showLoader(true);
        const container = document.getElementById('patio-grid');
        const res = await DB.getPatioAtendimentos();
        this.showLoader(false);

        if (!container) return;
        if (!res.success) {
            this.showToast('Erro ao carregar o pátio', 'error');
            return;
        }
        if (res.data.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhum veículo no pátio no momento.</p>';
            return;
        }

        const statusInfo = {
            PATIO: { label: 'No Pátio', badge: 'status-patio' },
            LAVAGEM: { label: 'Em Lavagem', badge: 'status-lavagem' },
            ENTREGUE: { label: 'Concluído', badge: 'status-concluido' }
        };

        container.innerHTML = res.data.map(item => {
            const info = statusInfo[item.status] || statusInfo.PATIO;
            let acao = '';
            if (item.status === 'PATIO') {
                acao = `<button onclick="UI.iniciarLavagem('${item.id}')" class="btn btn-primary">🚿 Iniciar Lavagem</button>`;
            } else if (item.status === 'LAVAGEM') {
                acao = `<button onclick="UI.finalizarAtendimento('${item.id}')" class="btn btn-success">✅ Finalizar</button>`;
            }
            return `
            <div class="card">
                <div class="card-header">
                    <h3>${item.placa_snapshot || 'SEM PLACA'}</h3>
                    <span class="card-status ${info.badge}">${info.label}</span>
                </div>
                <div class="card-body">
                    <p><strong>Modelo:</strong> ${item.modelo_snapshot || '-'}</p>
                    <p><strong>Cliente:</strong> ${item.cliente_nome_snapshot || '-'}</p>
                    <p><strong>Tel:</strong> ${item.telefone_snapshot || '-'}</p>
                    <p><strong>Valor:</strong> R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</p>
                    ${item.observacoes ? `<p><strong>Obs:</strong> ${item.observacoes}</p>` : ''}
                </div>
                <div class="card-actions" style="display:flex; gap:8px; margin-top:10px; flex-wrap: wrap;">
                    <button onclick="UI.imprimirComprovante('${item.id}')" class="btn btn-secondary">🖨️ Imprimir</button>
                    ${acao}
                </div>
            </div>`;
        }).join('');
    },

    async iniciarLavagem(id) {
        this.showLoader(true);
        const res = await DB.iniciarLavagem(id);
        this.showLoader(false);
        if (res.success) {
            this.showToast('Lavagem iniciada!', 'success');
            this.loadPatio();
        } else {
            this.showToast('Erro ao iniciar lavagem', 'error');
        }
    },

    async finalizarAtendimento(id) {
        if (!confirm('Deseja finalizar este atendimento e dar saída ao veículo?')) return;
        this.showLoader(true);
        const res = await DB.concluirAtendimento(id);
        this.showLoader(false);
        if (res.success) {
            this.showToast('Atendimento finalizado com sucesso!', 'success');
            this.loadPatio();
        } else {
            this.showToast('Erro ao finalizar atendimento', 'error');
        }
    },

    imprimirComprovante(id) {
        window.print();
    },

    // ---------- Auto-preenchimento por placa (form OS e busca CRM) ----------
    async autoPreencherCliente(termo) {
        if (!termo || termo.trim().length < 3) return;

        // Se estivermos na aba CRM, filtra a lista em vez de preencher o form
        const crmVisible = document.getElementById('tab-crm')?.classList.contains('active');
        if (crmVisible) {
            this.loadCRM(termo);
            return;
        }

        const res = await DB.buscarPorPlaca(termo);
        if (res.success && res.data) {
            const modelo = document.getElementById('os-modelo');
            const cliente = document.getElementById('os-cliente');
            const telefone = document.getElementById('os-telefone');
            if (modelo && !modelo.value) modelo.value = res.data.modelo_snapshot || '';
            if (cliente && !cliente.value) cliente.value = res.data.cliente_nome_snapshot || '';
            if (telefone && !telefone.value) telefone.value = res.data.telefone_snapshot || '';
            if (res.data.cliente_nome_snapshot) this.showToast('Cliente encontrado no histórico!', 'info');
        }
    },

    // ---------- CRM ----------
    async loadCRM(termo = '') {
        const container = document.getElementById('crm-list');
        if (!container) return;
        this.showLoader(true);
        const res = await DB.getClientes();
        this.showLoader(false);

        let lista = res.data || [];
        if (termo) {
            const t = termo.toLowerCase();
            lista = lista.filter(c =>
                (c.nome || '').toLowerCase().includes(t) ||
                (c.telefone || '').toLowerCase().includes(t) ||
                (c.placa || '').toLowerCase().includes(t)
            );
        }

        if (lista.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhum cliente encontrado.</p>';
            return;
        }

        container.innerHTML = lista.map(c => `
            <div class="card">
                <h3>${c.nome || 'Sem nome'}</h3>
                <p><strong>Tel:</strong> ${c.telefone || '-'}</p>
                <p><strong>Placa:</strong> ${c.placa || '-'}</p>
            </div>
        `).join('');
    },

    // ---------- Relatórios ----------
    async loadRelatorios() {
        this.showLoader(true);
        const res = await DB.getRelatorioHoje();
        this.showLoader(false);

        const revenueEl = document.getElementById('stat-revenue');
        const completedEl = document.getElementById('stat-completed');
        if (revenueEl) revenueEl.textContent = `R$ ${res.data.faturamento.toFixed(2)}`;
        if (completedEl) completedEl.textContent = res.data.concluidos;
    },

    // ---------- Consultoria / Whitelabel ----------
    saveSettings() {
        const nome = document.getElementById('input-app-name')?.value.trim();
        if (!nome) {
            this.showToast('Informe um nome válido', 'error');
            return;
        }
        localStorage.setItem('whitelabel_nome', nome);
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-car-wash"></i> ${nome}`;
        document.title = nome;
        this.showToast('Configurações salvas!', 'success');
    },

    applyWhitelabel() {
        const nome = localStorage.getItem('whitelabel_nome');
        if (nome) {
            const titleEl = document.getElementById('app-title');
            if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-car-wash"></i> ${nome}`;
            document.title = nome;
            const input = document.getElementById('input-app-name');
            if (input) input.value = nome;
        }
    }
};
