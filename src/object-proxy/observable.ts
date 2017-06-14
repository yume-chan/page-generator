import { ref } from "./observable.ref";
import { array } from "./observable.array";
import { deep } from "./observable.deep";

interface Observable {
    (target: any, propertyKey: string): void;
    <T>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T>;

    array(target: any, propertyKey: string): void;
    array<T>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T[]>): TypedPropertyDescriptor<T[]>;

    deep(target: any, propertyKey: string): void;
    deep<T>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any>;
}

export const observable: Observable = Object.assign(ref, { array, deep });
