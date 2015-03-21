﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Component', () => {
        it('Loads a component using simple string options',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").component("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component using object-literal options',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").component("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component using its name as tag',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture3");
            expect(() => wx.applyBindings({ foo: 'bar' }, el)).not.toThrow();

            expect(el.children[0].textContent).toEqual('bar');
        });

        it('Loads a template from a string',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").component("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a template from a node-array',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").component("test1", <wx.IComponent> {
                template: <any> wx.app.templateEngine.parse(template)
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a template from a selector',() => {
            loadFixtures('templates/Bindings/Component.html');

            wx.module("test").component("test1", <wx.IComponent> {
                template: <any> { element: '#template1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a template from a node instance',() => {
            loadFixtures('templates/Bindings/Component.html');

            wx.module("test").component("test1", <wx.IComponent> {
                template: <any> { element: document.querySelector("#template1") }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a template through injector',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            wx.injector.register("#template1", wx.app.templateEngine.parse(template));

            wx.module("test").component("test1", <wx.IComponent> {
                template: <any> { resolve: "#template1" }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it("Loads a template through an AMD module loader",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            var el = <HTMLElement> document.querySelector("#fixture2");

            var vm = {
                init: function () {
                    expect(el.innerHTML).toEqual("<span>foo</span>");
                    done();
                }
            };

            wx.module("test").component("test1", <wx.IComponent> {
                template: <any> {
                     require: 'text!templates/AMD/template1.html'
                },
                viewModel: <any> { instance: vm },
                postBindingInit: "init"
            });

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it("When the component isn't supplying a view-model, binding against parent-context works as expected",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").component("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings({ foo: 'bar' }, el)).not.toThrow();

            expect(el.children[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from a factory method",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: (params) => { return { foo: 'bar' }; }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
            
            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through injector",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";
            wx.injector.register("vm1", { foo: 'bar' });

            wx.module("test").component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: <any> { resolve: 'vm1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from an instance",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: <any> { instance: { foo: 'bar' } } 
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through an AMD module loader",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").component("test1", <wx.IComponent> <any>  {
                template: template,
                viewModel: <any> { require: 'templates/AMD/vm1' },
                postBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture2");

            window["vm1Hook"] = () => {
                delete window["vm1Hook"];

                expect(el.childNodes[0].textContent).toEqual('bar');
                done();
            }

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it("Params get passed to view-model constructor",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var fooVal: number;

            wx.module("test").component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: (params) => {
                    fooVal = params.foo;
                    return { foo: 'bar' };
                }
            });

            var el = <HTMLElement> document.querySelector("#fixture4");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(fooVal).toEqual(42);
        });

        it("invokes preBindingInit",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var invoked = false;
            var __this: any;
            var elementArg = false;
            var vm: any;

            vm = {
                init: function (el: HTMLElement) {  // don't convert this to a lamba or the test will suddenly fail due to Typescript's this-capturing
                    invoked = true;
                    __this = this;
                    elementArg = el instanceof HTMLElement;
                }
            };

            wx.app.component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: { instance: vm },
                preBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture5");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(invoked).toBeTruthy();
            expect(__this).toBe(vm);
            expect(elementArg).toBeTruthy();
        });

        it("invokes postBindingInit",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var invoked = false;
            var __this: any;
            var elementArg = false;

            var vm: any;
            
            vm = {
                init: function(el: HTMLElement) {   // don't convert this to a lamba or the test will suddenly fail due to Typescript's this-capturing
                    invoked = true;
                    __this = this;
                    elementArg = el instanceof HTMLElement;
                }
            };

            wx.app.component("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: { instance: vm },
                postBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture5");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(invoked).toBeTruthy();
            expect(__this).toBe(vm);
            expect(elementArg).toBeTruthy();
        });
    });
});