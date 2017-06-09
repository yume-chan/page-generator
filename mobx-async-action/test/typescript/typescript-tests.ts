/// <reference path='tape.d.ts' />
import {
    observe, computed, observable, autorun, autorunAsync, extendObservable, action,
    IObservableObject, IObservableArray, IArrayChange, IArraySplice, IObservableValue, isObservable, isObservableObject,
    extras, Atom, transaction, IObjectChange, spy, useStrict, isAction
} from "../../lib/mobx";
import * as test from 'tape';
import * as mobx from "../../lib/mobx";

var v = observable(3);
observe(v, () => {});

var a = observable([1,2,3]);

var testFunction = function(a:any) {};



class Order {
    @observable price:number = 3;
    @observable amount:number = 2;
    @observable orders:string[] = [];
    @observable aFunction = testFunction;

    @computed get total() {
        return this.amount * this.price * (1 + this.orders.length);
    }

    // Typescript classes cannot be defined inside functions,
    // but if the next line is enabled it should throw...
    // @observable hoepie() { return 3; }
}

test('decorators', function(t) {
	var o = new Order();
	t.equal(isObservableObject(o), true);
	t.equal(isObservable(o, 'amount'), true);
	t.equal(isObservable(o, 'total'), true);

	var events: any[] = [];
	var d1 = observe(o, (ev: IObjectChange) => events.push(ev.name, ev.oldValue));
	var d2 = observe(o, 'price', (ev) => events.push(ev.newValue, ev.oldValue));
	var d3 = observe(o, 'total', (ev) => events.push(ev.newValue, ev.oldValue));

	o.price = 4;

	d1();
	d2();
	d3();

	o.price = 5;

	t.deepEqual(events, [
		8, // new total
		6, // old total
		4, // new price
		3, // old price
		"price", // event name
		3, // event oldValue
	]);

	t.end();
})

test('observable', function(t) {
    var a = observable(3);
    var b = computed(() => a.get() * 2);
    t.equal(b.get(), 6);
    t.end();
})

test('annotations', function(t) {
    var order1totals:number[] = [];
    var order1 = new Order();
    var order2 = new Order();

    var disposer = autorun(() => {
        order1totals.push(order1.total)
    });

    order2.price = 4;
    order1.amount = 1;

    t.equal(order1.price, 3);
    t.equal(order1.total, 3);
    t.equal(order2.total, 8);
    order2.orders.push('bla');
    t.equal(order2.total, 16);

    order1.orders.splice(0,0,'boe', 'hoi');
    t.deepEqual(order1totals, [6,3,9]);

    disposer();
    order1.orders.pop();
    t.equal(order1.total, 6);
    t.deepEqual(order1totals, [6,3,9]);

    t.equal(order1.aFunction, testFunction);
    var x = function() { return 3; };
    order1.aFunction = x;
    t.equal(order1.aFunction, x);

    t.end();
})

test('scope', function(t) {
    var x = observable({
        y: 3,
        // this wo't work here.
        get z () {
			return 2 * this.y
		}
    });

    t.equal(x.z, 6);
    x.y = 4;
    t.equal(x.z, 8);

    interface IThing {
        z: number;
        y: number;
    }

    const Thing = function() {
        extendObservable(this, {
            y: 3,
            // this will work here
            z: computed(() => 2 * this.y)
        });
    }

    var x3: IThing = new (<any>Thing)();
    t.equal(x3.z, 6);
    x3.y = 4;
    t.equal(x3.z, 8);

    t.end();
})

test('typing', function(t) {
    var ar:IObservableArray<number> = observable([1,2]);
    ar.observe((d:IArrayChange<number>|IArraySplice<number>) => {
        console.log(d.type);
    });

    var ar2:IObservableArray<number> = observable([1,2]);
    ar2.observe((d:IArrayChange<number>|IArraySplice<number>) => {
        console.log(d.type);
    });

    var x:IObservableValue<number> = observable(3);

    var d2 = autorunAsync(function() {

    });

    t.end();
})

const state:any = observable({
    authToken: null
});


test('issue8', function(t){
	t.throws(() => {
		class LoginStoreTest {
			loggedIn2: boolean;
			constructor() {
				extendObservable(this, {
					loggedIn2: () => !!state.authToken
				});
			}

			@observable get loggedIn() {
				return !!state.authToken;
			}
		}
		const store = new LoginStoreTest();
	}, /@computed/);
    t.end();
})

class Box {
    @observable uninitialized:any;
    @observable height = 20;
    @observable sizes = [2];
    @observable someFunc = function () { return 2; }
    @computed get width() {
        return this.height * this.sizes.length * this.someFunc() * (this.uninitialized ? 2 : 1);
    }
}

test('box', function(t) {
    var box = new Box();

    var ar:number[] = []

    autorun(() => {
        ar.push(box.width);
    });

    t.deepEqual(ar.slice(), [40]);
    box.height = 10;
    t.deepEqual(ar.slice(), [40, 20]);
    box.sizes.push(3, 4);
    t.deepEqual(ar.slice(), [40, 20, 60]);
    box.someFunc = () => 7;
    t.deepEqual(ar.slice(), [40, 20, 60, 210]);
    box.uninitialized = true;
    t.deepEqual(ar.slice(), [40, 20, 60, 210, 420]);

    t.end();
})

test('computed setter should succeed', function(t) {
	class Bla {
		@observable a = 3;
		@computed get propX() {
			return this.a * 2;
		}
		set propX(v) {
			this.a = v
		}
	}

	const b = new Bla();
	t.equal(b.propX, 6);
	b.propX = 4;
	t.equal(b.propX, 8);

	t.end();
});

test('atom clock example', function(t) {
	let ticks = 0;
	const time_factor = 500; // speed up / slow down tests

	class Clock {
		atom: Atom;
		intervalHandler: number = null;
		currentDateTime: string;

		constructor() {
			console.log("create");
			// creates an atom to interact with the mobx core algorithm
			this.atom =	new Atom(
				// first param a name for this atom, for debugging purposes
				"Clock",
				// second (optional) parameter: callback for when this atom transitions from unobserved to observed.
				() => this.startTicking(),
				// third (optional) parameter: callback for when this atom transitions from observed to unobserved
				// note that the same atom transition multiple times between these two states
				() => this.stopTicking()
			);
		}

		getTime() {
			console.log("get time");
			// let mobx now this observable data source has been used
			this.atom.reportObserved(); // will trigger startTicking and thus tick
			return this.currentDateTime;
		}

		tick() {
			console.log("tick");
			ticks++;
			this.currentDateTime = new Date().toString();
			this.atom.reportChanged();
		}

		startTicking() {
			console.log("start ticking");
			this.tick();
			// The cast to any here is to force TypeScript to select the correct
			// overload of setInterval: the one that returns number, as opposed
			// to the one defined in @types/node
			this.intervalHandler = setInterval(() => this.tick(), (1 * time_factor) as any);
		}

		stopTicking() {
			console.log("stop ticking");
			clearInterval(this.intervalHandler);
			this.intervalHandler = null;
		}
	}

	const clock = new Clock();

	const values: string[] = [];

	// ... prints the time each second
	const disposer = autorun(() => {
		values.push(clock.getTime());
		console.log(clock.getTime());
	});

	// printing stops. If nobody else uses the same `clock` the clock will stop ticking as well.
	setTimeout(disposer, 4.5 * time_factor);

	setTimeout(() => {
		t.equal(ticks, 5);
		t.equal(values.length, 5);
		t.equal(values.filter(x => x.length > 0).length, 5);
		t.end();
	}, 10 * time_factor);

});

test('typescript: parameterized computed decorator', (t) => {
	class TestClass {
		@observable x = 3;
		@observable y = 3;
		@computed.struct get boxedSum() {
			return { sum: Math.round(this.x) + Math.round(this.y) };
		}
	}

	const t1 = new TestClass();
	const changes: { sum: number}[] = [];
	const d = autorun(() => changes.push(t1.boxedSum));

	t1.y = 4; // change
	t.equal(changes.length, 2);
	t1.y = 4.2; // no change
	t.equal(changes.length, 2);
	transaction(() => {
		t1.y = 3;
		t1.x = 4;
	}); // no change
	t.equal(changes.length, 2);
	t1.x = 6; // change
	t.equal(changes.length, 3);
	d();

	t.deepEqual(changes, [{ sum: 6 }, { sum: 7 }, { sum: 9 }]);

	t.end();
});

test('issue 165', function(t) {
	function report<T>(msg: string, value: T) {
		console.log(msg, ':', value);
		return value;
	}

	class Card {
		constructor(public game: Game, public id: number) {
		}

		@computed get isWrong() {
			return report('Computing isWrong for card ' + this.id, this.isSelected && this.game.isMatchWrong);
		}

		@computed get isSelected() {
			return report('Computing isSelected for card'+ this.id,
				this.game.firstCardSelected === this || this.game.secondCardSelected === this);
		}
	}

	class Game {
		@observable firstCardSelected: Card = null;
		@observable secondCardSelected: Card = null;

		@computed get isMatchWrong() {
			return report('Computing isMatchWrong',
				this.secondCardSelected !== null && this.firstCardSelected.id !== this.secondCardSelected.id);
		}
	}

	let game = new Game();
	let card1 = new Card(game, 1), card2 = new Card(game, 2);

	autorun(() => {
		console.log('card1.isWrong =', card1.isWrong);
		console.log('card2.isWrong =', card2.isWrong);
		console.log('------------------------------');
	});

	console.log('Selecting first card');
	game.firstCardSelected = card1;
	console.log('Selecting second card');
	game.secondCardSelected = card2;

	t.equal(card1.isWrong, true);
	t.equal(card2.isWrong, true);

	t.end();
});

test('issue 191 - shared initializers (ts)', function(t) {
	class Test {
		@observable obj = { a: 1 };
		@observable array = [2];
	}

	var t1 = new Test();
	t1.obj.a = 2;
	t1.array.push(3);

	var t2 = new Test();
	t2.obj.a = 3;
	t2.array.push(4);

	t.notEqual(t1.obj, t2.obj);
	t.notEqual(t1.array, t2.array);
	t.equal(t1.obj.a, 2);
	t.equal(t2.obj.a, 3);

	t.deepEqual(t1.array.slice(), [2,3]);
	t.deepEqual(t2.array.slice(), [2,4]);

	t.end();
});

function normalizeSpyEvents(events: any[]) {
	events.forEach(ev => {
		delete ev.fn;
		delete ev.time;
	});
	return events;
}

test("action decorator (typescript)", function(t) {
	class Store {
		constructor(private multiplier: number) {}

		@action
		add(a: number, b: number): number {
			return (a + b) * this.multiplier;
		}
	}

	const store1 =  new Store(2);
	const store2 = new Store(3);
	const events: any[] = [];
	const d = spy(events.push.bind(events));
	t.equal(store1.add(3, 4), 14);
	t.equal(store2.add(2, 2), 12);
	t.equal(store1.add(1, 1), 4);

	t.deepEqual(normalizeSpyEvents(events),	[
		{ arguments: [ 3, 4 ], name: "add", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 2, 2 ], name: "add", spyReportStart: true, object: store2, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 1, 1 ], name: "add", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true }
	]);

	d();
	t.end();
});

test("custom action decorator (typescript)", function(t) {
	class Store {
		constructor(private multiplier: number) {}

		@action("zoem zoem")
		add(a: number, b: number): number {
			return (a + b) * this.multiplier;
		}
	}

	const store1 =  new Store(2);
	const store2 =  new Store(3);
	const events: any[] = [];
	const d = spy(events.push.bind(events));
	t.equal(store1.add(3, 4), 14);
	t.equal(store2.add(2, 2), 12);
	t.equal(store1.add(1, 1), 4);

	t.deepEqual(normalizeSpyEvents(events),	[
		{ arguments: [ 3, 4 ], name: "zoem zoem", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 2, 2 ], name: "zoem zoem", spyReportStart: true, object: store2, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 1, 1 ], name: "zoem zoem", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true }
	]);

	d();
	t.end();
});

test("action decorator on field (typescript)", function(t) {
	class Store {
		constructor(private multiplier: number) {}

		@action
		add = (a: number, b: number) => {
			return (a + b) * this.multiplier;
		};
	}

	const store1 = new Store(2);
	const store2 = new Store(7);

	const events: any[] = [];
	const d = spy(events.push.bind(events));
	t.equal(store1.add(3, 4), 14);
	t.equal(store2.add(4, 5), 63);
	t.equal(store1.add(2, 2), 8);

	t.deepEqual(normalizeSpyEvents(events),	[
		{ arguments: [ 3, 4 ], name: "add", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 4, 5 ], name: "add", spyReportStart: true, object: store2, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 2, 2 ], name: "add", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true }
	]);

	d();
	t.end();
});

test("custom action decorator on field (typescript)", function(t) {
	class Store {
		constructor(private multiplier: number) {}

		@action("zoem zoem")
		add = (a: number, b: number) => {
			return (a + b) * this.multiplier;
		};
	}

	const store1 = new Store(2);
	const store2 = new Store(7);

	const events: any[] = [];
	const d = spy(events.push.bind(events));
	t.equal(store1.add(3, 4), 14);
	t.equal(store2.add(4, 5), 63);
	t.equal(store1.add(2, 2), 8);

	t.deepEqual(normalizeSpyEvents(events),	[
		{ arguments: [ 3, 4 ], name: "zoem zoem", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 4, 5 ], name: "zoem zoem", spyReportStart: true, object: store2, type: "action" },
		{ spyReportEnd: true },
		{ arguments: [ 2, 2 ], name: "zoem zoem", spyReportStart: true, object: store1, type: "action" },
		{ spyReportEnd: true }
	]);

	d();
	t.end();
});

test("267 (typescript) should be possible to declare properties observable outside strict mode", t => {
	useStrict(true);

	class Store {
		@observable timer: number;
	}

	useStrict(false);
	t.end();
});

test("288 atom not detected for object property", t => {
	class Store {
		@observable foo = '';
	}

	const store = new Store();

	mobx.observe(store, 'foo', () => {
		console.log('Change observed');
	}, true);

	t.end()
})

test("observable performance", t => {
	const AMOUNT = 100000;

	class A {
		@observable a = 1;
		@observable b = 2;
		@observable c = 3;
		@computed get d() {
			return this.a + this.b + this.c;
		}
	}

	const objs: any[] = [];
	const start = Date.now();

	for (var i = 0; i < AMOUNT; i++)
		objs.push(new A());

	console.log("created in ", Date.now() - start);

	for (var j = 0; j < 4; j++) {
		for (var i = 0; i < AMOUNT; i++) {
			const obj = objs[i]
			obj.a += 3;
			obj.b *= 4;
			obj.c = obj.b - obj.a;
			obj.d;
		}
	}

	console.log("changed in ", Date.now() - start);

	t.end();
})

test("unbound methods", t => {
	class A {
		// shared across all instances
		@action m1() {

		}

		// per instance
		@action m2 = () => {};
	}

	const a1 = new A();
	const a2 = new A();

	t.equal(a1.m1, a2.m1);
	t.notEqual(a1.m2, a2.m2);
	t.equal(a1.hasOwnProperty("m1"), false);
	t.equal(a1.hasOwnProperty("m2"), true);
	t.equal(a2.hasOwnProperty("m1"), false);
	t.equal(a2.hasOwnProperty("m2"), true);
	t.end();

})

test("inheritance", t => {
	class A {
		@observable a = 2;
	}

	class B extends A {
		@observable b = 3;
		@computed get c() {
			return this.a + this.b;
		}
	}

	const b1 = new B();
	const b2 = new B();
	const values: any[] = []
	mobx.autorun(() => values.push(b1.c + b2.c));

	b1.a = 3;
	b1.b = 4;
	b2.b = 5;
	b2.a = 6;

	t.deepEqual(values, [
		10,
		11,
		12,
		14,
		18
	])

	t.end();
})

test("inheritance overrides observable", t => {
	class A {
		@observable a = 2;
	}

	class B {
		@observable a = 5;
		@observable b = 3;
		@computed get c() {
			return this.a + this.b;
		}
	}

	const b1 = new B();
	const b2 = new B();
	const values: any[] = []
	mobx.autorun(() => values.push(b1.c + b2.c));

	b1.a = 3;
	b1.b = 4;
	b2.b = 5;
	b2.a = 6;

	t.deepEqual(values, [
		16,
		14,
		15,
		17,
		18
	])

	t.end();
})

test("reusing initializers", t => {
	class A {
		@observable a = 3;
		@observable b = this.a + 2;
		@computed get c() {
			return this.a + this.b;
		}
		@computed get d() {
			return this.c + 1;
		}
	}

	const a = new A();
	const values: any[] = [];
	mobx.autorun(() => values.push(a.d));

	a.a = 4;
	t.deepEqual(values, [
		9,
		10
	])

	t.end();
})

test("enumerability", t => {
	class A {
		@observable a = 1; // enumerable, on proto
		@computed get b () { return this.a } // non-enumerable, on proto
		@action m() {} // non-enumerable, on proto
		@action m2 = () => {}; // non-enumerable, on self
	}

	const a = new A();

	// not initialized yet
	let ownProps = Object.keys(a);
	let props: string[] = [];
	for (var key in a)
		props.push(key);

	t.deepEqual(ownProps, [
		"a" // yeej!
	]);

	t.deepEqual(props, [ // also 'a' would be ok
		"a"
	]);

	t.equal("a" in a, true);
	t.equal(a.hasOwnProperty("a"), true);
	t.equal(a.hasOwnProperty("b"), false);
	t.equal(a.hasOwnProperty("m"), false);
	t.equal(a.hasOwnProperty("m2"), true);

	t.equal(mobx.isAction(a.m), true);
	t.equal(mobx.isAction(a.m2), true);

	// after initialization
	a.a;
	a.b;
	a.m;
	a.m2;

	ownProps = Object.keys(a);
	props = [];
	for (var key in a)
		props.push(key);

	t.deepEqual(ownProps, [
		"a"
	]);

	t.deepEqual(props, [
		"a"
	]);

	t.equal("a" in a, true);
	t.equal(a.hasOwnProperty("a"), true);
	t.equal(a.hasOwnProperty("b"), false);
	t.equal(a.hasOwnProperty("m"), false);
	t.equal(a.hasOwnProperty("m2"), true);


	t.end();
})

test("issue 285 (babel)", t => {
	const {observable, toJS} = mobx;

	class Todo {
		id = 1;
		@observable title: string;
		@observable finished = false;
		@observable childThings = [1,2,3];
		constructor(title: string) {
			this.title = title;
		}
	}

	var todo = new Todo("Something to do");

	t.deepEqual(toJS(todo), {
		id: 1,
		title: "Something to do",
		finished: false,
		childThings: [1,2,3]
	})

	t.end();
})

test("verify object assign (typescript)", t => {
	class Todo {
		@observable title = "test";
		@computed get upperCase() {
			return this.title.toUpperCase()
		}
	}

	t.deepEqual((Object as any).assign({}, new Todo()), {
		title: "test"
	});
	t.end();
})


test("379, inheritable actions (typescript)", t => {
	class A {
		@action method() {
			return 42;
		}
	}

	class B extends A {
		@action method() {
			return super.method() * 2
		}
	}

	class C extends B {
		@action method() {
			return super.method() + 3
		}
	}

	const b = new B()
	t.equal(b.method(), 84)
	t.equal(isAction(b.method), true)

	const a = new A()
	t.equal(a.method(), 42)
	t.equal(isAction(a.method), true)

	const c = new C()
	t.equal(c.method(), 87)
	t.equal(isAction(c.method), true)

	t.end()
})


test("379, inheritable actions - 2 (typescript)", t => {
	class A {
		@action("a method") method() {
			return 42;
		}
	}

	class B extends A {
		@action("b method") method() {
			return super.method() * 2
		}
	}

	class C extends B {
		@action("c method") method() {
			return super.method() + 3
		}
	}

	const b = new B()
	t.equal(b.method(), 84)
	t.equal(isAction(b.method), true)

	const a = new A()
	t.equal(a.method(), 42)
	t.equal(isAction(a.method), true)

	const c = new C()
	t.equal(c.method(), 87)
	t.equal(isAction(c.method), true)

	t.end()
})

test("373 - fix isObservable for unused computed", t => {
	class Bla {
		@computed get computedVal() { return 3 }
		constructor() {
			t.equal(isObservable(this, "computedVal"), true)
			this.computedVal;
			t.equal(isObservable(this, "computedVal"), true)
		}
	}

	new Bla();
	t.end();
})

test("505, don't throw when accessing subclass fields in super constructor (typescript)", t => {
	const values: any = { }
	class A {
		@observable a = 1
		constructor() {
			values.b = (this as any)['b']
			values.a = this.a
		}
	}

	class B extends A {
		@observable b = 2
	}

	new B()
	t.deepEqual(values, { a: 1, b: undefined}) // undefined, as A constructor runs before B constructor
	t.end()
})


test('computed getter / setter for plan objects should succeed (typescript)', function(t) {
	const b = observable({
		a: 3,
		get propX() { return this.a * 2 },
		set propX(v) { this.a = v }
	})

	const values: number[] = []
	mobx.autorun(() => values.push(b.propX))
	t.equal(b.propX, 6);
	b.propX = 4;
	t.equal(b.propX, 8);

	t.deepEqual(values, [6, 8])
	t.end()
})

test("484 - observable objects are IObservableObject", t => {
	const needs_observable_object = (o: IObservableObject): any => null;
	const o = observable({stuff: "things"});

	needs_observable_object(o);
	t.pass();
	t.end();
});

test("484 - observable objects are still type T", t => {
	const o = observable({stuff: "things"});
	o.stuff = "new things";
	t.pass();
	t.end();
});

test("484 - isObservableObject type guard includes type T", t => {
	const o = observable({stuff: "things"});
	if(isObservableObject(o)) {
		o.stuff = "new things";
		t.pass();
	} else {
		t.fail("object should have been observable");
	}
	t.end();
});

test("484 - isObservableObject type guard includes type IObservableObject", t => {
	const requires_observable_object = (o: IObservableObject): void => null;
	const o = observable({stuff: "things"});

	if(isObservableObject(o)) {
		requires_observable_object(o);
		t.pass();
	} else {
		t.fail("object should have been IObservableObject");
	}
	t.end();
});

test("705 - setter undoing caching (typescript)", t => {
	let recomputes = 0;
	let autoruns = 0;

	class Person {
		@observable name: string;
		@observable title: string;

		// Typescript bug: if fullName is before the getter, the property is defined twice / incorrectly, see #705
		// set fullName(val) {
		// 	// Noop
		// }
		@computed get fullName() {
			recomputes++;
			return this.title+" "+this.name;
		}
		// Should also be possible to define the setter _before_ the fullname
		set fullName(val) {
			// Noop
		}
	}

	let p1 = new Person();
	p1.name="Tom Tank";
	p1.title="Mr.";

	t.equal(recomputes, 0);
	t.equal(autoruns, 0);

	const d1 = autorun(()=> {
		autoruns++;
		p1.fullName;
	})

	const d2 = autorun(()=> {
		autoruns++;
		p1.fullName;
	})

	t.equal(recomputes, 1);
	t.equal(autoruns, 2);

	p1.title="Master";
	t.equal(recomputes, 2);
	t.equal(autoruns, 4);

	d1();
	d2();
	t.end();
})

test("@observable.ref (TS)", t => {
	class A {
		@observable.ref ref = { a: 3}
	}

	const a = new A();
	t.equal(a.ref.a, 3);
	t.equal(mobx.isObservable(a.ref), false);
	t.equal(mobx.isObservable(a, "ref"), true);

	t.end();
})

test("@observable.shallow (TS)", t => {
	class A {
		@observable.shallow arr = [{ todo: 1 }]
	}

	const a = new A();
	const todo2 = { todo: 2 };
	a.arr.push(todo2)
	t.equal(mobx.isObservable(a.arr), true);
	t.equal(mobx.isObservable(a, "arr"), true);
	t.equal(mobx.isObservable(a.arr[0]), false);
	t.equal(mobx.isObservable(a.arr[1]), false);
	t.ok(a.arr[1] === todo2)

	t.end();
})


test("@observable.deep (TS)", t => {
	class A {
		@observable.deep arr = [{ todo: 1 }]
	}

	const a = new A();
	const todo2 = { todo: 2 };
	a.arr.push(todo2)

	t.equal(mobx.isObservable(a.arr), true);
	t.equal(mobx.isObservable(a, "arr"), true);
	t.equal(mobx.isObservable(a.arr[0]), true);
	t.equal(mobx.isObservable(a.arr[1]), true);
	t.ok(a.arr[1] !== todo2)
	t.equal(isObservable(todo2), false);

	t.end();
})

test("action.bound binds (TS)", t=> {
	class A {
		@observable x = 0;
		@action.bound
		inc(value: number) {
			this.x += value;
		}
	}

	const a = new A();
	const runner = a.inc;
	runner(2);

	t.equal(a.x, 2);

	t.end();
})

test("803 - action.bound and action preserve type info", t => {
	function thingThatAcceptsCallback(cb: (elem: { x: boolean }) => void) {

	}

	thingThatAcceptsCallback((elem) => {
		console.log(elem.x) // x is boolean
	})

	thingThatAcceptsCallback(action((elem: any) => { // TODO: ideally, type of action would be inferred!
		console.log(elem.x) // x is boolean
	}))

	const bound = action.bound(() => {
		return { x: "3"} as Object
	}) as () => void

	const bound2 = action.bound(function () {}) as (() => void)
	t.end()
})
