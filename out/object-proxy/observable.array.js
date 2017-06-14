import { onGet, onSet, wrap } from "./observable.ref";
function createIterator(value) {
    return function () {
        let i = -1;
        return {
            next: function () {
                i++;
                if (i == value.length)
                    return { value: undefined, done: true };
                onGet(value, i.toString());
                return { value: value[i], done: false };
            }
        };
    };
}
function createProxy(value) {
    if (!(value instanceof Array))
        return value;
    return new Proxy(value, {
        get(target, p, receiver) {
            if (typeof p === "number") {
                onGet(target, p.toString());
                return target[p];
            }
            if (typeof p === "symbol") {
                switch (p) {
                    case Symbol.iterator:
                        return createIterator(target);
                    default:
                        return target[p];
                }
            }
            switch (p) {
                case "length":
                    onGet(target, "length");
                    return target.length;
                case "map":
                    return function map(callbackfn, thisArg) {
                        onGet(target, "length");
                        const result = [];
                        for (let i = 0; i < target.length; i++) {
                            onGet(target, i.toString());
                            result.push(callbackfn.call(thisArg, target[i], i, target));
                        }
                        return result;
                    };
                case "push":
                    return function push(...items) {
                        if (items.length != 0) {
                            const retval = target.push(...items);
                            onSet(target, "length");
                            return retval;
                        }
                        return 0;
                    };
                case "splice":
                    return function splice(start, deleteCount, ...items) {
                        const retval = target.splice(start, deleteCount, ...items);
                        if (deleteCount == items.length) {
                            for (let i = 0; i < items.length; i++)
                                onSet(target, (start + i).toString());
                        }
                        else {
                            const end = items.length > deleteCount ? target.length : target.length + (deleteCount - items.length);
                            for (let i = 0; i < items.length; i++)
                                onSet(target, (start + i).toString());
                            onSet(target, "length");
                        }
                        return retval;
                    };
                default:
                    return target[p];
            }
        },
        set(target, p, value, receiver) {
            if (typeof p === "number") {
                onSet(target, p.toString());
                target[p] = value;
                return true;
            }
            target[p] = value;
            return true;
        }
    });
}
export const array = wrap(createProxy);
//# sourceMappingURL=observable.array.js.map