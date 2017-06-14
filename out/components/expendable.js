import * as tslib_1 from "tslib";
import * as React from "react";
import * as classNames from "classnames";
import bind from "bind-decorator";
import { observable, observer } from "../object-proxy";
import "./expendable.less";
let Expendable = class Expendable extends React.Component {
    constructor(props) {
        super(props);
        this.expended = props.defaultExpended;
    }
    onHeaderClick(e) {
        this.expended = !this.expended;
        if (this.props.onExpendedChanged !== undefined)
            this.props.onExpendedChanged(this.expended);
    }
    render() {
        function renderActions(props) {
            if (props.actions === undefined || props.actions.length == 0)
                return undefined;
            return (React.createElement("div", { className: "actions" }, props.actions.map(value => (React.createElement("div", { key: value.className, className: classNames("action", value.className), title: value.title, onClick: e => { e.stopPropagation(); value.onClick(); } }, value.content)))));
        }
        return (React.createElement("div", { className: "expendable" },
            React.createElement("header", { className: classNames({ "collapsed": !this.expended }), onClick: this.onHeaderClick },
                React.createElement("div", { className: "title" }, this.props.title),
                renderActions(this.props)),
            this.expended && (React.createElement("div", { className: "body", style: { padding: this.props.padding } }, this.props.children))));
    }
};
tslib_1.__decorate([
    observable
], Expendable.prototype, "expended", void 0);
tslib_1.__decorate([
    bind
], Expendable.prototype, "onHeaderClick", null);
Expendable = tslib_1.__decorate([
    observer
], Expendable);
export { Expendable };
//# sourceMappingURL=expendable.js.map