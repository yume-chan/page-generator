import { onGet, onSet, wrap } from "./observable.ref";

function createProxy(value: { [key: string]: any }): { [key: string]: any } {
    return new Proxy(value, {
        get(target: { [key: string]: any }, p: PropertyKey, receiver: any) {
            if (typeof p === "string")
                onGet(target, p);

            return target[p];
        },
        set(target: { [key: string]: any }, p: PropertyKey, v: any, receiver: any) {
            target[p] = v;

            if (typeof p === "string")
                onSet(target, p);

            return true;
        },
        // ownKeys(target: { [key: string]: any }): PropertyKey[] {
        //     const keys = Object.keys(target);
        //     for (const key of keys)
        //         onGet(target, key);
        //     return keys;
        // }
    });
}

export const deep = wrap(createProxy);
