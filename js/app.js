/* ==========================================================================
   INICIALIZAÇÃO DO APLICATIVO E EVENTOS (BOOTSTRAP & PWA)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Aplica personalização whitelabel salva localmente
    UI.applyWhitelabel();

    // 1. Inicializar Autenticação
    Auth.init();

    // 2. Evento do Formulário de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await Auth.login(email, password);
        });
    }

    // 3. Evento do Formulário de Nova Entrada (OS)
    const formAtendimento = document.getElementById('form-novo-atendimento');
    if (formAtendimento) {
        formAtendimento.addEventListener('submit', async (e) => {
            e.preventDefault();
            UI.showLoader(true);

            const novoItem = {
                placa_snapshot: document.getElementById('os-placa').value.toUpperCase(),
                modelo_snapshot: document.getElementById('os-modelo').value,
                cliente_nome_snapshot: document.getElementById('os-cliente').value,
                telefone_snapshot: document.getElementById('os-telefone').value,
                valor_total: parseFloat(document.getElementById('os-valor').value) || 0,
                observacoes: document.getElementById('os-obs').value,
                status: 'PATIO'
            };

            const res = await DB.createAtendimento(novoItem);
            UI.showLoader(false);

            if (res.success) {
                UI.showToast('Atendimento cadastrado com sucesso!', 'success');
                UI.showNovoAtendimentoModal(false);
                formAtendimento.reset();
                UI.loadPatio();
            } else {
                UI.showToast('Erro ao salvar: ' + res.error, 'error');
            }
        });
    }

    // 4. Botão de gravação de voz (IA)
    const btnRecordVoice = document.getElementById('btn-record-voice');
    if (btnRecordVoice) {
        btnRecordVoice.addEventListener('click', () => Voice.toggleRecording());
    }

    // 5. Registro do Service Worker para suporte a PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[PWA] Service Worker registrado com sucesso:', reg.scope))
                .catch((err) => console.error('[PWA] Falha ao registrar Service Worker:', err));
        });
    }
});
