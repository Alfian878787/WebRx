/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { IHandleObservableErrors } from "../Interfaces"
import { app  } from "./Module"
import IID from "./../IID"
import { isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isRxScheduler } from "././Utils"
import Lazy from "./../Core/Lazy"
import { Implements } from "././Reflect"

"use strict";

/**
* ICommand represents an ICommand which also notifies when it is
* executed (i.e. when Execute is called) via IObservable. Conceptually,
* this represents an Event, so as a result this IObservable should never
* onComplete or onError.
* @interface 
**/
export interface ICommand<T> extends
    Rx.IDisposable,
    IHandleObservableErrors {
    canExecute(parameter: any): boolean;
    execute(parameter: any): void;

    /**
    * Gets a value indicating whether this instance can execute observable.
    **/
    canExecuteObservable: Rx.Observable<boolean>; //  { get; }

    /**
    * Gets a value indicating whether this instance is executing. This
    * Observable is guaranteed to always return a value immediately (i.e.
    * it is backed by a BehaviorSubject), meaning it is safe to determine
    * the current state of the command via IsExecuting.First()
    **/
    isExecuting: Rx.Observable<boolean>; //  { get; }

    /**
    * Gets an observable that returns command invocation results
    **/
    results: Rx.Observable<T>;

    /**
    * Executes a Command and returns the result asynchronously. This method
    * makes it *much* easier to test Command, as well as create
    * Commands who invoke inferior commands and wait on their results.
    *
    * Note that you **must** Subscribe to the Observable returned by
    * ExecuteAsync or else nothing will happen (i.e. ExecuteAsync is lazy)
    *
    * Note also that the command will be executed, irrespective of the current value
    * of the command's canExecute observable.
    * @return An Observable representing a single invocation of the Command.
    * @param parameter Don't use this.
    **/
    executeAsync(parameter?: any): Rx.Observable<T>;
}


@Implements(IID.ICommand)
@Implements(IID.IDisposable)
export class Command<T> implements ICommand<T> {
    /// <summary>
    /// Don't use this directly, use commandXYZ instead
    /// </summary>
    constructor(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>, scheduler?: Rx.IScheduler) {
        this.scheduler = scheduler || app.mainThreadScheduler;
        this.func = executeAsync;

        // setup canExecute
        this.canExecuteObs = canExecute
            .combineLatest(this.isExecutingSubject.startWith(false),(ce, ie) => ce && !ie)
            .catch(ex => {
                this.exceptionsSubject.onNext(ex);
                return Rx.Observable.return(false);
            })
            .do(x => {
                this.canExecuteLatest = x;
            })
            .publish();

        if (isInUnitTest()) {
            this.canExecuteObs.connect();
        }

        // setup thrownExceptions
        this.exceptionsSubject = new Rx.Subject<Error>();
        this.thrownExceptions = this.exceptionsSubject.asObservable();
        this.exceptionsSubject
            .observeOn(this.scheduler)
            .subscribe(app.defaultExceptionHandler);
    }

    //////////////////////////////////
    // IDisposable implementation

    public dispose(): void {
        let disp = this.canExecuteDisp;

        if (disp != null)
            disp.dispose();
    }

    ////////////////////
    /// ICommand

    public get canExecuteObservable(): Rx.Observable<boolean> {
        // setup canExecuteObservable
        let ret = this.canExecuteObs.startWith(this.canExecuteLatest).distinctUntilChanged();

        if (this.canExecuteDisp != null)
            return ret;

        return Rx.Observable.create<boolean>(subj => {
            let disp = ret.subscribe(subj);

            // NB: We intentionally leak the CanExecute disconnect, it's
            // cleaned up by the global Dispose. This is kind of a
            // "Lazy Subscription" to CanExecute by the command itself.
            this.canExecuteDisp = this.canExecuteObs.connect();
            return disp;
        });
    }

    public get isExecuting(): Rx.Observable<boolean> {
        return this.isExecutingSubject.startWith(this.inflightCount > 0);
    }

    public get results(): Rx.Observable<T> {
        return this.resultsSubject.asObservable();
    }

    public thrownExceptions: Rx.Observable<Error>;

    public canExecute(parameter): boolean {
        if (this.canExecuteDisp == null)
            this.canExecuteDisp = this.canExecuteObs.connect();

        return this.canExecuteLatest;
    }

    public execute(parameter): void {
        this.executeAsync(parameter)
            .catch(Rx.Observable.empty<T>())
            .subscribe();
    }

    public executeAsync(parameter?: any): Rx.Observable<T> {
        let self = this;

        let ret = Rx.Observable.create<T>(subj => {
            if (++self.inflightCount === 1) {
                self.isExecutingSubject.onNext(true);
            }

            let decrement = new Rx.SerialDisposable();
            decrement.setDisposable(Rx.Disposable.create(() => {
                if (--self.inflightCount === 0) {
                    self.isExecutingSubject.onNext(false);
                }
            }));

            let disp = self.func(parameter)
                .observeOn(self.scheduler)
                .do(
                _ => { },
                e => decrement.setDisposable(Rx.Disposable.empty),
                () => decrement.setDisposable(Rx.Disposable.empty))
                .do(x=> self.resultsSubject.onNext(x), x=> self.exceptionsSubject.onNext(x))
                .subscribe(subj);

            return new Rx.CompositeDisposable(disp, decrement);
        });

        return ret
            .publish()
            .refCount();
    }

    ////////////////////
    /// Implementation

    private func: (any) => Rx.Observable<T>;
    private thisArg: any;
    private resultsSubject = new Rx.Subject<T>();
    private isExecutingSubject = new Rx.Subject<boolean>();
    private scheduler: Rx.IScheduler;
    private exceptionsSubject: Rx.Subject<Error>; // ScheduledSubject<Exception>;
    private inflightCount = 0;
    private canExecuteLatest = false;
    private canExecuteObs: Rx.ConnectableObservable<boolean>;
    private canExecuteDisp: Rx.IDisposable = null;
}

export module internal {
    export var commandConstructor = <any> Command;
}

/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export function command(execute: (any) => void, canExecute?: Rx.Observable<boolean>, scheduler?: Rx.IScheduler, thisArg?:any): ICommand<any>;

/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export function command(execute: (any) => void, canExecute?: Rx.Observable<boolean>, thisArg?: any): ICommand<any>;

/**
* Creates a default Command that has a synchronous action.
* @param {(any) => void} execute The action to executed when the command gets invoked
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export function command(execute: (any) => void, thisArg?: any): ICommand<any>;

/**
* Creates a default Command that has no background action.
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export function command(canExecute?: Rx.Observable<boolean>, scheduler?: Rx.IScheduler): ICommand<any>;

// factory method implementation
export function command(): ICommand<any> {
    let args = args2Array(arguments);
    let canExecute: Rx.Observable<boolean>;
    let execute: (any) => void;
    let scheduler: Rx.IScheduler;
    let thisArg: any;

    if (isFunction(args[0])) {
        // first overload
        execute = args.shift();
        canExecute = isRxObservable(args[0]) ? args.shift() : Rx.Observable.return(true);
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();

        if (thisArg != null)
            execute = execute.bind(thisArg);

        return asyncCommand(canExecute,(parameter) =>
            Rx.Observable.create<any>(obs => {
                try {
                    execute(parameter);

                    obs.onNext(null);
                    obs.onCompleted();
                } catch (e) {
                    obs.onError(e);
                }
                return Rx.Disposable.empty;
            }), scheduler);
    }

    // second overload
    canExecute = args.shift() || Rx.Observable.return(true);
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;

    return new Command<any>(canExecute, x => Rx.Observable.return(x), scheduler);
}

/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function asyncCommand<T>(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>,
    scheduler?: Rx.IScheduler, thisArg?: any): ICommand<T>;

/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function asyncCommand<T>(canExecute: Rx.Observable<boolean>, executeAsync: (any) => Rx.Observable<T>, thisArg?: any): ICommand<T>;

/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {Rx.IScheduler} scheduler The scheduler to deliver events on. Defaults to App.mainThreadScheduler
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function asyncCommand<T>(executeAsync: (any) => Rx.Observable<T>, scheduler?: Rx.IScheduler, thisArg?: any): ICommand<T>;

/**
* Creates a Command typed to the given executeAsync Observable method. Use this method if your background method returns Rx.IObservable
* @param {(any) => Rx.Observable<T>} executeAsync Method to call that creates an Observable representing an operation to execute in the background. The Command's canExecute will be false until this Observable completes. If this Observable terminates with OnError, the Exception is marshaled to ThrownExceptions
* @param {any} thisArg Object to use as this when executing the executeAsync
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function asyncCommand<T>(executeAsync: (any) => Rx.Observable<T>, thisArg?: any): ICommand<T>;

// factory method implementation
export function asyncCommand<T>(): ICommand<T> {
    let args = args2Array(arguments);
    let canExecute: Rx.Observable<boolean>;
    let executeAsync: (any) => Rx.Observable<T>;
    let scheduler: Rx.IScheduler;
    let thisArg: any;

    if (isFunction(args[0])) {
        // second overload
        executeAsync = args.shift();
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();

        if (thisArg != null)
            executeAsync = executeAsync.bind(thisArg);

        return new Command<T>(Rx.Observable.return(true), executeAsync, scheduler);
    }

    // first overload
    canExecute = args.shift();
    executeAsync = args.shift();
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;

    return new Command<T>(canExecute, executeAsync, scheduler);
}

/**
* This creates a Command that calls several child Commands when invoked. Its canExecute will match the combined result of the child canExecutes (i.e. if any child commands cannot execute, neither can the parent)
* @param {(any) => Rx.Observable<T>} commands The commands to combine
* @param {Rx.Observable<boolean>} canExecute An Observable that determines when the Command can Execute. WhenAny is a great way to create this!
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function combinedCommand(canExecute: Rx.Observable<boolean>, ...commands:ICommand<any>[]): ICommand<any>;

/**
* This creates a Command that calls several child Commands when invoked. Its canExecute will match the combined result of the child canExecutes (i.e. if any child commands cannot execute, neither can the parent)
* @param {(any) => Rx.Observable<T>} commands The commands to combine
* @return {Command<T>} A Command which returns all items that are created via calling executeAsync as a single stream.
*/
export function combinedCommand(...commands: ICommand<any>[]): ICommand<any>;

// factory method implementation
export function combinedCommand<T>(): ICommand<any> {
    let args = args2Array(arguments);

    let commands: ICommand<any>[] = args
        .filter(x=> isCommand(x));

    let canExecute: Rx.Observable<boolean> = args
        .filter(x => isRxObservable(x))
        .pop();

    if (!canExecute)
        canExecute = Rx.Observable.return(true);

    let childrenCanExecute = Rx.Observable.combineLatest(commands.map(x => x.canExecuteObservable),
        (...latestCanExecute:boolean[]) => latestCanExecute.every(x => x));

    let canExecuteSum = Rx.Observable.combineLatest(
        canExecute.startWith(true),
        childrenCanExecute,
        (parent, child) => parent && child);

    let ret = command(canExecuteSum);
    ret.results.subscribe(x => commands.forEach(cmd => {
        cmd.execute(x);
    }));

    return ret;
}
