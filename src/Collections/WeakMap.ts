/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />

import { getOid } from "../Core/Oid"

"use strict";

/**
* This class emulates the semantics of a WeakMap.
* Even though this implementation is indeed "weak", it has the drawback of
* requiring manual housekeeping of entries otherwise they are kept forever.
* @class
*/
class WeakMapEmulated<TKey extends Object, T> implements wx.IWeakMap<TKey, T> {
    ////////////////////
    /// IWeakMap

    public set(key: TKey, value: T) {
        let oid = getOid(key);
        this.inner[oid] = value;
    }

    public get(key: TKey): T {
        let oid = getOid(key);
        return this.inner[oid];
    }

    public has(key: TKey): boolean {
        let oid = getOid(key);
        return this.inner.hasOwnProperty(oid);
    }

    public delete(key: TKey): boolean {
        let oid = getOid(key);
        return delete this.inner[oid];
    }

    public get isEmulated(): boolean {
        return true;
    }

    ////////////////////
    /// Implementation

    private inner: { [key: string]: T } = {};
}

function isFunction(o: any): boolean {
    return typeof o === 'function';
}

var proto: wx.IWeakMap<any, any> = (window != null && window["WeakMap"] !== undefined) ? <any> WeakMap.prototype : undefined;

var hasNativeSupport = window != null && isFunction(window["WeakMap"]) &&
    isFunction(proto.set) && isFunction(proto.get) &&
    isFunction(proto.delete) && isFunction(proto.has);

/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createWeakMap<TKey, T>(disableNativeSupport?: boolean): wx.IWeakMap<TKey, T> {
    if (disableNativeSupport || !hasNativeSupport) {
        return new WeakMapEmulated<TKey, T>();
    }

    return <wx.IWeakMap<TKey, T>> <any> new WeakMap();
}
