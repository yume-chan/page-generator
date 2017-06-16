/// <reference types="electron" />

declare module "electron-window-state" {
    interface windowStateKeeperOption {
        defaultWidth?: number;
        defaultHeight?: number;
        path?: string;
        file?: string;
        maximize?: boolean;
        fullScreen?: boolean;
    }

    namespace windowStateKeeper { }

    class windowStateKeeper {
        constructor(option?: windowStateKeeperOption);

        x: number;
        y: number;
        width: number;
        height: number;
        isMaximized: boolean;
        isFullScreen: boolean;

        manage(window: Electron.BrowserWindow): void;
        unmanage(window: Electron.BrowserWindow): void;
        saveState(window: Electron.BrowserWindow): void;
    }

    export = windowStateKeeper;
}
