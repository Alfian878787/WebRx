/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, formatString, cloneNodeArray, noop, isDisposable, disposeMembers, isPrimitive } from "../Core/Utils"

"use strict";

/**
* Base class for simple-bindings. Responsible for taking care of the heavy-lifting.
* @class
*/
export default class SimpleBinding implements wx.IBindingHandler, wx.ISimpleBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    }

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let exp: wx.ICompiledExpression;
        let cleanup: Rx.CompositeDisposable;
        let bindingDeps = new Array<Rx.IObservable<any>>();
        let bindingState = {};
        const keys = Object.keys(compiled);

        if (typeof compiled === "function") {
            let obs = this.domManager.expressionToObservable(<wx.ICompiledExpression> <any> compiled, ctx);
            bindingDeps.push(obs);
        } else {
            // transform all properties into observables
            for(let i=0;i<keys.length;i++) {
                bindingDeps.push(this.domManager.expressionToObservable(<wx.ICompiledExpression> <any> compiled[keys[i]], ctx));
            }
        }

        // subscribe to any input changes
        state.cleanup.add(
            Rx.Observable.combineLatest(bindingDeps, function() { return args2Array(arguments) })
            .subscribe(allValues => {
            try {
                cleanup = new Rx.CompositeDisposable();

                // construct current value
                let value: any;
                if (typeof compiled === "function") {
                    value = allValues[0];
                } else {
                    // collect current values into an object who's signature matches the source options
                    value = {};

                    for(let i=0;i<keys.length;i++) {
                        const key = keys[i];
                        value[key] = allValues[i];
                    }
                }

                this.inner(el, value, compiled, ctx, this.domManager, bindingState, state.cleanup, module);
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));

        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            bindingState = null;

            // nullify common locals
            compiled = null;
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public inner: wx.ISimpleBindingHandler;
    public priority = 0;
    public controlsDescendants:boolean;

    ////////////////////
    // Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
}
