const { app, BrowserWindow, autoUpdater, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // Sidebarin synkroninen luku

// Sivupalkin HTML:n polku
function getHeaderHTML() {
  const headerPath = path.join(__dirname, 'includes', 'header.html');
  try {
    return fsSync.readFileSync(headerPath, 'utf8');
  } catch (err) {
    return '<div style="color:red">Sidebar failed to load: ' + err.message + '</div>';
  }
}

// Muistioiden JSON-tiedoston polku
const dataPath = path.join(app.getPath('userData'), 'muistot.json');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // --- LISÄTTY OSUUS ALKAA ---
    icon: path.join(__dirname, 'includes', 'img', 'logo.png'), // Lisätty sovelluksen ikoni
    // --- LISÄTTY OSUUS PÄÄTTYY ---
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // mainWindow.removeMenu();
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  
autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Käynnistä uudelleen', 'Myöhemmin'],
    title: 'Sovelluksen päivitys',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'Uusi versio on ladattu. Käynnistä sovellus uudelleen ottaaksesi päivitykset käyttöön.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', message => {
  console.error('Päivityksessä tapahtui virhe');
  console.error(message);
});

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC sidebarille
ipcMain.handle('get-header-html', () => getHeaderHTML());

// IPC muistioiden lataus
ipcMain.handle('load-notes', async () => {
  try {
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error("Virhe muistioiden lukemisessa:", error);
    return [];
  }
});

// IPC muistioiden tallennus
ipcMain.handle('save-notes', async (event, notes) => {
  try {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify(notes, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error("Virhe muistioiden tallentamisessa:", error);
    return { success: false, error: error.message };
  }
});

// UUSI: IPC-kuvan valinta
ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Valitse kuva',
    properties: ['openFile'],
    filters: [{ name: 'Kuvat', extensions: ['jpg', 'png', 'gif', 'jpeg', 'webp'] }],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  } else {
    return filePaths[0];
  }
});

const crypto = require('crypto');

// --- Asetusten hallinta ---
const settingsPath = path.join(app.getPath('userData'), 'crypt-settings.json');

// IPC Asetusten lataus
ipcMain.handle('settings-load', async () => {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Jos tiedostoa ei ole, palautetaan oletusasetukset
    if (error.code === 'ENOENT') {
      return {
        defaultAlgo: 'aes-256-gcm',
        outputFormat: 'base64',
        autoCopy: true,
        clearFields: false,
      };
    }
    console.error("Asetusten lukuvirhe:", error);
    return {};
  }
});

// IPC Asetusten tallennus
ipcMain.handle('settings-save', async (event, settings) => {
  try {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error("Asetusten tallennusvirhe:", error);
    return { success: false, error: error.message };
  }
});


// --- Kryptografia ---

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES GCM suosittelee 12, mutta 16 on myös yleinen
const SALT_LENGTH = 64;
const KEY_LENGTH = 32; // 256 bittiä
const AUTH_TAG_LENGTH = 16;

// IPC Salaus
ipcMain.handle('crypto-encrypt', async (event, { text, password }) => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Muodostetaan avain salasanasta ja saltista (erittäin tärkeä vaihe!)
    const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Yhdistetään kaikki osat yhteen: salt + iv + authTag + salattu data
    const encryptedData = Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
    
    return { success: true, data: encryptedData };
  } catch (error) {
    console.error('Salausvirhe:', error);
    return { success: false, error: error.message };
  }
});

// IPC Purku
ipcMain.handle('crypto-decrypt', async (event, { encryptedData, password }) => {
    try {
        const dataBuffer = Buffer.from(encryptedData, 'base64');

        // puretaan osat bufferista
        const salt = dataBuffer.slice(0, SALT_LENGTH);
        const iv = dataBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = dataBuffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = dataBuffer.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

        // Muodostetaan avain täsmälleen samoilla parametreilla
        const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');

        return { success: true, data: decrypted };
    } catch (error) {
        console.error('Purkuvirhe:', error);
        // Yleisin virhe on väärä salasana, joka aiheuttaa "Unsupported state" tai "bad auth tag" virheen.
        if (error.message.includes('bad auth tag')) {
            return { success: false, error: 'Purku epäonnistui. Tarkista salasana tai salattu data.' };
        }
        return { success: false, error: error.message };
    }
});
