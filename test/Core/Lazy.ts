/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

import Lazy = wx.Lazy;

describe("Lazy",() => {
    it("should not create value in constructor",() => {
        let creatorInvoked = false;

        let lazy = new Lazy(() => {
            creatorInvoked = true;
            return "foobar";
        });

        expect(creatorInvoked).toBeFalsy();
    });

    it("should create the value on access",() => {
        let creatorInvoked = false;

        let lazy = new Lazy(() => {
            creatorInvoked = true;
            return "foobar";
        });

        let dummy = lazy.value;
        expect(creatorInvoked).toBeTruthy();
    });

    it("should return the correct value",() => {
        let expectedValue = "foobar";
        let lazy = new Lazy(() => expectedValue );

        expect(lazy.value).toEqual(expectedValue);
    });
});
