"use strict";
/// <reference path="./electron-window-state.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("path");
const url = require("url");
const menu = [
    {
        label: "File",
        submenu: [
            {
                label: "New",
                click() {
                    win.webContents.executeJavaScript("menu.file.new()");
                }
            }, {
                label: "Open...",
                click() {
                    win.webContents.executeJavaScript("menu.file.open()");
                }
            }, {
                label: "Save",
                click() {
                    win.webContents.executeJavaScript("menu.file.save()");
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
let win;
function createWindow() {
    const mainWindowState = new windowStateKeeper();
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height
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
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(menu));
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on("ready", createWindow);
// Quit when all windows are closed.
electron_1.app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    // On macOS it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});
//# sourceMappingURL=main.js.map