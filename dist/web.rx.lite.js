(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["wx"] = factory();
	else
		root["wx"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="./Interfaces.ts" />
	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	// WebRx Lite API-Surface (No UI functionality is included)
	__export(__webpack_require__(1));
	var Property_1 = __webpack_require__(4);
	exports.property = Property_1.property;
	var Command_1 = __webpack_require__(5);
	exports.command = Command_1.command;
	exports.asyncCommand = Command_1.asyncCommand;
	exports.isCommand = Command_1.isCommand;
	var Oid_1 = __webpack_require__(8);
	exports.getOid = Oid_1.getOid;
	var List_1 = __webpack_require__(9);
	exports.list = List_1.list;
	var ListSupport_1 = __webpack_require__(15);
	exports.isList = ListSupport_1.isList;
	var Map_1 = __webpack_require__(16);
	exports.createMap = Map_1.createMap;
	var Set_1 = __webpack_require__(17);
	exports.createSet = Set_1.createSet;
	exports.setToArray = Set_1.setToArray;
	var WeakMap_1 = __webpack_require__(18);
	exports.createWeakMap = WeakMap_1.createWeakMap;
	var Lazy_1 = __webpack_require__(10);
	exports.Lazy = Lazy_1.default;
	var Injector_1 = __webpack_require__(6);
	exports.injector = Injector_1.injector;
	var IID_1 = __webpack_require__(3);
	exports.IID = IID_1.default;
	var HttpClient_1 = __webpack_require__(19);
	exports.getHttpClientDefaultConfig = HttpClient_1.getHttpClientDefaultConfig;
	var res = __webpack_require__(7);
	exports.res = res;
	// install the Rx extensions manually (instead of in App which is not exported)
	var RxExtensions_1 = __webpack_require__(20);
	RxExtensions_1.install();
	var MessageBus_1 = __webpack_require__(21);
	var HttpClient_2 = __webpack_require__(19);
	// simulate a minimal App component
	exports.app = {
	    defaultExceptionHandler: Rx.Observer.create(function (ex) { }),
	    mainThreadScheduler: this._unitTestMainThreadScheduler || this._mainThreadScheduler || Rx.Scheduler.currentThread
	};
	// register the app, messageBus, and httpClient instances
	Injector_1.injector.register(res.app, exports.app)
	    .register(res.messageBus, [MessageBus_1.default], true)
	    .register(res.httpClient, [HttpClient_2.default], false);
	// manually export the messageBus (instead of in App which is not exported)
	exports.messageBus = Injector_1.injector.get(res.messageBus);
	//# sourceMappingURL=WebRx.Lite.js.map

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var Events_1 = __webpack_require__(2);
	var IID_1 = __webpack_require__(3);
	/*
	* Global helpers
	*/
	"use strict";
	var regexCssClassName = /\S+/g;
	var RxObsConstructor = Rx.Observable; // the cast is neccessary because the rx.js.d.ts declares Observable as an interface
	exports.noop = function () { };
	/**
	* Returns true if a ECMAScript5 strict-mode is active
	*/
	function isStrictMode() {
	    return typeof this === "undefined";
	}
	exports.isStrictMode = isStrictMode;
	/**
	* Returns true if target is a javascript primitive
	*/
	function isPrimitive(target) {
	    var t = typeof target;
	    return t === "boolean" || t === "number" || t === "string";
	}
	exports.isPrimitive = isPrimitive;
	/**
	* Tests if the target supports the interface
	* @param {any} target
	* @param {string} iid
	*/
	function queryInterface(target, iid) {
	    if (target == null || isPrimitive(target))
	        return false;
	    var unk = target;
	    if (!isFunction(unk.queryInterface))
	        return false;
	    return unk.queryInterface(iid);
	}
	exports.queryInterface = queryInterface;
	/**
	* Returns all own properties of target implementing interface iid
	* @param {any} target
	* @param {string} iid
	*/
	function getOwnPropertiesImplementingInterface(target, iid) {
	    return Object.keys(target).filter(function (propertyName) {
	        // lookup object for name
	        var o = target[propertyName];
	        // is it an ObservableProperty?
	        return queryInterface(o, iid);
	    }).map(function (x) { return new PropertyInfo(x, target[x]); });
	}
	exports.getOwnPropertiesImplementingInterface = getOwnPropertiesImplementingInterface;
	/**
	* Disposes all disposable members of an object
	* @param {any} target
	*/
	function disposeMembers(target) {
	    Object.keys(target).filter(function (propertyName) {
	        var disp = target[propertyName];
	        return disp != null && isFunction(disp.dispose);
	    })
	        .map(function (propertyName) { return target[propertyName]; })
	        .forEach(function (disp) { return disp.dispose(); });
	}
	exports.disposeMembers = disposeMembers;
	/**
	* Determines if target is an instance of a IObservableProperty
	* @param {any} target
	*/
	function isProperty(target) {
	    if (target == null)
	        return false;
	    return queryInterface(target, IID_1.default.IObservableProperty);
	}
	exports.isProperty = isProperty;
	/**
	* Determines if target is an instance of a IObservableProperty
	* @param {any} target
	*/
	function isReadOnlyProperty(target) {
	    if (target == null)
	        return false;
	    return queryInterface(target, IID_1.default.IObservableReadOnlyProperty);
	}
	exports.isReadOnlyProperty = isReadOnlyProperty;
	/**
	* Determines if target is an instance of a Rx.Scheduler
	* @param {any} target
	*/
	function isRxScheduler(target) {
	    if (target == null)
	        return false;
	    return Rx.Scheduler.isScheduler(target);
	}
	exports.isRxScheduler = isRxScheduler;
	/**
	* Determines if target is an instance of a Rx.Observable
	* @param {any} target
	*/
	function isRxObservable(target) {
	    if (target == null)
	        return false;
	    return target instanceof RxObsConstructor;
	}
	exports.isRxObservable = isRxObservable;
	/**
	* Determines if target is an instance of a promise
	* @param {any} target
	*/
	function isPromise(target) {
	    if (target == null)
	        return false;
	    return Rx.helpers.isPromise(target);
	}
	exports.isPromise = isPromise;
	/**
	* If the prop is an observable property return its value
	* @param {any} prop
	*/
	function unwrapProperty(prop) {
	    if (isProperty(prop))
	        return prop();
	    return prop;
	}
	exports.unwrapProperty = unwrapProperty;
	function getObservable(o) {
	    if (isProperty(o)) {
	        var prop = o;
	        return prop.changed.startWith(prop());
	    }
	    if (isRxObservable(o))
	        return o;
	    throwError("getObservable: '" + o + "' is neither observable property nor observable");
	}
	exports.getObservable = getObservable;
	/**
	* Returns true if a Unit-Testing environment is detected
	*/
	function isInUnitTest() {
	    // detect jasmine 1.x
	    if (window && window["jasmine"] && window["jasmine"].version_ !== undefined) {
	        return true;
	    }
	    // detect jasmine 2.x
	    if (window && window["getJasmineRequireObj"] && typeof window["getJasmineRequireObj"] === "function") {
	        return true;
	    }
	    return false;
	}
	exports.isInUnitTest = isInUnitTest;
	/**
	* Transforms the current method's arguments into an array
	*/
	function args2Array(args) {
	    var result = [];
	    for (var i = 0, len = args.length; i < len; i++) {
	        result.push(args[i]);
	    }
	    return result;
	}
	exports.args2Array = args2Array;
	/**
	* Formats a string using .net style format string
	* @param {string} fmt The format string
	* @param {any[]} ...args Format arguments
	*/
	function formatString(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    var pattern = /\{\d+\}/g;
	    return fmt.replace(pattern, function (capture) {
	        return args[capture.match(/\d+/)];
	    });
	}
	exports.formatString = formatString;
	/**
	* Copies own properties from src to dst
	*/
	function extend(src, dst, inherited) {
	    var prop;
	    if (!inherited) {
	        var ownProps = Object.getOwnPropertyNames(src);
	        for (var i = 0; i < ownProps.length; i++) {
	            prop = ownProps[i];
	            dst[prop] = src[prop];
	        }
	    }
	    else {
	        for (prop in src) {
	            dst[prop] = src[prop];
	        }
	    }
	    return dst;
	}
	exports.extend = extend;
	var PropertyInfo = (function () {
	    function PropertyInfo(propertyName, property) {
	        this.property = property;
	        this.propertyName = propertyName;
	    }
	    return PropertyInfo;
	}());
	exports.PropertyInfo = PropertyInfo;
	/**
	* Toggles one ore more css classes on the specified DOM element
	* @param {Node} node The target element
	* @param {boolean} shouldHaveClass True if the classes should be added to the element, false if they should be removed
	* @param {string[]} classNames The list of classes to process
	*/
	function toggleCssClass(node, shouldHaveClass) {
	    var classNames = [];
	    for (var _i = 2; _i < arguments.length; _i++) {
	        classNames[_i - 2] = arguments[_i];
	    }
	    if (classNames) {
	        var currentClassNames = node.className.match(regexCssClassName) || [];
	        var index = void 0;
	        var className = void 0;
	        if (shouldHaveClass) {
	            for (var i = 0; i < classNames.length; i++) {
	                className = classNames[i];
	                index = currentClassNames.indexOf(className);
	                if (index === -1)
	                    currentClassNames.push(className);
	            }
	        }
	        else {
	            for (var i = 0; i < classNames.length; i++) {
	                className = classNames[i];
	                index = currentClassNames.indexOf(className);
	                if (index !== -1)
	                    currentClassNames.splice(index, 1);
	            }
	        }
	        node.className = currentClassNames.join(" ");
	    }
	}
	exports.toggleCssClass = toggleCssClass;
	/**
	* Determines if the specified DOM element has the specified CSS-Class
	* @param {Node} node The target element
	* @param {string} className The classe to check
	*/
	function hasCssClass(node, className) {
	    var currentClassNames = node.className.match(regexCssClassName) || [];
	    return currentClassNames.indexOf(className) !== -1;
	}
	exports.hasCssClass = hasCssClass;
	/**
	 * Trigger a reflow on the target element
	 * @param {HTMLElement} el
	 */
	function triggerReflow(el) {
	    el.getBoundingClientRect();
	}
	exports.triggerReflow = triggerReflow;
	/**
	 * Returns true if the specified element may be disabled
	 * @param {HTMLElement} el
	 */
	function elementCanBeDisabled(el) {
	    return el instanceof HTMLButtonElement ||
	        el instanceof HTMLAnchorElement ||
	        el instanceof HTMLInputElement ||
	        el instanceof HTMLFieldSetElement ||
	        el instanceof HTMLLinkElement ||
	        el instanceof HTMLOptGroupElement ||
	        el instanceof HTMLOptionElement ||
	        el instanceof HTMLSelectElement ||
	        el instanceof HTMLTextAreaElement;
	}
	exports.elementCanBeDisabled = elementCanBeDisabled;
	/**
	 * Returns true if object is a Function.
	 * @param obj
	 */
	function isFunction(obj) {
	    return typeof obj == 'function' || false;
	}
	exports.isFunction = isFunction;
	/**
	 * Returns true if object is a Disposable
	 * @param obj
	 */
	function isDisposable(obj) {
	    return queryInterface(obj, IID_1.default.IDisposable) || isFunction(obj["dispose"]);
	}
	exports.isDisposable = isDisposable;
	/**
	 * Performs an optimized deep comparison between the two objects, to determine if they should be considered equal.
	 * @param a Object to compare
	 * @param b Object to compare to
	 */
	function isEqual(a, b, aStack, bStack) {
	    var toString = ({}).toString;
	    // Identical objects are equal. `0 === -0`, but they aren't identical.
	    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
	    if (a === b)
	        return a !== 0 || 1 / a === 1 / b;
	    // A strict comparison is necessary because `null == undefined`.
	    if (a == null || b == null)
	        return a === b;
	    // Unwrap any wrapped objects.
	    //if (a instanceof _) a = a._wrapped;
	    //if (b instanceof _) b = b._wrapped;
	    // Compare `[[Class]]` names.
	    var className = toString.call(a);
	    if (className !== toString.call(b))
	        return false;
	    switch (className) {
	        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
	        case '[object RegExp]':
	        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
	        case '[object String]':
	            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
	            // equivalent to `new String("5")`.
	            return '' + a === '' + b;
	        case '[object Number]':
	            // `NaN`s are equivalent, but non-reflexive.
	            // Object(NaN) is equivalent to NaN
	            if (+a !== +a)
	                return +b !== +b;
	            // An `egal` comparison is performed for other numeric values.
	            return +a === 0 ? 1 / +a === 1 / b : +a === +b;
	        case '[object Date]':
	        case '[object Boolean]':
	            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
	            // millisecond representations. Note that invalid dates with millisecond representations
	            // of `NaN` are not equivalent.
	            return +a === +b;
	    }
	    var areArrays = className === '[object Array]';
	    if (!areArrays) {
	        if (typeof a != 'object' || typeof b != 'object')
	            return false;
	        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
	        // from different frames are.
	        var aCtor = a.constructor, bCtor = b.constructor;
	        if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
	            isFunction(bCtor) && bCtor instanceof bCtor)
	            && ('constructor' in a && 'constructor' in b)) {
	            return false;
	        }
	    }
	    // Assume equality for cyclic structures. The algorithm for detecting cyclic
	    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
	    // Initializing stack of traversed objects.
	    // It's done here since we only need them for objects and arrays comparison.
	    aStack = aStack || [];
	    bStack = bStack || [];
	    var length = aStack.length;
	    while (length--) {
	        // Linear search. Performance is inversely proportional to the number of
	        // unique nested structures.
	        if (aStack[length] === a)
	            return bStack[length] === b;
	    }
	    // Add the first object to the stack of traversed objects.
	    aStack.push(a);
	    bStack.push(b);
	    // Recursively compare objects and arrays.
	    if (areArrays) {
	        // Compare array lengths to determine if a deep comparison is necessary.
	        length = a.length;
	        if (length !== b.length)
	            return false;
	        // Deep compare the contents, ignoring non-numeric properties.
	        while (length--) {
	            if (!isEqual(a[length], b[length], aStack, bStack))
	                return false;
	        }
	    }
	    else {
	        // Deep compare objects.
	        var keys = Object.keys(a), key = void 0;
	        length = keys.length;
	        // Ensure that both objects contain the same number of properties before comparing deep equality.
	        if (Object.keys(b).length !== length)
	            return false;
	        while (length--) {
	            // Deep compare each member
	            key = keys[length];
	            if (!(b.hasOwnProperty(key) && isEqual(a[key], b[key], aStack, bStack)))
	                return false;
	        }
	    }
	    // Remove the first object from the stack of traversed objects.
	    aStack.pop();
	    bStack.pop();
	    return true;
	}
	exports.isEqual = isEqual;
	/**
	* Returns an array of clones of the nodes in the source array
	*/
	function cloneNodeArray(nodes) {
	    var length = nodes.length;
	    var result = new Array(length);
	    for (var i = 0; i < length; i++) {
	        result[i] = nodes[i].cloneNode(true);
	    }
	    return result;
	}
	exports.cloneNodeArray = cloneNodeArray;
	/**
	 * Converts a NodeList into a javascript array
	 * @param {NodeList} nodes
	 */
	function nodeListToArray(nodes) {
	    return Array.prototype.slice.call(nodes);
	}
	exports.nodeListToArray = nodeListToArray;
	/**
	 * Converts the node's children into a javascript array
	 * @param {Node} node
	 */
	function nodeChildrenToArray(node) {
	    return nodeListToArray(node.childNodes);
	}
	exports.nodeChildrenToArray = nodeChildrenToArray;
	/**
	* Wraps an action in try/finally block and disposes the resource after the action has completed even if it throws an exception
	* (mimics C# using statement)
	* @param {Rx.IDisposable} disp The resource to dispose after action completes
	* @param {() => void} action The action to wrap
	*/
	function using(disp, action) {
	    if (!disp)
	        throw new Error("disp");
	    if (!action)
	        throw new Error("action");
	    try {
	        action(disp);
	    }
	    finally {
	        disp.dispose();
	    }
	}
	exports.using = using;
	/**
	* Turns an AMD-Style require call into an observable
	* @param {string} Module The module to load
	* @return {Rx.Observable<any>} An observable that yields a value and completes as soon as the module has been loaded
	*/
	function observableRequire(module) {
	    var requireFunc = window != null ? window["require"] : null;
	    if (!isFunction(requireFunc))
	        throwError("there's no AMD-module loader available (Hint: did you forget to include RequireJS in your project?)");
	    return Rx.Observable.create(function (observer) {
	        try {
	            requireFunc([module], function (m) {
	                observer.onNext(m);
	                observer.onCompleted();
	            }, function (err) {
	                observer.onError(err);
	            });
	        }
	        catch (e) {
	            observer.onError(e);
	        }
	        return Rx.Disposable.empty;
	    });
	}
	exports.observableRequire = observableRequire;
	/**
	* Returns an observable that notifes of any observable property changes on the target
	* @param {any} target The object to observe
	* @return {Rx.Observable<T>} An observable
	*/
	function observeObject(target, defaultExceptionHandler, onChanging) {
	    if (onChanging === void 0) { onChanging = false; }
	    var thrownExceptionsSubject = queryInterface(target, IID_1.default.IHandleObservableErrors) ?
	        target.thrownExceptions : defaultExceptionHandler;
	    return Rx.Observable.create(function (observer) {
	        var result = new Rx.CompositeDisposable();
	        var observableProperties = getOwnPropertiesImplementingInterface(target, IID_1.default.IObservableProperty);
	        observableProperties.forEach(function (x) {
	            var prop = x.property;
	            var obs = onChanging ? prop.changing : prop.changed;
	            result.add(obs.subscribe(function (_) {
	                var e = new Events_1.PropertyChangedEventArgs(self, x.propertyName);
	                try {
	                    observer.onNext(e);
	                }
	                catch (ex) {
	                    thrownExceptionsSubject.onNext(ex);
	                }
	            }));
	        });
	        return result;
	    })
	        .publish()
	        .refCount();
	}
	exports.observeObject = observeObject;
	/**
	 * whenAny allows you to observe whenever the value of one or more properties
	 * on an object have changed, providing an initial value when the Observable is set up.
	 */
	function whenAny() {
	    // no need to invoke combineLatest for the simplest case
	    if (arguments.length === 2) {
	        return getObservable(arguments[0]).select(arguments[1]);
	    }
	    var args = args2Array(arguments);
	    // extract selector
	    var selector = args.pop();
	    // verify selector
	    if (isProperty(selector) || isRxObservable(selector)) {
	        args.push(selector);
	        selector = function () {
	            return args2Array(arguments);
	        };
	    }
	    // transform args
	    args = args.map(function (x) { return getObservable(x); });
	    // finally append the selector
	    args.push(selector);
	    return Rx.Observable.combineLatest.apply(this, args);
	}
	exports.whenAny = whenAny;
	/**
	* FOR INTERNAL USE ONLY
	* Throw an error containing the specified description
	*/
	function throwError(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    var msg = "WebRx: " + formatString(fmt, args);
	    throw new Error(msg);
	}
	exports.throwError = throwError;
	//# sourceMappingURL=Utils.js.map

/***/ },
/* 2 */
/***/ function(module, exports) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var PropertyChangedEventArgs = (function () {
	    /// <summary>
	    /// Initializes a new instance of the <see cref="ObservablePropertyChangedEventArgs{TSender}"/> class.
	    /// </summary>
	    /// <param name="sender">The sender.</param>
	    /// <param name="propertyName">Name of the property.</param>
	    function PropertyChangedEventArgs(sender, propertyName) {
	        this.propertyName = propertyName;
	        this.sender = sender;
	    }
	    return PropertyChangedEventArgs;
	}());
	exports.PropertyChangedEventArgs = PropertyChangedEventArgs;
	//# sourceMappingURL=Events.js.map

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	/// <summary>
	/// Interface registry to be used with IUnknown.queryInterface
	/// </summary>
	var IID = (function () {
	    function IID() {
	    }
	    IID.IDisposable = "IDisposable";
	    IID.IObservableProperty = "IObservableProperty";
	    IID.IObservableReadOnlyProperty = "IObservableReadOnlyProperty";
	    IID.IObservableList = "IObservableList";
	    IID.ICommand = "ICommand";
	    IID.IHandleObservableErrors = "IHandleObservableErrors";
	    return IID;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = IID;
	//# sourceMappingURL=IID.js.map

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var IID_1 = __webpack_require__(3);
	// NOTE: The factory method approach is necessary because it is
	// currently impossible to implement a Typescript interface
	// with a function signature in a Typescript class.
	"use strict";
	/**
	* Creates an observable property with an optional default value
	* @param {T} initialValue?
	*/
	function property(initialValue) {
	    // initialize accessor function
	    var accessor = function (newVal) {
	        if (arguments.length > 0) {
	            // set
	            if (newVal !== accessor.value) {
	                accessor.changingSubject.onNext(newVal);
	                accessor.value = newVal;
	                accessor.changedSubject.onNext(newVal);
	            }
	        }
	        else {
	            // get
	            return accessor.value;
	        }
	    };
	    //////////////////////////////////
	    // IUnknown implementation
	    accessor.queryInterface = function (iid) {
	        return iid === IID_1.default.IObservableProperty || iid === IID_1.default.IDisposable;
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    accessor.dispose = function () {
	    };
	    //////////////////////////////////
	    // IObservableProperty<T> implementation
	    if (initialValue !== undefined)
	        accessor.value = initialValue;
	    // setup observables
	    accessor.changedSubject = new Rx.Subject();
	    accessor.changed = accessor.changedSubject.asObservable();
	    accessor.changingSubject = new Rx.Subject();
	    accessor.changing = accessor.changingSubject.asObservable();
	    return accessor;
	}
	exports.property = property;
	//# sourceMappingURL=Property.js.map

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var IID_1 = __webpack_require__(3);
	var Utils_1 = __webpack_require__(1);
	var Injector_1 = __webpack_require__(6);
	var res = __webpack_require__(7);
	"use strict";
	var Command = (function () {
	    /// <summary>
	    /// Don't use this directly, use commandXYZ instead
	    /// </summary>
	    function Command(canExecute, executeAsync, scheduler) {
	        var _this = this;
	        this.resultsSubject = new Rx.Subject();
	        this.isExecutingSubject = new Rx.Subject();
	        this.inflightCount = 0;
	        this.canExecuteLatest = false;
	        this.scheduler = scheduler || Injector_1.injector.get(res.app).mainThreadScheduler;
	        this.func = executeAsync;
	        // setup canExecute
	        var canExecuteObs = canExecute
	            .combineLatest(this.isExecutingSubject.startWith(false), function (ce, ie) { return ce && !ie; })
	            .catch(function (ex) {
	            _this.exceptionsSubject.onNext(ex);
	            return Rx.Observable.return(false);
	        })
	            .do(function (x) {
	            _this.canExecuteLatest = x;
	        })
	            .startWith(this.canExecuteLatest)
	            .distinctUntilChanged()
	            .publish();
	        this.canExecuteDisp = canExecuteObs.connect();
	        this.canExecuteObservable = canExecuteObs;
	        // setup thrownExceptions
	        this.exceptionsSubject = new Rx.Subject();
	        this.thrownExceptions = this.exceptionsSubject.asObservable();
	        this.exceptionsSubject
	            .observeOn(this.scheduler)
	            .subscribe(Injector_1.injector.get(res.app).defaultExceptionHandler);
	    }
	    //////////////////////////////////
	    // IUnknown implementation
	    Command.prototype.queryInterface = function (iid) {
	        return iid === IID_1.default.ICommand || iid === IID_1.default.IDisposable;
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    Command.prototype.dispose = function () {
	        var disp = this.canExecuteDisp;
	        if (disp != null)
	            disp.dispose();
	    };
	    Object.defineProperty(Command.prototype, "isExecuting", {
	        get: function () {
	            return this.isExecutingSubject.startWith(this.inflightCount > 0);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Command.prototype, "results", {
	        get: function () {
	            return this.resultsSubject.asObservable();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Command.prototype.canExecute = function (parameter) {
	        return this.canExecuteLatest;
	    };
	    Command.prototype.execute = function (parameter) {
	        this.executeAsync(parameter)
	            .catch(Rx.Observable.empty())
	            .subscribe();
	    };
	    Command.prototype.executeAsync = function (parameter) {
	        var self = this;
	        var ret = this.canExecute(parameter) ? Rx.Observable.create(function (subj) {
	            if (++self.inflightCount === 1) {
	                self.isExecutingSubject.onNext(true);
	            }
	            var decrement = new Rx.SerialDisposable();
	            decrement.setDisposable(Rx.Disposable.create(function () {
	                if (--self.inflightCount === 0) {
	                    self.isExecutingSubject.onNext(false);
	                }
	            }));
	            var disp = self.func(parameter)
	                .observeOn(self.scheduler)
	                .do(function (_) { }, function (e) { return decrement.setDisposable(Rx.Disposable.empty); }, function () { return decrement.setDisposable(Rx.Disposable.empty); })
	                .do(function (x) { return self.resultsSubject.onNext(x); }, function (x) { return self.exceptionsSubject.onNext(x); })
	                .subscribe(subj);
	            return new Rx.CompositeDisposable(disp, decrement);
	        }) : Rx.Observable.throw(new Error("canExecute currently forbids execution"));
	        return ret
	            .publish()
	            .refCount();
	    };
	    return Command;
	}());
	exports.Command = Command;
	var internal;
	(function (internal) {
	    internal.commandConstructor = Command;
	})(internal = exports.internal || (exports.internal = {}));
	// factory method implementation
	function command() {
	    var args = Utils_1.args2Array(arguments);
	    var canExecute;
	    var execute;
	    var scheduler;
	    var thisArg;
	    if (Utils_1.isFunction(args[0])) {
	        // first overload
	        execute = args.shift();
	        canExecute = Utils_1.isRxObservable(args[0]) ? args.shift() : Rx.Observable.return(true);
	        scheduler = Utils_1.isRxScheduler(args[0]) ? args.shift() : undefined;
	        thisArg = args.shift();
	        if (thisArg != null)
	            execute = execute.bind(thisArg);
	        return asyncCommand(canExecute, function (parameter) {
	            return Rx.Observable.create(function (obs) {
	                try {
	                    execute(parameter);
	                    obs.onNext(null);
	                    obs.onCompleted();
	                }
	                catch (e) {
	                    obs.onError(e);
	                }
	                return Rx.Disposable.empty;
	            });
	        }, scheduler);
	    }
	    // second overload
	    canExecute = args.shift() || Rx.Observable.return(true);
	    scheduler = Utils_1.isRxScheduler(args[0]) ? args.shift() : undefined;
	    return new Command(canExecute, function (x) { return Rx.Observable.return(x); }, scheduler);
	}
	exports.command = command;
	// factory method implementation
	function asyncCommand() {
	    var args = Utils_1.args2Array(arguments);
	    var canExecute;
	    var executeAsync;
	    var scheduler;
	    var thisArg;
	    if (Utils_1.isFunction(args[0])) {
	        // second overload
	        executeAsync = args.shift();
	        scheduler = Utils_1.isRxScheduler(args[0]) ? args.shift() : undefined;
	        thisArg = args.shift();
	        if (thisArg != null)
	            executeAsync = executeAsync.bind(thisArg);
	        return new Command(Rx.Observable.return(true), executeAsync, scheduler);
	    }
	    // first overload
	    canExecute = args.shift();
	    executeAsync = args.shift();
	    scheduler = Utils_1.isRxScheduler(args[0]) ? args.shift() : undefined;
	    return new Command(canExecute, executeAsync, scheduler);
	}
	exports.asyncCommand = asyncCommand;
	/**
	* Determines if target is an instance of a ICommand
	* @param {any} target
	*/
	function isCommand(target) {
	    if (target == null)
	        return false;
	    return target instanceof Command ||
	        Utils_1.queryInterface(target, IID_1.default.ICommand);
	}
	exports.isCommand = isCommand;
	//# sourceMappingURL=Command.js.map

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var Utils_1 = __webpack_require__(1);
	var res = __webpack_require__(7);
	"use strict";
	/**
	* Simple IoC & Service Locator
	*/
	var Injector = (function () {
	    function Injector() {
	        //////////////////////////////////
	        // Implementation
	        this.registrations = {};
	    }
	    Injector.prototype.register = function () {
	        var key = arguments[0];
	        var val = arguments[1];
	        var isSingleton = arguments[2];
	        var factory;
	        if (this.registrations.hasOwnProperty(key))
	            Utils_1.throwError("'{0}' is already registered", key);
	        if (Utils_1.isFunction(val)) {
	            // second overload
	            // it's a factory function
	            factory = function (args, deps) { return val.apply(null, args); };
	        }
	        else if (Array.isArray(val)) {
	            // first overload
	            // array assumed to be inline array notation with constructor
	            var self_1 = this;
	            var ctor_1 = val.pop();
	            var dependencies_1 = val;
	            factory = function (args, deps) {
	                // resolve dependencies
	                var resolved = dependencies_1.map(function (x) {
	                    try {
	                        return self_1.get(x, undefined, deps);
	                    }
	                    catch (e) {
	                        Utils_1.throwError("Error resolving dependency '{0}' for '{1}': {2}", x, key, e);
	                    }
	                });
	                // invoke constructor
	                var _args = [null].concat(resolved).concat(args);
	                var ctorFunc = ctor_1.bind.apply(ctor_1, _args);
	                return new ctorFunc();
	            };
	        }
	        else {
	            // third overload
	            // singleton
	            factory = function (args, deps) { return val; };
	        }
	        this.registrations[key] = { factory: factory, isSingleton: isSingleton };
	        return this;
	    };
	    Injector.prototype.get = function (key, args, deps) {
	        deps = deps || {};
	        if (deps.hasOwnProperty(key))
	            Utils_1.throwError("Detected circular dependency a from '{0}' to '{1}'", Object.keys(deps).join(", "), key);
	        // registered?
	        var registration = this.registrations[key];
	        if (registration === undefined)
	            Utils_1.throwError("'{0}' is not registered", key);
	        // already instantiated?
	        if (registration.isSingleton && registration.value)
	            return registration.value;
	        // append current key
	        var newDeps = {};
	        newDeps[key] = true;
	        Utils_1.extend(deps, newDeps);
	        // create it
	        var result = registration.factory(args, newDeps);
	        // cache if singleton
	        if (registration.isSingleton)
	            registration.value = result;
	        return result;
	    };
	    Injector.prototype.resolve = function (iaa, args) {
	        var ctor = iaa.pop();
	        if (!Utils_1.isFunction(ctor))
	            Utils_1.throwError("Error resolving inline-annotated-array. Constructor must be of type 'function' but is '{0}", typeof ctor);
	        var self = this;
	        // resolve dependencies
	        var resolved = iaa.map(function (x) {
	            try {
	                return self.get(x, undefined, iaa);
	            }
	            catch (e) {
	                Utils_1.throwError("Error resolving dependency '{0}' for '{1}': {2}", x, Object.getPrototypeOf(ctor), e);
	            }
	        });
	        // invoke constructor
	        var _args = [null].concat(resolved).concat(args);
	        var ctorFunc = ctor.bind.apply(ctor, _args);
	        return new ctorFunc();
	    };
	    return Injector;
	}());
	exports.injector = new Injector();
	exports.injector.register(res.injector, function () { return new Injector(); });
	//# sourceMappingURL=Injector.js.map

/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	exports.app = "app";
	exports.injector = "injector";
	exports.domManager = "domservice";
	exports.router = "router";
	exports.messageBus = "messageBus";
	exports.expressionCompiler = "expressioncompiler";
	exports.templateEngine = "templateEngine";
	exports.httpClient = "httpClient";
	exports.simpleBindingHandler = "bindings.simple";
	exports.hasValueBindingValue = "has.bindings.value";
	exports.valueBindingValue = "bindings.value";
	//# sourceMappingURL=Resources.js.map

/***/ },
/* 8 */
/***/ function(module, exports) {

	"use strict";
	var oid = 1;
	var oidPropertyName = "__wx_oid__" + (new Date).getTime();
	/**
	* Returns the objects unique id or assigns it if unassigned
	* @param {any} o
	*/
	function getOid(o) {
	    if (o == null)
	        return undefined;
	    var t = typeof o;
	    if (t === "boolean" || t === "number" || t === "string")
	        return (t + ":" + o);
	    // already set?
	    var result = o[oidPropertyName];
	    if (result !== undefined)
	        return result;
	    // assign new one
	    result = (oid++).toString();
	    // store as non-enumerable property to avoid confusing other libraries
	    Object.defineProperty(o, oidPropertyName, {
	        enumerable: false,
	        configurable: false,
	        writable: false,
	        value: result
	    });
	    return result;
	}
	exports.getOid = getOid;
	//# sourceMappingURL=Oid.js.map

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var Utils_1 = __webpack_require__(1);
	var Oid_1 = __webpack_require__(8);
	var IID_1 = __webpack_require__(3);
	var Lazy_1 = __webpack_require__(10);
	var ScheduledSubject_1 = __webpack_require__(11);
	var Events_1 = __webpack_require__(2);
	var RefCountDisposeWrapper_1 = __webpack_require__(12);
	var log = __webpack_require__(13);
	var Injector_1 = __webpack_require__(6);
	var res = __webpack_require__(7);
	var ListPaged_1 = __webpack_require__(14);
	"use strict";
	/**
	* ReactiveUI's awesome ReactiveList ported to Typescript
	* @class
	*/
	var ObservableList = (function () {
	    function ObservableList(initialContents, resetChangeThreshold, scheduler) {
	        if (resetChangeThreshold === void 0) { resetChangeThreshold = 0.3; }
	        if (scheduler === void 0) { scheduler = null; }
	        //////////////////////////
	        // Some array convenience members
	        this.push = this.add;
	        this.changeNotificationsSuppressed = 0;
	        this.propertyChangeWatchers = null;
	        this.resetChangeThreshold = 0;
	        this.resetSubCount = 0;
	        this.hasWhinedAboutNoResetSub = false;
	        this.readonlyExceptionMessage = "Derived collections cannot be modified.";
	        this.disposables = new Rx.CompositeDisposable();
	        this.app = Injector_1.injector.get(res.app);
	        this.setupRx(initialContents, resetChangeThreshold, scheduler);
	    }
	    //////////////////////////////////
	    // IUnknown implementation
	    ObservableList.prototype.queryInterface = function (iid) {
	        return iid === IID_1.default.IObservableList || iid === IID_1.default.IDisposable;
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    ObservableList.prototype.dispose = function () {
	        this.clearAllPropertyChangeWatchers();
	        this.disposables.dispose();
	    };
	    Object.defineProperty(ObservableList.prototype, "itemsAdded", {
	        ////////////////////
	        /// IObservableList<T>
	        get: function () {
	            if (!this._itemsAdded)
	                this._itemsAdded = this.itemsAddedSubject.value.asObservable();
	            return this._itemsAdded;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "beforeItemsAdded", {
	        get: function () {
	            if (!this._beforeItemsAdded)
	                this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();
	            return this._beforeItemsAdded;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "itemsRemoved", {
	        get: function () {
	            if (!this._itemsRemoved)
	                this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();
	            return this._itemsRemoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "beforeItemsRemoved", {
	        get: function () {
	            if (!this._beforeItemsRemoved)
	                this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();
	            return this._beforeItemsRemoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "itemReplaced", {
	        get: function () {
	            if (!this._itemReplaced)
	                this._itemReplaced = this.itemReplacedSubject.value.asObservable();
	            return this._itemReplaced;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "beforeItemReplaced", {
	        get: function () {
	            if (!this._beforeItemReplaced)
	                this._beforeItemReplaced = this.beforeItemReplacedSubject.value.asObservable();
	            return this._beforeItemReplaced;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "beforeItemsMoved", {
	        get: function () {
	            if (!this._beforeItemsMoved)
	                this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();
	            return this._beforeItemsMoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "itemsMoved", {
	        get: function () {
	            if (!this._itemsMoved)
	                this._itemsMoved = this.itemsMovedSubject.value.asObservable();
	            return this._itemsMoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "lengthChanging", {
	        get: function () {
	            var _this = this;
	            if (!this._lengthChanging)
	                this._lengthChanging = this.listChanging.select(function (_) {
	                    return _this.inner.length;
	                }).distinctUntilChanged();
	            return this._lengthChanging;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "lengthChanged", {
	        get: function () {
	            var _this = this;
	            if (!this._lengthChanged)
	                this._lengthChanged = this.listChanged.select(function (_) {
	                    return _this.inner.length;
	                }).distinctUntilChanged();
	            return this._lengthChanged;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "itemChanging", {
	        get: function () {
	            if (!this._itemChanging)
	                this._itemChanging = this.itemChangingSubject.value.asObservable();
	            return this._itemChanging;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "itemChanged", {
	        get: function () {
	            if (!this._itemChanged)
	                this._itemChanged = this.itemChangedSubject.value.asObservable();
	            return this._itemChanged;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "shouldReset", {
	        get: function () {
	            var _this = this;
	            return this.refcountSubscribers(this.listChanged.selectMany(function (x) { return !x ? Rx.Observable.empty() :
	                Rx.Observable.return(null); }), function (x) { return _this.resetSubCount += x; });
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "changeTrackingEnabled", {
	        get: function () {
	            return this.propertyChangeWatchers != null;
	        },
	        set: function (newValue) {
	            var _this = this;
	            if (this.propertyChangeWatchers != null && newValue)
	                return;
	            if (this.propertyChangeWatchers == null && !newValue)
	                return;
	            if (newValue) {
	                this.propertyChangeWatchers = {};
	                this.inner.forEach(function (x) { return _this.addItemToPropertyTracking(x); });
	            }
	            else {
	                this.clearAllPropertyChangeWatchers();
	                this.propertyChangeWatchers = null;
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ObservableList.prototype, "isReadOnly", {
	        get: function () {
	            return false;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ObservableList.prototype.addRange = function (items) {
	        var _this = this;
	        if (items == null) {
	            Utils_1.throwError("items");
	        }
	        var disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
	        Utils_1.using(disp, function () {
	            // reset notification
	            if (!_this.areChangeNotificationsEnabled()) {
	                // this._inner.splice(this._inner.length, 0, items)
	                Array.prototype.push.apply(_this.inner, items);
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.addItemToPropertyTracking(x);
	                    });
	                }
	            }
	            else {
	                var from = _this.inner.length; // need to capture this before "inner" gets modified
	                if (_this.beforeItemsAddedSubject.isValueCreated) {
	                    _this.beforeItemsAddedSubject.value.onNext({ items: items, from: from });
	                }
	                Array.prototype.push.apply(_this.inner, items);
	                if (_this.itemsAddedSubject.isValueCreated) {
	                    _this.itemsAddedSubject.value.onNext({ items: items, from: from });
	                }
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.addItemToPropertyTracking(x);
	                    });
	                }
	            }
	        });
	    };
	    ObservableList.prototype.insertRange = function (index, items) {
	        var _this = this;
	        if (items == null) {
	            Utils_1.throwError("collection");
	        }
	        if (index > this.inner.length) {
	            Utils_1.throwError("index");
	        }
	        var disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
	        Utils_1.using(disp, function () {
	            // reset notification
	            if (!_this.areChangeNotificationsEnabled()) {
	                // this._inner.splice(index, 0, items)
	                Array.prototype.splice.apply(_this.inner, [index, 0].concat(items));
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.addItemToPropertyTracking(x);
	                    });
	                }
	            }
	            else {
	                if (_this.beforeItemsAddedSubject.isValueCreated) {
	                    _this.beforeItemsAddedSubject.value.onNext({ items: items, from: index });
	                }
	                Array.prototype.splice.apply(_this.inner, [index, 0].concat(items));
	                if (_this.itemsAddedSubject.isValueCreated) {
	                    _this.itemsAddedSubject.value.onNext({ items: items, from: index });
	                }
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.addItemToPropertyTracking(x);
	                    });
	                }
	            }
	        });
	    };
	    ObservableList.prototype.removeAll = function (itemsOrSelector) {
	        var _this = this;
	        if (itemsOrSelector == null) {
	            Utils_1.throwError("items");
	        }
	        var items = Array.isArray(itemsOrSelector) ? itemsOrSelector : this.inner.filter(itemsOrSelector);
	        var disp = this.isLengthAboveResetThreshold(items.length) ?
	            this.suppressChangeNotifications() : Rx.Disposable.empty;
	        Utils_1.using(disp, function () {
	            // NB: If we don't do this, we'll break Collection<T>'s
	            // accounting of the length
	            items.forEach(function (x) { return _this.remove(x); });
	        });
	        return items;
	    };
	    ObservableList.prototype.removeRange = function (index, count) {
	        var _this = this;
	        var disp = this.isLengthAboveResetThreshold(count) ? this.suppressChangeNotifications() : Rx.Disposable.empty;
	        Utils_1.using(disp, function () {
	            // construct items
	            var items = _this.inner.slice(index, index + count);
	            // reset notification
	            if (!_this.areChangeNotificationsEnabled()) {
	                _this.inner.splice(index, count);
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.removeItemFromPropertyTracking(x);
	                    });
	                }
	            }
	            else {
	                if (_this.beforeItemsRemovedSubject.isValueCreated) {
	                    _this.beforeItemsRemovedSubject.value.onNext({ items: items, from: index });
	                }
	                _this.inner.splice(index, count);
	                if (_this.changeTrackingEnabled) {
	                    items.forEach(function (x) {
	                        _this.removeItemFromPropertyTracking(x);
	                    });
	                }
	                if (_this.itemsRemovedSubject.isValueCreated) {
	                    _this.itemsRemovedSubject.value.onNext({ items: items, from: index });
	                }
	            }
	        });
	    };
	    ObservableList.prototype.toArray = function () {
	        return this.inner;
	    };
	    ObservableList.prototype.reset = function (contents) {
	        var _this = this;
	        if (contents == null) {
	            this.publishResetNotification();
	        }
	        else {
	            Utils_1.using(this.suppressChangeNotifications(), function (suppress) {
	                _this.clear();
	                _this.addRange(contents);
	            });
	        }
	    };
	    ObservableList.prototype.add = function (item) {
	        this.insertItem(this.inner.length, item);
	    };
	    ObservableList.prototype.clear = function () {
	        this.clearItems();
	    };
	    ObservableList.prototype.contains = function (item) {
	        return this.inner.indexOf(item) !== -1;
	    };
	    ObservableList.prototype.remove = function (item) {
	        var index = this.inner.indexOf(item);
	        if (index === -1)
	            return false;
	        this.removeItem(index);
	        return true;
	    };
	    ObservableList.prototype.indexOf = function (item) {
	        return this.inner.indexOf(item);
	    };
	    ObservableList.prototype.insert = function (index, item) {
	        this.insertItem(index, item);
	    };
	    ObservableList.prototype.removeAt = function (index) {
	        this.removeItem(index);
	    };
	    ObservableList.prototype.move = function (oldIndex, newIndex) {
	        this.moveItem(oldIndex, newIndex);
	    };
	    ObservableList.prototype.project = function () {
	        var args = Utils_1.args2Array(arguments);
	        var filter = args.shift();
	        if (filter != null && Utils_1.isRxObservable(filter)) {
	            return new ObservableListProjection(this, undefined, undefined, undefined, filter, args.shift());
	        }
	        var orderer = args.shift();
	        if (orderer != null && Utils_1.isRxObservable(orderer)) {
	            return new ObservableListProjection(this, filter, undefined, undefined, orderer, args.shift());
	        }
	        var selector = args.shift();
	        if (selector != null && Utils_1.isRxObservable(selector)) {
	            return new ObservableListProjection(this, filter, orderer, undefined, selector, args.shift());
	        }
	        return new ObservableListProjection(this, filter, orderer, selector, args.shift(), args.shift());
	    };
	    ObservableList.prototype.page = function (pageSize, currentPage, scheduler) {
	        return new ListPaged_1.PagedObservableListProjection(this, pageSize, currentPage, scheduler);
	    };
	    ObservableList.prototype.suppressChangeNotifications = function () {
	        var _this = this;
	        this.changeNotificationsSuppressed++;
	        if (!this.hasWhinedAboutNoResetSub && this.resetSubCount === 0 && !Utils_1.isInUnitTest()) {
	            log.hint("suppressChangeNotifications was called (perhaps via addRange), yet you do not have a subscription to shouldReset. This probably isn't what you want, as itemsAdded and friends will appear to 'miss' items");
	            this.hasWhinedAboutNoResetSub = true;
	        }
	        return Rx.Disposable.create(function () {
	            _this.changeNotificationsSuppressed--;
	            if (_this.changeNotificationsSuppressed === 0) {
	                _this.publishBeforeResetNotification();
	                _this.publishResetNotification();
	            }
	        });
	    };
	    ObservableList.prototype.get = function (index) {
	        return this.inner[index];
	    };
	    ObservableList.prototype.set = function (index, item) {
	        if (!this.areChangeNotificationsEnabled()) {
	            if (this.changeTrackingEnabled) {
	                this.removeItemFromPropertyTracking(this.inner[index]);
	                this.addItemToPropertyTracking(item);
	            }
	            this.inner[index] = item;
	            return;
	        }
	        if (this.beforeItemReplacedSubject.isValueCreated)
	            this.beforeItemReplacedSubject.value.onNext({ from: index, items: [item] });
	        if (this.changeTrackingEnabled) {
	            this.removeItemFromPropertyTracking(this.inner[index]);
	            this.addItemToPropertyTracking(item);
	        }
	        this.inner[index] = item;
	        if (this.itemReplacedSubject.isValueCreated)
	            this.itemReplacedSubject.value.onNext({ from: index, items: [item] });
	    };
	    ObservableList.prototype.sort = function (comparison) {
	        this.publishBeforeResetNotification();
	        this.inner.sort(comparison);
	        this.publishResetNotification();
	    };
	    ObservableList.prototype.forEach = function (callbackfn, thisArg) {
	        this.inner.forEach(callbackfn, thisArg);
	    };
	    ObservableList.prototype.map = function (callbackfn, thisArg) {
	        return this.inner.map(callbackfn, thisArg);
	    };
	    ObservableList.prototype.filter = function (callbackfn, thisArg) {
	        return this.inner.filter(callbackfn, thisArg);
	    };
	    ObservableList.prototype.some = function (callbackfn, thisArg) {
	        return this.inner.some(callbackfn, thisArg);
	    };
	    ObservableList.prototype.every = function (callbackfn, thisArg) {
	        return this.inner.every(callbackfn, thisArg);
	    };
	    ObservableList.prototype.setupRx = function (initialContents, resetChangeThreshold, scheduler) {
	        if (resetChangeThreshold === void 0) { resetChangeThreshold = 0.3; }
	        if (scheduler === void 0) { scheduler = null; }
	        scheduler = scheduler || Injector_1.injector.get(res.app).mainThreadScheduler;
	        this.resetChangeThreshold = resetChangeThreshold;
	        if (this.inner === undefined)
	            this.inner = new Array();
	        this.beforeItemsAddedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsAddedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.beforeItemsRemovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsRemovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.beforeItemReplacedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemReplacedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.resetSubject = new Rx.Subject();
	        this.beforeResetSubject = new Rx.Subject();
	        this.itemChangingSubject = new Lazy_1.default(function () {
	            return ScheduledSubject_1.createScheduledSubject(scheduler);
	        });
	        this.itemChangedSubject = new Lazy_1.default(function () {
	            return ScheduledSubject_1.createScheduledSubject(scheduler);
	        });
	        this.beforeItemsMovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsMovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.listChanged = Rx.Observable.merge(this.itemsAdded.select(function (x) { return false; }), this.itemsRemoved.select(function (x) { return false; }), this.itemReplaced.select(function (x) { return false; }), this.itemsMoved.select(function (x) { return false; }), this.resetSubject.select(function (x) { return true; }))
	            .publish()
	            .refCount();
	        this.listChanging = Rx.Observable.merge(this.beforeItemsAdded.select(function (x) { return false; }), this.beforeItemsRemoved.select(function (x) { return false; }), this.beforeItemReplaced.select(function (x) { return false; }), this.beforeItemsMoved.select(function (x) { return false; }), this.beforeResetSubject.select(function (x) { return true; }))
	            .publish()
	            .refCount();
	        if (initialContents) {
	            Array.prototype.splice.apply(this.inner, [0, 0].concat(initialContents));
	        }
	        this.length = this.lengthChanged.toProperty(this.inner.length);
	        this.disposables.add(this.length);
	        this.isEmpty = this.lengthChanged
	            .select(function (x) { return (x === 0); })
	            .toProperty(this.inner.length === 0);
	        this.disposables.add(this.isEmpty);
	    };
	    ObservableList.prototype.areChangeNotificationsEnabled = function () {
	        return this.changeNotificationsSuppressed === 0;
	    };
	    ObservableList.prototype.insertItem = function (index, item) {
	        if (!this.areChangeNotificationsEnabled()) {
	            this.inner.splice(index, 0, item);
	            if (this.changeTrackingEnabled)
	                this.addItemToPropertyTracking(item);
	            return;
	        }
	        if (this.beforeItemsAddedSubject.isValueCreated)
	            this.beforeItemsAddedSubject.value.onNext({ items: [item], from: index });
	        this.inner.splice(index, 0, item);
	        if (this.itemsAddedSubject.isValueCreated)
	            this.itemsAddedSubject.value.onNext({ items: [item], from: index });
	        if (this.changeTrackingEnabled)
	            this.addItemToPropertyTracking(item);
	    };
	    ObservableList.prototype.removeItem = function (index) {
	        var item = this.inner[index];
	        if (!this.areChangeNotificationsEnabled()) {
	            this.inner.splice(index, 1);
	            if (this.changeTrackingEnabled)
	                this.removeItemFromPropertyTracking(item);
	            return;
	        }
	        if (this.beforeItemsRemovedSubject.isValueCreated)
	            this.beforeItemsRemovedSubject.value.onNext({ items: [item], from: index });
	        this.inner.splice(index, 1);
	        if (this.itemsRemovedSubject.isValueCreated)
	            this.itemsRemovedSubject.value.onNext({ items: [item], from: index });
	        if (this.changeTrackingEnabled)
	            this.removeItemFromPropertyTracking(item);
	    };
	    ObservableList.prototype.moveItem = function (oldIndex, newIndex) {
	        var item = this.inner[oldIndex];
	        if (!this.areChangeNotificationsEnabled()) {
	            this.inner.splice(oldIndex, 1);
	            this.inner.splice(newIndex, 0, item);
	            return;
	        }
	        var mi = { items: [item], from: oldIndex, to: newIndex };
	        if (this.beforeItemsMovedSubject.isValueCreated)
	            this.beforeItemsMovedSubject.value.onNext(mi);
	        this.inner.splice(oldIndex, 1);
	        this.inner.splice(newIndex, 0, item);
	        if (this.itemsMovedSubject.isValueCreated)
	            this.itemsMovedSubject.value.onNext(mi);
	    };
	    ObservableList.prototype.clearItems = function () {
	        if (!this.areChangeNotificationsEnabled()) {
	            this.inner.length = 0; // see http://stackoverflow.com/a/1232046/88513
	            if (this.changeTrackingEnabled)
	                this.clearAllPropertyChangeWatchers();
	            return;
	        }
	        this.publishBeforeResetNotification();
	        this.inner.length = 0; // see http://stackoverflow.com/a/1232046/88513
	        this.publishResetNotification();
	        if (this.changeTrackingEnabled)
	            this.clearAllPropertyChangeWatchers();
	    };
	    ObservableList.prototype.addItemToPropertyTracking = function (toTrack) {
	        var rcd = this.propertyChangeWatchers[Oid_1.getOid(toTrack)];
	        var self = this;
	        if (rcd) {
	            rcd.addRef();
	            return;
	        }
	        var changing = Utils_1.observeObject(toTrack, this.app.defaultExceptionHandler, true)
	            .select(function (i) { return new Events_1.PropertyChangedEventArgs(toTrack, i.propertyName); });
	        var changed = Utils_1.observeObject(toTrack, this.app.defaultExceptionHandler, false)
	            .select(function (i) { return new Events_1.PropertyChangedEventArgs(toTrack, i.propertyName); });
	        var disp = new Rx.CompositeDisposable(changing.where(function (_) { return self.areChangeNotificationsEnabled(); }).subscribe(function (x) { return self.itemChangingSubject.value.onNext(x); }), changed.where(function (_) { return self.areChangeNotificationsEnabled(); }).subscribe(function (x) { return self.itemChangedSubject.value.onNext(x); }));
	        this.propertyChangeWatchers[Oid_1.getOid(toTrack)] = new RefCountDisposeWrapper_1.default(Rx.Disposable.create(function () {
	            disp.dispose();
	            delete self.propertyChangeWatchers[Oid_1.getOid(toTrack)];
	        }));
	    };
	    ObservableList.prototype.removeItemFromPropertyTracking = function (toUntrack) {
	        var rcd = this.propertyChangeWatchers[Oid_1.getOid(toUntrack)];
	        if (rcd) {
	            rcd.release();
	        }
	    };
	    ObservableList.prototype.clearAllPropertyChangeWatchers = function () {
	        var _this = this;
	        if (this.propertyChangeWatchers != null) {
	            Object.keys(this.propertyChangeWatchers).forEach(function (x) {
	                _this.propertyChangeWatchers[x].release();
	            });
	            this.propertyChangeWatchers = null;
	        }
	    };
	    ObservableList.prototype.refcountSubscribers = function (input, block) {
	        return Rx.Observable.create(function (subj) {
	            block(1);
	            return new Rx.CompositeDisposable(input.subscribe(subj), Rx.Disposable.create(function () { return block(-1); }));
	        });
	    };
	    ObservableList.prototype.publishResetNotification = function () {
	        this.resetSubject.onNext(true);
	    };
	    ObservableList.prototype.publishBeforeResetNotification = function () {
	        this.beforeResetSubject.onNext(true);
	    };
	    ObservableList.prototype.isLengthAboveResetThreshold = function (toChangeLength) {
	        return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
	    };
	    return ObservableList;
	}());
	exports.ObservableList = ObservableList;
	/**
	* Creates a new observable list with optional default contents
	* @param {Array<T>} initialContents The initial contents of the list
	* @param {number = 0.3} resetChangeThreshold
	*/
	function list(initialContents, resetChangeThreshold, scheduler) {
	    if (resetChangeThreshold === void 0) { resetChangeThreshold = 0.3; }
	    if (scheduler === void 0) { scheduler = null; }
	    return new ObservableList(initialContents, resetChangeThreshold, scheduler);
	}
	exports.list = list;
	var ObservableListProjection = (function (_super) {
	    __extends(ObservableListProjection, _super);
	    function ObservableListProjection(source, filter, orderer, selector, refreshTrigger, scheduler) {
	        _super.call(this);
	        // This list maps indices in this collection to their corresponding indices in the source collection.
	        this.indexToSourceIndexMap = [];
	        this.sourceCopy = [];
	        this.disp = new Rx.CompositeDisposable();
	        this.source = source;
	        this.selector = selector || (function (x) { return x; });
	        this._filter = filter;
	        this.orderer = orderer;
	        this.refreshTrigger = refreshTrigger;
	        this.scheduler = scheduler || Rx.Scheduler.immediate;
	        this.addAllItemsFromSourceCollection();
	        this.wireUpChangeNotifications();
	    }
	    Object.defineProperty(ObservableListProjection.prototype, "isReadOnly", {
	        //////////////////////////////////
	        // ObservableList overrides to enforce readonly contract
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ObservableListProjection.prototype.set = function (index, item) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.addRange = function (items) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.insertRange = function (index, items) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.removeAll = function (itemsOrSelector) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	        return undefined;
	    };
	    ObservableListProjection.prototype.removeRange = function (index, count) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.add = function (item) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.clear = function () {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.remove = function (item) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	        return undefined;
	    };
	    ObservableListProjection.prototype.insert = function (index, item) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.removeAt = function (index) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.move = function (oldIndex, newIndex) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.sort = function (comparison) {
	        Utils_1.throwError(this.readonlyExceptionMessage);
	    };
	    ObservableListProjection.prototype.reset = function () {
	        var _this = this;
	        Utils_1.using(_super.prototype.suppressChangeNotifications.call(this), function () {
	            _super.prototype.clear.call(_this);
	            _this.indexToSourceIndexMap = [];
	            _this.sourceCopy = [];
	            _this.addAllItemsFromSourceCollection();
	        });
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    ObservableListProjection.prototype.dispose = function () {
	        this.disp.dispose();
	        _super.prototype.dispose.call(this);
	    };
	    ObservableListProjection.prototype.referenceEquals = function (a, b) {
	        return Oid_1.getOid(a) === Oid_1.getOid(b);
	    };
	    ObservableListProjection.prototype.refresh = function () {
	        var length = this.sourceCopy.length;
	        var sourceCopyIds = this.sourceCopy.map(function (x) { return Oid_1.getOid(x); });
	        for (var i = 0; i < length; i++) {
	            this.onItemChanged(this.sourceCopy[i], sourceCopyIds);
	        }
	    };
	    ObservableListProjection.prototype.wireUpChangeNotifications = function () {
	        var _this = this;
	        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsAdded(e);
	        }));
	        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsRemoved(e);
	        }));
	        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsMoved(e);
	        }));
	        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsReplaced(e);
	        }));
	        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe(function (e) {
	            _this.reset();
	        }));
	        this.disp.add(this.source.itemChanged.select(function (x) { return x.sender; })
	            .observeOn(this.scheduler)
	            .subscribe(function (x) { return _this.onItemChanged(x); }));
	        if (this.refreshTrigger != null) {
	            this.disp.add(this.refreshTrigger.observeOn(this.scheduler).subscribe(function (_) { return _this.refresh(); }));
	        }
	    };
	    ObservableListProjection.prototype.onItemsAdded = function (e) {
	        this.shiftIndicesAtOrOverThreshold(e.from, e.items.length);
	        for (var i = 0; i < e.items.length; i++) {
	            var sourceItem = e.items[i];
	            this.sourceCopy.splice(e.from + i, 0, sourceItem);
	            if (this._filter && !this._filter(sourceItem)) {
	                continue;
	            }
	            var destinationItem = this.selector(sourceItem);
	            this.insertAndMap(e.from + i, destinationItem);
	        }
	    };
	    ObservableListProjection.prototype.onItemsRemoved = function (e) {
	        this.sourceCopy.splice(e.from, e.items.length);
	        for (var i = 0; i < e.items.length; i++) {
	            var destinationIndex = this.getIndexFromSourceIndex(e.from + i);
	            if (destinationIndex !== -1) {
	                this.removeAtInternal(destinationIndex);
	            }
	        }
	        var removedCount = e.items.length;
	        this.shiftIndicesAtOrOverThreshold(e.from + removedCount, -removedCount);
	    };
	    ObservableListProjection.prototype.onItemsMoved = function (e) {
	        if (e.items.length > 1) {
	            Utils_1.throwError("Derived collections doesn't support multi-item moves");
	        }
	        if (e.from === e.to) {
	            return;
	        }
	        var oldSourceIndex = e.from;
	        var newSourceIndex = e.to;
	        this.sourceCopy.splice(oldSourceIndex, 1);
	        this.sourceCopy.splice(newSourceIndex, 0, e.items[0]);
	        var currentDestinationIndex = this.getIndexFromSourceIndex(oldSourceIndex);
	        this.moveSourceIndexInMap(oldSourceIndex, newSourceIndex);
	        if (currentDestinationIndex === -1) {
	            return;
	        }
	        if (this.orderer == null) {
	            // We mirror the order of the source collection so we'll perform the same move operation
	            // as the source. As is the case with when we have an orderer we don't test whether or not
	            // the item should be included or not here. If it has been included at some point it'll
	            // stay included until onItemChanged picks up a change which filters it.
	            var newDestinationIndex = ObservableListProjection.newPositionForExistingItem2(this.indexToSourceIndexMap, newSourceIndex, currentDestinationIndex);
	            if (newDestinationIndex !== currentDestinationIndex) {
	                this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
	                this.indexToSourceIndexMap.splice(newDestinationIndex, 0, newSourceIndex);
	                _super.prototype.move.call(this, currentDestinationIndex, newDestinationIndex);
	            }
	            else {
	                this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
	            }
	        }
	        else {
	            // TODO: Conceptually I feel like we shouldn't concern ourselves with ordering when we
	            // receive a Move notification. If it affects ordering it should be picked up by the
	            // onItemChange and resorted there instead.
	            this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
	        }
	    };
	    ObservableListProjection.prototype.onItemsReplaced = function (e) {
	        var sourceOids = this.isLengthAboveResetThreshold(e.items.length) ?
	            this.sourceCopy.map(function (x) { return Oid_1.getOid(x); }) :
	            null;
	        for (var i = 0; i < e.items.length; i++) {
	            var sourceItem = e.items[i];
	            this.sourceCopy[e.from + i] = sourceItem;
	            if (sourceOids)
	                sourceOids[e.from + i] = Oid_1.getOid(sourceItem);
	            this.onItemChanged(sourceItem, sourceOids);
	        }
	    };
	    ObservableListProjection.prototype.onItemChanged = function (changedItem, sourceOids) {
	        var sourceIndices = this.indexOfAll(this.sourceCopy, changedItem, sourceOids);
	        var shouldBeIncluded = !this._filter || this._filter(changedItem);
	        var sourceIndicesLength = sourceIndices.length;
	        for (var i = 0; i < sourceIndicesLength; i++) {
	            var sourceIndex = sourceIndices[i];
	            var currentDestinationIndex = this.getIndexFromSourceIndex(sourceIndex);
	            var isIncluded = currentDestinationIndex >= 0;
	            if (isIncluded && !shouldBeIncluded) {
	                this.removeAtInternal(currentDestinationIndex);
	            }
	            else if (!isIncluded && shouldBeIncluded) {
	                this.insertAndMap(sourceIndex, this.selector(changedItem));
	            }
	            else if (isIncluded && shouldBeIncluded) {
	                // The item is already included and it should stay there but it's possible that the change that
	                // caused this event affects the ordering. This gets a little tricky so let's be verbose.
	                var newItem = this.selector(changedItem);
	                if (this.orderer == null) {
	                    // We don't have an orderer so we're currently using the source collection index for sorting
	                    // meaning that no item change will affect ordering. Look at our current item and see if it's
	                    // the exact (reference-wise) same object. If it is then we're done, if it's not (for example
	                    // if it's an integer) we'll issue a replace event so that subscribers get the new value.
	                    if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
	                        _super.prototype.set.call(this, currentDestinationIndex, newItem);
	                    }
	                }
	                else {
	                    // Don't be tempted to just use the orderer to compare the new item with the previous since
	                    // they'll almost certainly be equal (for reference types). We need to test whether or not the
	                    // new item can stay in the same position that the current item is in without comparing them.
	                    if (this.canItemStayAtPosition(newItem, currentDestinationIndex)) {
	                        // The new item should be in the same position as the current but there's no need to signal
	                        // that in case they are the same object.
	                        if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
	                            _super.prototype.set.call(this, currentDestinationIndex, newItem);
	                        }
	                    }
	                    else {
	                        // The change is forcing us to reorder. We'll use a move operation if the item hasn't
	                        // changed (ie it's the same object) and we'll implement it as a remove and add if the
	                        // object has changed (ie the selector is not an identity function).
	                        if (this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
	                            var newDestinationIndex = this.newPositionForExistingItem(sourceIndex, currentDestinationIndex, newItem);
	                            // Debug.Assert(newDestinationIndex != currentDestinationIndex, "This can't be, canItemStayAtPosition said it this couldn't happen");
	                            this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
	                            this.indexToSourceIndexMap.splice(newDestinationIndex, 0, sourceIndex);
	                            _super.prototype.move.call(this, currentDestinationIndex, newDestinationIndex);
	                        }
	                        else {
	                            this.removeAtInternal(currentDestinationIndex);
	                            this.insertAndMap(sourceIndex, newItem);
	                        }
	                    }
	                }
	            }
	        }
	    };
	    /// <summary>
	    /// Gets a value indicating whether or not the item fits (sort-wise) at the provided index. The determination
	    /// is made by checking whether or not it's considered larger than or equal to the preceeding item and if
	    /// it's less than or equal to the succeeding item.
	    /// </summary>
	    ObservableListProjection.prototype.canItemStayAtPosition = function (item, currentIndex) {
	        var hasPrecedingItem = currentIndex > 0;
	        if (hasPrecedingItem) {
	            var isGreaterThanOrEqualToPrecedingItem = this.orderer(item, this.get(currentIndex - 1)) >= 0;
	            if (!isGreaterThanOrEqualToPrecedingItem) {
	                return false;
	            }
	        }
	        var hasSucceedingItem = currentIndex < this.length() - 1;
	        if (hasSucceedingItem) {
	            var isLessThanOrEqualToSucceedingItem = this.orderer(item, this.get(currentIndex + 1)) <= 0;
	            if (!isLessThanOrEqualToSucceedingItem) {
	                return false;
	            }
	        }
	        return true;
	    };
	    /// <summary>
	    /// Gets the index of the dervived item super. on it's originating element index in the source collection.
	    /// </summary>
	    ObservableListProjection.prototype.getIndexFromSourceIndex = function (sourceIndex) {
	        return this.indexToSourceIndexMap.indexOf(sourceIndex);
	    };
	    /// <summary>
	    /// Returns one or more positions in the source collection where the given item is found in source collection
	    /// </summary>
	    ObservableListProjection.prototype.indexOfAll = function (source, item, sourceOids) {
	        var indices = [];
	        var sourceIndex = 0;
	        var sourceLength = source.length;
	        if (sourceOids) {
	            var itemOid = Oid_1.getOid(item);
	            for (var i = 0; i < sourceLength; i++) {
	                var oid = sourceOids[i];
	                if (itemOid === oid) {
	                    indices.push(sourceIndex);
	                }
	                sourceIndex++;
	            }
	        }
	        else {
	            for (var i = 0; i < sourceLength; i++) {
	                var x = source[i];
	                if (this.referenceEquals(x, item)) {
	                    indices.push(sourceIndex);
	                }
	                sourceIndex++;
	            }
	        }
	        return indices;
	    };
	    /// <summary>
	    /// Increases (or decreases depending on move direction) all source indices between the source and destination
	    /// move indices.
	    /// </summary>
	    ObservableListProjection.prototype.moveSourceIndexInMap = function (oldSourceIndex, newSourceIndex) {
	        if (newSourceIndex > oldSourceIndex) {
	            // Item is moving towards the end of the list, everything between its current position and its
	            // new position needs to be shifted down one index
	            this.shiftSourceIndicesInRange(oldSourceIndex + 1, newSourceIndex + 1, -1);
	        }
	        else {
	            // Item is moving towards the front of the list, everything between its current position and its
	            // new position needs to be shifted up one index
	            this.shiftSourceIndicesInRange(newSourceIndex, oldSourceIndex, 1);
	        }
	    };
	    /// <summary>
	    /// Increases (or decreases) all source indices equal to or higher than the threshold. Represents an
	    /// insert or remove of one or more items in the source list thus causing all subsequent items to shift
	    /// up or down.
	    /// </summary>
	    ObservableListProjection.prototype.shiftIndicesAtOrOverThreshold = function (threshold, value) {
	        for (var i = 0; i < this.indexToSourceIndexMap.length; i++) {
	            if (this.indexToSourceIndexMap[i] >= threshold) {
	                this.indexToSourceIndexMap[i] += value;
	            }
	        }
	    };
	    /// <summary>
	    /// Increases (or decreases) all source indices within the range (lower inclusive, upper exclusive).
	    /// </summary>
	    ObservableListProjection.prototype.shiftSourceIndicesInRange = function (rangeStart, rangeStop, value) {
	        for (var i = 0; i < this.indexToSourceIndexMap.length; i++) {
	            var sourceIndex = this.indexToSourceIndexMap[i];
	            if (sourceIndex >= rangeStart && sourceIndex < rangeStop) {
	                this.indexToSourceIndexMap[i] += value;
	            }
	        }
	    };
	    ObservableListProjection.prototype.addAllItemsFromSourceCollection = function () {
	        // Debug.Assert(sourceCopy.length == 0, "Expected source copy to be empty");
	        var sourceIndex = 0;
	        var length = this.source.length();
	        for (var i = 0; i < length; i++) {
	            var sourceItem = this.source.get(i);
	            this.sourceCopy.push(sourceItem);
	            if (!this._filter || this._filter(sourceItem)) {
	                var destinationItem = this.selector(sourceItem);
	                this.insertAndMap(sourceIndex, destinationItem);
	            }
	            sourceIndex++;
	        }
	    };
	    ObservableListProjection.prototype.insertAndMap = function (sourceIndex, value) {
	        var destinationIndex = this.positionForNewItem(sourceIndex, value);
	        this.indexToSourceIndexMap.splice(destinationIndex, 0, sourceIndex);
	        _super.prototype.insert.call(this, destinationIndex, value);
	    };
	    ObservableListProjection.prototype.removeAtInternal = function (destinationIndex) {
	        this.indexToSourceIndexMap.splice(destinationIndex, 1);
	        _super.prototype.removeAt.call(this, destinationIndex);
	    };
	    ObservableListProjection.prototype.positionForNewItem = function (sourceIndex, value) {
	        // If we haven't got an orderer we'll simply match our items to that of the source collection.
	        return this.orderer == null
	            ? ObservableListProjection.positionForNewItemArray(this.indexToSourceIndexMap, sourceIndex, ObservableListProjection.defaultOrderer)
	            : ObservableListProjection.positionForNewItemArray2(this.inner, 0, this.inner.length, value, this.orderer);
	    };
	    ObservableListProjection.positionForNewItemArray = function (array, item, orderer) {
	        return ObservableListProjection.positionForNewItemArray2(array, 0, array.length, item, orderer);
	    };
	    ObservableListProjection.positionForNewItemArray2 = function (array, index, count, item, orderer) {
	        // Debug.Assert(index >= 0);
	        // Debug.Assert(count >= 0);
	        // Debug.Assert((list.length - index) >= count);
	        if (count === 0) {
	            return index;
	        }
	        if (count === 1) {
	            return orderer(array[index], item) >= 0 ? index : index + 1;
	        }
	        if (orderer(array[index], item) >= 1)
	            return index;
	        var low = index, hi = index + count - 1;
	        var cmp;
	        while (low <= hi) {
	            var mid = Math.floor(low + (hi - low) / 2);
	            cmp = orderer(array[mid], item);
	            if (cmp === 0) {
	                return mid;
	            }
	            if (cmp < 0) {
	                low = mid + 1;
	            }
	            else {
	                hi = mid - 1;
	            }
	        }
	        return low;
	    };
	    /// <summary>
	    /// Calculates a new destination for an updated item that's already in the list.
	    /// </summary>
	    ObservableListProjection.prototype.newPositionForExistingItem = function (sourceIndex, currentIndex, item) {
	        // If we haven't got an orderer we'll simply match our items to that of the source collection.
	        return this.orderer == null
	            ? ObservableListProjection.newPositionForExistingItem2(this.indexToSourceIndexMap, sourceIndex, currentIndex)
	            : ObservableListProjection.newPositionForExistingItem2(this.inner, item, currentIndex, this.orderer);
	    };
	    /// <summary>
	    /// Calculates a new destination for an updated item that's already in the list.
	    /// </summary>
	    ObservableListProjection.newPositionForExistingItem2 = function (array, item, currentIndex, orderer) {
	        // Since the item changed is most likely a value type we must refrain from ever comparing it to itself.
	        // We do this by figuring out how the updated item compares to its neighbors. By knowing if it's
	        // less than or greater than either one of its neighbors we can limit the search range to a range exlusive
	        // of the current index.
	        // Debug.Assert(list.length > 0);
	        if (array.length === 1) {
	            return 0;
	        }
	        var precedingIndex = currentIndex - 1;
	        var succeedingIndex = currentIndex + 1;
	        // The item on the preceding or succeeding index relative to currentIndex.
	        var comparand = array[precedingIndex >= 0 ? precedingIndex : succeedingIndex];
	        if (orderer == null) {
	            orderer = ObservableListProjection.defaultOrderer;
	        }
	        // Compare that to the (potentially) new value.
	        var cmp = orderer(item, comparand);
	        var min = 0;
	        var max = array.length;
	        if (cmp === 0) {
	            // The new value is equal to the preceding or succeeding item, it may stay at the current position
	            return currentIndex;
	        }
	        else if (cmp > 0) {
	            // The new value is greater than the preceding or succeeding item, limit the search to indices after
	            // the succeeding item.
	            min = succeedingIndex;
	        }
	        else {
	            // The new value is less than the preceding or succeeding item, limit the search to indices before
	            // the preceding item.
	            max = precedingIndex;
	        }
	        // Bail if the search range is invalid.
	        if (min === array.length || max < 0) {
	            return currentIndex;
	        }
	        var ix = ObservableListProjection.positionForNewItemArray2(array, min, max - min, item, orderer);
	        // If the item moves 'forward' in the collection we have to account for the index where
	        // the item currently resides getting removed first.
	        return ix >= currentIndex ? ix - 1 : ix;
	    };
	    ObservableListProjection.defaultOrderer = function (a, b) {
	        var result;
	        if (a == null && b == null)
	            result = 0;
	        else if (a == null)
	            result = -1;
	        else if (b == null)
	            result = 1;
	        else
	            result = a - b;
	        return result;
	    };
	    return ObservableListProjection;
	}(ObservableList));
	//# sourceMappingURL=List.js.map

/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	/**
	* .Net's Lazy<T>
	* @class
	*/
	var Lazy = (function () {
	    function Lazy(createValue) {
	        this.createValue = createValue;
	    }
	    Object.defineProperty(Lazy.prototype, "value", {
	        get: function () {
	            if (!this.isValueCreated) {
	                this.createdValue = this.createValue();
	                this.isValueCreated = true;
	            }
	            return this.createdValue;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Lazy;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Lazy;
	//# sourceMappingURL=Lazy.js.map

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Utils_1 = __webpack_require__(1);
	"use strict";
	var ScheduledSubject = (function () {
	    function ScheduledSubject(scheduler, defaultObserver, defaultSubject) {
	        this._observerRefCount = 0;
	        this._defaultObserverSub = Rx.Disposable.empty;
	        this._scheduler = scheduler;
	        this._defaultObserver = defaultObserver;
	        this._subject = defaultSubject || new Rx.Subject();
	        if (defaultObserver != null) {
	            this._defaultObserverSub = this._subject
	                .observeOn(this._scheduler)
	                .subscribe(this._defaultObserver);
	        }
	    }
	    ScheduledSubject.prototype.dispose = function () {
	        if (Utils_1.isDisposable(this._subject)) {
	            this._subject.dispose();
	        }
	    };
	    ScheduledSubject.prototype.onCompleted = function () {
	        this._subject.onCompleted();
	    };
	    ScheduledSubject.prototype.onError = function (error) {
	        this._subject.onError(error);
	    };
	    ScheduledSubject.prototype.onNext = function (value) {
	        this._subject.onNext(value);
	    };
	    ScheduledSubject.prototype.subscribe = function (observer) {
	        var _this = this;
	        if (this._defaultObserverSub)
	            this._defaultObserverSub.dispose();
	        this._observerRefCount++;
	        return new Rx.CompositeDisposable(this._subject.observeOn(this._scheduler).subscribe(observer), Rx.Disposable.create(function () {
	            if ((--_this._observerRefCount) <= 0 && _this._defaultObserver != null) {
	                _this._defaultObserverSub = _this._subject.observeOn(_this._scheduler).subscribe(_this._defaultObserver);
	            }
	        }));
	    };
	    return ScheduledSubject;
	}());
	function createScheduledSubject(scheduler, defaultObserver, defaultSubject) {
	    var scheduled = new ScheduledSubject(scheduler, defaultObserver, defaultSubject);
	    var result = Utils_1.extend(scheduled, new Rx.Subject(), true);
	    return result;
	}
	exports.createScheduledSubject = createScheduledSubject;
	//# sourceMappingURL=ScheduledSubject.js.map

/***/ },
/* 12 */
/***/ function(module, exports) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var RefCountDisposeWrapper = (function () {
	    function RefCountDisposeWrapper(inner, initialRefCount) {
	        if (initialRefCount === void 0) { initialRefCount = 1; }
	        this.inner = inner;
	        this.refCount = initialRefCount;
	    }
	    RefCountDisposeWrapper.prototype.addRef = function () {
	        this.refCount++;
	    };
	    RefCountDisposeWrapper.prototype.release = function () {
	        if (--this.refCount === 0) {
	            this.inner.dispose();
	            this.inner = null;
	        }
	        return this.refCount;
	    };
	    RefCountDisposeWrapper.prototype.dispose = function () {
	        this.release();
	    };
	    return RefCountDisposeWrapper;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = RefCountDisposeWrapper;
	//# sourceMappingURL=RefCountDisposeWrapper.js.map

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Utils_1 = __webpack_require__(1);
	"use strict";
	exports.hintEnable = false;
	function log() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i - 0] = arguments[_i];
	    }
	    try {
	        console.log.apply(console, arguments);
	    }
	    catch (e) {
	        try {
	            window['opera'].postError.apply(window['opera'], arguments);
	        }
	        catch (e) {
	            alert(Array.prototype.join.call(arguments, " "));
	        }
	    }
	}
	function critical(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    if (args.length) {
	        fmt = Utils_1.formatString.apply(null, [fmt].concat(args));
	    }
	    log("**** WebRx Critical: " + fmt);
	}
	exports.critical = critical;
	function error(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    if (args.length) {
	        fmt = Utils_1.formatString.apply(null, [fmt].concat(args));
	    }
	    log("*** WebRx Error: " + fmt);
	}
	exports.error = error;
	function info(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    if (args.length) {
	        fmt = Utils_1.formatString.apply(null, [fmt].concat(args));
	    }
	    log("* WebRx Info: " + fmt);
	}
	exports.info = info;
	function hint(fmt) {
	    var args = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        args[_i - 1] = arguments[_i];
	    }
	    if (!exports.hintEnable)
	        return;
	    if (args.length) {
	        fmt = Utils_1.formatString.apply(null, [fmt].concat(args));
	    }
	    log("* WebRx Hint: " + fmt);
	}
	exports.hint = hint;
	//# sourceMappingURL=Log.js.map

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var Utils_1 = __webpack_require__(1);
	var IID_1 = __webpack_require__(3);
	var Lazy_1 = __webpack_require__(10);
	var ScheduledSubject_1 = __webpack_require__(11);
	var Property_1 = __webpack_require__(4);
	"use strict";
	/**
	* PagedObservableListProjection implements a virtual paging projection over
	* an existing observable list. The class solely relies on index translation
	* and change notifications from its upstream source. It does not maintain data.
	* @class
	*/
	var PagedObservableListProjection = (function () {
	    function PagedObservableListProjection(source, pageSize, currentPage, scheduler) {
	        ////////////////////
	        // Implementation
	        this.disp = new Rx.CompositeDisposable();
	        this.changeNotificationsSuppressed = 0;
	        this.resetSubject = new Rx.Subject();
	        this.beforeResetSubject = new Rx.Subject();
	        this.updateLengthTrigger = new Rx.Subject();
	        this.source = source;
	        this.scheduler = scheduler || (Utils_1.isRxScheduler(currentPage) ? currentPage : Rx.Scheduler.immediate);
	        // IPagedObservableReadOnlyList
	        this.pageSize = Property_1.property(pageSize);
	        this.currentPage = Property_1.property(currentPage || 0);
	        var updateLengthTrigger = Rx.Observable.merge(this.updateLengthTrigger, source.lengthChanged)
	            .startWith(true)
	            .observeOn(Rx.Scheduler.immediate);
	        this.pageCount = Utils_1.whenAny(this.pageSize, updateLengthTrigger, function (ps, _) { return Math.ceil(source.length() / ps); })
	            .distinctUntilChanged()
	            .toProperty();
	        this.disp.add(this.pageCount);
	        // length
	        this.length = Utils_1.whenAny(this.currentPage, this.pageSize, updateLengthTrigger, function (cp, ps, _) { return Math.max(Math.min(source.length() - (ps * cp), ps), 0); })
	            .distinctUntilChanged()
	            .toProperty();
	        this.disp.add(this.length);
	        this.isEmpty = this.lengthChanged
	            .select(function (x) { return x === 0; })
	            .toProperty(this.length() === 0);
	        this.disp.add(this.isEmpty);
	        // isEmptyChanged
	        this.isEmptyChanged = Utils_1.whenAny(this.length, function (len) { return len == 0; })
	            .distinctUntilChanged();
	        // IObservableReadOnlyList
	        this.beforeItemsAddedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsAddedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.beforeItemsRemovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsRemovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.beforeItemReplacedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemReplacedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemChangingSubject = new Lazy_1.default(function () {
	            return ScheduledSubject_1.createScheduledSubject(scheduler);
	        });
	        this.itemChangedSubject = new Lazy_1.default(function () {
	            return ScheduledSubject_1.createScheduledSubject(scheduler);
	        });
	        this.beforeItemsMovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        this.itemsMovedSubject = new Lazy_1.default(function () { return new Rx.Subject(); });
	        // shouldReset (short-circuit)
	        this.shouldReset = this.resetSubject.asObservable();
	        this.listChanged = Rx.Observable.merge(this.itemsAdded.select(function (x) { return false; }), this.itemsRemoved.select(function (x) { return false; }), this.itemReplaced.select(function (x) { return false; }), this.itemsMoved.select(function (x) { return false; }), this.resetSubject.select(function (x) { return true; }))
	            .publish()
	            .refCount();
	        this.listChanging = Rx.Observable.merge(this.beforeItemsAdded.select(function (x) { return false; }), this.beforeItemsRemoved.select(function (x) { return false; }), this.beforeItemReplaced.select(function (x) { return false; }), this.beforeItemsMoved.select(function (x) { return false; }), this.beforeResetSubject.select(function (x) { return true; }))
	            .publish()
	            .refCount();
	        this.wireUpChangeNotifications();
	    }
	    //////////////////////////////////
	    // IUnknown implementation
	    PagedObservableListProjection.prototype.queryInterface = function (iid) {
	        return iid === IID_1.default.IObservableList || iid === IID_1.default.IDisposable;
	    };
	    PagedObservableListProjection.prototype.get = function (index) {
	        index = this.pageSize() * this.currentPage() + index;
	        return this.source.get(index);
	    };
	    Object.defineProperty(PagedObservableListProjection.prototype, "isReadOnly", {
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    PagedObservableListProjection.prototype.indexOf = function (item) {
	        return this.toArray().indexOf(item);
	    };
	    PagedObservableListProjection.prototype.contains = function (item) {
	        return this.indexOf(item) !== -1;
	    };
	    PagedObservableListProjection.prototype.toArray = function () {
	        var start = this.pageSize() * this.currentPage();
	        return this.source.toArray().slice(start, start + this.length());
	    };
	    PagedObservableListProjection.prototype.forEach = function (callbackfn, thisArg) {
	        this.toArray().forEach(callbackfn, thisArg);
	    };
	    PagedObservableListProjection.prototype.map = function (callbackfn, thisArg) {
	        return this.toArray().map(callbackfn, thisArg);
	    };
	    PagedObservableListProjection.prototype.filter = function (callbackfn, thisArg) {
	        return this.toArray().filter(callbackfn, thisArg);
	    };
	    PagedObservableListProjection.prototype.some = function (callbackfn, thisArg) {
	        return this.toArray().some(callbackfn, thisArg);
	    };
	    PagedObservableListProjection.prototype.every = function (callbackfn, thisArg) {
	        return this.toArray().every(callbackfn, thisArg);
	    };
	    PagedObservableListProjection.prototype.suppressChangeNotifications = function () {
	        var _this = this;
	        this.changeNotificationsSuppressed++;
	        return Rx.Disposable.create(function () {
	            _this.changeNotificationsSuppressed--;
	            if (_this.changeNotificationsSuppressed === 0) {
	                _this.publishBeforeResetNotification();
	                _this.publishResetNotification();
	            }
	        });
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    PagedObservableListProjection.prototype.dispose = function () {
	        this.disp.dispose();
	    };
	    Object.defineProperty(PagedObservableListProjection.prototype, "itemsAdded", {
	        get: function () {
	            if (!this._itemsAdded)
	                this._itemsAdded = this.itemsAddedSubject.value.asObservable();
	            return this._itemsAdded;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "beforeItemsAdded", {
	        get: function () {
	            if (!this._beforeItemsAdded)
	                this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();
	            return this._beforeItemsAdded;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "itemsRemoved", {
	        get: function () {
	            if (!this._itemsRemoved)
	                this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();
	            return this._itemsRemoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "beforeItemsRemoved", {
	        get: function () {
	            if (!this._beforeItemsRemoved)
	                this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();
	            return this._beforeItemsRemoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "itemReplaced", {
	        get: function () {
	            if (!this._itemReplaced)
	                this._itemReplaced = this.itemReplacedSubject.value.asObservable();
	            return this._itemReplaced;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "beforeItemReplaced", {
	        get: function () {
	            if (!this._beforeItemReplaced)
	                this._beforeItemReplaced = this.beforeItemReplacedSubject.value.asObservable();
	            return this._beforeItemReplaced;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "beforeItemsMoved", {
	        get: function () {
	            if (!this._beforeItemsMoved)
	                this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();
	            return this._beforeItemsMoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "itemsMoved", {
	        get: function () {
	            if (!this._itemsMoved)
	                this._itemsMoved = this.itemsMovedSubject.value.asObservable();
	            return this._itemsMoved;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "lengthChanging", {
	        get: function () {
	            if (!this._lengthChanging)
	                this._lengthChanging = this.length.changing.distinctUntilChanged();
	            return this._lengthChanging;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(PagedObservableListProjection.prototype, "lengthChanged", {
	        get: function () {
	            if (!this._lengthChanged)
	                this._lengthChanged = this.length.changed.distinctUntilChanged();
	            return this._lengthChanged;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    PagedObservableListProjection.prototype.wireUpChangeNotifications = function () {
	        var _this = this;
	        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe(function (e) {
	            // force immediate recalculation of length, pageCount etc.
	            _this.updateLengthTrigger.onNext(true);
	            _this.onItemsAdded(e);
	        }));
	        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe(function (e) {
	            // force immediate recalculation of length, pageCount etc.
	            _this.updateLengthTrigger.onNext(true);
	            _this.onItemsRemoved(e);
	        }));
	        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsMoved(e);
	        }));
	        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe(function (e) {
	            _this.onItemsReplaced(e);
	        }));
	        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe(function (e) {
	            // force immediate recalculation of length, pageCount etc.
	            _this.updateLengthTrigger.onNext(true);
	            _this.publishBeforeResetNotification();
	            _this.publishResetNotification();
	        }));
	        this.disp.add(Utils_1.whenAny(this.pageSize, this.currentPage, function (ps, cp) { return true; }).observeOn(this.scheduler).subscribe(function (e) {
	            _this.publishBeforeResetNotification();
	            _this.publishResetNotification();
	        }));
	    };
	    PagedObservableListProjection.prototype.getPageRange = function () {
	        var from = this.currentPage() * this.pageSize();
	        var result = { from: from, to: from + this.length() };
	        return result;
	    };
	    PagedObservableListProjection.prototype.publishResetNotification = function () {
	        this.resetSubject.onNext(true);
	    };
	    PagedObservableListProjection.prototype.publishBeforeResetNotification = function () {
	        this.beforeResetSubject.onNext(true);
	    };
	    PagedObservableListProjection.prototype.onItemsAdded = function (e) {
	        var page = this.getPageRange();
	        // items added beneath the window can be ignored
	        if (e.from > page.to)
	            return;
	        // adding items before the window results in a reset
	        if (e.from < page.from) {
	            this.publishBeforeResetNotification();
	            this.publishResetNotification();
	        }
	        else {
	            // compute relative start index
	            var from = e.from - page.from;
	            var numItems = Math.min(this.length() - from, e.items.length);
	            // limit items
	            var items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;
	            // emit translated notifications
	            var er = { from: from, items: items };
	            if (this.beforeItemsAddedSubject.isValueCreated)
	                this.beforeItemsAddedSubject.value.onNext(er);
	            if (this.itemsAddedSubject.isValueCreated)
	                this.itemsAddedSubject.value.onNext(er);
	        }
	    };
	    PagedObservableListProjection.prototype.onItemsRemoved = function (e) {
	        var page = this.getPageRange();
	        // items added beneath the window can be ignored
	        if (e.from > page.to)
	            return;
	        // adding items before the window results in a reset
	        if (e.from < page.from) {
	            this.publishBeforeResetNotification();
	            this.publishResetNotification();
	        }
	        else {
	            // compute relative start index
	            var from = e.from - page.from;
	            var numItems = Math.min(this.length() - from, e.items.length);
	            // limit items
	            var items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;
	            // emit translated notifications
	            var er = { from: from, items: items };
	            if (this.beforeItemsRemovedSubject.isValueCreated)
	                this.beforeItemsRemovedSubject.value.onNext(er);
	            if (this.itemsRemovedSubject.isValueCreated)
	                this.itemsRemovedSubject.value.onNext(er);
	        }
	    };
	    PagedObservableListProjection.prototype.onItemsMoved = function (e) {
	        var page = this.getPageRange();
	        var from = 0, to = 0;
	        var er;
	        // a move completely above or below the window should be ignored
	        if (e.from >= page.to && e.to >= page.to ||
	            e.from < page.from && e.to < page.from) {
	            return;
	        }
	        // from-index inside page?
	        if (e.from >= page.from && e.from < page.to) {
	            // to-index as well?
	            if (e.to >= page.from && e.to < page.to) {
	                // item was moved inside the page
	                from = e.from - page.from;
	                to = e.to - page.from;
	                er = { from: from, to: to, items: e.items };
	                if (this.beforeItemsMovedSubject.isValueCreated)
	                    this.beforeItemsMovedSubject.value.onNext(er);
	                if (this.itemsMovedSubject.isValueCreated)
	                    this.itemsMovedSubject.value.onNext(er);
	                return;
	            }
	            else if (e.to >= page.to) {
	                // item was moved out of the page somewhere below window
	                var lastValidIndex = this.length() - 1;
	                // generate removed notification
	                from = e.from - page.from;
	                if (from !== lastValidIndex) {
	                    er = { from: from, items: e.items };
	                    if (this.beforeItemsRemovedSubject.isValueCreated)
	                        this.beforeItemsRemovedSubject.value.onNext(er);
	                    if (this.itemsRemovedSubject.isValueCreated)
	                        this.itemsRemovedSubject.value.onNext(er);
	                    // generate fake-add notification for last item in page
	                    from = this.length() - 1;
	                    er = { from: from, items: [this.get(from)] };
	                    if (this.beforeItemsAddedSubject.isValueCreated)
	                        this.beforeItemsAddedSubject.value.onNext(er);
	                    if (this.itemsAddedSubject.isValueCreated)
	                        this.itemsAddedSubject.value.onNext(er);
	                }
	                else {
	                    // generate fake-replace notification for last item in page
	                    from = this.length() - 1;
	                    er = { from: from, items: [this.get(from)] };
	                    if (this.beforeItemReplacedSubject.isValueCreated)
	                        this.beforeItemReplacedSubject.value.onNext(er);
	                    if (this.itemReplacedSubject.isValueCreated)
	                        this.itemReplacedSubject.value.onNext(er);
	                }
	                return;
	            }
	        }
	        // reset in all other cases
	        this.publishBeforeResetNotification();
	        this.publishResetNotification();
	    };
	    PagedObservableListProjection.prototype.onItemsReplaced = function (e) {
	        var page = this.getPageRange();
	        // items replaced outside the window can be ignored
	        if (e.from > page.to || e.from < page.from)
	            return;
	        // compute relative start index
	        var from = e.from - page.from;
	        // emit translated notifications
	        var er = { from: from, items: e.items };
	        if (this.beforeItemReplacedSubject.isValueCreated)
	            this.beforeItemReplacedSubject.value.onNext(er);
	        if (this.itemReplacedSubject.isValueCreated)
	            this.itemReplacedSubject.value.onNext(er);
	    };
	    return PagedObservableListProjection;
	}());
	exports.PagedObservableListProjection = PagedObservableListProjection;
	//# sourceMappingURL=ListPaged.js.map

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var List_1 = __webpack_require__(9);
	var ListPaged_1 = __webpack_require__(14);
	"use strict";
	/**
	* Determines if target is an instance of a IObservableList
	* @param {any} target The object to test
	*/
	function isList(target) {
	    if (target == null)
	        return false;
	    return target instanceof List_1.ObservableList ||
	        target instanceof ListPaged_1.PagedObservableListProjection;
	}
	exports.isList = isList;
	//# sourceMappingURL=ListSupport.js.map

/***/ },
/* 16 */
/***/ function(module, exports) {

	/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
	/// <reference path="../Interfaces.ts" />
	"use strict";
	"use strict";
	/**
	* ES6 Map Shim
	* @class
	*/
	var MapEmulated = (function () {
	    function MapEmulated() {
	        ////////////////////
	        /// Implementation
	        this.cacheSentinel = {};
	        this.keys = [];
	        this.values = [];
	        this.cache = this.cacheSentinel;
	    }
	    Object.defineProperty(MapEmulated.prototype, "size", {
	        ////////////////////
	        /// IMap
	        get: function () {
	            return this.keys.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    MapEmulated.prototype.has = function (key) {
	        if (key === this.cache) {
	            return true;
	        }
	        if (this.find(key) >= 0) {
	            this.cache = key;
	            return true;
	        }
	        return false;
	    };
	    MapEmulated.prototype.get = function (key) {
	        var index = this.find(key);
	        if (index >= 0) {
	            this.cache = key;
	            return this.values[index];
	        }
	        return undefined;
	    };
	    MapEmulated.prototype.set = function (key, value) {
	        this.delete(key);
	        this.keys.push(key);
	        this.values.push(value);
	        this.cache = key;
	        return this;
	    };
	    MapEmulated.prototype.delete = function (key) {
	        var index = this.find(key);
	        if (index >= 0) {
	            this.keys.splice(index, 1);
	            this.values.splice(index, 1);
	            this.cache = this.cacheSentinel;
	            return true;
	        }
	        return false;
	    };
	    MapEmulated.prototype.clear = function () {
	        this.keys.length = 0;
	        this.values.length = 0;
	        this.cache = this.cacheSentinel;
	    };
	    MapEmulated.prototype.forEach = function (callback, thisArg) {
	        var size = this.size;
	        for (var i = 0; i < size; ++i) {
	            var key = this.keys[i];
	            var value = this.values[i];
	            this.cache = key;
	            callback.call(this, value, key, this);
	        }
	    };
	    Object.defineProperty(MapEmulated.prototype, "isEmulated", {
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    MapEmulated.prototype.find = function (key) {
	        var keys = this.keys;
	        var size = keys.length;
	        for (var i = 0; i < size; ++i) {
	            if (keys[i] === key) {
	                return i;
	            }
	        }
	        return -1;
	    };
	    return MapEmulated;
	}());
	function isFunction(o) {
	    return typeof o === 'function';
	}
	var proto = (window != null && window["Map"] !== undefined) ? Map.prototype : undefined;
	var hasNativeSupport = window != null && isFunction(window["Map"]) && isFunction(proto.forEach) &&
	    isFunction(proto.set) && isFunction(proto.clear) &&
	    isFunction(proto.delete) && isFunction(proto.has);
	/**
	* Creates a new WeakMap instance
	* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
	* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
	*/
	function createMap(disableNativeSupport) {
	    if (disableNativeSupport || !hasNativeSupport) {
	        return new MapEmulated();
	    }
	    return new Map();
	}
	exports.createMap = createMap;
	//# sourceMappingURL=Map.js.map

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
	/// <reference path="../Interfaces.ts" />
	"use strict";
	var Oid_1 = __webpack_require__(8);
	"use strict";
	/**
	* ES6 Set Shim
	* @class
	*/
	var SetEmulated = (function () {
	    function SetEmulated() {
	        ////////////////////
	        /// Implementation
	        this.values = [];
	        this.keys = {};
	    }
	    ////////////////////
	    /// ISet
	    SetEmulated.prototype.add = function (value) {
	        var key = Oid_1.getOid(value);
	        if (!this.keys[key]) {
	            this.values.push(value);
	            this.keys[key] = true;
	        }
	        return this;
	    };
	    SetEmulated.prototype.delete = function (value) {
	        var key = Oid_1.getOid(value);
	        if (this.keys[key]) {
	            var index = this.values.indexOf(value);
	            this.values.splice(index, 1);
	            delete this.keys[key];
	            return true;
	        }
	        return false;
	    };
	    SetEmulated.prototype.has = function (value) {
	        var key = Oid_1.getOid(value);
	        return this.keys.hasOwnProperty(key);
	    };
	    SetEmulated.prototype.clear = function () {
	        this.keys = {};
	        this.values.length = 0;
	    };
	    SetEmulated.prototype.forEach = function (callback, thisArg) {
	        this.values.forEach(callback, thisArg);
	    };
	    Object.defineProperty(SetEmulated.prototype, "size", {
	        get: function () {
	            return this.values.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(SetEmulated.prototype, "isEmulated", {
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return SetEmulated;
	}());
	function isFunction(o) {
	    return typeof o === 'function';
	}
	var proto = (window != null && window["Set"] !== undefined) ? Set.prototype : undefined;
	var hasNativeSupport = window != null && isFunction(window["Set"]) && isFunction(proto.forEach) &&
	    isFunction(proto.add) && isFunction(proto.clear) &&
	    isFunction(proto.delete) && isFunction(proto.has);
	/**
	* Creates a new Set instance
	* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
	* @return {ISet<T>} A new instance of a suitable ISet implementation
	*/
	function createSet(disableNativeSupport) {
	    if (disableNativeSupport || !hasNativeSupport) {
	        return new SetEmulated();
	    }
	    return new Set();
	}
	exports.createSet = createSet;
	/**
	* Extracts the values of a Set by invoking its forEach method and capturing the output
	*/
	function setToArray(src) {
	    var result = new Array();
	    src.forEach(function (x) { return result.push(x); });
	    return result;
	}
	exports.setToArray = setToArray;
	//# sourceMappingURL=Set.js.map

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
	/// <reference path="../Interfaces.ts" />
	"use strict";
	var Oid_1 = __webpack_require__(8);
	"use strict";
	/**
	* This class emulates the semantics of a WeakMap.
	* Even though this implementation is indeed "weak", it has the drawback of
	* requiring manual housekeeping of entries otherwise they are kept forever.
	* @class
	*/
	var WeakMapEmulated = (function () {
	    function WeakMapEmulated() {
	        ////////////////////
	        /// Implementation
	        this.inner = {};
	    }
	    ////////////////////
	    /// IWeakMap
	    WeakMapEmulated.prototype.set = function (key, value) {
	        var oid = Oid_1.getOid(key);
	        this.inner[oid] = value;
	    };
	    WeakMapEmulated.prototype.get = function (key) {
	        var oid = Oid_1.getOid(key);
	        return this.inner[oid];
	    };
	    WeakMapEmulated.prototype.has = function (key) {
	        var oid = Oid_1.getOid(key);
	        return this.inner.hasOwnProperty(oid);
	    };
	    WeakMapEmulated.prototype.delete = function (key) {
	        var oid = Oid_1.getOid(key);
	        return delete this.inner[oid];
	    };
	    Object.defineProperty(WeakMapEmulated.prototype, "isEmulated", {
	        get: function () {
	            return true;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return WeakMapEmulated;
	}());
	function isFunction(o) {
	    return typeof o === 'function';
	}
	var proto = (window != null && window["WeakMap"] !== undefined) ? WeakMap.prototype : undefined;
	var hasNativeSupport = window != null && isFunction(window["WeakMap"]) &&
	    isFunction(proto.set) && isFunction(proto.get) &&
	    isFunction(proto.delete) && isFunction(proto.has);
	/**
	* Creates a new WeakMap instance
	* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
	* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
	*/
	function createWeakMap(disableNativeSupport) {
	    if (disableNativeSupport || !hasNativeSupport) {
	        return new WeakMapEmulated();
	    }
	    return new WeakMap();
	}
	exports.createWeakMap = createWeakMap;
	//# sourceMappingURL=WeakMap.js.map

/***/ },
/* 19 */
/***/ function(module, exports) {

	"use strict";
	/**
	 * Simple http client inspired by https://github.com/radiosilence/xr
	 */
	var HttpClient = (function () {
	    function HttpClient() {
	        this.config = {};
	    }
	    HttpClient.prototype.res = function (xhr) {
	        return {
	            status: xhr.status,
	            response: xhr.response,
	            xhr: xhr
	        };
	    };
	    HttpClient.prototype.assign = function (l) {
	        var rs = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            rs[_i - 1] = arguments[_i];
	        }
	        for (var i in rs) {
	            if (!{}.hasOwnProperty.call(rs, i))
	                continue;
	            var r = rs[i];
	            if (typeof r !== 'object')
	                continue;
	            for (var k in r) {
	                if (!{}.hasOwnProperty.call(r, k))
	                    continue;
	                l[k] = r[k];
	            }
	        }
	        return l;
	    };
	    HttpClient.prototype.promise = function (args, fn) {
	        return ((args && args.promise)
	            ? args.promise
	            : (this.config.promise || HttpClient.defaults.promise))(fn);
	    };
	    HttpClient.prototype.configure = function (opts) {
	        this.config = this.assign({}, this.config, opts);
	    };
	    HttpClient.prototype.request = function (options) {
	        var _this = this;
	        return this.promise(options, function (resolve, reject) {
	            var opts = _this.assign({}, HttpClient.defaults, _this.config, options);
	            var xhr = opts.xmlHttpRequest();
	            if (typeof opts.url !== "string" || opts.url.length === 0)
	                reject(new Error("HttpClient: Please provide a request url"));
	            if (!HttpClient.Methods.hasOwnProperty(opts.method.toUpperCase()))
	                reject(new Error("HttpClient: Unrecognized http-method: " + opts.method));
	            var requestUrl = opts.url;
	            if (opts.params) {
	                requestUrl += requestUrl.indexOf('?') !== -1 ? (requestUrl[requestUrl.length - 1] != '&' ? '&' : '') : '?';
	                // append request parameters
	                requestUrl += Object.getOwnPropertyNames(opts.params).map(function (x) { return (x + "=" + opts.params[x]); }).join('&');
	            }
	            xhr.open(opts.method.toUpperCase(), requestUrl, true);
	            xhr.addEventListener(HttpClient.Events.LOAD, function () {
	                if (xhr.status >= 200 && xhr.status < 300) {
	                    var data_1 = null;
	                    if (xhr.responseText) {
	                        data_1 = opts.raw === true
	                            ? xhr.responseText : opts.load(xhr.responseText);
	                    }
	                    resolve(data_1);
	                }
	                else {
	                    reject(_this.res(xhr));
	                }
	            });
	            xhr.addEventListener(HttpClient.Events.ABORT, function () { return reject(_this.res(xhr)); });
	            xhr.addEventListener(HttpClient.Events.ERROR, function () { return reject(_this.res(xhr)); });
	            xhr.addEventListener(HttpClient.Events.TIMEOUT, function () { return reject(_this.res(xhr)); });
	            for (var k in opts.headers) {
	                if (!{}.hasOwnProperty.call(opts.headers, k))
	                    continue;
	                xhr.setRequestHeader(k, opts.headers[k]);
	            }
	            for (var k in opts.events) {
	                if (!{}.hasOwnProperty.call(opts.events, k))
	                    continue;
	                xhr.addEventListener(k, opts.events[k].bind(null, xhr), false);
	            }
	            var data = (typeof opts.data === 'object' && !opts.raw)
	                ? opts.dump(opts.data)
	                : opts.data;
	            if (data !== undefined)
	                xhr.send(data);
	            else
	                xhr.send();
	        });
	    };
	    HttpClient.prototype.get = function (url, params, options) {
	        var opts = { url: url, method: HttpClient.Methods.GET, params: params };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.prototype.put = function (url, data, options) {
	        var opts = { url: url, method: HttpClient.Methods.PUT, data: data };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.prototype.post = function (url, data, options) {
	        var opts = { url: url, method: HttpClient.Methods.POST, data: data };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.prototype.patch = function (url, data, options) {
	        var opts = { url: url, method: HttpClient.Methods.PATCH, data: data };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.prototype.delete = function (url, options) {
	        var opts = { url: url, method: HttpClient.Methods.DELETE };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.prototype.options = function (url, options) {
	        var opts = { url: url, method: HttpClient.Methods.OPTIONS };
	        return this.request(this.assign(opts, options));
	    };
	    HttpClient.Methods = {
	        GET: 'get',
	        POST: 'post',
	        PUT: 'put',
	        DELETE: 'delete',
	        PATCH: 'patch',
	        OPTIONS: 'options'
	    };
	    HttpClient.Events = {
	        READY_STATE_CHANGE: 'readystatechange',
	        LOAD_START: 'loadstart',
	        PROGRESS: 'progress',
	        ABORT: 'abort',
	        ERROR: 'error',
	        LOAD: 'load',
	        TIMEOUT: 'timeout',
	        LOAD_END: 'loadend'
	    };
	    HttpClient.defaults = {
	        method: HttpClient.Methods.GET,
	        data: undefined,
	        headers: {
	            'Accept': 'application/json',
	            'Content-Type': 'application/json'
	        },
	        dump: JSON.stringify,
	        load: JSON.parse,
	        xmlHttpRequest: function () { return new XMLHttpRequest(); },
	        promise: function (fn) { return new Promise(fn); }
	    };
	    return HttpClient;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = HttpClient;
	/**
	* Provides editable configuration defaults for all newly created HttpClient instances.
	**/
	function getHttpClientDefaultConfig() {
	    return HttpClient.defaults;
	}
	exports.getHttpClientDefaultConfig = getHttpClientDefaultConfig;
	//# sourceMappingURL=HttpClient.js.map

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="./Interfaces.ts" />
	"use strict";
	var Utils_1 = __webpack_require__(1);
	var IID_1 = __webpack_require__(3);
	var ScheduledSubject_1 = __webpack_require__(11);
	var Injector_1 = __webpack_require__(6);
	var res = __webpack_require__(7);
	"use strict";
	var RxObsConstructor = Rx.Observable; // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)
	/**
	* Creates an read-only observable property with an optional default value from the current (this) observable
	* (Note: This is the equivalent to Knockout's ko.computed)
	* @param {T} initialValue? Optional initial value, valid until the observable produces a value
	*/
	function toProperty(initialValue, scheduler) {
	    scheduler = scheduler || Rx.Scheduler.currentThread;
	    // initialize accessor function (read-only)
	    var accessor = function propertyAccessor(newVal) {
	        if (arguments.length > 0) {
	            Utils_1.throwError("attempt to write to a read-only observable property");
	        }
	        return accessor.value;
	    };
	    //////////////////////////////////
	    // IUnknown implementation
	    accessor.queryInterface = function (iid) {
	        return iid === IID_1.default.IObservableReadOnlyProperty || IID_1.default.IObservableProperty || iid === IID_1.default.IDisposable;
	    };
	    //////////////////////////////////
	    // IDisposable implementation
	    accessor.dispose = function () {
	        if (accessor.sub) {
	            accessor.sub.dispose();
	            accessor.sub = null;
	        }
	    };
	    //////////////////////////////////
	    // IObservableReadOnlyProperty<T> implementation
	    accessor.value = initialValue;
	    // setup observables
	    accessor.changedSubject = new Rx.Subject();
	    accessor.changed = accessor.changedSubject.asObservable();
	    accessor.changingSubject = new Rx.Subject();
	    accessor.changing = accessor.changingSubject.asObservable();
	    accessor.source = this;
	    accessor.thrownExceptions = ScheduledSubject_1.createScheduledSubject(scheduler, Injector_1.injector.get(res.app).defaultExceptionHandler);
	    accessor.catchExceptions = function (onError) {
	        accessor.thrownExceptions.subscribe(function (e) {
	            onError(e);
	        });
	        return accessor;
	    };
	    //////////////////////////////////
	    // implementation
	    var firedInitial = false;
	    accessor.sub = this
	        .distinctUntilChanged()
	        .subscribe(function (x) {
	        // Suppress a non-change between initialValue and the first value
	        // from a Subscribe
	        if (firedInitial && x === accessor.value) {
	            return;
	        }
	        firedInitial = true;
	        accessor.changingSubject.onNext(x);
	        accessor.value = x;
	        accessor.changedSubject.onNext(x);
	    }, function (x) { return accessor.thrownExceptions.onNext(x); });
	    return accessor;
	}
	RxObsConstructor.prototype.toProperty = toProperty;
	RxObsConstructor.prototype.continueWith = function () {
	    var args = Utils_1.args2Array(arguments);
	    var val = args.shift();
	    var obs = undefined;
	    if (Utils_1.isRxObservable(val)) {
	        obs = val;
	    }
	    else if (Utils_1.isFunction(val)) {
	        var action = val;
	        obs = Rx.Observable.startDeferred(action);
	    }
	    return this.selectMany(function (_) { return obs; });
	};
	function invokeCommand(command) {
	    // see the ReactiveUI project for the inspiration behind this function:
	    // https://github.com/reactiveui/ReactiveUI/blob/master/ReactiveUI/ReactiveCommand.cs#L511
	    return this
	        .select(function (x) { return ({
	        parameter: x,
	        command: (command instanceof Function ? command() : command)
	    }); })
	        .debounce(function (x) { return x.command.canExecuteObservable.startWith(x.command.canExecute(x.parameter)).where(function (b) { return b; }).select(function (x) { return 0; }); })
	        .select(function (x) { return x.command.executeAsync(x.parameter).catch(Rx.Observable.empty()); })
	        .switch()
	        .subscribe();
	}
	RxObsConstructor.prototype.invokeCommand = invokeCommand;
	RxObsConstructor.startDeferred = function (action) {
	    return Rx.Observable.defer(function () {
	        return Rx.Observable.create(function (observer) {
	            var cancelled = false;
	            if (!cancelled)
	                action();
	            observer.onNext(undefined);
	            observer.onCompleted();
	            return Rx.Disposable.create(function () { return cancelled = true; });
	        });
	    });
	};
	function install() {
	    // deliberately left blank
	}
	exports.install = install;
	//# sourceMappingURL=RxExtensions.js.map

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	/// <reference path="../Interfaces.ts" />
	"use strict";
	var ScheduledSubject_1 = __webpack_require__(11);
	// ReactiveUI's MessageBus
	"use strict";
	var MessageBus = (function () {
	    function MessageBus() {
	        //////////////////////////////////
	        // Implementation
	        this.messageBus = {};
	        this.schedulerMappings = {};
	    }
	    //////////////////////////////////
	    // IMessageBus
	    MessageBus.prototype.listen = function (contract) {
	        return this.setupSubjectIfNecessary(contract).skip(1);
	    };
	    MessageBus.prototype.isRegistered = function (contract) {
	        return this.messageBus.hasOwnProperty(contract);
	    };
	    MessageBus.prototype.registerMessageSource = function (source, contract) {
	        return source.subscribe(this.setupSubjectIfNecessary(contract));
	    };
	    MessageBus.prototype.sendMessage = function (message, contract) {
	        this.setupSubjectIfNecessary(contract).onNext(message);
	    };
	    MessageBus.prototype.registerScheduler = function (scheduler, contract) {
	        this.schedulerMappings[contract] = scheduler;
	    };
	    MessageBus.prototype.setupSubjectIfNecessary = function (contract) {
	        var ret = this.messageBus[contract];
	        if (ret == null) {
	            ret = ScheduledSubject_1.createScheduledSubject(this.getScheduler(contract), null, new Rx.BehaviorSubject(undefined));
	            this.messageBus[contract] = ret;
	        }
	        return ret;
	    };
	    MessageBus.prototype.getScheduler = function (contract) {
	        var scheduler = this.schedulerMappings[contract];
	        return scheduler || Rx.Scheduler.currentThread;
	    };
	    return MessageBus;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = MessageBus;
	//# sourceMappingURL=MessageBus.js.map

/***/ }
/******/ ])
});
;
//# sourceMappingURL=web.rx.lite.js.map