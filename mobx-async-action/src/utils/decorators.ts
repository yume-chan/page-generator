import { invariant, addHiddenProp, hasOwnProperty } from "./utils";

type BabelPropertyDescriptor = PropertyDescriptor & { initializer(): any };

type MobxExtendedObject = object & MobxObjectExtensions;

interface MobxObjectExtensions {
	__mobxDidRunLazyInitializers: boolean | undefined;
	__mobxLazyInitializers: ((instance: MobxExtendedObject) => void)[] | undefined;
	__mobxInitializedProps: { [key: string]: boolean };
}

type PropertyInitializer = (target: MobxExtendedObject, property: string, initialValue: any, customArgs?: IArguments, originalDescriptor?: BabelPropertyDescriptor) => void;

/**
 * Construcs a decorator, that normalizes the differences between
 * TypeScript and Babel. Mainly caused by the fact that legacy-decorator cannot assign
 * values during instance creation to properties that have a getter setter.
 *
 * - Sigh -
 *
 * Also takes care of the difference between @decorator field and @decorator(args) field, and different forms of values.
 * For performance (cpu and mem) reasons the properties are always defined on the prototype (at least initially).
 * This means that these properties despite being enumerable might not show up in Object.keys() (but they will show up in for...in loops).
 */
export function createClassPropertyDecorator(
	/**
	 * This function is invoked once, when the property is added to a new instance.
	 * When this happens is not strictly determined due to differences in TS and Babel:
	 * Typescript: Usually when constructing the new instance
	 * Babel, sometimes Typescript: during the first get / set
	 * Both: when calling `runLazyInitializers(instance)`
	 */
	onInitialize: PropertyInitializer,
	get: (this: MobxObjectExtensions, name: string) => any,
	set: (this: MobxObjectExtensions, name: string, newValue: any) => void,
	enumerable: boolean,
	/**
	 * Can this decorator invoked with arguments? e.g. @decorator(args)
	 */
	allowCustomArguments: boolean
): any {
	function classPropertyDecorator(target: MobxExtendedObject, key: string, descriptor: BabelPropertyDescriptor, customArgs?: IArguments, argLen: number = 0) {
		invariant(allowCustomArguments || quacksLikeADecorator(arguments), "This function is a decorator, but it wasn't invoked like a decorator");
		if (!descriptor) {
			// typescript (except for getter / setters)
			const newDescriptor = {
				enumerable,
				configurable: true,
				get: function (this: MobxExtendedObject) {
					if (!this.__mobxInitializedProps || this.__mobxInitializedProps[key] !== true)
						typescriptInitializeProperty(this, key, undefined, onInitialize, customArgs, descriptor);
					return get.call(this, key);
				},
				set: function (this: MobxExtendedObject, v: any) {
					if (!this.__mobxInitializedProps || this.__mobxInitializedProps[key] !== true) {
						typescriptInitializeProperty(this, key, v, onInitialize, customArgs, descriptor);
					} else {
						set.call(this, key, v);
					}
				}
			};
			if (arguments.length < 3 || arguments.length === 5 && argLen < 3) {
				// Typescript target is ES3, so it won't define property for us
				// or using Reflect.decorate polyfill, which will return no descriptor
				// (see https://github.com/mobxjs/mobx/issues/333)
				Object.defineProperty(target, key, newDescriptor);
			}
			return newDescriptor;
		} else {
			// babel and typescript getter / setter props
			if (!hasOwnProperty(target, "__mobxLazyInitializers")) {
				addHiddenProp(target, "__mobxLazyInitializers",
					(target.__mobxLazyInitializers && target.__mobxLazyInitializers.slice()) || [] // support inheritance
				);
			}

			const { value, initializer } = descriptor;
			target.__mobxLazyInitializers!.push((instance: any) => {
				onInitialize(
					instance,
					key,
					(initializer ? initializer.call(instance) : value),
					customArgs,
					descriptor
				);
			});

			return {
				enumerable, configurable: true,
				get: function (this: MobxExtendedObject) {
					if (this.__mobxDidRunLazyInitializers !== true)
						runLazyInitializers(this);
					return get.call(this, key);
				},
				set: function (this: MobxExtendedObject, v: any) {
					if (this.__mobxDidRunLazyInitializers !== true)
						runLazyInitializers(this);
					set.call(this, key, v);
				}
			};
		}
	}

	if (allowCustomArguments) {
		/** If custom arguments are allowed, we should return a function that returns a decorator */
		return function () {
			/** Direct invocation: @decorator bla */
			if (quacksLikeADecorator(arguments))
				return classPropertyDecorator.apply(null, arguments);
			/** Indirect invocation: @decorator(args) bla */
			const outerArgs = arguments;
			const argLen = arguments.length;
			return (target: MobxExtendedObject, key: string, descriptor: BabelPropertyDescriptor) => classPropertyDecorator(target, key, descriptor, outerArgs, argLen);
		};
	}
	return classPropertyDecorator;
}

function typescriptInitializeProperty(instance: MobxExtendedObject, key: string, v: any, onInitialize: PropertyInitializer, customArgs?: IArguments, baseDescriptor?: BabelPropertyDescriptor) {
	if (!hasOwnProperty(instance, "__mobxInitializedProps"))
		addHiddenProp(instance, "__mobxInitializedProps", {});
	instance.__mobxInitializedProps[key] = true;
	onInitialize(instance, key, v, customArgs, baseDescriptor);
}

export function runLazyInitializers(instance: MobxExtendedObject) {
	if (instance.__mobxDidRunLazyInitializers === true)
		return;
	if (instance.__mobxLazyInitializers) {
		addHiddenProp(instance, "__mobxDidRunLazyInitializers", true);
		instance.__mobxDidRunLazyInitializers && instance.__mobxLazyInitializers.forEach(initializer => initializer(instance));
	}
}

function quacksLikeADecorator(args: IArguments): boolean {
	return (args.length === 2 || args.length === 3) && typeof args[1] === "string";
}
