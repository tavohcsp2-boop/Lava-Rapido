/* ==========================================================================
   INTERFAZE DE USUÁRIO E MANIPULAÇÃO DO DOM
   ========================================================================== */

const UI = {
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        const activeBtn = document.querySelector(`button[onclick*="'${tabId}'"]`);
        const activeTab = document.getElementById(`tab-${tabId}`);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeTab) activeTab.classList.add('active');

        if (tabId === 'patio') this.loadPatio();
        if (tabId === 'crm') this.loadCRM();
    },

    async loadPatio() {
        this.showLoader(true);
        const patioGrid = document.getElementById('patio-grid');
        patioGrid.innerHTML = '';

        const atendimentos = await DB.getPatioAtendimentos();
        this.showLoader(false);

        if (atendimentos.length === 0) {
            patioGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#777;">Nenhum veículo no pátio no momento.</p>';
            return;
        }

        atendimentos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            let statusClass = 'status-patio';
            if (item.status === 'LAVANDO') statusClass = 'status-lavagem';
            if (item.status === 'CONCLUIDO') statusClass = 'status-concluido';

            card.innerHTML = `
                <span class="card-status ${statusClass}">${item.status}</span>
                <h3><i class="fa-solid fa-car"></i> ${item.placa_snapshot} - ${item.modelo_snapshot || 'Sem modelo'}</h3>
                <p><strong>Cliente:</strong> ${item.cliente_nome_snapshot || 'Não informado'}</p>
                <p><strong>Valor:</strong> R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</p>
                <p style="font-size:0.8rem; color:#666; margin-top:5px;">${new Date(item.entrada_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <div style="margin-top:12px; display:flex; gap:5px;">
                    ${item.status === 'PATIO' ? `<button class="btn btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="UI.alterarStatus('${item.id}', 'LAVANDO')">Iniciar Lavagem</button>` : ''}
                    ${item.status === 'LAVANDO' ? `<button class="btn btn-success" style="padding:4px 8px; font-size:0.8rem;" onclick="UI.alterarStatus('${item.id}', 'CONCLUIDO')">Concluir</button>` : ''}
                    ${item.status === 'CONCLUIDO' ? `<button class="btn btn-secondary" style="padding:4px 8px; font-size:0.8rem;" onclick="UI.alterarStatus('${item.id}', 'ENTREGUE')">Entregar</button>` : ''}
                </div>
            `;
            patioGrid.appendChild(card);
        });
    },

    async alterarStatus(id, novoStatus) {
        this.showLoader(true);
        const res = await DB.updateStatusAtendimento(id, novoStatus);
        this.showLoader(false);
        if (res.success) {
            this.showToast('Status atualizado!', 'success');
            this.loadPatio();
        } else {
            this.showToast('Erro ao alterar status.', 'error');
        }
    },

    async loadCRM() {
        const crmList = document.getElementById('crm-list');
        crmList.innerHTML = '';
        const clientes = await DB.getClientes();

        if (clientes.length === 0) {
            crmList.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#777;">Nenhum cliente cadastrado.</p>';
            return;
        }

        clientes.forEach(c => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fa-solid fa-user"></i> ${c.nome}</h3>
                <p><strong>Telefone:</strong> ${c.telefone || 'Não informado'}</p>
                <p><strong>Pontos Fidelidade:</strong> ${c.fidelidade_pontos || 0}</p>
            `;
            crmList.appendChild(card);
        });
    },

    showNovoAtendimentoModal(show) {
        document.getElementById('modal-atendimento').style.display = show ? 'flex' : 'none';
    },

    showLoginModal() {
        document.getElementById('modal-login').style.display = 'flex';
    },

    hideLoginModal() {
        document.getElementById('modal-login').style.display = 'none';
    },

    updateUserDisplay(email) {
        document.getElementById('current-user-name').innerText = email;
    },

    showLoader(show) {
        document.getElementById('global-loader').style.display = show ? 'flex' : 'none';
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    autoPreencherCliente(query) {
        // Reservado para integração de auto-complete
    },

    saveSettings() {
        const appName = document.getElementById('input-app-name').value;
        document.getElementById('app-title').innerHTML = `<i class="fa-solid fa-car-wash"></i> ${appName}`;
        this.showToast('Configurações salvas!', 'success');
    }
};