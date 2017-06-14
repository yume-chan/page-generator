import * as tslib_1 from "tslib";
import * as React from "react";
import bind from "bind-decorator";
import { observable, observer } from "../object-proxy";
import "./text-area.less";
let TextArea = class TextArea extends React.Component {
    constructor(props) {
        super(props);
    }
    updateLayout() {
        if (this.mirror === null || this.mirror === undefined)
            return;
        const height = this.mirror.getBoundingClientRect().height;
        if (height != this.height)
            this.height = height;
    }
    onMirrorRef(e) {
        this.mirror = e;
        this.updateLayout();
    }
    onInput(e) {
        this.props.onChange(e.target.value);
    }
    componentDidUpdate() {
        this.updateLayout();
    }
    render() {
        let mirrorValue = this.props.value;
        if (mirrorValue !== undefined && mirrorValue.endsWith("\n"))
            mirrorValue += " ";
        return (React.createElement("div", { className: "wrapper" },
            React.createElement("textarea", { onInput: e => this.props.onChange(e.currentTarget.value), style: { height: this.height + "px" }, placeholder: this.props.placeholder, defaultValue: this.props.value, autoCorrect: "off", autoCapitalize: "off", spellCheck: false }),
            React.createElement("div", { className: "mirror", ref: this.onMirrorRef }, mirrorValue)));
    }
};
tslib_1.__decorate([
    observable
], TextArea.prototype, "height", void 0);
tslib_1.__decorate([
    bind
], TextArea.prototype, "onMirrorRef", null);
tslib_1.__decorate([
    bind
], TextArea.prototype, "onInput", null);
TextArea = tslib_1.__decorate([
    observer
], TextArea);
export { TextArea };
//# sourceMappingURL=text-area.js.map