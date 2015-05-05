﻿///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Core/DomManager.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../Router.ts" />

module wx {
    "use strict";

    export interface IStateActiveBindingOptions {
        name: string;
        params?: Object;
        cssClass?: string;
    }

    class StateActiveBinding implements IBindingHandler {
        constructor(domManager: IDomManager, router: IRouter) {
            this.domManager = domManager;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("stateActive-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            let el = <HTMLAnchorElement> node;
            let compiled = this.domManager.compileBindingOptions(options, module);
            let exp: ICompiledExpression;
            let observables = [];
            let opt = <IStateActiveBindingOptions> compiled;
            let paramsKeys: Array<string> = [];
            let stateName;
            let stateParams: Object;
            let cssClass = "active";

            observables.push(router.current.changed.startWith(router.current()));

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                observables.push(this.domManager.expressionToObservable(exp, ctx));
            } else {
                // collect state-name observable
                observables.push(this.domManager.expressionToObservable(<ICompiledExpression> <any> opt.name, ctx));

                // collect params observables
                if (opt.params) {
                    Object.keys(opt.params).forEach(x => {
                        paramsKeys.push(x);

                        observables.push(this.domManager.expressionToObservable(opt.params[x], ctx));
                    });
                }

                if (opt.cssClass) {
                    cssClass = this.domManager.evaluateExpression(<ICompiledExpression> <any> opt.cssClass, ctx);
                }
            }

            // subscribe to any input changes
            state.cleanup.add(Rx.Observable.combineLatest(observables, function(_) { return args2Array(arguments); }).subscribe(latest => {
                try {
                    // first element is the current state
                    let currentState = latest.shift();

                    // second element is the state-name
                    stateName = unwrapProperty(latest.shift());

                    // subsequent entries are latest param values
                    stateParams = {};

                    for(let i = 0; i < paramsKeys.length; i++) {
                        stateParams[paramsKeys[i]] = unwrapProperty(latest[i]);
                    }

                    let active = this.router.includes(stateName, stateParams);
                    let classes = cssClass.split(/\s+/).map(x => x.trim()).filter(x => <any> x);

                    if (classes.length) {
                        toggleCssClass.apply(null, [el, active].concat(classes));
                    }
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
                } 
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify locals
                observables = null;
                compiled = null;
                stateName = null;
                stateParams = null;
                opt = null;
                paramsKeys = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 5;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
        protected router: IRouter;
    }

    export module internal {
        export var stateActiveBindingConstructor = <any> StateActiveBinding;
    }
}