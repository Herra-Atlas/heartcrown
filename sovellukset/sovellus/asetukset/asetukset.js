// --- START OF FILE asetukset.js ---

function initializeSettings() {
    // Haetaan viittaukset kaikkiin HTML-elementteihin
    const themeSelect = document.getElementById('theme-select');
    const languageSelect = document.getElementById('language-select');
    const startupToggle = document.getElementById('startup-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const clearCacheButton = document.getElementById('clear-cache-button');
    const resetSettingsButton = document.getElementById('reset-settings-button');
    const statusMessage = document.getElementById('status-message');

    // Varmistetaan, että elementit löytyivät ennen kuin jatketaan
    if (!themeSelect || !clearCacheButton) {
        console.error('Asetusten elementtejä ei löytynyt DOM:sta. Varmista, että HTML on ladattu.');
        return;
    }

    const controls = [themeSelect, languageSelect, startupToggle, notificationsToggle];

    // Funktio, joka lataa asetukset ja asettaa ne kenttiin
    async function loadSettings() {
        // Käytetään olemassaolevaa API-kutsua
        const settings = await window.electronAPI.loadSettings() || {};

        themeSelect.value = settings.theme || 'dark';
        languageSelect.value = settings.language || 'fi';
        startupToggle.checked = settings.launchOnStartup || false;
        notificationsToggle.checked = settings.showUpdateNotifications || true;
    }

    // Funktio, joka kerää ja tallentaa asetukset
    async function saveSettings() {
        const settings = {
            theme: themeSelect.value,
            language: languageSelect.value,
            launchOnStartup: startupToggle.checked,
            showUpdateNotifications: notificationsToggle.checked,
        };
        
        await window.electronAPI.saveSettings(settings);
        
        // Näytä tallennusvahvistus
        statusMessage.textContent = 'Asetukset tallennettu!';
        statusMessage.style.opacity = 1;
        setTimeout(() => {
            statusMessage.style.opacity = 0;
        }, 2000);
    }

    // Lisätään tapahtumankäsittelijät kaikkiin valintoihin
    controls.forEach(control => {
        control.addEventListener('change', saveSettings);
    });

    // Nappien tapahtumankäsittelijät
    clearCacheButton.addEventListener('click', async () => {
        if (confirm('Haluatko varmasti tyhjentää sovelluksen välimuistin? Tämä voi ratkaista joitakin näyttöongelmia.')) {
            await window.electronAPI.clearAppCache(); 
            alert('Sovelluksen välimuisti on tyhjennetty! Käynnistä sovellus uudelleen, jotta muutos tulee täysin voimaan.');
        }
    });

    resetSettingsButton.addEventListener('click', async () => {
        if (confirm('Haluatko varmasti palauttaa kaikki asetukset oletusarvoihin? Tämä toiminto on peruuttamaton.')) {
            await window.electronAPI.resetAppSettings();
            await loadSettings(); // Ladataan oletusasetukset näkyviin
            alert('Kaikki asetukset on palautettu oletusarvoihin.');
        }
    });

    // Ladataan asetukset, kun tämä funktio suoritetaan
    loadSettings();
}