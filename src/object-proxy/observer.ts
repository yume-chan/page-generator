import * as React from "react";

import { run } from "./autorun";
import { FunctionRef } from "./action";

export type ReactProps<P> = P & { children?: React.ReactNode };

const _hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(object: object, property: string) {
    return _hasOwnProperty.call(object, property);
}

export function observer<P, T extends React.ComponentClass<P>>(target: T | React.StatelessComponent<P>): T {
    if (React.Component.isPrototypeOf(target)) {
        if (!target.prototype.shouldComponentUpdate) {
            target.prototype.shouldComponentUpdate = function (this: React.Component<P, void>, nextProps: P): boolean {
                return this.props !== nextProps;
            }
        }

        const render: () => JSX.Element = target.prototype.render;
        target.prototype.render = function <T>(this: React.Component<T, void>) {
            let forceUpdate: FunctionRef;
            if (hasOwnProperty(this, "forceUpdate"))
                forceUpdate = this.forceUpdate;
            else {
                forceUpdate = this.forceUpdate.bind(this);
                this.forceUpdate = forceUpdate;
            }

            forceUpdate.ref = new WeakMap<any, any>();
            run.add(forceUpdate);
            const retval = render.call(this);
            run.delete(forceUpdate);
            return retval;
        };

        return target as T;
    } else {
        return observer(class extends React.Component<P, void> {
            shouldComponentUpdate(nextProps: P): boolean {
                return this.props !== nextProps;
            }

            render() {
                return (target as React.StatelessComponent<P>)(this.props);
            }
        }) as any as T;
    }
}
