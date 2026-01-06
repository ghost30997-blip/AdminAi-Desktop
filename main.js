const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Slidex - Mala Direta Profissional",
    icon: path.join(__dirname, 'public', 'icon.ico'),
    backgroundColor: '#172B4D',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Essencial para carregar bibliotecas externas (esm.sh) junto com arquivos locais
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    autoHideMenuBar: true
  });

  // Abre ferramentas de desenvolvedor se o app falhar ao carregar o conteúdo React
  win.webContents.on('did-fail-load', () => {
    win.webContents.openDevTools();
  });

  // Carrega o index.html usando caminho absoluto resiliente
  win.loadFile(path.join(__dirname, 'index.html'));

  // Garante que links externos (Google Drive, etc) abram no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Singleton: Evita abrir o app várias vezes no Windows
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});