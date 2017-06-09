"use strict"

var test = require('tape');
var mobx = require('..');
var m = mobx;
var observable = mobx.observable;
var computed = mobx.computed;
var transaction = mobx.transaction;

var voidObserver = function(){};

function buffer() {
    var b = [];
    var res = function(x) {
        b.push(x.newValue);
    };
    res.toArray = function() {
        return b;
    }
    return res;
}

test('argumentless observable', t => {
	var a = observable();

	t.equal(m.isObservable(a), true);
	t.equal(a.get(), undefined);

	t.end();
})

test('basic', function(t) {
    var x = observable(3);
    var b = buffer();
    m.observe(x, b);
    t.equal(3, x.get());

    x.set(5);
    t.equal(5, x.get());
    t.deepEqual([5], b.toArray());
    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('basic2', function(t) {
    var x = observable(3);
    var z = computed(function () { return x.get() * 2});
    var y = computed(function () { return x.get() * 3});

    m.observe(z, voidObserver);

    t.equal(z.get(), 6);
    t.equal(y.get(), 9);

    x.set(5);
    t.equal(z.get(), 10);
    t.equal(y.get(), 15);

    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('computed with asStructure modifier', function(t) {
    try {
        var x1 = observable(3);
        var x2 = observable(5);
        var y = m.computed(function() {
            return {
              sum: x1.get() + x2.get()
            }
        }, { struct: true });
        var b = buffer();
        m.observe(y, b, true);

        t.equal(8, y.get().sum);

        x1.set(4);
        t.equal(9, y.get().sum);

        m.transaction(function() {
          // swap values, computation results is structuraly unchanged
          x1.set(5);
          x2.set(4);
        })

        t.deepEqual(b.toArray(), [{sum: 8}, {sum: 9}]);
        t.equal(mobx.extras.isComputingDerivation(), false);

        t.end();
    }
    catch(e) {
        console.log(e.stack);
    }
})

test('dynamic', function(t) {
    try {
        var x = observable(3);
        var y = m.computed(function() {
            return x.get();
        });
        var b = buffer();
        m.observe(y, b, true);

        t.equal(3, y.get()); // First evaluation here..

        x.set(5);
        t.equal(5, y.get());

        t.deepEqual(b.toArray(), [3, 5]);
        t.equal(mobx.extras.isComputingDerivation(), false);

        t.end();
    }
    catch(e) {
        console.log(e.stack);
    }
})

test('dynamic2', function(t) {
    try {
        var x = observable(3);
        var y = computed(function() {
            return x.get() * x.get();
        });

        t.equal(9, y.get());
        var b = buffer();
        m.observe(y, b);

        x.set(5);
        t.equal(25, y.get());

        //no intermediate value 15!
        t.deepEqual([25], b.toArray());
        t.equal(mobx.extras.isComputingDerivation(), false);

        t.end();
    }
    catch(e) {
        console.log(e.stack);
    }
})

test('readme1', function(t) {
    try {
        var b = buffer();

        var vat = observable(0.20);
        var order = {};
        order.price = observable(10);
        // Prints: New price: 24
        //in TS, just: value(() => this.price() * (1+vat()))
        order.priceWithVat = computed(function() {
            return order.price.get() * (1 + vat.get());
        });

        m.observe(order.priceWithVat, b);

        order.price.set(20);
        t.deepEqual([24],b.toArray());
        order.price.set(10);
        t.deepEqual([24,12],b.toArray());
        t.equal(mobx.extras.isComputingDerivation(), false);

        t.end();
    } catch (e) {
        console.log(e.stack); throw e;
    }
})

test('batch', function(t) {
    var a = observable(2);
    var b = observable(3);
    var c = computed(function() { return a.get() * b.get() });
    var d = computed(function() { return c.get() * b.get() });
    var buf = buffer();
    m.observe(d, buf);

    a.set(4);
    b.set(5);
    // Note, 60 should not happen! (that is d beign computed before c after update of b)
    t.deepEqual(buf.toArray(), [36, 100]);

    var x = mobx.transaction(function() {
        a.set(2);
        b.set(3);
        a.set(6);
        t.equal(d.value, 100); // not updated; in transaction
        t.equal(d.get(), 54); // consistent due to inspection
        return 2;
    });

    t.equal(x, 2); // test return value
    t.deepEqual(buf.toArray(), [36, 100, 54]);// only one new value for d
    t.end();
})

test('transaction with inspection', function(t) {
    var a = observable(2);
    var calcs = 0;
    var b = computed(function() {
        calcs++;
        return a.get() * 2;
    });

    // if not inspected during transaction, postpone value to end
    mobx.transaction(function() {
        a.set(3);
        t.equal(b.get(), 6);
        t.equal(calcs, 1);
    });
    t.equal(b.get(), 6);
    t.equal(calcs, 2);

    // if inspected, evaluate eagerly
    mobx.transaction(function() {
        a.set(4);
        t.equal(b.get(), 8);
        t.equal(calcs, 3);
    });
    t.equal(b.get(), 8);
    t.equal(calcs, 4);

    t.end();
});

test('transaction with inspection 2', function(t) {
    var a = observable(2);
    var calcs = 0;
    var b;
    mobx.autorun(function() {
        calcs++;
        b = a.get() * 2;
    });

    // if not inspected during transaction, postpone value to end
    mobx.transaction(function() {
        a.set(3);
        t.equal(b, 4);
        t.equal(calcs, 1);
    });
    t.equal(b, 6);
    t.equal(calcs, 2);

    // if inspected, evaluate eagerly
    mobx.transaction(function() {
        a.set(4);
        t.equal(b, 6);
        t.equal(calcs, 2);
    });
    t.equal(b, 8);
    t.equal(calcs, 3);

    t.end();
})

test('scope', function(t) {
    var vat = observable(0.2);
    var Order = function() {
        this.price = observable(20);
        this.amount = observable(2);
        this.total = computed(function() {
            return (1+vat.get()) * this.price.get() * this.amount.get();
        }, { context: this });
    };

    var order = new Order();
    m.observe(order.total, voidObserver);
    order.price.set(10);
    order.amount.set(3);
    t.equal(36, order.total.get());
    t.equal(mobx.extras.isComputingDerivation(), false);

    t.end();
})

test('props1', function(t) {
    var vat = observable(0.2);
    var Order = function() {
        mobx.extendObservable(this, {
            'price' : 20,
            'amount' : 2,
            get total() {
                return (1+vat.get()) * this.price * this.amount; // price and amount are now properties!
            }
        });
    };

    var order = new Order();
    t.equal(48, order.total);
    order.price = 10;
    order.amount = 3;
    t.equal(36, order.total);

    var totals = [];
    var sub = mobx.autorun(function() {
        totals.push(order.total);
    });
    order.amount = 4;
    sub();
    order.amount = 5;
    t.deepEqual(totals, [36,48]);

    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('props2', function(t) {
    var vat = observable(0.2);
    var Order = function() {
        mobx.extendObservable(this, {
            price: 20,
            amount: 2,
            get total() {
                return (1+vat.get()) * this.price * this.amount; // price and amount are now properties!
            }
        });
    };

    var order = new Order();
    t.equal(48, order.total);
    order.price = 10;
    order.amount = 3;
    t.equal(36, order.total);
    t.end();
})

test('props3', function(t) {
    var vat = observable(0.2);
    var Order = function() {
        this.price = 20;
        this.amount = 2;
        this.total = mobx.computed(function() {
            return (1+vat.get()) * this.price * this.amount; // price and amount are now properties!
        });
        mobx.extendObservable(this, this);
    };

    var order = new Order();
    t.equal(48, order.total);
    order.price = 10;
    order.amount = 3;
    t.equal(36, order.total);
    t.end();
})

test('props4', function(t) {
    function Bzz() {
        mobx.extendObservable(this, {
            fluff: [1,2],
            get sum() {
                return this.fluff.reduce(function(a,b) {
                    return a + b;
                }, 0);
            }
        });
    }

    var x = new Bzz();
    var ar = x.fluff;
    t.equal(x.sum, 3);
    x.fluff.push(3);
    t.equal(x.sum, 6);
    x.fluff = [5,6];
    t.equal(x.sum, 11);
    x.fluff.push(2);
    t.equal(x.sum, 13);
    t.end();
})

test('extend observable multiple prop maps', function(t) {
    var x = { a: 1 };
    mobx.extendObservable(x, {
        b: 2,
        c: 2
    }, {
        c: 3,
        d: 4
    }, {
        a: 5
    });

    var sum = 0;
    var disposer = mobx.autorun(function() {
        sum = x.a + x.b + x.c + x.d;
    });
    t.equal(sum, 14);
    x.a = 1;
    t.equal(sum, 10);

    t.end();
})

test('object enumerable props', function(t) {
    var x = mobx.observable({
        a: 3,
        b: mobx.computed(function() {
            return 2 * this.a;
        })
    });
    mobx.extendObservable(x, { c: 4 });
    var ar = [];
    for(var key in x)
        ar.push(key);
    t.deepEqual(ar, ['a', 'c']); // or should 'b' be in here as well?
    t.end();
})

test('observe property', function(t) {
    var sb = [];
    var mb = [];

    var Wrapper = function (chocolateBar) {
        mobx.extendObservable(this, {
            chocolateBar: chocolateBar,
            get calories () {
                return this.chocolateBar.calories;
            }
        });
    };

    var snickers = mobx.observable({
        calories: null
    });
    var mars = mobx.observable({
        calories: undefined
    });

    var wrappedSnickers = new Wrapper(snickers);
    var wrappedMars = new Wrapper(mars);

    var disposeSnickers = mobx.autorun(function () {
        sb.push(wrappedSnickers.calories);
    });
    var disposeMars = mobx.autorun(function () {
        mb.push(wrappedMars.calories);
    });
    snickers.calories = 10;
    mars.calories = 15;

    disposeSnickers();
    disposeMars();
    snickers.calories = 5;
    mars.calories = 7;

    t.deepEqual(sb, [null, 10]);
    t.deepEqual(mb, [undefined, 15]);

    t.end();
})

test('observe object', function(t) {
    var events = [];
    var a = observable({
        a: 1,
        get da() { return this.a * 2 }
    });
    var stop = m.observe(a, function(change) {
        events.push(change);
    });

    a.a = 2;
    mobx.extendObservable(a, {
        a: 3, b: 3
    });
    a.a = 4;
    a.b = 5;
    t.deepEqual(events, [
        { type: 'update',
            object: a,
            name: 'a',
			newValue: 2,
            oldValue: 1 },
        { type: 'update',
            object: a,
            name: 'a',
			newValue: 3,
            oldValue: 2 },
        { type: 'add',
            object: a,
			newValue: 3,
            name: 'b' },
        { type: 'update',
            object: a,
            name: 'a',
			newValue: 4,
            oldValue: 3 },
        { type: 'update',
            object: a,
            name: 'b',
			newValue: 5,
            oldValue: 3 }
    ]);

    stop();
    events = [];
    a.a = 6;
    t.equals(events.length, 0);

    t.end();
});

test('mobx.observe', function(t) {
    var events = [];
    var o = observable({ b: 2 });
    var ar = observable([ 3 ]);
    var map = mobx.map({ });

    var push = function(event) { events.push(event); };

    var stop2 = mobx.observe(o, push);
    var stop3 = mobx.observe(ar, push);
    var stop4 = mobx.observe(map, push);

    o.b = 5;
    ar[0] = 6;
    map.set("d", 7);

    stop2();
    stop3();
    stop4();

    o.b = 9;
    ar[0] = 10;
    map.set("d", 11);

    t.deepEqual(events, [
        { type: 'update',
            object: o,
            name: 'b',
			newValue: 5,
            oldValue: 2 },
        { object: ar,
            type: 'update',
            index: 0,
			newValue: 6,
            oldValue: 3 },
        { type: 'add',
            object: map,
			newValue: 7,
            name: 'd' }
    ]);

    t.end();
});

test('change count optimization', function(t) {
    var bCalcs = 0;
    var cCalcs = 0;
    var a = observable(3);
    var b = computed(function() {
        bCalcs += 1;
        return 4 + a.get() - a.get();
    });
    var c = computed(function() {
        cCalcs += 1;
        return b.get();
    });

    m.observe(c, voidObserver);

    t.equal(b.get(), 4);
    t.equal(c.get(), 4);
    t.equal(bCalcs, 1);
    t.equal(cCalcs, 1);

    a.set(5);

    t.equal(b.get(), 4);
    t.equal(c.get(), 4);
    t.equal(bCalcs, 2);
    t.equal(cCalcs, 1);

    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('observables removed', function(t) {
    var calcs = 0;
    var a = observable(1);
    var b = observable(2);
    var c = computed(function() {
        calcs ++;
        if (a.get() === 1)
        return b.get() * a.get() * b.get();
        return 3;
    });


    t.equal(calcs, 0);
    m.observe(c, voidObserver);
    t.equal(c.get(), 4);
    t.equal(calcs, 1);
    a.set(2);
    t.equal(c.get(), 3);
    t.equal(calcs, 2);

    b.set(3); // should not retrigger calc
    t.equal(c.get(), 3);
    t.equal(calcs, 2);

    a.set(1);
    t.equal(c.get(), 9);
    t.equal(calcs, 3);

    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('lazy evaluation', function (t) {
    var bCalcs = 0;
    var cCalcs = 0;
    var dCalcs = 0;
    var observerChanges = 0;

    var a = observable(1);
    var b = computed(function() {
        bCalcs += 1;
        return a.get() +1;
    });

    var c = computed(function() {
        cCalcs += 1;
        return b.get() +1;
    });

    t.equal(bCalcs, 0);
    t.equal(cCalcs, 0);
    t.equal(c.get(), 3);
    t.equal(bCalcs,1);
    t.equal(cCalcs,1);

    t.equal(c.get(), 3);
    t.equal(bCalcs,2);
    t.equal(cCalcs,2);

    a.set(2);
    t.equal(bCalcs,2);
    t.equal(cCalcs,2);

    t.equal(c.get(), 4);
    t.equal(bCalcs,3);
    t.equal(cCalcs,3);

    var d = computed(function() {
        dCalcs += 1;
        return b.get() * 2;
    });

    var handle = m.observe(d, function() {
        observerChanges += 1;
    }, false);
    t.equal(bCalcs,4);
    t.equal(cCalcs,3);
    t.equal(dCalcs,1); // d is evaluated, so that its dependencies are known

    a.set(3);
    t.equal(d.get(), 8);
    t.equal(bCalcs,5);
    t.equal(cCalcs,3);
    t.equal(dCalcs,2);

    t.equal(c.get(), 5);
    t.equal(bCalcs,5);
    t.equal(cCalcs,4);
    t.equal(dCalcs,2);

    t.equal(b.get(), 4);
    t.equal(bCalcs,5);
    t.equal(cCalcs,4);
    t.equal(dCalcs,2);

    handle(); // unlisten
    t.equal(d.get(), 8);
    t.equal(bCalcs,6); // gone to sleep
    t.equal(cCalcs,4);
    t.equal(dCalcs,3);

    t.equal(observerChanges, 1);

    t.equal(mobx.extras.isComputingDerivation(), false);
    t.end();
})

test('multiple view dependencies', function(t) {
    var bCalcs = 0;
    var dCalcs = 0;
    var a = observable(1);
    var b = computed(function() {
        bCalcs++;
        return 2 * a.get();
    });
    var c = observable(2);
    var d = computed(function() {
        dCalcs++;
        return 3 * c.get();
    });

    var zwitch = true;
    var buffer = [];
    var fCalcs = 0;
    var dis = mobx.autorun(function() {
        fCalcs++;
        if (zwitch)
            buffer.push(b.get() + d.get());
        else
            buffer.push(d.get() + b.get());
    });

    zwitch = false;
    c.set(3);
    t.equal(bCalcs, 1);
    t.equal(dCalcs, 2);
    t.equal(fCalcs, 2);
    t.deepEqual(buffer, [8, 11]);

    c.set(4);
    t.equal(bCalcs, 1);
    t.equal(dCalcs, 3);
    t.equal(fCalcs, 3);
    t.deepEqual(buffer, [8, 11, 14]);

    dis();
    c.set(5);
    t.equal(bCalcs, 1);
    t.equal(dCalcs, 3);
    t.equal(fCalcs, 3);
    t.deepEqual(buffer, [8, 11, 14]);

    t.end();
})

test('nested observable2', function(t) {
    var factor = observable(0);
    var price = observable(100);
    var totalCalcs = 0;
    var innerCalcs = 0;

    var total = computed(function() {
        totalCalcs += 1; // outer observable shouldn't recalc if inner observable didn't publish a real change
        return price.get() * computed(function() {
            innerCalcs += 1;
            return factor.get() % 2 === 0 ? 1 : 3;
        }).get();
    });

    var b = [];
    var sub = m.observe(total, function(x) { b.push(x.newValue); }, true);

    price.set(150);
    factor.set(7); // triggers innerCalc twice, because changing the outcome triggers the outer calculation which recreates the inner calculation
    factor.set(5); // doesn't trigger outer calc
    factor.set(3); // doesn't trigger outer calc
    factor.set(4); // triggers innerCalc twice
    price.set(20);

    t.deepEqual(b, [100,150,450,150,20]);
    t.equal(innerCalcs, 9);
    t.equal(totalCalcs, 5);

    t.end();
})

test('expr', function(t) {
    var factor = observable(0);
    var price = observable(100);
    var totalCalcs = 0;
    var innerCalcs = 0;

    var total = computed(function() {
        totalCalcs += 1; // outer observable shouldn't recalc if inner observable didn't publish a real change
        return price.get() * mobx.expr(function() {
            innerCalcs += 1;
            return factor.get() % 2 === 0 ? 1 : 3;
        });
    });

    var b = [];
    var sub = m.observe(total, function(x) { b.push(x.newValue); }, true);

    price.set(150);
    factor.set(7); // triggers innerCalc twice, because changing the outcome triggers the outer calculation which recreates the inner calculation
    factor.set(5); // doesn't trigger outer calc
    factor.set(3); // doesn't trigger outer calc
    factor.set(4); // triggers innerCalc twice
    price.set(20);

    t.deepEqual(b, [100,150,450,150,20]);
    t.equal(innerCalcs, 9);
    t.equal(totalCalcs, 5);

    t.end();
})

test('observe', function(t) {
    var x = observable(3);
    var x2 = computed(function() { return x.get() * 2; });
    var b = [];

    var cancel = mobx.autorun(function() {
        b.push(x2.get());
    });

    x.set(4);
    x.set(5);
    t.deepEqual(b, [6, 8, 10]);
    cancel();
    x.set(7);
    t.deepEqual(b, [6, 8, 10]);

    t.end();
})

test('when', function(t) {
    var x = observable(3);

    var called = 0;
    mobx.when(function() {
        return (x.get() === 4);
    }, function() {
        called += 1;
    });

    x.set(5);
    t.equal(called, 0);
    x.set(4);
    t.equal(called, 1);
    x.set(3);
    t.equal(called, 1);
    x.set(4);
    t.equal(called, 1);

    t.end();
})

test('when 2', function(t) {
    var x = observable(3);

    var called = 0;
    var d = mobx.when("when x is 3", function() {
        return (x.get() === 3);
    }, function() {
        called += 1;
    });

    t.equal(called, 1);
    t.equal(x.observers.length, 0)
    x.set(5);
    x.set(3);
    t.equal(called, 1);

	t.equal(d.$mobx.name, "when x is 3")

    t.end();
})

test('expr2', function(t) {
    var factor = observable(0);
    var price = observable(100);
    var totalCalcs = 0;
    var innerCalcs = 0;

    var total = computed(function() {
        totalCalcs += 1; // outer observable shouldn't recalc if inner observable didn't publish a real change
        return price.get() * mobx.expr(function() {
            innerCalcs += 1;
            return factor.get() % 2 === 0 ? 1 : 3;
        });
    });

    var b = [];
    var sub = m.observe(total, function(x) { b.push(x.newValue); }, true);

    price.set(150);
    factor.set(7); // triggers innerCalc twice, because changing the outcome triggers the outer calculation which recreates the inner calculation
    factor.set(5); // doesn't trigger outer calc
    factor.set(3); // doesn't trigger outer calc
    factor.set(4); // triggers innerCalc twice
    price.set(20);

    t.deepEqual(b, [100,150,450,150,20]);
    t.equal(innerCalcs, 9);
    t.equal(totalCalcs, 5);

    t.end();
})

function stripSpyOutput(events) {
	events.forEach(ev => {
		delete ev.time;
		delete ev.fn;
		delete ev.object;
	});
	return events;
}

test('issue 50', function(t) {
    m.extras.resetGlobalState();
    mobx.extras.getGlobalState().mobxGuid = 0;
    var x = observable({
        a: true,
        b: false,
        get c() {
            events.push("calc c");
            return this.b;
        }
    });

    var result
    var events = [];
    var disposer1 = mobx.autorun(function ar() {
        events.push("auto");
        result = [x.a, x.b, x.c].join(",");
    });

    var disposer2 = mobx.spy(function(info) {
        events.push(info);
    });

    setTimeout(function() {
        mobx.transaction(function() {
            events.push("transstart");
            x.a = !x.a;
            x.b = !x.b;
            events.push("transpreend");
        });
        events.push("transpostend");
        t.equal(result, "false,true,true");
        t.equal(x.c, x.b);

        t.deepEqual(stripSpyOutput(events), [
			'auto',
			'calc c',
			'transstart',
			{ name: 'a', newValue: false, oldValue: true, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
			{ name: 'b', newValue: true, oldValue: false, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
			'transpreend',
			{ spyReportStart: true, type: 'reaction' },
			'auto',
      { type: 'compute' },
      'calc c',
			{ spyReportEnd: true },
			'transpostend'
        ]);

        disposer1();
        disposer2();
        t.end();
    }, 500);

});

test('verify transaction events', function(t) {
    m.extras.resetGlobalState();
    mobx.extras.getGlobalState().mobxGuid = 0;

    var x = observable({
        b: 1,
        get c() {
            events.push("calc c");
            return this.b;
        }
    });

    var events = [];
    var disposer1 = mobx.autorun(function ar() {
        events.push("auto");
        x.c;
    });

    var disposer2 = mobx.spy(function(info) {
        events.push(info);
    });

    mobx.transaction(function() {
        events.push("transstart");
        x.b = 1;
        x.b = 2;
        events.push("transpreend");
    });
    events.push("transpostend");

	t.deepEqual(stripSpyOutput(events), [
		'auto',
		'calc c',
		'transstart',
		{ name: 'b', newValue: 2, oldValue: 1, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
		'transpreend', { type: 'compute' },
		'calc c',
		{ spyReportStart: true, type: 'reaction' },
		'auto',
		{ spyReportEnd: true },
		'transpostend'
    ]);

    disposer1();
    disposer2();
    t.end();
});

test("verify array in transaction", function(t) {
    var ar = observable([]);
    var aCount= 0;
    var aValue;

    mobx.autorun(function() {
        aCount++;
        aValue = 0;
        for(var i = 0; i < ar.length; i++)
            aValue += ar[i];
    });

    mobx.transaction(function() {
        ar.push(2);
        ar.push(3);
        ar.push(4);
        ar.unshift(1);
    });
    t.equal(aValue, 10);
    t.equal(aCount, 2);
    t.end();
})

test('delay autorun until end of transaction', function(t) {
    m.extras.resetGlobalState();
    mobx.extras.getGlobalState().mobxGuid = 0;
    var events = [];
    var x = observable({
        a: 2,
        get b() {
            events.push("calc y");
            return this.a;
        }
    });
    var disposer1;
    var disposer2 = mobx.spy(function(info) {
        events.push(info);
    });
    var didRun = false;

    mobx.transaction(function() {
        mobx.transaction(function() {

            disposer1 = mobx.autorun(function test() {
                didRun = true;
                events.push("auto");
                x.b;
            });

            t.equal(didRun, false, "autorun should not have run yet");

            x.a = 3;
            x.a = 4;

            events.push("end1");
        });
        t.equal(didRun, false, "autorun should not have run yet");
        x.a = 5;
        events.push("end2");
    });

    t.equal(didRun, true, "autorun should not have run yet");
    events.push("post trans1");
    x.a = 6;
    events.push("post trans2");
    disposer1();
    x.a = 3;
    events.push("post trans3");

    t.deepEqual(stripSpyOutput(events), [
		{ name: 'a', newValue: 3, oldValue: 2, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
		{ name: 'a', newValue: 4, oldValue: 3, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
		'end1',
		{ name: 'a', newValue: 5, oldValue: 4, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
		'end2',
		{ spyReportStart: true, type: 'reaction' },
			'auto',
			{ type: 'compute' },
			'calc y',
		{ spyReportEnd: true },
		'post trans1',
		{ name: 'a', newValue: 6, oldValue: 5, spyReportStart: true, type: 'update' },
			{ type: 'compute' },
			'calc y',
			{ spyReportStart: true, type: 'reaction' },
				'auto',
			{ spyReportEnd: true },
		{ spyReportEnd: true },
		'post trans2',
		{ name: 'a', newValue: 3, oldValue: 6, spyReportStart: true, type: 'update' }, { spyReportEnd: true },
		'post trans3'
    ]);

    disposer2();
    t.end();
});

test('prematurely end autorun', function(t) {
    var x = observable(2);
    var dis1, dis2;
    mobx.transaction(function() {
        dis1 =  mobx.autorun(function() {
            x.get();
        });
        dis2 =  mobx.autorun(function() {
            x.get();
        });

        t.equal(x.observers.length, 0);
        t.equal(dis1.$mobx.observing.length, 0);
        t.equal(dis2.$mobx.observing.length, 0);

        dis1();
    });
    t.equal(x.observers.length, 1);
    t.equal(dis1.$mobx.observing.length, 0);
    t.equal(dis2.$mobx.observing.length, 1);

    dis2();

    t.equal(x.observers.length, 0);
    t.equal(dis1.$mobx.observing.length, 0);
    t.equal(dis2.$mobx.observing.length, 0);

    t.end();
});

test('computed values believe NaN === NaN', function(t) {
	var a = observable(2);
	var b = observable(3);
	var c = computed(function() { return String(a.get() * b.get()) });
	var buf = buffer();
	m.observe(c, buf);

	a.set(NaN);
	b.set(NaN);
	a.set(NaN);
	a.set(2);
	b.set(3);

	t.deepEqual(buf.toArray(), ['NaN', '6']);
	t.end();
})

test.skip('issue 65; transaction causing transaction', function(t) {
	// MWE: disabled, bad test; depends on transaction being tracked, transaction should not be used in computed!
    var x = mobx.observable({
        a: 3,
        get b() {
            return mobx.transaction(function() {
                return this.a * 2;
            }, this);
        }
    });

    var res;
    mobx.autorun(function() {
        res = x.a + x.b;
    });

    mobx.transaction(function() {
        x.a = 2;
        x.a = 5;
    });
    t.equal(res, 15);
    t.end();
});

test('issue 71, transacting running transformation', function(t) {
    var state = mobx.observable({
        things: []
    });

    function Thing(value) {
        mobx.extendObservable(this, {
            value: value,
            get pos() {
                return state.things.indexOf(this);
            },
            get isVisible() {
                return this.pos !== -1;
            }
        });

        mobx.when(function() {
            return this.isVisible;
        }, function() {
            if (this.pos < 4)
                state.things.push(new Thing(value + 1));
        }, this);
    }

    var copy;
    var vSum;
    mobx.autorun(function() {
        copy = state.things.map(function(thing) { return thing.value });
        vSum = state.things.reduce(function(a, thing) {
            return a  + thing.value
        }, 0);
    });

    t.deepEqual(copy, []);

    mobx.transaction(function() {
        state.things.push(new Thing(1));
    });

    t.deepEqual(copy, [1,2,3,4,5]);
    t.equal(vSum, 15);

    state.things.splice(0,2);
    state.things.push(new Thing(6));

    t.deepEqual(copy, [3,4,5,6,7]);
    t.equal(vSum, 25);

    t.end();
});

test('eval in transaction', function(t) {
    var bCalcs = 0;
    var x = mobx.observable({
        a: 1,
        get b() {
            bCalcs++;
            return this.a * 2;
        }
    });
    var c;

    mobx.autorun(function() {
       c = x.b;
    });

    t.equal(bCalcs, 1);
    t.equal(c, 2);

    mobx.transaction(function() {
        x.a = 3;
        t.equal(x.b, 6);
        t.equal(bCalcs, 2);
        t.equal(c, 2);

        x.a = 4;
        t.equal(x.b, 8);
        t.equal(bCalcs, 3);
        t.equal(c, 2);
    });
    t.equal(bCalcs, 3); // 2 or 3 would be fine as well
    t.equal(c, 8);
    t.end();
})

test('forcefully tracked reaction should still yield valid results', function(t) {
    var x = observable(3);
    var z;
    var runCount = 0;
    var identity = function() {
        runCount++;
        z = x.get();
    };
    var a = new mobx.Reaction("test", function() {
        this.track(identity);
    });
    a.runReaction();

    t.equal(z, 3);
    t.equal(runCount, 1);

    transaction(function() {
        x.set(4);
        a.track(identity);
        t.equal(a.isScheduled(), true);
        t.equal(z, 4);
        t.equal(runCount, 2);
    });

    t.equal(z, 4);
    t.equal(runCount, 2); // x is observed, so it should recompute only on dependency change

    transaction(function() {
        x.set(5);
        t.equal(a.isScheduled(), true);
        a.track(identity);
        t.equal(z, 5);
        t.equal(runCount, 3);
        t.equal(a.isScheduled(), true);

        x.set(6);
        t.equal(z, 5);
        t.equal(runCount, 3);
    });
    t.equal(a.isScheduled(), false);
    t.equal(z, 6);
    t.equal(runCount, 4);
    t.end();
});

test('autoruns created in autoruns should kick off', function(t) {
	var x = observable(3);
	var x2 = [];
	var d;

	var a = m.autorun(function() {
		if (d) {
			// dispose previous autorun
			d();
		}
		d = m.autorun(function() {
			x2.push(x.get() * 2);
		});
	})

	// a should be observed by the inner autorun, not the outer
	t.equal(a.$mobx.observing.length, 0);
	t.equal(d.$mobx.observing.length, 1);

	x.set(4);
	t.deepEqual(x2, [6, 8]);


	t.end();
});

test('#502 extendObservable throws on objects created with Object.create(null)', t => {
	var a = Object.create(null)
	mobx.extendObservable(a, { b: 3 })
	t.equal(mobx.isObservable(a, "b"), true)
	t.end()
})

test('#328 atom throwing exception if observing stuff in onObserved', t => {
	var b = mobx.observable(1)
	var a = new mobx.Atom('test atom', () => {
		b.get();
	});
	var d = mobx.autorun(() => {
		a.reportObserved(); // threw
	})
	d();
	t.end()
});

test('prematurely ended autoruns are cleaned up properly', t => {
	var a = mobx.observable(1);
	var b = mobx.observable(2);
	var c = mobx.observable(3);
	var called = 0;

	var d = mobx.autorun(() => {
		called++;
		if (a.get() === 2) {
			d(); // dispose
			b.get(); // consume
			a.set(3); // cause itself to re-run, but, disposed!
		} else {
			c.get();
		}
	})

	t.equal(called, 1)
	t.equal(a.observers.length, 1)
	t.equal(b.observers.length, 0)
	t.equal(c.observers.length, 1)
	t.equal(d.$mobx.observing.length, 2)

	a.set(2)

	t.equal(called, 2)
	t.equal(a.observers.length, 0)
	t.equal(b.observers.length, 0)
	t.equal(c.observers.length, 0)
	t.equal(d.$mobx.observing.length, 0)

	t.end()
})

test('unoptimizable subscriptions are diffed correctly', t => {
	var a = mobx.observable(1);
	var b = mobx.observable(1);
	var c = mobx.computed(() => {
		a.get()
		return 3
	});
	var called = 0;
	var val = 0

	const d = mobx.autorun(() => {
		called++
		a.get()
		c.get() // reads a as well
		val = a.get()
		if (b.get() === 1) // only on first run
			a.get() // second run: one read less for a
	})

	t.equal(called, 1)
	t.equal(val, 1)
	t.equal(a.observers.length, 2)
	t.equal(b.observers.length, 1)
	t.equal(c.observers.length, 1)
	t.equal(d.$mobx.observing.length, 3) // 3 would be better!

	b.set(2)

	t.equal(called, 2)
	t.equal(val, 1)
	t.equal(a.observers.length, 2)
	t.equal(b.observers.length, 1)
	t.equal(c.observers.length, 1)
	t.equal(d.$mobx.observing.length, 3) // c was cached so accessing a was optimizable

	a.set(2)

	t.equal(called, 3)
	t.equal(val, 2)
	t.equal(a.observers.length, 2)
	t.equal(b.observers.length, 1)
	t.equal(c.observers.length, 1)
	t.equal(d.$mobx.observing.length, 3) // c was cached so accessing a was optimizable

	d();

	t.end()

})

test('atom events #427', t => {
	var start = 0;
	var stop = 0;

	var a = new mobx.Atom("test", () => start++, () => stop++);
	a.reportObserved();
	a.reportObserved();

	t.equal(start, 2)
	t.equal(stop, 2)

	var d = mobx.autorun(() => {
		a.reportObserved()
		t.equal(start, 3)
		a.reportObserved()
		t.equal(start, 3)
	})

	t.equal(start, 3)
	t.equal(stop, 2)
	a.reportChanged()
	t.equal(start, 3)
	t.equal(stop, 2)

	d()
	t.equal(start, 3)
	t.equal(stop, 3)

	t.equal(a.reportObserved(), false);
	t.equal(start, 4)
	t.equal(stop, 4)

	d = mobx.autorun(() => {
		t.equal(a.reportObserved(), true)
		t.equal(start, 5)
		a.reportObserved()
		t.equal(start, 5)
	})

	t.equal(start, 5)
	t.equal(stop, 4)
	a.reportChanged()
	t.equal(start, 5)
	t.equal(stop, 4)

	d()
	t.equal(stop, 5)
	t.end()
})

test("verify calculation count", t => {
	var calcs = []
	var a = observable(1)
	var b = mobx.computed(() => {
		calcs.push("b")
		return a.get()
	})
	var c = mobx.computed(() => {
		calcs.push("c")
		return b.get()
	})
	var d = mobx.autorun(() => {
		calcs.push("d")
		return b.get()
	})
	var e = mobx.autorun(() => {
		calcs.push("e")
		return c.get()
	})
	var f = mobx.computed(() => {
		calcs.push("f")
		return c.get()
	})

	t.equal(f.get(), 1)

	calcs.push("change")
	a.set(2)

	t.equal(f.get(), 2)

	calcs.push("transaction")
	transaction(() => {
		t.equal(b.get(), 2)
		t.equal(c.get(), 2)
		t.equal(f.get(), 2)
		t.equal(f.get(), 2)
		calcs.push("change")
		a.set(3)
		t.equal(b.get(), 3)
		t.equal(b.get(), 3)
		calcs.push("try c")
		t.equal(c.get(), 3)
		t.equal(c.get(), 3)
		calcs.push("try f")
		t.equal(f.get(), 3)
		t.equal(f.get(), 3)
		calcs.push("end transaction")
	})

	t.deepEqual(calcs, [
		"d", "b", "e", "c",
		"f",
		"change", "b", "c", "e", "d", "f", // would have expected b c e d f, but alas
		"transaction", "f",
		"change", "b",
		"try c", "c",
		"try f", "f",
		"end transaction", "e", "d" // would have expected e d
	])

	d()
	e()

	t.end()
})

test("support computed property getters / setters", t => {
	let a = observable({
		size: 1,
		volume: mobx.computed(function() {
			return this.size * this.size
		})
	})

	t.equal(a.volume, 1)
	a.size = 3
	t.equal(a.volume, 9)

	t.throws(() => a.volume = 9, /It is not possible to assign a new value to a computed value/)

	a = {}
	mobx.extendObservable(a, {
		size: 2,
		volume: mobx.computed(
			function() { return this.size * this.size },
			function(v) { this.size = Math.sqrt(v) }
		)
	})

	const values = []
	const d = mobx.autorun(() => values.push(a.volume))

	a.volume = 9
	mobx.transaction(() => {
		a.volume = 100
		a.volume = 64
	})

	t.deepEqual(values, [4, 9, 64])
	t.deepEqual(a.size, 8)

	d()
	t.end()
})

test('computed getter / setter for plan objects should succeed', function (t) {
	var b = observable({
		a: 3,
		get propX() {
			return this.a * 2;
		},
		set propX(v) {
			this.a = v;
		}
	});

	var values = [];
	mobx.autorun(function () {
		return values.push(b.propX);
	});
	t.equal(b.propX, 6);
	b.propX = 4;
	t.equal(b.propX, 8);

	t.deepEqual(values, [6, 8]);

	t.end();
});

test('helpful error for self referencing setter', function(t) {
	var a = observable({
		x: 1,
		get y() {
			return this.x
		},
		set y(v) {
			this.y = v // woops...;-)
		}
	})

	t.throws(() => a.y = 2, /The setter of computed value/)

	t.end()
})

test('#558 boxed observables stay boxed observables', function(t) {
	var a = observable({
		x: observable(3)
	})

	t.equal(typeof a.x, "object")
	t.equal(typeof a.x.get, "function")
	t.end()
})

test('iscomputed', function(t) {
	t.equal(mobx.isComputed(observable(3)), false)
	t.equal(mobx.isComputed(mobx.computed(function() { return 3 })), true)

	var x = observable({
		a: 3,
		get b() {
			return this.a
		}
	})

	t.equal(mobx.isComputed(x, "a"), false)
	t.equal(mobx.isComputed(x, "b"), true)
	t.end()
})

test('603 - transaction should not kill reactions', t => {
	var a = observable(1)
	var b = 1;
	var d = mobx.autorun(() => { b = a.get() })

	try {
		mobx.transaction(() => {
			a.set(2)
			throw 3
		})

	} catch (e) {

	}

	t.equal(a.observers.length, 1)
	t.equal(d.$mobx.observing.length, 1)
	const g = m.extras.getGlobalState()
	t.deepEqual(g.inBatch, 0)
	t.deepEqual(g.pendingReactions.length, 0)
	t.deepEqual(g.pendingUnobservations.length, 0)
	t.deepEqual(g.trackingDerivation, null)

	t.equal(b, 2)
	a.set(3)
	t.equal(b, 3)

	t.end()

})

test('#561 test toPrimitive() of observable objects', function(t) {
	if (typeof Symbol !== "undefined" && Symbol.toPrimitive) {
		var x = observable(3);

		t.equal(x.valueOf(), 3);
		t.equal(x[Symbol.toPrimitive](), 3);

		t.equal(+x, 3);
		t.equal(++x, 4);

		var y = observable(3);

		t.equal(y + 7, 10);

		var z = computed(() => ({ a: 3 }));
		t.equal(3 + z, "3[object Object]");
	} else {
		var x = observable(3);

		t.equal(x.valueOf(), 3);
		t.equal(x["@@toPrimitive"](), 3);

		t.equal(+x, 3);
		t.equal(++x, 4);

		var y = observable(3);

		t.equal(y + 7, 10);

		var z = computed(() => ({ a: 3 }));
		t.equal("3" + (z["@@toPrimitive"]()), "3[object Object]");
	}
    t.end()
});

test('observables should not fail when ES6 Map is missing', t => {
    const globalMapFunction = global.Map;
    global.Map = undefined;
    t.equal(global.Map, undefined);
    try {
        var a = observable([1,2,3]); //trigger isES6Map in utils
    }
    catch (e) {
        t.fail('Should not fail when Map is missing');
    }

    t.equal(m.isObservable(a), true);

    global.Map = globalMapFunction;
    t.end();
})
