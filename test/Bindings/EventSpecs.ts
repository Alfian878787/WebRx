/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Event',() => {
        it('binds a single event to a handler function',() => {
            loadFixtures('templates/Bindings/Event.html');

            var el = <HTMLElement> document.querySelector("#event-single");

            var called = false;
            var eventName = undefined;
            var calledWithValidContext = false;
            var calledWithValidEvent = false;
            var callCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext, e: Event) => {
                    callCount++;
                    called = true;
                    eventName = e.type;

                    if (ctx.hasOwnProperty("$data"))
                        calledWithValidContext = true;

                    if (e instanceof window['Event'])
                        calledWithValidEvent = true;
                }
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(called).not.toBeTruthy();
            expect(eventName).not.toEqual("click");
            expect(calledWithValidContext).not.toBeTruthy();
            expect(calledWithValidEvent).not.toBeTruthy();

            testutils.triggerEvent(el, "click");

            expect(called).toBeTruthy();
            expect(eventName).toEqual("click");
            expect(calledWithValidContext).toBeTruthy();
            expect(calledWithValidEvent).toBeTruthy();

            wx.cleanNode(el);
            called = false;

            // should no longer fire
            testutils.triggerEvent(el, "click");

            expect(called).toBeFalsy();
        });

        it('binds multiple events to handler functions',() => {
            loadFixtures('templates/Bindings/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext, e: Event) => {
                    clickCallCount++;
                },
                inputHandler: (ctx: wx.IDataContext, e: Event) => {
                    inputCallCount++;
                }
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(1);

            $(el).val("new");
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(0);

            $(el).val("old");
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple events to observers',() => {
            loadFixtures('templates/Bindings/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple-observer");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var clickSubject = new Rx.Subject<Event>();
            var inputSubject = new Rx.Subject<Event>();

            var model = {
                clickObserver: Rx.Observer.create<Event>((x) => { clickSubject.onNext(x) }),
                inputObserver: Rx.Observer.create<Event>((x) => { inputSubject.onNext(x) })
            };

            clickSubject.subscribe(x => clickCallCount++);
            inputSubject.subscribe(x => inputCallCount++);

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(1);

            el.value = "new";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(0);

            el.value = "old";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple events to commands',() => {
            loadFixtures('templates/Bindings/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple-command");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var clickSubject = new Rx.Subject<Event>();
            var inputSubject = new Rx.Subject<Event>();

            var model = {
                clickCommand: wx.command((x) => { clickSubject.onNext(x) }),
                inputCommand: wx.command((x) => { inputSubject.onNext(x) })
            };

            clickSubject.subscribe(x => clickCallCount++);
            inputSubject.subscribe(x => inputCallCount++);

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(1);

            el.value = "new";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            testutils.triggerEvent(el, "click");
            expect(clickCallCount).toEqual(0);

            el.value = "old";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple events to commands with params',() => {
            loadFixtures('templates/Bindings/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple-command-with-params");

            var clicks = [];

            var model = {
                clickCommand: wx.command((x) => { clicks.push(x); })
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clicks.length).toEqual(0);

            testutils.triggerEvent(el, "click");
            expect(clicks.length).toEqual(1);
            expect(clicks[0]).toEqual('foo');

            wx.cleanNode(el);
            clicks = [];

            // should no longer fire
            testutils.triggerEvent(el, "click");
            expect(clicks.length).toEqual(0);
        });
    });
});