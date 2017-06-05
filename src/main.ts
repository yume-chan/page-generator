import * as electron from "electron";
import { app, BrowserWindow, Menu, MenuItem } from "electron";
import * as windowStateKeeper from "electron-window-state";

import * as path from "path";
import * as url from "url";

const menu: Electron.MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [
            {
                label: "New",
                click() {
                    (win as Electron.BrowserWindow).webContents.executeJavaScript("menu.file.new()");
                }
            }, {
                label: "Open...",
                click() {
                    (win as Electron.BrowserWindow).webContents.executeJavaScript("menu.file.open()");
                }
            }, {
                label: "Save",
                click() {
                    (win as Electron.BrowserWindow).webContents.executeJavaScript("menu.file.save()");
                }
            },
            { type: "separator" },
            { role: "quit" }
        ]
    },
    { role: "reload" }
];

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: Electron.BrowserWindow | null;

function createWindow() {
    BrowserWindow.addDevToolsExtension("./react-dev-tools/");

    const mainWindowState = new windowStateKeeper();

    // Create the browser window.
    win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height
    });

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
    }));

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(win);
    
    // Open the DevTools.
    win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on("closed", () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
