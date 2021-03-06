﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../TestModels.ts" />
/// <reference path="../typings/l2o.d.ts" />

describe('Bindings',() => {
    beforeEach(() => {
        testutils.ensureDummyAnimations();
    });

    function createTestList() {
        let item1 = new TestViewModel(1, "foo");
        let item2 = new TestViewModel(5, "bar");
        let item3 = new TestViewModel(7, "baz");

        return wx.list([item1, item2, item3]);
    }

    function testImpl(fixturePostfix: string) {
        describe('ForEach' + fixturePostfix, () => {
            it('binding to a standard array', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-array" + fixturePostfix);
                let templateLength = el.children.length;
                let list = [1, 5, 7];
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(list);
            });

            it('binding to a standard array and template accessing index', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-array-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let list = [1, 5, 7];
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());
            });

            it('binding to a property yielding an array', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-array-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let prop = wx.property([]);

                expect(() => wx.applyBindings({ src: prop }, el)).not.toThrowError();
                expect(el.children.length).toEqual(prop().length * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, prop().length).toArray());

                let list = [1, 5, 7];
                prop(list);
                expect(el.children.length).toEqual(prop().length * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, prop().length).toArray());
            });

            it('binding to a standard array - inline', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-array-inline" + fixturePostfix);
                let templateLength = el.children.length;
                expect(() => wx.applyBindings({}, el)).not.toThrowError();

                expect(el.children.length).toEqual(3 * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual([1, 5, 7]);
            });

            it('binding to a observable list containing numbers', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-scalar" + fixturePostfix);
                let templateLength = el.children.length;
                let list = wx.list([1, 5, 7]);
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length() * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray());
            });

            it('binding to a observable list containing numbers without initialContents', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-scalar" + fixturePostfix);
                let templateLength = el.children.length;
                let list = wx.list();

                for (let i = 0; i < 10; i++) {
                    list.add(i);
                }

                expect(list.length()).toEqual(10);
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                //console.log((<any> el).innerHTML);

                expect(el.children.length).toEqual(list.length() * templateLength);
                expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray());
            });

            it('binding to a observable list containing model', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model" + fixturePostfix);
                let templateLength = el.children.length;
                let list = createTestList();
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length() * templateLength);
                expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray().map(x => x.foo()));
                expect($(el).children(".part2").map((index, node) => node.textContent).get()).toEqual(list.toArray().map(x => x.bar()));
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual([5, 5, 5]);
            });

            it('binding to a observable list containing model and template accessing index', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let list = createTestList();
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length() * templateLength);
                expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray().map(x => x.foo()));
                expect($(el).children(".part2").map((index, node) => node.textContent).get()).toEqual(list.toArray().map(x => x.bar()));
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());
                expect($(el).children(".part4").map((index, node) => node.textContent).get()).toEqual(Ix.Enumerable.range(0, list.length()).select(x => "foo" + x).toArray());
            });

            it('observable list manipulation smoke-test', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let list = createTestList();
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                expect(el.children.length).toEqual(list.length() * templateLength);
                expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());

                list.add(new TestViewModel(3, "edfsd"));
                expect(el.children.length).toEqual(list.length() * templateLength);

                list.set(2, new TestViewModel(42, "magic"));
                expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.move(2, 0);
                expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.removeAt(1);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());
                expect(parseInt(el.children[1 * templateLength].textContent)).toEqual(list.get(1).foo());
                expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

                list.move(0, 2);
                expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.clear();
                expect(el.children.length).toEqual(0);

                list.add(new TestViewModel(42, "magic"));
                expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());
                expect(el.children[0 * templateLength + 1].textContent).toEqual(list.get(0).bar());

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.addRange(createTestList().toArray());
                expect(el.children.length).toEqual(list.length() * templateLength);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());
            });

            it('$index calculation when bound to observable list smoke-test', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let list = createTestList();
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.add(new TestViewModel(3, "edfsd"));
                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.removeAt(0);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());
            });

            it('observable list item property-changes propagate to DOM', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model-with-index" + fixturePostfix);
                let templateLength = el.children.length;
                let list = createTestList();
                expect(() => wx.applyBindings({ src: list }, el)).not.toThrowError();

                list.forEach((x) => x.foo(33));
                expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.map(x => x.foo()));
            });

            it('observable list with animation-hooks', () => {
                loadFixtures('templates/Bindings/ForEach.html');

                const el = <HTMLElement> document.querySelector("#foreach-list-model-with-index-and-hooks" + fixturePostfix);
                let list = createTestList();
                let beforeRemoveCount = 0;
                let afterRenderCount = 0;
                let afterAddCount = 0;
                let beforeMoveCount = 0;
                let afterMoveCount = 0;

                let hooks: wx.IForEachBindingHooks = {
                    afterRender: (nodes: Node[], data: any) => {
                        afterRenderCount++;
                    },
                    afterAdd: (nodes: Node[], data: any, index: number) => {
                        afterAddCount++;
                    },
                    beforeRemove: (nodes: Node[], data: any, index: number) => {
                        beforeRemoveCount++;

                        nodes.forEach(node => node.parentNode.removeChild(node));
                    },
                    beforeMove: (nodes: Node[], data: any, index: number) => {
                        beforeMoveCount++;
                    },
                    afterMove: (nodes: Node[], data: any, index: number) => {
                        afterMoveCount++;
                    }
                };

                expect(() => wx.applyBindings({ src: list, hooks: hooks }, el)).not.toThrowError();

                expect(afterRenderCount).toEqual(3);

                list.add(new TestViewModel(3, "edfsd"));
                expect(afterAddCount).toEqual(1);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.removeAt(0);
                expect(beforeRemoveCount).toEqual(1);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());

                list.move(2, 0);
                expect(beforeMoveCount).toEqual(1);
                expect(afterMoveCount).toEqual(1);

                // verify indexes
                expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length()).toArray());
            });
        });
    }

    testImpl("");
    testImpl("-animated");
});