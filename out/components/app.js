import * as tslib_1 from "tslib";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;
import * as React from "react";
import bind from "bind-decorator";
import { observable, observer } from "../object-proxy";
import { DockPanel } from "./dock-panel";
import { Welcome } from "./welcome";
import { Preview } from "./preview";
import { Editor } from "./editor";
import "./app.less";
function getSubmenu(item) {
    return item.submenu;
}
function iterate(obj, iteratee) {
    return Object.keys(obj).map(key => iteratee(key, obj[key]));
}
let App = class App extends React.Component {
    constructor() {
        super();
        getSubmenu(Menu.getApplicationMenu().items[0]).items[2].enabled = false;
        window.menu = {
            file: {
                new: () => {
                    if (this.project != undefined && this.project.dirty) {
                        dialog.showMessageBox(remote.getCurrentWindow(), {
                            message: "Save?",
                            buttons: ["Yes", "No", "Cancel"],
                            defaultId: 2,
                            cancelId: 1
                        });
                    }
                },
                open() {
                    const filePaths = dialog.showOpenDialog(remote.getCurrentWindow(), {
                        properties: ["openFile"]
                    });
                    if (filePaths == undefined)
                        return;
                    alert(filePaths[0]);
                },
                save: () => {
                }
            }
        };
    }
    onOpen(project) {
        this.project = project;
        this.preview = undefined;
    }
    onReplaceChange(key, value) {
        if (this.project !== undefined) {
            this.project.templateReplace[key] = value;
            this.project.dirty = true;
        }
    }
    ;
    onClose() {
        this.project = undefined;
    }
    render() {
        const startPanel = this.project !== undefined ? React.createElement(Editor, { project: this.project, onReplaceChange: this.onReplaceChange }) : React.createElement(Welcome, { onOpen: this.onOpen, onPreview: project => this.preview = project });
        const project = this.project || this.preview;
        const mainElement = project !== undefined ? React.createElement(Preview, { project: project, onClose: this.onClose, isVirtual: this.project === undefined }) : React.createElement("div", null);
        return (React.createElement(DockPanel, { id: "content", orientation: "horizontal", mainElement: mainElement, startPanel: startPanel, startPanelSize: 200, startPanelMinSize: 200 }));
    }
};
tslib_1.__decorate([
    observable
], App.prototype, "preview", void 0);
tslib_1.__decorate([
    observable
], App.prototype, "project", void 0);
tslib_1.__decorate([
    bind
], App.prototype, "onOpen", null);
tslib_1.__decorate([
    bind
], App.prototype, "onReplaceChange", null);
tslib_1.__decorate([
    bind
], App.prototype, "onClose", null);
App = tslib_1.__decorate([
    observer
], App);
export { App };
//# sourceMappingURL=app.js.map