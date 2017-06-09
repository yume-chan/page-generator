import { IDerivation, IDerivationState } from "./derivation";
import { globalState } from "./globalstate";
import { invariant } from "../utils/utils";
import { runReactions } from "./reaction";

export interface IDepTreeNode {
	name: string;
	observing?: IObservable[];
}

export interface IObservable extends IDepTreeNode {
	diffValue: number;
	/**
	 * Id of the derivation *run* that last accesed this observable.
	 * If this id equals the *run* id of the current derivation,
	 * the dependency is already established
	 */
	lastAccessedBy: number;

	lowestObserverState: IDerivationState; // Used to avoid redundant propagations
	isPendingUnobservation: boolean; // Used to push itself to global.pendingUnobservations at most once per batch.

	observers: IDerivation[]; // maintain _observers in raw array for for way faster iterating in propagation.
	observersIndexes: { [key: string]: number }; // map derivation.__mapid to _observers.indexOf(derivation) (see removeObserver)

	onBecomeUnobserved(): void;
}

export function hasObservers(observable: IObservable): boolean {
	return observable.observers && observable.observers.length > 0;
}

export function getObservers(observable: IObservable): IDerivation[] {
	return observable.observers;
}

function invariantObservers(observable: IObservable) {
	const list = observable.observers;
	const map = observable.observersIndexes;
	const l = list.length;
	for (let i = 0; i < l; i++) {
		const id = list[i].__mapid;
		if (i) {
			invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list"); // for performance
		} else {
			invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldnt be held in map."); // for performance
		}
	}
	invariant(list.length === 0 || Object.keys(map).length === list.length - 1, "INTERNAL ERROR there is no junk in map");
}
export function addObserver(observable: IObservable, node: IDerivation) {
	// invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
	// invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
	// invariantObservers(observable);

	const l = observable.observers.length;
	if (l) { // because object assignment is relatively expensive, let's not store data about index 0.
		observable.observersIndexes[node.__mapid] = l;
	}
	observable.observers[l] = node;

	if (observable.lowestObserverState > node.dependenciesState) observable.lowestObserverState = node.dependenciesState;

	// invariantObservers(observable);
	// invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didnt add node");
}

export function removeObserver(observable: IObservable, node: IDerivation) {
	// invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
	// invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
	// invariantObservers(observable);

	if (observable.observers.length === 1) {
		// deleting last observer
		observable.observers.length = 0;

		queueForUnobservation(observable);
	} else {
		// deleting from _observersIndexes is straight forward, to delete from _observers, let's swap `node` with last element
		const list = observable.observers;
		const map = observable.observersIndexes;
		const filler = list.pop()!; // get last element, which should fill the place of `node`, so the array doesnt have holes
		if (filler !== node) { // otherwise node was the last element, which already got removed from array
			const index = map[node.__mapid] || 0; // getting index of `node`. this is the only place we actually use map.
			if (index) { // map store all indexes but 0, see comment in `addObserver`
				map[filler.__mapid] = index;
			} else {
				delete map[filler.__mapid];
			}
			list[index] = filler;
		}
		delete map[node.__mapid];
	}
	// invariantObservers(observable);
	// invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}

export function queueForUnobservation(observable: IObservable) {
	if (!observable.isPendingUnobservation) {
		// invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
		// invariant(observable._observers.length === 0, "INTERNAL ERROR, shuold only queue for unobservation unobserved observables");
		observable.isPendingUnobservation = true;
		globalState.pendingUnobservations.push(observable);
	}
}

/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export function startBatch() {
	globalState.inBatch++;
}

export function endBatch() {
	if (--globalState.inBatch === 0) {
		runReactions();
		// the batch is actually about to finish, all unobserving should happen here.
		const list = globalState.pendingUnobservations;
		for (let i = 0; i < list.length; i++) {
			const observable = list[i];
			observable.isPendingUnobservation = false;
			if (observable.observers.length === 0) {
				observable.onBecomeUnobserved();
				// NOTE: onBecomeUnobserved might push to `pendingUnobservations`
			}
		}
		globalState.pendingUnobservations = [];
	}
}

export function reportObserved(observable: IObservable) {
	const derivation = globalState.trackingDerivation;
	if (derivation !== null) {
		/**
		 * Simple optimization, give each derivation run an unique id (runId)
		 * Check if last time this observable was accessed the same runId is used
		 * if this is the case, the relation is already known
		 */
		if (derivation.runId !== observable.lastAccessedBy) {
			observable.lastAccessedBy = derivation.runId;
			derivation.newObserving![derivation.unboundDepsCount++] = observable;
		}
	} else if (observable.observers.length === 0) {
		queueForUnobservation(observable);
	}
}

function invariantLOS(observable: IObservable, msg: any) {
	// it's expensive so better not run it in produciton. but temporarily helpful for testing
	const min = getObservers(observable).reduce(
		(a, b) => Math.min(a, b.dependenciesState),
		2
	);
	if (min >= observable.lowestObserverState) return; // <- the only assumption about `lowestObserverState`
	throw new Error("lowestObserverState is wrong for " + msg + " because " + min + " < " + observable.lowestObserverState);
}

/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */

// Called by Atom when its value changes
export function propagateChanged(observable: IObservable) {
	// invariantLOS(observable, "changed start");
	if (observable.lowestObserverState === IDerivationState.STALE) return;
	observable.lowestObserverState = IDerivationState.STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.UP_TO_DATE)
			d.onBecomeStale();
		d.dependenciesState = IDerivationState.STALE;
	}
	// invariantLOS(observable, "changed end");
}

// Called by ComputedValue when it recalculate and its value changed
export function propagateChangeConfirmed(observable: IObservable) {
	// invariantLOS(observable, "confirmed start");
	if (observable.lowestObserverState === IDerivationState.STALE) return;
	observable.lowestObserverState = IDerivationState.STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.POSSIBLY_STALE)
			d.dependenciesState = IDerivationState.STALE;
		else if (d.dependenciesState === IDerivationState.UP_TO_DATE) // this happens during computing of `d`, just keep lowestObserverState up to date.
			observable.lowestObserverState = IDerivationState.UP_TO_DATE;
	}
	// invariantLOS(observable, "confirmed end");
}

// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
export function propagateMaybeChanged(observable: IObservable) {
	// invariantLOS(observable, "maybe start");
	if (observable.lowestObserverState !== IDerivationState.UP_TO_DATE) return;
	observable.lowestObserverState = IDerivationState.POSSIBLY_STALE;

	const observers = observable.observers;
	let i = observers.length;
	while (i--) {
		const d = observers[i];
		if (d.dependenciesState === IDerivationState.UP_TO_DATE) {
			d.dependenciesState = IDerivationState.POSSIBLY_STALE;
			d.onBecomeStale();
		}
	}
	// invariantLOS(observable, "maybe end");
}
