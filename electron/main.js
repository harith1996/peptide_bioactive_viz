const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
let mainWindow;
function createWindow () {
  // const startUrl = process.env.ELECTRON_START_URL || url.format({
  //   pathname: path.join(__dirname, '../index.html'),
  //   protocol: 'file:',
  //   slashes: true,
  // });
  mainWindow = new BrowserWindow({ width: 800, height: 600 });
  // mainWindow.loadURL(startUrl);
  mainWindow.loadFile("../build/index.html");
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}
// app.on('ready', createWindow);
app.whenReady().then(createWindow);
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
