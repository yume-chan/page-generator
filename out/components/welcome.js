import * as tslib_1 from "tslib";
import * as fs from "fs-extra";
import { remote } from "electron";
const { dialog, Menu, MenuItem } = remote;
import * as React from "react";
import * as classNames from "classnames";
import bind from "bind-decorator";
import { observable, observer } from "../object-proxy";
import { Project, Template } from "./project";
import { Panel } from "./panel";
import { Expendable } from "./expendable";
import { TextArea } from "./text-area";
import "./welcome.less";
var WelcomeState;
(function (WelcomeState) {
    WelcomeState[WelcomeState["Initial"] = 0] = "Initial";
    WelcomeState[WelcomeState["Welcome"] = 1] = "Welcome";
    WelcomeState[WelcomeState["NewFile"] = 2] = "NewFile";
})(WelcomeState || (WelcomeState = {}));
let Welcome = class Welcome extends React.Component {
    constructor() {
        super();
        this.templates = [];
        this.loadTemplatesAsync();
    }
    async loadTemplatesAsync() {
        this.templates.push(...await Template.loadAsync("./templates/"));
    }
    onOpen() {
        dialog.showOpenDialog(remote.getCurrentWindow(), {
            filters: [{
                    name: "Project File",
                    extensions: ["json"]
                }]
        }, async (files) => {
            if (files !== undefined) {
                const content = await fs.readFile(files[0], "utf-8");
                const file = JSON.parse(content);
                const [categoryName, name] = file.template.split("/");
                const category = this.templates.find(x => x.name == categoryName);
                if (category !== undefined) {
                    const template = category.templates.find(x => x.name == name);
                    if (template !== undefined)
                        this.props.onOpen(new Project(file.name, template, files[0], file));
                }
            }
        });
    }
    onCreate() {
        this.props.onOpen(new Project(this.name, this.template));
    }
    onTemplateSelected(template) {
        this.template = template;
        this.props.onPreview(new Project("preview", template));
    }
    render() {
        const actions = [
            {
                className: "icon-check",
                title: "OK",
                onClick: this.onCreate
            },
            {
                className: "icon-addfile",
                title: "Open",
                onClick: this.onOpen
            }
        ];
        return (React.createElement(Panel, { title: "New", actions: actions, style: this.props.style },
            React.createElement("div", { style: { padding: "0 8px 8px 16px" } },
                React.createElement("h4", null, "Project name"),
                React.createElement(TextArea, { onChange: value => this.name = value, value: this.name })),
            this.templates && this.templates.map(category => (React.createElement(Expendable, { key: category.name, title: category.name, defaultExpended: true }, category.templates.map(template => (React.createElement("div", { className: classNames("template", { "highlight": this.template == template }), style: { paddingLeft: "24px", fontSize: "13px", height: "24px", lineHeight: "24px", cursor: "pointer" }, key: template.name, onClick: e => this.onTemplateSelected(template) }, template.name))))))));
    }
};
tslib_1.__decorate([
    observable.array
], Welcome.prototype, "templates", void 0);
tslib_1.__decorate([
    observable
], Welcome.prototype, "name", void 0);
tslib_1.__decorate([
    observable
], Welcome.prototype, "template", void 0);
tslib_1.__decorate([
    bind
], Welcome.prototype, "onOpen", null);
tslib_1.__decorate([
    bind
], Welcome.prototype, "onCreate", null);
tslib_1.__decorate([
    bind
], Welcome.prototype, "onTemplateSelected", null);
Welcome = tslib_1.__decorate([
    observer
], Welcome);
export { Welcome };
//# sourceMappingURL=welcome.js.map