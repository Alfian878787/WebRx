/// <reference path="typings/jasmine.d.ts" />
/// <reference path="TestUtils.ts" />

describe("TestUtils",() => {
    it("trackSubscriptions smoke-test",() => {
        let sub = new Rx.Subject<number>();
        let track = testutils.trackSubscriptions(sub);

        expect(track.count).toEqual(0);

        let disp = new Rx.CompositeDisposable();
        sub.onNext(1);
        expect(track.count).toEqual(0);

        disp.add(track.observable.subscribe(x => { }));
        expect(track.count).toEqual(1);
        disp.add(track.observable.subscribe(x => { }));
        expect(track.count).toEqual(2);

        disp.dispose();
        expect(track.count).toEqual(0);

        // make sure the wrapped observable forwards correctly
        let nextFired = false, errorFired = false, completedFired = false;
        track.observable.subscribe(x => nextFired = true, x=> errorFired = true, ()=> completedFired = true);
        sub.onNext(4100);
        sub.onError(new Error("foo"));
        sub.onCompleted();
        expect(nextFired).toBeTruthy();
        expect(errorFired).toBeTruthy();
        expect(track.count).toEqual(0); // Subject's onCompleted should release subscriptions
    });
});
