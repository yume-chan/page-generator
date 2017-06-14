import * as tslib_1 from "tslib";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;
import * as React from "react";
import bind from "bind-decorator";
import { observable, observer, autorun } from "../object-proxy";
import { Code } from "./code";
import { DockPanel } from "./dock-panel";
import "./preview.less";
let Preview = class Preview extends React.Component {
    constructor(props) {
        super(props);
        this.project = props.project;
    }
    onWebviewRef(e) {
        if (e === null) {
            this.webview = undefined;
            return;
        }
        this.webview = e;
        this.webview.httpreferrer = this.props.project.uri;
        this.webview.disablewebsecurity = "true";
        this.webview.addEventListener("dom-ready", () => {
            if (this.webview !== undefined)
                this.webview.openDevTools();
        });
        this.computeContent();
    }
    shouldComponentUpdate(nextProps) {
        if (this.project !== nextProps.project) {
            this.project = nextProps.project;
            return false;
        }
        return true;
    }
    computeContent() {
        const core = async (project) => {
            this.content = await project.buildAsync(true);
        };
        core(this.project);
    }
    async save() {
        // Make a local copy to make TypeScript happy.
        // Or `project` will be `Project | undefined` again in
        // async callback.
        const project = this.props.project;
        if (project === undefined)
            return;
        if (project.filename === undefined) {
            dialog.showSaveDialog(remote.getCurrentWindow(), {
                defaultPath: project.name + ".json",
            }, async (filename) => {
                if (filename === undefined)
                    return;
                await project.saveAsync(filename);
            });
        }
        else {
            await project.saveAsync(project.filename);
        }
    }
    render() {
        const { project, isVirtual } = this.props;
        const template = project.template;
        const main = (React.createElement("div", { className: "preview", style: this.props.style },
            React.createElement("header", null,
                React.createElement("div", { className: "url-bar" },
                    React.createElement("span", null, template.uri.replace(template.uriReplace, project.name) + template.htmlName)),
                isVirtual || (React.createElement("div", { className: "actions" },
                    React.createElement("div", { className: "action icon-saveall", title: "Save", onClick: this.save }),
                    React.createElement("div", { className: "action icon-close", title: "Close", onClick: this.props.onClose })))),
            this.content !== undefined,
            React.createElement("webview", { ref: this.onWebviewRef, src: "data:text/html; charset=utf-8," + encodeURIComponent(this.content) })));
        if (isVirtual)
            return main;
        else
            return (React.createElement(DockPanel, { style: this.props.style, orientation: "vertical", mainElement: main, endPanel: React.createElement(Code, { project: project }) }));
    }
};
tslib_1.__decorate([
    observable
], Preview.prototype, "project", void 0);
tslib_1.__decorate([
    observable
], Preview.prototype, "content", void 0);
tslib_1.__decorate([
    bind
], Preview.prototype, "onWebviewRef", null);
tslib_1.__decorate([
    autorun
], Preview.prototype, "computeContent", null);
tslib_1.__decorate([
    bind
], Preview.prototype, "save", null);
Preview = tslib_1.__decorate([
    observer
], Preview);
export { Preview };
//# sourceMappingURL=preview.js.map