export type FunctionRef = (() => void | Promise<void>) & { ref?: WeakMap<object, (string)[]> }

export const run: Set<FunctionRef> = new Set<any>();

function wrap(value: FunctionRef): () => void | Promise<void> {
    return function (this: object) {
        let sync = true;
        try {
            const size = run.size;
            run.add(value);

            // Already in the set, don't track this call.
            if (size == run.size)
                return;

            value.ref = new WeakMap<object, (string)[]>();
            const retval = value.apply(this);
            if (retval instanceof Promise) {
                sync = false;
                function then(err: any) {
                    run.delete(value);

                    if (err)
                        throw err;
                }
                return retval.then(then, then);
            }
            return retval;
        }
        finally {
            if (sync)
                run.delete(value);
        }
    };
}

interface autorun {
    (target: object, targetKey: string, descriptor: TypedPropertyDescriptor<() => Promise<void>>): TypedPropertyDescriptor<() => Promise<void>>;
    (target: object, targetKey: string, descriptor: TypedPropertyDescriptor<() => void>): TypedPropertyDescriptor<() => void>;
}

export const autorun: autorun = function <T extends TypedPropertyDescriptor<FunctionRef>>(target: object, targetKey: string, descriptor: T): T {
    const value = descriptor.value;
    if (value !== undefined) {
        descriptor.value = wrap(value);
    } else {
        const get = descriptor.get!;
        descriptor.get = function (this: object) {
            const value: FunctionRef = get.apply(this);
            return wrap(value);
        }
    }

    return descriptor;
}
