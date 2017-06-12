import { IDerivation } from "../core/derivation";
import { invariant } from "../utils/utils";
import { untrackedStart, untrackedEnd } from "../core/derivation";
import { startBatch, endBatch } from "../core/observable";
import { isSpyEnabled, spyReportStart, spyReportEnd } from "../core/spy";
import { globalState } from "../core/globalstate";
import { getMessage } from "../utils/messages";

export interface IAction {
	(...args: any[]): any;
	originalFn: Function
	isMobxAction: boolean
}

export function createAction(actionName: string, fn: Function): IAction {
	invariant(typeof fn === "function", getMessage("m026"));
	invariant(typeof actionName === "string" && actionName.length > 0, `actions should have valid names, got: '${actionName}'`);
	// A TypeScript way to return an union type with Function.
	return Object.assign(function (this: object) {
		return executeAction(actionName, fn, this, arguments);
	}, { originalFn: fn, isMobxAction: true });
}

export function executeAction(actionName: string, fn: Function, scope?: any, args?: IArguments) {
	const runInfo = startAction(actionName, fn, scope, args);
	let sync = true;
	try {
		let retval = fn.apply(scope, args);
		if (retval instanceof Promise) {
			sync = false;
			retval = retval.then(result => {
				endAction(runInfo);
				return result;
			}, err => {
				endAction(runInfo);
				throw err;
			});
		}
		return retval;
	}
	finally {
		if (sync)
			endAction(runInfo);
	}
}

interface IActionRunInfo {
	prevDerivation: IDerivation | null;
	prevAllowStateChanges: boolean;
	notifySpy: boolean;
	startTime: number;
}

function startAction(actionName: string, fn: Function, scope: any, args?: IArguments): IActionRunInfo {
	const notifySpy = isSpyEnabled() && !!actionName;
	let startTime: number = 0;
	if (notifySpy) {
		startTime = Date.now();
		const l = (args && args.length) || 0;
		const flattendArgs = new Array(l);
		if (l > 0) for (let i = 0; i < l; i++)
			flattendArgs[i] = args![i];
		spyReportStart({
			type: "action",
			name: actionName,
			fn,
			object: scope,
			arguments: flattendArgs
		});
	}
	const prevDerivation = untrackedStart();
	startBatch();
	const prevAllowStateChanges = allowStateChangesStart(true);
	return {
		prevDerivation,
		prevAllowStateChanges,
		notifySpy,
		startTime
	};
}

function endAction(runInfo: IActionRunInfo) {
	allowStateChangesEnd(runInfo.prevAllowStateChanges);
	endBatch();
	untrackedEnd(runInfo.prevDerivation);
	if (runInfo.notifySpy)
		spyReportEnd({ time: Date.now() - runInfo.startTime });
}

export function useStrict(strict: boolean): any {
	invariant(globalState.trackingDerivation === null, getMessage("m028"));
	globalState.strictMode = strict;
	globalState.allowStateChanges = !strict;
}

export function isStrictModeEnabled(): boolean {
	return globalState.strictMode;
}

export function allowStateChanges<T>(allowStateChanges: boolean, func: () => T): T {
	// TODO: deprecate / refactor this function in next major
	// Currently only used by `@observer`
	// Proposed change: remove first param, rename to `forbidStateChanges`,
	// require error callback instead of the hardcoded error message now used
	// Use `inAction` instead of allowStateChanges in derivation.ts to check strictMode
	const prev = allowStateChangesStart(allowStateChanges);
	let res;
	try {
		res = func();
	} finally {
		allowStateChangesEnd(prev);
	}
	return res;
}

export function allowStateChangesStart(allowStateChanges: boolean) {
	const prev = globalState.allowStateChanges;
	globalState.allowStateChanges = allowStateChanges;
	return prev;
}

export function allowStateChangesEnd(prev: boolean) {
	globalState.allowStateChanges = prev;
}
