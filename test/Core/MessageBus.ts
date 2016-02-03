/// <reference path="../typings/jasmine.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.testing.d.ts" />

describe("MessageBus", () => {
    it("Smoke-Test", () => {
        let input = [1, 2, 3, 4];

        let result = testutils.withScheduler(new Rx.TestScheduler(), sched => {
            let source = new Rx.Subject<number>();
            let fixture = wx.messageBus;

            fixture.registerMessageSource(source, "Test");

            let output = [];
            fixture.listen<number>("Test").subscribe(x => output.push(x));

            testutils.run(input, (x) => source.onNext(x));

            sched.start();
            return output;
        });

        expect(input).toEqual(result);
    });

    it("explicit send message should work even after registering source", () => {
        let fixture = wx.messageBus;
        fixture.registerMessageSource(Rx.Observable.never<number>(), "Test");

        let messageReceived = false;
        fixture.listen<number>("Test").subscribe(_ => messageReceived = true);

        fixture.sendMessage(42, "Test");
        expect(messageReceived).toBeTruthy();
    });

    it("listening before registering a source should work", () => {
        let fixture = wx.messageBus;
        let result = -1;

        fixture.listen<number>("Test").subscribe(x => result = x);
        expect(-1).toEqual(result);

        fixture.sendMessage(42, "Test");
        expect(42).toEqual(result);
    });

    it("registering second message source should merge both sources", () => {
        let bus = wx.messageBus;
        let source1 = new Rx.Subject<number>();
        let source2 = new Rx.Subject<number>();
        let recieved_message1 = false;
        let recieved_message2 = false;

        bus.registerMessageSource(source1, "Test");
        bus.listen<number>("Test").subscribe(x => recieved_message1 = true);

        bus.registerMessageSource(source2, "Test");
        bus.listen<number>("Test").subscribe(x => recieved_message2 = true);

        source1.onNext(1);
        expect(recieved_message1).toBeTruthy();;
        expect(recieved_message2).toBeTruthy();;

        recieved_message1 = false;
        recieved_message2 = false;

        source2.onNext(2);
        expect(recieved_message1).toBeTruthy();;
        expect(recieved_message2).toBeTruthy();;
    });
});
