﻿///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Utils.ts" />
/// <reference path="Injector.ts" />
/// <reference path="Resources.ts" />
/// <reference path="Property.ts" />

module wx {
    "use strict";

    function toElementList(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList): Array<HTMLElement> {
        var nodes: Array<Node>;

        if (element instanceof Node || element instanceof HTMLElement)
            nodes = [<Node> element];
        else if (Array.isArray(element))
            nodes = <Array<Node>> element;
        else if (element instanceof NodeList)
            nodes = nodeListToArray(<NodeList> element);
        else
            internal.throwError("invalid argument: element");

        var elements = <Array<HTMLElement>> nodes.filter(x => x.nodeType === 1);
        return elements;
    }

    function getParsedMaxTransitionDuration(str) {
        var maxValue = 0;
        var values = str.split(/\s*,\s*/);

        values.forEach(value => {
            // it's always safe to consider only second values and omit `ms` values since
            // getComputedStyle will always handle the conversion for us
            if (value.charAt(value.length - 1) == 's') {
                value = value.substring(0, value.length - 1);
            }

            value = parseFloat(value) || 0;
            maxValue = maxValue ? Math.max(value, maxValue) : value;
        });

        return maxValue * 1000;
    }

    function scriptedAnimation(run: (element: HTMLElement, params?: any) => Rx.Observable<any>,
        prepare?: (element: HTMLElement, params?: any) => void,
        complete?: (element: HTMLElement, params?: any) => void): IAnimation {
        var result: IAnimation = <any> {};

        if (prepare) {
            result.prepare = (nodes, params) => {
                var elements = toElementList(nodes);
                elements.forEach(x => prepare(x, params));
            }
        }

        result.run = (nodes, params) => {
            return Rx.Observable.defer(() => {
                var elements = toElementList(nodes);
                return Rx.Observable.combineLatest(elements.map(x => run(x, params)), <any> noop);
            });
        }

        if (complete) {
            result.complete = (nodes, params) => {
                var elements = toElementList(nodes);
                elements.forEach(x => complete(x, params));
            }
        }

        return result;
    }

    function cssAnimation(prepare: string, run: string): IAnimation {
        var result: IAnimation = <any> {};

        if (prepare) {
            result.prepare = (nodes, params) => {
                var elements = toElementList(nodes);
                elements.forEach(x => toggleCssClass(x, true, prepare));
            }
        }

        result.run = (nodes, params) => {
            return Rx.Observable.defer(() => {
                var elements = toElementList(nodes);

                var obs = Rx.Observable.combineLatest(elements.map(x => {
                    var duration = getParsedMaxTransitionDuration(getComputedStyle(x)["transitionDuration"]);
                    return Rx.Observable.timer(duration);
                }), <any> noop);

                // defer animation-start to avoid problems with transitions on freshly added elements 
                Rx.Observable.timer(1).subscribe(() => {
                    elements.forEach(x => toggleCssClass(x, true, run));
                });

                return obs;
            });
        }

        result.complete = (nodes, params) => {
            var elements = toElementList(nodes);
            elements.forEach(x => toggleCssClass(x, false, prepare, run));
        }

        return result;
    }

    /**
     * Registers a CSS-based animation
     * @param {string} prepare The css classes to apply before the animation runs and to be removed automatically after the animation has completed.
     * @param {string} run The css classes to apply for the animation
     * @returns {Rx.Observable<any>} An observable that signals that the animation is complete
     */
    export function animation(preparationClasses: string, runClasses: string): IAnimation;
     
    /**
     * Registers a scripted animation
     * @param {(element: HTMLElement, params?: any)=> Rx.Observable<any>} run The function that carries out the animation
     * @param {(element: HTMLElement, params?: any)=> void} prepare The function that prepares the targeted elements for the animation
     * @param {(element: HTMLElement, params?: any)=> void} complete The function that performs and cleanup on the targeted elements after the animation is complete
     * @returns {Rx.Observable<any>} An observable that signals that the animation is complete
     */
    export function animation(run:(element: HTMLElement, params?: any)=> Rx.Observable<any>,
        prepare?: (element: HTMLElement, params?: any) => void,
        complete?: (element: HTMLElement, params?: any) => void): IAnimation;

    export function animation() {
        var args = args2Array(arguments);
        var run = args.shift();

        if (typeof run === "function") {
            return scriptedAnimation(run, args.shift(), args.shift());
        } else if (typeof run === "string") {
            return cssAnimation(run, args.shift());
        } else {
            internal.throwError("invalid arguments");
        }
    }
}