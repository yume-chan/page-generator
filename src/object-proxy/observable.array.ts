import { onGet, onSet, wrap } from "./observable.ref";

function createIterator<T>(value: T[]) {
    return function iterate() {
        let i = -1;
        return {
            next() {
                i++;
                if (i === value.length)
                    return { value: undefined as any, done: true };

                onGet(value, i.toString());
                return { value: value[i], done: false };
            },
        };
    };
}

const handler: ProxyHandler<any[]> = {
    get(target: any[], p: PropertyKey, receiver: any) {
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
            case "length":
                onGet(target, "length");
                return target.length;
            case "map":
                return function map<Z, U>(callbackfn: (this: Z, value: any, index: number, array: any[]) => U, thisArg: Z): U[] {
                    onGet(target, "length");
                    const result: U[] = [];
                    for (let i = 0; i < target.length; i++) {
                        onGet(target, i.toString());
                        result.push(callbackfn.call(thisArg, target[i], i, target));
                    }
                    return result;
                };
            case "push":
                return function push(...items: any[]): number {
                    if (items.length !== 0) {
                        const retval = target.push(...items);
                        onSet(target, "length");
                        return retval;
                    }
                    return 0;
                };
            case "splice":
                return function splice(start: number, deleteCount: number, ...items: any[]): any[] {
                    const retval = target.splice(start, deleteCount, ...items);

                    if (deleteCount === items.length) {
                        for (let i = 0; i < items.length; i++)
                            onSet(target, (start + i).toString());
                    } else {
                        const end = items.length > deleteCount ? target.length : target.length + (deleteCount - items.length);
                        for (let i = 0; i < items.length; i++)
                            onSet(target, (start + i).toString());
                        onSet(target, "length");
                    }

                    return retval;
                };
            default:
                return (target as any)[p];
        }
    },
    set(target: any[], p: PropertyKey, value: any, receiver: any): boolean {
        if (typeof p === "number") {
            onSet(target, p.toString());
            target[p] = value;
            return true;
        }

        (target as any)[p] = value;
        return true;
    },
};

function createProxy<T>(target: T[]): T[] {
    if (!(target instanceof Array))
        return target;

    return new Proxy(target, handler);
}

export const array = wrap(createProxy);
