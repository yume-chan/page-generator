import { wrap as actionWrap } from "./action";
import { hasOwnProperty } from "./observer";
export const run = new Set();
function wrap(value) {
    const wrapper = actionWrap(function () {
        try {
            const size = run.size;
            run.add(wrapper);
            // Already in the set, don't track this call.
            if (size == run.size)
                return;
            wrapper.ref = new WeakMap();
            wrapper.value = value;
            value.ref = wrapper.ref;
            const retval = value.apply(this);
            if (retval instanceof Promise && process.env.NODE_ENV != "production")
                console.warn("Don't decorate an async function with @autorun.");
            return retval;
        }
        finally {
            run.delete(wrapper);
        }
    });
    return wrapper;
}
export const autorun = function (target, targetKey, descriptor) {
    const value = descriptor.value;
    if (value !== undefined) {
        descriptor = {
            get() {
                if (!hasOwnProperty(this, targetKey))
                    Object.defineProperty(this, targetKey, { value: wrap(value.bind(this)) });
                return this[targetKey];
            }
        };
    }
    else {
        const get = descriptor.get;
        descriptor.get = function () {
            const value = get.apply(this);
            return wrap(value).bind(this);
        };
    }
    return descriptor;
};
//# sourceMappingURL=autorun.js.map