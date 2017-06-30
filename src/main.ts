import electron from "electron";
import { app, BrowserWindow, Menu, MenuItem } from "electron";
import windowStateKeeper from "electron-window-state";

import path from "path";
import url from "url";

/*
 * Keep a global reference of the window object, if you don"t, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 */
let win: Electron.BrowserWindow | null;

function createWindow() {
    // BrowserWindow.addDevToolsExtension("./react-dev-tools/");

    const mainWindowState = new windowStateKeeper();

    // Create the browser window.
    win = new BrowserWindow({
        height: mainWindowState.height,
        width: mainWindowState.width,
        x: mainWindowState.x,
        y: mainWindowState.y,
    });

    if (process.argv.includes("--devTools")) {
        // Open the DevTools.
        win.webContents.openDevTools();
    }

    if (process.env.NODE_ENV === "production") {
        win.loadURL(url.format({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file:",
            slashes: true,
        }));
    } else {
        win.loadURL("http://localhost:3000/");

        Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "reload" }]));
    }

    /*
     * Let us register listeners on the window, so we can update the state
     * automatically (the listeners will be removed when the window is closed)
     * and restore the maximized or full screen state
     */
    mainWindowState.manage(win);

    // Emitted when the window is closed.
    win.on("closed", () => {
        /*
         * Dereference the window object, usually you would store windows
         * in an array if your app supports multi windows, this is the time
         * when you should delete the corresponding element.
         */
        win = null;
    });
}

/*
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    /*
     * On macOS it is common for applications and their menu bar
     * to stay active until the user quits explicitly with Cmd + Q
     */
    if (process.platform !== "darwin")
        app.quit();
});

app.on("activate", () => {
    /*
     * On macOS it"s common to re-create a window in the app when the
     * dock icon is clicked and there are no other windows open.
     */
    if (win === null)
        createWindow();
});
