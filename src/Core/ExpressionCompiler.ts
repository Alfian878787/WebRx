﻿///<reference path="../Interfaces.ts" />

import IID from "../IID"
import { injector } from "./Injector"
import { noop, extend, isFunction, isCommand, throwError, getOid } from "../Core/Utils"
import * as res from "./Resources"
import * as log from "./Log"
import { property } from "./Property"

"use strict";

/**
* Knockout's object-literal parser ported to Typescript
*/

// The following regular expressions will be used to split an object-literal string into tokens
// These two match strings, either with double quotes or single quotes
const stringDouble = '"(?:[^"\\\\]|\\\\.)*"';
const stringSingle = "'(?:[^'\\\\]|\\\\.)*'";
// Matches a regular expression (text enclosed by slashes), but will also match sets of divisions
// as a regular expression (this is handled by the parsing loop below).
const stringRegexp = '/(?:[^/\\\\]|\\\\.)*/\w*';
// These characters have special meaning to the parser and must not appear in the middle of a
// token, except as part of a string.
const specials = ',"\'{}()/:[\\]';
// Match text (at least two characters) that does not contain any of the above special characters,
// although some of the special characters are allowed to start it (all but the colon and comma).
// The text can contain spaces, but leading or trailing spaces are skipped.
const everyThingElse = '[^\\s:,/][^' + specials + ']*[^\\s' + specials + ']';
// Match any non-space character not matched already. This will match colons and commas, since they're
// not matched by "everyThingElse", but will also match any other single character that wasn't already
// matched (for example: in "a: 1, b: 2", each of the non-space characters will be matched by oneNotSpace).
const oneNotSpace = '[^\\s]';

// Create the actual regular expression by or-ing the above strings. The order is important.
const bindingToken = RegExp(stringDouble + '|' + stringSingle + '|' + stringRegexp + '|' + everyThingElse + '|' + oneNotSpace, 'g');

// Match end of previous token to determine whether a slash is a division or regex.
const divisionLookBehind = /[\])"'A-Za-z0-9_$]+$/;
const keywordRegexLookBehind = { 'in': 1, 'return': 1, 'typeof': 1 };

/**
* Split an object-literal string into tokens (borrowed from the KnockoutJS project)
* @param {string} objectLiteralString A javascript-style object literal without leading and trailing curly brances
* @return {Command<any>} A Command whose ExecuteAsync just returns the CommandParameter immediately. Which you should ignore!
*/
export function parseObjectLiteral(objectLiteralString): Array<wx.IObjectLiteralToken> {
    // Trim leading and trailing spaces from the string
    let str = objectLiteralString.trim();

    // Trim braces '{' surrounding the whole object literal
    if (str.charCodeAt(0) === 123) str = str.slice(1, -1);

    // Split into tokens
    let result = new Array<wx.IObjectLiteralToken>(), toks = str.match(bindingToken), key, values, depth = 0;

    if (toks) {
        // Append a comma so that we don't need a separate code block to deal with the last item
        toks.push(',');

        for(let i = 0, tok; tok = toks[i]; ++i) {
            let c = tok.charCodeAt(0);
            // A comma signals the end of a key/value pair if depth is zero
            if (c === 44) { // ","
                if (depth <= 0) {
                    if (key)
                        result.push(values ? { key: key, value: values.join('') } : { 'unknown': key, value: undefined });
                    key = values = depth = 0;
                    continue;
                }
                // Simply skip the colon that separates the name and value
            } else if (c === 58) { // ":"
                if (!values)
                    continue;
                // A set of slashes is initially matched as a regular expression, but could be division
            } else if (c === 47 && i && tok.length > 1) { // "/"
                // Look at the end of the previous token to determine if the slash is actually division
                let match = toks[i - 1].match(divisionLookBehind);
                if (match && !keywordRegexLookBehind[match[0]]) {
                    // The slash is actually a division punctuator; re-parse the remainder of the string (not including the slash)
                    str = str.substr(str.indexOf(tok) + 1);
                    toks = str.match(bindingToken);
                    toks.push(',');
                    i = -1;
                    // Continue with just the slash
                    tok = '/';
                }
                // Increment depth for parentheses, braces, and brackets so that interior commas are ignored
            } else if (c === 40 || c === 123 || c === 91) { // '(', '{', '['
                ++depth;
            } else if (c === 41 || c === 125 || c === 93) { // ')', '}', ']'
                --depth;
                // The key must be a single token; if it's a string, trim the quotes
            } else if (!key && !values) {
                key = (c === 34 || c === 39) /* '"', "'" */ ? tok.slice(1, -1) : tok;
                continue;
            }
            if (values)
                values.push(tok);
            else
                values = [tok];
        }
    }
    return result;
}


/**
* Angular's expression compiler ported to Typescript
*/

const hookField = "___runtimeHooks";

function isDefined(value) { return typeof value !== "undefined"; }

//function valueFn(value) { return () => value; }

function $parseMinErr(module, message, arg1?, arg2?, arg3?, arg4?, arg5?) {
    let args = arguments;

    message = message.replace(/{(\d)}/g, (match) => {
        return args[2 + parseInt(match[1])];
    });

    throw new SyntaxError(message);
}

function lowercase(string) { return typeof string === "string" ? string.toLowerCase() : string; }


// Sandboxing Angular Expressions
// ------------------------------
// Angular expressions are generally considered safe because these expressions only have direct
// access to $scope and locals. However, one can obtain the ability to execute arbitrary JS code by
// obtaining a reference to native JS functions such as the Function constructor.
//
// As an example, consider the following Angular expression:
//
//   {}.toString.constructor(alert("evil JS code"))
//
// We want to prevent this type of access. For the sake of performance, during the lexing phase we
// disallow any "dotted" access to any member named "constructor".
//
// For reflective calls (a[b]) we check that the value of the lookup is not the Function constructor
// while evaluating the expression, which is a stronger but more expensive test. Since reflective
// calls are expensive anyway, this is not such a big deal compared to static dereferencing.
//
// This sandboxing technique is not perfect and doesn't aim to be. The goal is to prevent exploits
// against the expression language, but not to prevent exploits that were enabled by exposing
// sensitive JavaScript or browser apis on Scope. Exposing such objects on a Scope is never a good
// practice and therefore we are not even trying to protect against interaction with an object
// explicitly exposed in this way.
//
// A developer could foil the name check by aliasing the Function constructor under a different
// name on the scope.
//
// In general, it is not possible to access a Window object from an angular expression unless a
// window or some DOM object that has a reference to window is published onto a Scope.

function ensureSafeMemberName(name, fullExpression) {
    if (name === "constructor") {
        throw $parseMinErr("isecfld",
            "Referencing \"constructor\" field in WebRx expressions is disallowed! Expression: {0}",
            fullExpression);
    }
    return name;
}

function ensureSafeObject(obj, fullExpression) {
    // nifty check if obj is Function that is fast and works across iframes and other contexts
    if (obj) {
        if (obj.constructor === obj) {
            throw $parseMinErr("isecfn",
                "Referencing Function in WebRx expressions is disallowed! Expression: {0}",
                fullExpression);
        } else if ( // isWindow(obj)
            obj.document && obj.location && obj.alert && obj.setInterval) {
            throw $parseMinErr("isecwindow",
                "Referencing the Window in WebRx expressions is disallowed! Expression: {0}",
                fullExpression);
        } else if ( // isElement(obj)
            obj.children && (obj.nodeName || (obj.prop && obj.attr && obj.find))) {
            throw $parseMinErr("isecdom",
                "Referencing DOM nodes in WebRx expressions is disallowed! Expression: {0}",
                fullExpression);
        }
    }
    return obj;
}

const OPERATORS = {
    /* jshint bitwise : false */
    'null': () => { return null; },
    'true': () => { return true; },
    'false': () => { return false; },
    undefined: noop,
    '+': (self, locals, a, b) => {
        a = a(self, locals);
        b = b(self, locals);
        if (isDefined(a)) {
            if (isDefined(b)) {
                return a + b;
            }
            return a;
        }
        return isDefined(b) ? b : undefined;
    },
    '-': (self, locals, a, b) => {
        a = a(self, locals);
        b = b(self, locals);
        return (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0);
    },
    '*': (self, locals, a, b) => { return a(self, locals) * b(self, locals); },
    '/': (self, locals, a, b) => { return a(self, locals) / b(self, locals); },
    '%': (self, locals, a, b) => { return a(self, locals) % b(self, locals); },
    '^': (self, locals, a, b) => { return a(self, locals) ^ b(self, locals); },
    '=': noop,
    '===': (self, locals, a, b) => { return a(self, locals) === b(self, locals); },
    '!==': (self, locals, a, b) => { return a(self, locals) !== b(self, locals); },
    '==': (self, locals, a, b) => { return a(self, locals) === b(self, locals); },
    '!=': (self, locals, a, b) => { return a(self, locals) !== b(self, locals); },
    '<': (self, locals, a, b) => { return a(self, locals) < b(self, locals); },
    '>': (self, locals, a, b) => { return a(self, locals) > b(self, locals); },
    '<=': (self, locals, a, b) => { return a(self, locals) <= b(self, locals); },
    '>=': (self, locals, a, b) => { return a(self, locals) >= b(self, locals); },
    '&&': (self, locals, a, b) => { return a(self, locals) && b(self, locals); },
    '||': (self, locals, a, b) => { return a(self, locals) || b(self, locals); },
    '&': (self, locals, a, b) => { return a(self, locals) & b(self, locals); },
    //    '|':function(self, locals, a,b){return a|b;},
    '|': (self, locals, a, b) => { return b(self, locals)(self, locals, a(self, locals)); },
    '!': (self, locals, a) => { return !a(self, locals); }
};
/* jshint bitwise: true */
const ESCAPE = { "n": "\n", "f": "\f", "r": "\r", "t": "\t", "v": "\v", "'": "'", '"': "\"" };

/**
* @constructor
*/
class Lexer {
    constructor(options) {
        this.options = options;
    }

    private options: any;
    private index: number;
    private text: string;
    private tokens: Array<any>;
    private ch: string;
    private lastCh: string;

    public lex(text): Array<any> {
        this.text = text;

        this.index = 0;
        this.ch = undefined;
        this.lastCh = ":"; // can start regexp

        this.tokens = [];

        let token: any;
        let json = [];

        while (this.index < this.text.length) {
            this.ch = this.text.charAt(this.index);
            if (this.is("\"'")) {
                this.readString(this.ch);
            } else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) {
                this.readNumber();
            } else if (this.isIdent(this.ch)) {
                this.readIdent();
                // identifiers can only be if the preceding char was a { or ,
                if (this.was("{,") && json[0] === "{" &&
                (token = this.tokens[this.tokens.length - 1])) {
                    token.json = token.text.indexOf(".") === -1;
                }
            } else if (this.is("(){}[].,;:?")) {
                this.tokens.push({
                    index: this.index,
                    text: this.ch,
                    json: (this.was(":[,") && this.is("{[")) || this.is("}]:,")
                });
                if (this.is("{[")) json.unshift(this.ch);
                if (this.is("}]")) json.shift();
                this.index++;
            } else if (this.isWhitespace(this.ch)) {
                this.index++;
                continue;
            } else {
                let ch2 = this.ch + this.peek();
                let ch3 = ch2 + this.peek(2);
                let fn = OPERATORS[this.ch];
                let fn2 = OPERATORS[ch2];
                let fn3 = OPERATORS[ch3];
                if (fn3) {
                    this.tokens.push({ index: this.index, text: ch3, fn: fn3 });
                    this.index += 3;
                } else if (fn2) {
                    this.tokens.push({ index: this.index, text: ch2, fn: fn2 });
                    this.index += 2;
                } else if (fn) {
                    this.tokens.push({
                        index: this.index,
                        text: this.ch,
                        fn: fn,
                        json: (this.was("[,:") && this.is(" + -"))
                    });
                    this.index += 1;
                } else {
                    this.throwError("Unexpected next character ", this.index, this.index + 1);
                }
            }
            this.lastCh = this.ch;
        }
        return this.tokens;
    }

    private is(chars): boolean {
        return chars.indexOf(this.ch) !== -1;
    }

    private was(chars): boolean {
        return chars.indexOf(this.lastCh) !== -1;
    }

    private peek(i?): any {
        let num = i || 1;
        return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
    }

    private isNumber(ch): boolean {
        return ("0" <= ch && ch <= "9");
    }

    private isWhitespace(ch): boolean {
        // IE treats non-breaking space as \u00A0
        return (ch === " " || ch === "\r" || ch === "\t" ||
            ch === "\n" || ch === "\v" || ch === "\u00A0");
    }

    private isIdent(ch): boolean {
        return ("a" <= ch && ch <= "z" ||
            "A" <= ch && ch <= "Z" ||
            "_" === ch || ch === "$" || ch === "@");
    }

    private isExpOperator(ch): boolean {
        return (ch === "-" || ch === "+" || this.isNumber(ch));
    }

    private throwError(error?, start?, end?): void {
        end = end || this.index;
        let colStr = (isDefined(start)
            ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]"
            : " " + end);
        throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].",
            error, colStr, this.text);
    }

    private readNumber(): void {
        let n: any = "";
        let start = this.index;
        while (this.index < this.text.length) {
            let ch = lowercase(this.text.charAt(this.index));
            if (ch === "." || this.isNumber(ch)) {
                n += ch;
            } else {
                let peekCh = this.peek();
                if (ch === "e" && this.isExpOperator(peekCh)) {
                    n += ch;
                } else if (this.isExpOperator(ch) &&
                    peekCh && this.isNumber(peekCh) &&
                    n.charAt(n.length - 1) === "e") {
                    n += ch;
                } else if (this.isExpOperator(ch) &&
                    (!peekCh || !this.isNumber(peekCh)) &&
                    n.charAt(n.length - 1) === "e") {
                    this.throwError("Invalid exponent");
                } else {
                    break;
                }
            }
            this.index++;
        }
        n = 1 * n;
        this.tokens.push({
            index: start,
            text: n,
            json: true,
            fn() {
                return n;
            }
        });
    }

    private readIdent(): void {
        let parser = this;

        let ident = "";
        let start = this.index;

        let lastDot: number, peekIndex: number, methodName: string, ch: string;

        while (this.index < this.text.length) {
            ch = this.text.charAt(this.index);
            if (ch === "." || this.isIdent(ch) || this.isNumber(ch)) {
                if (ch === ".") lastDot = this.index;
                ident += ch;
            } else {
                break;
            }
            this.index++;
        }

        //check if this is not a method invocation and if it is back out to last dot
        if (lastDot) {
            peekIndex = this.index;
            while (peekIndex < this.text.length) {
                ch = this.text.charAt(peekIndex);
                if (ch === "(") {
                    methodName = ident.substr(lastDot - start + 1);
                    ident = ident.substr(0, lastDot - start);
                    this.index = peekIndex;
                    break;
                }
                if (this.isWhitespace(ch)) {
                    peekIndex++;
                } else {
                    break;
                }
            }
        }

        let token: any = {
            index: start,
            text: ident
        };

        // OPERATORS is our own object so we don't need to use special hasOwnPropertyFn
        if (OPERATORS.hasOwnProperty(ident)) {
            token.fn = OPERATORS[ident];
            token.json = OPERATORS[ident];
        } else {
            let getter = getterFn(ident, this.options, this.text);
            token.fn = extend((self: any, locals: any) => {
                return (getter(self, locals));
            }, {
                assign(self, value, locals) {
                    return setter(self, ident, value, parser.text, parser.options, locals);
                }
            });
        }

        this.tokens.push(token);

        if (methodName) {
            this.tokens.push({
                index: lastDot,
                text: ".",
                json: false
            });
            this.tokens.push({
                index: lastDot + 1,
                text: methodName,
                json: false
            });
        }
    }

    private readString(quote): void {
        let start = this.index;
        this.index++;
        let value = "";
        let rawString = quote;
        let escape = false;
        while (this.index < this.text.length) {
            let ch = this.text.charAt(this.index);
            rawString += ch;
            if (escape) {
                if (ch === "u") {
                    let hex = this.text.substring(this.index + 1, this.index + 5);
                    if (!hex.match(/[\da-f]{4}/i))
                        this.throwError("Invalid unicode escape [\\u" + hex + "]");
                    this.index += 4;
                    value += String.fromCharCode(parseInt(hex, 16));
                } else {
                    let rep = ESCAPE[ch];
                    if (rep) {
                        value += rep;
                    } else {
                        value += ch;
                    }
                }
                escape = false;
            } else if (ch === "\\") {
                escape = true;
            } else if (ch === quote) {
                this.index++;
                this.tokens.push({
                    index: start,
                    text: rawString,
                    string: value,
                    json: true,
                    fn() {
                        return value;
                    }
                });
                return;
            } else {
                value += ch;
            }
            this.index++;
        }
        this.throwError("Unterminated quote", start);
    }
}

/**
* @constructor
*/
class Parser {
    constructor(lexer: Lexer, options?: wx.IExpressionCompilerOptions) {
        this.lexer = lexer;
        this.options = options || { filters: {} };
    }

    private lexer: Lexer;
    private options: wx.IExpressionCompilerOptions;
    private text: string;
    private tokens: Array<any>;

    public parse(text): (scope: any, locals: any) => wx.ICompiledExpression {
        this.text = text;

        this.tokens = this.lexer.lex(text);

        let value = this.statements();

        if (this.tokens.length !== 0) {
            this.throwError("is an unexpected token", this.tokens[0]);
        }

        (<any> value).literal = !!(<any> value).literal;
        (<any> value).constant = !!(<any> value).constant;

        return value;
    }

    private primary(): wx.ICompiledExpression {
        let primary;
        if (this.expect("(")) {
            primary = this.filterChain();
            this.consume(")");
        } else if (this.expect("[")) {
            primary = this.arrayDeclaration();
        } else if (this.expect("{")) {
            primary = this.object();
        } else {
            let token = this.expect();
            primary = token.fn;
            if (!primary) {
                this.throwError("not a primary expression", token);
            }
            if (token.json) {
                primary.constant = true;
                primary.literal = true;
            }
        }

        let next, context;
        while ((next = this.expect("(", "[", "."))) {
            if (next.text === "(") {
                primary = this.functionCall(primary, context);
                context = null;
            } else if (next.text === "[") {
                context = primary;
                primary = this.objectIndex(primary);
            } else if (next.text === ".") {
                context = primary;
                primary = this.fieldAccess(primary);
            } else {
                this.throwError("IMPOSSIBLE");
            }
        }
        return primary;
    }

    private throwError(msg, token?) {
        throw $parseMinErr("syntax",
            "WebRx Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].",
            token.text, msg, (token.index + 1), this.text, this.text.substring(token.index));
    }

    private peekToken(): any {
        if (this.tokens.length === 0)
            throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
        return this.tokens[0];
    }

    private peek(e1?, e2?, e3?, e4?): any {
        if (this.tokens.length > 0) {
            let token = this.tokens[0];
            let t = token.text;
            if (t === e1 || t === e2 || t === e3 || t === e4 ||
            (!e1 && !e2 && !e3 && !e4)) {
                return token;
            }
        }
        return false;
    }

    private expect(e1?, e2?, e3?, e4?): any {
        let token = this.peek(e1, e2, e3, e4);
        if (token) {
            this.tokens.shift();
            return token;
        }
        return false;
    }

    private consume(e1): void {
        if (!this.expect(e1)) {
            this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
        }
    }

    private unaryFn(fn, right): wx.ICompiledExpression {
        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            return fn(self, locals, right);
        }, {
            constant: right.constant
        }, true);
    }

    private ternaryFn(left, middle, right): wx.ICompiledExpression {
        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            return left(self, locals) ? middle(self, locals) : right(self, locals);
        }, {
            constant: left.constant && middle.constant && right.constant
        }, true);
    }

    private binaryFn(left, fn, right): wx.ICompiledExpression {
        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            return fn(self, locals, left, right);
        }, {
            constant: left.constant && right.constant
        }, true);
    }

    private statements(): wx.ICompiledExpression {
        let statements = [];
        while (true) {
            if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]"))
                statements.push(this.filterChain());
            if (!this.expect(";")) {
                // optimize for the common case where there is only one statement.
                // TODO(size): maybe we should not support multiple statements?
                return (statements.length === 1)
                    ? statements[0] :
                    (self: any, locals: any) => {
                        let value;
                        for(let i = 0; i < statements.length; i++) {
                            let statement = statements[i];
                            if (statement) {
                                value = statement(self, locals);
                            }
                        }
                        return value;
                    };
            }
        }
    }

    private filterChain(): wx.ICompiledExpression {
        let left = this.expression();
        let token;
        while (true) {
            if ((token = this.expect("|"))) {
                left = this.binaryFn(left, token.fn, this.filter());
            } else {
                return left;
            }
        }
    }

    private filter(): wx.ICompiledExpression {
        let token = this.expect();
        let fn = this.options.filters[token.text];
        let argsFn = [];
        while (true) {
            if ((token = this.expect(":"))) {
                argsFn.push(this.expression());
            } else {
                var fnInvoke = (self, locals, input) => {
                    let args = [input];
                    for(let i = 0; i < argsFn.length; i++) {
                        args.push(argsFn[i](self, locals));
                    }
                    return fn.apply(self, args);
                };
                return () => {
                    return fnInvoke;
                };
            }
        }
    }

    private expression(): wx.ICompiledExpression {
        return this.assignment();
    }

    private assignment(): wx.ICompiledExpression {
        let left = this.ternary();
        let right;
        let token;
        if ((token = this.expect("="))) {
            if (!(<any> left).assign) {
                this.throwError("implies assignment but [" +
                    this.text.substring(0, token.index) + "] can not be assigned to", token);
            }
            right = this.ternary();
            return (scope: any, locals: any) => {
                return (<any> left).assign(scope, right(scope, locals), locals);
            };
        }
        return left;
    }

    private ternary(): wx.ICompiledExpression {
        let left = this.logicalOR();
        let middle;
        let token;
        if ((token = this.expect("?"))) {
            middle = this.ternary();
            if ((token = this.expect(":"))) {
                return this.ternaryFn(left, middle, this.ternary());
            } else {
                this.throwError("expected :", token);
            }
        }

        return left;
    }

    private logicalOR(): wx.ICompiledExpression {
        let left = this.logicalAND();
        let token;
        while (true) {
            if ((token = this.expect("||"))) {
                left = this.binaryFn(left, token.fn, this.logicalAND());
            } else {
                return left;
            }
        }
    }

    private logicalAND(): wx.ICompiledExpression {
        let left = this.equality();
        let token;
        if ((token = this.expect("&&"))) {
            left = this.binaryFn(left, token.fn, this.logicalAND());
        }
        return left;
    }

    private equality(): wx.ICompiledExpression {
        let left = this.relational();
        let token;
        if ((token = this.expect("==", "!=", "===", "!=="))) {
            left = this.binaryFn(left, token.fn, this.equality());
        }
        return left;
    }

    private relational(): wx.ICompiledExpression {
        let left = this.additive();
        let token;
        if ((token = this.expect("<", ">", "<=", ">="))) {
            left = this.binaryFn(left, token.fn, this.relational());
        }
        return left;
    }

    private additive(): wx.ICompiledExpression {
        let left = this.multiplicative();
        let token;
        while ((token = this.expect("+", "-"))) {
            left = this.binaryFn(left, token.fn, this.multiplicative());
        }
        return left;
    }

    private multiplicative(): wx.ICompiledExpression {
        let left = this.unary();
        let token;
        while ((token = this.expect("*", "/", "%"))) {
            left = this.binaryFn(left, token.fn, this.unary());
        }
        return left;
    }

    private unary(): wx.ICompiledExpression {
        let token;
        if (this.expect("+")) {
            return this.primary();
        } else if ((token = this.expect("-"))) {
            return this.binaryFn(ZERO, token.fn, this.unary());
        } else if ((token = this.expect("!"))) {
            return this.unaryFn(token.fn, this.unary());
        } else {
            return this.primary();
        }
    }

    private fieldAccess(object): (scope: any, locals?: any) => wx.ICompiledExpression {
        let parser = this;
        let field = this.expect().text;
        let getter = getterFn(field, this.options, this.text);

        return <wx.ICompiledExpression> extend((scope: any, locals?: any, self?) => {
            return getter(self || object(scope, locals));
        }, {
            assign(scope, value, locals) {
                return setter(object(scope, locals), field, value, parser.text, parser.options, locals);
            }
        }, true);
    }

    private objectIndex(obj): wx.ICompiledExpression {
        let parser = this;

        let indexFn = this.expression();
        this.consume("]");

        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            let o = obj(self, locals),
                i = indexFn(self, locals),
                v,
                p;

            if (!o) return undefined;

            let hooks = getRuntimeHooks(locals);
            if (hooks && hooks.readIndexHook)
                v = hooks.readIndexHook(o, i);
            else
                v = o[i];

            v = ensureSafeObject(v, parser.text);
            return v;
        }, {
            assign(self, value, locals) {
                let key = indexFn(self, locals);
                // prevent overwriting of Function.constructor which would break ensureSafeObject check
                let safe = ensureSafeObject(obj(self, locals), parser.text);

                let hooks = getRuntimeHooks(locals);
                if (hooks && hooks.writeIndexHook)
                    return hooks.writeIndexHook(safe, key, value);

                return safe[key] = value;
            }
        }, true);
    }

    private functionCall(fn, contextGetter): wx.ICompiledExpression {
        if (this.options.disallowFunctionCalls)
            this.throwError("Function calls are not allowed");

        let argsFn = [];
        if (this.peekToken().text !== ")") {
            do {
                argsFn.push(this.expression());
            } while (this.expect(","));
        }
        this.consume(")");

        let parser = this;

        return (scope: any, locals: any) => {
            let args = [];
            let context = contextGetter ? contextGetter(scope, locals) : scope;

            for(let i = 0; i < argsFn.length; i++) {
                args.push(argsFn[i](scope, locals));
            }
            let fnPtr = fn(scope, locals, context) || noop;

            ensureSafeObject(context, parser.text);
            ensureSafeObject(fnPtr, parser.text);

            // IE stupidity! (IE doesn't have apply for some native functions)
            let v = fnPtr.apply
                ? fnPtr.apply(context, args)
                : fnPtr(args[0], args[1], args[2], args[3], args[4]);

            return ensureSafeObject(v, parser.text);
        };
    }

    // This is used with json array declaration
    private arrayDeclaration(): wx.ICompiledExpression {
        let elementFns = [];
        let allConstant = true;
        if (this.peekToken().text !== "]") {
            do {
                if (this.peek("]")) {
                    // Support trailing commas per ES5.1.
                    break;
                }
                let elementFn = this.expression();
                elementFns.push(elementFn);
                if (!(<any> elementFn).constant) {
                    allConstant = false;
                }
            } while (this.expect(","));
        }
        this.consume("]");

        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            let array = [];
            for(let i = 0; i < elementFns.length; i++) {
                array.push(elementFns[i](self, locals));
            }
            return array;
        }, {
            literal: true,
            constant: allConstant
        }, true);
    }

    private object(): wx.ICompiledExpression {
        let keyValues = [];
        let allConstant = true;
        if (this.peekToken().text !== "}") {
            do {
                if (this.peek("}")) {
                    // Support trailing commas per ES5.1.
                    break;
                }
                let token = this.expect(),
                    key = token.string || token.text;
                this.consume(":");
                let value = this.expression();
                keyValues.push({ key: key, value: value });
                if (!(<any> value).constant) {
                    allConstant = false;
                }
            } while (this.expect(","));
        }
        this.consume("}");

        return <wx.ICompiledExpression> extend((self: any, locals: any) => {
            let object = {};
            for(let i = 0; i < keyValues.length; i++) {
                let keyValue = keyValues[i];
                object[keyValue.key] = keyValue.value(self, locals);
            }
            return object;
        }, {
            literal: true,
            constant: allConstant
        }, true);
    }
}

function ZERO() { return 0; };


//////////////////////////////////////////////////
// Parser helper functions
//////////////////////////////////////////////////

function setter(obj, path, setValue, fullExp, options, locals) {
    let element = path.split("."), key;
    let i: number;
    let propertyObj;

    let hooks = getRuntimeHooks(locals);

    if (hooks) {
        for(let i= 0; element.length > 1; i++) {
            key = ensureSafeMemberName(element.shift(), fullExp);

            propertyObj = hooks.readFieldHook ?
                hooks.readFieldHook(obj, key) :
                obj[key];

            if (!propertyObj) {
                propertyObj = {};

                if (hooks.writeFieldHook)
                    hooks.writeFieldHook(obj, key, propertyObj);
                else
                    obj[key] = propertyObj;
            }
            obj = propertyObj;
        }
    } else {
        for(let i= 0; element.length > 1; i++) {
            key = ensureSafeMemberName(element.shift(), fullExp);
            propertyObj = obj[key];
            if (!propertyObj) {
                propertyObj = {};
                obj[key] = propertyObj;
            }
            obj = propertyObj;
        }
    }

    key = ensureSafeMemberName(element.shift(), fullExp);

    if (hooks && hooks.writeFieldHook)
        hooks.writeFieldHook(obj, key, setValue);
    else
        obj[key] = setValue;

    return setValue;
}

let getterFnCache = {};

/**
* Implementation of the "Black Hole" variant from:
* - http://jsperf.com/angularjs-parse-getter/4
* - http://jsperf.com/path-evaluation-simplified/7
*/
function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options?): wx.ICompiledExpression {
    ensureSafeMemberName(key0, fullExp);
    ensureSafeMemberName(key1, fullExp);
    ensureSafeMemberName(key2, fullExp);
    ensureSafeMemberName(key3, fullExp);
    ensureSafeMemberName(key4, fullExp);

    return (scope: any, locals: any) => {
        let pathVal = (locals && locals.hasOwnProperty(key0)) ? locals : scope;
        let hooks = getRuntimeHooks(locals);
        if (hooks && hooks.readFieldHook) {
            if (pathVal == null) return pathVal;
            pathVal = hooks.readFieldHook(pathVal, key0);

            if (!key1) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = hooks.readFieldHook(pathVal, key1);

            if (!key2) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = hooks.readFieldHook(pathVal, key2);

            if (!key3) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = hooks.readFieldHook(pathVal, key3);

            if (!key4) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = hooks.readFieldHook(pathVal, key4);

            return pathVal;
        }

        if (pathVal == null) return pathVal;
        pathVal = pathVal[key0];

        if (!key1) return pathVal;
        if (pathVal == null) return undefined;
        pathVal = pathVal[key1];

        if (!key2) return pathVal;
        if (pathVal == null) return undefined;
        pathVal = pathVal[key2];

        if (!key3) return pathVal;
        if (pathVal == null) return undefined;
        pathVal = pathVal[key3];

        if (!key4) return pathVal;
        if (pathVal == null) return undefined;
        pathVal = pathVal[key4];

        return pathVal;
    };
}

function simpleGetterFn1(key0, fullExp): wx.ICompiledExpression {
    ensureSafeMemberName(key0, fullExp);

    return (scope: any, locals: any) => {
        scope = ((locals && locals.hasOwnProperty(key0)) ? locals : scope);
        if (scope == null) return undefined;

        let hooks = getRuntimeHooks(locals);
        if (hooks && hooks.readFieldHook)
            return hooks.readFieldHook(scope, key0);

        return scope[key0];
    };
}

function simpleGetterFn2(key0, key1, fullExp): wx.ICompiledExpression {
    ensureSafeMemberName(key0, fullExp);
    ensureSafeMemberName(key1, fullExp);

    return (scope: any, locals: any) => {
        let hooks = getRuntimeHooks(locals);
        if (hooks && hooks.readFieldHook) {
            scope = (locals && locals.hasOwnProperty(key0)) ? locals : scope;
            if (scope == null) return undefined;

            scope = hooks.readFieldHook(scope, key0);
            return scope == null ? undefined : hooks.readFieldHook(scope, key1);
        }

        scope = ((locals && locals.hasOwnProperty(key0)) ? locals : scope)[key0];
        return scope == null ? undefined : scope[key1];
    };
}

function getterFn(path, options, fullExp): (scope: any, locals?: any, self?: any) => any {
    // Check whether the cache has this getter already.
    // We can use hasOwnProperty directly on the cache because we ensure,
    // see below, that the cache never stores a path called 'hasOwnProperty'
    if (getterFnCache.hasOwnProperty(path)) {
        return getterFnCache[path];
    }

    let pathKeys = path.split("."),
        pathKeysLength = pathKeys.length,
        fn: (scope: any, locals?: any, self?: any) => any;

    // When we have only 1 or 2 tokens, use optimized special case closures.
    // http://jsperf.com/angularjs-parse-getter/6
    if (pathKeysLength === 1) {
        fn = simpleGetterFn1(pathKeys[0], fullExp);
    } else if (pathKeysLength === 2) {
        fn = simpleGetterFn2(pathKeys[0], pathKeys[1], fullExp);
    } else { // if (options.csp) {
        if (pathKeysLength < 6) {
            fn = cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options);
        } else {
            fn = (scope: any, locals: any) => {
                // backup locals
                let _locals = {};
                Object.keys(locals).forEach(x => _locals[x] = locals[x]);

                let i = 0, val;
                do {
                    val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++],
                        pathKeys[i++], fullExp, options)(scope, locals);

                    scope = val;

                    // reset locals
                    locals = {};
                    Object.keys(_locals).forEach(x => locals[x] = _locals[x]);
                } while (i < pathKeysLength);
                return val;
            };
        }
    } /* else {
    let code = "var p;\n";
    forEach(pathKeys, (key, index) => {
        ensureSafeMemberName(key, fullExp);
        code += "if(s == null) return undefined;\n" +
            "s=" + (index
                // we simply dereference 's' on any .dot notation
                ? "s"
                // but if we are first then we check locals first, and if so read it first
                : "((k&&k.hasOwnProperty(\"" + key + "\"))?k:s)") + "[\"" + key + "\"]" + ";\n";
    });
    code += "return s;";

    // jshint -W054 
    let evaledFnGetter = new Function("s", "k", "pw", code); // s=scope, k=locals, pw=promiseWarning
    // jshint +W054 /
    evaledFnGetter.toString = valueFn(code);
    fn = <(scope: any, locals?: any, self?: any) => any> evaledFnGetter;
} */

    // Only cache the value if it's not going to mess up the cache object
    // This is more performant that using Object.prototype.hasOwnProperty.call
    if (path !== "hasOwnProperty") {
        getterFnCache[path] = fn;
    }
    return fn;
}

export function getRuntimeHooks(locals: any): wx.ICompiledExpressionRuntimeHooks {
    return locals !== undefined ? locals[hookField] : undefined;
}

export function setRuntimeHooks(locals: any, hooks: wx.ICompiledExpressionRuntimeHooks): void {
    locals[hookField] = hooks;
}

/**
 * Compiles src and returns a function that executes src on a target object.
 * The compiled function is cached under compile.cache[src] to speed up further calls.
 *
 * @param {string} src
 * @returns {function}
 */
export function compileExpression(src: string, options?: wx.IExpressionCompilerOptions,
    cache?: { [exp: string]: wx.ICompiledExpression }): wx.ICompiledExpression {

    if (typeof src !== "string") {
        throw new TypeError("src must be a string, instead saw '" + typeof src + "'");
    }

    let lexer = new Lexer({});
    let parser = new Parser(lexer, options);

    if (!cache) {
        return parser.parse(src);
    }

    let cached = cache[src];
    if (!cached) {
        cached = cache[src] = parser.parse(src);
    }

    return cached;
}
