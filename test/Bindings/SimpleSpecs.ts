/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings', () => {
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

    let simpleTextBinding:wx.ISimpleBindingHandler = {
        update:(el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager,
            state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule)=> {
            if(typeof el === 'undefined')
                throw Error("el");
            if(typeof state === 'undefined')
                throw Error("state");
            if(typeof ctx === 'undefined')
                throw Error("ctx");
            if(typeof domManager === 'undefined')
                throw Error("domManager");
            if(typeof cleanup === 'undefined')
                throw Error("cleanup");

            if ((value === null) || (value === undefined))
                value = "";
            else
                value = wx.unwrapProperty(value);

            el.textContent = value;
        }
    };

    let simpleTextBindingWithOptions:wx.ISimpleBindingHandler = {
        update:(el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager,
            state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule)=> {
            if(typeof el === 'undefined')
                throw Error("el");
            if(typeof state === 'undefined')
                throw Error("state");
            if(typeof ctx === 'undefined')
                throw Error("ctx");
            if(typeof domManager === 'undefined')
                throw Error("domManager");
            if(typeof cleanup === 'undefined')
                throw Error("cleanup");

            var text = (value.text === null) || (value.text === undefined) ? "" : wx.unwrapProperty(value.text);
            let index = typeof value.index !== 'undefined' ? wx.unwrapProperty(value.index) : '';

            el.textContent = text + wx.unwrapProperty(index);
        }
    };

    let simpleTextInput:wx.ISimpleBindingHandler = {
        init: (el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager,
            state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule)=> {
            cleanup.add(Rx.Observable.fromEvent(el, "change").subscribe(x=> {
                // update model
                value((<HTMLInputElement> el).value);
            }));
        }, update:(el: HTMLElement, value: any, ctx: wx.IDataContext, domManager: wx.IDomManager,
            state: any, cleanup: Rx.CompositeDisposable, module: wx.IModule)=> {
            if(typeof el === 'undefined')
                throw Error("el");
            if(typeof state === 'undefined')
                throw Error("state");
            if(typeof ctx === 'undefined')
                throw Error("ctx");
            if(typeof domManager === 'undefined')
                throw Error("domManager");
            if(typeof cleanup === 'undefined')
                throw Error("cleanup");

            // update dom
            var result = (value === null) || (value === undefined) ? "" : wx.unwrapProperty(value);
            (<HTMLInputElement> el).value = result;
        }
    };

    beforeAll(() => {
        wx.app.binding('simple-text', simpleTextBinding);
        wx.app.binding('simple-text-with-options', simpleTextBindingWithOptions);
        wx.app.binding('simple-textinput', simpleTextInput);
    });

    describe('Simple', () => {
        describe('One-Way', () => {
            it('binding to a string constant', () => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-constant-string");
                let model = {};

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual('foo');
            });

            it('binding to a non-observable model property', () => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-non-observable-model-property");
                let model = createModel();

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual(model.constantString);
            });

            it('binding to a observable model property', () => {
                loadFixtures('templates/Bindings/Simple.html');

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
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-observable-model-propref");
                let model = createModel();

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual(model.observableString());

                model.observableString("magic");
                expect(el.textContent).toEqual(model.observableString());
            });
         });

        describe('One-Way With Options', () => {
            it('binding to a string constant', () => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-constant-string-with-options");
                let model = {};

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual('foo');
            });

            it('binding to a non-observable model property', () => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-non-observable-model-property-with-options");
                let model = createModel();

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual(model.constantString + '3');
            });

            it('binding to a observable model property', () => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-observable-model-property-with-options");
                let model = createModel();

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual(model.observableString() + '2');

                // should reflect property changes
                model.observableString("magic");
                expect(el.textContent).toEqual(model.observableString() + '2');

                // binding should stop updating after getting disposed
                let oldValue = model.observableString() + '2';
                wx.cleanNode(el);
                model.observableString("nope");
                expect(el.textContent).toEqual(oldValue);
            });

            it('binding to a observable model @propref',() => {
                loadFixtures('templates/Bindings/Simple.html');

                const el = document.querySelector("#text-observable-model-propref-with-options");
                let model = createModel();

                expect(el.textContent).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.textContent).toEqual(model.observableString() + '1');
            });
        });

        describe('Two-Way', () => {
            it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', ()=> {
                loadFixtures('templates/Bindings/Simple.html');

                const el = <HTMLInputElement> document.querySelector("#textinput-observable-model-propref");
                let model = createModel();

                // Text Model to View
                expect(el.value).toEqual('invalid');
                expect(() => wx.applyBindings(model, el)).not.toThrowError();
                expect(el.value).toEqual(model.observableString());

                // Text Model to View
                model.observableString("magic");
                expect(el.value).toEqual(model.observableString());

                // Text View to Model
                const input = "foobarbaz";
                el.value = input;
                testutils.triggerEvent(el, "change");
                expect(model.observableString()).toEqual(input);
            });
        });
    });
});