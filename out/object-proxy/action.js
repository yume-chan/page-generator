export let suppress = { value: false };
export const pending = new Set();
export function wrap(value) {
    return function () {
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
export function action(target, targetKey, descriptor) {
    const value = descriptor.value;
    if (value !== undefined) {
        descriptor.value = wrap(value);
    }
    else {
        const get = descriptor.get;
        descriptor.get = function () {
            const value = get.apply(this);
            return wrap(value);
        };
    }
    return descriptor;
}
//# sourceMappingURL=action.js.map