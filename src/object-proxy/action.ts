type NoReturn = () => void | Promise<void>;
export type FunctionRef = NoReturn & {
    ref?: WeakMap<object, (string)[]>;
    value?: NoReturn;
}

export let suppress: { value: boolean } = { value: false };
export const pending: Set<FunctionRef> = new Set<any>();

export function wrap(value: Function): Function {
    return function (this: object) {
        const old = suppress.value;
        function then() {
            if (!old) {
                for (const item of pending)
                    item();

                pending.clear();
                suppress.value = false;
            }
        }

        suppress.value = true;
        try {
            const retval = value.apply(this, arguments);
            if (retval instanceof Promise && process.env.NODE_ENV != "production")
                console.warn("Don't decorate an async function with @action.");
            return retval;
        }
        finally {
            then();
        }
    };
}

export function action<T extends Function>(target: object, targetKey: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> {
    const value = descriptor.value;
    if (value !== undefined) {
        descriptor.value = wrap(value) as T;
    } else {
        const get = descriptor.get!;
        descriptor.get = function (this: object) {
            const value: FunctionRef = get.apply(this);
            return wrap(value) as T;
        }
    }

    return descriptor;
}
