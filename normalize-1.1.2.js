/**
	Normalize-1.1.2.js: A collection of polyfills to standardize the JavaScript browser environment.
 	Examples: window.console.log, Object.is() / keys(), String.prototype.trim() / fromCodePoint(),
	Array.prototype.every() / forEach() / map() / sort(), etc.

	https://www.ecma-international.org/ecma-262/11.0/

  	Adapted and extended from es5-shim.js

	Polyfix: A concatenation of 'polyfill' and 'bugfix'.
	Many snippets of code here are simultaneously both polyfills and bugfixes.

 	Polyfill Order:

	General
	Window
	Number
	Math
	Array
	Object
	String
	Regexp
	Date
	JSON
	*Event (slated for 2.0)
	*Document (slated for 2.0);

	I have cleaned up a lot of the superfluous code logic present in ES5-shim.js.
	There might be a slight performance cost (<1 to 10)% compared to ES5-shim.js, on legacy engines,
	but the gain is in filesize.
	This cost will be indistinguishable on modern engines, which are exponentially faster, and which will have
	many native functions defined already.

	Runs on IE9+, Safari 3.2+, Chrome, Firefox, etc.

	Keylog:

 	`#` : Edited for formatting, code logic, or cross-browser support, or when I am the author
  	`...` : marked as unneccesary or very highly unlikely that you would need to polyfill.
 	`!!` : Want to polyfill, needs polyfill.

	Note 1:

	Certain Array.prototype methods, if required to be polyfixed,
 	if 'use strict' is unsupported,
	will necessarily not throw a TypeError if called on null or undefined,
	different from the native functions, due to null / undefined being replaced
	with the global object in non-strict mode `call`
	and it being impossible to determine if
	the function was called with null, undefined or window

	difference between Function.prototype.call.bind

*/
"version 1.1.2.00";

;(function( globalThis, context, factory ) {

	if (context === 'window' || !context) {

		globalThis['normalize'] = new factory( globalThis, context );

	} else
	if (context === 'node') {
       module.exports = new factory( globalThis , context ); //
    } else {
		globalThis['normalize'] = new factory( globalThis, context );
	}

})( (function () { // A globalThis polyfill | # | Adapted from https://mathiasbynens.be/notes/globalthis

	if (typeof window !== 'undefined' && window && window.window === window) { return window } // all browsers
	else { // webworkers, or server-side Javascript, like Node.js
		try {
			Object.defineProperty( Object.prototype, '__magic__', { // hocus pocus
				get: function() {
					return this;
				},
				configurable: true // This makes it possible to 'delete' the getter later
			});
			__magic__.globalThis = __magic__;
			delete Object.prototype.__magic__;

			return globalThis;
		} catch (e) {
			// we shouldn't ever get here, since all server-side JS environments that I know of support Object.defineProperty
			return (typeof globalThis === 'object') ? globalThis : ( (typeof global === 'object') ? global : this );
		}
	}
})(), (function () {

	// return the specific JavaScript execution context, such as window, WebWorkers, Node.js, etc.
	if (typeof window !== 'undefined' && window && window.window === window) { return 'window' } // all browsers
	if (typeof self !== 'undefined' && self && typeof WorkerGlobalScope !== 'undefined') {
		try {
			return (self instanceof WorkerGlobalScope) ? 'worker' : null;
		} catch (e) {
			return null;
		}
	}
	if (typeof module === "object" && typeof module.exports === "object") { return 'node' } // node.js
	if (typeof define === 'function' && define.amd) { return 'amd' }

	return null;

})(), function ( window /*global*/, context, undefined ) { // "use strict";

	//var document = window.document || function() {};

	this.version = "1.1.2.00";
	this.name = 'normalize';

	// Console-polyfill. MIT license | # | Dependency | https://github.com/paulmillr/console-polyfill | Makes it safe to do console.log() always.
	;(function( w ) {

		if (!w.console) { w.console = {} }
		var con = w.console, prop, method, dummy = function(){}, properties = ['memory'];
		var methods = [
		  'assert|clear|count|debug|dir|dirxml|error|exception|group|groupCollapsed|',
		  'groupEnd|info|log|markTimeline|profile|profiles|profileEnd|show|table|',
		  'time|timeEnd|timeline|timelineEnd|timeStamp|trace|warn|timeLog'
		].join('').split('|');

		while ( prop = properties.pop() ) { if (!con[prop]) { con[prop] = {} }}
		while ( method = methods.pop() ) { if (!con[method]) { con[method] = dummy }}

	})( window );

	// Object.prototype.hasOwnProperty() polyfill | # | Dependency
	// As contributed to MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
	// Necessary to define here, as our `Object.defineProperty` wrapper, `define`, requires hasOwnProperty
	(function( hasOwn ) {
		function hasOwnProperty( name ) {
			 var O = ToObject(this, 'Object.prototype.hasOwnProperty called on null or undefined!');
			 var key = String(name);
			 var _proto = O.__proto__ || O.constructor.prototype || {}; // Object.prototype
			 return key in O && ( !(key in _proto) || O[key] !== _proto[key] );
		}
		if ( !hasOwn ) {
			try {
				Object.defineProperty( Object.prototype , 'hasOwnProperty', {
					enumerable: false, configurable: true, writable: true,
					value: hasOwnProperty
				});
			} catch (e) { // Object.defineProperty isn't supported
				Object.prototype.hasOwnProperty = hasOwnProperty;
			}
		}
	})( Object.prototype.hasOwnProperty );

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// ----------------------------------General Purpose Functions, Semi-global Variables -------------------------- ///

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Shortcut to often accessed variables, in order to avoid multiple dereference
	// that costs universally. This also holds a reference to known-good functions.

	// # The `ES.x` methods are now global functions. By removing the unnecessary extra step of first referencing
	// `ES`, there is an improvement of ~10% on legacy browsers (like IE).
	// On exponentially faster modern browsers, either approach is basically a matter of preference.

	// https://caniuse.com/let
	// https://caniuse.com/defineProperty
	// https://caniuse.com/es5
	// https://kangax.github.io/nfe/

	var global = window, cl = console.log;
	// there are 3 types of people in this world: sheep, wolves, and sheepdogs
	var _SUPPORTS_ = {

		// full support of Object.defineProperty
		'descriptors': !!(function( defineProperty, obj ) {
			try {
				defineProperty( obj, 'x', { enumerable: false, value: obj });
				for (var _ in obj) { return }
				return obj.x === obj;
			} catch (e) {}
		})( Object.defineProperty, {} ),

		// full support of keyword `let`
		'let': !!(function() {
		   try {
			  return new Function( // non-strict mode
				['return (function(arr, r,s) {', // ensure r and s are always undefined
				 'for (let i=0, s=9; i<3; i++) { let r = 9; arr[i] = function() { return i } }',
				 'for (var j=0, k=0; j<3; j++) { k+=arr[j]() }',
				 'if (k === 9) { return false }', // IE11/Edge<-14
				 'if (typeof r !== "undefined" || typeof s !== "undefined") { return false }', // Safari<11
				 'return true',
				'})([])'
				].join('\n')
			  )();
		   } catch (e) {}
		})(),

		// void operator
		'void': !!(function() {
			try { return new Function('return !(void 0)')() } catch (e) {}
		})(),

		// full support of named function expressions
		'NFE': (function(g) { // ensure g is never a function while not overriding inner scope with var
			return function() {
				var f = function g(){}; return !(typeof g === 'function') // IE<9: g is 'function'
			}
		})()(),

		'NFESafari2.x': null, // TODO

		// String bracket notation
		'string-bracket-notation': (function( boxedString ) {
			// Check failure of by-index access of string characters (IE < 9) and failure of `0 in boxedString` (Rhino)
			return (boxedString[0] !== 'a' || !(0 in boxedString)); // needSplitString

		})( Object('a') )
	};

	if (!_SUPPORTS_['NFE'] || !_SUPPORTS_['void']) {
		console.warn(
			'normalize.js expects true named function expression / void operator support. ' +
			'For use in IE<9, Safari<3.2, and other dinosaurs, use normalize-1.1.1.NFE-compat.js'
		);

		this.CanNotPolyfill = true;
		this.unsupportable = true;
		return this;
	}

	// Booleans:
	var supportsDescriptors = _SUPPORTS_['descriptors'];
	var hasToStringTag = (typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol');

	var	NON_ENUM = { configurable: true, writable: true },
		READ_ONLY = { enumerable: true, configurable: true },
		AS_CONST = { enumerable: false, configurable: false, writable: false }; // default
		FULL_MOD = { enumerable: true, configurable: true, writable: true }

	var DIV = document.createElement('div');

	var $Array = Array, $Object = Object, $Function = Function, $String = String, $Number = Number, $P = 'prototype';

	var max = Math.max, min = Math.min, floor = Math.floor, abs = Math.abs;

	// http://blog.stevenlevithan.com/archives/faster-trim-javascript
	// http://perfectionkills.com/whitespace-deviations/
	// ES5 15.5.4.20 | whitespace from: http://es5.github.io/#x15.5.4.20

	var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004'
		+ '\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

	var ArrayProto = Array[$P],
		ObjectProto = Object[$P],
		FunctionProto = Function[$P],
		StringProto = String[$P],
		NumberProto = Number[$P],
		ErrorProto = Error[$P],
		RegExpProto = RegExp[$P],
		DateProto = Date[$P];

	// Snapshot variables; Methods are not passed by reference
	var array_slice = ArrayProto.slice,
		array_splice = ArrayProto.splice,
		array_push = ArrayProto.push,
		array_unshift = ArrayProto.unshift,
		array_concat = ArrayProto.concat,
		array_join = ArrayProto.join,
		call = FunctionProto.call,
		apply = FunctionProto.apply;
		// ArrayProto.pop(), StringProto.split()

	var StringPrototypeValueOf = StringProto.valueOf,
		NumberPrototypeToString = NumberProto.toString,
		FunctionPrototypeToString = FunctionProto.toString,
		ObjectPrototypeToString = ObjectProto.toString,
		RegExpPrototypeExec = RegExpProto.exec;

	var ErrNullish = ' called on null or undefined!';
	var constructorRegex = /^\s*class /, funcRegex = /^(\[object (Function|GeneratorFunction)\])$/;

	// Check failure of by-index access of string characters (IE < 9) and failure of `0 in boxedString` (Rhino)
	var boxedString = Object('a');
	var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

	// Is:
	var isActualNaN = Number.isNaN || function isActualNaN(x) { return x !== x };
	var isArray = Array.isArray || function isArray(obj) {
		return ObjectPrototypeToString.call(obj) === '[object Array]'
	};

	// Detect IE without User-agent hacks. | Supports minification. | (L) MIT
	// Version 1.1.7 | https://github.com/Kithraya/detect-IE
	var isIE = (function(envir, is_default_IE11) {

		var mapIE = { '5': 5, '5.5': 5.5, '5.6': 6, '5.7': 7, '5.8': 8, '9': 9, '10': 11, '11': 11 }; // IE browser versions

		var j_v = Number( new Function("/*@cc_on return @_j_v; @*\/")() ) || (is_default_IE11 ? 11 : NaN);

		if (!j_v) { return false }
		if (j_v === 5.7 && !window.XMLHttpRequest) { j_v = 5.6 }

		envir = { jscript: j_v, mode: document.documentMode, is_default_IE11: is_default_IE11 };

		envir.browser = mapIE[ String(j_v) ] || j_v;

		envir[envir.browser] = (envir.browser == envir.mode);

		return envir

	})( {}, !!window.msCrypto );

	var isStrict = function() { return !this }();

	// Export useful functions
	this.addTo = define;
	this.define = define;
	this.isCallable = isCallable;
	this.is_default_IE11 = !!window.msCrypto;
	this.isES6ClassFn = isES6ClassFn;
	this.isIE = isIE;
	this.isNode = isNode;
	this.isPrimitive = isPrimitive;
	this.isRegex = isRegex;
	this.isString = isString;
	this.ToInteger = ToInteger;
	this.ToObject = ToObject;
	this.ToUint32 = ToUint32;
	this.ToPrimitive = ToPrimitive;
	this.globalThis = window;
	this.enumerate = enumerate;
	this.time = time;
	this.type = type;
	this.isStrictlyInfinite = isStrictlyInfinite;
	this.isStrictMode = isStrictMode;
	this.supports = _SUPPORTS_;
	this.ToNumber = ToNumber;
	this.ToSoftNumber = ToSoftNumber;
	this.ToSoftInteger = ToSoftInteger;
	this.environment = context;
	this.expando = +new Date();
	this.isObsolete = isObsolete();

	// Internal Typeof Wrapper (as contributed to MDN).
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof
	// Correctly handles functionish RegExp, functionish <object> elements, non-spec defined
	// host objects like window, document, ES6 generators, etc.

	function type(obj, fullClass) {

		if (fullClass) { return (obj === null) ? '[object Null]' : ObjectPrototypeToString.call(obj) }
		if (obj == null) { return (obj + '').toLowerCase() } // implicit toString() conversion

		var deepType = ObjectPrototypeToString.call(obj).slice(8,-1).toLowerCase();
		if (deepType === 'generatorfunction') { return 'function' }

		return deepType.match(/^(array|bigint|date|error|function|generator|regexp|symbol)$/) ? deepType :
			(typeof obj === 'object' || typeof obj === 'function') ? 'object' : typeof obj
	}

	function ErrStr(s) { return 'Array.prototype.' + s + ErrNullish }

	function ErrReadOnly( s, obj, prop ){
		return new
		TypeError("Cannot modify read-only property '"+prop+"' of value `"+obj+"` at [Array.prototype."+s+"]");
	}

	function ThrowCallErr(s, val) {
		throw new TypeError('[Array.prototype.' + s + ']: `' + val + '` is not a callable function!');
	}

	function hasOwnProp(prop, obj) { return ObjectProto.hasOwnProperty.call(obj, prop) }
	function getOwnProp(obj, prop) { return ObjectProto.hasOwnProperty.call(obj, prop) ? obj[prop] : undefined }

	function microtime() { return + new Date() }

	/*  Object.defineProperty convenience wrapper function. You'll see this everywhere.
	 *  Defaults to: {enumerable: false, writable: false, configurable: false}
	 *  Skips already defined properties.
	 *  Doesn't support getters / setters yet.
	 *  Won't throw if browser doesn't support Object.defineProperty */

	function define(obj, prop, value, options, forceAssign) {

		var ecw = (function(o) {
			if (o === Object(o)) { // {} [] (): assume if length of 3, its formatted correctly.
				return (o.length === 3) ? o : [
					getOwnProp(o,'enumerable'),
					getOwnProp(o,'configurable'),
					getOwnProp(o,'writable')
				];
			}
			return [0,0,0]; // default: not enumerable, configurable or writable
		})(options);

		var enumerable = !!ecw[0], configurable = !!ecw[1], writable = !!ecw[2];
		var userObj = null; // (arguments.length === 3) ? val : null; revisit
		var overwrite;

		if (arguments.length === 5) { overwrite = !!forceAssign }
		else {
			if (options === Object(options) && hasOwnProp('overwrite', options) ) {
				overwrite = options['overwrite'];
			}
			if (typeof options === 'boolean') { overwrite = options }
		}
		if (arguments.length === 2) {
			enumerable = configurable = writable = true;
			value = void 0;
		}

		if (typeof options === 'string') {

			options = options.toLowerCase();

			for (var i=0;i<options.length;i++) {
				(function(letter) {
					if (letter === 'e') { enumerable = !0 }
					if (letter === 'c') { configurable = !0 }
					if (letter === 'w') { writable = !0 }
				})(options.charAt(i));
			}
		}

		if (!(prop in obj) || overwrite ) { // only if prop isn't defined, or we want to overwrite
			try {
			  if ( ! supportsDescriptors ) { throw 0 }
			  Object.defineProperty(obj, prop, (userObj || {
				  'value': value,
				  'enumerable': enumerable,
				  'configurable': configurable,
				  'writable': writable
			  }));
			} catch (error) { // Object.defineProperty isn't supported
			  obj[prop] = value;
			}
		}
	}

	function defineProperties(obj, map, forceAssign) {
		for (var name in map) { // use `define` instead, to avoid the IE<9 enumeration bug
			if ( hasOwnProp(name, map) ) {
				define( obj, name, map[name], NON_ENUM, forceAssign );
			}
		}
	}

	function enumerate(obj) {
		for (var i in obj) { try { console.log(i, ':', obj[i]) } catch (e) {} }
	}

	function HandleUnboxedString(val) {
		return splitString && isString(val) ? strSplit(val, '') : null;
	}

	// isES6ClassFn
	function isES6ClassFn(value) { // City Lights Floral Theme
		try {
			var fnStr = FunctionPrototypeToString.call( value );
			var singleStripped = fnStr.replace(/\/\/.*\n/g, '');
			var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, '');
			var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' ');
			return constructorRegex.test(spaceStripped);
		} catch (e) { return false } // not a function
	}

	// isCallable
	function isCallable(value) {
		if ( !value || (typeof value !== 'function' && typeof value !== 'object') ) { return false }
		if ( hasToStringTag ) {
			return !!(function tryFunctionObject() {
				try {
					if ( isES6ClassFn( value ) ) { return }
					return FunctionPrototypeToString.call( value ), true;
				} catch (e) {}
			})();
		}
		return isES6ClassFn(value) ?
			false : !!ObjectPrototypeToString.call( value ).match( funcRegex );
	}

	function isEnumerable(prop, obj) {
		return obj.propertyIsEnumerable(prop);
	}

	// isNode
	function isNode(o, val) {
		var n = (function() {
			try { return o instanceof Node } catch (e) {
				// Node isn't supported, check if it looks like a Node instance
				// The redundant checks remove false positives
				return o && typeof o === "object" && o.nodeName && o.nodeType >= 1 && o.nodeType <= 12;
			}
		})();
		return (arguments.length < 2 || !n) ? n : !!( function(t, nType) {
			if (t === 'number') { return nType === val }
			if (t === 'object') { for (var i=0; i<val.length; i++) { if (nType === val[i]) { return !0 } } }
		})(typeof val, o.nodeType);
	}

	function isObsolete() {
		if (typeof Element !== 'function') { return true }
		if (typeof Event !== 'function') { return true }
		if (
			!_SUPPORTS_['void'] ||
			!_SUPPORTS_['NFE'] ||
			!_SUPPORTS_['descriptors']
		) { return true }
		if (isIE && !isIE[11]) { return true }
	}

	// isPrimitive | Primitive Types: null, undefined, boolean, number, string, symbol, bigint
	function isPrimitive(input) {
		return input == null || (typeof input !== 'object' && typeof input !== 'function');
	}

	// isRegex
	function isRegex(value) {
		if (typeof value !== 'object') { return false }
		return hasToStringTag ? !!(function tryRegexExec() {
			try {
				 return RegExpPrototypeExec.call( value ), true;
			} catch (e) {}
		})() : ObjectPrototypeToString.call(value) === '[object RegExp]';
	}

	// isStrictlyInfinite
	function isStrictlyInfinite(num) {
		return (num === 1/0 || num === -(1/0))
	}

	// isStrictMode
	function isStrictMode() { return !this }

	// isString
	function isString(value) {
		if (typeof value === 'string') { return true }
		if (typeof value !== 'object') { return false }
		return hasToStringTag ? !!(function tryStringObject() {
			try {
				return StringPrototypeValueOf.call( value ), true;
			} catch (e) {}
		})() : ObjectPrototypeToString.call(value) === '[object String]';
	}


	function time(count, callback, name, arg) {

		console.time(name || 'speed');

		for (var i=0,len = count; i<len; i++ ) {
			callback.call(null, arg)
		}
		console.timeEnd(name || 'speed');

	}

	// ToInteger | ECMA-262/11.0
	function ToInteger(num) {
		// Unary operator throws TypeError on BigInt, and Symbol primitives
		var n = +num; // step 1
		// ToNumber(n) is only falsy on -0, +0, and NaN

		if (!n) { return 0 } // step 2
		if (!isStrictlyInfinite(n)) { return n } // step 3

		n = (n > 0 || -1) * Math.floor(Math.abs(n)); // step 4

		return n || 0; // step 5
	}

	// ToObject
	function ToObject(o, CustomErrorMsg ) {
		if (o == null) { throw new TypeError( CustomErrorMsg || "ToObject called with argument null or undefined!" ) }
		return Object(o);
	}

	// ToPrimitive
	function ToPrimitive( input ) {
		return isPrimitive( input ) ? input : (function(valueOf, toStr, val) {
			if ( isCallable( valueOf ) ) {
				val = valueOf.call( input );
				if (isPrimitive( val )) { return val }
			}
			if ( isCallable( toStr ) ) {
				val = toStr.call(input);
				if (isPrimitive( val )) { return val }
			}
			throw new TypeError();
		})(input.valueOf, input.toString);
	}

	// ToUint32 | Almost never used, as inlining is faster
	function ToUint32(x) { return x >>> 0 }

	// ToNumber
	function ToNumber(n) { return +n }

	// ToSoftNumber
	// Converts any value to a Number type (including NaN) via unary / number operator without throwing a TypeError
	function ToSoftNumber(num, notUnary) {
		return (function() {
			try { return (notUnary) ? Number(num) : +num } catch (e) { return NaN }
		})();
	}

	// ToSoftInteger | Coerces a number to an integer without throwing a TypeError.
	function ToSoftInteger(num, notUnary) {
		return ToInteger(ToSoftNumber(num, notUnary));
	}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// -------------------------------------------- General Purpose Polyfills ---------------------------------------------- ///

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
	// Function.prototype.bind() polyfill | ES5-shim | ES-5 15.3.4.5 | http://es5.github.com/#x15.3.4.5
	define( FunctionProto, 'bind', (function() {

	  var Empty = function Empty() {};
	  return function bind( that ) { // .length is 1

		// 1. Let Target be the this value.
		var target = this;
		// 2. If IsCallable(Target) is false, throw a TypeError exception.
		if ( !isCallable( target ) ) {
			throw new TypeError('Function.prototype.bind called on incompatible ' + target);
		}
		var args = array_slice.call(arguments, 1); // for normal call

		var bound, binder = function () {

			if (this instanceof bound) {
				var result = apply.call(
					target, this,
					array_concat.call(args, array_slice.call(arguments))
				);
				if (Object(result) === result) { return result }
				return this;

			} else {
				return apply.call(
					target, that,
					array_concat.call(args, array_slice.call(arguments))
				);

			}
		};
		var boundLength = max(0, target.length - args.length), boundArgs = [];

		for (var i=0; i < boundLength; i++) { array_push.call(boundArgs, '$' + i) }

		// XXX Build a dynamic function with desired amount of arguments is the only
		// way to set the length property of a function.
		// In environments where Content Security Policies enabled (Chrome extensions,
		// for ex.) all use of eval or Function costructor throws an exception.
		// However in all of these environments Function.prototype.bind exists
		// and so this code will never be executed.
		bound = Function('binder', 'return function (' + array_join.call(boundArgs, ',') + '){ return binder.apply(this, arguments); }')(binder);

		if (target[$P]) {
			Empty[$P] = target[$P];
			bound[$P] = new Empty();
			Empty[$P] = null; // Clean up dangling references.
		}
		return bound;
	  }
	})() , NON_ENUM );

	// _Please note: Shortcuts are defined after `Function.prototype.bind` as we use it in defining shortcuts.
    var owns = call.bind( ObjectProto.hasOwnProperty );
    var toStr = call.bind( ObjectProto.toString );
    var arraySlice = call.bind( array_slice );
    var arraySliceApply = apply.bind( array_slice );

    /* globals document */
    if (typeof document === 'object' && document && document.documentElement) {
        try {
            arraySlice(document.documentElement.childNodes);
        } catch (e) {
            var origArraySlice = arraySlice;
            var origArraySliceApply = arraySliceApply;
            arraySlice = function arraySliceIE(arr) {
                var r = [], i = arr.length;
                while (i-- > 0) {
					r[i] = arr[i];
				}

                return origArraySliceApply(r, origArraySlice(arguments, 1));
            };
            arraySliceApply = function arraySliceApplyIE(arr, args) {
                return origArraySliceApply(arraySlice(arr), args);
            };
        }
    }

	// String.prototype.trim() polyfix | ES5-shim | Dependency
	;(function() {

		var zeroWidth = '\u200b';
		var wsRegexChars = '[' + ws + ']';
		var trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
		var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');

		var hasTrimWhitespaceBug = StringProto.trim && (ws.trim() || !zeroWidth.trim());

		// String.prototype.trim() polyfix
		define( StringProto, 'trim', function trim() {

			if (this == null) { throw new TypeError('String.prototype.trim called on null or undefined!') }
			return String( this ).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');

		}, NON_ENUM, hasTrimWhitespaceBug );
		// export ws;
	})();

	// semi-global bound variables (snapshot)
	var strSlice = call.bind( StringProto.slice );
	var strSplit = call.bind( StringProto.split );
	var strIndexOf = call.bind( StringProto.indexOf );
	var pushCall = call.bind( array_push );
	var isEnum = call.bind( ObjectProto.propertyIsEnumerable );
	var arraySort = call.bind( ArrayProto.sort );
	var trim = call.bind( StringProto.trim );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// ------------------------------------------------------ Window / Global Object, Document property polyfills -------------------------------------------------------------

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  (function GlobalClosure() { // Window Internal Variable Closure

	define( window, 'Infinity', 1/0 /*, as_const */); // default
	define( window, 'NaN', Number('/'));
	define( window, 'globalThis', global, NON_ENUM );
	define( window, 'undefined', undefined, (global['undefined'] !== undefined) );

	// Non-standard. Since this function was so useful, I decided to make it part of the global environment.
	// Comment the following line if you do not prefer this.
	define( window, 'isCallable', isCallable, NON_ENUM );

	// define( window, 'isFinite', function isFinite(v) {}, NON_ENUM );

	// window.isNaN() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isNaN
	define( window, 'isNaN', (function() {
		return function isNaN(v) { return Number(v) !== Number(v) }
	})(), NON_ENUM );

	// ES-5 15.1.2.2 | eslint-disable-next-line radix
	var hasParseIntRadixBug = (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22);

	// window.parseInt() bugfix | ES5-shim | line ~2068
	define( window, 'parseInt', (function ( origParseInt ) {

		var hexRegex = /^[-+]?0[xX]/;
		return function parseInt(str, radix) {
			if (typeof str === 'symbol') {
				// handle Symbols in node 8.3/8.4
				// eslint-disable-next-line no-implicit-coercion, no-unused-expressions
				'' + str; // jscs:ignore disallowImplicitTypeConversion
			}
			var string = trim( String( str ) );
			var defaultedRadix = Number(radix) || (hexRegex.test(string) ? 16 : 10);
			return origParseInt(string, defaultedRadix);
		}

	})( parseInt ), NON_ENUM, hasParseIntRadixBug );


	// window.parseFloat() bugfix | ES5-shim | line ~2087 | https://es5.github.io/#x15.1.2.3
	define( window, 'parseFloat', (function( origParseFloat ) {

		return function parseFloat( string ) {

			var inputString = trim( String( string ) );
			var result = origParseFloat( inputString );
			return result === 0 && strSlice( inputString, 0, 1 ) === '-' ? -0 : result;

		}

	})(parseFloat), NON_ENUM, (1 / parseFloat('-0') !== -Infinity) );

  })(); // End of Window Closure

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// ------------------------------------------------------- Number property polyfills ---------------------------------------------------------------- ///

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  (function NumberClosure() { // Number Internal Variable Closure

    var toFixedHelpers = {
        'base': 1e7,
        'size': 6,
        'data': [0, 0, 0, 0, 0, 0],
        'multiply': function multiply(n, c) {
            var i = -1;
            var c2 = c;
            while (++i < toFixedHelpers.size) {
                c2 += n * toFixedHelpers.data[i];
                toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
                c2 = Math.floor(c2 / toFixedHelpers.base);
            }
        },
        'divide': function divide(n) {
            var i = toFixedHelpers.size;
            var c = 0;
            while (--i >= 0) {
                c += toFixedHelpers.data[i];
                toFixedHelpers.data[i] = Math.floor(c / n);
                c = (c % n) * toFixedHelpers.base;
            }
        },
        'numToString': function numToString() {
            var i = toFixedHelpers.size;
            var s = '';
            while (--i >= 0) {
                if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
                    var t = String(toFixedHelpers.data[i]);
                    if (s === '') {
                        s = t;
                    } else {
                        s += strSlice('0000000', 0, 7 - t.length) + t;
                    }
                }
            }
            return s;
        },
        'pow': function pow(x, n, acc) {
            return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
        },
        'log': function log(x) {
            var n = 0;
            var x2 = x;
            while (x2 >= 4096) {
                n += 12;
                x2 /= 4096;
            }
            while (x2 >= 2) {
                n += 1;
                x2 /= 2;
            }
            return n;
        }
    };

    function toFixed(fractionDigits) {
        var f, x, s, m, e, z, j, k;

        // Test for NaN and round fractionDigits down
        f = Number(fractionDigits);
        f = isActualNaN(f) ? 0 : Math.floor(f);

        if (f < 0 || f > 20) { throw new RangeError('Number.toFixed called with invalid number of decimals') }

        x = Number(this);

        if (isActualNaN(x)) { return 'NaN' }

        // If it is too big or small, return the string value of the number
        if (x <= -1e21 || x >= 1e21) { return String(x) }

        s = '';

        if (x < 0) { s = '-'; x = -x; }

        m = '0';

        if (x > 1e-21) {
            // 1e-21 < x < 1e21
            // -70 < log2(x) < 70
            e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
            z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
            z *= 0x10000000000000; // Math.pow(2, 52);
            e = 52 - e;

            // -18 < e < 122
            // x = z / 2 ^ e
            if (e > 0) {
                toFixedHelpers.multiply(0, z);
                j = f;

                while (j >= 7) {
                    toFixedHelpers.multiply(1e7, 0);
                    j -= 7;
                }

                toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
                j = e - 1;

                while (j >= 23) {
                    toFixedHelpers.divide(1 << 23);
                    j -= 23;
                }

                toFixedHelpers.divide(1 << j);
                toFixedHelpers.multiply(1, 1);
                toFixedHelpers.divide(2);
                m = toFixedHelpers.numToString();
            } else {
                toFixedHelpers.multiply(0, z);
                toFixedHelpers.multiply(1 << (-e), 0);
                m = toFixedHelpers.numToString() + strSlice('0.00000000000000000000', 2, 2 + f);
            }
        }

        if (f > 0) {
            k = m.length;

            if (k <= f) {
                m = s + strSlice('0.0000000000000000000', 0, f - k + 2) + m;
            } else {
                m = s + strSlice(m, 0, k - f) + '.' + strSlice(m, k - f);
            }
        } else {
            m = s + m;
        }
        return m;
    };

	define( Number, 'EPSILON', Math.pow(2, -52));
	define( Number, 'MAX_SAFE_INTEGER', 9007199254740991);
	define( Number, 'MIN_SAFE_INTEGER', -9007199254740991);
	define( Number, 'POSITIVE_INFINITY', Infinity);
	define( Number, 'NEGATIVE_INFINITY', -Infinity);
	define( Number, 'MAX_VALUE', 1.7976931348623157e+308);
	define( Number, 'MIN_VALUE', 5e-324);
	define( Number, 'NaN', NaN);

	define( Number, 'isNaN', function isNaN(i) { return typeof i === 'number' && (i !== i) }, NON_ENUM );
	define( Number, 'isFinite', function isFinite(v) { return typeof v === 'number' && window.isFinite(v) }, NON_ENUM );
	define( Number, 'isInteger', function isInteger(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; }, NON_ENUM );
	define( Number, 'isSafeInteger', function isSafeInteger(v) { return Number.isInteger(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER }, NON_ENUM );
	define( Number, 'parseInt', parseInt, NON_ENUM );
	define( Number, 'parseFloat', parseFloat, NON_ENUM );

	var hasToFixedBugs = ( NumberProto.toFixed && (
		(0.00008).toFixed(3) !== '0.000'
		|| (0.9).toFixed(0) !== '1'
		|| (1.255).toFixed(2) !== '1.25'
		|| (1000000000000000128).toFixed(0) !== '1000000000000000128'
	));

	// Number.prototype.toFixed() polyfix | ES5.1 15.7.4.5 | http://es5.github.com/#x15.7.4.5

	define( NumberProto, 'toFixed', toFixed, NON_ENUM, hasToFixedBugs );

	var hasToPrecisionUndefinedBug = (function() {
		try { return (1.0).toPrecision(undefined) === '1' } catch (e) { return !0 }
	}());

	// Number.prototype.toPrecision() bugfix
	define( NumberProto, 'toPrecision', (function( origToPrecision ) {
		return function toPrecision( amount ) {
			return (typeof amount === 'undefined') ? origToPrecision.call(this) : origToPrecision.call(this, amount);
		}
	})( NumberProto.toPrecision ) , NON_ENUM, hasToPrecisionUndefinedBug );

  })(); // End of Number Closure

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /// ------------------------------------------------------ Math property polyfills -------------------------------------------------------------- ///

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  (function MathClosure() { // Math Closure
	'use strict';

  	define( Math, 'E', 2.718281828459045); // Euler's Constant
  	define( Math, 'LN10', 2.302585092994046); // Natural Logarithm
  	define( Math, 'LN2', 0.6931471805599453); // etc.
  	define( Math, 'LOG10E', 0.4342944819032518);
  	define( Math, 'LOG2E', 1.4426950408889634);
  	define( Math, 'PI', 3.141592653589793);
  	define( Math, 'SQRT1_2', 0.7071067811865476);
  	define( Math, 'SQRT2', 1.4142135623730951);

  	/*	Methods that are listed as defined in all browsers since like IE3\4. Its really really highly unlikely that you would need to emulate them,
  		but you can if you're especially paranoid.

  		Math.abs(), Math.acos(), Math.asin(), Math.atan(), Math.atan2(), Math.ceil(), Math.cos(), Math.exp(),
  		Math.floor(), Math.log(), Math.max(), Math.min(), Math.pow(), Math.random(), Math.round(), Math.sin(),
  		Math.sqrt(), Math.tan().
  	*/

  	// Math.abs() ...
  	// Math.acos() ...

  	// Math.acosh() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh
  	define( Math, 'acosh', function acosh(x) { return Math.log(x + Math.sqrt(x * x - 1)); }, NON_ENUM );

  	// Math.asin() ...

  	// Math.asinh() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh
  	define( Math, 'asinh', function asinh(x) {
  		var absX = Math.abs(x), w;
  		if (absX < 3.725290298461914e-9) { return x } // |x| < 2^-28
  		if (absX > 268435456) { w = Math.log(absX) + Math.LN2 }  // |x| > 2^28
  		else if (absX > 2) {
  			w = Math.log(2 * absX + 1 / (Math.sqrt(x * x + 1) + absX));  // 2^28 >= |x| > 2
  		}
  		else {
  			var t = x * x, w = Math.log1p(absX + t / (1 + Math.sqrt(1 + t))) // log1p
  		}
  		return (x > 0 ? w : -w);

  	}, NON_ENUM );

  	// Math.atan() ...
  	// Math.atan2() ...

  	// Math.atanh() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh
  	define( Math, 'atanh', function atanh(x) { return Math.log((1+x)/(1-x)) / 2 }, NON_ENUM );

  	// Math.cbrt() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt
  	define( Math, 'cbrt', (function(pow) {
  		return function cbrt(x) {
  			 return x < 0 ? -pow(-x, 1/3) : pow(x, 1/3);	// ensure negative numbers remain negative
  		}
  	})(Math.pow), NON_ENUM ); // localize Math.pow to increase efficiency

  	// Math.ceil() ...

  	// Math.clz32() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
  	define( Math, 'clz32', (function(log, LN2){
  		return function clz32(x) {
  			// Let n be ToUint32(x).
  			// Let p be the number of leading zero bits in
  			// the 32-bit binary representation of n.
  			// Return p.
  			var asUint = x >>> 0;
  			if (asUint === 0) { return 32; }
  			return 31 - (log(asUint) / LN2 | 0) |0; // the "| 0" acts like math.floor
  		}
  	})(Math.log, Math.LN2), NON_ENUM );

  	// Math.cos() ...

  	// Math.cosh() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh
  	define( Math, 'cosh', function cosh(x) { return (Math.exp(x) + Math.exp(-x)) / 2; }, NON_ENUM );

  	// Math.exp() ...

  	// Math.expm1() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1
  	define( Math, 'expm1', function expm1(x) { return Math.exp(x) - 1 }, NON_ENUM );

  	// Math.floor() ...

  	// Math.fround() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
	define( Math, 'fround', (function(array32) {
		if (array32) {
			return function fround(x) { return array32[0] = x, array32[0] }
		} else {
			return function fround(arg) {
				arg = Number(arg);
				// Return early for ±0 and NaN.
				if (!arg) {return arg}
				var sign = arg < 0 ? -1 : 1;
				if (sign < 0) {arg = -arg;}
				// Compute the exponent (8 bits, signed).
				var exp = Math.floor(Math.log(arg) / Math.LN2);
				var powexp = Math.pow(2, Math.max(-126, Math.min(exp, 127)));
				// Handle subnormals: leading digit is zero if exponent bits are all zero.
				var leading = exp < -127 ? 0 : 1;
				// Compute 23 bits of mantissa, inverted to round toward zero.
				var mantissa = Math.round((leading - arg / powexp) * 0x800000);
				if (mantissa <= -0x800000) {return sign * Infinity}

				return sign * powexp * (leading - mantissa / 0x800000);
			}
		}
	})( typeof Float32Array === 'function' ? new Float32Array(1) : null ), NON_ENUM );

  	// Math.hypot() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot
  	define( Math, 'hypot', function hypot() {
  		var max = 0, s = 0, containsInfinity = false;

  		for (var i = 0, len = arguments.length; i < len; ++i) {
  			var arg = Math.abs(Number(arguments[i]));
  			if (arg === Infinity) {containsInfinity = true}
  			if (arg > max) {
  			  s *= (max / arg) * (max / arg);
  			  max = arg;
  			}
  			s += (arg === 0 && max === 0 ? 0 : (arg / max) * (arg / max));
  		}
  		return containsInfinity ? Infinity : (max === 1 / 0 ? 1 / 0 : max * Math.sqrt(s));

  	}, NON_ENUM );

  	// Math.imul() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
  	define( Math, 'imul', function imul(opA, opB) {
  		  opB |= 0; // ensure that opB is an integer. opA will automatically be coerced.
  		  // floating points give us 53 bits of precision to work with plus 1 sign bit
  		  // automatically handled for our convienence:
  		  // 1. 0x003fffff /*opA & 0x000fffff*/ * 0x7fffffff /*opB*/ = 0x1fffff7fc00001
  		  //    0x1fffff7fc00001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
  		  var result = (opA & 0x003fffff) * opB;
  		  // 2. We can remove an integer coersion from the statement above because:
  		  //    0x1fffff7fc00001 + 0xffc00000 = 0x1fffffff800001
  		  //    0x1fffffff800001 < Number.MAX_SAFE_INTEGER /*0x1fffffffffffff*/
  		  if (opA & 0xffc00000 /*!== 0*/) { result += (opA & 0xffc00000) * opB |0; }
  		  return result |0;

  	}, NON_ENUM );

  	// Math.log() ...

  	// Math.log10 polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10
  	define( Math, 'log10', function log10(x) { return Math.log(x) * Math.LOG10E }, NON_ENUM );

  	// Math.log1p() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p
  	define( Math, 'log1p', function log1p(x) {
  		x = Number(x);
  		if (x < -1 || x !== x) { return NaN }
  		if (x === 0 || x === Infinity) { return x }
  		var nearX = (x + 1) - 1;
  		return (nearX === 0 ? x : x * (Math.log(x + 1) / nearX));

  	}, NON_ENUM );

  	// Math.log2() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2
  	define( Math, 'log2', function log2(x) { return Math.log(x) * Math.LOG2E }, NON_ENUM );

  	// Math.max() ...
  	// Math.min() ...
  	// Math.pow() ...
  	// Math.random() ...
  	// Math.round() ...

  	// Math.sign() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
  	define( Math, 'sign', function sign(x) { return ((x > 0) - (x < 0)) || +x }, NON_ENUM );

  	// Math.sin() ...

  	// Math.sinh() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh
  	define( Math, 'sinh', function sinh(x) { return (Math.exp(x) - Math.exp(-x)) / 2 }, NON_ENUM );

  	// Math.sqrt() ...
  	// Math.tan() ...

  	// Math.tanh() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tanh
  	define( Math, 'tanh', function tanh(x){
  		var a = Math.exp(+x), b = Math.exp(-x);
  		return (a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (a + b))
  	}, NON_ENUM );

  	// Math.trunc() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/truncs
  	define( Math, 'trunc', function trunc(v) {
  		v = +v;
  		if (!isFinite(v)) {return v}
  		return ((v - v % 1) || (v < 0 ? -0 : v === 0 ? v : 0))
  	}, NON_ENUM );


  })();

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// --------------------------------------------------------------- Array property polyfills --------------------------------------------------------------- ///

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  (function ArrayClosure() {

	/* The IsCallable() check in the Array functions has been replaced with a strict check on the
     * internal class of the object to trap cases where the provided function was actually a regular
  	 * expression literal, which in V8 and JavaScriptCore is a typeof "function".  Only in V8 are
	 * regular expression literals permitted as reduce parameters, so it is desirable in the general
	 * case for the shim to match the more strict and common behavior of rejecting regular expressions. */

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call
	// Caution: In certain cases, thisArg may not be the actual value seen by the method.
	// If the method is a function in non-strict mode, null and undefined will be replaced with the global object,
	// and primitive values will be converted to objects.

	// Force throw TypeError on modifying String primitives, even if 'use strict' isn't supported
	// May not be future proof if MutableStrings are introduced, but an implementation
	// that supports MutableStrings will almost certainly support the native ArrayProto methods anyway.

	// `typeof T === 'undefined'` is faster than `T === undefined`

    var properlyBoxesContext = function properlyBoxed( method ) {
        // Check node 0.6.21 bug where third parameter is not boxed
        var properlyBoxesNonStrict = true;
        var properlyBoxesStrict = true;
        var threwException = false;

        if (method) {
            try { // this entire function will be in use-strict mode already if we've defined 'use strict' at the global level
			      // also properlyBoxesStrict will be false in environments that do not support 'use strict'
                method.call('foo', function (_, __, context) {
                    if (typeof context !== 'object') {
                        properlyBoxesNonStrict = false;
                    }
                });

                method.call([1], function() {
                    'use strict';
                    properlyBoxesStrict = typeof this === 'string';
                }, 'x');
            } catch (e) {
                threwException = true;
            }
        }
        return !!method && !threwException && properlyBoxesNonStrict && properlyBoxesStrict;
    };

	// ES5 15.2.3.14 | http://es5.github.io/#x15.4.4.10
	// Array.prototype.slice() bugfix | ES5-shim | Dependency | Fix boxed string bug
	define( ArrayProto, 'slice', function slice(start, end) {
		'use strict';
		var arr = isString(this) ? strSplit(this, '') : this;
		return arraySliceApply(arr, arguments);

	}, NON_ENUM, splitString );

	// ES5 15.4.3.2 | ES5-shim | http://es5.github.com/#x15.4.3.2 | https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
	define( Array, 'isArray', isArray, NON_ENUM );

	// Array.of() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
	define( Array, 'of', function of() { 'use strict'; return ArrayProto.slice.call(arguments) }, NON_ENUM );

	// Production steps of ECMA-262, Edition 6, 22.1.2.1
	// Array.from() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
	define( Array, 'from', (function() {
		'use strict';
		var symbolIterator;
		try {
		   symbolIterator = Symbol.iterator ? Symbol.iterator : 'Symbol(Symbol.iterator)';
		} catch (e) {
		   symbolIterator = 'Symbol(Symbol.iterator)';
		}

		function ToLength( value ) {
			return Math.min( Math.max( ToInteger( value ), 0 ), Number.MAX_SAFE_INTEGER );
		}

		var setGetItemHandler = function(isIterator, items) {
			var iterator = isIterator && items[symbolIterator]();
			return function(k) {
				return isIterator ? iterator.next() : items[k];
			};
		};

		var getArray = function (
			T, A, len, getItem,
			isIterator, mapFn
		) {
			// 16. Let k be 0.
			var k = 0;
			// 17. Repeat, while k < len… or while iterator is done (also steps a - h)
			while (k < len || isIterator) {
				var item = getItem(k);
				var kValue = isIterator ? item.value : item;

				if (isIterator && item.done) {
					return A;
				} else {
				if (mapFn) {
					A[k] = (typeof T === 'undefined') ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
					} else {
						A[k] = kValue;
					}
				}
				k += 1;
			}

			if (isIterator) {
				ThrowTypeErr('Array.from: provided arrayLike or iterator has .length more then 2 ** 52 - 1')
			} else {
				A.length = len;
			}
			return A
		};

		return function from ( arrayLikeOrIterator /*, mapFn, thisArg */) { // The length property of the from method is 1.
			'use strict';
			var C = this; // 1. Let C be the this value.

			// 2. Let items be ToObject(arrayLikeOrIterator).
			var items = Object( arrayLikeOrIterator );
			var isIterator = isCallable( items[symbolIterator] );

			// 3. ReturnIfAbrupt(items).
			if (arrayLikeOrIterator == null && !isIterator) {
				throw new TypeError('Array.from requires an array-like object or iterator - not null or undefined');
			}

			// 4. If mapfn is undefined, then let mapping be false.
			var mapFn = arguments.length > 1 ? arguments[1] : undefined;
			var T;
			if (typeof mapFn !== 'undefined') {
			   // 5. else
			   // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
			   if ( !isCallable( mapFn ) ) {
				   throw new TypeError('Array.from: when provided, the second argument must be a function');
			   }

			   // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
			   if (arguments.length > 2) { T = arguments[2] }
			}

			// 10. Let lenValue be Get(items, "length").
			// 11. Let len be ToLength(lenValue).
			var len = ToLength(items.length);

			// 13. If IsConstructor(C) is true, then
			// 13. a. Let A be the result of calling the [[Construct]] internal method
			// of C	 with an argument list containing the single item len.
			// 14. a. Else, Let A be ArrayCreate(len).
			var A = isCallable(C) ? Object(new C(len)) : new Array(len);

			return getArray(
				T, A, len,
				setGetItemHandler(isIterator, items),
				isIterator, mapFn
			);
		};
	})(), NON_ENUM );

	// Array.prototype.concat() ...

	// Array.prototype.copyWithin() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin

	define( ArrayProto, 'copyWithin', function copyWithin( target, start/*, end*/) {
		'use strict';

		var O = ToObject(this, ErrStr('copyWithin')); // Steps 1-2.

		var len = O.length >>> 0; // Steps 3-5.

		var relativeTarget = target >> 0; // Steps 6-8.

		var to = relativeTarget < 0 ?
			max(len + relativeTarget, 0) : min(relativeTarget, len);

		// Steps 9-11.
		var relativeStart = start >> 0;

		var from = relativeStart < 0 ?
			max(len + relativeStart, 0) : min(relativeStart, len);

		// Steps 12-14.
		var end = arguments[2];
		var relativeEnd = (end === undefined) ? len : end >> 0;

		var last = relativeEnd < 0 ?
			max(len + relativeEnd, 0) : min(relativeEnd, len);

		// Step 15.
		var count = min(last - from, len - to);

		// Steps 16-17.
		var direction = 1;

		if (from < to && to < (from + count)) {
			direction = -1;
			from += count - 1;
			to += count - 1;
		}

		if ( isString( O ) ) { throw ErrReadOnly('copyWithin', O, to) } // Note 1

		// Step 18.
		while (count > 0) {
			if (from in O) {
				O[to] = O[from]; // *
			} else {
				delete O[to]; // *
			}

			from += direction;
			to += direction;
			count--;
		}

		// Step 19.
		return O;

	}, NON_ENUM );

	// Array.prototype.entries() !! No polyfill found, but wanted.

	// ES5 15.4.4.16 | http://es5.github.com/#x15.4.4.16
	// Array.prototype.every() polyfix | ES5-shim | https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
	define( ArrayProto, 'every', function every( callback ) {
		'use strict';

		var O = ToObject(this, ErrStr('every'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;
		var T;
		if (arguments.length > 1) { T = arguments[1]; }

		// If no callback function or if callback is not a callable function
		if (!isCallable( callback )) { ThrowCallErr('every', callback) }

		for (var i = 0; i < length; i++) {
			if (i in self && !(typeof T === 'undefined' ? callback(self[i], i, O) : callback.call(T, self[i], i, O))) {
				return false;
			}
		}
		return true;

	}, NON_ENUM, !properlyBoxesContext( ArrayProto.every ));


	// Array.prototype.fill() polyfill | MDN # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
	define( ArrayProto, 'fill', function fill( value ) {
		"use strict";
		var O = ToObject(this, ErrStr('fill')); // Steps 1-2.

		var len = O.length >>> 0; // Steps 3-5.

		// Steps 6-7.
		var start = arguments[1];
		var relativeStart = start >> 0;

		// Step 8.
		var k = relativeStart < 0 ?
			Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);

		// Steps 9-10.
		var end = arguments[2];
		var relativeEnd = end === undefined ? len : end >> 0;

		// Step 11.
		var finalValue = relativeEnd < 0 ?
			Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);

		if (isString(O)) { throw ErrReadOnly('fill', O, k ) } // Note 1:

		// Step 12
		while (k < finalValue) {
			O[k] = value; // *
			k++;
		}

		return O; // Step 13.

	} , NON_ENUM );

	// ES5 15.4.4.20 | http://es5.github.com/#x15.4.4.20
	// Array.prototype.filter() polyfix | ES5-shim | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter

	define( ArrayProto, 'filter', function filter(callback/*, thisArg*/) {
		'use strict';

		var O = ToObject(this, ErrStr('filter'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;
		var result = [], value;
		var T;

		if (arguments.length > 1) { T = arguments[1] }

		if ( !isCallable( callback ) ) { ThrowCallErr('filter', callback) }

		for (var i = 0; i < length; i++) {
			if (i in self) {
				value = self[i];
				if (typeof T === 'undefined' ? callback(value, i, O) : callback.call(T, value, i, O)) {
					pushCall(result, value);
				}
			}
		}
		return result;

    }, NON_ENUM, !properlyBoxesContext( ArrayProto.filter ) )

	// https://tc39.github.io/ecma262/#sec-array.prototype.find
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	// Array.prototype.find() polyfix | ES5-shim (# extended) |

	define( ArrayProto, 'find', function find( predicate ) {
		'use strict';
		var O = ToObject(this, ErrStr('find')); // 1. Let O be ? ToObject(this value).

		var self = HandleUnboxedString(this) || O;
		// 2. Let len be ? ToLength(? Get(O, "length")).
		var len = self.length >>> 0;

		// 3. If IsCallable(predicate) is false, throw a TypeError exception.
		if ( !isCallable( predicate ) ) { ThrowCallErr('find', callback) }

		// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
		var thisArg = arguments[1];
		// 5. Let k be 0.
		var k = 0;

		// 6. Repeat, while k < len
		while (k < len) {
			// a. Let Pk be ! ToString(k).
			// b. Let kValue be ? Get(O, Pk).
			// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
			// d. If testResult is true, return kValue.
			var kValue = self[k];
			if (predicate.call(thisArg, kValue, k, self)) { return kValue }
		 	// e. Increase k by 1.
			k++;
		}
		// 7. Return undefined.
		return;

	}, NON_ENUM, !properlyBoxesContext( ArrayProto.find ) );

	// Array.prototype.findIndex() polyfix | ES5-shim (# extended) | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
	define( ArrayProto, 'findIndex', function findIndex( predicate ) {
		'use strict';
		var O = ToObject(this, ErrStr('findIndex'));

		var self = HandleUnboxedString(this) || O;

		// 2. Let len be ? ToLength(? Get(O, "length")).
		var len = self.length >>> 0;

		// 3. If IsCallable(predicate) is false, throw a TypeError exception.
		if ( !isCallable( predicate ) ) { ThrowCallErr('findIndex', predicate ) }

		// 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
		var thisArg = arguments[1];
		// 5. Let k be 0.
		var k = 0;

		// 6. Repeat, while k < len
		while (k < len) {
			// a. Let Pk be ! ToString(k).
			// b. Let kValue be ? Get(O, Pk).
			// c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
			// d. If testResult is true, return k.
			var kValue = self[k];
			if (predicate.call(thisArg, kValue, k, self)) { return k }
			// e. Increase k by 1.
			k++;
		}

		// 7. Return -1.
		return -1;

	}, NON_ENUM, !properlyBoxesContext( ArrayProto.findIndex ) );

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
	// github.com/jonathantneal/array-flat-polyfill
	// Array.prototype.flat() polyfill | # |
	define( ArrayProto, 'flat', function flat() {
		'use strict';

		var O = ToObject(this, ErrStr('flat'));

		var depth = isNaN(arguments[0]) ? 1 : Number(arguments[0]);

		return depth ? ArrayProto.reduce.call( O , function (acc, cur) {
			if (Array.isArray(cur)) {
				acc.push.apply(acc, flat.call(cur, depth - 1));
			} else {
				acc.push(cur);
			}

			return acc;
		}, []) : ArrayProto.slice.call( O );

	}, NON_ENUM );

//	// Array.prototype.flatMap() !! polyfill wanted, creatable

	// ES5 15.4.4.18 | http://es5.github.com/#x15.4.4.18
	// Array.prototype.forEach() polyfix | ES5-shim | https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach
	define( ArrayProto, 'forEach', function forEach( callback ) {
		'use strict';

		var O = ToObject(this, ErrStr('forEach'));

		var self = HandleUnboxedString(this) || O; // for String[index] access in IE<9, Rhino, etc.
        var i = -1;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) { T = arguments[1] }

        // If no callback function or if callback is not a callable function
        if ( !isCallable(callback) ) { ThrowCallErr('foreach', callback ) }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg O
                if (typeof T === 'undefined') {
                    callback(self[i], i, O);
                } else {
                    callback.call(T, self[i], i, O);
                }
            }
        }

    }, NON_ENUM, !properlyBoxesContext( ArrayProto.forEach ));

	// Array.prototype.includes() !! polyfill wanted, creatable

	// ES5 15.4.4.14 | http://es5.github.com/#x15.4.4.14
    var hasFirefox2IndexOfBug = ArrayProto.indexOf && [0, 1].indexOf(1, 2) !== -1;

	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
	// Array.prototype.indexOf() polyfix | ES5-shim |

	define( ArrayProto, 'indexOf', function indexOf( searchElement ) {
		'use strict';

		var O = ToObject(this, ErrStr('indexOf'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;
		var i = 0;

		if (length === 0) { return -1 }

		if (arguments.length > 1) { i = ToInteger(arguments[1]) }

		// handle negative indices
		i = i >= 0 ? i : max(0, length + i);
		for (; i < length; i++) {
			if (i in self && self[i] === searchElement) {
				return i;
			}
		}
		return -1;

    }, NON_ENUM, hasFirefox2IndexOfBug );

	/*	It is possible that a native implementation can have more than one bug simultaneously
		Therefore, unlike es5-shim.js, we parse each bugfix sequentially, rather than separately.
	*/

	// Array.prototype.join -----------------------------------------------------

	var hasStringJoinBug = (function() {
		try { return ArrayProto.join.call('123', ',') !== '1,2,3' } catch (e) { return true }
	})();

	// Bugfix 1: Array.prototype.join()
	define( ArrayProto, 'join', (function( originalJoin ) {

		return function join( separator ) {
			'use strict';
			var sep = (separator === undefined) ? ',' : separator;
			return originalJoin.call( (isString(this) ? strSplit(this, '') : this) , sep);

		}

	})( ArrayProto.join ), NON_ENUM, hasStringJoinBug ); // only overwrites if the bug exists

	var hasJoinUndefinedBug = [1, 2].join(undefined) !== '1,2';
	// Bugfix 2: Array.prototype.join()
	define( ArrayProto, 'join', (function( originalJoin2 ) {

		return function join( separator ) {
			'use strict';
			var sep = (separator === undefined) ? ',' : separator;
			return originalJoin2.call(this, sep);

	    }

	})( ArrayProto.join ), NON_ENUM, hasJoinUndefinedBug );

	// ES5 15.4.4.15 | http://es5.github.com/#x15.4.4.15
    var hasFirefox2LastIndexOfBug = (ArrayProto.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1);

	// Array.prototype.lastIndexOf() polyfix | ES5-shim | https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
	define( ArrayProto, 'lastIndexOf', function lastIndexOf(searchElement/*, fromIndex */) {
		'use strict';

		var O = ToObject(this, ErrStr('lastIndexOf'));

		var self = HandleUnboxedString(this) || O;

		var length = self.length >>> 0;

		if (length === 0) { return -1 }

		var i = length - 1;
		if (arguments.length > 1) {
			i = min(i, ToInteger(arguments[1]));
		}
		// handle negative indices
		i = i >= 0 ? i : length - Math.abs(i);
		for (; i >= 0; i--) {
			if (i in self && searchElement === self[i]) {
				return i;
			}
		}
		return -1;

    }, NON_ENUM, hasFirefox2LastIndexOfBug );

	// Array.prototype.length ...

	// ES5 15.4.4.19 | http://es5.github.com/#x15.4.4.19
	// Array.prototype.map() polyfix | ES5-shim | https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
    define( ArrayProto, 'map', function map( callback/*, thisArg*/) {
		'use strict';

		var O = ToObject(this, ErrStr('map'));

        var self = HandleUnboxedString(this) || O;
        var length = self.length >>> 0;
        var result = Array(length);
        var T;
        if (arguments.length > 1) { T = arguments[1] }

        // If no callback function or if callback is not a callable function
        if ( !isCallable( callback ) ) { ThrowCallErr('map', callback ) }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                if (typeof T === 'undefined') {
                    result[i] = callback(self[i], i, O);
                } else {
                    result[i] = callback.call(T, self[i], i, O);
                }
            }
        }
        return result;

	}, NON_ENUM , !properlyBoxesContext( ArrayProto.map ) );

	// Array.prototype.push() (moved to sort() for grouping purposes)

	// ES5 15.4.4.21 | http://es5.github.com/#x15.4.4.21
	var reduceCoercesToObject = ( ArrayProto.reduce &&
		(typeof ArrayProto.reduce.call('es5', function (_, __, ___, list) {
            return list
        }) === 'object')
	);

	var rOfEmpty = 'reduce of empty with no initial value';
	// Array.prototype.reduce() polyfix | ES5-shim | https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
	define( ArrayProto, 'reduce', function reduce( callback/*, initialValue*/) {
		'use strict';

		var O = ToObject(this, ErrStr('reduce'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;
		var i = 0, result;

		// If no callback function or if callback is not a callable function
		if ( !isCallable( callback ) ) { ThrowCallErr('reduce', callback ) }
		// no value to return if no initial value and an empty array
		if (length === 0 && arguments.length === 1) { throw new TypeError( rOfEmpty ) }

		if (arguments.length >= 2) { result = arguments[1] }
		else {
			do {
				if (i in self) {
					result = self[i++]; break;
				}
				// if array contains no values, no initial value to return
				if (++i >= length) { throw new TypeError( rOfEmpty ) }

			} while (true);
		}

		for (; i < length; i++) {
			if (i in self) {
				result = callback(result, self[i], i, O);
			}
		}
		return result;

	}, NON_ENUM, !reduceCoercesToObject );

	// ES5 15.4.4.22 | http://es5.github.com/#x15.4.4.22
	var reduceRightCoercesToObject = ( ArrayProto.reduceRight &&
		(typeof ArrayProto.reduceRight.call('es5', function (_, __, ___, list) {
			return list
		}) === 'object')
	);

	var rrOfEmpty = 'reduceRight of empty array with no initial value!';
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
	// Array.prototype.reduceRight() polyfix | ES5-shim |
	define( ArrayProto, 'reduceRight', function reduceRight(callback/*, initial*/) {
		'use strict';

		var O = ToObject(this, ErrStr('reduceRight'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;

		// If no callback function or if callback is not a callable function
		if ( !isCallable( callback ) ) { ThrowCallErr('reduceRight', callback ) }

		// no value to return if no initial value, empty array
		if (length === 0 && arguments.length === 1) { throw new TypeError( rrOfEmpty ) }

		var result, i = length - 1;
		if (arguments.length >= 2) { result = arguments[1] }
		else {
			do {
				if (i in self) {
					result = self[i--]; break;
				}

				// if array contains no values, no initial value to return
				if (--i < 0) { throw new TypeError( rrOfEmpty ) }

			} while (true);
		}

		if (i < 0) { return result }

		do {
			if (i in self) {
				result = callback(result, self[i], i, O);
			}
		} while (i--);

		return result;

    }, NON_ENUM, !reduceRightCoercesToObject );

	// Array.prototype.reverse() ...
	// Array.prototype.shift() ...
	// Array.prototype.slice() - Moved to Array.of

    // ES5 15.4.4.17 | http://es5.github.com/#x15.4.4.17
    // Array.prototype.some() polyfix | ES5-shim | https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
	define( ArrayProto, 'some', function some( callback/*, thisArg */) {
		'use strict';
		var O = ToObject(this, ErrStr('some'));

		var self = HandleUnboxedString(this) || O;
		var length = self.length >>> 0;
		var T;
		if (arguments.length > 1) { T = arguments[1] }

		// If no callback function or if callback is not a callable function
		if ( !isCallable( callback ) ) { ThrowCallErr('some', callback ) }

		for (var i = 0; i < length; i++) {
			if (i in self && (typeof T === 'undefined' ? callback(self[i], i, O) : callback.call(T, self[i], i, O))) {
				return true
			}
		}
		return false;

	}, NON_ENUM, !properlyBoxesContext( ArrayProto.some ) );

	// Array.prototype.push() ----------------------------------------------------------------------------
	// checked!
	(function ArrayPushClosure() {
		// cant name var as `push` due to NFE inner scope self-referencing
		var _pushShim = function push(item) {
			'use strict';
			var O = ToObject(this, ErrStr('push'));
			var n = O.length >>> 0;
			var i = 0;

			if (isString(O)) {
				throw new TypeError("Cannot assign to read only property 'length' of object '[object String]'");
			}
			while (i < arguments.length) {
				O[n + i] = arguments[i];
				i += 1;
			}
			O.length = n + i;
			return n + i;
		};

		var pushIsNotGeneric = (function(obj) {
			var result = ArrayProto.push.call(obj, undefined);
			return result !== 1 || obj.length !== 1 || typeof obj[0] !== 'undefined' || !owns(obj, 0);
		})({});

		// Bugfix 1: Array.prototype.push()
		define( ArrayProto, 'push', function push(item) { 'use strict';

			return isArray(this) ? array_push.apply(this, arguments) : _pushShim.apply(this, arguments);

		}, NON_ENUM, pushIsNotGeneric );

		// This fixes a very weird bug in Opera 10.6 when pushing `undefined
		var pushUndefinedIsWeird = (function(arr) {
			var result = arr.push(undefined);
			return result !== 1 || arr.length !== 1 || typeof arr[0] !== 'undefined' || !owns(arr, 0);
		})([]);

		// Bugfix 2: Array.prototype.push() | For this case, we actually do want to overwrite the previous bugfix
		define( ArrayProto, 'push', _pushShim, NON_ENUM, pushUndefinedIsWeird);

	})();

	// Array.prototype.sort() ----------------------------------------------------------------------------
	// checked!
	(function ArraySortClosure() {

	    var sortIgnoresNonFunctions = (function() {
	        try { [1, 2].sort(null) } catch (e) {
	            try { [1, 2].sort({}) } catch (e2) { return false }
	        } return true
	    })();

	    var sortThrowsOnRegex = (function() { // this is a problem in Firefox 4, in which `typeof /a/ === 'function'`
	        try { [1, 2].sort(/a/); return false } catch (e) {} return true
	    })();

	    var sortIgnoresUndefined = (function() { // applies in IE 8, for one.
	        try { [1, 2].sort(undefined); return true } catch (e) {} return false
	    })();

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
		// Array.prototype.sort() bugfix | ES5-shim |
		define( ArrayProto, 'sort', function sort(compareFn) { 'use strict';

			if (typeof compareFn === 'undefined') {
				return arraySort( this )
			}
			if ( !isCallable( compareFn ) ) { ThrowCallErr('sort', compareFn ) }
			return arraySort(this, compareFn);

		}, NON_ENUM, (sortIgnoresNonFunctions || !sortIgnoresUndefined || !sortThrowsOnRegex) );

	})();

	// Array.prototype.splice() --------------------------------------------------------------------------
	// checked!
	(function ArraySpliceClosure() {

		var spliceNoopReturnsEmptyArray = (function( arr ) {
			// Safari 5.0 bug where .splice() returns undefined
			var result = arr.splice();
			return arr.length === 2 && isArray(result) && result.length === 0;
		})([1,2]);

		// Bugfix 1: Array.prototype.splice() | ES5 15.4.4.12 | http://es5.github.com/#x15.4.4.12 |
		define( ArrayProto, 'splice', function splice(start, deleteCount) { 'use strict';

			return (arguments.length === 0) ? [] : array_splice.apply(this, arguments);

	    }, NON_ENUM, !spliceNoopReturnsEmptyArray );


		var spliceWorksWithEmptyObject = (function( obj ) {
			ArrayProto.splice.call(obj, 0, 0, 1); return obj.length === 1;
		})({});

		// Bugfix 2: Array.prototype.splice()
		define( ArrayProto, 'splice', (function( bugfixed_splice_one ) {

			return function splice(start, deleteCount) {
				"use strict"; // Ensure sameness of errors where possible

				if (arguments.length === 0) { return [] }
				var args = arguments;
				this.length = max( ToInteger( this.length ), 0); //*
				if (arguments.length > 0 && typeof deleteCount !== 'number') {
					args = arraySlice(arguments);
					if (args.length < 2) {
						pushCall(args, this.length - start);
					} else {
						args[1] = ToInteger(deleteCount);
					}
				}
				return bugfixed_splice_one.apply(this, args);

			}

		})( ArrayProto.splice ), NON_ENUM, !spliceWorksWithEmptyObject );

		// Per https://github.com/es-shims/es5-shim/issues/295
		// Safari 7/8 breaks with sparse arrays of size 1e5 or greater
		// note: the index MUST be 8 or larger or the test will false pass

	    var spliceWorksWithLargeSparseArrays = (function( arr ) {
			arr[8] = 'x';
			arr.splice(1, 1);
			// note: this test must be defined *after* the indexOf shim
			// per https://github.com/es-shims/es5-shim/issues/313
			return arr.indexOf('x') === 7;
		})( new $Array(1e5) );

		var spliceWorksWithSmallSparseArrays = (function() {
			// Per https://github.com/es-shims/es5-shim/issues/295
			// Opera 12.15 breaks on this, no idea why.
			var n = 256, arr = [];
			arr[n] = 'a';
			arr.splice(n + 1, 0, 'b');
			return arr[n] === 'a'
		})();

		// Bugfix 3: Array.prototype.splice()
		define( ArrayProto, 'splice', function splice(start, deleteCount) {
			"use strict"; // Ensure sameness of errors where possible

			var O = ToObject(this, ErrStr('splice'));
			var A = [];
			var len = O.length >>> 0;

			var relativeStart = ToInteger(start);
			var actualStart = relativeStart < 0 ? max((len + relativeStart), 0) : min(relativeStart, len);
			var actualDeleteCount = arguments.length === 0
				? 0
				: arguments.length === 1
					? len - actualStart
					: min( max( ToInteger(deleteCount), 0), len - actualStart);

			var k = 0;
			var from;
			while (k < actualDeleteCount) {
				from = String(actualStart + k);
				if (owns(O, from)) {
					A[k] = O[from];
				}
				k += 1;
			}

			var items = arraySlice(arguments, 2);
			var itemCount = items.length;
			var to;
			if (itemCount < actualDeleteCount) {
				k = actualStart;
				var maxK = len - actualDeleteCount;
				while (k < maxK) {
					from = String(k + actualDeleteCount);
					to = String(k + itemCount);
					if (owns(O, from)) {
						O[to] = O[from];
					} else {
						delete O[to];
					}
					k += 1;
				}
				k = len;
				var minK = len - actualDeleteCount + itemCount;
				while (k > minK) {
					delete O[k - 1];
					k -= 1;
				}
			} else if (itemCount > actualDeleteCount) {
				k = len - actualDeleteCount;
				while (k > actualStart) {
					from = String(k + actualDeleteCount - 1);
					to = String(k + itemCount - 1);
					if (owns(O, from)) {
						O[to] = O[from];
					} else {
						delete O[to];
					}
					k -= 1;
				}
			}
			k = actualStart;

			if (isString(O)) { throw ErrReadOnly('splice', O, k) } // backup error

			for (var i = 0; i < items.length; ++i) {
				O[k] = items[i];
				k += 1;
			}
			O.length = len - actualDeleteCount + itemCount;

			return A;

		}, NON_ENUM, (!spliceWorksWithLargeSparseArrays || !spliceWorksWithSmallSparseArrays) );

	})(); // end of Array.prototype.splice

})();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// -------------------------------------------------------- Object Property Polyfills ---------------------------------------------------- ///

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// Object.prototype.hasOwnProperty : beginning of program

    // ES5 15.2.3.14 | http://es5.github.com/#x15.2.3.14
	// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation

  (function ObjectClosure() { // Object Closure Wrapper

    var hasDontEnumBug = !isEnum({ 'toString': null }, 'toString'); // jscs:ignore disallowQuotedKeysInObjects
    var hasProtoEnumBug = isEnum(function() {}, 'prototype');
    var hasStringEnumBug = !owns('x', '0');

    var equalsConstructorPrototype = function (o) {
        var ctor = o.constructor; return ctor && ctor.prototype === o;
    };

	var excludedKeys = (function( obj ) {
		var keys = [
			'applicationCache','console','external',
			'frame','frameElement','frames',
			'innerHeight','innerWidth','onmozfullscreenchange',
			'onmozfullscreenerror','outerHeight','outerWidth',
			'pageXOffset','pageYOffset','parent',
			'scrollLeft','scrollTop','scrollX',
			'scrollY','self','webkitIndexedDB',
			'webkitStorageInfo','window','width',
			'height','top','localStorage'
		];
		for (var i=0;i<keys.length;i++) { obj[ '$'+ keys[i] ] = true }
		return obj;
	})( {} );

    var hasAutomationEqualityBug = (function() {
		if (context !== 'window') { return false } 	/* globals window */
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && owns(window, k) && window[k] !== null && typeof window[k] === 'object') {
					equalsConstructorPrototype(window[k]);
				}
			} catch (e) { return true }
		}
		return false
    })();

    var equalsConstructorPrototypeIfNotBuggy = function ( object ) {
        if (context !== 'window' || !hasAutomationEqualityBug) {
            return equalsConstructorPrototype(object);
        }
        try {
            return equalsConstructorPrototype(object);
        } catch (e) {
			return false
		}
    };

    var dontEnums = [
        'toString','toLocaleString','valueOf', 'hasOwnProperty','isPrototypeOf',
        'propertyIsEnumerable','constructor'
    ];

    var dontEnumsLength = dontEnums.length;

    // taken directly from https://github.com/ljharb/is-arguments/blob/master/index.js
    // can be replaced with require('is-arguments') if we ever use a build process instead
    var isStandardArguments = function isArguments(value) { return toStr(value) === '[object Arguments]' };

    var isLegacyArguments = function isArguments(value) {
        return value !== null
            && typeof value === 'object'
            && typeof value.length === 'number'
            && value.length >= 0
            && !isArray( value )
            && isCallable( value.callee ); // .callee ?!
    };

    var isArguments = isStandardArguments( arguments ) ? isStandardArguments : isLegacyArguments;

	// Object.is() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
	define( Object, 'is', function is( x, y ) {
		 // SameValue algorithm
		if (x === y) { // Steps 1-5, 7-10
			// Steps 6.b-6.e: +0 != -0
			return x !== 0 || 1 / x === 1 / y;
		} else {
			// Step 6.a: NaN == NaN
			return x !== x && y !== y;
		}
	}, NON_ENUM );

	// Object.keys() polyfix | ES5-shim | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
	define( Object, 'keys', function keys(object) {

		var isFn = isCallable( object );
		var isArgs = isArguments( object );
		var isObject = object !== null && typeof object === 'object';
		var isStr = isObject && isString(object);

		if (!isObject && !isFn && !isArgs) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var theKeys = [];
		var skipProto = hasProtoEnumBug && isFn;
		if ((isStr && hasStringEnumBug) || isArgs) {
			for (var i = 0; i < object.length; ++i) {
				pushCall(theKeys, $String(i));
			}
		}

		if (!isArgs) {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && owns(object, name)) {
					pushCall(theKeys, $String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
			for (var j = 0; j < dontEnumsLength; j++) {
				var dontEnum = dontEnums[j];
				if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
					pushCall(theKeys, dontEnum);
				}
			}
		}
		return theKeys;

	}, NON_ENUM );

	var keysWorksWithArguments = (Object.keys && (function() { // Safari 5.0 bug
		return Object.keys(arguments).length === 2;
	})( 1, 2 ));

	var keysHasArgumentsLengthBug = (Object.keys && (function() {
		var argKeys = Object.keys(arguments);
		return arguments.length !== 1 || argKeys.length !== 1 || argKeys[0] !== 1;
	})( 1 ));

	// Object.keys() bugfix 2
	define( Object, 'keys', (function( originalKeys ) {
		return function keys( object ) {
            if ( isArguments( object ) ) {
				// this is old Array.prototype.slice before bugfixes,
				// but arguments will never be a string
                return originalKeys( arraySlice( object ) );
            } else {
                return originalKeys( object );
            }
        }
	})( Object.keys ), NON_ENUM, (!keysWorksWithArguments || keysHasArgumentsLengthBug) );

  })(); // End of Object Closure

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// --------------------------------------------------------- String property polyfills ----------------------------------------------------------- ///

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  (function StringClosure() {
	// String.fromCodePoint() polyfill | MDN | # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint
	define( String, 'fromCodePoint', (function( stringFromCharCode ) {

		return function fromCodePoint() {

			var codeUnits = [], codeLen = 0, result = "";

			for (var index = 0, len = arguments.length; index !== len; ++index) {

				var codePoint = +arguments[index];
				// correctly handles all cases including `NaN`, `-Infinity`, `+Infinity`
				// The surrounding `!(...)` is required to correctly handle `NaN` cases
				// The (codePoint>>>0) === codePoint clause handles decimals and negatives
				if (!(codePoint < 0x10FFFF && (codePoint >>> 0) === codePoint)) { throw RangeError("Invalid code point: " + codePoint) }
				if (codePoint <= 0xFFFF) { // BMP code point
					codeLen = codeUnits.push(codePoint);
				} else { // Astral code point; split in surrogate halves
				  // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
					codePoint -= 0x10000;
					codeLen = codeUnits.push(
						(codePoint >> 10) + 0xD800,  // highSurrogate
						(codePoint % 0x400) + 0xDC00 // lowSurrogate
					);
				}
				if (codeLen >= 0x3fff) {
				  result += stringFromCharCode.apply(null, codeUnits);
				  codeUnits.length = 0;
				}
			}
			return result + stringFromCharCode.apply(null, codeUnits);
		}

	})( String.fromCharCode ), NON_ENUM );

	// String.prototype.codePointAt() polyfill | MDN | # | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
	// https://mths.be/codepointat v0.2.0 by @mathias

	define( StringProto, 'codePointAt', function codePointAt( position ) {

		  if (this == null) { throw new TypeError('String.prototype.codePointAt called on null or undefined!') }
		  var string = String(this);
		  var size = string.length;
		  // `ToInteger`
		  var index = position ? Number(position) : 0;
		  if (index != index) { index = 0 }  // better `isNaN`

		  // Account for out-of-bounds indices:
		  if (index < 0 || index >= size) { return undefined }
		  // Get the first code unit
		  var first = string.charCodeAt(index);
		  var second;
		  if ( // check if it’s the start of a surrogate pair
			first >= 0xD800 && first <= 0xDBFF && // high surrogate
			size > index + 1 // there is a next code unit
		  ) {
			second = string.charCodeAt(index + 1);
			if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
			  // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
			  return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
			}
		  }
		  return first;

	}, NON_ENUM );

	// String.prototype.trim defined  earlier
	// String.prototype.includes() polyfill | MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes#Polyfill
	define( StringProto, 'includes', function includes(search, start) {
		'use strict';

		if (search instanceof RegExp) { throw new TypeError('first argument must not be a RegExp') }
		if (typeof start === 'undefined') { start = 0 }

		return (this.indexOf(search, start) !== -1);

	}, NON_ENUM )

    // ES5 15.5.4.14 | http://es5.github.com/#x15.5.4.14
    // [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
    // Many browsers do not split properly with regular expressions or they
    // do not perform the split correctly under obscure conditions.
    // See http://blog.stevenlevithan.com/archives/cross-browser-split
    // I've tested in many browsers and this seems to cover the deviant ones:
    //    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
    //    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
    //    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
    //       [undefined, "t", undefined, "e", ...]
    //    ''.split(/.?/) should be [], not [""]
    //    '.'.split(/()()/) should be ["."], not ["", "", "."]

	var hasBuggySplitRegex = (
		'ab'.split(/(?:ab)*/).length !== 2
		|| '.'.split(/(.?)(.?)/).length !== 4
		|| 'tesst'.split(/(s)*/)[1] === 't'
		|| 'test'.split(/(?:)/, -1).length !== 4
		|| ''.split(/.?/).length
		|| '.'.split(/()()/).length > 1
	);

    if ( hasBuggySplitRegex ) {
      (function () {
        var compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group
        var maxSafe32BitInt = Math.pow(2, 32) - 1;

		define( StringProto, 'split', function split(separator, limit) {

            var string = String(this);
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }
            // If `separator` is not a regex, use native split
            if (!isRegex( separator )) {
                return strSplit(this, separator, limit);
            }
            var output = [];
            var flags = (separator.ignoreCase ? 'i' : '')
                        + (separator.multiline ? 'm' : '')
                        + (separator.unicode ? 'u' : '') // in ES6
                        + (separator.sticky ? 'y' : ''), // Firefox 3+ and ES6
                lastLastIndex = 0,
                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;
            var separatorCopy = new RegExp(separator.source, flags + 'g');
            if (!compliantExecNpcg) {
                // Doesn't need flags gy, but they don't hurt
                separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
            }
            /* Values for `limit`, per the spec:
             * If undefined: 4294967295 // maxSafe32BitInt
             * If 0, Infinity, or NaN: 0
             * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
             * If negative number: 4294967296 - Math.floor(Math.abs(limit))
             * If other: Type-convert, then use the above rules
             */
            var splitLimit = typeof limit === 'undefined' ? maxSafe32BitInt : ToUint32(limit);
            match = separatorCopy.exec(string);
            while ( match ) {
                // `separatorCopy.lastIndex` is not reliable cross-browser
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    pushCall(output, strSlice(string, lastLastIndex, match.index));
                    // Fix browsers whose `exec` methods don't consistently return `undefined` for
                    // nonparticipating capturing groups
                    if (!compliantExecNpcg && match.length > 1) {
                        /* eslint-disable no-loop-func */
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (typeof arguments[i] === 'undefined') {
                                    match[i] = void 0;
                                }
                            }
                        });
                        /* eslint-enable no-loop-func */
                    }
                    if (match.length > 1 && match.index < string.length) {
                        array_push.apply(output, arraySlice(match, 1));
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= splitLimit) {
                        break;
                    }
                }
                if (separatorCopy.lastIndex === match.index) {
                    separatorCopy.lastIndex++; // Avoid an infinite loop
                }
                match = separatorCopy.exec(string);
            }
            if (lastLastIndex === string.length) {
                if (lastLength || !separatorCopy.test('')) {
                    pushCall(output, '');
                }
            } else {
                pushCall(output, strSlice(string, lastLastIndex));
            }
            return output.length > splitLimit ? arraySlice(output, 0, splitLimit) : output;

        }, NON_ENUM, true);
      })();

    // [bugfix, chrome]
    // If separator is undefined, then the result array contains just one String,
    // which is the this value (converted to a String). If limit is not undefined,
    // then the output array is truncated so that it contains no more than limit
    // elements.
    // "0".split(undefined, 0) -> []
	} else if ('0'.split(undefined, 0).length) {
		define( StringProto, 'split', function split(separator, limit) {
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }
            return strSplit(this, separator, limit);
        }, NON_ENUM, true);
    }

    var replaceReportsGroupsCorrectly = (function () {
        var groups = [];
        'x'.replace(/x(.)?/g, function (match, group) {
            pushCall(groups, group);
        });
        return groups.length === 1 && typeof groups[0] === 'undefined';
    })();

	// String.prototype.replace() bugfix
	define( StringProto, 'replace', (function( str_replace ) {

		return function replace( searchValue, replaceValue ) {
            var isFn = isCallable( replaceValue );
            var hasCapturingGroups = isRegex( searchValue ) && (/\)[*?]/).test(searchValue.source);
            if (!isFn || !hasCapturingGroups) {
                return str_replace.call(this, searchValue, replaceValue);
            } else {
                var wrappedReplaceValue = function(match) {
                    var length = arguments.length;
                    var originalLastIndex = searchValue.lastIndex;
                    searchValue.lastIndex = 0; // eslint-disable-line no-param-reassign
                    var args = searchValue.exec(match) || [];
                    searchValue.lastIndex = originalLastIndex; // eslint-disable-line no-param-reassign
                    pushCall(args, arguments[length - 2], arguments[length - 1]);
                    return replaceValue.apply(this, args);
                };
                return str_replace.call(this, searchValue, wrappedReplaceValue);
            }
        }
	})( StringProto.replace ), NON_ENUM, replaceReportsGroupsCorrectly );

    // ECMA-262, 3rd B.2.3
    // Not an ECMAScript standard, although ECMAScript 3rd Edition has a
    // non-normative section suggesting uniform semantics and it should be
    // normalized across all browsers
    // [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE

    var hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';

	// String.prototype.substr() bugfix
	define( StringProto, 'substr', (function( string_substr ) {

		return function substr(start, length) {
	        var normalizedStart = start;
	        if (start < 0) {
	            normalizedStart = max(this.length + start, 0);
	        }
	        return string_substr.call(this, normalizedStart, length);
		}

	})( StringProto.substr ), NON_ENUM, hasNegativeSubstrBug );


    var hasLastIndexBug = StringProto.lastIndexOf && 'abcあい'.lastIndexOf('あい', 2) !== -1;

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf
	// String.prototype.lastIndexOf() polyfix | ES5-shim | # |
	define( StringProto, 'lastIndexOf', function lastIndexOf( searchString ) {

        if (this == null) {
            throw new TypeError('String.prototype.lastIndexOf called on null or undefined!');
        }
        var S = $String(this);
        var searchStr = $String(searchString);
        var numPos = arguments.length > 1 ? $Number(arguments[1]) : NaN;
        var pos = isActualNaN(numPos) ? Infinity : ToInteger(numPos);
        var start = min(max(pos, 0), S.length);
        var searchLen = searchStr.length;
        var k = start + searchLen;
        while (k > 0) {
            k = max(0, k - searchLen);
            var index = strIndexOf(strSlice(S, k, start + searchLen), searchStr);
            if (index !== -1) {
                return k + index;
            }
        }
        return -1;

    }, NON_ENUM, hasLastIndexBug ); // Nightlane - Dead Flowers


	var hasLastIndexOfLengthBug = StringProto.lastIndexOf.length !== 1;

	// Bugfix 2: String.prototype.lastIndexOf()
	define( StringProto, 'lastIndexOf', (function ( originalLastIndexOf ) {

		return function lastIndexOf( searchString ) {
            return originalLastIndexOf.apply(this, arguments);
        }

	})( StringProto.lastIndexOf ), NON_ENUM, hasLastIndexOfLengthBug );


	var hasRangeErrorBug = (String(new RangeError('test')) !== 'RangeError: test');

	// Error.prototype.toString() bugfix
	define( ErrorProto, 'toString', function toString() {

		if (this == null) { throw new TypeError('Error.prototype.toString called on null or undefined!') }
        var name = this.name;
        if (typeof name === 'undefined') {
            name = 'Error';
        } else if (typeof name !== 'string') {
            name = $String(name);
        }
        var msg = this.message;
        if (typeof msg === 'undefined') {
            msg = '';
        } else if (typeof msg !== 'string') { msg = $String(msg) }

        if (!name) { return msg }
        if (!msg) { return name }
        return name + ': ' + msg;

    }, NON_ENUM, hasRangeErrorBug );

    if (supportsDescriptors) {
        var ensureNonEnumerable = function (obj, prop) {
            if (isEnum(obj, prop)) {
                var desc = Object.getOwnPropertyDescriptor(obj, prop);
                if (desc.configurable) {
                    desc.enumerable = false;
                    Object.defineProperty(obj, prop, desc);
                }
            }
        };
        ensureNonEnumerable( ErrorProto, 'message');
        if (ErrorProto.message !== '') { ErrorProto.message = '' }
        ensureNonEnumerable( ErrorProto, 'name' );
    }

	// RegExp.prototype.toString() bugfix
	define( RegExpProto, 'toString', function toString() {
		var str = '/' + this.source + '/';
		if (this.global) { str += 'g' }
		if (this.ignoreCase) { str += 'i' }
		if (this.multiline) { str += 'm' }
		return str;
	}, NON_ENUM, (String(/a/mig) !== '/a/gim') );

  }); // End of String Variable Wrapper

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// ------------------------------------ Date Property Polyfills / Bugfixes -------------------------------------- ///

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  (function DateClosure() { // Date Variable Wrapper

    var hasNegativeMonthYearBug = new Date(-3509827329600292).getUTCMonth() !== 0;
    var aNegativeTestDate = new Date(-1509842289600292);
    var aPositiveTestDate = new Date(1449662400000);
    var hasToUTCStringFormatBug = aNegativeTestDate.toUTCString() !== 'Mon, 01 Jan -45875 11:59:59 GMT';
    var hasToDateStringFormatBug;
    var hasToStringFormatBug;
    var timeZoneOffset = aNegativeTestDate.getTimezoneOffset();
    if (timeZoneOffset < -720) {
        hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Tue Jan 02 -45875';
        hasToStringFormatBug = !(/^Thu Dec 10 2015 \d\d:\d\d:\d\d GMT[-+]\d\d\d\d(?: |$)/).test(String(aPositiveTestDate));
    } else {
        hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Mon Jan 01 -45875';
        hasToStringFormatBug = !(/^Wed Dec 09 2015 \d\d:\d\d:\d\d GMT[-+]\d\d\d\d(?: |$)/).test(String(aPositiveTestDate));
    }

    var originalGetFullYear = call.bind( DateProto.getFullYear );
    var originalGetMonth = call.bind( DateProto.getMonth );
    var originalGetDate = call.bind( DateProto.getDate );
    var originalGetUTCFullYear = call.bind( DateProto.getUTCFullYear );
    var originalGetUTCMonth = call.bind( DateProto.getUTCMonth );
    var originalGetUTCDate = call.bind( DateProto.getUTCDate );
    var originalGetUTCDay = call.bind( DateProto.getUTCDay );
    var originalGetUTCHours = call.bind( DateProto.getUTCHours );
    var originalGetUTCMinutes = call.bind( DateProto.getUTCMinutes );
    var originalGetUTCSeconds = call.bind( DateProto.getUTCSeconds );
    var originalGetUTCMilliseconds = call.bind( DateProto.getUTCMilliseconds );
    var dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var daysInMonth = function daysInMonth(month, year) {
        return originalGetDate( new Date(year, month, 0) );
    };

	var ErrDate = 'this is not a Date object.';

    defineProperties( DateProto, {
        'getFullYear': function getFullYear() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetFullYear(this);
            if (year < 0 && originalGetMonth(this) > 11) {
                return year + 1;
            }
            return year;
        },
        'getMonth': function getMonth() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetFullYear(this);
            var month = originalGetMonth(this);
            if (year < 0 && month > 11) {
                return 0;
            }
            return month;
        },
        'getDate': function getDate() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetFullYear(this);
            var month = originalGetMonth(this);
            var date = originalGetDate(this);
            if (year < 0 && month > 11) {
                if (month === 12) {
                    return date;
                }
                var days = daysInMonth(0, year + 1);
                return (days - date) + 1;
            }
            return date;
        },
        'getUTCFullYear': function getUTCFullYear() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetUTCFullYear(this);
            if (year < 0 && originalGetUTCMonth(this) > 11) {
                return year + 1;
            }
            return year;
        },
        'getUTCMonth': function getUTCMonth() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetUTCFullYear(this);
            var month = originalGetUTCMonth(this);
            if (year < 0 && month > 11) {
                return 0;
            }
            return month;
        },
        'getUTCDate': function getUTCDate() {
            if (!this || !(this instanceof Date)) {
                throw new TypeError(ErrDate);
            }
            var year = originalGetUTCFullYear(this);
            var month = originalGetUTCMonth(this);
            var date = originalGetUTCDate(this);
            if (year < 0 && month > 11) {
                if (month === 12) {
                    return date;
                }
                var days = daysInMonth(0, year + 1);
                return (days - date) + 1;
            }
            return date;
        }
    }, hasNegativeMonthYearBug ); // NON_ENUM is the default when defineProperties is used

	define( DateProto, 'toUTCString', function toUTCString() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError(ErrDate);
        }
        var day = originalGetUTCDay(this);
        var date = originalGetUTCDate(this);
        var month = originalGetUTCMonth(this);
        var year = originalGetUTCFullYear(this);
        var hour = originalGetUTCHours(this);
        var minute = originalGetUTCMinutes(this);
        var second = originalGetUTCSeconds(this);
        return dayName[day] + ', '
            + (date < 10 ? '0' + date : date) + ' '
            + monthName[month] + ' '
            + year + ' '
            + (hour < 10 ? '0' + hour : hour) + ':'
            + (minute < 10 ? '0' + minute : minute) + ':'
            + (second < 10 ? '0' + second : second) + ' GMT';

    }, NON_ENUM, (hasNegativeMonthYearBug || hasToUTCStringFormatBug) );

    // Opera 12 has `,`
	define( DateProto, 'toDateString', function toDateString() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError(ErrDate);
        }
        var day = this.getDay();
        var date = this.getDate();
        var month = this.getMonth();
        var year = this.getFullYear();
        return dayName[day] + ' '
            + monthName[month] + ' '
            + (date < 10 ? '0' + date : date) + ' '
            + year;

    }, NON_ENUM, (hasNegativeMonthYearBug || hasToDateStringFormatBug) );

	// we can use `define` and only check for forceAssign, avoiding the IE8 enumeration issue

	define( DateProto, 'toString', function toString() {
		if (!this || !(this instanceof Date)) {
			throw new TypeError(ErrDate);
		}
		var
		day = this.getDay(),
		date = this.getDate(),
		month = this.getMonth(),
		year = this.getFullYear(),
		hour = this.getHours(),
		minute = this.getMinutes(),
		second = this.getSeconds();

		var timezoneOffset = this.getTimezoneOffset();
		var hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
		var minutesOffset = Math.floor(Math.abs(timezoneOffset) % 60);
		return dayName[day] + ' '
			+ monthName[month] + ' '
			+ (date < 10 ? '0' + date : date) + ' '
			+ year + ' '
			+ (hour < 10 ? '0' + hour : hour) + ':'
			+ (minute < 10 ? '0' + minute : minute) + ':'
			+ (second < 10 ? '0' + second : second) + ' GMT'
			+ (timezoneOffset > 0 ? '-' : '+')
			+ (hoursOffset < 10 ? '0' + hoursOffset : hoursOffset)
			+ (minutesOffset < 10 ? '0' + minutesOffset : minutesOffset);

	}, NON_ENUM, (hasNegativeMonthYearBug || hasToStringFormatBug) );

    // ES5 15.9.5.43
    // http://es5.github.com/#x15.9.5.43
    // This function returns a String value represent the instance in time
    // represented by this Date object. The format of the String is the Date Time
    // string format defined in 15.9.1.15. All fields are present in the String.
    // The time zone is always UTC, denoted by the suffix Z. If the time value of
    // this object is not a finite Number a RangeError exception is thrown.

    var negativeDate = -62198755200000;
    var negativeYearString = '-000001';
    var hasNegativeDateBug = DateProto.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1; // eslint-disable-line max-len
    var hasSafari51DateBug = DateProto.toISOString && new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z';

    var getTime = call.bind( DateProto.getTime );

	define( DateProto, 'toISOString', function toISOString() {
	    if (!isFinite(this) || !isFinite(getTime(this))) {
	        // Adobe Photoshop requires the second check.
	        throw new RangeError('Date.prototype.toISOString called on non-finite value.');
	    }

	    var year = originalGetUTCFullYear(this);
	    var month = originalGetUTCMonth(this);
	    // see https://github.com/es-shims/es5-shim/issues/111
	    year += Math.floor(month / 12);
	    month = ((month % 12) + 12) % 12;

	    // the date time string format is specified in 15.9.1.15.
	    var result = [
	        month + 1,
	        originalGetUTCDate(this),
	        originalGetUTCHours(this),
	        originalGetUTCMinutes(this),
	        originalGetUTCSeconds(this)
	    ];
	    year = (
	        (year < 0 ? '-' : (year > 9999 ? '+' : ''))
	        + strSlice('00000' + Math.abs(year), (0 <= year && year <= 9999) ? -4 : -6)
	    );

	    for (var i = 0; i < result.length; ++i) {
	        // pad months, days, hours, minutes, and seconds to have two digits.
	        result[i] = strSlice('00' + result[i], -2);
	    }
	    // pad milliseconds to have three digits.
	    return (
	        year + '-' + arraySlice(result, 0, 2).join('-')
	        + 'T' + arraySlice(result, 2).join(':') + '.'
	        + strSlice('000' + originalGetUTCMilliseconds(this), -3) + 'Z'
	    );

	}, NON_ENUM, (hasNegativeDateBug || hasSafari51DateBug) );

    // ES5 15.9.5.44
    // http://es5.github.com/#x15.9.5.44
    // This function provides a String representation of a Date object for use by
    // JSON.stringify (15.12.3).
    var dateToJSONIsSupported = !!(function () {
        try {
            return DateProto.toJSON
                && new Date(NaN).toJSON() === null
                && new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1
                && DateProto.toJSON.call({ // generic
                    'toISOString': function () { return true; }
                });
        } catch (e) {}
    })();

	define( DateProto, 'toJSON', function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ES.ToPrimitive(O, hint Number).
        var O = Object(this);
        var tv = ToPrimitive(O);
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === 'number' && !isFinite(tv)) { return null }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        var toISO = O.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (!isCallable(toISO)) {
            throw new TypeError('toISOString property is not callable');
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(O);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.

    }, NON_ENUM, !dateToJSONIsSupported );

    // ES5 15.9.4.2 | http://es5.github.com/#x15.9.4.2
    // based on work shared by Daniel Friesen (dantman)
    // http://gist.github.com/303249
    var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
    var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
    var doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
    if (doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
        // XXX global assignment won't work in embeddings that use
        // an alternate object for the context.
        var maxSafeUnsigned32Bit = Math.pow(2, 31) - 1;
        var hasSafariSignedIntBug = isActualNaN(new Date(1970, 0, 1, 0, 0, 0, maxSafeUnsigned32Bit + 1).getTime());
        // eslint-disable-next-line no-implicit-globals, no-global-assign
        Date = (function ( NativeDate ) {
            // Date.length === 7
            var DateShim = function Date(Y, M, D, h, m, s, ms) {
                var length = arguments.length;
                var date;
                if (this instanceof NativeDate) {
                    var seconds = s;
                    var millis = ms;
                    if (hasSafariSignedIntBug && length >= 7 && ms > maxSafeUnsigned32Bit) {
                        // work around a Safari 8/9 bug where it treats the seconds as signed
                        var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                        var sToShift = Math.floor(msToShift / 1e3);
                        seconds += sToShift;
                        millis -= sToShift * 1e3;
                    }
                    date = length === 1 && $String(Y) === Y // isString(Y)
                        // We explicitly pass it through parse:
                        ? new NativeDate(DateShim.parse(Y))
                        // We have to manually make calls depending on argument
                        // length here
                        : length >= 7 ? new NativeDate(Y, M, D, h, m, seconds, millis)
                            : length >= 6 ? new NativeDate(Y, M, D, h, m, seconds)
                                : length >= 5 ? new NativeDate(Y, M, D, h, m)
                                    : length >= 4 ? new NativeDate(Y, M, D, h)
                                        : length >= 3 ? new NativeDate(Y, M, D)
                                            : length >= 2 ? new NativeDate(Y, M)
                                                : length >= 1 ? new NativeDate(Y instanceof NativeDate ? +Y : Y)
                                                    : new NativeDate();
                } else {
                    date = NativeDate.apply(this, arguments);
                }
                if (!isPrimitive(date)) {
                    // Prevent mixups with unfixed Date object
                    defineProperties(date, { constructor: DateShim }, true);
                }
                return date;
            };

            // 15.9.1.15 Date Time String Format.
            var isoDateExpression = new RegExp('^'
                + '(\\d{4}|[+-]\\d{6})' // four-digit year capture or sign + 6-digit extended year
                + '(?:-(\\d{2})' // optional month capture
                + '(?:-(\\d{2})' // optional day capture
                + '(?:' // capture hours:minutes:seconds.milliseconds
                    + 'T(\\d{2})' // hours capture
                    + ':(\\d{2})' // minutes capture
                    + '(?:' // optional :seconds.milliseconds
                        + ':(\\d{2})' // seconds capture
                        + '(?:(\\.\\d{1,}))?' // milliseconds capture
                    + ')?'
                + '(' // capture UTC offset component
                    + 'Z|' // UTC capture
                    + '(?:' // offset specifier +/-hours:minutes
                        + '([-+])' // sign capture
                        + '(\\d{2})' // hours offset capture
                        + ':(\\d{2})' // minutes offset capture
                    + ')'
                + ')?)?)?)?'
            + '$');

            var months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

            var dayFromMonth = function dayFromMonth(year, month) {
                var t = month > 1 ? 1 : 0;
                return (
                    months[month]
                    + Math.floor((year - 1969 + t) / 4)
                    - Math.floor((year - 1901 + t) / 100)
                    + Math.floor((year - 1601 + t) / 400)
                    + (365 * (year - 1970))
                );
            };

            var toUTC = function toUTC(t) {
                var s = 0;
                var ms = t;
                if (hasSafariSignedIntBug && ms > maxSafeUnsigned32Bit) {
                    // work around a Safari 8/9 bug where it treats the seconds as signed
                    var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                    var sToShift = Math.floor(msToShift / 1e3);
                    s += sToShift;
                    ms -= sToShift * 1e3;
                }
                return Number(new NativeDate(1970, 0, 1, 0, 0, s, ms));
            };

            // Copy any custom methods a 3rd party library may have added
            for (var key in NativeDate) {
                if (owns(NativeDate, key)) { //
                    DateShim[key] = NativeDate[key];
                }
            }

            // Copy "native" methods explicitly; they may be non-enumerable
            defineProperties( DateShim, { 'now': NativeDate.now, 'UTC': NativeDate.UTC }, true );

            DateShim[$P] = NativeDate[$P];
            defineProperties( DateShim[$P], { constructor: DateShim }, true );

            // Upgrade Date.parse to handle simplified ISO 8601 strings
            var parseShim = function parse(string) {
                var match = isoDateExpression.exec(string);
                if (match) {
                    // parse months, days, hours, minutes, seconds, and milliseconds
                    // provide default values if necessary
                    // parse the UTC offset component
                    var year = $Number(match[1]),
                        month = $Number(match[2] || 1) - 1,
                        day = $Number(match[3] || 1) - 1,
                        hour = $Number(match[4] || 0),
                        minute = $Number(match[5] || 0),
                        second = $Number(match[6] || 0),
                        millisecond = Math.floor($Number(match[7] || 0) * 1000),
                        // When time zone is missed, local offset should be used
                        // (ES 5.1 bug)
                        // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                        isLocalTime = Boolean(match[4] && !match[8]),
                        signOffset = match[9] === '-' ? 1 : -1,
                        hourOffset = $Number(match[10] || 0),
                        minuteOffset = $Number(match[11] || 0),
                        result;
                    var hasMinutesOrSecondsOrMilliseconds = minute > 0 || second > 0 || millisecond > 0;
                    if (
                        hour < (hasMinutesOrSecondsOrMilliseconds ? 24 : 25)
                        && minute < 60 && second < 60 && millisecond < 1000
                        && month > -1 && month < 12 && hourOffset < 24
                        && minuteOffset < 60 // detect invalid offsets
                        && day > -1
                        && day < (dayFromMonth(year, month + 1) - dayFromMonth(year, month))
                    ) {
                        result = (
                            ((dayFromMonth(year, month) + day) * 24)
                            + hour
                            + (hourOffset * signOffset)
                        ) * 60;
                        result = ((
                            ((result + minute + (minuteOffset * signOffset)) * 60)
                            + second
                        ) * 1000) + millisecond;
                        if (isLocalTime) {
                            result = toUTC(result);
                        }
                        if (-8.64e15 <= result && result <= 8.64e15) {
                            return result;
                        }
                    }
                    return NaN;
                }
                return NativeDate.parse.apply(this, arguments);
            };
            defineProperties(DateShim, { parse: parseShim });

            return DateShim;
        }(Date));
    }

    // ES5 15.9.4.4 | http://es5.github.com/#x15.9.4.4
	define( Date, 'now', function now() { return new Date().getTime() }, NON_ENUM, !Date.now );

  })(); // END OF DATE VARIABLE WRAPPER


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /// --------------------------------------------------------- JSON Property Polyfills ---------------------------------------------------- ///

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  	//  json2.js | Douglas Crockford | 2017-06-12 | Public Domain.
  	//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

  	//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO NOT CONTROL.

  	//  This file creates a global JSON object containing two methods: stringify
  	//  and parse. This file provides the ES5 JSON capability to ES3 systems.
  	//  If a project might run on IE8 or earlier, then this file should be included.
  	//  This file does nothing on ES5 systems.

  	// # I chose to remove the excessive commenting and whitespace. 530 lines for just 2 functions is kind of ridiculous,
  	// # even for a development version, since we only need to look at the spec for reference anyways.
	// # For the original source code, refer to: https://github.com/douglascrockford/JSON-js/blob/master/json2.js

  ;(function() {
	"use strict";

	define( window, 'JSON', {}, NON_ENUM );

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) { return (n < 10) ? "0" + n : n; } // Format integers to have at least two digits.

    function this_value() { return this.valueOf() }

	define( DateProto, 'toJSON', function () {

	    return isFinite(this.valueOf())
	        ? (
	            this.getUTCFullYear()
	            + "-"
	            + f(this.getUTCMonth() + 1)
	            + "-"
	            + f(this.getUTCDate())
	            + "T"
	            + f(this.getUTCHours())
	            + ":"
	            + f(this.getUTCMinutes())
	            + ":"
	            + f(this.getUTCSeconds())
	            + "Z"
	        ) : null;

	}, NON_ENUM, (typeof DateProto.toJSON !== "function") );

	define( Boolean[$P], 'toJSON', this_value, NON_ENUM );
	define( NumberProto, 'toJSON', this_value, NON_ENUM );
	define( StringProto, 'toJSON', this_value, NON_ENUM );

	var gap, indent, meta, rep;

    function quote(string) {

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }

    function str(key, holder) {

        var i, k, v, length, partial;
        var mind = gap;
        var value = holder[key];

        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        if (typeof rep === "function") { value = rep.call(holder, key, value) }

		// What happens next depends on the value's type.
        switch (typeof value) {
        case "string":
            return quote(value);

        case "number": // JSON numbers must be finite. Encode non-finite numbers as null.

            return (isFinite(value)) ? $String(value) : "null";

        case "boolean":
        case "null":
            return $String(value);

        case "object":

            if (!value) { return "null" }

            gap += indent; partial = [];

            if (ObjectProto.toString.apply(value) === "[object Array]") {

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? (
                            "[\n"
                            + gap
                            + partial.join(",\n" + gap)
                            + "\n"
                            + mind
                            + "]"
                        )
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (ObjectProto.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

	meta = { // table of character substitutions
		"\b": "\\b",
		"\t": "\\t",
		"\n": "\\n",
		"\f": "\\f",
		"\r": "\\r",
		"\"": "\\\"",
		"\\": "\\\\"
	};

	// JSON.stringigy() polyfill | json2.js |
	define( JSON, 'stringify', function stringify (value, replacer, space) {

		var i;
		gap = ""; indent = "";

		if (typeof space === "number") {
			for (i = 0; i < space; i += 1) { indent += " " }

		} else
			if (typeof space === "string") { indent = space }

		rep = replacer;
		if (replacer && typeof replacer !== "function" && (
			typeof replacer !== "object"
			|| typeof replacer.length !== "number"
		)) {
			throw new Error("JSON.stringify");
		}

		return str("", {"": value});

	} , NON_ENUM, (typeof JSON.stringify !== 'function') );

	// JSON.parse() polyfill | json2.js |
	define( JSON, 'parse', function parse (text, reviver) {
		var j;
		function walk(holder, key) {
			var k, v;
			var value = holder[key];
			if (value && typeof value === "object") {
				for (k in value) {
					if (ObjectProto.hasOwnProperty.call(value, k)) {
						v = walk(value, k);
						if (v !== undefined) { value[k] = v }
						else {
							delete value[k]
						}
					}
				}
			}
			return reviver.call(holder, key, value);
		}

		text = String(text);
		rx_dangerous.lastIndex = 0;
		if (rx_dangerous.test(text)) {
			text = text.replace(rx_dangerous, function (a) {
				return (
					"\\u"
					+ ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
				);
			});
		}

		if (rx_one.test(
				text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, "")
			)
		) {
			j = eval("(" + text + ")");

			return (typeof reviver === "function")
				? walk({"": j}, "")
				: j;
		}

		throw new SyntaxError("JSON.parse");

   } , NON_ENUM, (typeof JSON.parse !== 'function') );
   })();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// ------------------------------------------------------ Document / DOM manipulation polyfills --------------------------------------------------------- ///

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // version 2.0
  (function() {

	define( document, 'head', (function() {
		  return ('getElementsByTagName' in document) ?
			  document['getElementsByTagName']('head')[0] :
			  document.all[1]
	})(), READ_ONLY );

  })();

	if ( !_SUPPORTS_['ElementAPI'] || !_SUPPORTS_['EventAPI'] ) {

		console.warn('normalize.js expects at least partial Element and Event API support!'+
		'for compat with ancient browsers that support nothing, use normalize-1.1.1.NFE-compat.js!');
		this.partiallyUnsupportable = true;
		return this;
	}

	Element.prototype.remove || (Element.prototype.remove = function() {
		if (this.parentNode) { this.parentNode.removeChild( this ) }
	});

	// NodeList.prototype.forEach() polyfill | https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill
	if (window.NodeList && !NodeList[$P].forEach) { NodeList[$P].forEach = ArrayProto.forEach; }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// -------------------------------------------------------- Element Polyfills -------------------------------------------------------------------------- ///

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ElemProto = Element.prototype, ElementProto = Element.prototype;
var EventProto = Event.prototype;

var div = document.createElement('div');
// Force Element.prototype.getAttribute() to consistently return null on missing attributes
// https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
var hasNonstandardGetAttr = !!(function( undefAttr ) {
	var div = document.createElement('div');
	//if (!hasOwn('getAttribute', div)) { }
	// ensure undefined attribute
	if ( div.getAttribute( undefAttr ) !== null ) { return true }

})( '$random' + microtime() );

// Element.prototype.getAttribute() normalization
define( ElementProto, 'getAttribute', (function( origGetAttribute ) {

	return function getAttribute( attr ) {
		'use strict';
		if (this == null) {
			throw new TypeError('Element.prototype.getAttribute called on null or undefined!')
		}
		if ( this.hasOwnProperty( 'hasAttribute' ) ) {

			return !this.hasAttribute(attr) ? null : origGetAttribute.apply(this, arguments);

		} else {
			// polyfill hasAttribute

			//throw new SyntaxError();
			return 0;
		}
	}

})( ElementProto.getAttribute ), 'ecw', hasNonstandardGetAttr );

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// --------------------------------------------------------------- Event Polyfills --------------------------------------------------------------------- ///

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

 // Event Constructor polyfill
(function () {

	function assert( fn ) {
		var div = document.createElement("div");

		try {
			return !!fn( div );
		} catch (e) {
			return false;
		} finally {
			// Remove from its parent by default
			if ( div.parentNode ) {
				div.parentNode.removeChild( div );
			}
			// release memory in IE
			div = null;
		}
	}

	assert(function CanMakeEventConstructor(div) {
		if (typeof Event === 'function') { return true }

	});
	// 'all uncleannnn spirits be bound in Jesus name and cast from my presence for the next 24 hours.
	// 'no metaphysical being enter my presence for the next 24 hours.

	if (typeof Event === 'undefined') { return console.warn('Can not polyfill Event constructor') }
	if (typeof Event === 'function') { return } // supports Event constructor

	if ( !document.createEvent ) {
		return console.warn('document.createEvent is not defined! No way to polyfill Event constructor');
	}

	if (typeof Event === 'object' || true) {
		// IE9-11, Safari <6, Opera 7<=x<11.6, Chrome < 15, Firefox < 11
		// Event: eventName, bubbles, cancelable, [composed]
		// initEvent: eventName, bubbles, cancelable // doesnt have composed
		window['Event'] = (function( evtproto ) {

			function Event( eventName, options ) {

				options = Object( options );
				var event = document.createEvent('Event'); // Must be a specific event name or triggers DOMException

				if (!!options.composed) {
					console.warn('Event.composed is not supported in this implementation!');
				}
				event.initEvent( eventName, !!options.bubbles, !!options.cancelable );
				return event;

			}

			Event.prototype = evtproto;
			return Event;

		})( window.Event.prototype );
	}

})();

  (function ( window ) {

	try { return new MouseEvent('test') } catch (e) {} // we don't return

    // Polyfills DOM4 MouseEvent
	var MouseEventPolyfill = function (eventType, params) {
		params = params || { bubbles: false, cancelable: false };
		var mouseEvent = document.createEvent('MouseEvent');
		mouseEvent.initMouseEvent(eventType,
			params.bubbles,
			params.cancelable,
			window,
			0,
			params.screenX || 0,
			params.screenY || 0,
			params.clientX || 0,
			params.clientY || 0,
			params.ctrlKey || false,
			params.altKey || false,
			params.shiftKey || false,
			params.metaKey || false,
			params.button || 0,
			params.relatedTarget || null
		);

		return mouseEvent;
	}

	MouseEventPolyfill[$P] = Event[$P];

	window.MouseEvent = MouseEventPolyfill

  })( window );



});
