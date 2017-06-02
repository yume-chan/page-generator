"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const { dialog, Menu, MenuItem } = electron_1.remote;
const React = require("react");
const mobx_1 = require("mobx");
const mobx_react_1 = require("mobx-react");
const source_file_1 = require("./source-file");
const new_file_1 = require("./new-file");
function getSubmenu(item) {
    return item.submenu;
}
function iterate(obj, iteratee) {
    return Object.keys(obj).map(key => iteratee(key, obj[key]));
}
let App = class App extends React.Component {
    constructor() {
        super();
        this.onCreate = (name, template) => {
            this.file = new source_file_1.SourceFile();
        };
        this.onTemplateReplaceChange = (e) => {
            if (this.file !== undefined) {
                const target = e.target;
                this.file.templateReplace[target.dataset["key"]] = target.value;
                this.file.dirty = true;
            }
        };
        this.templates = [
            {
                name: "webpc",
                uriPrefix: "https://pc.cnaidai.com/webpc/activity/",
                uriSuffix: "index.htm",
                template: "",
                replace: {
                    "Title": {
                        replace: "{TITLE}",
                        default: "爱贷网"
                    },
                    "Keywords": {
                        replace: "{KEYWORDS}",
                        default: ""
                    },
                    "Description": {
                        replace: "{DESCRIPTION}",
                        default: ""
                    },
                }
            },
            {
                name: "webchat",
                uriPrefix: "https://wechat.cnaidai.com/webchat/activity/",
                uriSuffix: "index.html",
                template: "",
                replace: {
                    "Title": {
                        replace: "{TITLE}",
                        default: "爱贷网"
                    },
                }
            }
        ];
        this.selectedTemplate = this.templates[0];
        getSubmenu(Menu.getApplicationMenu().items[0]).items[2].enabled = false;
        window.menu = {
            file: {
                new: () => {
                    if (this.file != undefined && this.file.dirty) {
                        dialog.showMessageBox(electron_1.remote.getCurrentWindow(), {
                            message: "Save?",
                            buttons: ["Yes", "No", "Cancel"],
                            defaultId: 2,
                            cancelId: 1
                        });
                    }
                },
                open() {
                    const filePaths = dialog.showOpenDialog(electron_1.remote.getCurrentWindow(), {
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
    render() {
        const startPanel = (React.createElement("aside", { className: "panel-left" },
            React.createElement("h1", null, "Properties"),
            iterate(this.selectedTemplate.replace, (key, value) => (React.createElement("div", { key: key },
                React.createElement("h4", null, key),
                React.createElement("textarea", { "data-key": key, onChange: this.onTemplateReplaceChange, value: value.default }))))));
        const mainElement = (React.createElement("div", { className: "editor" }));
        return (React.createElement("div", { id: "app" },
            React.createElement(new_file_1.NewFile, { templates: this.templates, onCreate: this.onCreate })));
    }
};
__decorate([
    mobx_1.observable
], App.prototype, "file", void 0);
__decorate([
    mobx_1.observable
], App.prototype, "selectedTemplate", void 0);
App = __decorate([
    mobx_react_1.observer
], App);
exports.App = App;
//# sourceMappingURL=app.js.map