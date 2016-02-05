/// <reference path="./Interfaces.ts" />

import { args2Array, isFunction, throwError, isRxObservable } from "./Core/Utils"
import IID from "./IID"
import { createScheduledSubject } from "./Core/ScheduledSubject"
import { injector } from "./Core/Injector"
import * as res from "./Core/Resources"

"use strict";

let RxObsConstructor = <any> Rx.Observable;   // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

/**
* Creates an read-only observable property with an optional default value from the current (this) observable
* (Note: This is the equivalent to Knockout's ko.computed)
* @param {T} initialValue? Optional initial value, valid until the observable produces a value
*/
function toProperty(initialValue?: any, scheduler?: Rx.IScheduler) {
    scheduler = scheduler || Rx.Scheduler.currentThread;

    // initialize accessor function (read-only)
    let accessor: any = function propertyAccessor(newVal?: any): any {
        if (arguments.length > 0) {
            throwError("attempt to write to a read-only observable property");
        }

        return accessor.value;
    };

    //////////////////////////////////
    // wx.IUnknown implementation

    accessor.queryInterface = (iid: string)=> {
       return iid === IID.IObservableProperty || iid === IID.IDisposable;
    }

    //////////////////////////////////
    // IDisposable implementation

    accessor.dispose = () => {
        if (accessor.sub) {
            accessor.sub.dispose();
            accessor.sub = null;
        }
    };

    //////////////////////////////////
    // IObservableProperty<T> implementation

    accessor.value = initialValue;

    // setup observables
    accessor.changedSubject = new Rx.Subject<any>();
    accessor.changed = accessor.changedSubject.asObservable();

    accessor.changingSubject = new Rx.Subject<any>();
    accessor.changing = accessor.changingSubject.asObservable()

    accessor.source = this;
    accessor.thrownExceptions = createScheduledSubject<Error>(scheduler, injector.get<wx.IWebRxApp>(res.app).defaultExceptionHandler);

    //////////////////////////////////
    // implementation

    let firedInitial = false;

    accessor.sub = this
        .distinctUntilChanged()
        .subscribe(x => {
            // Suppress a non-change between initialValue and the first value
            // from a Subscribe
            if (firedInitial && x === accessor.value) {
                return;
            }

            firedInitial = true;

            accessor.changingSubject.onNext(x);
            accessor.value = x;
            accessor.changedSubject.onNext(x);
        }, x=> accessor.thrownExceptions.onNext(x));

    return accessor;
}

RxObsConstructor.prototype.toProperty = toProperty;

RxObsConstructor.prototype.continueWith = function() {
    let args = args2Array(arguments);
    let val = args.shift();
    let obs: Rx.Observable<any> = undefined;

    if (isRxObservable(val)) {
        obs = <Rx.Observable<any>> val;
    } else if(isFunction(val)) {
        let action = <() => any> val;
        obs = Rx.Observable.startDeferred(action);
    }

    return this.selectMany(_ => obs);
}

RxObsConstructor.prototype.invokeCommand = <T, TResult>(command: () => wx.ICommand<TResult> | wx.ICommand<TResult>) => {
    // see the ReactiveUI project for the inspiration behind this function:
    // https://github.com/reactiveui/ReactiveUI/blob/master/ReactiveUI/ReactiveCommand.cs#L511
    return (this as Rx.Observable<T>)
        .select(x => ({ 
            parameter: x, 
            command: (command instanceof Function ? command() : command) as wx.ICommand<TResult>
        }))
        // debounce typings want the (incorrectly named) durationSelector to return a number here
        // this is why there is a .select(x => 0) at the end
        // the 0 doesn't get used, as the debounce occurs on the observable not the values it produces
        .debounce(x => x.command.canExecuteObservable.startWith(x.command.canExecute(x.parameter)).where(b => b).select(x => 0))
        .select(x => x.command.executeAsync(x.parameter).catch(Rx.Observable.empty<TResult>()))
        .switch()
        .subscribe();
}

RxObsConstructor.startDeferred = <T>(action: () => T): Rx.Observable<T> => {
    return Rx.Observable.defer(() => {
        return Rx.Observable.create<T>(observer => {
            let cancelled = false;

            if(!cancelled)
                action();

            observer.onNext(<any> undefined);
            observer.onCompleted();

            return Rx.Disposable.create(()=> cancelled = true);
        });
    });
}

export function install() {
    // deliberately left blank
}