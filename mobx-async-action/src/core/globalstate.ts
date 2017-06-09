import { getGlobal } from "../utils/utils";
import { IDerivation, CaughtException } from "./derivation";
import { Reaction } from "./reaction";
import { IObservable } from "./observable";

/**
 * These values will persist if global state is reset
 */
const persistentKeys = ["mobxGuid", "resetId", "spyListeners", "strictMode", "runId"];

export class MobXGlobals {
	/**
	 * MobXGlobals version.
	 * MobX compatiblity with other versions loaded in memory as long as this version matches.
	 * It indicates that the global state still stores similar information
	 */
	version = 5;

	/**
	 * Currently running derivation
	 */
	trackingDerivation: IDerivation | null = null;

	/**
	 * Are we running a computation currently? (not a reaction)
	 */
	computationDepth = 0;

	/**
	 * Each time a derivation is tracked, it is assigned a unique run-id
	 */
	runId = 0;

	/**
	 * 'guid' for general purpose. Will be persisted amongst resets.
	 */
	mobxGuid = 0;

	/**
	 * Are we in a batch block? (and how many of them)
	 */
	inBatch: number = 0;

	/**
	 * Observables that don't have observers anymore, and are about to be
	 * suspended, unless somebody else accesses it in the same batch
	 *
	 * @type {IObservable[]}
	 */
	pendingUnobservations: IObservable[] = [];

	/**
	 * List of scheduled, not yet executed, reactions.
	 */
	pendingReactions: Reaction[] = [];

	/**
	 * Are we currently processing reactions?
	 */
	isRunningReactions = false;

	/**
	 * Is it allowed to change observables at this point?
	 * In general, MobX doesn't allow that when running computations and React.render.
	 * To ensure that those functions stay pure.
	 */
	allowStateChanges = true;
	/**
	 * If strict mode is enabled, state changes are by default not allowed
	 */
	strictMode = false;

	/**
	 * Used by createTransformer to detect that the global state has been reset.
	 */
	resetId = 0;

	/**
	 * Spy callbacks
	 */
	spyListeners: { (change: any): void }[] = [];

	/**
	 * Globally attached error handlers that react specifically to errors in reactions
	 */
	globalReactionErrorHandlers: ((error: any, derivation: IDerivation) => void)[] = [];

	[key: string]: any;
}

export let globalState: MobXGlobals = new MobXGlobals();

export function shareGlobalState() {
	const global = getGlobal();
	const ownState = globalState;

	/**
	 * Backward compatibility check
	 */
	if (global.__mobservableTrackingStack || global.__mobservableViewStack)
		throw new Error("[mobx] An incompatible version of mobservable is already loaded.");
	if (global.__mobxGlobal && global.__mobxGlobal.version !== ownState.version)
		throw new Error("[mobx] An incompatible version of mobx is already loaded.");
	if (global.__mobxGlobal)
		globalState = global.__mobxGlobal;
	else
		global.__mobxGlobal = ownState;
}

export function getGlobalState(): any {
	return globalState;
}

export function registerGlobals() {
	// no-op to make explicit why this file is loaded
}

/**
 * For testing purposes only; this will break the internal state of existing observables,
 * but can be used to get back at a stable state after throwing errors
 */
export function resetGlobalState() {
	globalState.resetId++;
	const defaultGlobals = new MobXGlobals();
	for (let key in defaultGlobals)
		if (persistentKeys.indexOf(key) === -1)
			globalState[key] = defaultGlobals[key];
	globalState.allowStateChanges = !globalState.strictMode;
}
