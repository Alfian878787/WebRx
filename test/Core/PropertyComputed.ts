﻿/// <reference path="../typings/jasmine.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe("Output Properties", () => {
    it("can be created using factory method",() => {
        let prop = Rx.Observable.never().toProperty();
        expect(prop).toBeDefined();
    });

    it("implements IObservableProperty",() => {
        let prop = Rx.Observable.never().toProperty();
        expect(wx.queryInterface(prop, wx.IID.IObservableProperty)).toBeTruthy();
    });

    it("implements IObservableReadOnlyProperty",() => {
        let prop = Rx.Observable.never().toProperty();
        expect(wx.queryInterface(prop, wx.IID.IObservableReadOnlyProperty)).toBeTruthy();
    });

    it("observables are set up during creation",() => {
        let prop = Rx.Observable.never().toProperty();
        expect(prop.changing !== undefined && prop.changed !== undefined).toBeTruthy();
    });

    it("can be created using factory method with initial value",() => {
        let obs = Rx.Observable.never();
        let prop = obs.toProperty(10);
        expect(prop()).toEqual(10);
    });

    it("source observable prefixed with startWith overrides initialValue",() => {
        let obs = Rx.Observable.never().startWith(13);
        let prop = obs.toProperty();
        expect(prop()).toEqual(13);
    });

    it("invoking it as a function with a parameter to change it's value, throws an error",() => {
        let prop = Rx.Observable.never().toProperty();
        expect(() => prop(10)).toThrowError();
    });

    it("returns the last value of the underlying observable upon creation",() => {
        let obs = Rx.Observable.return(3);
        let prop = obs.toProperty();
        expect(prop()).toEqual(3);
    });

    it("returns the last value of the underlying observable",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        subject.onNext(3);
        expect(prop()).toEqual(3);
    });

    it("adding data to the underlying observable results in change notifications on the property",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let changingFired = false;
        let changedFired = false;

        prop.changing.subscribe(x => changingFired = true);
        prop.changed.subscribe(x => changedFired = true);
        subject.onNext(10);

        expect(changingFired === true && changedFired === true).toBeTruthy();
    });

    it("multiple subscribers receive notifications",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let changingFiredCount = 0;

        // subscribe
        prop.changing.subscribe(x => changingFiredCount++);

        // subscribe again
        prop.changing.subscribe(x => changingFiredCount++);

        subject.onNext(10);

        expect(changingFiredCount).toEqual(2);
    });

    it("'changing' notification with new value is fired before 'changed' notification",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let first = undefined;
        let valueCorrect = false;

        subject.onNext(5);

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

        subject.onNext(10);

        expect(valueCorrect && first === 1).toBeTruthy();
    });

    it("notifications for changes in absence of any subscribers do not get buffered",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let changingFired = false;
        let changedFired = false;

        subject.onNext(10);
        prop.changing.subscribe(x => changingFired = true);
        prop.changed.subscribe(x => changedFired = true);

        expect(changingFired === false && changedFired === false).toBeTruthy();
    });

    it("consecutively assigning the same value does not result in duplicate change notifications",() => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let changedFiredCount = 0;

        prop.changed.subscribe(x => changedFiredCount++);
        subject.onNext(1);
        subject.onNext(2);
        subject.onNext(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("captures errors in the observable source", () => {
        let subject = new Rx.Subject<number>();
        let prop = subject.toProperty();
        let errorCount = 0;

        prop.thrownExceptions.subscribe(x => errorCount++);
        subject.onError('error');

        expect(errorCount).toEqual(1);
    });

    it("allows connecting an error handler at construction", () => {
        let subject = new Rx.Subject<number>();
        let errorCount = 0;
        let prop = subject.toProperty().catchExceptions(x => errorCount++);

        subject.onError('error');

        expect(errorCount).toEqual(1);
    });
});
