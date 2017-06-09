import { ComputedValue } from "../core/computedvalue";
import { invariant, getNextId, addHiddenProp } from "../utils/utils";
import { globalState } from "../core/globalstate";

export type ITransformer<A, B> = (object: A) => B;

export function createTransformer<A, B>(transformer: ITransformer<A, B>, onCleanup?: (resultObject: B | undefined, sourceObject?: A) => void): ITransformer<A, B> {
	invariant(typeof transformer === "function" && transformer.length < 2, "createTransformer expects a function that accepts one argument");

	// Memoizes: object id -> reactive view that applies transformer to the object
	let objectCache: { [id: string]: ComputedValue<B> } = {};

	// If the resetId changes, we will clear the object cache, see #163
	// This construction is used to avoid leaking refs to the objectCache directly
	let resetId = globalState.resetId;

	// Local transformer class specifically for this transformer
	class Transformer extends ComputedValue<B> {
		constructor(private sourceIdentifier: string, private sourceObject: A) {
			super(() => transformer(sourceObject), undefined, false, `Transformer-${(<any>transformer).name}-${sourceIdentifier}`, undefined);
		}
		onBecomeUnobserved() {
			const lastValue = this.value;
			super.onBecomeUnobserved();
			delete objectCache[this.sourceIdentifier];
			if (onCleanup)
				onCleanup(lastValue as any, this.sourceObject);
		}
	}

	return (object: A) => {
		if (resetId !== globalState.resetId) {
			objectCache = {};
			resetId = globalState.resetId;
		}

		const identifier = getMemoizationId(object);
		let reactiveTransformer = objectCache[identifier];
		if (reactiveTransformer)
			return reactiveTransformer.get();
		// Not in cache; create a reactive view
		reactiveTransformer = objectCache[identifier] = new Transformer(identifier, object);
		return reactiveTransformer.get();
	};
}

function getMemoizationId(object: any) {
	if (typeof object === 'string' || typeof object === 'number')
		return object
	if (object === null || typeof object !== "object")
		throw new Error("[mobx] transform expected some kind of object or primitive value, got: " + object);
	let tid = object.$transformId;
	if (tid === undefined) {
		tid = getNextId();
		addHiddenProp(object, "$transformId", tid);
	}
	return tid;
}
