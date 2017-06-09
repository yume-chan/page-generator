import { IObservableArray, IArrayChange, IArraySplice } from "../types/observablearray";
import { ObservableMap, IMapChange } from "../types/observablemap";
import { IObjectChange } from "../types/observableobject";
import { IComputedValue } from "../core/computedvalue";

import { IObservableValue, IValueDidChange } from "../types/observablevalue";
import { Lambda } from "../utils/utils";
import { getAdministration } from "../types/type-utils";

export function observe<T>(value: IObservableValue<T> | IComputedValue<T>, listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
export function observe<T>(observableArray: IObservableArray<T>, listener: (change: IArrayChange<T> | IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
export function observe<T>(observableMap: ObservableMap<T>, listener: (change: IMapChange<T>) => void, fireImmediately?: boolean): Lambda;
export function observe<T>(observableMap: ObservableMap<T>, property: string, listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
export function observe(object: Object, listener: (change: IObjectChange) => void, fireImmediately?: boolean): Lambda;
export function observe(object: Object, property: string, listener: (change: IValueDidChange<any>) => void, fireImmediately?: boolean): Lambda;
export function observe(thing: any, propOrCb: string | Function, cbOrFire?: string | Function | boolean, fireImmediately?: boolean): Lambda {
	if (typeof cbOrFire === "function")
		return observeObservableProperty(thing, propOrCb as string, cbOrFire, fireImmediately);
	else
		return observeObservable(thing, propOrCb as Function, cbOrFire as boolean);
}

function observeObservable(thing: any, listener: Function, fireImmediately: boolean) {
	return getAdministration(thing).observe(listener, fireImmediately);
}

function observeObservableProperty(thing: any, property: string, listener: Function, fireImmediately?: boolean) {
	return getAdministration(thing, property).observe(listener, fireImmediately);
}
