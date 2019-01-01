"use strict";function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}Object.defineProperty(exports,"__esModule",{value:!0}),require("@babel/polyfill");/**
 * @file CanvasControls.ts
 * @copyright Valen. H. 2k18
 * @author Valen.H. <alternativexxxy@gmail.com>
 */ /**
 * The root of the main library
 * @module CanvasControls
 * @license ISC
 * @global
 */var CanvasControls;//CanvasControls
(function(a){/**
     * If `dest` lacks a property that `targ` has then that property is copied into `dest`
     * @function
    */function b(a,b){var c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:function(a,b,c){return a[c]===void 0&&(a[c]=b[c])};for(var d in b)c(a,b,d);return a}//inherit
/**
     * Restrict number's range
     * @function
     */function c(a,b,c){return a>c?c:a<b?b:a}//bound
/**
     * A holder for all errors
     * @namespace
     */var d;(function(a){a.ENOTCANV=new TypeError("Not an HTMLCanvasElement."),a.ENOTCTX=new TypeError("Not a CanvasRenderingContext2D."),a.ENOTNUMARR2=new TypeError("Not an Array of 2-at-least Numbers.")})(d=a.Errors||(a.Errors={}));//Errors
/**
     * A wrapper for the targeted canvas element
     * @class
     * @implements {Opts.ControllableCanvasOptions}
     * @prop {HTMLCanvasElement} target=firstCanvOccurInDoc - Bound canvas
     * @prop {CanvasRenderingContext2D} context?=target.getContext("2d") - The 2d context created out of `target`
     * @prop {number[]} trans=0,0 - Translation
     * @prop {number[]} scl=1,1 - Scaling
     * @prop {number[]} rot=0,0 - Rotation
     * @prop {number[]} pin?=this.target.width/2,this.target.height/2 - Pseudo-center
     * @prop {number[]} transBound=-Infinity,-Infinity,Infinity,Infinity - Max translation boundaries
     * @prop {boolean} dragEnabled=false - Enable translation on drag
     * @prop {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (1 finger only shall move)
     * @prop {boolean} pinchSwipeEnabled=false - Enable rotation on 2-finger pinch (both fingers shall move)
     * @prop {boolean} wheelEnabled=false - Enable scaling on mouse wheel
     * @prop {boolean} panEnabled=false - Enable translation based on mouse/finger distance from pin (pseudo-center)
     * @prop {boolean} tiltEnabled=false - Enable translation on device movement
     * @prop {boolean} eventsReversed=false - Toggle reverse-operations
     * @prop {boolean} useRight=false - Use right click as main
     * @prop {number[]} _coordinates - Current event coordinates
     * @prop {number} transSpeed=1 - Translation speed factor
     * @prop {number} sclSpeed=1 - Scaling speed factor
     * @prop {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
     */var e=/*#__PURE__*/function(){/**
         * ControllableCanvas constructor
         * @param {Opts.ControllableCanvasOptions} opts?=ControllableCanvas.defaultOpts - ControllableCanvas Options
         * @constructor
         */function a(){var c=0<arguments.length&&void 0!==arguments[0]?arguments[0]:a.defaultOpts;if(_classCallCheck(this,a),b(c,a.defaultOpts),!(c.target instanceof HTMLCanvasElement))throw d.ENOTCANV;else if([c.trans,c.scl,c.transBounds,c.sclBounds].some(function(a){return!(a instanceof Array||a instanceof Float32Array||a instanceof Float64Array)||2>a.length||Array.from(a).some(function(a){return isNaN(a)||""===a})}))throw d.ENOTNUMARR2;if(b(c._adapts,a.defaultOpts._adapts),void 0===c.pin)c.pin=[c.target.width/2,c.target.height/2];else if(!(c.pin instanceof Array||c.pin instanceof Float32Array||c.pin instanceof Float64Array)||2>c.pin.length||Array.from(c.pin).some(function(a){return isNaN(a)||""===a}))throw d.ENOTNUMARR2;this.target=c.target,this.context=this.target.getContext("2d"),this._adapts={},b(this._adapts,c._adapts),this.rot=1*c.rot,this.transSpeed=1*c.transSpeed,this.sclSpeed=1*c.sclSpeed,this.trans=Array.from(c.trans).map(Number),this.scl=Array.from(c.scl).map(Number),this.pin=Array.from(c.pin).map(Number),this.transBounds=Array.from(c.transBounds).map(Number),this.sclBounds=Array.from(c.sclBounds).map(Number),this.dragEnabled=!!c.dragEnabled,this.pinchEnabled=!!c.pinchEnabled,this.pinchSwipeEnabled=!!c.pinchSwipeEnabled,this.wheelEnabled=!!c.wheelEnabled,this.panEnabled=!!c.panEnabled,this.tiltEnabled=!!c.tiltEnabled,this.eventsReversed=!!c.eventsReversed,this.useRight=!!c.useRight,this._handled=!1,this._mobile=a.isMobile,this._pressed=!1,this._coordinates=[0,0],a._linepix||(a._linepix=a.lineToPix)}//ctor
return _createClass(a,[{key:"handle",//g-max
/**
         * Enable controls, call only once
         * @param {boolean} force?=false - Force handle
         * @returns {boolean} bound? - whether bind suceeded or it was already bound earlier
         */value:function b(){var a=!!(0<arguments.length&&void 0!==arguments[0])&&arguments[0];return(!this._handled||a)&&(this._mobile?this._mobileAdapt():this._pcAdapt(),this._handled=!0)}//handle
/**
         * Re-apply internal transformations
         * @returns {ControllableCanvas} this - For method chaining
         */},{key:"retransform",value:function a(){return this.context.setTransform(1,0,0,1,0,0),this.context.translate(this.trans[0],this.trans[1]),this.context.scale(this.scl[0],this.scl[1]),this.context.rotate(this.rot),this}//retransform
/**
         * Intermediate translation function for iconic translate before the real
         * @param {number} x=0 - x translation
         * @param {number} y=0 - y translation
         * @param {boolean} abs?=false - abslute translation or relative to current
         * @returns {number[]} trans - Returns current total translation
         */},{key:"translate",value:function g(){var a=this,b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:0,d=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,e=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2],f=[b,d];return this.trans=this.trans.map(function(b,d){return c(+(e?f[d]:b+f[d]),a.transBounds[d],a.transBounds[d+2])})}//translate
/**
         * Intermediate scaling function for iconic scale before the real
         * @param {number} x=1 - x scale
         * @param {number} y=x - y scale
         * @param {boolean} abs?=false - abslute scale or relative to current
         * @returns {number[]} scl - Returns current total scaling
         */},{key:"scale",value:function g(){var a=this,b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:1,d=1<arguments.length&&void 0!==arguments[1]?arguments[1]:b,e=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2],f=[b,d];return this.scl=this.scl.map(function(b,d){return c(+(e?f[d]:b*f[d]),a.sclBounds[d],a.sclBounds[d+2])})}//scale
},{key:"_mobileAdapt",value:function c(){var b=this;!this._adapts.drag&&this.dragEnabled&&(this.target.addEventListener("touchstart",function(c){return a.dragMobileStart(c,b)},{passive:!1}),this.target.addEventListener("touchmove",this._adapts.drag=function(c){return a.dragMobileMove(c,b)},{passive:!1}),this.target.addEventListener("touchend",function(c){return a.dragMobileEnd(c,b)},{passive:!1})),!this._adapts.pinch,!this._adapts.pinchSwipe,!this._adapts.tilt}//_mobileAdapt
},{key:"_pcAdapt",value:function c(){var b=this;!this._adapts.drag&&this.dragEnabled&&(this.target.addEventListener("mousemove",this._adapts.drag=function(c){return a.dragPC(c,b)}),this.target.addEventListener("mousedown",function(){return b._pressed=!0}),this.target.addEventListener("mouseup",function(){return b._pressed=!1}),this.useRight&&this.target.addEventListener("contextmenu",function(a){return a.preventDefault()},{capture:!0,passive:!1})),!this._adapts.wheel&&this.wheelEnabled&&this.target.addEventListener("wheel",this._adapts.wheel=function(c){return a.wheel(c,b)}),!this._adapts.tilt}//_pcAdapt
},{key:"ratio",get:function a(){return this.target.width/this.target.height}//g-ratio
},{key:"min",get:function a(){return Math.min(this.target.width,this.target.height)}//g-min
},{key:"max",get:function a(){return Math.max(this.target.width,this.target.height)}}],[{key:"dragPC",value:function d(a,b){if(!(!b.useRight&&"buttons"in a&&2==(2&a.buttons)||"which"in a&&3===a.which||"button"in a&&2===a.button||b.useRight&&"buttons"in a&&2!=(2&a.buttons)&&"which"in a&&3!==a.which&&"button"in a&&2!==a.button)){a.preventDefault();var c=[a.clientX-b.target.offsetLeft,a.clientY-b.target.offsetTop];b._pressed&&b.translate(a.movementX*b.transSpeed,a.movementY*b.transSpeed),b._coordinates=c}}//dragPC
},{key:"dragMobileMove",value:function d(a,b){a.preventDefault();var c=[a.targetTouches[0].clientX-b.target.offsetLeft,a.targetTouches[0].clientY-b.target.offsetTop];1===a.targetTouches.length&&b.translate(c[0]-b._coordinates[0],c[1]-b._coordinates[1]),b._coordinates=c}//dragMobileMove
},{key:"dragMobileStart",value:function c(a,b){a.preventDefault(),b._coordinates=[a.targetTouches[0].clientX-b.target.offsetLeft,a.targetTouches[0].clientY-b.target.offsetTop]}//dragMobileStart
},{key:"dragMobileEnd",value:function d(b,c){b.preventDefault(),1==b.targetTouches.length&&a.dragMobileStart(b,c)}//dragMobileEnd
},{key:"wheel",value:function g(b,c){var e=1-c.sclSpeed*a.fixDelta(b.deltaMode,b.deltaY)/c.max,d=[b.clientX-c.target.offsetLeft-c.trans[0],b.clientY-c.target.offsetTop-c.trans[1]],f=d.map(function(a){return a*(1-e)});c.translate.apply(c,_toConsumableArray(f)),c.scale(e,e),console.log(f,d)}//wheel
},{key:"fixDelta",//lineToPix
value:function d(b,c){return 1===b?a._linepix*c:2===b?window.innerHeight:c}//fixDelta
},{key:"isMobile",get:function a(){return!!(navigator.userAgent.match(/Android/i)||navigator.userAgent.match(/webOS/i)||navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPad/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/BlackBerry/i)||navigator.userAgent.match(/Windows Phone/i))}//detectMobile
},{key:"lineToPix",get:function f(){var a,b=document.createElement("iframe");b.src="#",document.body.appendChild(b);var c=b.contentWindow,d=c.document;d.open(),d.write("<!DOCTYPE html><html><head></head><body><p>a</p></body></html>"),d.close();var e=d.body.firstElementChild;return a=e.offsetHeight,document.body.removeChild(b),a}}]),a}();//ControllableCanvas
/**
     * Default options for ControllableCanvas
     * @readonly
     * @static
     */e.defaultOpts={target:document.getElementsByTagName("canvas")[0],trans:[0,0],scl:[1,1],rot:0,dragEnabled:!1,pinchEnabled:!1,pinchSwipeEnabled:!1,wheelEnabled:!1,panEnabled:!1,tiltEnabled:!1,eventsReversed:!1,useRight:!1,transSpeed:1,sclSpeed:1,sclBounds:[0,0,1/0,1/0],transBounds:[-Infinity,-Infinity,1/0,1/0],_adapts:{drag:!1,pinch:!1,pinchSwipe:!1,wheel:!1,pan:!1,tilt:!1}},a.ControllableCanvas=e})(CanvasControls=exports.CanvasControls||(exports.CanvasControls={})),exports.default=CanvasControls.ControllableCanvas;