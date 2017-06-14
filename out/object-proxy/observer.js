import * as React from "react";
import { run } from "./autorun";
const _hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(object, property) {
    return _hasOwnProperty.call(object, property);
}
export function observer(target) {
    if (React.Component.isPrototypeOf(target)) {
        if (!target.prototype.shouldComponentUpdate) {
            target.prototype.shouldComponentUpdate = function (nextProps) {
                return this.props !== nextProps;
            };
        }
        const render = target.prototype.render;
        target.prototype.render = function () {
            let forceUpdate;
            if (hasOwnProperty(this, "forceUpdate"))
                forceUpdate = this.forceUpdate;
            else {
                forceUpdate = this.forceUpdate.bind(this);
                this.forceUpdate = forceUpdate;
            }
            forceUpdate.ref = new WeakMap();
            run.add(forceUpdate);
            const retval = render.call(this);
            run.delete(forceUpdate);
            return retval;
        };
        return target;
    }
    else {
        return observer(class extends React.Component {
            shouldComponentUpdate(nextProps) {
                return this.props !== nextProps;
            }
            render() {
                return target(this.props);
            }
        });
    }
}
//# sourceMappingURL=observer.js.map