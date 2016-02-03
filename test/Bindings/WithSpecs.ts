/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings', () => {
    describe('With', () => {
        it('bound to a non-observable property', () => {
            loadFixtures('templates/Bindings/With.html');

            let childModel = {
                foo: wx.property("bar")
            };

            let model = {
                childModel: childModel
            };

            const el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect($(el).find("span")[0].textContent).toEqual(model.childModel.foo());
            model.childModel.foo("foo");
            expect($(el).find("span")[0].textContent).toEqual(model.childModel.foo());

            // try it again
            wx.cleanNode(el);
            model.childModel.foo("baz");
            expect($(el).find("span")[0].textContent).not.toEqual(model.childModel.foo());
        });

        it('bound to an observable property',() => {
            loadFixtures('templates/Bindings/With.html');

            let childModel1 = {
                foo: wx.property("bar")
            };

            let childModel2 = {
                foo: wx.property("magic")
            };

            let model = {
                childModel: wx.property<any>()
            };

            const el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el).find("span")[0].textContent).toEqual("");

            model.childModel(childModel1);
            expect($(el).find("span")[0].textContent).toEqual(childModel1.foo());
            model.childModel().foo("foo");
            expect($(el).find("span")[0].textContent).toEqual(childModel1.foo());

            model.childModel(childModel2);
            expect($(el).find("span")[0].textContent).toEqual(childModel2.foo());

            // try it again
            wx.cleanNode(el);
            model.childModel().foo("baz");
            expect($(el).find("span")[0].textContent).not.toEqual(childModel2.foo());
        });
    });
});