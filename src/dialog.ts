import * as electron from "electron";

const app = electron.app || electron.remote.app;
const dialog = electron.dialog || electron.remote.dialog;
const remote = electron.remote;

export function showOpenDialog(options: Electron.OpenDialogOptions): Promise<string[] | undefined> {
    return new Promise<string[] | undefined>((resolve) => {
        dialog.showOpenDialog(remote.getCurrentWindow(), options, (files) => {
            resolve(files);
        });
    });
}

export function showSaveDialog(options: Electron.SaveDialogOptions): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
        dialog.showSaveDialog(remote.getCurrentWindow(), options, (file) => {
            resolve(file);
        });
    });
}

export function quit() {
    app.quit();
}
