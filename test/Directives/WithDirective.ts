﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('with', () => {
        it('binding to a non-observable property', () => {
            loadFixtures('templates/Directives/With.html');

            var childModel = {
                foo: wx.property("bar")
            };

            var model = {
                childModel: childModel
            };

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect($(el).find("span")[0].innerText).toEqual(model.childModel.foo());
            model.childModel.foo("foo");
            expect($(el).find("span")[0].innerText).toEqual(model.childModel.foo());

            // try it again
            wx.cleanNode(el);
            model.childModel.foo("baz");
            expect($(el).find("span")[0].innerText).not.toEqual(model.childModel.foo());
        });

        it('binding to a observable property',() => {
            loadFixtures('templates/Directives/With.html');

            var childModel1 = {
                foo: wx.property("bar")
            };

            var childModel2 = {
                foo: wx.property("magic")
            };

            var model = {
                childModel: wx.property<any>()
            };

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el).find("span")[0].innerText).toEqual("undefined");

            model.childModel(childModel1);
            expect($(el).find("span")[0].innerText).toEqual(childModel1.foo());
            model.childModel().foo("foo");
            expect($(el).find("span")[0].innerText).toEqual(childModel1.foo());

            model.childModel(childModel2);
            expect($(el).find("span")[0].innerText).toEqual(childModel2.foo());

            // try it again
            wx.cleanNode(el);
            model.childModel().foo("baz");
            expect($(el).find("span")[0].innerText).not.toEqual(childModel2.foo());
        });
    });
});