/// <reference types="electron" />

/* tslint:disable:no-namespace */
declare namespace JSX {
    interface IntrinsicElements {
        webview: React.HTMLProps<Electron.WebviewTag>;
    }
}
/* tslint:enable:no-namespace */

declare module "webview" {
    export default {};
}
