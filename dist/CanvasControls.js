"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@babel/polyfill");
/**
 * @file CanvasControls.ts
 * @copyright Valen. H. 2k18
 * @author Valen.H. <alternativexxxy@gmail.com>
 */
/**
 * The root of the main library
 * @module CanvasControls
 * @license ISC
 * @global
 */
var CanvasControls;
(function (CanvasControls) {
    /**
     * If `dest` lacks a property that `targ` has then that property is copied into `dest`
     * @function
     * @inner
     * @param {object} dest - destination object
     * @param {object} targ - base object
     * @param {Function} condition - inheritance condition
     * @returns {object} destination object
     */
    function inherit(dest, targ, condition = (dest, targ, prop) => dest[prop] === undefined && (dest[prop] = targ[prop])) {
        for (let i in targ) {
            condition(dest, targ, i);
        }
        return dest;
    } //inherit
    /**
     * Restrict number's range
     * @function
     * @inner
     * @param {number} n - target number
     * @param {number} m - minimum number
     * @param {number} M - maximum number
     * @returns {number} bound number
     */
    function bound(n, m, M) {
        return n > M ? M : (n < m ? m : n);
    } //bound
    /**
     * Calculate distance between 2 points
     * @param {number[]} Xs - X coordinates
     * @param {number[]} Ys - Y coordinates
     * @returns {number} distance
     * @function
     * @inner
     */
    function dist(Xs, Ys) {
        return Math.sqrt([Xs[1] - Xs[0], Ys[1] - Ys[0]].map((v) => Math.pow(v, 2)).reduce((acc, v) => acc + v));
    } //dist
    /**
     * A holder for all Options
     * @namespace
     */
    let Opts;
    (function (Opts) {
        let UseButton;
        (function (UseButton) {
            UseButton[UseButton["USELEFT"] = 1] = "USELEFT";
            UseButton[UseButton["USERIGHT"] = 2] = "USERIGHT";
            UseButton[UseButton["USEBOTH"] = 3] = "USEBOTH";
        })(UseButton = Opts.UseButton || (Opts.UseButton = {})); //UseButton
        let ScaleMode;
        (function (ScaleMode) {
            ScaleMode[ScaleMode["NORMAL"] = 1] = "NORMAL";
            ScaleMode[ScaleMode["FREESCALE"] = 2] = "FREESCALE";
            ScaleMode[ScaleMode["BYPASS"] = 4] = "BYPASS";
        })(ScaleMode = Opts.ScaleMode || (Opts.ScaleMode = {})); //ScaleMode
    })(Opts = CanvasControls.Opts || (CanvasControls.Opts = {})); //Opts
    /**
     * A holder for all errors
     * @namespace
     */
    let Errors;
    (function (Errors) {
        Errors.ENOTCANV = new TypeError("Not an HTMLCanvasElement.");
        Errors.ENOTCTX = new TypeError("Not a CanvasRenderingContext2D.");
        Errors.ENOTNUMARR2 = new TypeError("Not an Array of 2-at-least Numbers.");
    })(Errors = CanvasControls.Errors || (CanvasControls.Errors = {})); //Errors
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
     * @prop {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (both fingers shall move)
     * @prop {boolean} pinchSwipeEnabled=false - Enable rotation on 2-finger pinch (1 finger only shall move)
     * @prop {boolean} wheelEnabled=false - Enable scaling on mouse wheel
     * @prop {boolean} panEnabled=false - Enable translation based on mouse/finger distance from pin (pseudo-center)
     * @prop {boolean} tiltEnabled=false - Enable translation on device movement
     * @prop {boolean} eventsReversed=false - Toggle reverse-operations
     * @prop {Opts.UseButton} useButton=Opts.UseButton.USELEFT - Respond to left-click, right or both
     * @prop {number[]} _coordinates - Current event coordinates
     * @prop {number} transSpeed=1 - Translation speed factor
     * @prop {number} sclSpeed=1 - Scaling speed factor
     * @prop {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
     * @prop {object} _touches - Map of all current touches
     */
    class ControllableCanvas {
        /**
         * ControllableCanvas constructor
         * @param {Opts.ControllableCanvasOptions} opts?=ControllableCanvas.defaultOpts - ControllableCanvas Options
         * @constructor
         */
        constructor(opts = ControllableCanvas.defaultOpts) {
            this.trans = [0, 0];
            this.scl = [1, 1];
            this.rot = 0;
            this.transBounds = [-Infinity, -Infinity, Infinity, Infinity];
            this.sclBounds = [0, 0, Infinity, Infinity];
            this.dragEnabled = false;
            this.pinchEnabled = false;
            this.pinchSwipeEnabled = false;
            this.wheelEnabled = false;
            this.panEnabled = false;
            this.tiltEnabled = false;
            this.eventsReversed = false;
            this.useButton = Opts.UseButton.USELEFT;
            this.scaleMode = Opts.ScaleMode.NORMAL; /** @todo mask: freescale-axis,rotation-as-scaling */
            this.transSpeed = 1;
            this.sclSpeed = 1;
            this.touchSensitivity = .5;
            this._handled = false;
            this._mobile = false;
            this._pressed = false;
            this._coordinates = [];
            this._touches = [];
            inherit(opts, ControllableCanvas.defaultOpts);
            if (!(opts.target instanceof HTMLCanvasElement)) {
                throw Errors.ENOTCANV;
            }
            else if ([opts.trans, opts.scl, opts.transBounds, opts.sclBounds].some(arr => !(arr instanceof Array || arr instanceof Float32Array || arr instanceof Float64Array) || arr.length < 2 || Array.from(arr).some((num) => isNaN(num) || num === ''))) {
                throw Errors.ENOTNUMARR2;
            }
            inherit(opts._adapts, ControllableCanvas.defaultOpts._adapts); //POSSIBLE ERROR
            if (opts.pin === undefined) {
                opts.pin = [opts.target.width / 2, opts.target.height / 2];
            }
            else if (!(opts.pin instanceof Array || opts.pin instanceof Float32Array || opts.pin instanceof Float64Array) || opts.pin.length < 2 || Array.from(opts.pin).some((num) => isNaN(num) || num === '')) {
                throw Errors.ENOTNUMARR2;
            }
            this.target = opts.target;
            this.context = this.target.getContext("2d");
            this._adapts = {};
            inherit(this._adapts, opts._adapts);
            this.rot = opts.rot * 1;
            this.transSpeed = opts.transSpeed * 1;
            this.sclSpeed = opts.sclSpeed * 1;
            this.touchSensitivity = opts.touchSensitivity * 1;
            this.useButton = opts.useButton | 0;
            this.scaleMode = opts.scaleMode | 0;
            this.trans = Array.from(opts.trans).map(Number);
            this.scl = Array.from(opts.scl).map(Number);
            this.pin = Array.from(opts.pin).map(Number);
            this.transBounds = Array.from(opts.transBounds).map(Number); // x, y, X, Y
            this.sclBounds = Array.from(opts.sclBounds).map(Number); // x, y, X, Y
            this.dragEnabled = !!opts.dragEnabled;
            this.pinchEnabled = !!opts.pinchEnabled;
            this.pinchSwipeEnabled = !!opts.pinchSwipeEnabled;
            this.wheelEnabled = !!opts.wheelEnabled;
            this.panEnabled = !!opts.panEnabled;
            this.tiltEnabled = !!opts.tiltEnabled;
            this.eventsReversed = !!opts.eventsReversed;
            this._handled = false;
            this._pressed = false;
            this._coordinates = [0, 0];
            this._touches = [];
            this._mobile = ControllableCanvas.isMobile;
            if (!ControllableCanvas._linepix)
                ControllableCanvas._linepix = ControllableCanvas.lineToPix;
        } //ctor
        get ratio() {
            return this.target.width / this.target.height;
        } //g-ratio
        get min() {
            return Math.min(this.target.width, this.target.height);
        } //g-min
        get max() {
            return Math.max(this.target.width, this.target.height);
        } //g-max
        /**
         * Enable controls, call only once
         * @param {boolean} force?=false - Force handle
         * @returns {boolean} bound? - whether bind suceeded or it was already bound earlier
         */
        handle(force = false) {
            if (!this._handled || force) {
                this._mobile ? this._mobileAdapt() : this._pcAdapt();
                return this._handled = true;
            }
            return false;
        } //handle
        /**
         * Re-apply internal transformations
         * @returns {ControllableCanvas} this - For method chaining
         */
        retransform() {
            this.context.setTransform(1, 0, 0, 1, 0, 0);
            this.context.translate(this.trans[0], this.trans[1]);
            this.context.scale(this.scl[0], this.scl[1]);
            this.context.rotate(this.rot);
            return this;
        } //retransform
        /**
         * Intermediate translation function for iconic translate before the real
         * @param {number} x=0 - x translation
         * @param {number} y=0 - y translation
         * @param {boolean} abs?=false - abslute translation or relative to current
         * @returns {number[]} trans - Returns current total translation
         */
        translate(x = 0, y = 0, abs = false) {
            let by = [x, y].map(Number);
            return this.trans = this.trans.map((trn, idx) => bound(Number(!abs ? (trn + by[idx]) : by[idx]), this.transBounds[idx], this.transBounds[idx + 2]));
        } //translate
        /**
         * Intermediate scaling function for iconic scale before the real
         * @param {number} x=1 - x scale
         * @param {number} y=x - y scale
         * @param {boolean} abs?=false - abslute scale or relative to current
         * @returns {number[]} scl - Returns current total scaling
         */
        scale(x = 1, y = x, abs = false) {
            let by = [x, y].map(Number);
            return this.scl = this.scl.map((scl, idx) => bound(Number(!abs ? (scl * by[idx]) : by[idx]), this.sclBounds[idx], this.sclBounds[idx + 2]));
        } //scale
        _mobileAdapt() {
            if (!this._adapts.drag && this.dragEnabled) {
                this.target.addEventListener("touchstart", (e) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
                this.target.addEventListener("touchmove", this._adapts.pinchSwipe = this._adapts.pinch = this._adapts.drag = (e) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
                this.target.addEventListener("touchend", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
                this.target.addEventListener("touchcancel", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
            }
            if (!this._adapts.tilt) {
            }
        } //_mobileAdapt
        _pcAdapt() {
            if (!this._adapts.drag && this.dragEnabled) {
                this.target.addEventListener("mousemove", this._adapts.drag = (e) => ControllableCanvas.dragPC(e, this));
                this.target.addEventListener("mousedown", (e) => this._pressed = true);
                this.target.addEventListener("mouseup", (e) => this._pressed = false);
                if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT)
                    this.target.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true, passive: false });
            }
            if (!this._adapts.wheel && this.wheelEnabled) {
                this.target.addEventListener("wheel", this._adapts.wheel = (e) => ControllableCanvas.wheel(e, this));
            }
            if (!this._adapts.tilt) {
            }
        } //_pcAdapt
        static dragPC(event, cc) {
            if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
                return;
            }
            event.preventDefault();
            let coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop];
            if (cc._pressed) {
                cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
            }
            cc._coordinates = coords;
        } //dragPC
        static dragMobileMove(event, cc) {
            function check(arr, curr) {
                if (arr.every((ar, idx) => Math.abs(ar - curr[idx]) >= cc.touchSensitivity)) {
                    return true;
                }
                return false;
            } //check
            function arraynge(tlis) {
                return [[tlis[0].clientX, tlis[0].clientY], [tlis[1].clientX, tlis[1].clientY]];
            } //arraynge
            function every(t, nt, all = false) {
                let out = false;
                if (all && check(t[0], nt[0]) && check(t[1], nt[1])) {
                    return true;
                }
                else if (all) {
                    return false;
                }
                if (check(t[0], nt[0])) {
                    out = !out;
                }
                if (check(t[1], nt[1])) {
                    out = !out;
                }
                return out;
            } //every
            function inh(one = false) {
                cc._touches[0] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
                if (!one)
                    cc._touches[1] = [event.targetTouches[1].clientX - cc.target.offsetLeft, event.targetTouches[1].clientY - cc.target.offsetTop];
            } //inh
            event.preventDefault();
            let coords = [event.targetTouches[event.targetTouches.length - 1].clientX - cc.target.offsetLeft, event.targetTouches[event.targetTouches.length - 1].clientY - cc.target.offsetTop];
            if (cc._touches.length === 1) {
                cc.translate(...[coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map((v) => v * cc.transSpeed));
                inh(true);
            }
            else if (cc._touches.length === 2 && event.targetTouches.length === 2) {
                if (cc.pinchEnabled && (cc.scaleMode & Opts.ScaleMode.BYPASS) === Opts.ScaleMode.BYPASS) {
                    console.info("scaling bypass"); //SPECIAL CENTER*
                }
                else if (cc.pinchSwipeEnabled && every(arraynge(event.targetTouches), cc._touches)) {
                    console.info("rotation");
                }
                else if (cc.pinchEnabled && every(arraynge(event.targetTouches), cc._touches, true)) { //NEEDED FOR PRECISION!
                    console.info("scaling");
                    if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {
                    }
                    else {
                        //@ts-ignore
                        let inidist = dist([cc._touches[event.changedTouches[0].identifier][0], cc._touches[event.changedTouches[1].identifier][0]], [cc._touches[event.changedTouches[0].identifier][1], cc._touches[event.changedTouches[1].identifier][1]]), dis = dist([event.changedTouches[0].clientX - cc.target.offsetLeft, event.changedTouches[1].clientX - cc.target.offsetLeft], [event.changedTouches[0].clientY - cc.target.offsetTop, event.changedTouches[1].clientY - cc.target.offsetTop]), itouches = [cc._touches[0][0] + cc._touches[1][0], cc._touches[0][1] + cc._touches[1][1]].map((i, idx) => i / 2 - cc.trans[idx]), d = dis / inidist, ntouches = itouches.map((i) => i * (1 - d));
                        cc.translate(...ntouches);
                        cc.scale(d);
                    }
                }
                inh();
            }
            cc._coordinates = coords;
        } //dragMobileMove
        static dragMobileStart(event, cc, cust = false) {
            event.preventDefault();
            if (!cust) {
                Array.from(event.changedTouches).forEach((t) => cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop]);
            }
            cc._coordinates = cc._touches[cc._touches.length - 1];
        } //dragMobileStart
        static dragMobileEnd(event, cc) {
            event.preventDefault();
            Array.from(event.changedTouches).forEach((t) => {
                cc._touches.splice(t.identifier, 1);
            });
            if (Object.keys(cc._touches).length == 1) {
                ControllableCanvas.dragMobileStart(event, cc, true);
            }
        } //dragMobileEnd
        static wheel(event, cc) {
            event.preventDefault();
            let d = 1 - cc.sclSpeed * ControllableCanvas.fixDelta(event.deltaMode, event.deltaY) / cc.min, coords = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]];
            cc.translate(...coords.map((c) => c * (1 - d)));
            cc.scale(d);
        } //wheel
        static get isMobile() {
            if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i)
                || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)
                || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
                return true;
            }
            else {
                return false;
            }
        } //detectMobile
        static get lineToPix() {
            let r, iframe = document.createElement("iframe");
            iframe.src = '#';
            document.body.appendChild(iframe);
            let iwin = iframe.contentWindow, idoc = iwin.document;
            idoc.open();
            idoc.write('<!DOCTYPE html><html><head></head><body><p>a</p></body></html>');
            idoc.close();
            let span = idoc.body.firstElementChild;
            r = span.offsetHeight;
            document.body.removeChild(iframe);
            return r;
        } //lineToPix
        static fixDelta(mode, deltaY) {
            if (mode === 1) {
                return ControllableCanvas._linepix * deltaY;
            }
            else if (mode === 2) {
                return window.innerHeight;
            }
            else {
                return deltaY;
            }
        } //fixDelta
    } //ControllableCanvas
    ControllableCanvas._linepix = 10;
    /**
     * Default options for ControllableCanvas
     * @readonly
     * @static
     */
    ControllableCanvas.defaultOpts = {
        target: document.getElementsByTagName("canvas")[0],
        trans: [0, 0],
        scl: [1, 1],
        rot: 0,
        dragEnabled: false,
        pinchEnabled: false,
        pinchSwipeEnabled: false,
        wheelEnabled: false,
        panEnabled: false,
        tiltEnabled: false,
        eventsReversed: false,
        useButton: 1,
        scaleMode: 1,
        transSpeed: 1,
        sclSpeed: 1,
        touchSensitivity: .5,
        sclBounds: [0, 0, Infinity, Infinity],
        transBounds: [-Infinity, -Infinity, Infinity, Infinity],
        _adapts: {
            drag: false,
            pinch: false,
            pinchSwipe: false,
            wheel: false,
            pan: false,
            tilt: false
        }
    };
    CanvasControls.ControllableCanvas = ControllableCanvas;
})(CanvasControls = exports.CanvasControls || (exports.CanvasControls = {})); //CanvasControls
exports.default = CanvasControls.ControllableCanvas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBR0g7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0EyZ0IzQjtBQTNnQkQsV0FBYyxjQUFjO0lBRTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBUyxPQUFPLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxZQUFzQixDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsSUFBWSxFQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxSixLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNuQixTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLFNBQVM7SUFFWDs7Ozs7Ozs7T0FRRztJQUNILFNBQVMsS0FBSyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxPQUFPO0lBRVQ7Ozs7Ozs7T0FPRztJQUNILFNBQVMsSUFBSSxDQUFDLEVBQVksRUFBRSxFQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFXLEVBQUUsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqSSxDQUFDLENBQUMsTUFBTTtJQUVSOzs7T0FHRztJQUNILElBQWlCLElBQUksQ0FxRnBCO0lBckZELFdBQWlCLElBQUk7UUErRXBCLElBQVksU0FFWDtRQUZELFdBQVksU0FBUztZQUNwQiwrQ0FBVyxDQUFBO1lBQUUsaURBQVEsQ0FBQTtZQUFFLCtDQUFPLENBQUE7UUFDL0IsQ0FBQyxFQUZXLFNBQVMsR0FBVCxjQUFTLEtBQVQsY0FBUyxRQUVwQixDQUFDLFdBQVc7UUFDYixJQUFZLFNBRVg7UUFGRCxXQUFZLFNBQVM7WUFDcEIsNkNBQVUsQ0FBQTtZQUFFLG1EQUFTLENBQUE7WUFBRSw2Q0FBVSxDQUFBO1FBQ2xDLENBQUMsRUFGVyxTQUFTLEdBQVQsY0FBUyxLQUFULGNBQVMsUUFFcEIsQ0FBQyxXQUFXO0lBQ2QsQ0FBQyxFQXJGZ0IsSUFBSSxHQUFKLG1CQUFJLEtBQUosbUJBQUksUUFxRnBCLENBQUMsTUFBTTtJQUVSOzs7T0FHRztJQUNILElBQWlCLE1BQU0sQ0FJdEI7SUFKRCxXQUFpQixNQUFNO1FBQ1QsZUFBUSxHQUFjLElBQUksU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDakUsY0FBTyxHQUFjLElBQUksU0FBUyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDdEUsa0JBQVcsR0FBYyxJQUFJLFNBQVMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBQzVGLENBQUMsRUFKZ0IsTUFBTSxHQUFOLHFCQUFNLEtBQU4scUJBQU0sUUFJdEIsQ0FBQyxRQUFRO0lBR1Y7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXdCRztJQUNILE1BQWEsa0JBQWtCO1FBK0Q5Qjs7OztXQUlHO1FBQ0gsWUFBWSxPQUF1QyxrQkFBa0IsQ0FBQyxXQUFXO1lBakVqRixVQUFLLEdBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekIsUUFBRyxHQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLFFBQUcsR0FBVyxDQUFDLENBQUM7WUFFaEIsZ0JBQVcsR0FBYSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNuRSxjQUFTLEdBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNqRCxnQkFBVyxHQUFZLEtBQUssQ0FBQztZQUM3QixpQkFBWSxHQUFZLEtBQUssQ0FBQztZQUM5QixzQkFBaUIsR0FBWSxLQUFLLENBQUM7WUFDbkMsaUJBQVksR0FBWSxLQUFLLENBQUM7WUFDOUIsZUFBVSxHQUFZLEtBQUssQ0FBQztZQUM1QixnQkFBVyxHQUFZLEtBQUssQ0FBQztZQUM3QixtQkFBYyxHQUFZLEtBQUssQ0FBQztZQUNoQyxjQUFTLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDM0MsY0FBUyxHQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMscURBQXFEO1lBQ2hHLGVBQVUsR0FBVyxDQUFDLENBQUM7WUFDdkIsYUFBUSxHQUFXLENBQUMsQ0FBQztZQUNyQixxQkFBZ0IsR0FBVyxFQUFFLENBQUM7WUFDdEIsYUFBUSxHQUFZLEtBQUssQ0FBQztZQUMxQixZQUFPLEdBQVksS0FBSyxDQUFDO1lBQ3pCLGFBQVEsR0FBWSxLQUFLLENBQUM7WUFFMUIsaUJBQVksR0FBYSxFQUFHLENBQUM7WUFDN0IsYUFBUSxHQUFlLEVBQUcsQ0FBQztZQTJDbEMsT0FBTyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU5QyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxZQUFZLGlCQUFpQixDQUFDLEVBQUU7Z0JBQ2hELE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQzthQUN0QjtpQkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxJQUFTLEdBQUcsWUFBWSxZQUFZLElBQVMsR0FBRyxZQUFZLFlBQVksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ25RLE1BQU0sTUFBTSxDQUFDLFdBQVcsQ0FBQzthQUN6QjtZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFFLGdCQUFnQjtZQUVoRixJQUFJLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFO2dCQUMzQixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzNEO2lCQUFNLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksS0FBSyxJQUFTLElBQUksQ0FBQyxHQUFHLFlBQVksWUFBWSxJQUFTLElBQUksQ0FBQyxHQUFHLFlBQVksWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQVEsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRTtnQkFDdE4sTUFBTSxNQUFNLENBQUMsV0FBVyxDQUFDO2FBQ3pCO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLE9BQU8sR0FBb0MsRUFBRyxDQUFDO1lBQ3BELE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVwQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBRSxhQUFhO1lBQzNFLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUUsYUFBYTtZQUV2RSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDeEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUU1QyxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxDQUFDO1lBQzNDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRO2dCQUFFLGtCQUFrQixDQUFDLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7UUFDOUYsQ0FBQyxDQUFDLE1BQU07UUFFUixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQy9DLENBQUMsQ0FBQyxTQUFTO1FBRVgsSUFBSSxHQUFHO1lBQ04sT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLE9BQU87UUFDVCxJQUFJLEdBQUc7WUFDTixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsT0FBTztRQUdUOzs7O1dBSUc7UUFDSCxNQUFNLENBQUMsUUFBaUIsS0FBSztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2FBQzVCO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDLENBQUMsUUFBUTtRQUdWOzs7V0FHRztRQUNILFdBQVc7WUFDVixJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxhQUFhO1FBRWY7Ozs7OztXQU1HO1FBQ0gsU0FBUyxDQUFDLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQyxFQUFFLE1BQWUsS0FBSztZQUMzRCxJQUFJLEVBQUUsR0FBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JLLENBQUMsQ0FBQyxXQUFXO1FBQ2I7Ozs7OztXQU1HO1FBQ0gsS0FBSyxDQUFDLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQyxFQUFFLE1BQWUsS0FBSztZQUN2RCxJQUFJLEVBQUUsR0FBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdKLENBQUMsQ0FBQyxPQUFPO1FBR0QsWUFBWTtZQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDL0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDaE0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDM0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFhLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQzthQUM5SDtZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTthQUV2QjtRQUNGLENBQUMsQ0FBQyxjQUFjO1FBQ1IsUUFBUTtZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQWEsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNySCxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDLENBQWMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDcEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFjLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBQ25GLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRO29CQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQ2xNO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBYSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDakg7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUU7YUFFdkI7UUFDRixDQUFDLENBQUMsVUFBVTtRQUVaLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBaUIsRUFBRSxFQUFzQjtZQUN0RCxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbmdCLE9BQU87YUFDUDtZQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQU0sR0FBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRW5HLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtnQkFDaEIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDL0U7WUFFRCxFQUFFLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsUUFBUTtRQUVWLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBaUIsRUFBRSxFQUFzQjtZQUM5RCxTQUFTLEtBQUssQ0FBQyxHQUFhLEVBQUUsSUFBYztnQkFDM0MsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBVSxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7b0JBQzVGLE9BQU8sSUFBSSxDQUFDO2lCQUNaO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLE9BQU87WUFDVCxTQUFTLFFBQVEsQ0FBQyxJQUFlO2dCQUNoQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQyxDQUFDLFVBQVU7WUFDWixTQUFTLEtBQUssQ0FBQyxDQUFhLEVBQUUsRUFBYyxFQUFFLE1BQWUsS0FBSztnQkFDakUsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDO2dCQUNoQixJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3BELE9BQU8sSUFBSSxDQUFDO2lCQUNaO3FCQUFNLElBQUksR0FBRyxFQUFFO29CQUNmLE9BQU8sS0FBSyxDQUFDO2lCQUNiO2dCQUNELElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdkIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO2lCQUNYO2dCQUNELElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtvQkFDdkIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO2lCQUNYO2dCQUNELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQyxDQUFDLE9BQU87WUFDVCxTQUFTLEdBQUcsQ0FBQyxNQUFlLEtBQUs7Z0JBQ2hDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvSCxJQUFJLENBQUMsR0FBRztvQkFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxSSxDQUFDLENBQUMsS0FBSztZQUVQLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQU0sR0FBYSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFL0wsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hILEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNWO2lCQUFNLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEUsSUFBSSxFQUFFLENBQUMsWUFBWSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO29CQUN4RixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBRSxpQkFBaUI7aUJBQ2xEO3FCQUFNLElBQUksRUFBRSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDckYsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDekI7cUJBQU0sSUFBSSxFQUFFLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRyx1QkFBdUI7b0JBQ2hILE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7cUJBRTNFO3lCQUFNO3dCQUNOLFlBQVk7d0JBQ1osSUFBSSxPQUFPLEdBQVcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzdPLEdBQUcsR0FBVyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUNwUCxRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUs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QixTQUFTLEVBQUUsQ0FBQztRQUNaLFNBQVMsRUFBRSxDQUFDO1FBQ1osVUFBVSxFQUFFLENBQUM7UUFDYixRQUFRLEVBQUUsQ0FBQztRQUNYLGdCQUFnQixFQUFFLEVBQUU7UUFDcEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ3JDLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDdkQsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLEtBQUs7WUFDWCxLQUFLLEVBQUUsS0FBSztZQUNaLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLEtBQUssRUFBRSxLQUFLO1lBQ1osR0FBRyxFQUFFLEtBQUs7WUFDVixJQUFJLEVBQUUsS0FBSztTQUNYO0tBQ0QsQ0FBQztJQTdEVSxpQ0FBa0IscUJBOFY5QixDQUFBO0FBRUYsQ0FBQyxFQTNnQmEsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUEyZ0IzQixDQUFDLGdCQUFnQjtBQUVsQixrQkFBZSxjQUFjLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCBcIkBiYWJlbC9wb2x5ZmlsbFwiO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIENhbnZhc0NvbnRyb2xzLnRzXHJcbiAqIEBjb3B5cmlnaHQgVmFsZW4uIEguIDJrMThcclxuICogQGF1dGhvciBWYWxlbi5ILiA8YWx0ZXJuYXRpdmV4eHh5QGdtYWlsLmNvbT5cclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIFRoZSByb290IG9mIHRoZSBtYWluIGxpYnJhcnlcclxuICogQG1vZHVsZSBDYW52YXNDb250cm9sc1xyXG4gKiBAbGljZW5zZSBJU0NcclxuICogQGdsb2JhbFxyXG4gKi9cclxuZXhwb3J0IG1vZHVsZSBDYW52YXNDb250cm9scyB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIElmIGBkZXN0YCBsYWNrcyBhIHByb3BlcnR5IHRoYXQgYHRhcmdgIGhhcyB0aGVuIHRoYXQgcHJvcGVydHkgaXMgY29waWVkIGludG8gYGRlc3RgXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IGRlc3QgLSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGFyZyAtIGJhc2Ugb2JqZWN0XHJcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY29uZGl0aW9uIC0gaW5oZXJpdGFuY2UgY29uZGl0aW9uXHJcblx0ICogQHJldHVybnMge29iamVjdH0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICovXHJcblx0ZnVuY3Rpb24gaW5oZXJpdChkZXN0OiB7fSwgdGFyZzoge30sIGNvbmRpdGlvbjogRnVuY3Rpb24gPSAoZGVzdDoge30sIHRhcmc6IHt9LCBwcm9wOiBzdHJpbmcpOiBhbnkgPT4gZGVzdFtwcm9wXSA9PT0gdW5kZWZpbmVkICYmIChkZXN0W3Byb3BdID0gdGFyZ1twcm9wXSkpOiB7fSB7XHJcblx0XHRmb3IgKGxldCBpIGluIHRhcmcpIHtcclxuXHRcdFx0Y29uZGl0aW9uKGRlc3QsIHRhcmcsIGkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkZXN0O1xyXG5cdH0gLy9pbmhlcml0XHJcblxyXG5cdC8qKlxyXG5cdCAqIFJlc3RyaWN0IG51bWJlcidzIHJhbmdlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSB0YXJnZXQgbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gbWF4aW11bSBudW1iZXJcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBib3VuZCBudW1iZXJcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBib3VuZChuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBuID4gTSA/IE0gOiAobiA8IG0gPyBtIDogbik7XHJcblx0fSAvL2JvdW5kXHJcblxyXG5cdC8qKlxyXG5cdCAqIENhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWHMgLSBYIGNvb3JkaW5hdGVzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWXMgLSBZIGNvb3JkaW5hdGVzXHJcblx0ICogQHJldHVybnMge251bWJlcn0gZGlzdGFuY2VcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBkaXN0KFhzOiBudW1iZXJbXSwgWXM6IG51bWJlcltdKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQoW1hzWzFdIC0gWHNbMF0sIFlzWzFdIC0gWXNbMF1dLm1hcCgodjogbnVtYmVyKSA9PiBNYXRoLnBvdyh2LCAyKSkucmVkdWNlKChhY2M6IG51bWJlciwgdjogbnVtYmVyKSA9PiBhY2MgKyB2KSk7XHJcblx0fSAvL2Rpc3RcclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBPcHRpb25zXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT3B0cyB7XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0XHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcHJvcCB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAcHJvcCB7bnVtYmVyW119IHJvdD0wLDAgLSBSb3RhdGlvblxyXG5cdFx0ICogQHByb3Age251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0XHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hTd2lwZUVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgcm90YXRpb24gb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0XHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0XHQgKiBAcHJvcCB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBwcm9wIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdFx0dGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdFx0dHJhbnM6IG51bWJlcltdO1xyXG5cdFx0XHRzY2w6IG51bWJlcltdO1xyXG5cdFx0XHRyb3Q6IG51bWJlcjtcclxuXHRcdFx0ZHJhZ0VuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHBpbmNoRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0cGluY2hTd2lwZUVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHdoZWVsRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0cGFuRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdGV2ZW50c1JldmVyc2VkOiBib29sZWFuO1xyXG5cdFx0XHR1c2VCdXR0b246IG51bWJlcjtcclxuXHRcdFx0c2NhbGVNb2RlOiBudW1iZXI7XHJcblx0XHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXTtcclxuXHRcdFx0c2NsQm91bmRzOiBudW1iZXJbXTtcclxuXHRcdFx0dHJhbnNTcGVlZDogbnVtYmVyO1xyXG5cdFx0XHRzY2xTcGVlZDogbnVtYmVyO1xyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXI7XHJcblx0XHRcdF9hZGFwdHM6IENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnNcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIE06IG1vYmlsZVxyXG5cdFx0ICogUDogcGNcclxuXHRcdCAqIE1QOiBib3RoXHJcblx0XHQgKiBcclxuXHRcdCAqIGRyYWc6XHJcblx0XHQgKlx0UDogbW91c2UgIGhvbGQgJiBtb3ZlXHJcblx0XHQgKlx0TTogdG91Y2ggIGhvbGQgJiBtb3ZlXHJcblx0XHQgKiBwaW5jaDpcclxuXHRcdCAqXHR0b3VjaCAgMi1maW5nZXIgJiAxLW1vdmVcclxuXHRcdCAqIHBpbmNoU3dpcGU6XHJcblx0XHQgKlx0dG91Y2ggIDItZmluZ2VyICYgMi1tb3ZlXHJcblx0XHQgKiB3aGVlbDpcclxuXHRcdCAqXHR3aGVlbCAgbW92ZSAgW3BjIHBpbmNoLWVxdWl2YWxlbnRdXHJcblx0XHQgKiBwYW46XHJcblx0XHQgKlx0ZGlzcG9zaXRpb24gZnJvbSBjZW50ZXIgY2F1c2VzIGNvbnN0YW50IHRyYW5zbGF0aW9uXHJcblx0XHQgKiB0aWx0OlxyXG5cdFx0ICpcdGRldmljZW1vdGlvbiAgY2F1c2VzIHBhbm5pbmcqXHJcblx0XHQgKlx0XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzIHtcclxuXHRcdFx0ZHJhZz86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0cGluY2g/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0cGluY2hTd2lwZT86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVxyXG5cdFx0XHR3aGVlbD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vUFxyXG5cdFx0XHRwYW4/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHRpbHQ/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEhcclxuXHRcdH0gLy9Vc2VCdXR0b25cclxuXHRcdGV4cG9ydCBlbnVtIFNjYWxlTW9kZSB7XHJcblx0XHRcdE5PUk1BTCA9IDEsIEZSRUVTQ0FMRSwgQllQQVNTID0gNFxyXG5cdFx0fSAvL1NjYWxlTW9kZVxyXG5cdH0gLy9PcHRzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgZXJyb3JzXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ0FOVjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBIVE1MQ2FudmFzRWxlbWVudC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENUWDogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTUFSUjI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgMi1hdC1sZWFzdCBOdW1iZXJzLlwiKTtcclxuXHR9IC8vRXJyb3JzXHJcblxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHJvdD0wLDAgLSBSb3RhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoYm90aCBmaW5nZXJzIHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBpbmNoU3dpcGVFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHJvdGF0aW9uIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0ICogQHByb3Age09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gX2Nvb3JkaW5hdGVzIC0gQ3VycmVudCBldmVudCBjb29yZGluYXRlc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdCAqIEBwcm9wIHtvYmplY3R9IF90b3VjaGVzIC0gTWFwIG9mIGFsbCBjdXJyZW50IHRvdWNoZXNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cm90OiBudW1iZXIgPSAwO1xyXG5cdFx0cGluOiBudW1iZXJbXTtcclxuXHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXSA9IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdHNjbEJvdW5kczogbnVtYmVyW10gPSBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGRyYWdFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBpbmNoU3dpcGVFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBhbkVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHRpbHRFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7IC8qKiBAdG9kbyBtYXNrOiBmcmVlc2NhbGUtYXhpcyxyb3RhdGlvbi1hcy1zY2FsaW5nICovXHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdHByaXZhdGUgX2hhbmRsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX21vYmlsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfcHJlc3NlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0X2FkYXB0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdHByaXZhdGUgX2Nvb3JkaW5hdGVzOiBudW1iZXJbXSA9IFsgXTtcclxuXHRcdHByaXZhdGUgX3RvdWNoZXM6IG51bWJlcltdW10gPSBbIF07XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0ge1xyXG5cdFx0XHR0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FudmFzXCIpWzBdLFxyXG5cdFx0XHR0cmFuczogWzAsIDBdLFxyXG5cdFx0XHRzY2w6IFsxLCAxXSxcclxuXHRcdFx0cm90OiAwLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoU3dpcGVFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC41LFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHBpbmNoU3dpcGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlXHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDb250cm9sbGFibGVDYW52YXMgY29uc3RydWN0b3JcclxuXHRcdCAqIEBwYXJhbSB7T3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zfSBvcHRzPz1Db250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMgLSBDb250cm9sbGFibGVDYW52YXMgT3B0aW9uc1xyXG5cdFx0ICogQGNvbnN0cnVjdG9yXHJcblx0XHQgKi9cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cykge1xyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cyk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoIShvcHRzLnRhcmdldCBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UQ0FOVjtcclxuXHRcdFx0fSBlbHNlIGlmIChbb3B0cy50cmFucywgb3B0cy5zY2wsIG9wdHMudHJhbnNCb3VuZHMsIG9wdHMuc2NsQm91bmRzXS5zb21lKGFyciA9PiAhKGFyciBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBhcnIubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKGFycikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpbmhlcml0KG9wdHMuX2FkYXB0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzLl9hZGFwdHMpOyAgLy9QT1NTSUJMRSBFUlJPUlxyXG5cclxuXHRcdFx0aWYgKG9wdHMucGluID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRvcHRzLnBpbiA9IFtvcHRzLnRhcmdldC53aWR0aCAvIDIsIG9wdHMudGFyZ2V0LmhlaWdodCAvIDJdO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEob3B0cy5waW4gaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IG9wdHMucGluLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShvcHRzLnBpbikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XHJcblx0XHRcdHRoaXMuY29udGV4dCA9IHRoaXMudGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcblx0XHRcdHRoaXMuX2FkYXB0cyA9IDxPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzPnsgfTtcclxuXHRcdFx0aW5oZXJpdCh0aGlzLl9hZGFwdHMsIG9wdHMuX2FkYXB0cyk7XHJcblxyXG5cdFx0XHR0aGlzLnJvdCA9IG9wdHMucm90ICogMTtcclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLnRyYW5zID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5zY2wgPSBBcnJheS5mcm9tKG9wdHMuc2NsKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5waW4gPSBBcnJheS5mcm9tKG9wdHMucGluKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy50cmFuc0JvdW5kcyA9IEFycmF5LmZyb20ob3B0cy50cmFuc0JvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblx0XHRcdHRoaXMuc2NsQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnNjbEJvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblxyXG5cdFx0XHR0aGlzLmRyYWdFbmFibGVkID0gISFvcHRzLmRyYWdFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBpbmNoRW5hYmxlZCA9ICEhb3B0cy5waW5jaEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hTd2lwZUVuYWJsZWQgPSAhIW9wdHMucGluY2hTd2lwZUVuYWJsZWQ7XHJcblx0XHRcdHRoaXMud2hlZWxFbmFibGVkID0gISFvcHRzLndoZWVsRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5wYW5FbmFibGVkID0gISFvcHRzLnBhbkVuYWJsZWQ7XHJcblx0XHRcdHRoaXMudGlsdEVuYWJsZWQgPSAhIW9wdHMudGlsdEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMuZXZlbnRzUmV2ZXJzZWQgPSAhIW9wdHMuZXZlbnRzUmV2ZXJzZWQ7XHJcblxyXG5cdFx0XHR0aGlzLl9oYW5kbGVkID0gZmFsc2U7XHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbIF07XHJcblx0XHRcdHRoaXMuX21vYmlsZSA9IENvbnRyb2xsYWJsZUNhbnZhcy5pc01vYmlsZTtcclxuXHRcdFx0aWYgKCFDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXgpIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCA9IENvbnRyb2xsYWJsZUNhbnZhcy5saW5lVG9QaXg7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdGdldCByYXRpbygpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50YXJnZXQud2lkdGggLyB0aGlzLnRhcmdldC5oZWlnaHQ7XHJcblx0XHR9IC8vZy1yYXRpb1xyXG5cclxuXHRcdGdldCBtaW4oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWluKHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWluXHJcblx0XHRnZXQgbWF4KCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1heCh0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1heFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9scywgY2FsbCBvbmx5IG9uY2VcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2U/PWZhbHNlIC0gRm9yY2UgaGFuZGxlXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYm91bmQ/IC0gd2hldGhlciBiaW5kIHN1Y2VlZGVkIG9yIGl0IHdhcyBhbHJlYWR5IGJvdW5kIGVhcmxpZXJcclxuXHRcdCAqL1xyXG5cdFx0aGFuZGxlKGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9oYW5kbGVkIHx8IGZvcmNlKSB7XHJcblx0XHRcdFx0dGhpcy5fbW9iaWxlID8gdGhpcy5fbW9iaWxlQWRhcHQoKSA6IHRoaXMuX3BjQWRhcHQoKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5faGFuZGxlZCA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2hhbmRsZVxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQucm90YXRlKHRoaXMucm90KTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vcmV0cmFuc2Zvcm1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSB0cmFuc2xhdGlvbiBmdW5jdGlvbiBmb3IgaWNvbmljIHRyYW5zbGF0ZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSB4IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT0wIC0geSB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IHRyYW5zIC0gUmV0dXJucyBjdXJyZW50IHRvdGFsIHRyYW5zbGF0aW9uXHJcblx0XHQgKi9cclxuXHRcdHRyYW5zbGF0ZSh4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwLCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBib3VuZChOdW1iZXIoIWFicyA/ICh0cm4gKyBieVtpZHhdKSA6IGJ5W2lkeF0pLCB0aGlzLnRyYW5zQm91bmRzW2lkeF0sIHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzbHV0ZSBzY2FsZSBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IHNjbCAtIFJldHVybnMgY3VycmVudCB0b3RhbCBzY2FsaW5nXHJcblx0XHQgKi9cclxuXHRcdHNjYWxlKHg6IG51bWJlciA9IDEsIHk6IG51bWJlciA9IHgsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYm91bmQoTnVtYmVyKCFhYnMgPyAoc2NsICogYnlbaWR4XSkgOiBieVtpZHhdKSwgdGhpcy5zY2xCb3VuZHNbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy9zY2FsZVxyXG5cclxuXHJcblx0XHRwcml2YXRlIF9tb2JpbGVBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLl9hZGFwdHMucGluY2hTd2lwZSA9IHRoaXMuX2FkYXB0cy5waW5jaCA9IHRoaXMuX2FkYXB0cy5kcmFnID0gKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlTW92ZShlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCAoZTogVG91Y2hFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IHRydWUpO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IGZhbHNlKTtcclxuXHRcdFx0XHRpZiAoKHRoaXMudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMud2hlZWwgJiYgdGhpcy53aGVlbEVuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5fYWRhcHRzLndoZWVsID0gKGU6IFdoZWVsRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy53aGVlbChlLCB0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19wY0FkYXB0XHJcblxyXG5cdFx0c3RhdGljIGRyYWdQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRpZiAoKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmICgoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpID09PSAyKSB8fCAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggPT09IDMpIHx8ICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uID09PSAyKSkpIHx8ICgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFQk9USCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRUJPVEggJiYgKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSAhPT0gMikgJiYgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoICE9PSAzKSAmJiAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMikpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuX3ByZXNzZWQpIHtcclxuXHRcdFx0XHRjYy50cmFuc2xhdGUoZXZlbnQubW92ZW1lbnRYICogY2MudHJhbnNTcGVlZCwgZXZlbnQubW92ZW1lbnRZICogY2MudHJhbnNTcGVlZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnUENcclxuXHJcblx0XHRzdGF0aWMgZHJhZ01vYmlsZU1vdmUoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2soYXJyOiBudW1iZXJbXSwgY3VycjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoYXJyLmV2ZXJ5KChhcjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gTWF0aC5hYnMoYXIgLSBjdXJyW2lkeF0pID49IGNjLnRvdWNoU2Vuc2l0aXZpdHkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9IC8vY2hlY2tcclxuXHRcdFx0ZnVuY3Rpb24gYXJyYXluZ2UodGxpczogVG91Y2hMaXN0KTogbnVtYmVyW11bXSB7XHJcblx0XHRcdFx0cmV0dXJuIFtbdGxpc1swXS5jbGllbnRYLCB0bGlzWzBdLmNsaWVudFldLCBbdGxpc1sxXS5jbGllbnRYLCB0bGlzWzFdLmNsaWVudFldXTtcclxuXHRcdFx0fSAvL2FycmF5bmdlXHJcblx0XHRcdGZ1bmN0aW9uIGV2ZXJ5KHQ6IG51bWJlcltdW10sIG50OiBudW1iZXJbXVtdLCBhbGw6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCBvdXQgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoYWxsICYmIGNoZWNrKHRbMF0sIG50WzBdKSAmJiBjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWxsKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzBdLCBudFswXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHRcdH0gLy9ldmVyeVxyXG5cdFx0XHRmdW5jdGlvbiBpbmgob25lOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlc1swXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdFx0aWYgKCFvbmUpIGNjLl90b3VjaGVzWzFdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0fSAvL2luaFxyXG5cclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLltjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0sIGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy50cmFuc1NwZWVkKSk7XHJcblx0XHRcdFx0aW5oKHRydWUpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA9PT0gMikge1xyXG5cdFx0XHRcdGlmIChjYy5waW5jaEVuYWJsZWQgJiYgKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkJZUEFTUykgPT09IE9wdHMuU2NhbGVNb2RlLkJZUEFTUykge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKFwic2NhbGluZyBieXBhc3NcIik7ICAvL1NQRUNJQUwgQ0VOVEVSKlxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoY2MucGluY2hTd2lwZUVuYWJsZWQgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKFwicm90YXRpb25cIik7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChjYy5waW5jaEVuYWJsZWQgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzLCB0cnVlKSkgeyAgLy9ORUVERUQgRk9SIFBSRUNJU0lPTiFcclxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhcInNjYWxpbmdcIik7XHJcblx0XHRcdFx0XHRpZiAoKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkgPT09IE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkge1xyXG5cclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0XHRsZXQgaW5pZGlzdDogbnVtYmVyID0gZGlzdChbY2MuX3RvdWNoZXNbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdLCBjYy5fdG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0pLFxyXG5cdFx0XHRcdFx0XHRcdGRpczogbnVtYmVyID0gZGlzdChbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AsIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSksXHJcblx0XHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzWzBdWzBdICsgY2MuX3RvdWNoZXNbMV1bMF0sIGNjLl90b3VjaGVzWzBdWzFdICsgY2MuX3RvdWNoZXNbMV1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0XHRkOiBudW1iZXIgPSBkaXMgLyBpbmlkaXN0LFxyXG5cdFx0XHRcdFx0XHRcdG50b3VjaGVzOiBudW1iZXJbXSA9IGl0b3VjaGVzLm1hcCgoaTogbnVtYmVyKSA9PiBpICogKDEgLSBkKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRjYy50cmFuc2xhdGUoLi4ubnRvdWNoZXMpO1xyXG5cdFx0XHRcdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aW5oKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnTW9iaWxlTW92ZVxyXG5cdFx0c3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmICghY3VzdCkge1xyXG5cdFx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiBjYy5fdG91Y2hlc1t0LmlkZW50aWZpZXJdID0gW3QuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY2MuX3RvdWNoZXNbY2MuX3RvdWNoZXMubGVuZ3RoIC0gMV07XHJcblx0XHR9IC8vZHJhZ01vYmlsZVN0YXJ0XHJcblx0XHRzdGF0aWMgZHJhZ01vYmlsZUVuZChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0aWYgKE9iamVjdC5rZXlzKGNjLl90b3VjaGVzKS5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZXZlbnQsIGNjLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2RyYWdNb2JpbGVFbmRcclxuXHJcblx0XHRzdGF0aWMgd2hlZWwoZXZlbnQ6IFdoZWVsRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0bGV0IGQ6IG51bWJlciA9IDEgLSBjYy5zY2xTcGVlZCAqIENvbnRyb2xsYWJsZUNhbnZhcy5maXhEZWx0YShldmVudC5kZWx0YU1vZGUsIGV2ZW50LmRlbHRhWSkgLyBjYy5taW4sXHJcblx0XHRcdFx0Y29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV07XHJcblx0XHRcdGNjLnRyYW5zbGF0ZSguLi5jb29yZHMubWFwKChjOiBudW1iZXIpID0+IGMgKiAoMSAtIGQpKSk7XHJcblx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0fSAvL3doZWVsXHJcblxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBpc01vYmlsZSgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvd2ViT1MvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2RldGVjdE1vYmlsZVxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBsaW5lVG9QaXgoKTogbnVtYmVyIHtcclxuXHRcdFx0bGV0IHI6IG51bWJlcixcclxuXHRcdFx0XHRpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuXHRcdFx0aWZyYW1lLnNyYyA9ICcjJztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRsZXQgaXdpbjogV2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3csXHJcblx0XHRcdFx0aWRvYzogRG9jdW1lbnQgPSBpd2luLmRvY3VtZW50O1xyXG5cdFx0XHRpZG9jLm9wZW4oKTtcclxuXHRcdFx0aWRvYy53cml0ZSgnPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PC9oZWFkPjxib2R5PjxwPmE8L3A+PC9ib2R5PjwvaHRtbD4nKTtcclxuXHRcdFx0aWRvYy5jbG9zZSgpO1xyXG5cdFx0XHRsZXQgc3BhbjogSFRNTEVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+aWRvYy5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG5cdFx0XHRyID0gc3Bhbi5vZmZzZXRIZWlnaHQ7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0cmV0dXJuIHI7XHJcblx0XHR9IC8vbGluZVRvUGl4XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZml4RGVsdGEobW9kZTogbnVtYmVyLCBkZWx0YVk6IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRcdGlmIChtb2RlID09PSAxKSB7XHJcblx0XHRcdFx0cmV0dXJuIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCAqIGRlbHRhWTtcclxuXHRcdFx0fSBlbHNlIGlmIChtb2RlID09PSAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZGVsdGFZO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZml4RGVsdGFcclxuXHRcdFxyXG5cdH0gLy9Db250cm9sbGFibGVDYW52YXNcclxuXHJcbn0gLy9DYW52YXNDb250cm9sc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2FudmFzQ29udHJvbHMuQ29udHJvbGxhYmxlQ2FudmFzO1xyXG4iXX0=