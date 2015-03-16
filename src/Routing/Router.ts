﻿///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Core/Module.ts" />
/// <reference path="../Core/Property.ts" />
/// <reference path="RouteMatcher.ts" />

module wx {
    class Router implements IRouter {
        constructor(domService: IDomService) {
            this.domService = domService;

            this.reset();

            app.history.onPopState.subscribe((e) => {
                var stateName = e.state;

                if (stateName) {
                    var uri = app.history.location.pathname + app.history.location.search;
                    var route = this.getAbsoluteRouteForState(stateName);

                    // extract params by parsing current uri
                    var params = route.parse(uri);

                    // enter state using extracted params
                    this.go(stateName, params, { location: false });
                }
            });
        }

        public state(config: IRouterStateConfig): IRouter {
            this.registerStateInternal(config);
            return this;
        }

        public go(to: string, params?: {}, options?: IStateChangeOptions): void {
            to = this.mapPath(to);

            if (this.states[to] == null)
                internal.throwError("state '{0}' is not registered", to);

            this.activateState(to, params, options);
        }

        public get(state: string): IRouterStateConfig {
            return this.states[state];
        }

        public uri(state: string, params?: {}): string {
            state = this.mapPath(state);

            var route = this.getAbsoluteRouteForState(state);
            if (route != null)
                return route.stringify(params);

            return null;
        }

        public reset(): void {
            this.states = {};

            // Implicit root state that is always active
            this.root = this.registerStateInternal({
                name: this.rootStateName,
                route: route("/")
            });

            this.go(this.rootStateName);
        }

        public reload(): void {
            this.go(this.current().name, this.current().params, { force: true, location: false });
        }

        public current = wx.property<IRouterState>();

        //////////////////////////////////
        // Implementation

        private states: { [name: string]: IRouterStateConfig } = {};
        private root: IRouterStateConfig;
        private domService: IDomService;

        private pathSeparator = ".";
        private parentPathDirective = "^";
        private rootStateName = "$";
        private validPathRegExp = /^[a-zA-Z]([\w-_]*$)/;

        private registerStateInternal(state: IRouterStateConfig) {
            var parts = state.name.split(this.pathSeparator);

            if (state.name !== this.rootStateName) {
                // validate name
                if (parts.forEach(path => {
                    if (!this.validPathRegExp.test(path)) {
                        internal.throwError("invalid state-path '{0}' (a state-path must start with a character, optionally followed by one or more alphanumeric characters, dashes or underscores)");
                    }
                }));
            }

            // wrap and store
            state = <IRouterStateConfig> extend(state, {});
            this.states[state.name] = state;

            if (state.route != null) {
                // create route from string
                if (typeof state.route === "string") {
                    state.route = route(state.route);
                }
            } else {
                // derive relative route from name
                state.route = route(parts[parts.length - 1]);
            }

            // detect root-state override
            if (state.name === this.rootStateName)
                this.root = state;

            return state;
        }

        private mapPath(path: string) {
            // child-relative
            if (path.indexOf(this.pathSeparator) === 0) {
                return this.current().name + path;
            } else if (path.indexOf(this.parentPathDirective) === 0) {
                // parent-relative                
                var parent = this.current().name;

                // can't go further up than root
                if (parent === this.rootStateName)
                    return parent;

                // test parents and siblings until one is found that is registered
                var parts = parent.split(this.pathSeparator);

                for (var i = parts.length - 1; i > 0; i--) {
                    var tmp = parts.slice(0, i).join(this.pathSeparator);

                    // check if parant or sibling relative to current parent exists 
                    if (this.get(tmp) || this.get(tmp + path.substr(1))) {
                        path = tmp + path.substr(1);
                        return path;
                    }
                }

                // make it root relative
                path = this.rootStateName + path.substr(1);
                return path;
            } 

            return path;
        }

        private getStateHierarchy(name: string): IRouterStateConfig[] {
            var parts = name.split(this.pathSeparator);
            var stateName: string = "";
            var result = [];
            var state: IRouterStateConfig;

            if (name !== this.rootStateName)
                result.push(this.root);

            for (var i = 0; i < parts.length; i++) {
                if (i > 0)
                    stateName += this.pathSeparator + parts[i];
                else
                    stateName = parts[i];

                state = this.states[stateName];

                // if not registered, introduce fake state to keep hierarchy intact
                if (state == null) {
                    state = {
                        name: stateName,
                        route: route(stateName)
                    };
                }

                result.push(state);
            }

            return result;
        }

        private getAbsoluteRouteForState(name: string, hierarchy?: IRouterStateConfig[]): IRoute {
            hierarchy = hierarchy != null ? hierarchy : this.getStateHierarchy(name);
            var result: IRoute = null;

            hierarchy.forEach(state => {
                // concat urls
                if (result != null) {
                    var route = <IRoute> state.route;

                    // individual states may use absolute urls as well
                    if (!route.isAbsolute)
                        result = result.concat(<IRoute> state.route);
                    else
                        result = route;
                } else {
                    result = <IRoute> state.route;
                }
            });

            return result;
        }

        private activateState(to: string, params?: Object, options?: IStateChangeOptions): void {
            var hierarchy = this.getStateHierarchy(to);
            var stateViews: { [view: string]: string|{ component: string; params?: any } } = {};
            var stateParams = {};

            hierarchy.forEach(state => {
                // merge views
                if (state.views != null) {
                    extend(state.views, stateViews);
                }

                // merge params
                if (state.params != null) {
                    extend(state.params, stateParams);
                }
            });

            // merge param overrides
            if (params) {
                extend(params, stateParams);
            }

            // construct resulting state
            var route = this.getAbsoluteRouteForState(to, hierarchy);
            var state = <IRouterState> extend(this.states[to], {});
            state.uri = route.stringify(params);
            state.views = stateViews;
            state.params = stateParams;

            // perform deep equal against current state
            if ((options && options.force) || this.current() == null ||
                this.current().name !== to ||
                !isEqual(this.current().params, state.params)) {

                // update history
                if (options && options.location) {
                    if(options.location === RouterLocationChangeMode.replace)
                        app.history.replaceState(state.name, "", state.uri);
                    else
                        app.history.pushState(state.name, "", state.uri);
                }

                // activate
                this.current(state);
            }
        }
    }

    export module internal {
        export var routerConstructor = <any> Router;
    }
}