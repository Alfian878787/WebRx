﻿///<reference path="../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="typings/URI.d.ts" />
/// <reference path="../src/web.rx.d.ts" />

declare module wx {
    export interface IHistory {
        reset(): void;
        onPushState: Rx.Observable<PopStateEvent>;
    }
}

module testutils {
    var knownEvents = {}, knownEventTypesByEventName = {};
    const keyEventTypeName = 'KeyboardEvent';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];

    Object.keys(knownEvents).forEach(x=> {
        var eventType = x;
        var knownEventsForType = knownEvents[x];

        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });

    export function distinctUntilChanged<T>(arr: Array<T>): Array<T> {
        var isFirst = true;
        var lastValue;
        var result = new Array<T>();

        arr.forEach(v => {
            if (isFirst) {
                lastValue = v;
                isFirst = false;
                result.push(v);
            }

            if (v !== lastValue) {
                result.push(v);
            }
            lastValue = v;
        });

        return result;
    }

    export function run<T>(arr: Array<T>, block: (T) => void) {
        arr.forEach(x => block(x));
    }

    /// <summary>
    /// WithScheduler overrides the default Deferred and Taskpool schedulers
    /// with the given scheduler until the return value is disposed. This
    /// is useful in a unit test runner to force RxXaml objects to schedule
    /// via a TestScheduler object.
    /// </summary>
    /// <param name="sched">The scheduler to use.</param>
    /// <returns>An object that when disposed, restores the previous default
    /// schedulers.</returns>
    function _withScheduler<T extends Rx.IScheduler>(sched: T): Rx.IDisposable {
        //schedGate.WaitOne();
        var prevDef = wx.app.mainThreadScheduler;
        //var prevTask = wx.wx.App.taskpoolScheduler;

        wx.app.mainThreadScheduler = sched;
        //wx.wx.App.TaskpoolScheduler = sched;

        return Rx.Disposable.create(() => {
            wx.app.mainThreadScheduler = prevDef;
            //wx.App.TaskpoolScheduler = prevTask;
            //schedGate.Set();
        });
    }

    export function withScheduler<T extends Rx.IScheduler, TRet>(sched: T, block: (sched: T) => TRet) {
        var ret: TRet;
        var disp: Rx.IDisposable;

        try {
            disp = _withScheduler(sched);
            ret = block(sched);
        } finally {
            disp.dispose();
        }
        return ret;
    }

    export function recordNext<T>(sched: Rx.TestScheduler, milliseconds: number, value: T) : Rx.Recorded {
        return new Rx.Recorded(milliseconds, Rx.Notification.createOnNext<T>(value));
    }

    export interface IObservableSubscriptionCount {
        count: number;
        observable: Rx.Observable<any>;
    }

    export function trackSubscriptions(parent: Rx.Observable<any>): IObservableSubscriptionCount {
        var result: IObservableSubscriptionCount = { count: 0, observable: null };

        result.observable = Rx.Observable.create<any>(obs => {
            result.count++;

            var sub = parent.subscribe(x => obs.onNext(x), x => obs.onError(x),() => obs.onCompleted());

            return new Rx.CompositeDisposable(sub,
                Rx.Disposable.create(() => result.count--));
        });

        return result;
    }

    export function createHistory(): wx.IHistory {
        var stack:Array<{ data: any; url: string }> = [];
        var location: Location = <Location> {};
        var current: number = 0;
        var popStateSubject = new Rx.Subject<PopStateEvent>();
        var pushStateSubject = new Rx.Subject<PopStateEvent>();

        function updateLocation(uri: string) {
            var u = new URI(uri);
            location.host = u.host();
            location.href = u.href();
            location.pathname = u.pathname();
            location.port = u.port();
            location.protocol = u.protocol();
            location.search = u.search();
            location.hash = u.hash();

            location.toString = () => uri;
        } 

        function back() {
            if (current > 0) {
                current--;
            }

            updateLocation(stack[current].url);
            popStateSubject.onNext(<PopStateEvent> { state: stack[current].data });
        }

        function forward() {
            if (current < stack.length - 1) {
                current++;
            }

            updateLocation(stack[current].url);
            popStateSubject.onNext(<PopStateEvent> { state: stack[current].data });
        }

        function pushState(statedata: any, title: string, url?: string) {
            if (current < stack.length - 1) {
                stack[current] = { data: jQuery.extend(true, {}, statedata), url: url };
            } else {
                stack.push({ data: jQuery.extend(true, {}, statedata), url: url });
                current = stack.length - 1;
            }

            updateLocation(stack[current].url);
        }

        function replaceState(statedata: any, title: string, url?: string) {
            stack[current] = { data: jQuery.extend(true, {}, statedata), url: url };

            updateLocation(stack[current].url);
        }

        function reset() {
            stack = [];
            current = 0;
        }

        // inherit default implementation
        var result = <wx.IHistory> {
            back: back,
            forward: forward,
            //go: window.history.go,
            pushState: pushState,
            replaceState: replaceState,
            reset: reset,
            
            getSearchParameters: (query?:string)=> {
                query = query || result.location.search.substr(1);
                
                if(query) {
                    let result = {};
                    let params = query.split("&");
                    for ( var i = 0; i < params.length; i++) {
                        var tmp = params[i].split("=");
                        result[tmp[0]] = decodeURIComponent(tmp[1]);
                    }
            
                    return result;
                } 
                
                return {};
            }
        };

        Object.defineProperty(result, "length", {
            get() { return stack.length; },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(result, "state", {
            get() { return current !== -1 ? stack[current].data : undefined; },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(result, "location", {
            get() { return location; },
            enumerable: true,
            configurable: true
        });

        // enrich with observable
        result.onPopState = popStateSubject
            .publish()
            .refCount();

        result.onPushState = pushStateSubject
            .publish()
            .refCount();

        return result;
    }

    export function createModelContext(...models: any[]) {
        var ctx: wx.IDataContext = {
            $data: models[0],
            $root: models[models.length - 1],
            $parent: models.length > 1 ? models[1] : null,
            $parents: models.slice(1),
            $index: undefined
        };

        return ctx;
    }

    export function nodeListToArray(nodes: NodeList): Node[] {
        return Array.prototype.slice.call(nodes);
    }

    export function nodeChildrenToArray<T>(node: Node): T[] {
        return <T[]> <any> nodeListToArray(node.childNodes);
    }

    export function allAttributes2String(nodes: any[], attr: string, except?: any[]) {
        if (except)
            nodes = nodes.filter(x => except.indexOf(x) === -1);

        return nodes.map(x => x.getAttribute(attr)).join(", ");
    }

    export function triggerEvent(element: HTMLElement, eventType: string, keyCode?: any) {
        if (typeof document.createEvent == "function") {
            if (typeof element.dispatchEvent == "function") {
                var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                var event: any;

                if (eventCategory !== 'KeyboardEvent') {
                    event = document.createEvent(eventCategory);
                    (<any> event.initEvent)(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                } else {
                    var keyEvent = <KeyboardEvent> <any> document.createEvent(eventCategory);
                    keyEvent.initKeyboardEvent(eventType, true, true, null, "", 0, "", false, null);

                    if (keyCode) {
                        Object.defineProperty(keyEvent, 'keyCode', {
                            get() {
                                return keyCode;
                            }
                        });
                    }

                    event = keyEvent;
                }

                element.dispatchEvent(event);
            }
            else
                throw new Error("The supplied element doesn't support dispatchEvent");
        } else if (element.click) {
            element.click();
        } else if (typeof element["fireEvent"] != "undefined") {
            element["fireEvent"]("on" + eventType);
        } else {
            throw new Error("Browser doesn't support triggering events");
        }
    }

    export function ensureDummyAnimations() {
        // dummy animations
        if (!wx.app.animation("dummyEnter")) {
            wx.app.animation("dummyEnter", wx.animation((nodes, params) => Rx.Observable.return<any>(undefined)));
            wx.app.animation("dummyLeave", wx.animation((nodes, params) => Rx.Observable.return<any>(undefined)));
        }
    }
}

window["createMockHistory"] = testutils.createHistory;