/// <reference path="../typings/jasmine.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.testing.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe("Utils",() => {
    it("isStrictMode should be off for this file",() => {
        expect(wx.isStrictMode()).toBeFalsy();
    });

    it("isInUnitTest smoke-test",() => {
        expect(wx.isInUnitTest()).toBeTruthy();
    });

    it("getOid smoke-test",() => {
        let o1 = new Object();
        let o2 = new Object();

        let id1 = wx.getOid(o1);
        let id2 = wx.getOid(o2);

        expect(typeof id1 === "string").toBeTruthy();
        expect(typeof id2 === "string").toBeTruthy();
        expect(id1).not.toEqual(id2);

        // id for same object should always return the same value
        let id1b = wx.getOid(o1);
        expect(id1).toEqual(id1b);

        // should not throw for primitive
        expect(() => wx.getOid(1)).not.toThrowError();
        expect(() => wx.getOid("foo")).not.toThrowError();
        expect(wx.getOid(1)).toEqual("number:1");
        expect(wx.getOid("foo")).toEqual("string:foo");

        // should not throw for primitive objects
        let n = new Number(1);
        let s = new String("foo");
        expect(() => wx.getOid(n)).not.toThrowError();
        expect(() => wx.getOid(s)).not.toThrowError();

        // should work with primitive objects
        expect(wx.getOid(n)).toEqual(wx.getOid(n));
        expect(wx.getOid(s)).toEqual(wx.getOid(s));
    });

    it("isProperty smoke-test",() => {
        expect(wx.isProperty(1)).toBeFalsy();
        expect(wx.isProperty("foo")).toBeFalsy();
        expect(wx.isProperty(new String("foo"))).toBeFalsy();
        expect(wx.isProperty(new Object())).toBeFalsy();
        expect(wx.isProperty(function () { })).toBeFalsy();

        expect(wx.isProperty(wx.property())).toBeTruthy();
        expect(wx.isProperty(Rx.Observable.return(1).toProperty())).toBeTruthy();
    });

    it("isCommand smoke-test",() => {
        expect(wx.isCommand(1)).toBeFalsy();
        expect(wx.isCommand("foo")).toBeFalsy();
        expect(wx.isCommand(new String("foo"))).toBeFalsy();
        expect(wx.isCommand(new Object())).toBeFalsy();
        expect(wx.isCommand(function () { })).toBeFalsy();

        expect(wx.isCommand(wx.command())).toBeTruthy();
    });

    it("isRxScheduler smoke-test",() => {
        expect(wx.isRxScheduler(1)).toBeFalsy();
        expect(wx.isRxScheduler("foo")).toBeFalsy();
        expect(wx.isRxScheduler(new String("foo"))).toBeFalsy();
        expect(wx.isRxScheduler(new Object())).toBeFalsy();
        expect(wx.isRxScheduler(function () { })).toBeFalsy();
        expect(wx.isRxScheduler(wx.command())).toBeFalsy();

        expect(wx.isRxScheduler(Rx.Scheduler.immediate)).toBeTruthy();
        expect(wx.isRxScheduler(Rx.Scheduler.currentThread)).toBeTruthy();
        expect(wx.isRxScheduler(new Rx.TestScheduler)).toBeTruthy();
    });

    it("isRxObservable smoke-test",() => {
        expect(wx.isRxObservable(1)).toBeFalsy();
        expect(wx.isRxObservable("foo")).toBeFalsy();
        expect(wx.isRxObservable(new String("foo"))).toBeFalsy();
        expect(wx.isRxObservable(new Object())).toBeFalsy();
        expect(wx.isRxObservable(function () { })).toBeFalsy();
        expect(wx.isRxObservable(wx.command())).toBeFalsy();

        expect(wx.isRxObservable(new Rx.Subject<any>())).toBeTruthy();
        expect(wx.isRxObservable(new Rx.Subject<any>().asObservable())).toBeTruthy();
        expect(wx.isRxObservable(Rx.Observable.return(true))).toBeTruthy();
        expect(wx.isRxObservable(Rx.Observable.create(obs=> Rx.Disposable.empty))).toBeTruthy();
        expect(wx.isRxObservable(Rx.Observable.return(true).select(x=> 42).publish().refCount())).toBeTruthy();
    });

    it("toggleCssClass smoke-test",() => {
        loadFixtures('templates/Core/Utils.html');

        const el = <HTMLMapElement> document.querySelector('#fixture');
        expect($(el)).toHaveClass("foo bar");

        // test with single class
        expect($(el)).not.toHaveClass("hidden");
        wx.toggleCssClass(el, true, "hidden");
        expect($(el)).toHaveClass("hidden");

        wx.toggleCssClass(el, false, "hidden");
        expect($(el)).not.toHaveClass("hidden");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");

        // test with multiple classes
        expect($(el)).not.toHaveClass("bold italic");
        wx.toggleCssClass(el, true, "bold", "italic");
        expect($(el)).toHaveClass("bold italic");

        wx.toggleCssClass(el, false, "bold", "italic");
        expect($(el)).not.toHaveClass("bold italic");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");
    });

    it("hassCssClass smoke-test",() => {
        loadFixtures('templates/Core/Utils.html');

        const el = <HTMLMapElement> document.querySelector('#fixture');
        expect($(el)).toHaveClass("foo bar");
        expect(wx.hasCssClass(el, "foo")).toBeTruthy();
        expect(wx.hasCssClass(el, "bar")).toBeTruthy();

        // test with single class
        expect($(el)).not.toHaveClass("hidden");
        expect(wx.hasCssClass(el, "hidden")).toBeFalsy();

        wx.toggleCssClass(el, true, "hidden");
        expect(wx.hasCssClass(el, "hidden")).toBeTruthy();
    });

    it("whenAny using observable properties",() => {
        let vm = {
            prop1: wx.property('Homer'),
            prop2: wx.property('Bart'),
            prop3: wx.property('Apu'),
        }

        let combined1 = wx.whenAny(vm.prop1, (prop1) => {
            return prop1;
        }).toProperty();

        expect(combined1()).toEqual(vm.prop1());

        let combined2 = wx.whenAny(vm.prop1, vm.prop2, (prop1, prop2) => {
            return prop1+prop2;
        }).toProperty();

        expect(combined2()).toEqual(vm.prop1() + vm.prop2());

        let combined3 = wx.whenAny(vm.prop1, vm.prop2, vm.prop3,(prop1, prop2, prop3) => {
            return prop1 + prop2 + prop3;
        }).toProperty();

        expect(combined3()).toEqual(vm.prop1() + vm.prop2() + vm.prop3());
    });

    it("whenAny using observable properties and plain observables",() => {
        let vm = {
            prop1: wx.property('Homer'),
            prop2: wx.property('Bart'),
            prop3: wx.property('Apu'),
            obs4: null
        }

        vm.obs4 = Rx.Observable.return(vm.prop3());

        let combined3 = wx.whenAny(vm.prop1, vm.prop2, vm.obs4,(prop1, prop2, obs4) => {
            return prop1 + prop2 + obs4;
        }).toProperty();

        expect(combined3()).toEqual(vm.prop1() + vm.prop2() + vm.prop3());
    });
});
