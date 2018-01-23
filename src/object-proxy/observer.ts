import React from "react";

import { FunctionRef } from "./action";
import { run } from "./autorun";

export function hasOwnProperty(object: object, property: string) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

export function observer<T extends React.ComponentType<any>>(target: T): T {
    if (React.Component.isPrototypeOf(target)) {
        if (!target.prototype.shouldComponentUpdate) {
            target.prototype.shouldComponentUpdate = function(this: React.Component<any, void>, nextProps: any): boolean {
                return this.props !== nextProps;
            };
        }

        const render: () => JSX.Element = target.prototype.render;
        target.prototype.render = function(this: React.Component<any, void>) {
            let forceUpdate: FunctionRef;
            if (hasOwnProperty(this, "forceUpdate")) {
                forceUpdate = this.forceUpdate;
            } else {
                forceUpdate = this.forceUpdate.bind(this);
                this.forceUpdate = forceUpdate;
            }

            forceUpdate.ref = new WeakMap<any, any>();
            run.add(forceUpdate);
            const retval = render.call(this);
            run.delete(forceUpdate);
            return retval;
        };

        return target;
    } else {
        class Wrapper extends React.Component<any> {
            public shouldComponentUpdate(nextProps: any): boolean {
                return this.props !== nextProps;
            }

            public render() {
                return (target as React.StatelessComponent<any>)(this.props);
            }
        }

        return observer(Wrapper) as any;
    }
}
