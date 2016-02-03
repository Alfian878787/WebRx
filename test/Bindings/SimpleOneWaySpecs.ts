/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

function createModel() {
    return {
        constantString: "bar",
        constantBool: true,
        constantNumeric: 42,
        observableString: wx.property("voodoo"),
        observableBool: wx.property(true),
        observableNumeric: wx.property(96)
    }
};

describe('Bindings', () => {
    describe('Text', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-constant-string");
            let model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('foo');
        });

        it('binding to a numeric constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-constant-numeric");
            let model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('42');
        });

        it('binding to a falsy numeric model property',() => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-model");
            let model = 0;

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('0');
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-constant-boolean");
            let model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('true');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-non-observable-model-property");
            let model = createModel();

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual(model.constantString);
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-observable-model-property");
            let model = createModel();

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual(model.observableString());

            // should reflect property changes
            model.observableString("magic");
            expect(el.textContent).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            let oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.textContent).toEqual(oldValue);
        });

        it('binding to a observable model @propref',() => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-observable-model-propref");
            let model = createModel();

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.textContent).toEqual(model.observableString());
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#text-observable-model");
            let model = createModel();
            model["changed"] = model.observableString.changed;

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableString("magic");
            expect(el.textContent).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            let oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.textContent).toEqual(oldValue);
        });
    });


    describe('Visible', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-constant-numeric");
            let model = {};

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-constant-boolean");
            let model = {};

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-non-observable-model-property");
            let model = createModel();

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-observable-model-property");
            let model = createModel();

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).toBeHidden();
        });

        it('binding to a observable model @propref',() => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-observable-model-propref");
            let model = createModel();

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-observable-model");
            let model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).toBeHidden();
        });

        it('binding to an observable model property (using css classes)', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#visible-observable-model-property-css");
            let model = createModel();

            // configure handler
            let domManager = wx.injector.get<wx.IDomManager>(wx.res.domManager);
            let handler = wx.app.binding("visible");
            let handlerOptions: wx.IVisibleBindingOptions = { useCssClass: true, hiddenClass: 'hidden' };
            handler.configure(handlerOptions);

            let disp = Rx.Disposable.create(() => {
                handlerOptions.useCssClass = false;
                handler.configure(handlerOptions);
            });

            wx.using(disp, () => {
                expect($(el)).not.toHaveClass("hidden");
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect($(el)).not.toHaveClass("hidden");

                // should reflect property changes
                model.observableBool(false);
                expect($(el)).toHaveClass("hidden");
                model.observableBool(true);
                expect($(el)).not.toHaveClass("hidden");

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                model.observableBool(false);
                expect($(el)).not.toHaveClass("hidden");
            });
        });
    });

    describe('Hidden', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-constant-numeric");
            let model = {};

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-constant-boolean");
            let model = {};

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-non-observable-model-property");
            let model = createModel();

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-observable-model-property");
            let model = createModel();

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).not.toBeHidden();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-observable-model");
            let model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).not.toBeHidden();
        });

        it('binding to an observable model property (using css classes)', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#hidden-observable-model-property-css");
            let model = createModel();

            // configure handler
            let domManager = wx.injector.get<wx.IDomManager>(wx.res.domManager);
            let handler = wx.app.binding("hidden");
            let handlerOptions: wx.IVisibleBindingOptions = { useCssClass: true, hiddenClass: 'hidden' };
            handler.configure(handlerOptions);

            let disp = Rx.Disposable.create(() => {
                handlerOptions.useCssClass = false;
                handler.configure(handlerOptions);
            });

            wx.using(disp, () => {
                expect($(el)).toHaveClass("hidden");
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect($(el)).toHaveClass("hidden");

                // should reflect property changes
                model.observableBool(false);
                expect($(el)).not.toHaveClass("hidden");
                model.observableBool(true);
                expect($(el)).toHaveClass("hidden");

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                model.observableBool(false);
                expect($(el)).toHaveClass("hidden");
            });
        });
    });

    describe('Enable', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-constant-numeric");
            let model = {};

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-constant-boolean");
            let model = {};

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-non-observable-model-property");
            let model = createModel();

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-observable-model-property");
            let model = createModel();

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeDisabled();
            model.observableBool(true);
            expect($(el)).not.toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a observable model @propref',() => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-observable-model-propref");
            let model = createModel();

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#enabled-observable-model");
            let model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeDisabled();
            model.observableBool(true);
            expect($(el)).not.toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
        });
    });

    describe('Disable', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#disabled-constant-numeric");
            let model = {};

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#disabled-constant-boolean");
            let model = {};

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#disabled-non-observable-model-property");
            let model = createModel();

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#disabled-observable-model-property");
            let model = createModel();

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
            model.observableBool(true);
            expect($(el)).toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).toBeDisabled();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = document.querySelector("#disabled-observable-model");
            let model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
            model.observableBool(true);
            expect($(el)).toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).toBeDisabled();
        });
    });

    describe('HTML', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = <HTMLElement> document.querySelector("#html-constant-string");
            let model = {};

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual('<span>bla</span>');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = <HTMLElement> document.querySelector("#html-non-observable-model-property");
            let model = createModel();
            model.constantString = '<span>bla</span>';

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(model.constantString);
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = <HTMLElement> document.querySelector("#html-observable-model-property");
            let model = createModel();
            model.observableString('<span>bla</span>');

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(model.observableString());

            // should reflect property changes
            model.observableString("magic");
            expect(el.innerHTML).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            let oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.innerHTML).toEqual(oldValue);
        });

        it('binding to a observable model propref',() => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = <HTMLElement> document.querySelector("#html-observable-model-propref");
            let model = createModel();
            model.observableString('<span>bla</span>');

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(model.observableString());
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Bindings/SimpleOneWay.html');

            const el = <HTMLElement> document.querySelector("#html-observable-model");
            let model = createModel();
            model.observableString('<span>bla</span>');
            model["changed"] = model.observableString.changed;

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableString("magic");
            expect(el.innerHTML).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            let oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.innerHTML).toEqual(oldValue);
        });
    });
});