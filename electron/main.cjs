// Oseki BJJ · Painel (Windows). Abre o painel da academia numa janela própria.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

function criarJanela() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#121A24',
    title: 'Oseki BJJ · Painel',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'dist-desktop', 'index.html'));
  // Links externos (WhatsApp, YouTube…) abrem no navegador
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(criarJanela);
app.on('window-all-closed', () => app.quit());
