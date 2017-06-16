import { FunctionRef, wrap as actionWrap } from "./action";
import { hasOwnProperty } from "./observer";

export const run: Set<FunctionRef> = new Set<any>();

function wrap(value: FunctionRef): FunctionRef {
    const wrapper: FunctionRef = actionWrap(function (this: object) {
        try {
            const size = run.size;
            run.add(wrapper);

            // Already in the set, don't track this call.
            if (size === run.size)
                return;

            wrapper.ref = new WeakMap<object, string[]>();
            wrapper.value = value;
            value.ref = wrapper.ref;
            const retval = value.apply(this);
            if (retval instanceof Promise && process.env.NODE_ENV !== "production")
                console.warn("Don't decorate an async function with @autorun.");
            return retval;
        } finally {
            run.delete(wrapper);
        }
    }) as FunctionRef;
    return wrapper;
}

interface Autorun {
    (target: object, targetKey: string, descriptor: TypedPropertyDescriptor<() => Promise<void>>): TypedPropertyDescriptor<() => Promise<void>>;
    (target: object, targetKey: string, descriptor: TypedPropertyDescriptor<() => void>): TypedPropertyDescriptor<() => void>;
}

export const autorun: Autorun = <T extends TypedPropertyDescriptor<FunctionRef>>(target: object, targetKey: string, descriptor: T): T => {
    const value = descriptor.value;
    if (value !== undefined) {
        descriptor = {
            get(this: object) {
                if (!hasOwnProperty(this, targetKey))
                    Object.defineProperty(this, targetKey, { value: wrap(value.bind(this)) });
                return (this as any)[targetKey] as T;
            },
        } as any;
    } else {
        const get = descriptor.get!;
        descriptor.get = function (this: object) {
            return wrap(get.apply(this)).bind(this);
        };
    }

    return descriptor;
};
