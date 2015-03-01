﻿/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../node_modules/rx/ts/Rx.all.d.ts" />
/// <reference path="../../build/xircular.d.ts" />
/// <reference path="../TestUtils.ts" />

describe("Command", () => {
    it("implements IUnknown", () => {
        var cmd = wx.command();
        expect(wx.utils.supportsQueryInterface(cmd)).toBeTruthy();
    });

    it("implements ICommand", () => {
        var cmd = wx.command();
        expect(wx.utils.queryInterface(cmd, wx.IID.ICommand)).toBeTruthy();
    });

    it("completely default reactive command should fire", () => {
        var sched = new Rx.TestScheduler();
        var fixture = wx.command(null, sched);
        expect(fixture.canExecute(null)).toBeTruthy();

        var result = null;

        fixture.results.subscribe(x => {
            result = x.toString();
        });

        fixture.execute("Test");
        sched.start();
        expect("Test").toEqual(result);
        fixture.execute("Test2");
        sched.start();
        expect("Test2").toEqual(result);
    });

    it("register sync function smoke-test",() => {
        var invoked = false;
        var fixture = wx.command(()=> invoked = true);

        var results = new Array<number>();
        fixture.results.subscribe(x => results.push(x));

        expect(invoked).toBeFalsy();
        expect(fixture.canExecute(null)).toBeTruthy();

        fixture.execute(null);
        expect(invoked).toBeTruthy();
        expect(results.length).toEqual(1);
    });

    it("execute with sync function doesnt throw on error",() => {
        var fixture = wx.command(() => { throw new Error("foo"); });

        var results = new Array<Error>();
        fixture.thrownExceptions.subscribe(x => results.push(x));

        expect(() => fixture.execute(null)).not.toThrowError();
        expect(results.length).toEqual(1);
        expect("foo").toEqual(results[0].message);
    });

    it("observable canExecute should show up in command", () => {
        var input = [true, false, false, true, false, true];
        var result = testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var can_execute = new Rx.Subject<boolean>();
            var fixture = wx.command(can_execute, sched);
            var changes_as_observable = [];

            var change_event_count = 0;

            fixture.canExecuteObservable.subscribe(x => {
                change_event_count++;
                changes_as_observable.push(x);
            });

            testutils.run(input, x => {
                can_execute.onNext(x);
                sched.start();
                expect(x).toEqual(fixture.canExecute(null));
            });

            // N.B. We check against '5' instead of 6 because we're supposed to 
            // suppress changes that aren't actually changes i.e. false => false
            sched.advanceTo(10 * 1000);
            return changes_as_observable;
        });

        // NB: Skip(1) is because canExecuteObservable should have
        // BehaviorSubject Nature(tm)
        expect(testutils.distinctUntilChanged(input)).toEqual(result.slice(1));
    });

    it("observable execute func should be observable and act", () => {
        var executed_params = new Array<any>();
        var fixture = wx.command();
        fixture.results.subscribe(x => executed_params.push(x));

        var observed_params = new Rx.ReplaySubject<any>();
        fixture.results.subscribe(x=> observed_params.onNext(x), x=> observed_params.onError(x), ()=> observed_params.onCompleted());

        var range = Ix.Enumerable.range(0, 5).toArray();
        range.forEach(x => fixture.execute(x));

        expect(range).toEqual(executed_params.filter(x => typeof x === "number"));

        Rx.Observable.fromArray(range)
            .zip(observed_params, (expected, actual) => [expected, actual])
            .subscribe(x => expect(x[0]).toEqual(x[1]));
    });

    it("observable can execute is not null after canExecute called", () => {
        var fixture = wx.command(null);

        fixture.canExecute(null);

        expect(fixture.canExecuteObservable).not.toBeNull();
    });

    it("multiple subscribes shouldn't result in multiple notifications", () => {
        var input = [1, 2, 1, 2];
        var sched = new Rx.TestScheduler();
        var fixture = wx.command(null, sched);

        var odd_list = new Array<number>();
        var even_list = new Array<number>();
        fixture.results.where(x => x % 2 !== 0).subscribe(x => odd_list.push(x));
        fixture.results.where(x => x % 2 === 0).subscribe(x => even_list.push(x));

        testutils.run(input, x => fixture.execute(x));
        sched.advanceTo(1000);

        expect([1, 1]).toEqual(odd_list);
        expect([2, 2]).toEqual(even_list);
    });

    it("canExecute exception shouldnt perma-break commands", () => {
        var canExecute = new Rx.Subject<boolean>();
        var fixture = wx.command(canExecute);

        var exceptions = new Array<Error>();
        var canExecuteStates = new Array<boolean>();
        fixture.canExecuteObservable.subscribe(x => canExecuteStates.push(x));
        fixture.thrownExceptions.subscribe(x => exceptions.push(x));

        canExecute.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();

        canExecute.onNext(true);
        expect(fixture.canExecute(null)).toBeTruthy();

        canExecute.onError(new Error("Aieeeee!"));

        // The command should latch to false forever
        expect(fixture.canExecute(null)).toBeFalsy();

        expect(1).toEqual(exceptions.length);
        expect("Aieeeee!").toEqual(exceptions[0].message);

        expect(false).toEqual(canExecuteStates[canExecuteStates.length - 1]);
        expect(true).toEqual(canExecuteStates[canExecuteStates.length - 2]);
    });

    it("execute doesnt throw on error", () => {
        var command = wx.asyncCommand(_ =>
            Rx.Observable.throw(new Error("Aieeeee!")));

        command.thrownExceptions.subscribe();

        expect(() => command.execute(null)).not.toThrowError();
    });

    it("register async function smoke-test", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(5).delay(5000, sched));

            var results: Array<number> = [];
            fixture.results.subscribe(x => results.push(x));

            var inflightResults: Array<boolean> = [];
            fixture.isExecuting.subscribe(x => inflightResults.push(x));
            sched.advanceTo(10);
            expect(fixture.canExecute(null)).toBeTruthy();

            fixture.execute(null);
            sched.advanceTo(1005);
            expect(fixture.canExecute(null)).toBeFalsy();

            sched.advanceTo(5100);
            expect(fixture.canExecute(null)).toBeTruthy();

            expect([false, true, false]).toEqual(inflightResults);
            expect([5]).toEqual(results);
        });
    });

    it("multiple subscribers shouldnt decrement refCount below zero", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(5).delay(5000, sched));

            var results = new Array<number>();
            var subscribers = [false, false, false, false, false];


            fixture.results.subscribe(x => results.push(x));

            testutils.run(Ix.Enumerable.range(0, 5).toArray(), x => fixture.results.subscribe(_ => subscribers[x] = true));

            expect(fixture.canExecute(null)).toBeTruthy();

            fixture.execute(null);
            sched.advanceTo(2000);
            expect(fixture.canExecute(null)).toBeFalsy();

            sched.advanceTo(6000);
            expect(fixture.canExecute(null)).toBeTruthy();

            expect(results.length === 1).toBeTruthy();
            expect(results[0] === 5).toBeTruthy();
            expect(Ix.Enumerable.fromArray(subscribers).all(x => x)).toBeTruthy();
        });
    });

    it("mulftiple results from observable shouldnt decrement refCount below zero", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var latestExecuting = false;

            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.fromArray([1, 2, 3]),
                sched);

            var results = [];
            fixture.results.subscribe(x => results.push(x));

            fixture.isExecuting.subscribe(x => latestExecuting = x);

            fixture.execute(1);
            sched.start();

            expect(3).toEqual(results.length);
            expect(false).toEqual(latestExecuting);
        });
    });

    it("canExecute should change on in-flight op", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var canExecute = sched.createHotObservable<boolean>(
                testutils.recordNext(sched, 0, true),
                testutils.recordNext(sched, 250, false),
                testutils.recordNext(sched, 500, true),
                testutils.recordNext(sched, 750, false),
                testutils.recordNext(sched, 1000, true),
                testutils.recordNext(sched, 1100, false)
            );

            var fixture = wx.asyncCommand(canExecute,
                x => Rx.Observable.return(x * 5).delay(900, wx.App.mainThreadScheduler));

            var calculatedResult = -1;
            var latestcanExecute = false;

            fixture.results.subscribe(x => calculatedResult = x);
            fixture.canExecuteObservable.subscribe(x => latestcanExecute = x);

            // canExecute should be true, both input observable is true
            // and we don't have anything inflight
            sched.advanceTo(10);
            expect(fixture.canExecute(1)).toBeTruthy();
            expect(latestcanExecute).toBeTruthy();

            // Invoke a command 10ms in
            fixture.execute(1);

            // At 300ms, input is false
            sched.advanceTo(300);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();

            // At 600ms, input is true, but the command is still running
            sched.advanceTo(600);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();

            // After we've completed, we should still be false, since from
            // 750ms-1000ms the input observable is false
            sched.advanceTo(900);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();
            expect(-1).toEqual(calculatedResult);

            sched.advanceTo(1010);
            expect(fixture.canExecute(1)).toBeTruthy();
            expect(latestcanExecute).toBeTruthy();
            expect(calculatedResult).toEqual(5);

            sched.advanceTo(1200);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();
        });
    });

    it("disallow concurrent execution test", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(4).delay(5000, sched),
                sched);

            expect(fixture.canExecute(null)).toBeTruthy();

            var result = [];
            fixture.results.subscribe(x => result.push(x));
            expect(0).toEqual(result.length);

            sched.advanceTo(25);
            expect(0).toEqual(result.length);

            fixture.execute(null);
            expect(fixture.canExecute(null)).toBeFalsy();
            expect(0).toEqual(result.length);

            sched.advanceTo(2500);
            expect(fixture.canExecute(null)).toBeFalsy();
            expect(0).toEqual(result.length);

            sched.advanceTo(5500);
            expect(fixture.canExecute(null)).toBeTruthy();
            expect(1).toEqual(result.length);
        });
    });

    it("combined commands should fire child commands", () => {
        var cmd1 = wx.command();
        var cmd2 = wx.command();
        var cmd3 = wx.command();

        var output = [];
        Rx.Observable.merge(cmd1.results, cmd2.results, cmd3.results)
            .subscribe(x => output.push(x));

        var fixture = wx.combinedCommand(cmd1, cmd2, cmd3);
        expect(fixture.canExecute(null)).toBeTruthy();
        expect(0).toEqual(output.length);

        fixture.execute(42);

        expect(3).toEqual(output.length);
    });

    it("combined commands should reflect canExecute of children", () => {
        var subj1 = new Rx.Subject<boolean>();
        var cmd1 = wx.command(subj1);
        var subj2 = new Rx.Subject<boolean>();
        var cmd2 = wx.command(subj2);
        var cmd3 = wx.command();

        // Initial state for Commands is to be executable
        var fixture = wx.combinedCommand(cmd1, cmd2, cmd3);
        var canExecuteOutput = [];
        fixture.canExecuteObservable.subscribe(x => canExecuteOutput.push(x));

        // cmd1 and cmd2 are ??? so, result is false
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // 1 is false, 2 is true
        subj1.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);
        expect(false).toEqual(canExecuteOutput[0]);

        // 1 is false, 2 is false
        subj2.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // 1 is true, 2 is false
        subj1.onNext(true);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // 1 is true, 2 is true
        subj2.onNext(true);
        expect(fixture.canExecute(null)).toBeTruthy();
        expect(2).toEqual(canExecuteOutput.length);
        expect(true).toEqual(canExecuteOutput[1]);
    });

    it("combined commands should be inactive on async in-flight ops", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var cmd1 = wx.asyncCommand(Rx.Observable.return(true),
                x => Rx.Observable.return(x).delay(100, sched));
            var cmd2 = wx.asyncCommand(Rx.Observable.return(true),
                x => Rx.Observable.return(x).delay(300, sched));

            var cmd3 = wx.command();

            var result1 = [];
            cmd1.results.subscribe(x => result1.push(x));

            var result2 = [];
            cmd2.results.subscribe(x => result2.push(x));

            var fixture = wx.combinedCommand(cmd1, cmd2, cmd3);
            var canExecuteOutput = [];
            fixture.canExecuteObservable.subscribe(x => canExecuteOutput.push(x));

            expect(fixture.canExecute(null)).toBeTruthy();
            // OW: expect(0).toEqual(canExecuteOutput.length);

            fixture.execute(42);

            // NB: The first two canExecuteOutputs are because of the initial value
            // that shows up because we finally ran the scheduler
            sched.advanceTo(50.0);
            expect(2).toEqual(canExecuteOutput.length);
            expect(true).toEqual(canExecuteOutput[0]);
            expect(false).toEqual(canExecuteOutput[1]);
            expect(false).toEqual(fixture.canExecute(null));
            expect(0).toEqual(result1.length);
            expect(0).toEqual(result2.length);

            sched.advanceTo(250.0);
            expect(2).toEqual(canExecuteOutput.length);
            expect(false).toEqual(fixture.canExecute(null));
            expect(1).toEqual(result1.length);
            expect(0).toEqual(result2.length);

            sched.advanceTo(500.0);
            expect(3).toEqual(canExecuteOutput.length);
            expect(true).toEqual(canExecuteOutput[2]);
            expect(true).toEqual(fixture.canExecute(null));
            expect(1).toEqual(result1.length);
            expect(1).toEqual(result2.length);
        });
    });

    it("combined commands should reflect parent canExecute", () => {
        var subj1 = new Rx.Subject<boolean>();
        var cmd1 = wx.command(subj1);
        var subj2 = new Rx.Subject<boolean>();
        var cmd2 = wx.command(subj2);
        var cmd3 = wx.command();
        var parentSubj = new Rx.Subject<boolean>();
        
        // Initial state for Commands is to be executable
        var fixture = wx.combinedCommand(parentSubj, cmd1, cmd2, cmd3);
        var canExecuteOutput = [];
        fixture.canExecuteObservable.subscribe(x => canExecuteOutput.push(x));
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        parentSubj.onNext(false);

        // 1 is false, 2 is true
        subj1.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);
        expect(false).toEqual(canExecuteOutput[0]);

        // 1 is false, 2 is false
        subj2.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // 1 is true, 2 is false
        subj1.onNext(true);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // 1 is true, 2 is true, but it doesn't matter because
        // parent is still false
        subj2.onNext(true);
        expect(fixture.canExecute(null)).toBeFalsy();
        expect(1).toEqual(canExecuteOutput.length);

        // Parent is finally true, mark it true
        parentSubj.onNext(true);
        expect(fixture.canExecute(null)).toBeTruthy();
        expect(2).toEqual(canExecuteOutput.length);
        expect(true).toEqual(canExecuteOutput[1]);
    });
});