export const EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);

declare var global: any;
export function getGlobal() {
	return global;
}

export interface Lambda {
	(): void;
	name?: string;
}

export function getNextId() {
	return ++globalState.mobxGuid;
}

export function fail(message: string, thing?: any): never {
	invariant(false, message, thing);
	throw "X"; // unreachable
}

export function invariant(check: boolean, message: string, thing?: any) {
	if (!check)
		throw new Error("[mobx] Invariant failed: " + message + (thing ? ` in '${thing}'` : ""));
}


/**
 * Prints a deprecation message, but only one time.
 * Returns false if the deprecated message was already printed before
 */
const deprecatedMessages: string[] = [];

export function deprecated(msg: string): boolean {
	if (deprecatedMessages.indexOf(msg) !== -1)
		return false;
	deprecatedMessages.push(msg);
	console.error("[mobx] Deprecated: " + msg);
	return true;
}

/**
 * Makes sure that the provided function is invoked at most once.
 */
export function once(func: Lambda): Lambda {
	let invoked = false;
	return function (this: any) {
		if (invoked)
			return;
		invoked = true;
		return (func as any).apply(this, arguments);
	};
}

export const noop = () => { };

export function unique<T>(list: T[]): T[] {
	const res: T[] = [];
	list.forEach(item => {
		if (res.indexOf(item) === -1)
			res.push(item);
	});
	return res;
}

export function joinStrings(things: string[], limit: number = 100, separator = " - "): string {
	if (!things)
		return "";
	const sliced = things.slice(0, limit);
	return `${sliced.join(separator)}${things.length > limit ? " (... and " + (things.length - limit) + "more)" : ""}`;
}

export function isObject(value: any): boolean {
	return value !== null && typeof value === "object";
}

export function isPlainObject(value: object) {
	if (value === null || typeof value !== "object")
		return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}

export function objectAssign(...objs: Object[]): Object;
export function objectAssign() {
	const res = arguments[0];
	for (let i = 1, l = arguments.length; i < l; i++) {
		const source = arguments[i];
		for (let key in source) if (hasOwnProperty(source, key)) {
			res[key] = source[key];
		}
	}
	return res;
}

export function valueDidChange(compareStructural: boolean, oldValue: any, newValue: any): boolean {
	if (typeof oldValue === 'number' && isNaN(oldValue)) {
		return typeof newValue !== 'number' || !isNaN(newValue);
	}
	return compareStructural
		? !deepEqual(oldValue, newValue)
		: oldValue !== newValue;
}

const prototypeHasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwnProperty(object: Object, propName: string) {
	return prototypeHasOwnProperty.call(object, propName) as boolean;
}

export function makeNonEnumerable(object: any, propNames: string[]) {
	for (let i = 0; i < propNames.length; i++) {
		addHiddenProp(object, propNames[i], object[propNames[i]]);
	}
}

export function addHiddenProp(object: any, propName: string, value: any) {
	Object.defineProperty(object, propName, {
		enumerable: false,
		writable: true,
		configurable: true,
		value
	});
}

export function addHiddenFinalProp(object: any, propName: PropertyKey, value: any) {
	Object.defineProperty(object, propName, {
		enumerable: false,
		writable: false,
		configurable: true,
		value
	});
}

export function isPropertyConfigurable(object: any, prop: string): boolean {
	const descriptor = Object.getOwnPropertyDescriptor(object, prop);
	return !descriptor || (descriptor.configurable !== false && descriptor.writable !== false);
}

export function assertPropertyConfigurable(object: any, prop: string) {
	invariant(
		isPropertyConfigurable(object, prop),
		`Cannot make property '${prop}' observable, it is not configurable and writable in the target object`
	);
}

export function getEnumerableKeys(obj: any) {
	const res: string[] = [];
	for (let key in obj)
		res.push(key);
	return res;
}

/**
 * Naive deepEqual. Doesn't check for prototype, non-enumerable or out-of-range properties on arrays.
 * If you have such a case, you probably should use this function but something fancier :).
 */
export function deepEqual(a: any, b: any): boolean {
	if (a === null && b === null)
		return true;
	if (a === undefined && b === undefined)
		return true;
	if (typeof a !== "object")
		return a === b;
	const aIsArray = isArrayLike(a);
	const aIsMap = isMapLike(a);
	if (aIsArray !== isArrayLike(b)) {
		return false;
	}

	if (aIsMap !== isMapLike(b)) {
		return false;
	}

	if (aIsArray) {
		if (a.length !== b.length)
			return false;
		for (let i = a.length - 1; i >= 0; i--)
			if (!deepEqual(a[i], b[i]))
				return false;
		return true;
	}

	if (aIsMap) {
		if (a.size !== b.size)
			return false;
		let equals = true;
		a.forEach((value: any, key: any) => {
			equals = equals && deepEqual(b.get(key), value);
		});
		return equals;
	}

	if (typeof a === "object" && typeof b === "object") {
		if (a === null || b === null)
			return false;

		if (isMapLike(a) && isMapLike(b)) {
			if (a.size !== b.size)
				return false;
			// Freaking inefficient.... Create PR if you run into this :) Much appreciated!
			return deepEqual(observable.shallowMap(a).entries(), observable.shallowMap(b).entries());
		}

		if (getEnumerableKeys(a).length !== getEnumerableKeys(b).length)
			return false;
		for (let prop in a) {
			if (!(prop in b))
				return false;
			if (!deepEqual(a[prop], b[prop]))
				return false;
		}
		return true;
	}

	return false;
}

export function createInstanceofPredicate<T>(name: string, clazz: new (...args: any[]) => T): (x: any) => x is T {
	const propName = "isMobX" + name;
	clazz.prototype[propName] = true;
	return function (x: any): x is T {
		return isObject(x) && x[propName] === true;
	};
}

/**
 * Returns whether the argument is an array, disregarding observability.
 */
export function isArrayLike(x: any): x is Array<any> | IObservableArray<any> {
	return Array.isArray(x) || isObservableArray(x);
}

export function isMapLike(x: any): x is Map<any, any> {
	return isES6Map(x) || isObservableMap(x)
}

export function isES6Map(x: any): x is Map<any, any> {
	if (getGlobal().Map !== undefined && x instanceof getGlobal().Map)
		return true;
	return false;
}

export function enumerable(value: boolean) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		descriptor.enumerable = value;
	};
}

export function toPrimitive(value: any, hint: "default" | "string" | "number") {
	if (value === null)
		return null;

	const toPrimitive = (value as any)[Symbol.toPrimitive];
	if (typeof toPrimitive === "function")
		return toPrimitive.call(value, hint);

	const methods = hint === "number" ? ["valueOf", "toString"] : ["toString", "valueOf"];
	for (const name of methods) {
		const method = (value as any)[name];
		if (typeof method === "function")
			return method.call(value);
	}

	throw new TypeError("toPrimitive failed.");
}

import { globalState } from "../core/globalstate";
import { IObservableArray, isObservableArray } from "../types/observablearray";
import { isObservableMap } from "../types/observablemap";
import { observable } from "../api/observable";
