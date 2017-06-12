import * as React from "react";

import { run, FunctionRef } from "./autorun";

export function observer<T extends Function>(target: T): T {
    target.prototype.shouldComponentUpdate = function <T>(this: React.Component<T, void>, nextProps: T): boolean {
        return this.props !== nextProps;
    }

    const render: () => JSX.Element = target.prototype.render;
    target.prototype.render = function <T>(this: React.Component<T, void>) {
        const forceUpdate: FunctionRef = this.forceUpdate.bind(this);
        forceUpdate.ref = new WeakMap<any, any>();
        run.add(forceUpdate);
        const retval = render.call(this);
        run.delete(forceUpdate);
        return retval;
    };

    return target;
}
