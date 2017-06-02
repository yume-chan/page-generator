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
let Separator = class Separator extends React.Component {
    constructor() {
        super(...arguments);
        this.cursor = "";
        this.start = 0;
        this.origin = 0;
        this.dragging = false;
        this.onMouseDown = (e) => {
            if (e.button == 0) {
                e.preventDefault();
                this.start = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
                this.origin = this.props.value;
                this.dragging = true;
            }
        };
        this.onMouseMove = (e) => {
            const now = this.props.orientation == "horizontal" ? e.pageX : e.pageY;
            const delta = this.props.decrement ? this.start - now : now - this.start;
            const current = this.origin + delta;
            if (this.props.min !== undefined && current < this.props.min)
                return;
            if (this.props.max != undefined && current > this.props.max)
                return;
            this.props.onValueUpdated(current);
        };
        this.onMouseUp = (e) => {
            if (e.button == 0)
                this.dragging = false;
        };
    }
    render() {
        if (this.dragging)
            return React.createElement("div", { className: "drag-overlay", style: { cursor: this.props.orientation == "horizontal" ? "ew-resize" : "ns-resize" }, onMouseMove: this.onMouseMove, onMouseUp: this.onMouseUp });
        else
            return React.createElement("div", { className: "separator", style: this.props.style, onMouseDown: this.onMouseDown });
    }
};
__decorate([
    mobx_1.observable
], Separator.prototype, "dragging", void 0);
Separator = __decorate([
    mobx_react_1.observer
], Separator);
exports.Separator = Separator;
//# sourceMappingURL=separator.js.map