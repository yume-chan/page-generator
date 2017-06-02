"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class NewFile extends React.Component {
    constructor() {
        super(...arguments);
        this.onNameChange = (e) => {
            this.name = e.target.value;
        };
        this.onTemplateChange = (e) => {
            this.selectedTemplate = this.props.templates[e.target.selectedIndex];
        };
    }
    render() {
        return (React.createElement("div", { className: "mask" },
            React.createElement("div", { className: "blur" }),
            React.createElement("div", { className: "dialog" },
                React.createElement("h1", null, "New File"),
                React.createElement("h4", null, "Project Name"),
                React.createElement("input", { type: "text", onChange: this.onNameChange }),
                React.createElement("h4", null, "Template"),
                React.createElement("select", { onChange: this.onTemplateChange }, this.props.templates.map(item => (React.createElement("option", { key: item.name }, item.name)))),
                React.createElement("footer", null,
                    React.createElement("div", { className: "button highlight" }, "OK"),
                    React.createElement("div", { className: "button" }, "Cancel")))));
    }
}
exports.NewFile = NewFile;
//# sourceMappingURL=new-file.js.map