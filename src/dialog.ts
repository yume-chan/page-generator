import * as electron from "electron";
import { remote } from "electron";
const { dialog } = remote;

export function showOpenDialog(options: Electron.OpenDialogOptions, callback?: (filePaths?: string[]) => void): string[] | undefined {
    return dialog.showOpenDialog(remote.getCurrentWindow(), options, callback);
}

export function showSaveDialog(options: Electron.SaveDialogOptions, callback?: (file?: string) => void): string | undefined {
    return dialog.showSaveDialog(remote.getCurrentWindow(), options, callback);
}
