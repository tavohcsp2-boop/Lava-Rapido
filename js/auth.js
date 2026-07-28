/* ==========================================================================
   MÓDULO DE AUTENTICAÇÃO E SESSÃO DE USUÁRIO
   ========================================================================== */

const Auth = {
    currentUser: null,

    async init() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            UI.updateUserDisplay(session.user.email);
            UI.hideLoginModal();
            UI.loadPatio();
        } else {
            UI.showLoginModal();
        }

        // Listener de mudanças no estado de autenticação
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session) {
                this.currentUser = session.user;
                UI.updateUserDisplay(session.user.email);
                UI.hideLoginModal();
                UI.loadPatio();
            } else {
                this.currentUser = null;
                UI.showLoginModal();
            }
        });
    },

    async login(email, password) {
        UI.showLoader(true);
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            UI.showToast('Login realizado com sucesso!', 'success');
            return { success: true, data };
        } catch (err) {
            UI.showToast('Erro ao entrar: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            UI.showLoader(false);
        }
    },

    async logout() {
        await supabaseClient.auth.signOut();
        UI.showToast('Sessão encerrada.', 'info');
        UI.showLoginModal();
    }
};