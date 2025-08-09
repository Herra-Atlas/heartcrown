const { app, BrowserWindow, autoUpdater, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const log = require('electron-log');

// --- Globaalit muuttujat ikkunoille ---
let mainWindow;
let loadingWindow;

// --- Sivupalkin ja datan polut ---
function getHeaderHTML() {
  const headerPath = path.join(__dirname, 'includes', 'header.html');
  try { return fsSync.readFileSync(headerPath, 'utf8'); }
  catch (err) { return '<div style="color:red">Sidebar failed to load: ' + err.message + '</div>'; }
}
const dataPath = path.join(app.getPath('userData'), 'muistot.json');
const settingsPath = path.join(app.getPath('userData'), 'crypt-settings.json');

// --- Ikkunoiden luontifunktiot ---
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({ width: 400, height: 200, frame: false, center: true, movable: true, resizable: false, icon: path.join(__dirname, 'includes', 'img', 'logo.png') });
  loadingWindow.loadFile('loading.html');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({ width: 1200, height: 800, show: false, icon: path.join(__dirname, 'includes', 'img', 'logo.png'), webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  // mainWindow.removeMenu();
  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    if (loadingWindow) { loadingWindow.destroy(); }
    mainWindow.show();
  });
}

// --- SOVELLUKSEN PÄÄLOGIIKKA ---
app.whenReady().then(() => {
  createLoadingWindow();
  createMainWindow();

  // ==========================================================
  // LOPULLINEN JA OIKEA PÄIVITYSLOGIIKKA
  // ==========================================================
  log.transports.file.level = "info";
  autoUpdater.logger = log;

  autoUpdater.on('checking-for-update', () => { log.info('Tarkistetaan päivityksiä...'); });
  autoUpdater.on('update-available', (info) => { log.info('Päivitys saatavilla!', info); });
  autoUpdater.on('update-not-available', (info) => { log.info('Ei uusia päivityksiä saatavilla.', info); });
  autoUpdater.on('error', (err) => { log.error('Päivityksessä virhe: ' + err); });
  autoUpdater.on('download-progress', (progressObj) => {
      let log_message = `Ladattu ${Math.round(progressObj.percent)}% (${Math.round(progressObj.transferred/1024/1024)}MB / ${Math.round(progressObj.total/1024/1024)}MB)`;
      log.info(log_message);
  });
  autoUpdater.on('update-downloaded', (info) => {
      log.info('Päivitys ladattu onnistuneesti.', info);
      const dialogOpts = { type: 'info', buttons: ['Käynnistä uudelleen', 'Myöhemmin'], title: 'Sovelluksen päivitys', message: `Uusi versio ${info.version} on ladattu.`, detail: 'Käynnistä sovellus uudelleen nyt ottaaksesi päivitykset käyttöön.' };
      dialog.showMessageBox(dialogOpts).then((returnValue) => {
          if (returnValue.response === 0) autoUpdater.quitAndInstall();
      });
  });

  // TÄRKEÄÄ: Tarkistetaan päivitykset vasta, kun KAIKKI kuuntelijat on asetettu.
  autoUpdater.checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
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
// IPC Asetusten lataus
ipcMain.handle('settings-load', async () => {
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
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
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

// IPC Salaus
ipcMain.handle('crypto-encrypt', async (event, { text, password }) => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
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
        const salt = dataBuffer.slice(0, SALT_LENGTH);
        const iv = dataBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = dataBuffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = dataBuffer.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
        const key = crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        return { success: true, data: decrypted };
    } catch (error) {
        console.error('Purkuvirhe:', error);
        if (error.message.includes('bad auth tag')) {
            return { success: false, error: 'Purku epäonnistui. Tarkista salasana tai salattu data.' };
        }
        return { success: false, error: error.message };
    }
});