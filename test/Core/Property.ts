/// <reference path="../typings/jasmine.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe("Observable Properties", () => {
    it("can be created using factory method", () => {
        let prop = wx.property<number>();
        expect(prop).toBeDefined();
    });

    it("can be created using factory method with initial value",() => {
        let prop = wx.property<number>(10);
        expect(prop()).toEqual(10);
    });

    it("falsy initial values are not coerced to undefined", () => {
        let prop = wx.property(0);
        expect(prop()).toEqual(0);

        let prop2 = wx.property(false);
        expect(prop2()).toEqual(false);

        let prop3 = wx.property(null);
        expect(prop3()).toEqual(null);
    });

    it("implements IObservableProperty",() => {
        let prop = wx.property<number>();
        expect(wx.queryInterface(prop, wx.IID.IObservableProperty)).toBeTruthy();
    });

    it("observables are set up during creation",() => {
        let prop = wx.property<number>();
        expect(prop.changing !== undefined && prop.changed !== undefined).toBeTruthy();
    });

    it("invoking it as a function with a parameter changes the property's value",() => {
        let prop = wx.property<number>();
        prop(10);
        expect(prop()).toEqual(10);
    });

    it("setting value to undefined works",() => {
        let prop = wx.property<number>();

        prop(3);
        expect(prop()).toEqual(3);
        prop(undefined);
        expect(prop()).not.toBeDefined();
    });

    it("type transition",() => {
        let prop = wx.property<any>();

        prop(3);
        expect(prop()).toEqual(3);

        prop(Rx.Observable.return(3));
        expect(typeof prop()).toEqual("object");

        prop("foo");
        expect(prop()).toEqual("foo");
    });

    it("setting a value fires change notifications",() => {
        let prop = wx.property<number>();
        let changingFired = false;
        let changedFired = false;

        prop.changing.subscribe(x => changingFired = true);
        prop.changed.subscribe(x => changedFired = true);
        prop(10);

        expect(changingFired === true && changedFired === true).toBeTruthy();
    });

    it("multiple subscribers receive notifications",() => {
        let prop = wx.property<number>();
        let changingFiredCount = 0;

        // subscribe
        prop.changing.subscribe(x => changingFiredCount++);

        // subscribe again
        prop.changing.subscribe(x => changingFiredCount++);

        prop(10);

        expect(changingFiredCount).toEqual(2);
    });

    it("'changing' notification with new value is fired before 'changed' notification",() => {
        let prop = wx.property<number>();
        let first = undefined;
        let valueCorrect = false;

        prop(5);

        prop.changing.subscribe(x => {
            if (first === undefined) {
                first = 1;
                valueCorrect = x === 10;
            }
        });

        prop.changed.subscribe(x => {
            if (first === undefined) {
                first = 2;
            }
        });

        prop(10);

        expect(valueCorrect && first === 1).toBeTruthy();
    });

    it("notifications for changes in absence of any subscribers do not get buffered",() => {
        let prop = wx.property<number>();
        let changingFired = false;
        let changedFired = false;

        prop(10);
        prop.changing.subscribe(x => changingFired = true);
        prop.changed.subscribe(x => changedFired = true);

        expect(changingFired === false && changedFired === false).toBeTruthy();
    });

    it("consecutively assigning the same value does not result in duplicate change notifications",() => {
        let prop = wx.property<number>();
        let changedFiredCount = 0;

        prop.changed.subscribe(x => changedFiredCount++);
        prop(1);
        prop(2);
        prop(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("computed property using whenAny always has correct value",() => {
        let vm = new TestViewModel();
        let firedCount = 0;

        let computed = wx.whenAny(vm.foo, vm.bar,(f, b) => {
            firedCount++;
            return (b || "") + (f || "");
        }).toProperty();

        vm.foo(1);
        expect(computed()).toEqual("1");
        vm.bar("cool");
        expect(computed()).toEqual("cool1");

        expect(firedCount).toEqual(3);
    });
});
