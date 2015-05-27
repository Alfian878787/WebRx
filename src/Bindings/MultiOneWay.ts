﻿/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { IObservableProperty, IBindingHandler, IDataContext, INodeState, IModule, IWebRxApp, IDomManager, ICompiledExpression  } from "../Interfaces"
import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    isRxScheduler, throwError, using, getOid, formatString, unwrapProperty, isProperty, elementCanBeDisabled, toggleCssClass } from "../Core/Utils"

"use strict";

export class MultiOneWayChangeBindingBase implements IBindingHandler {
    constructor(domManager: IDomManager, app: IWebRxApp, supportsDynamicValues: boolean = false) {
        this.domManager = domManager;
        this.app = app;
        this.supportsDynamicValues = supportsDynamicValues;
    } 

   ////////////////////
    // IBinding

    public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");

        let compiled = this.domManager.compileBindingOptions(options, module);

        if (compiled == null || (typeof compiled !== "object" && !this.supportsDynamicValues))
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let observables = new Array<[string, Rx.Observable<any>]>();
        let obs: Rx.Observable<any>;
        let exp: ICompiledExpression;
        let keys = Object.keys(compiled);
        let key;

        if (typeof compiled === "function") {
            exp = <ICompiledExpression> compiled;

            obs = this.domManager.expressionToObservable(exp, ctx);
            observables.push(["", obs]);
        } else {
            for(let i= 0; i < keys.length; i++) {
                key = keys[i];
                let value = compiled[key];

                exp = <ICompiledExpression> value;
                obs = this.domManager.expressionToObservable(exp, ctx);

                observables.push([key, obs]);
            }
        }

        // subscribe
        for(let i= 0; i < observables.length; i++) {
            key = observables[i][0];
            obs = observables[i][1];

            this.subscribe(el, obs, key, state);
        }

        // release closure references to GC 
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;

            // nullify common locals
            el = null;
            keys = null;

            // nullify locals
            observables = null;
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 0;
    protected supportsDynamicValues = false;

    ////////////////////
    // Implementation

    protected domManager: IDomManager;
    protected app: IWebRxApp;

    private subscribe(el: HTMLElement, obs: Rx.Observable<any>, key: string, state: INodeState) {
        state.cleanup.add(obs.subscribe(x => {
            try {
                this.applyValue(el, unwrapProperty(x), key);
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            } 
        }));
    }

    protected applyValue(el: HTMLElement, key: string, value: any): void {
        throwError("you need to override this method!");
    }
}

// Binding contributions to node-state
interface ICssNodeState extends INodeState {
    cssBindingPreviousDynamicClasses: any;
}

export class CssBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: IDomManager, app: IWebRxApp) {
        super(domManager, app, true);
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        let classes: Array<any>;

        if (key !== "") {
            classes = key.split(/\s+/).map(x => x.trim()).filter(x => <any> x);

            if (classes.length) {
                toggleCssClass.apply(null, [el, !!value].concat(classes));
            }
        } else {
            let state = <ICssNodeState> this.domManager.getNodeState(el);

            // if we have previously added classes, remove them
            if (state.cssBindingPreviousDynamicClasses != null) {
                toggleCssClass.apply(null, [el, false].concat(state.cssBindingPreviousDynamicClasses));

                state.cssBindingPreviousDynamicClasses = null;
            }

            if (value) {
                classes = value.split(/\s+/).map(x => x.trim()).filter(x => x);

                if (classes.length) {
                    toggleCssClass.apply(null, [el, true].concat(classes));

                    state.cssBindingPreviousDynamicClasses = classes;
                }
            }
        }
    }
}

export class AttrBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: IDomManager, app: IWebRxApp) {
        super(domManager, app);

        this.priority = 5;
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
        // when someProp is a "no value"-like value (strictly null, false, or undefined)
        // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
        let toRemove = (value === false) || (value === null) || (value === undefined);
        if (toRemove)
            el.removeAttribute(key);
        else {
            el.setAttribute(key, value.toString());
        }
    }
}

export class StyleBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: IDomManager, app: IWebRxApp) {
        super(domManager, app);
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        if (value === null || value === undefined || value === false) {
            // Empty string removes the value, whereas null/undefined have no effect
            value = "";
        }

        el.style[key] = value;
    }
}
