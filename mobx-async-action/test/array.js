"use strict"
var test = require('tape');
var mobx = require('..');
var observable = mobx.observable;
var iterall = require('iterall');

function buffer() {
    var b = [];
    var res = function(newValue) {
        b.push(newValue);
    };
    res.toArray = function() {
        return b;
    }
    return res;
}

test('test1', function(t) {
    var a = observable([]);
    t.equal(a.length, 0);
    t.deepEqual(Object.keys(a), []);
    t.deepEqual(a.slice(), []);

    a.push(1);
    t.equal(a.length, 1);
    t.deepEqual(a.slice(), [1]);

    a[1] = 2;
    t.equal(a.length, 2);
    t.deepEqual(a.slice(), [1,2]);

    var sum = mobx.computed(function() {
        return -1 + a.reduce(function(a,b) {
            return a + b;
        }, 1);
    });

    t.equal(sum.get(), 3);

    a[1] = 3;
    t.equal(a.length, 2);
    t.deepEqual(a.slice(), [1,3]);
    t.equal(sum.get(), 4);

    a.splice(1,1,4,5);
    t.equal(a.length, 3);
    t.deepEqual(a.slice(), [1,4,5]);
    t.equal(sum.get(), 10);

    a.replace([2,4]);
    t.equal(sum.get(), 6);

    a.splice(1,1);
    t.equal(sum.get(), 2);
    t.deepEqual(a.slice(), [2])

	a.spliceWithArray(0,0, [4,3]);
    t.equal(sum.get(), 9);
    t.deepEqual(a.slice(), [4,3,2]);

    a.clear();
    t.equal(sum.get(), 0);
    t.deepEqual(a.slice(), []);

    a.length = 4;
    t.equal(isNaN(sum.get()), true);
    t.deepEqual(a.length, 4);

    t.deepEqual(a.slice(), [undefined, undefined, undefined, undefined]);

    a.replace([1,2, 2,4]);
    t.equal(sum.get(), 9);
    a.length = 4;
    t.equal(sum.get(), 9);


    a.length = 2;
    t.equal(sum.get(), 3);
    t.deepEqual(a.slice(), [1,2]);

    t.deepEqual(a.reverse(), [2,1]);
    t.deepEqual(a.slice(), [1,2]);

    a.unshift(3);
    t.deepEqual(a.sort(), [1,2,3]);
    t.deepEqual(a.slice(), [3,1,2]);

	t.equal(JSON.stringify(a), "[3,1,2]");

	t.equal(a.get(1), 1);
	a.set(2, 4);
	t.equal(a.get(2), 4);

//	t.deepEqual(Object.keys(a), ['0', '1', '2']); // ideally....
	t.deepEqual(Object.keys(a), []);

    t.end();
})

test('array should support iterall / iterable ', t => {
	var a = observable([1,2,3])

	t.equal(iterall.isIterable(a), true);
	t.equal(iterall.isArrayLike(a), true);

	var values = [];
	iterall.forEach(a, v => values.push(v))

	t.deepEqual(values, [1,2,3])

	var iter = iterall.getIterator(a)
	t.deepEqual(iter.next(), { value: 1, done: false })
	t.deepEqual(iter.next(), { value: 2, done: false })
	t.deepEqual(iter.next(), { value: 3, done: false })
	t.deepEqual(iter.next(), { value: undefined, done: true })

	a.replace([])
	iter = iterall.getIterator(a)
	t.deepEqual(iter.next(), { value: undefined, done: true })

	t.end()
})

test('find(findIndex) and remove', function(t) {
    var a = mobx.observable([10,20,20]);
    var idx = -1;
    function predicate(item, index) {
        if (item === 20) {
            idx = index;
            return true;
        }
        return false;
    }

    t.equal(a.find(predicate), 20);
    t.equal(idx, 1);
    t.equal(a.findIndex(predicate), 1);
    t.equal(a.find(predicate, null, 1), 20);
    t.equal(idx, 1);
    t.equal(a.findIndex(predicate, null, 1), 1);
    t.equal(a.find(predicate, null, 2), 20);
    t.equal(idx, 2);
    t.equal(a.findIndex(predicate, null, 2), 2);
    idx = -1;
    t.equal(a.find(predicate, null, 3), undefined);
    t.equal(idx, -1);
    t.equal(a.findIndex(predicate, null, 3), -1);

    t.equal(a.remove(20), true);
    t.equal(a.find(predicate), 20);
    t.equal(idx, 1);
    t.equal(a.findIndex(predicate), 1);
    idx = -1;
    t.equal(a.remove(20), true);
    t.equal(a.find(predicate), undefined);
    t.equal(idx, -1);
    t.equal(a.findIndex(predicate), -1);

    t.equal(a.remove(20), false);

    t.end();
})

test('concat should automatically slice observable arrays, #260', t => {
	var a1 = mobx.observable([1,2])
	var a2 = mobx.observable([3,4])
	t.deepEqual(a1.concat(a2), [1,2,3,4])
	t.end()
})

test('observe', function(t) {
    var ar = mobx.observable([1,4]);
    var buf = [];
    var disposer = ar.observe(function(changes) {
        buf.push(changes);
    }, true);

    ar[1] = 3; // 1,3
    ar[2] = 0; // 1, 3, 0
    ar.shift(); // 3, 0
    ar.push(1,2); // 3, 0, 1, 2
    ar.splice(1,2,3,4); // 3, 3, 4, 2
    t.deepEqual(ar.slice(), [3,3,4,2]);
    ar.splice(6);
    ar.splice(6,2);
    ar.replace(['a']);
    ar.pop();
    ar.pop(); // does not fire anything

    // check the object param
    buf.forEach(function(change) {
        t.equal(change.object, ar);
        delete change.object;
    });

    var result = [
        { type: "splice", index: 0, addedCount: 2, removed: [], added: [1, 4], removedCount: 0 },
        { type: "update", index: 1, oldValue: 4, newValue: 3 },
        { type: "splice", index: 2, addedCount: 1, removed: [], added: [0], removedCount: 0 },
        { type: "splice", index: 0, addedCount: 0, removed: [1], added: [], removedCount: 1 },
        { type: "splice", index: 2, addedCount: 2, removed: [], added: [1,2], removedCount: 0 },
        { type: "splice", index: 1, addedCount: 2, removed: [0,1], added: [3, 4], removedCount: 2 },
        { type: "splice", index: 0, addedCount: 1, removed: [3,3,4,2], added:['a'], removedCount: 4 },
        { type: "splice", index: 0, addedCount: 0, removed: ['a'], added: [], removedCount: 1 },
    ]

    t.deepEqual(buf, result);

    disposer();
    ar[0] = 5;
    t.deepEqual(buf, result);

    t.end();
})

test('array modification1', function(t) {
    var a = mobx.observable([1,2,3]);
    var r = a.splice(-10, 5, 4,5,6);
    t.deepEqual(a.slice(), [4,5,6]);
    t.deepEqual(r, [1,2,3]);
    t.end();
})

test('serialize', function(t) {
    var a = [1,2,3];
    var m = mobx.observable(a);

    t.deepEqual(JSON.stringify(m), JSON.stringify(a));
    t.deepEqual(a, m.peek());

    a = [4];
    m.replace(a);
    t.deepEqual(JSON.stringify(m), JSON.stringify(a));
    t.deepEqual(a, m.toJSON());

    t.end();
})

test('array modification functions', function(t) {
    var ars = [[], [1,2,3]];
    var funcs = ["push","pop","shift","unshift"];
    funcs.forEach(function(f) {
        ars.forEach(function (ar) {
            var a = ar.slice();
            var b = mobx.observable(a);
            var res1 = a[f](4);
            var res2 = b[f](4);
            t.deepEqual(res1, res2);
            t.deepEqual(a, b.slice());
        });
    });
    t.end();
})

test('array modifications', function(t) {

    var a2 = mobx.observable([]);
    var inputs = [undefined, -10, -4, -3, -1, 0, 1, 3, 4, 10];
    var arrays = [[], [1], [1,2,3,4], [1,2,3,4,5,6,7,8,9,10,11],[1,undefined],[undefined]]
    for (var i = 0; i < inputs.length; i++)
    for (var j = 0; j< inputs.length; j++)
    for (var k = 0; k < arrays.length; k++)
    for (var l = 0; l < arrays.length; l++) {
        var msg = ["array mod: [", arrays[k].toString(),"] i: ",inputs[i]," d: ", inputs[j]," [", arrays[l].toString(),"]"].join(' ');
        var a1 = arrays[k].slice();
        a2.replace(a1);
        var res1 = a1.splice.apply(a1, [inputs[i], inputs[j]].concat(arrays[l]));
        var res2 = a2.splice.apply(a2, [inputs[i], inputs[j]].concat(arrays[l]));
        t.deepEqual(a1.slice(), a2.slice(), "values wrong: " + msg);
        t.deepEqual(res1, res2, "results wrong: " + msg);
        t.equal(a1.length, a2.length, "length wrong: " + msg);
    }

    t.end();
})

test('is array', function(t) {
    var x = mobx.observable([]);
    t.equal(x instanceof Array, true);

    // would be cool if this would return true...
    t.equal(Array.isArray(x), false);
    t.end();
})

test('stringifies same as ecma array', function(t) {
    const x = mobx.observable([]);
    t.equal(x instanceof Array, true);

    // would be cool if these two would return true...
	t.equal(x.toString(), "");
	t.equal(x.toLocaleString(), "");
	x.push(1, 2)
	t.equal(x.toString(), "1,2");
	t.equal(x.toLocaleString(), "1,2");
    t.end();
})

test("observes when stringified", function (t) {
	const x = mobx.observable([]);
	let c = 0;
	mobx.autorun(function() {
        x.toString();
		c++;
    });
	x.push(1);
	t.equal(c, 2);
	t.end();
})

test("observes when stringified to locale", function (t) {
	const x = mobx.observable([]);
	let c = 0;
	mobx.autorun(function() {
        x.toLocaleString();
		c++;
    });
	x.push(1);
	t.equal(c, 2);
	t.end();
})

test('peek', function(t) {
    var x = mobx.observable([1, 2, 3]);
    t.deepEqual(x.peek(), [1, 2, 3]);
    t.equal(x.$mobx.values, x.peek());

    x.peek().push(4); //noooo!
    t.throws(function() {
        x.push(5); // detect alien change
    }, "modification exception");
    t.end();
})

test('react to sort changes', function(t) {
    var x = mobx.observable([4, 2, 3]);
    var sortedX = mobx.computed(function() {
        return x.sort();
    });
    var sorted;

    mobx.autorun(function() {
        sorted = sortedX.get();
    });

    t.deepEqual(x.slice(), [4,2,3]);
    t.deepEqual(sorted, [2,3,4]);
    x.push(1);
    t.deepEqual(x.slice(), [4,2,3,1]);
    t.deepEqual(sorted, [1,2,3,4]);
    x.shift();
    t.deepEqual(x.slice(), [2,3,1]);
    t.deepEqual(sorted, [1,2,3]);
    t.end();
})

test('autoextend buffer length', function(t) {
	var ar = observable(new Array(1000));
	var changesCount = 0;
	ar.observe(changes => ++changesCount);

	ar[ar.length] = 0;
	ar.push(0);

	t.equal(changesCount, 2);

	t.end();
})

test('array exposes correct keys', t => {
	var keys = []
	var ar = observable([1,2])
	for (var key in ar)
		keys.push(key)

	t.deepEqual(keys, [])
	t.end()
})

test('isArrayLike', t => {
	var arr = [0, 1, 2];
	var observableArr = observable(arr);

	var isArrayLike = mobx.isArrayLike;
	t.equal(typeof isArrayLike, "function");

	t.equal(isArrayLike(observableArr), true);
	t.equal(isArrayLike(arr), true);
	t.equal(isArrayLike(42), false);
	t.equal(isArrayLike({}), false);

	t.end();
});

test('.move throws on invalid indices', t => {
	const arr = [0, 1, 2];
	const observableArr = observable(arr);

	t.throws(() => observableArr.move(-1, 0), /Index out of bounds: -1 is negative/);
	t.throws(() => observableArr.move(3, 0), /Index out of bounds: 3 is not smaller than 3/);
	t.throws(() => observableArr.move(0, -1), /Index out of bounds: -1 is negative/);
	t.throws(() => observableArr.move(0, 3), /Index out of bounds: 3 is not smaller than 3/);

	t.end();
});

test('.move(i, i) does nothing', t => {
	const arr = [0, 1, 2];
	const observableArr = observable(arr);
	var changesCount = 0;
	observableArr.observe(changes => ++changesCount);

	observableArr.move(0, 0);

	t.equal(0, changesCount);

	t.end();
});

test('.move works correctly', t => {
	const arr = [0, 1, 2, 3];

	function checkMove(fromIndex, toIndex, expected) {
		const oa = observable(arr);
		var changesCount = 0;
		oa.observe(changes => ++changesCount);
		oa.move(fromIndex, toIndex);
		t.deepEqual(oa.slice(), expected, ".move(" + fromIndex + ", " + toIndex + ")");
		t.equal(changesCount, 1);
	}

	checkMove(0, 1, [1, 0, 2, 3]);
	checkMove(0, 2, [1, 2, 0, 3]);
	checkMove(1, 2, [0, 2, 1, 3]);
	checkMove(2, 3, [0, 1, 3, 2]);
	checkMove(0, 3, [1, 2, 3, 0]);

	checkMove(1, 0, [1, 0, 2, 3]);
	checkMove(2, 0, [2, 0, 1, 3]);
	checkMove(2, 1, [0, 2, 1, 3]);
	checkMove(3, 1, [0, 3, 1, 2]);
	checkMove(3, 0, [3, 0, 1, 2]);

	t.end();
});

test("accessing out of bound values throws", t => {
	const a = mobx.observable([]);

	var warns = 0;
	const baseWarn = console.warn;
	console.warn = () => { warns++ }

	a[0]; // out of bounds
	a[1]; // out of bounds

	t.equal(warns, 2);

	t.doesNotThrow(() => a[0] = 3);
	t.throws(() => a[2] = 4);

	console.warn = baseWarn;
	t.end();
})

test("replace can handle large arrays", t => {
	const a = mobx.observable([])
	const b = []
	b.length = 1000*1000
	t.doesNotThrow(() => {
		a.replace(b)
	})

	t.doesNotThrow(() => {
		a.spliceWithArray(0, 0, b)
	})

	t.end()
})
