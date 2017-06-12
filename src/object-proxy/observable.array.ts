import { onGet, onSet, wrap } from "./observable.ref";

function createIterator<T>(value: T[]) {
    return function () {
        let i = 0;
        return {
            next: function () {
                i++;
                if (i == value.length)
                    return { value: undefined as any, done: true };

                onGet(value, i.toString());
                return { value: value[i], done: false };
            }
        }
    }
}

function createProxy<T>(value: T[]): T[] {
    if (!(value instanceof Array))
        return value;
    return new Proxy(value, {
        get(target: T[], p: PropertyKey, receiver: any) {
            if (typeof p === "number") {
                onGet(target, p.toString());
                return target[p];
            }

            if (typeof p === "symbol") {
                switch (p) {
                    case Symbol.iterator:
                        return createIterator(target);
                    default:
                        return (target as any)[p];
                }
            }

            switch (p) {
                case "map":
                    return function map<Z, U>(callbackfn: (this: Z, value: T, index: number, array: T[]) => U, thisArg: Z): U[] {
                        onGet(target, "length");
                        const result: U[] = [];
                        for (let i = 0; i < target.length; i++) {
                            onGet(target, i.toString());
                            result.push(callbackfn.call(thisArg, target[i], i, target));
                        }
                        return result;
                    }
                case "push":
                    return function push(...items: T[]): number {
                        if (items.length != 0) {
                            const retval = target.push(...items);
                            onSet(target, "length");
                            return retval;
                        }
                        return 0;
                    }
                default:
                    return (target as any)[p];
            }
        },
        set(target: T[], p: PropertyKey, value: any, receiver: any): boolean {
            if (typeof p === "number") {
                onSet(target, p.toString());
                target[p] = value;
                return true;
            }

            (target as any)[p] = value;
            return true;
        }
    });
}

export const array = wrap(createProxy);
