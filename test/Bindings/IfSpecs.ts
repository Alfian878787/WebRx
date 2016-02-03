﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings',() => {
    beforeEach(() => {
        testutils.ensureDummyAnimations();
    });

    function testImpl(fixturePostfix: string) {
        describe('If' + fixturePostfix, () => {
            it('binding to a boolean constant (true) using static template', () => {
                loadFixtures('templates/Bindings/If.html');

                const el = <HTMLElement> document.querySelector("#if-constant-boolean-true" + fixturePostfix);
                let backup = el.innerHTML;
                expect(() => wx.applyBindings({}, el)).not.toThrowError();
                expect(el.innerHTML).toEqual(backup);
            });

            it('binding to a boolean constant (false) using static template', () => {
                loadFixtures('templates/Bindings/If.html');

                const el = <HTMLElement> document.querySelector("#if-constant-boolean-false" + fixturePostfix);
                let backup = el.innerHTML;
                expect(() => wx.applyBindings({}, el)).not.toThrowError();
                expect(el.innerHTML).toEqual('');
            });

            it('binding to a boolean observable property using static template', () => {
                loadFixtures('templates/Bindings/If.html');

                const el = <HTMLElement> document.querySelector("#if-observable-boolean-property" + fixturePostfix);
                let backup = el.innerHTML;
                let prop = wx.property(true);
                expect(() => wx.applyBindings(prop, el)).not.toThrowError();
                expect(el.innerHTML).toEqual(backup);
                prop(false);
                expect(el.innerHTML).toEqual('');

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                prop(true);
                expect(el.innerHTML).toEqual('');
            });

            it('binding to a boolean observable using static template', () => {
                loadFixtures('templates/Bindings/If.html');

                const el = <HTMLElement> document.querySelector("#if-observable-boolean" + fixturePostfix);
                let backup = el.innerHTML;
                let obs = new Rx.Subject<boolean>();
                expect(() => wx.applyBindings(obs, el)).not.toThrowError();
                expect(el.innerHTML).toEqual(backup);
                obs.onNext(false);
                expect(el.innerHTML).toEqual('');

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                obs.onNext(true);
                expect(el.innerHTML).toEqual('');
            });

            it('binding to a boolean observable property using dynamic template', () => {
                loadFixtures('templates/Bindings/If.html');

                const el = <HTMLElement> document.querySelector("#if-observable-boolean-dynamic" + fixturePostfix);
                let prop = wx.property(true);
                expect(() => wx.applyBindings(prop, el)).not.toThrowError();
                expect($(el).children("span")).toHaveText("foo");

                // try it again
                wx.cleanNode(el);
                expect(() => wx.applyBindings(prop, el)).not.toThrowError();
                expect($(el).children("span").length).toEqual(1);
                expect($(el).children("span")).toHaveText("foo");
            });

            it('binding to a boolean observable property using dynamic template with command', () => {
                loadFixtures('templates/Bindings/If.html');

                let model = {
                    show: wx.property(true),
                    cmd: wx.command(() => {})
                };

                const el = <HTMLElement> document.querySelector("#if-observable-boolean-command" + fixturePostfix);
                expect(() => wx.applyBindings(model, el)).not.toThrowError();

                let count = 0;
                let disp = model.cmd.results.subscribe(x => count++);
                expect(count).toEqual(0);
                testutils.triggerEvent($(el).children("button")[0], "click");
                expect(count).toEqual(1);

                // try it again
                wx.cleanNode(el);
                testutils.triggerEvent($(el).children("button")[0], "click");
                expect(count).toEqual(1);
                disp.dispose();
            });
        });
    }

    testImpl("");
    testImpl("-animated");
});