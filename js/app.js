/* ==========================================================================
   INTERFACE DO USUÁRIO (UI) E NAVEGAÇÃO
   ========================================================================== */

const SENHA_ADMIN = "1234"; // 🔒 Sua senha para acessar Configurações e Relatórios

const UI = {
    // Exibe ou esconde o indicador de carregamento
    showLoader(show) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    },

    // Exibe mensagens de aviso (Toast)
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Controla a exibição do Modal de Nova Entrada
    showNovoAtendimentoModal(show) {
        const modal = document.getElementById('modal-novo-atendimento');
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    },

    // Alterna entre as telas/abas do sistema com proteção por senha
    navegarPara(nomeAba) {
        const abasProtegidas = ['configuracoes', 'financeiro', 'relatorios'];

        // Se a aba for protegida, pede a senha
        if (abasProtegidas.includes(nomeAba)) {
            const pin = prompt("🔒 Área Restrita! Digite a senha administrativa:");
            if (pin !== SENHA_ADMIN) {
                this.showToast("❌ Senha incorreta! Acesso negado.", "error");
                return;
            }
        }

        // Esconde todas as seções
        document.querySelectorAll('.secao-app').forEach(secao => {
            secao.style.display = 'none';
        });

        // Mostra a seção desejada
        const abaAlvo = document.getElementById(`aba-${nomeAba}`) || document.getElementById(nomeAba);
        if (abaAlvo) {
            abaAlvo.style.display = 'block';
        }

        // Atualiza os botões ativos no menu
        document.querySelectorAll('.btn-nav').forEach(btn => {
            btn.classList.remove('active');
        });
        const btnAtivo = document.querySelector(`[data-aba="${nomeAba}"]`);
        if (btnAtivo) btnAtivo.classList.add('active');
    },

    // Carrega os veículos no Pátio
    async loadPatio() {
        this.showLoader(true);
        const container = document.getElementById('patio-container');
        if (!container) {
            this.showLoader(false);
            return;
        }

        const res = await DB.getAtendimentosPatio();
        this.showLoader(false);

        if (!res.success) {
            this.showToast('Erro ao carregar o pátio', 'error');
            return;
        }

        if (res.data.length === 0) {
            container.innerHTML = '<p class="sem-dados">Nenhum veículo no pátio no momento.</p>';
            return;
        }

        container.innerHTML = res.data.map(item => `
            <div class="card-veiculo">
                <div class="card-header">
                    <h3>${item.placa_snapshot || 'SEM PLACA'}</h3>
                    <span class="badge badge-patio">No Pátio</span>
                </div>
                <div class="card-body">
                    <p><strong>Modelo:</strong> ${item.modelo_snapshot || '-'}</p>
                    <p><strong>Cliente:</strong> ${item.cliente_nome_snapshot || '-'}</p>
                    <p><strong>Tel:</strong> ${item.telefone_snapshot || '-'}</p>
                    <p><strong>Valor:</strong> R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</p>
                    ${item.observacoes ? `<p><strong>Obs:</strong> ${item.observacoes}</p>` : ''}
                </div>
                <div class="card-actions">
                    <button onclick="UI.imprimirComprovante('${item.id}')" class="btn btn-secondary">🖨️ Imprimir</button>
                    <button onclick="UI.finalizarAtendimento('${item.id}')" class="btn btn-success">✅ Finalizar</button>
                </div>
            </div>
        `).join('');
    },

    // Finalizar atendimento
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

    // Imprimir comprovante de entrada/serviço
    imprimirComprovante(id) {
        window.print();
    }
};
