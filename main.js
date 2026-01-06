
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: "Slidex - Mala Direta Profissional",
    backgroundColor: '#172B4D',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Essencial para carregar recursos da pasta dist via file://
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    autoHideMenuBar: true
  });

  // Em desenvolvimento, carrega do localhost do Vite
  // Em produção (Vercel/Instalado), carrega o arquivo index.html da pasta dist
  const isDev = !app.isPackaged;
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Carrega o arquivo transpilado final
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Garante que links externos (Google Drive, etc) abram no navegador padrão
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

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
