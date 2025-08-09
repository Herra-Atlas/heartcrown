function initializeSettings() {
    // Haetaan viittaukset kaikkiin HTML-elementteihin
    const themeSelect = document.getElementById('theme-select');
    const languageSelect = document.getElementById('language-select');
    const startupToggle = document.getElementById('startup-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const clearCacheButton = document.getElementById('clear-cache-button');
    const resetSettingsButton = document.getElementById('reset-settings-button');
    const statusMessage = document.getElementById('status-message');

    // UUDET: Päivityselementit
    const checkUpdateButton = document.getElementById('check-update-button');
    const updateStatusMessage = document.getElementById('update-status-message');

    if (!themeSelect || !checkUpdateButton) {
        console.error('Asetusten elementtejä ei löytynyt DOM:sta.');
        return;
    }

    const controls = [themeSelect, languageSelect, startupToggle, notificationsToggle];

    async function loadSettings() {
        const settings = await window.electronAPI.loadSettings() || {};
        themeSelect.value = settings.theme || 'dark';
        languageSelect.value = settings.language || 'fi';
        startupToggle.checked = settings.launchOnStartup || false;
        notificationsToggle.checked = settings.showUpdateNotifications || true;
    }

    async function saveSettings() {
        const settings = {
            theme: themeSelect.value,
            language: languageSelect.value,
            launchOnStartup: startupToggle.checked,
            showUpdateNotifications: notificationsToggle.checked,
        };
        await window.electronAPI.saveSettings(settings);
        statusMessage.textContent = 'Asetukset tallennettu!';
        statusMessage.style.opacity = 1;
        setTimeout(() => { statusMessage.style.opacity = 0; }, 2000);
    }

    controls.forEach(control => control.addEventListener('change', saveSettings));

    clearCacheButton.addEventListener('click', async () => { /* ... kuten ennenkin ... */ });
    resetSettingsButton.addEventListener('click', async () => { /* ... kuten ennenkin ... */ });

    // --- UUSI LOGIIKKA PÄIVITYSNAPILLE ---
    checkUpdateButton.addEventListener('click', () => {
        updateStatusMessage.textContent = 'Tarkistetaan päivityksiä...';
        updateStatusMessage.className = 'update-status';
        checkUpdateButton.disabled = true;
        window.electronAPI.checkForUpdates();
    });

    window.electronAPI.onUpdateStatus((status, message) => {
        switch(status) {
            case 'not-available':
                updateStatusMessage.textContent = 'Sovellus on ajan tasalla.';
                updateStatusMessage.className = 'update-status success';
                checkUpdateButton.disabled = false;
                break;
            case 'error':
                updateStatusMessage.textContent = `Virhe: ${message}`;
                updateStatusMessage.className = 'update-status error';
                checkUpdateButton.disabled = false;
                break;
            case 'downloaded':
                // Itse dialogi tulee main-prosessista, joten tähän ei tarvitse lisätä enempää.
                updateStatusMessage.textContent = 'Päivitys ladattu! Asennus alkaa uudelleenkäynnistyksen jälkeen.';
                updateStatusMessage.className = 'update-status success';
                checkUpdateButton.disabled = false;
                break;
            case 'downloading':
                 updateStatusMessage.textContent = `Ladataan päivitystä... ${Math.round(message)}%`;
                 updateStatusMessage.className = 'update-status';
                 break;
        }
    });

    loadSettings();
}