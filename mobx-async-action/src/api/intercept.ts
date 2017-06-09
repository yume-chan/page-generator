import { IInterceptor } from "../types/intercept-utils";
import { IObservableArray, IArrayWillChange, IArrayWillSplice } from "../types/observablearray";
import { ObservableMap, IMapWillChange } from "../types/observablemap";
import { IObjectWillChange } from "../types/observableobject";
import { IValueWillChange, IObservableValue } from "../types/observablevalue";
import { Lambda } from "../utils/utils";
import { getAdministration } from "../types/type-utils";

export function intercept<T>(value: IObservableValue<T>, handler: IInterceptor<IValueWillChange<T>>): Lambda;
export function intercept<T>(observableArray: IObservableArray<T>, handler: IInterceptor<IArrayWillChange<T> | IArrayWillSplice<T>>): Lambda;
export function intercept<T>(observableMap: ObservableMap<T>, handler: IInterceptor<IMapWillChange<T>>): Lambda;
export function intercept<T>(observableMap: ObservableMap<T>, property: string, handler: IInterceptor<IValueWillChange<T>>): Lambda;
export function intercept(object: Object, handler: IInterceptor<IObjectWillChange>): Lambda;
export function intercept(object: Object, property: string, handler: IInterceptor<IValueWillChange<any>>): Lambda;
export function intercept(thing: any, propOrHandler?: string | Function, handler?: Function): Lambda {
	if (typeof handler === "function")
		return interceptProperty(thing, propOrHandler as string, handler);
	else
		return interceptInterceptable(thing, propOrHandler as Function);
}

function interceptInterceptable(thing: any, handler: Function) {
	return getAdministration(thing).intercept(handler);
}

function interceptProperty(thing: any, property: string, handler: Function) {
	return getAdministration(thing, property).intercept(handler);
}
