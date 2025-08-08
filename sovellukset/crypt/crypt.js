// Käärimme kaiken init-funktion sisään dynaamista latausta varten.
window.initializeCryptApp = async () => {
    
    // Ladataan asetukset ensin, jotta ne ovat heti käytössä
    let appSettings = await window.electronAPI.loadSettings();

    // --- Yleiset apufunktiot ---
    const showFeedback = (element, message, isError = false) => {
        element.value = message;
        element.style.borderColor = isError ? 'var(--crypt-error-color)' : 'var(--crypt-success-color)';
    };
    
    const resetButtonState = (button, originalText) => {
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        }, 1000);
    };

    // --- SALAUS-SIVUN LOGIIKKA ---
    if (document.getElementById('encrypt-button')) {
        const encryptBtn = document.getElementById('encrypt-button');
        const inputEl = document.getElementById('encrypt-input');
        const passwordEl = document.getElementById('encrypt-password');
        const outputEl = document.getElementById('encrypt-output');
        const copyBtn = document.getElementById('copy-output-btn');
        
        // Aseta oletusalgoritmi
        document.getElementById('encrypt-algorithm').value = appSettings.defaultAlgo || 'aes-256-gcm';

        encryptBtn.addEventListener('click', async () => {
            const originalBtnText = encryptBtn.innerHTML;
            encryptBtn.disabled = true;
            encryptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salataan...';
            
            const text = inputEl.value;
            const password = passwordEl.value;

            if (!text || !password) {
                showFeedback(outputEl, 'Virhe: Teksti ja salasana vaaditaan.', true);
                resetButtonState(encryptBtn, originalBtnText);
                return;
            }

            const result = await window.electronAPI.encrypt({ text, password });

            if (result.success) {
                showFeedback(outputEl, result.data, false);
                if (appSettings.autoCopy) {
                    navigator.clipboard.writeText(result.data);
                }
                if (appSettings.clearFields) {
                    inputEl.value = '';
                    passwordEl.value = '';
                }
            } else {
                showFeedback(outputEl, `Virhe: ${result.error}`, true);
            }
            resetButtonState(encryptBtn, originalBtnText);
        });

        copyBtn.addEventListener('click', () => {
            if (outputEl.value) {
                navigator.clipboard.writeText(outputEl.value);
                // Voisit lisätä pienen "Kopioitu!"-ilmoituksen
            }
        });
    }


    // --- PURKU-SIVUN LOGIIKKA ---
    if (document.getElementById('decrypt-button')) {
        const decryptBtn = document.getElementById('decrypt-button');
        const inputEl = document.getElementById('decrypt-input');
        const passwordEl = document.getElementById('decrypt-password');
        const outputEl = document.getElementById('decrypt-output');
        const copyBtn = document.getElementById('copy-decrypted-btn');

        document.getElementById('decrypt-algorithm').value = appSettings.defaultAlgo || 'aes-256-gcm';

        decryptBtn.addEventListener('click', async () => {
            const originalBtnText = decryptBtn.innerHTML;
            decryptBtn.disabled = true;
            decryptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Puretaan...';

            const encryptedData = inputEl.value;
            const password = passwordEl.value;

            if (!encryptedData || !password) {
                showFeedback(outputEl, 'Virhe: Salattu data ja salasana vaaditaan.', true);
                resetButtonState(decryptBtn, originalBtnText);
                return;
            }

            const result = await window.electronAPI.decrypt({ encryptedData, password });

            if (result.success) {
                showFeedback(outputEl, result.data, false);
            } else {
                showFeedback(outputEl, `Virhe: ${result.error}`, true);
            }
            resetButtonState(decryptBtn, originalBtnText);
        });
        
        copyBtn.addEventListener('click', () => {
            if (outputEl.value) {
                navigator.clipboard.writeText(outputEl.value);
            }
        });
    }


    // --- ASETUS-SIVUN LOGIIKKA ---
    if (document.getElementById('save-settings-btn')) {
        const saveBtn = document.getElementById('save-settings-btn');
        // Hae kaikki asetus-elementit
        const defaultAlgoEl = document.getElementById('setting-default-algo');
        const outputFormatEl = document.getElementById('setting-output-format');
        const autoCopyEl = document.getElementById('setting-auto-copy');
        const clearFieldsEl = document.getElementById('setting-clear-fields');

        // Aseta tallennetut arvot kenttiin
        defaultAlgoEl.value = appSettings.defaultAlgo;
        outputFormatEl.value = appSettings.outputFormat;
        autoCopyEl.checked = appSettings.autoCopy;
        clearFieldsEl.checked = appSettings.clearFields;

        saveBtn.addEventListener('click', async () => {
            const newSettings = {
                defaultAlgo: defaultAlgoEl.value,
                outputFormat: outputFormatEl.value,
                autoCopy: autoCopyEl.checked,
                clearFields: clearFieldsEl.checked,
            };

            const originalBtnText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tallennetaan...';

            const result = await window.electronAPI.saveSettings(newSettings);

            if (result.success) {
                appSettings = newSettings; // Päivitä lokaali kopio
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Tallennettu!';
            } else {
                saveBtn.innerHTML = 'Tallennus epäonnistui';
            }
            resetButtonState(saveBtn, originalBtnText);
        });
    }
};