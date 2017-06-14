import * as tslib_1 from "tslib";
import * as React from "react";
import { bind } from "bind-decorator";
export class Code extends React.Component {
    onChange(value) {
        this.props.project.content = value;
    }
    onDivRef(ref) {
    }
    render() {
        return (React.createElement("div", { style: this.props.style, ref: this.onDivRef }));
    }
}
tslib_1.__decorate([
    bind
], Code.prototype, "onChange", null);
tslib_1.__decorate([
    bind
], Code.prototype, "onDivRef", null);
//# sourceMappingURL=code.js.map