﻿/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Bindings/Module.ts" />

module wx {
    "use strict";

    class DomManager implements IDomManager {
        constructor(compiler: IExpressionCompiler) {
            this.nodeState = createWeakMap<Node, INodeState>();
            this.compiler = compiler;
        }

        public applyBindings(model: any, rootNode: Node): void {
            if (rootNode === undefined || rootNode.nodeType !== 1)  // && (node.nodeType !== 8))
                internal.throwError("first parameter should be your model, second parameter should be a DOM node!");

            if (this.isNodeBound(rootNode))
                internal.throwError("an element must not be bound multiple times!");

            // create or update node state for root node
            let state = this.getNodeState(rootNode);
            if (state) {
                state.model = model;
            } else {
                state = this.createNodeState(model);
                this.setNodeState(rootNode, state);
            }

            // calculate resulting data-context and apply bindings
            let ctx = this.getDataContext(rootNode);
            this.applyBindingsRecursive(ctx, <HTMLElement> rootNode);
        }

        public applyBindingsToDescendants(ctx: IDataContext, node: Node): void {
            if (node.hasChildNodes()) {
                for(let i = 0; i < node.childNodes.length; i++) {
                    let child = node.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyBindingsRecursive(ctx, <HTMLElement> child);
                }
            }
        }

        public cleanNode(rootNode: Node): void {
            if (rootNode.nodeType !== 1) // && (node.nodeType !== 8))
                return;

            this.cleanNodeRecursive(rootNode);
        }

        public cleanDescendants(node: Node): void {
            if (node.hasChildNodes()) {
                for(let i = 0; i < node.childNodes.length; i++) {
                    let child = node.childNodes[i];

                    // only elements
                    if (node.nodeType !== 1)
                        continue;

                    this.clearNodeState(child);
                }
            }
        }

        public getObjectLiteralTokens(value: string): Array<IObjectLiteralToken> {
            value = value.trim();

            if (value !== '' && this.isObjectLiteralString(value)) {
                return this.compiler.parseObjectLiteral(value);
            } 

            return [];
        }

        public compileBindingOptions(value: string, module: IModule): Object {
            value = value.trim();
            if (value === '') {
                return null;
            }

            if (this.isObjectLiteralString(value)) {
                let result = {};
                let tokens = this.compiler.parseObjectLiteral(value);
                let token: IObjectLiteralToken;

                for(let i = 0; i < tokens.length; i++) {
                    token = tokens[i];
                    result[token.key] = this.compileBindingOptions(token.value, module);
                }

                return result;
            } else {
                // build compiler options
                let options = <IExpressionCompilerOptions> extend(this.parserOptions, {});
                options.filters = {};

                // enrich with app filters
                extend(app.filters(), options.filters);

                // enrich with module filters
                if (module) {
                    extend(module.filters(), options.filters);
                }

                return this.compiler.compileExpression(value, options, this.expressionCache);
            }
        }

        public getModuleContext(node: Node): IModule {
            let state: INodeState;

            // collect model hierarchy
            while (node) {
                state = this.getNodeState(node);

                if (state != null) {
                    if (state.module != null) {
                        return state.module;
                    }
                }

                node = node.parentNode;
            }

            // default to app
            return app;
        }

        public registerDataContextExtension(extension: (node: Node, ctx: IDataContext) => void) {
            this.dataContextExtensions.add(extension);
        }

        public getDataContext(node: Node): IDataContext {
            let models = [];
            let state = this.getNodeState(node);

            // collect model hierarchy
            let _node = node;
            while (_node) {
                state = state != null ? state : this.getNodeState(_node);
                if (state != null) {
                    if (state.model != null) {
                        models.push(state.model);
                    }
                }

                state = null;
                _node = _node.parentNode;
            }

            let ctx: IDataContext;
            
            if (models.length > 0) {
                ctx = {
                    $data: models[0],
                    $root: models[models.length - 1],
                    $parent: models.length > 1 ? models[1] : null,
                    $parents: models.slice(1)
                };
            } else {
                ctx = {
                    $data: null,
                    $root: null,
                    $parent: null,
                    $parents: []
                };
            }

            // extensions
            this.dataContextExtensions.forEach(ext=> ext(node, ctx));

            return ctx;
        }

        public createNodeState(model?: any, module?: any): INodeState {
            return {
                cleanup: new Rx.CompositeDisposable(),
                model: model,
                module: module,
                isBound: false
            };
        }

        public isNodeBound(node: Node): boolean {
            let state = this.nodeState.get(node);
            return state && state.isBound;
        }

        public setNodeState(node: Node, state: INodeState): void {
            this.nodeState.set(node, state);
        }

        public getNodeState(node: Node): INodeState {
            return this.nodeState.get(node);
        }

        public clearNodeState(node: Node) {
            let state = this.nodeState.get(node);

            if (state) {
                if (state.cleanup != null) {
                    state.cleanup.dispose();
                    state.cleanup = undefined;
                }

                if (state.model != null) {
                    state.model = undefined;
                }

                if (state.module != null) {
                    state.module = undefined;
                }
            }

            this.nodeState.delete(node);

            // support external per-node cleanup
            env.cleanExternalData(node);
        }

        public evaluateExpression(exp: ICompiledExpression, ctx: IDataContext): any {
            let locals = this.createLocals(undefined, ctx);
            let result = exp(ctx.$data, locals);
            return result;
        }

        public expressionToObservable(exp: ICompiledExpression, ctx: IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any> {
            let captured = createSet<Rx.Observable<any>>();
            let locals;
            let result: any;

            // initial evaluation
            try {
                locals = this.createLocals(captured, ctx);
                result = exp(ctx.$data, locals);

                // diagnostics
                if (evalObs)
                    evalObs.onNext(true);
            } catch (e) {
                app.defaultExceptionHandler.onNext(e);

                return Rx.Observable.return(undefined);
            } 

            // Optimization: If the initial evaluation didn't touch any observables, treat it as constant expression
            if (captured.size === 0) {
                if (isRxObservable(result))
                    return result;

                // wrap it
                return Rx.Observable.return(result);
            }

            let obs = Rx.Observable.create<Rx.Observable<any>>(observer => {
                let innerDisp = Rx.Observable.defer(() => {
                    // construct observable that represents the first change of any of the expression's dependencies
                    return Rx.Observable.merge(setToArray(captured)).take(1);
                })
                .repeat()
                .subscribe(trigger => {
                    try {
                        // reset execution state before evaluation
                        captured.clear();
                        locals = this.createLocals(captured, ctx);

                        // evaluate and produce next value
                        result = exp(ctx.$data, locals);

                        if (!isRxObservable(result)) {
                            // wrap non-observable
                            observer.onNext(Rx.Observable.return(result));
                        } else {
                            observer.onNext(result);
                        }

                        // diagnostics
                        if (evalObs)
                            evalObs.onNext(true);
                    } catch (e) {
                        app.defaultExceptionHandler.onNext(e);
                    }
                });

                return innerDisp;
            });

            // prefix with initial result
            let startValue = isRxObservable(result) ?
                result :
                Rx.Observable.return(result);

            return obs.startWith(startValue).concatAll();
        }

        //////////////////////////////////
        // Implementation

        private static bindingAttributeName = "data-bind";
        private static paramsAttributename = "params";
        private nodeState: IWeakMap<Node, INodeState>;
        private expressionCache: { [exp: string]: (scope: any, locals: any) => any } = {};
        private compiler: IExpressionCompiler;
        private dataContextExtensions = createSet<(node: Node, ctx: IDataContext) => void>();

        private parserOptions: IExpressionCompilerOptions = {
            disallowFunctionCalls: true
        };

        private applyBindingsInternal(ctx: IDataContext, el: HTMLElement, module: IModule): boolean {
            let result = false;

            // get or create elment-state
            let state = this.getNodeState(el);

            // create and set if necessary
            if (!state) {
                state = this.createNodeState();
                this.setNodeState(el, state);
            } else if (state.isBound) {
                internal.throwError("an element must not be bound multiple times!");
            }

            let _bindings: Array<{ key: string; value: string; fromTag?: boolean }>;
            let tagName = el.tagName.toLowerCase();

            // check if tag represents a component
            if (module.hasComponent(tagName) || app.hasComponent(tagName)) {
                // when a component is referenced by element, we just apply a virtual 'component' binding
                let params = el.getAttribute(DomManager.paramsAttributename);
                let componentReference: any;

                if (params)
                    componentReference = "{ name: '" + tagName + "', params: {" + el.getAttribute(DomManager.paramsAttributename) + "} }";
                else
                    componentReference = "{ name: '" + tagName + "' }";

                _bindings = [{ key: 'component', value: componentReference }];
            } else {
                // get definitions from attribute
                _bindings = this.getBindingDefinitions(el);
            }

            if (_bindings != null && _bindings.length > 0) {
                // lookup handlers
                let bindings = _bindings.map(x=> {
                    let handler = module.binding(x.key);
                    
                    if (!handler)
                        internal.throwError("binding '{0}' has not been registered.", x.key);

                    return { handler: handler, value: x.value };
                });

                // sort by priority
                bindings.sort((a, b) => (b.handler.priority || 0) - (a.handler.priority || 0));

                // check if there's binding-handler competition for descendants (which is illegal)
                let hd = bindings.filter(x => x.handler.controlsDescendants).map(x => "'" + x.value + "'");
                if (hd.length > 1) {
                    internal.throwError("bindings {0} are competing for descendants of target element!", hd.join(", "));
                } 

                result = hd.length > 0;

                // apply all bindings
                for(let i= 0; i < bindings.length; i++) {
                    let binding = bindings[i];
                    let handler = binding.handler;

                    handler.applyBinding(el, binding.value, ctx, state, module);
                }
            }

            // mark bound
            state.isBound = true;

            return result;
        }

        private isObjectLiteralString(str: string): boolean {
            return str[0] === "{" && str[str.length - 1] === "}";
        }

        public getBindingDefinitions(node: Node): Array<{ key: string; value: string }> {
            let bindingText = null;

            if (node.nodeType === 1) {  // element
                // attempt to get definition from attribute
                let attr = (<Element> node).getAttribute(DomManager.bindingAttributeName);
                if (attr) {
                    bindingText = attr;
                }
            } 

            // transform textual binding-definition into a key-value store where 
            // the key is the binding name and the value is its options
            if (bindingText) {
                bindingText = bindingText.trim();
            }

            if (bindingText)
                return <any> this.compiler.parseObjectLiteral(bindingText);

            return null;
        }

        private applyBindingsRecursive(ctx: IDataContext, el: HTMLElement, module?: IModule): void {
            // "module" binding receiving first-class treatment here because it is considered part of the core
            module = module || this.getModuleContext(el);

            if (!this.applyBindingsInternal(ctx, el, module) && el.hasChildNodes()) {
                // module binding might have updated state.module
                let state = this.getNodeState(el);
                if (state && state.module)
                    module = state.module;

                // iterate over descendants
                for(let i = 0; i < el.childNodes.length; i++) {
                    let child = el.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyBindingsRecursive(ctx, <HTMLElement> child, module);
                }
            }
        }

        private cleanNodeRecursive(node: Node): void {
            if (node.hasChildNodes()) {
                let length = node.childNodes.length;

                for(let i = 0; i < length; i++) {
                    let child = node.childNodes[i];

                    // only elements
                    if (node.nodeType !== 1)
                        continue;

                    this.cleanNodeRecursive(child);
                }
            }

            // clear parent after childs
            this.clearNodeState(node);
        }

        private createLocals(captured: ISet<Rx.Observable<any>>, ctx: IDataContext) {
            let locals = {};
            let list: IObservableList<any>;
            let prop: IObservableProperty<any>;
            let result, target;

            let hooks: ICompiledExpressionRuntimeHooks = {
                readFieldHook: (o: any, field: any): any => {
                    // handle "@propref" access-modifier
                    let noUnwrap = false;

                    if (field[0] === '@') {
                        noUnwrap = true;
                        field = field.substring(1);
                    }

                    result = o[field];
                    
                    // intercept access to observable properties
                    if (!noUnwrap && isProperty(result)) {
                        let prop = <IObservableProperty<any>> result;

                        // register observable
                        if (captured)
                            captured.add(prop.changed);

                        // get the property's real value
                        result = prop();
                    }

                    return result;
                },

                writeFieldHook: (o: any, field: any, newValue: any): any => {
                    // ignore @propref access-modifier on writes
                    if (field[0] === '@') {
                        field = field.substring(1);
                    }

                    target = o[field];

                    // intercept access to observable properties
                    if (isProperty(target)) {
                        let prop = <IObservableProperty<any>> target;

                        // register observable
                        if (captured)
                            captured.add(prop.changed);

                        // replace field assignment with property invocation
                        prop(newValue);
                    } else {
                        o[field] = newValue;
                    }

                    return newValue;
                },

                readIndexHook: (o: any, index: any): any => {
                    // recognize observable lists
                    if (queryInterface(o, IID.IObservableList)) {
                        // translate indexer to list.get()
                        list = <IObservableList<any>> o;
                        result = list.get(index);

                        // add collectionChanged to monitored observables
                        if (captured)
                            captured.add(list.listChanged);
                    } else {
                        result = o[index];
                    }
                    
                    // intercept access to observable properties
                    if (queryInterface(result, IID.IObservableProperty)) {
                        let prop = <IObservableProperty<any>> result;

                        // register observable
                        if (captured)
                            captured.add(prop.changed);

                        // get the property's real value
                        result = prop();
                    }

                    return result;
                },

                writeIndexHook: (o: any, index: any, newValue: any): any => {
                    // recognize observable lists
                    if (queryInterface(o, IID.IObservableList)) {
                        // translate indexer to list.get()
                        list = <IObservableList<any>> o;
                        target = list.get(index);

                        // add collectionChanged to monitored observables
                        if (captured)
                            captured.add(list.listChanged);

                        // intercept access to observable properties
                        if (isProperty(target)) {
                            prop = <IObservableProperty<any>> target;

                            // register observable
                            if (captured)
                                captured.add(prop.changed);

                            // replace field assignment with property invocation
                            prop(newValue);
                        } else {
                            list.set(index, newValue);
                        }

                    } else {
                        // intercept access to observable properties
                        if (isProperty(o[index])) {
                            prop = <IObservableProperty<any>> target[index];

                            // register observable
                            if (captured)
                                captured.add(prop.changed);

                            // replace field assignment with property invocation
                            prop(newValue);
                        } else {
                            o[index] = newValue;
                        }
                    }

                    return newValue;
                }
            };

            // install property interceptor hooks
            this.compiler.setRuntimeHooks(locals, hooks);

            // injected context members into locals
            let keys = Object.keys(ctx);
            let length = keys.length;
            for(let i = 0; i < length; i++) {
                let key = keys[i];
                locals[key] = ctx[key];
            }

            return locals;
        }
    }

    export module internal {
        export var domManagerConstructor = <any> DomManager;
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {any} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    export function applyBindings(model: any, node?: Node) {
        injector.get<IDomManager>(res.domManager).applyBindings(model, node || window.document.documentElement);
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    export function cleanNode(node: Node) {
        injector.get<IDomManager>(res.domManager).cleanNode(node);
    }
}
