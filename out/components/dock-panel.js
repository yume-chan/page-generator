"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const mobx_1 = require("mobx");
const mobx_react_1 = require("mobx-react");
const separator_1 = require("./separator");
let DockPanel = class DockPanel extends React.Component {
    constructor(props) {
        super(props);
        this.onStartPanelSizeChanged = (value) => {
            this.startPanelSize = value;
        };
        this.onEndPanelSizeChanged = (value) => {
            this.endPanelSize = value;
        };
        if (props.startPanel !== undefined && props.startPanelSize !== undefined)
            this.startPanelSize = props.startPanelSize;
        else
            this.startPanelSize = 0;
        if (props.endPanel !== undefined && props.endPanelSize !== undefined)
            this.endPanelSize = props.endPanelSize;
        else
            this.endPanelSize = 0;
        this.separatorWidth = props.separatorWidth || 6;
    }
    render() {
        const list = [];
        let { orientation, startPanel, mainElement, endPanel } = this.props;
        const mainElementStyle = {};
        mainElement = React.cloneElement(mainElement, { style: mainElementStyle });
        mainElementStyle.position = "absolute";
        switch (orientation) {
            case "horizontal":
                mainElementStyle.top = "0";
                mainElementStyle.bottom = "0";
                if (startPanel !== undefined) {
                    const startPanelStyle = {};
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle });
                    startPanelStyle.top = "0";
                    startPanelStyle.bottom = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.width = this.startPanelSize + "px";
                    mainElementStyle.left = this.startPanelSize + this.separatorWidth + "px";
                    list.push(startPanel);
                    list.push(React.createElement(separator_1.Separator, { orientation: orientation, value: this.startPanelSize, min: this.props.startPanelMinSize, max: this.props.startPanelMaxSize, style: { left: this.startPanelSize + "px" }, onValueUpdated: this.onStartPanelSizeChanged }));
                }
                else {
                    mainElementStyle.left = "0";
                }
                list.push(mainElement);
                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    const endPanelStyle = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle });
                    endPanelStyle.top = "0";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.width = this.endPanelSize + "px";
                    mainElementStyle.right = this.endPanelSize + this.separatorWidth + "px";
                    list.push(React.createElement(separator_1.Separator, { orientation: orientation, decrement: true, value: this.endPanelSize, min: this.props.endPanelMinSize, max: this.props.endPanelMaxSize, style: { right: this.endPanelSize + "px" }, onValueUpdated: this.onEndPanelSizeChanged }));
                    list.push(endPanel);
                }
                else {
                    mainElementStyle.right = "0";
                }
                break;
            case "vertical":
                mainElementStyle.right = "0";
                mainElementStyle.left = "0";
                if (startPanel !== undefined && this.startPanelSize !== undefined) {
                    const startPanelStyle = {};
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle });
                    startPanelStyle.top = "0";
                    startPanelStyle.right = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.height = this.startPanelSize + "px";
                    mainElementStyle.top = this.startPanelSize + this.separatorWidth + "px";
                    list.push(startPanel);
                    list.push(React.createElement(separator_1.Separator, { orientation: orientation, value: this.startPanelSize, min: this.props.startPanelMinSize, max: this.props.startPanelMaxSize, style: { top: this.startPanelSize + "px" }, onValueUpdated: this.onStartPanelSizeChanged }));
                }
                else {
                    mainElementStyle.top = "0";
                }
                list.push(mainElement);
                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    const endPanelStyle = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle });
                    endPanelStyle.top = "0";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.width = this.endPanelSize + "px";
                    mainElementStyle.bottom = this.endPanelSize + this.separatorWidth + "px";
                    list.push(React.createElement(separator_1.Separator, { orientation: orientation, decrement: true, value: this.endPanelSize, min: this.props.endPanelMinSize, max: this.props.endPanelMaxSize, style: { bottom: this.endPanelSize + "px" }, onValueUpdated: this.onEndPanelSizeChanged }));
                    list.push(endPanel);
                }
                else {
                    mainElementStyle.bottom = "0";
                }
                break;
        }
        return React.createElement("div", { id: this.props.id }, list);
    }
};
__decorate([
    mobx_1.observable
], DockPanel.prototype, "startPanelSize", void 0);
__decorate([
    mobx_1.observable
], DockPanel.prototype, "endPanelSize", void 0);
DockPanel = __decorate([
    mobx_react_1.observer
], DockPanel);
exports.DockPanel = DockPanel;
//# sourceMappingURL=dock-panel.js.map