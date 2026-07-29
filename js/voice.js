/* ==========================================================================
   ENTRADA POR VOZ (IA) - Transcrição via Groq Whisper
   ========================================================================== */

const Voice = {
    mediaRecorder: null,
    chunks: [],
    isRecording: false,

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    },

    async startRecording() {
        const btn = document.getElementById('btn-record-voice');
        const transcriptEl = document.getElementById('voice-transcript');

        if (!GROQ_API_KEY || GROQ_API_KEY.includes('COLE_SUA')) {
            UI.showToast('Configure sua GROQ_API_KEY em config.js antes de gravar.', 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.chunks = [];
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (e) => this.chunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                this.processAudio();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            if (btn) btn.innerHTML = '<i class="fa-solid fa-stop"></i> Parar Gravação';
            if (transcriptEl) transcriptEl.textContent = '🎙️ Gravando... fale a placa, modelo, telefone e serviço.';
        } catch (err) {
            console.error('Erro ao acessar microfone:', err);
            UI.showToast('Não foi possível acessar o microfone.', 'error');
        }
    },

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            const btn = document.getElementById('btn-record-voice');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Iniciar Gravação';
        }
    },

    async processAudio() {
        const transcriptEl = document.getElementById('voice-transcript');
        if (transcriptEl) transcriptEl.textContent = '⏳ Transcrevendo áudio...';
        UI.showLoader(true);

        try {
            const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'gravacao.webm');
            formData.append('model', 'whisper-large-v3');
            formData.append('language', 'pt');

            const response = await fetch(GROQ_TRANSCRIPTION_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText);
            }

            const data = await response.json();
            const texto = data.text || '';

            if (transcriptEl) transcriptEl.textContent = `📝 "${texto}"`;
            this.parseAndFillVoiceData(texto);
        } catch (err) {
            console.error('Erro na transcrição:', err);
            UI.showToast('Erro ao transcrever áudio. Confira a GROQ_API_KEY.', 'error');
            if (transcriptEl) transcriptEl.textContent = '❌ Falha na transcrição.';
        } finally {
            UI.showLoader(false);
        }
    },

    // Extrai placa, telefone, modelo e serviço do texto transcrito e
    // abre o formulário de Nova Entrada já preenchido para conferência.
    parseAndFillVoiceData(texto) {
        const original = texto;
        const upper = texto.toUpperCase();

        // Placa: padrão antigo (ABC1234) ou Mercosul (ABC1D23), com ou sem hífen/espaço
        const placaMatch = upper.match(/\b([A-Z]{3}[\s-]?\d[A-Z0-9][\s-]?\d{2,3})\b/);
        const placa = placaMatch ? placaMatch[1].replace(/[\s-]/g, '') : '';

        // Telefone: 10 ou 11 dígitos, com ou sem formatação
        const telefoneMatch = original.match(/(\(?\d{2}\)?\s?)?\d{4,5}[\s-]?\d{4}/);
        const telefone = telefoneMatch ? telefoneMatch[0] : '';

        // Nome do cliente: tenta capturar o que vem após "cliente" ou "nome"
        const clienteMatch = original.match(/(?:cliente|nome)[:\s]+([A-Za-zÀ-ÿ\s]{3,40}?)(?:,|\.|telefone|placa|serviço|$)/i);
        const cliente = clienteMatch ? clienteMatch[1].trim() : '';

        // Modelo do veículo: tenta capturar o que vem após "modelo" ou "carro"
        const modeloMatch = original.match(/(?:modelo|carro|veículo)[:\s]+([A-Za-zÀ-ÿ0-9\s]{3,40}?)(?:,|\.|telefone|placa|cliente|serviço|$)/i);
        const modelo = modeloMatch ? modeloMatch[1].trim() : '';

        // Serviço/observação: tenta capturar o que vem após "serviço"
        const servicoMatch = original.match(/serviço[:\s]+([A-Za-zÀ-ÿ0-9\s]{3,60})/i);
        const servico = servicoMatch ? servicoMatch[1].trim() : '';

        if (!placa && !telefone && !cliente && !modelo) {
            UI.showToast('Não consegui identificar os dados. Preencha manualmente.', 'error');
        } else {
            UI.showToast('Dados preenchidos! Confira antes de cadastrar.', 'success');
        }

        UI.showNovoAtendimentoModal(true);
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        setVal('os-placa', placa);
        setVal('os-telefone', telefone);
        setVal('os-cliente', cliente);
        setVal('os-modelo', modelo);
        setVal('os-obs', servico);
    }
};
