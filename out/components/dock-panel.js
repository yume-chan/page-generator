import * as tslib_1 from "tslib";
import * as React from "react";
import bind from "bind-decorator";
import { observable, observer } from "../object-proxy";
let Separator = class Separator extends React.Component {
    constructor() {
        super(...arguments);
        this.start = 0;
        this.origin = 0;
        this.dragging = false;
    }
    onMouseDown(e) {
        if (e.button == 0) {
            e.preventDefault();
            this.start = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
            this.origin = this.props.value;
            this.dragging = true;
        }
    }
    onMouseMove(e) {
        const now = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
        const delta = this.props.start ? now - this.start : this.start - now;
        const current = this.origin + delta;
        if (this.props.min !== undefined && current < this.props.min)
            return;
        if (this.props.max != undefined && current > this.props.max)
            return;
        this.props.onValueUpdated(current);
    }
    onMouseUp(e) {
        if (e.button == 0)
            this.dragging = false;
    }
    render() {
        const style = {};
        style.position = "absolute";
        switch (this.props.orientation) {
            case "horizontal":
                style.cursor = "ew-resize";
                break;
            case "vertical":
                style.cursor = "ns-resize";
                break;
        }
        if (this.dragging) {
            return (React.createElement("div", { className: "drag-overlay", style: style, onMouseMove: this.onMouseMove, onMouseUp: this.onMouseUp }));
        }
        else {
            switch (this.props.orientation) {
                case "horizontal":
                    style.top = "0";
                    style.bottom = "0";
                    style.width = this.props.width + "px";
                    if (this.props.start)
                        style.left = this.props.value + "px";
                    else
                        style.right = this.props.value + "px";
                    break;
                case "vertical":
                    style.right = "0";
                    style.left = "0";
                    style.height = this.props.width + "px";
                    if (this.props.start)
                        style.top = this.props.value + "px";
                    else
                        style.bottom = this.props.value + "px";
                    break;
            }
            return React.createElement("div", { className: "separator", style: style, onMouseDown: this.onMouseDown });
        }
    }
};
tslib_1.__decorate([
    observable
], Separator.prototype, "dragging", void 0);
tslib_1.__decorate([
    bind
], Separator.prototype, "onMouseDown", null);
tslib_1.__decorate([
    bind
], Separator.prototype, "onMouseMove", null);
tslib_1.__decorate([
    bind
], Separator.prototype, "onMouseUp", null);
Separator = tslib_1.__decorate([
    observer
], Separator);
export { Separator };
let DockPanel = class DockPanel extends React.Component {
    constructor(props) {
        super(props);
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
    onStartPanelSizeChanged(value) {
        this.startPanelSize = value;
    }
    onEndPanelSizeChanged(value) {
        this.endPanelSize = value;
    }
    render() {
        const list = [];
        let { orientation, startPanel, mainElement, endPanel } = this.props;
        const mainElementStyle = {};
        mainElement = React.cloneElement(mainElement, { style: mainElementStyle, key: "2" });
        mainElementStyle.position = "absolute";
        switch (orientation) {
            case "horizontal":
                mainElementStyle.top = "0";
                mainElementStyle.bottom = "0";
                if (startPanel !== undefined) {
                    const startPanelStyle = {};
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle, key: "0" });
                    startPanelStyle.position = "absolute";
                    startPanelStyle.top = "0";
                    startPanelStyle.bottom = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.width = this.startPanelSize + "px";
                    mainElementStyle.left = this.startPanelSize + this.separatorWidth + "px";
                    list.push(startPanel);
                    list.push(React.createElement(Separator, { key: "1", orientation: orientation, start: true, value: this.startPanelSize, min: this.props.startPanelMinSize, max: this.props.startPanelMaxSize, width: this.separatorWidth, onValueUpdated: this.onStartPanelSizeChanged }));
                }
                else {
                    mainElementStyle.left = "0";
                }
                list.push(mainElement);
                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    list.push(React.createElement(Separator, { key: "3", orientation: orientation, start: false, value: this.endPanelSize, min: this.props.endPanelMinSize, max: this.props.endPanelMaxSize, width: this.separatorWidth, onValueUpdated: this.onEndPanelSizeChanged }));
                    const endPanelStyle = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle, key: "4" });
                    endPanelStyle.position = "absolute";
                    endPanelStyle.top = "0";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.width = this.endPanelSize + "px";
                    mainElementStyle.right = this.endPanelSize + this.separatorWidth + "px";
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
                    startPanel = React.cloneElement(startPanel, { style: startPanelStyle, key: "0" });
                    startPanelStyle.position = "absolute";
                    startPanelStyle.top = "0";
                    startPanelStyle.right = "0";
                    startPanelStyle.left = "0";
                    startPanelStyle.height = this.startPanelSize + "px";
                    mainElementStyle.top = this.startPanelSize + this.separatorWidth + "px";
                    list.push(startPanel);
                    list.push(React.createElement(Separator, { key: "1", orientation: orientation, start: true, value: this.startPanelSize, min: this.props.startPanelMinSize, max: this.props.startPanelMaxSize, width: this.separatorWidth, onValueUpdated: this.onStartPanelSizeChanged }));
                }
                else {
                    mainElementStyle.top = "0";
                }
                list.push(mainElement);
                if (endPanel !== undefined && this.endPanelSize !== undefined) {
                    list.push(React.createElement(Separator, { key: "3", orientation: orientation, start: false, value: this.endPanelSize, min: this.props.endPanelMinSize, max: this.props.endPanelMaxSize, width: this.separatorWidth, onValueUpdated: this.onEndPanelSizeChanged }));
                    const endPanelStyle = {};
                    endPanel = React.cloneElement(endPanel, { style: endPanelStyle, key: "4" });
                    endPanelStyle.position = "absolute";
                    endPanelStyle.right = "0";
                    endPanelStyle.bottom = "0";
                    endPanelStyle.left = "0";
                    endPanelStyle.height = this.endPanelSize + "px";
                    mainElementStyle.bottom = this.endPanelSize + this.separatorWidth + "px";
                    list.push(endPanel);
                }
                else {
                    mainElementStyle.bottom = "0";
                }
                break;
        }
        return React.createElement("div", { id: this.props.id, style: this.props.style }, list);
    }
};
tslib_1.__decorate([
    observable
], DockPanel.prototype, "startPanelSize", void 0);
tslib_1.__decorate([
    observable
], DockPanel.prototype, "endPanelSize", void 0);
tslib_1.__decorate([
    bind
], DockPanel.prototype, "onStartPanelSizeChanged", null);
tslib_1.__decorate([
    bind
], DockPanel.prototype, "onEndPanelSizeChanged", null);
DockPanel = tslib_1.__decorate([
    observer
], DockPanel);
export { DockPanel };
//# sourceMappingURL=dock-panel.js.map