import { ref } from "./observable.ref";
import { array } from "./observable.array";

interface Observable {
    (target: any, propertyKey: string): void;
    <T>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T>;

    array(target: any, propertyKey: string): void;
    array<T>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T[]>): TypedPropertyDescriptor<T[]>;
}

export const observable: Observable = Object.assign(ref, { array });
