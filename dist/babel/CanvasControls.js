"use strict";function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function _defineProperties(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}function _createClass(a,b,c){return b&&_defineProperties(a.prototype,b),c&&_defineProperties(a,c),a}Object.defineProperty(exports,"__esModule",{value:!0}),require("@babel/polyfill");/**
 * @file CanvasControls.ts
 * @copyright Valen. H. 2k18
 * @author Valen.H. <alternativexxxy@gmail.com>
 */ /**
 * The root of the main library
 * @module CanvasControls
 */var CanvasControls;//CanvasControls
(function(a){/**
     * If `dest` lacks a property that `targ` has then that property is copied into `dest`.
    */function b(a,b){var c=2<arguments.length&&arguments[2]!==void 0?arguments[2]:function(a,b,c){return a[c]===void 0&&(a[c]=b[c])};for(var d in b)c(a,b,d);return a}//inherit
/**
     * Restrict number's range
     */function c(a,b,c){return a>c?c:a<b?b:a}//bound
/**
     * A holder for all errors
     */var d;(function(a){a.ENOTCANV=new TypeError("Not an HTMLCanvasElement."),a.ENOTCTX=new TypeError("Not a CanvasRenderingContext2D."),a.ENOTNUMARR2=new TypeError("Not an Array of 2-at-least Numbers.")})(d=a.Errors||(a.Errors={}));//Errors
/**
     * A wrapper for the targeted <canvas> element
     */var e=/*#__PURE__*/function(){function a(){var c=0<arguments.length&&void 0!==arguments[0]?arguments[0]:a.defaultOpts;if(_classCallCheck(this,a),b(c,a.defaultOpts),!(c.target instanceof HTMLCanvasElement))throw d.ENOTCANV;else if([c.trans,c.scale,c.rot,c.pin,c.transBounds].some(function(a){return!(a instanceof Array||a instanceof Float32Array||a instanceof Float64Array)||2>a.length||Array.from(a).some(function(a){return isNaN(a)||""===a})}))throw d.ENOTNUMARR2;this.target=c.target,this.context=this.target.getContext("2d"),this.trans=Array.from(c.trans).map(Number),this.scale=Array.from(c.scale).map(Number),this.rot=Array.from(c.rot).map(Number),this.pin=Array.from(c.pin).map(Number),this.transBounds=Array.from(c.pin).map(Number),this.dragEnabled=!!c.dragEnabled,this.pinchEnabled=!!c.pinchEnabled,this.pinchSwipeEnabled=!!c.pinchSwipeEnabled,this.wheelEnabled=!!c.wheelEnabled,this.panEnabled=!!c.panEnabled,this.tiltEnabled=!!c.tiltEnabled,this.eventsReversed=!!c.eventsReversed,this.blockRight=!!c.blockRight,this._handled=!1,this._adapts={},this._mobile=a.isMobile,this._pressed=!1,this._coordinates=[0,0],a._linepix=a.lineToPix}//ctor
return _createClass(a,[{key:"handle",//g-max
value:function a(){return!this._handled&&(this._mobile?this._mobileAdapt():this._pcAdapt(),this._handled=!0)}//handle
},{key:"retransform",value:function d(){var a,b,c;return this.context.setTransform(1,0,0,1,0,0),(a=this.context).translate.apply(a,_toConsumableArray(this.trans)),(b=this.context).scale.apply(b,_toConsumableArray(this.scale)),(c=this.context).rotate.apply(c,_toConsumableArray(this.rot)),this}//retransform
},{key:"translate",value:function f(){for(var a=this,b=arguments.length,d=Array(b),e=0;e<b;e++)d[e]=arguments[e];return this.trans=this.trans.map(function(b,e){return c(+(b+d[e]),a.transBounds[e],a.transBounds[e+2])})}//translate
},{key:"_mobileAdapt",value:function c(){var b=this;this._adapts.drag||(this.target.addEventListener("touchstart",function(c){return a.dragMobileStart(c,b)},{passive:!1}),this.target.addEventListener("touchmove",function(c){return a.dragMobileMove(c,b)},{passive:!1}),this.target.addEventListener("touchend",function(c){return a.dragMobileEnd(c,b)},{passive:!1})),!this._adapts.pinch,!this._adapts.pinchSwipe,!this._adapts.tilt}//_mobileAdapt
},{key:"_pcAdapt",value:function c(){var b=this;this._adapts.drag||(this.target.addEventListener("mousemove",function(c){return a.dragPC(c,b)}),this.target.addEventListener("mousedown",function(){return b._pressed=!0}),this.target.addEventListener("mouseup",function(){return b._pressed=!1}),this.blockRight&&this.target.addEventListener("contextmenu",function(a){return a.preventDefault()},{capture:!0,passive:!1})),this._adapts.wheel||this.target.addEventListener("wheel",function(c){return a.wheel(c,b)}),!this._adapts.tilt}//_pcAdapt
},{key:"ratio",get:function a(){return this.target.width/this.target.height}//g-ratio
},{key:"min",get:function b(){var a=Math.min;return a(this.target.width,this.target.height)}//g-min
},{key:"max",get:function b(){var a=Math.max;return a(this.target.width,this.target.height)}}],[{key:"dragPC",value:function d(a,b){if(!("buttons"in a&&2==(2&a.buttons)||"which"in a&&3===a.which||"button"in a&&2===a.button)){a.preventDefault();var c=[a.clientX-b.target.offsetLeft,a.clientY-b.target.offsetTop];b._pressed&&b.translate(a.movementX*(1/b.scale[0]),a.movementY*(1/b.scale[1])),b._coordinates=c}}//dragPC
},{key:"dragMobileMove",value:function d(a,b){a.preventDefault();var c=[a.targetTouches[0].clientX-b.target.offsetLeft,a.targetTouches[0].clientY-b.target.offsetTop];1===a.targetTouches.length&&b.translate((c[0]-b._coordinates[0])*(1/b.scale[0]),(c[1]-b._coordinates[1])*(1/b.scale[1])),b._coordinates=c}//dragMobileMove
},{key:"dragMobileStart",value:function c(a,b){a.preventDefault(),b._coordinates=[a.targetTouches[0].clientX-b.target.offsetLeft,a.targetTouches[0].clientY-b.target.offsetTop]}//dragMobileStart
},{key:"dragMobileEnd",value:function d(b,c){b.preventDefault(),1==b.targetTouches.length&&a.dragMobileStart(b,c)}//dragMobileEnd
},{key:"wheel",value:function c(b){a.fixDelta(b.deltaMode,b.deltaY)}//wheel
},{key:"fixDelta",//lineToPix
value:function d(b,c){return 1===b?a._linepix*c:2===b?window.innerHeight:c}//fixDelta
},{key:"isMobile",get:function a(){return!!(navigator.userAgent.match(/Android/i)||navigator.userAgent.match(/webOS/i)||navigator.userAgent.match(/iPhone/i)||navigator.userAgent.match(/iPad/i)||navigator.userAgent.match(/iPod/i)||navigator.userAgent.match(/BlackBerry/i)||navigator.userAgent.match(/Windows Phone/i))}//detectMobile
},{key:"lineToPix",get:function f(){var a,b=document.createElement("iframe");b.src="#",document.body.appendChild(b);var c=b.contentWindow,d=c.document;d.open(),d.write("<!DOCTYPE html><html><head></head><body><p>a</p></body></html>"),d.close();var e=d.body.firstElementChild;return a=e.offsetHeight,document.body.removeChild(b),a}}]),a}();//ControllableCanvas
e.defaultOpts={target:document.getElementsByTagName("canvas")[0],trans:[0,0],scale:[1,1],rot:[0,0],pin:[window.innerWidth/2,window.innerHeight/2],dragEnabled:!1,pinchEnabled:!1,pinchSwipeEnabled:!1,wheelEnabled:!1,panEnabled:!1,tiltEnabled:!1,eventsReversed:!1,blockRight:!0,transBounds:[-Infinity,1/0,-Infinity,1/0]},a.ControllableCanvas=e})(CanvasControls=exports.CanvasControls||(exports.CanvasControls={})),exports.default=CanvasControls.ControllableCanvas;