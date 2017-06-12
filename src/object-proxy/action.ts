import { FunctionRef } from "./autorun";

export let suppress: { value: boolean } = { value: false };
export const pending: Set<FunctionRef> = new Set<any>();

function wrap(value: Function): () => void | Promise<void> {
    return function (this: object) {
        const old = suppress.value;
        function then() {
            if (!old) {
                for (const item of pending)
                    item();

                suppress.value = false;
            }
        }

        suppress.value = true;
        let sync = true;
        try {
            const retval = value.apply(this, arguments);
            if (retval instanceof Promise) {
                sync = false;
                return retval.then(result => {
                    then();
                    return result;
                }, err => {
                    then();
                    throw err;
                });
            }
            return retval;
        }
        finally {
            if (sync)
                then();
        }
    };
}

export function action(target: object, targetKey: string, descriptor: TypedPropertyDescriptor<Function>): TypedPropertyDescriptor<Function> {
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
