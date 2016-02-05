﻿import { createWeakMap } from "../Collections/WeakMap"

"use strict";

let _window = <any> window;
let userAgent = _window != null ? _window.navigator.userAgent : null;

export var ie: wx.IIEBrowserProperties;
export var opera: wx.IBrowserProperties;
export var safari: wx.IBrowserProperties;
export var firefox: wx.IBrowserProperties;

let parseVersion = matches => {
    if (matches) {
        return parseFloat(matches[1]);
    }

    return undefined;
}

// Detect Opera
if (_window != null && _window.opera && _window.opera.version) {
    opera = { version: parseInt(_window.opera.version()) };
}

// Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
// Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
// Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
let version = document && (function () {
    let version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

    // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
    while (
        div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
        iElems[0]
        ) { }
    return version > 4 ? version : undefined;
}());

if (version) {
    ie = <wx.IIEBrowserProperties> { version: version };

    if (version < 10) {
        // for IE9 and lower, provide an accessor for document scoped
        // observables which allow monitoring the selectionchange event
        let map = createWeakMap<Document, Rx.Observable<Document>>();

        ie.getSelectionChangeObservable = (el: HTMLElement) => {
            let doc = el.ownerDocument;
            let result = map.get(doc);

            if (result)
                return result;

            result = Rx.Observable.defer(() => {
                    return Rx.Observable.fromEvent(doc, 'selectionchange');
                })
                .select(x => doc)
                .publish()
                .refCount();

            map.set(doc, result);
            return result;
        };
    }
}

// Detect Safari (not Chrome or WebKit)
version = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i));
if (version) {
    safari = { version: version };
}

// Detect FF
version = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
if (version) {
    firefox = { version: version };
}

let hasES5 = typeof Array.isArray === "function" &&
    typeof [].forEach === "function" &&
    typeof [].map === "function" &&
    typeof [].some === "function" &&
    typeof [].indexOf === "function" &&
    typeof Object.keys === "function" &&
    typeof Object.defineProperty === "function";

export var isSupported = (!ie || ie.version >= 9) ||
    (!safari || safari.version >= 5) ||
    (!firefox || firefox.version >= 5) &&
    hasES5;

// Special support for jQuery here because it's so commonly used.
export var jQueryInstance = window != null ? window["jQuery"] : null;

/**
* Strips any external data associated with the node from it
* @param {Node} node The node to clean
*/
export var cleanExternalData:(node: Node)=> void;

if (jQueryInstance && (typeof jQueryInstance['cleanData'] === "function")) {
    cleanExternalData = (node: Node) => {
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node.
        jQueryInstance['cleanData']([node]);
    };
} else {
    cleanExternalData = (node: Node) => { };
}
