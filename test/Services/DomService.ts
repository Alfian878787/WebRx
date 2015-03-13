﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('DomService',() => {
    var domService = wx.injector.resolve<wx.IDomService>(wx.res.domService);

    describe('extractBindingsFromDataAttribute',() => {
        it('smoke-test',() => {
            loadFixtures('templates/Services/DomService.html');
            
             // stand-alone (no context- or model-references)
            var el = document.querySelector("#stand-alone");
            var def: any = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");

            // model-relative
            el = document.querySelector("#model-relative");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");

            // data-relative (same as model just with $data. qualifier)
            el = document.querySelector("#data-relative");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");

            // parent-relative
            el = document.querySelector("#parent-relative");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[2].key).toEqual("css");

            // root-relative
            el = document.querySelector("#root-relative");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");

            // model-relative-with-parent-property-ref
            el = document.querySelector("#model-relative-with-parent-property-ref");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");

            // window-and-model-relative
            el = document.querySelector("#window-and-model-relative");
            def = null;
            expect(() => def = domService.extractBindingsFromDataAttribute(el)).not.toThrowError();
            expect(def[0].key).toEqual("text");
            expect(def[1].key).toEqual("css");
            expect(def[2].key).toEqual("baz");
        });
    });

    describe('applyBindings',() => {
        it('invoking multiple on same node times throws error',() => {
            loadFixtures('templates/Services/DomService.html');

            var el = document.querySelector("#stand-alone");
            var model1 = new Object();
            var model2 = new Object();

            expect(() => domService.applyBindings(model1, el)).not.toThrow();

            // attempt to re-bind should throw regardless of model
            expect(() => domService.applyBindings(model1, el)).toThrow();
            expect(() => domService.applyBindings(model2, el)).toThrow();
        });

        it('invoking on a node with a binding-definition referencing a non-registered directive throws an error',() => {
            loadFixtures('templates/Services/DomService.html');

            var el = document.querySelector("#stand-alone-non-registered");
            var model1 = new Object();

            expect(() => domService.applyBindings(model1, el)).toThrowError(/binding.+not.+registered/);
        });
    });

    describe('compileBindingOptions',() => {
        var def = "{ text: 'foo', css: { foo: numVal > 3, bar: boolVal, baz: numVal, options: { enable: boolVal } }, visible: 8*4 }";

        it('handles nested definitions',() => {
            var compiled: any;
            var scope = {};

            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            expect(compiled).not.toBeNull();
            expect(compiled.hasOwnProperty("text")).toBeTruthy();
            expect(compiled.hasOwnProperty("css")).toBeTruthy();
            expect(compiled.hasOwnProperty("visible")).toBeTruthy();
            expect(compiled.css.hasOwnProperty("options")).toBeTruthy();
            expect(compiled.css.options.hasOwnProperty("enable")).toBeTruthy();
            expect(typeof compiled.css.options.enable === "function").toBeTruthy();
            expect(compiled.css.options.enable(scope)).toEqual(undefined);
            expect(typeof compiled.visible === "function").toBeTruthy();
            expect(compiled.visible(scope)).toEqual(32);
        });

        it('throws when using function calls in expressions',() => {
            var def = "{ text: $scope.foo() }";
            var compiled: any;

            expect(() => compiled = domService.compileBindingOptions(def)).toThrowError();
        });
    });

    describe('expressionToObservable',() => {
        it('correctly maps data context to locals',() => {
            var def = "{ ctx: { data: $data, root: $root, parent: $parent, parents: $parents, index: $index } }";
            var compiled: any;
            var model: any = {
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            expect(domService.expressionToObservable(compiled.ctx.data, ctx).toProperty()()).toBe(ctx.$data);
            expect(domService.expressionToObservable(compiled.ctx.root, ctx).toProperty()()).toBe(ctx.$root);
            expect(domService.expressionToObservable(compiled.ctx.parent, ctx).toProperty()()).toBe(ctx.$parent);
            expect(domService.expressionToObservable(compiled.ctx.parents, ctx).toProperty()()).toBe(ctx.$parents);
        });

        it('returns the current value of the expression upon subscription',() => {
            var def = "2 + 2";
            var compiled: any;
            var model: any = {
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var value;
            var obs = domService.expressionToObservable(compiled, ctx);

            obs.subscribe(x => value = x);
            expect(value).toEqual(4);
        });

        it('re-evaluates expression when observable expression dependencies change',() => {
            var def = "{ text: foo + bar }";
            var compiled: any;

            var model: any = {
                foo: wx.property(42),
                bar: wx.property("hello")
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var prop = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(prop()).toEqual("42hello");

            model.bar("world");
            expect(prop()).toEqual("42world");

            model.foo(1);
            expect(prop()).toEqual("1world");
        });

        it('when an expression yields an observable without touching observable properties, return it',() => {
            var def = "{ text: foo }";
            var compiled: any;

            var model: any = {
                foo: Rx.Observable.return(3)
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var prop = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(prop.source).toBe(model.foo);
        });

        it('handles access to nested observable properties correctly',() => {
            var def = "{ text: foo.bar, html: foo.baz.foo }";
            var compiled: any;

            var grandChildModel = {
                foo: wx.property("<span>hello</hello>")
            };

            var childModel = {
                bar: wx.property(42),
                baz: wx.property()
            };

            var model: any = {
                foo: wx.property()
            };

            var ctx = testutils.createModelContext(model);

            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var text = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            var html = domService.expressionToObservable(compiled['html'], ctx).toProperty();
            expect(text()).not.toBeDefined();
            expect(html()).not.toBeDefined();

            model.foo(childModel);
            expect(text()).toEqual(42);

            childModel.bar(3);
            expect(text()).toEqual(3);

            childModel.baz(grandChildModel);
            expect(html()).toEqual(grandChildModel.foo());

            model.foo(undefined);
            expect(text()).not.toBeDefined();
        });

        it('handles access to observable properties through object or array index',() => {
            var def = "{ text: foo[1], html: bar['foo'] }";
            var compiled: any;

            var model: any = {
                foo: [null, wx.property("hello")],
                bar: { 'foo': wx.property("world") }
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var text = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(text()).toEqual("hello");

            model.foo[1]("bye");
            expect(text()).toEqual("bye");

            var html = domService.expressionToObservable(compiled['html'], ctx).toProperty();
            expect(html()).toEqual("world");

            model.bar['foo']("bye");
            expect(html()).toEqual("bye");
        });

        it('handles access to observable properties in observable lists through read and write indexers',() => {
            var def = "{ text: foo[0] }";
            var compiled: any;

            var model: any = {
                foo: wx.list([wx.property("world")])
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var text = domService.expressionToObservable(compiled['text'], ctx).toProperty();

            // index access should be translated to list.get(index)
            expect(text()).toEqual("world");

            // list.collectionChanged should be monitored
            model.foo.insert(0, wx.property("hello"));
            expect(text()).toEqual("hello");

            // change indexed property value (write-indexer test)
            model.foo.get(0)("foo");
            expect(text()).toEqual("foo");

            model.foo.clear();
            expect(text()).not.toBeDefined();
        });

        it('diposing the subscription should stop producing values',() => {
            var def = "{ text: foo + bar }";
            var compiled: any;

            var model: any = {
                foo: wx.property(42),
                bar: wx.property("hello")
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            // count evals
            var evalCount = 0;
            var evalObs = Rx.Observer.create<any>(x => evalCount++);

            var obs = domService.expressionToObservable(compiled['text'], ctx, evalObs);
            var val;
            var disp = obs.subscribe(x => val = x);
            expect(val).toEqual("42hello");

            evalCount = 0;
            disp.dispose();

            model.bar("world");
            model.bar("foo");
            model.bar("bar");
            expect(val).toEqual("42hello");
            expect(evalCount).toEqual(0);
        });

        it('seamlessly handles normal values and obserables',() => {
            var def = "{ text: foo }";
            var compiled: any;

            var model: any = {
                foo: wx.property(<any> 3)
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            var prop = domService.expressionToObservable(compiled['text'], ctx).toProperty();

            // number
            expect(prop()).toEqual(3);

            // observable
            model.foo(Rx.Observable.return(42));
            expect(prop()).toEqual(42);

            // string
            model.foo("foo");
            expect(prop()).toEqual("foo");

            // observable
            model.foo(Rx.Observable.return("bar"));
            expect(prop()).toEqual("bar");
        });

        it('returned observable shares subscriptions',() => {
            var def = "{ text: foo + bar }";
            var compiled: any;

            var model: any = {
                foo: wx.property(42),
                bar: wx.property("hello")
            };

            var ctx = testutils.createModelContext(model);
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();

            // count evals
            var evalCount = 0;
            var evalObs = Rx.Observer.create<any>(x => evalCount++);
            var obs = domService.expressionToObservable(compiled['text'], ctx, evalObs);

            var val;
            obs.subscribe(x => { val = x });
            obs.subscribe(x => { val = x });
            model.foo(3);

            expect(evalCount).toEqual(1 + 1);   // + 1 for initial evaluation
        });

        it('an expression evaluating to an observable property result, using the @-modifier should return the property itself instead of its value ',() => {
            var compiled: any;

            var model: any = {
                foo: wx.property<any>("baz")
            };

            var ctx = testutils.createModelContext(model);

            var def = "{ text: @foo }";
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();
            var result = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(result()).toBe(model.foo);

            // increase complexity
            var childModel: any = {
                bar: wx.property<any>("foo")
            };
            model.foo(childModel);

            def = "{ text: @foo.bar }";
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();
            result = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(result()).toBe(childModel.bar);

            // increase complexity even more (trigger use of cspSafeGetterFn)
            var grandChildModel: any = {
                baz: wx.property<any>("bar")
            };
            childModel.bar(grandChildModel);

            def = "{ text: @foo.bar.baz }";
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();
            result = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(result()).toBe(grandChildModel.baz);

            // go nuts (trigger use of cspSafeGetterFn in a loop)
            var model1: any = {
                prop1: wx.property<any>("1")
            };
            grandChildModel.baz(model1);

            var model2: any = {
                prop2: wx.property<any>("2")
            };
            model1.prop1(model2);

            var model3: any = {
                prop3: wx.property<any>("3")
            };
            model2.prop2(model3);

            var model4: any = {
                prop4: wx.property<any>("4")
            };
            model3.prop3(model4);

            var model5: any = {
                prop5: wx.property<any>("5")
            };
            model4.prop4(model5);

            def = "{ text: @foo.bar.baz.prop1.prop2.prop3.prop4 }";
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();
            result = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(result()).toBe(model4.prop4);

            def = "{ text: foo.bar.baz.prop1.prop2.prop3.prop4.prop5 }";
            expect(() => compiled = domService.compileBindingOptions(def)).not.toThrow();
            result = domService.expressionToObservable(compiled['text'], ctx).toProperty();
            expect(result()).toEqual("5");
        });
    });
});