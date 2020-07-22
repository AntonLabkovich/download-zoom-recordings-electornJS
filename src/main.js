const { app, BrowserWindow, net, ipcMain } = require('electron');
const conf = require('./config')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const { request, downloadFile } = require('./requestToZoom')
//const download = require('download')
const electronDl = require("electron-dl");

let GlobalData = {}

const payload = {
  iss: conf.APIKey,
  exp: ((new Date()).getTime() + 5000)
}

const token = jwt.sign(payload, conf.APISecret)


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable:false,
    fullscreen:false,
    fullscreenable:false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('get-data', async (e,data) => {
  GlobalData = await request(data.to, data.from, data.userId, token)
  const donwload = fs.readFileSync(`${__dirname}/assets/data/${data.userId}/download.json`, "utf8");
  const downloaded = fs.readFileSync(`${__dirname}/assets/data/${data.userId}/downloaded.json`, "utf8");
  e.sender.send('get-recordings',Object.assign(GlobalData,
                                                JSON.parse(donwload),
                                                JSON.parse(downloaded)))
})

ipcMain.on('download', async (e,payload)=>{
  e.sender.send('start-download',payload.id)
  const searchItem = GlobalData.meetings.find((item)=>item.id===+payload.id)
  fs.mkdirSync(`${__dirname}/assets/data/${payload.account}/${searchItem.topic}`)
  

  fs.readFile(`${__dirname}/assets/data/${payload.account}/download.json`, (err, data)=> {
    if(err)console.log(err);
    const json = JSON.parse(data);
    json.downloadFiels.push(searchItem.uuid);    
    fs.writeFile(`${__dirname}/assets/data/${payload.account}/download.json`, JSON.stringify(json), (err)=>{
      if (err) throw err;
    })
  })
  
  let count = 0
  const promises = searchItem.recording_files.map(async (item)=>
    await electronDl.download(BrowserWindow.getFocusedWindow(), `${item.download_url}?access_token=${token}`, {directory: `${__dirname}/assets/data/${payload.account}/${searchItem.topic}`})
  )
  console.log(promises)
  await Promise.all(promises).then((item)=>{console.log('finish')})
  console.log(promises)

  fs.readFile(`${__dirname}/assets/data/${payload.account}/download.json`, (err, data)=> {
    if(err)console.log(err)
    const json = JSON.parse(data)
    json.downloadFiels = json.downloadFiels.filter((item)=>item!==searchItem.uuid)
    fs.writeFileSync(`${__dirname}/assets/data/${payload.account}/download.json`, JSON.stringify(json), (err)=>{
      if (err) throw err
    })

    let ddf = fs.readFileSync(`${__dirname}/assets/data/${payload.account}/downloaded.json`,err=>{if(err) console.log(err)})
    ddf = JSON.parse(ddf)
    ddf.downloadedFiels.push(searchItem.uuid);

    fs.writeFileSync(`${__dirname}/assets/data/${payload.account}/downloaded.json`, JSON.stringify(ddf), (err)=>{
        if (err) throw err
    })
  })

  e.sender.send('finish-download',payload.id)
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
