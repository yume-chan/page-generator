import { onGet, onSet, wrap } from "./observable.ref";
function createProxy(value) {
    return new Proxy(value, {
        get(target, p, receiver) {
            if (typeof p === "string")
                onGet(target, p);
            return target[p];
        },
        set(target, p, v, receiver) {
            target[p] = v;
            if (typeof p === "string")
                onSet(target, p);
            return true;
        },
    });
}
export const deep = wrap(createProxy);
//# sourceMappingURL=observable.deep.js.map