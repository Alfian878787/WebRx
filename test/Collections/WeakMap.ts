/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

describe("IWeakMap",() => {
    function crudSmokeTestImpl(forceEmulated: boolean) {
        let wm = wx.createWeakMap<String, Object>(forceEmulated);

        // set/has/get
        let key = new String("foo");
        let foo = new Object();
        wm.set(key, foo);
        expect(wm.has(key)).toBeTruthy();
        expect(wm.get(key)).toBe(foo);

        // set/has/get
        wm.delete(key);
        expect(wm.has(key)).toBeFalsy();
        expect(wm.get(key)).toBe(undefined);
    }

    it("emulated: creation",() => {
        let wm = wx.createWeakMap<String, Object>(true);
        expect(wm).not.toBeNull();
        expect(wm.isEmulated).toBeTruthy();
    });

    it("emulated: crud smoke-test",() => {
        crudSmokeTestImpl(true);
    });

    let hasNativeSupport = typeof WeakMap === "function";

    if (hasNativeSupport) {
        it("native: creation",() => {
            let wm = wx.createWeakMap<String, Object>();
            expect(wm).not.toBeNull();
            expect(wm.isEmulated).toBeFalsy();
        });

        it("native: crud smoke-test",() => {
            crudSmokeTestImpl(false);
        });
    }
});
