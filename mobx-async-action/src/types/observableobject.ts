import { ObservableValue, UNCHANGED } from "./observablevalue";
import { isComputedValue, ComputedValue } from "../core/computedvalue";
import { createInstanceofPredicate, isObject, Lambda, getNextId, invariant, assertPropertyConfigurable, isPlainObject, addHiddenFinalProp } from "../utils/utils";
import { runLazyInitializers } from "../utils/decorators";
import { hasInterceptors, IInterceptable, registerInterceptor, interceptChange, IInterceptor } from "./intercept-utils";
import { IListenable, registerListener, hasListeners, notifyListeners } from "./listen-utils";
import { isSpyEnabled, spyReportStart, spyReportEnd } from "../core/spy";
import { IEnhancer, isModifierDescriptor, IModifierDescriptor } from "../types/modifiers";
import { isAction, defineBoundAction } from "../api/action";
import { getMessage } from "../utils/messages";



export interface IObservableObject {
	"observable-object": IObservableObject;
	[key: string]: any;
}

// In 3.0, change to IObjectDidChange
export interface IObjectChange {
	name: string;
	object: any;
	type: "update" | "add";
	oldValue?: any;
	newValue: any;
}

export interface IObjectWillChange {
	object: any;
	type: "update" | "add";
	name: string;
	newValue: any;
}

export class ObservableObjectAdministration implements IInterceptable<IObjectWillChange>, IListenable {
	values: { [key: string]: ObservableValue<any> | ComputedValue<any> } = {};
	changeListeners = null;
	interceptors = null;

	constructor(public target: any, public name: string) { }

	/**
		* Observes this object. Triggers for the events 'add', 'update' and 'delete'.
		* See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
		* for callback details
		*/
	observe(callback: (changes: IObjectChange) => void, fireImmediately?: boolean): Lambda {
		invariant(fireImmediately !== true, "`observe` doesn't support the fire immediately property for observable objects.");
		return registerListener(this, callback);
	}

	intercept(handler: IInterceptor<IObjectWillChange>): Lambda {
		return registerInterceptor(this, handler);
	}
}

export interface IIsObservableObject {
	$mobx: ObservableObjectAdministration;
}

export function asObservableObject(target: any, name?: string): ObservableObjectAdministration {
	if (isObservableObject(target))
		return (target as any).$mobx;

	invariant(Object.isExtensible(target), getMessage("m035"));
	if (!isPlainObject(target))
		name = (target.constructor.name || "ObservableObject") + "@" + getNextId();
	if (!name)
		name = "ObservableObject@" + getNextId();

	const adm = new ObservableObjectAdministration(target, name);
	addHiddenFinalProp(target, "$mobx", adm);
	return adm;
}

export function defineObservablePropertyFromDescriptor(adm: ObservableObjectAdministration, propName: string, descriptor: PropertyDescriptor, defaultEnhancer: IEnhancer<any>) {
	if (adm.values[propName]) {
		// already observable property
		invariant("value" in descriptor, `The property ${propName} in ${adm.name} is already observable, cannot redefine it as computed property`);
		adm.target[propName] = descriptor.value; // the property setter will make 'value' reactive if needed.
		return;
	}

	// not yet observable property

	if ("value" in descriptor) {
		// not a computed value
		if (isModifierDescriptor(descriptor.value)) {
			// x : ref(someValue)
			const modifierDescriptor = descriptor.value as IModifierDescriptor<any>;
			defineObservableProperty(adm, propName, modifierDescriptor.initialValue, modifierDescriptor.enhancer);
		}
		else if (isAction(descriptor.value) && descriptor.value.autoBind === true) {
			defineBoundAction(adm.target, propName, descriptor.value.originalFn);
		} else if (isComputedValue(descriptor.value)) {
			// x: computed(someExpr)
			defineComputedPropertyFromComputedValue(adm, propName, descriptor.value);
		} else {
			// x: someValue
			defineObservableProperty(adm, propName, descriptor.value, defaultEnhancer);
		}
	} else {
		// get x() { return 3 } set x(v) { }
		defineComputedProperty(adm, propName, descriptor.get!, descriptor.set!, false, true);
	}
}

export function defineObservableProperty(
	adm: ObservableObjectAdministration,
	propName: string,
	newValue: any,
	enhancer: IEnhancer<any>
) {
	assertPropertyConfigurable(adm.target, propName);

	if (hasInterceptors(adm)) {
		const change = interceptChange<IObjectWillChange>(adm, {
			object: adm.target,
			name: propName,
			type: "add",
			newValue
		});
		if (!change)
			return;
		newValue = change.newValue;
	}
	const observable = adm.values[propName] = new ObservableValue(newValue, enhancer, `${adm.name}.${propName}`, false);
	newValue = (observable as any).value; // observableValue might have changed it

	Object.defineProperty(adm.target, propName, generateObservablePropConfig(propName));
	notifyPropertyAddition(adm, adm.target, propName, newValue);
}

export function defineComputedProperty(
	adm: ObservableObjectAdministration,
	propName: string,
	getter: () => any,
	setter: ((v: any) => void) | undefined,
	compareStructural: boolean,
	asInstanceProperty: boolean
) {
	if (asInstanceProperty)
		assertPropertyConfigurable(adm.target, propName);

	adm.values[propName] = new ComputedValue(getter, adm.target, compareStructural, `${adm.name}.${propName}`, setter);
	if (asInstanceProperty) {
		Object.defineProperty(adm.target, propName, generateComputedPropConfig(propName));
	}
}

export function defineComputedPropertyFromComputedValue(adm: ObservableObjectAdministration, propName: string, computedValue: ComputedValue<any>) {
	let name = `${adm.name}.${propName}`;
	computedValue.name = name;
	if (!computedValue.scope)
		computedValue.scope = adm.target;

	adm.values[propName] = computedValue;
	Object.defineProperty(adm.target, propName, generateComputedPropConfig(propName));
}

const observablePropertyConfigs: PropertyDescriptorMap = {};
const computedPropertyConfigs: PropertyDescriptorMap = {};

export function generateObservablePropConfig(propName: string) {
	return observablePropertyConfigs[propName] || (
		observablePropertyConfigs[propName] = {
			configurable: true,
			enumerable: true,
			get: function (this: any) {
				return this.$mobx.values[propName].get();
			},
			set: function (v) {
				setPropertyValue(this, propName, v);
			}
		}
	);
}

export function generateComputedPropConfig(propName: string) {
	return computedPropertyConfigs[propName] || (
		computedPropertyConfigs[propName] = {
			configurable: true,
			enumerable: false,
			get: function (this: any) {
				return this.$mobx.values[propName].get();
			},
			set: function (this: any, v: any) {
				return this.$mobx.values[propName].set(v);
			}
		}
	);
}

export function setPropertyValue(instance: any, name: string, newValue: any) {
	const adm = instance.$mobx;
	const observable = adm.values[name];

	// intercept
	if (hasInterceptors(adm)) {
		const change = interceptChange<IObjectWillChange>(adm, {
			type: "update",
			object: instance,
			name, newValue
		});
		if (!change)
			return;
		newValue = change.newValue;
	}
	newValue = observable.prepareNewValue(newValue);

	// notify spy & observers
	if (newValue !== UNCHANGED) {
		const notify = hasListeners(adm);
		const notifySpy = isSpyEnabled();
		const change = notify || notifySpy ? {
			type: "update",
			object: instance,
			oldValue: (observable as any).value,
			name, newValue
		} : null;

		if (notifySpy)
			spyReportStart(change);
		observable.setNewValue(newValue);
		if (notify)
			notifyListeners(adm, change);
		if (notifySpy)
			spyReportEnd();
	}
}

function notifyPropertyAddition(adm: ObservableObjectAdministration, object: any, name: string, newValue: any) {
	const notify = hasListeners(adm);
	const notifySpy = isSpyEnabled();
	const change = notify || notifySpy ? {
		type: "add",
		object, name, newValue
	} : null;

	if (notifySpy)
		spyReportStart(change);
	if (notify)
		notifyListeners(adm, change);
	if (notifySpy)
		spyReportEnd();
}

const isObservableObjectAdministration = createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);

export function isObservableObject(thing: any): thing is IObservableObject {
	if (isObject(thing)) {
		// Initializers run lazily when transpiling to babel, so make sure they are run...
		runLazyInitializers(thing);
		return isObservableObjectAdministration((thing as any).$mobx);
	}
	return false;
}
