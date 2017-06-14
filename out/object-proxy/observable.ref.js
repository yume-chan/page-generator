import { run } from "./autorun";
import { suppress, pending } from "./action";
const reaction = new WeakMap();
const read = new WeakMap();
// const store: WeakMap<object, { [key: string]: any }> = new WeakMap<any, any>();
export function onGet(scope, propertyKey) {
    const r = read.get(scope);
    if (r !== undefined)
        r[propertyKey] = true;
    for (const item of run) {
        const ref = item.ref;
        if (!ref.has(scope))
            ref.set(scope, [propertyKey]);
        else
            ref.get(scope).push(propertyKey);
    }
    if (!reaction.has(scope)) {
        reaction.set(scope, { [propertyKey]: new Set(run) });
    }
    else {
        const map = reaction.get(scope);
        if (!map[propertyKey]) {
            map[propertyKey] = new Set(run);
        }
        else {
            const set = reaction.get(scope)[propertyKey];
            for (const item of run)
                set.add(item);
        }
    }
}
export function onSet(scope, propertyKey) {
    const obj = reaction.get(scope);
    if (obj === undefined)
        return;
    const list = obj[propertyKey];
    if (list === undefined)
        return;
    const r = read.get(scope);
    if (r === undefined)
        read.set(scope, {});
    else
        r[propertyKey] = false;
    let count = 1;
    function then(err) {
        count--;
        if (count == 0 && !read.get(scope)[propertyKey])
            reaction.delete(scope);
        if (err)
            throw err;
    }
    if (!suppress.value) {
        for (const method of run) {
            const ref = method.ref.get(scope);
            if (ref !== undefined && ref.includes(propertyKey))
                throw "Cannot modify an observed value in autorun";
        }
        for (const item of new Set(list)) {
            const retval = item();
            if (retval instanceof Promise) {
                count++;
                retval.then(then, then);
            }
        }
        then();
    }
    else {
        for (const item of new Set(list)) {
            pending.add(item);
        }
    }
}
export function wrap(beforeSet) {
    return function (target, propertyKey, descriptor) {
        if (descriptor !== undefined) {
            const get = descriptor.get;
            if (get !== undefined) {
                descriptor.get = function () {
                    onGet(this, propertyKey);
                    return get.call(this);
                };
            }
            const set = descriptor.set;
            if (set !== undefined) {
                descriptor.set = function (v) {
                    set.call(this, beforeSet(v));
                    onSet(this, propertyKey);
                };
            }
        }
        else {
            descriptor = {
                configurable: false,
                enumerable: true,
                get: function () {
                    onGet(this, propertyKey);
                    // const object = store.get(this);
                    const object = this.$store;
                    if (object !== undefined)
                        return object[propertyKey];
                    else
                        return undefined;
                },
                set: function (v) {
                    const value = beforeSet(v);
                    // const object = store.get(this);
                    const object = this.$store;
                    if (object !== undefined)
                        object[propertyKey] = value;
                    else
                        // store.set(this, { [propertyKey]: value });
                        this.$store = { [propertyKey]: value };
                    onSet(this, propertyKey);
                }
            };
        }
        return descriptor;
    };
}
export const ref = wrap(v => v);
//# sourceMappingURL=observable.ref.js.map