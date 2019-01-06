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
     * Checks if pointer is inside an area
     * @param {number[]} box - x,y,dx,dy
     * @param {number[]} point - x,y
     * @param {number} sensitivity - extra boundary
     * @returns boolean
     * @inner
     * @function
     */
    function isWithin(box, point, sensitivity = .5) {
        return box[0] - sensitivity <= point[0] && box[0] + box[2] + sensitivity >= point[0] && box[1] - sensitivity <= point[1] && box[1] + box[3] + sensitivity >= point[1];
    } //isWithin
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
        Errors.ENOTNUMARR = new TypeError("Not an Array of Numbers.");
        Errors.EISALR = new ReferenceError("Object is already registered.");
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
     * @prop {Class} CanvasButton - A widget-making class for canvas
     * @prop {Set<CanvasButton>} wgets - Canvas widgets
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
            this.wgets = new Set(opts.wgets);
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
         * @method
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
        addWidget(data) {
            if (data instanceof CanvasButton && !this.wgets.has(data)) {
                this.wgets.add(data);
            }
            else if (!(data instanceof CanvasButton)) {
                data = new ControllableCanvas.CanvasButton(data);
                this.wgets.add(data);
            }
            else {
                throw Errors.EISALR;
            }
            return data;
        } //addWidget
        /**
         * Re-apply internal transformations
         * @method
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
         * @method
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
         * @method
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
            cc._pressed = true;
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
            cc._pressed = !!cc._touches.length;
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
        },
        wgets: new Set()
    };
    CanvasControls.ControllableCanvas = ControllableCanvas;
    /**
     * A widget-making class for canvas
     * @memberof ControllableCanvas
     * @prop {number} x - x coordinate
     * @prop {number} y - y coordinate
     * @prop {number} dx - width
     * @prop {number} dy - height
     * @prop {number} index - equivalent to CSS z-index
     */
    class CanvasButton {
        constructor(opts = CanvasButton.defaultOpts) {
            this.x = 0;
            this.y = 0;
            this.dx = 0;
            this.dy = 0;
            this.index = -1;
            this.pstate = false;
            inherit(opts, CanvasButton.defaultOpts);
            if ([opts.x, opts.y, opts.dx, opts.dy].some((num) => isNaN(num) || num === '')) {
                throw Errors.ENOTNUMARR;
            }
            this.x = opts.x * 1;
            this.y = opts.y * 1;
            this.dx = opts.dx * 1;
            this.dy = opts.dy * 1;
            this._id = CanvasButton._idcntr++;
        } //ctor
        //@Override
        blur(...any) {
        } //blur
        //@Override
        focus(...any) {
        } //focus
        //@Override
        click() {
        } //click
        isOn(relativeCoords) {
            let out = isWithin([this.x, this.y, this.dx, this.dy], [relativeCoords[0], relativeCoords[1]]);
            if (out && !this.pstate) {
                this.focus(relativeCoords);
            }
            else if (!out && this.pstate) {
                this.blur(relativeCoords);
            }
            return out;
        } //isOn
    }
    CanvasButton.sensitivity = .5;
    CanvasButton._idcntr = 0;
    /**
     * Default options for CanvasButton
     * @readonly
     * @static
     */
    CanvasButton.defaultOpts = {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        index: -1,
        pstate: false,
        parent: new ControllableCanvas
    };
    ControllableCanvas.CanvasButton = CanvasButton;
    /**
     * A class offering mathematical Vector utilities
     * @inner
     * @class
     * @prop {number[]} props - vector vertices
     */
    class Vector {
        constructor(props = []) {
            this.props = Array.from(props.map(Number));
        } //ctor
        /**
         * Add a vector or number to current vector
         * @method
         * @param {Vector|number} targ - target
         * @param {number} sub - Set to `-1` to substract instead
         * @returns `this` for method chaining
         */
        add(targ, sub = 1) {
            if (targ instanceof Vector) {
                this.props.forEach((prop, idx) => {
                    this.props[idx] += sub * targ[idx];
                });
            }
            else {
                this.props.forEach((prop, idx) => {
                    this.props[idx] += sub * targ;
                });
            }
            return this;
        } //add
        /**
         * Multiply a vector or number to current vector
         * @method
         * @param {Vector|number} targ - target
         * @param {number} div - Set to `-1` to divide instead
         * @returns `this` for method chaining
         */
        mult(targ, div = 1) {
            if (targ instanceof Vector) {
                this.props.forEach((prop, idx) => {
                    this.props[idx] *= Math.pow(targ[idx], div);
                });
            }
            else {
                this.props.forEach((prop, idx) => {
                    this.props[idx] *= Math.pow(targ, div);
                });
            }
            return this;
        } //mult
        /**
         * Dot product of 2 vectors
         * @method
         * @param {Vector} targ - target
         * @returns product
         */
        dot(targ) {
            return this.props.reduce((acc, val, idx) => acc + val * targ[idx]);
        } //dot
    } //Vector
    CanvasControls.Vector = Vector;
})(CanvasControls = exports.CanvasControls || (exports.CanvasControls = {})); //CanvasControls
exports.default = CanvasControls.ControllableCanvas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBR0g7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0F3dEIzQjtBQXh0QkQsV0FBYyxjQUFjO0lBSTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBUyxPQUFPLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxZQUFzQixDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsSUFBWSxFQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxSixLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNuQixTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLFNBQVM7SUFFWDs7Ozs7Ozs7T0FRRztJQUNILFNBQVMsS0FBSyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxPQUFPO0lBRVQ7Ozs7Ozs7T0FPRztJQUNILFNBQVMsSUFBSSxDQUFDLEVBQVksRUFBRSxFQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFB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QyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7cUJBRTNFO3lCQUFNO3dCQUNOLFlBQVk7d0JBQ1osSUFBSSxPQUFPLEdBQVcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzdPLEdBQUcsR0FBVyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUNwUCxRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxD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O0lBdkRHLHFCQUFNLFNBdURsQixDQUFBO0FBRUYsQ0FBQyxFQXh0QmEsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUF3dEIzQixDQUFDLGdCQUFnQjtBQUVsQixrQkFBZSxjQUFjLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbmltcG9ydCBcIkBiYWJlbC9wb2x5ZmlsbFwiO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIENhbnZhc0NvbnRyb2xzLnRzXHJcbiAqIEBjb3B5cmlnaHQgVmFsZW4uIEguIDJrMThcclxuICogQGF1dGhvciBWYWxlbi5ILiA8YWx0ZXJuYXRpdmV4eHh5QGdtYWlsLmNvbT5cclxuICovXHJcblxyXG5cclxuLyoqXHJcbiAqIFRoZSByb290IG9mIHRoZSBtYWluIGxpYnJhcnlcclxuICogQG1vZHVsZSBDYW52YXNDb250cm9sc1xyXG4gKiBAbGljZW5zZSBJU0NcclxuICogQGdsb2JhbFxyXG4gKi9cclxuZXhwb3J0IG1vZHVsZSBDYW52YXNDb250cm9scyB7XHJcblxyXG5cdHR5cGUgQ2xhc3MgPSB7IG5ldyguLi5hcmdzOiBhbnlbXSk6IGFueTsgfTtcclxuXHJcblx0LyoqXHJcblx0ICogSWYgYGRlc3RgIGxhY2tzIGEgcHJvcGVydHkgdGhhdCBgdGFyZ2AgaGFzIHRoZW4gdGhhdCBwcm9wZXJ0eSBpcyBjb3BpZWQgaW50byBgZGVzdGBcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGVzdCAtIGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnIC0gYmFzZSBvYmplY3RcclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25kaXRpb24gLSBpbmhlcml0YW5jZSBjb25kaXRpb25cclxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBpbmhlcml0KGRlc3Q6IHt9LCB0YXJnOiB7fSwgY29uZGl0aW9uOiBGdW5jdGlvbiA9IChkZXN0OiB7fSwgdGFyZzoge30sIHByb3A6IHN0cmluZyk6IGFueSA9PiBkZXN0W3Byb3BdID09PSB1bmRlZmluZWQgJiYgKGRlc3RbcHJvcF0gPSB0YXJnW3Byb3BdKSk6IHt9IHtcclxuXHRcdGZvciAobGV0IGkgaW4gdGFyZykge1xyXG5cdFx0XHRjb25kaXRpb24oZGVzdCwgdGFyZywgaSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlc3Q7XHJcblx0fSAvL2luaGVyaXRcclxuXHJcblx0LyoqXHJcblx0ICogUmVzdHJpY3QgbnVtYmVyJ3MgcmFuZ2VcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbiAtIHRhcmdldCBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbSAtIG1pbmltdW0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBtYXhpbXVtIG51bWJlclxyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGJvdW5kIG51bWJlclxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNID8gTSA6IChuIDwgbSA/IG0gOiBuKTtcclxuXHR9IC8vYm91bmRcclxuXHJcblx0LyoqXHJcblx0ICogQ2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBYcyAtIFggY29vcmRpbmF0ZXNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBZcyAtIFkgY29vcmRpbmF0ZXNcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBkaXN0YW5jZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGRpc3QoWHM6IG51bWJlcltdLCBZczogbnVtYmVyW10pOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIE1hdGguc3FydChbWHNbMV0gLSBYc1swXSwgWXNbMV0gLSBZc1swXV0ubWFwKCh2OiBudW1iZXIpID0+IE1hdGgucG93KHYsIDIpKS5yZWR1Y2UoKGFjYzogbnVtYmVyLCB2OiBudW1iZXIpID0+IGFjYyArIHYpKTtcclxuXHR9IC8vZGlzdFxyXG5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBpbnNpZGUgYW4gYXJlYVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGJveCAtIHgseSxkeCxkeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IHBvaW50IC0geCx5XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHNlbnNpdGl2aXR5IC0gZXh0cmEgYm91bmRhcnlcclxuXHQgKiBAcmV0dXJucyBib29sZWFuXHJcblx0ICogQGlubmVyXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gaXNXaXRoaW4oYm94OiBudW1iZXJbXSwgcG9pbnQ6IG51bWJlcltdLCBzZW5zaXRpdml0eTogbnVtYmVyID0gLjUpOiBib29sZWFuIHtcclxuXHRcdHJldHVybiBib3hbMF0gLSBzZW5zaXRpdml0eSA8PSBwb2ludFswXSAmJiBib3hbMF0gKyBib3hbMl0gKyBzZW5zaXRpdml0eSA+PSBwb2ludFswXSAmJiBib3hbMV0gLSBzZW5zaXRpdml0eSA8PSBwb2ludFsxXSAmJiBib3hbMV0gKyBib3hbM10gKyBzZW5zaXRpdml0eSA+PSBwb2ludFsxXTtcclxuXHR9IC8vaXNXaXRoaW5cclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBPcHRpb25zXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT3B0cyB7XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoMSBmaW5nZXIgb25seSBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGluY2hTd2lwZUVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgcm90YXRpb24gb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdFx0ICogQG1lbWJlciB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0XHR0cmFuczogbnVtYmVyW107XHJcblx0XHRcdHNjbDogbnVtYmVyW107XHJcblx0XHRcdHJvdDogbnVtYmVyO1xyXG5cdFx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0cGluY2hFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRwaW5jaFN3aXBlRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRwYW5FbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHR0aWx0RW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGJvb2xlYW47XHJcblx0XHRcdHVzZUJ1dHRvbjogbnVtYmVyO1xyXG5cdFx0XHRzY2FsZU1vZGU6IG51bWJlcjtcclxuXHRcdFx0dHJhbnNCb3VuZHM6IG51bWJlcltdO1xyXG5cdFx0XHRzY2xCb3VuZHM6IG51bWJlcltdO1xyXG5cdFx0XHR0cmFuc1NwZWVkOiBudW1iZXI7XHJcblx0XHRcdHNjbFNwZWVkOiBudW1iZXI7XHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IG51bWJlcjtcclxuXHRcdFx0X2FkYXB0czogQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNPcHRpb25zXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBNOiBtb2JpbGVcclxuXHRcdCAqIFA6IHBjXHJcblx0XHQgKiBNUDogYm90aFxyXG5cdFx0ICogXHJcblx0XHQgKiBkcmFnOlxyXG5cdFx0ICpcdFA6IG1vdXNlICBob2xkICYgbW92ZVxyXG5cdFx0ICpcdE06IHRvdWNoICBob2xkICYgbW92ZVxyXG5cdFx0ICogcGluY2g6XHJcblx0XHQgKlx0dG91Y2ggIDItZmluZ2VyICYgMi1tb3ZlXHJcblx0XHQgKiBwaW5jaFN3aXBlOlxyXG5cdFx0ICpcdHRvdWNoICAyLWZpbmdlciAmIDEtbW92ZVxyXG5cdFx0ICogd2hlZWw6XHJcblx0XHQgKlx0d2hlZWwgIG1vdmUgIFtwYyBwaW5jaC1lcXVpdmFsZW50XVxyXG5cdFx0ICogcGFuOlxyXG5cdFx0ICpcdGRpc3Bvc2l0aW9uIGZyb20gY2VudGVyIGNhdXNlcyBjb25zdGFudCB0cmFuc2xhdGlvblxyXG5cdFx0ICogdGlsdDpcclxuXHRcdCAqXHRkZXZpY2Vtb3Rpb24gIGNhdXNlcyBwYW5uaW5nKlxyXG5cdFx0ICpcdFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycyB7XHJcblx0XHRcdGRyYWc/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHBpbmNoPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NXHJcblx0XHRcdHBpbmNoU3dpcGU/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0d2hlZWw/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL1BcclxuXHRcdFx0cGFuPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHR0aWx0PzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBPcHRpb25zIG9mIENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b25cclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHggLSB3aWRnZXQgd2lkdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHkgLSB3aWRnZXQgaGVpZ2h0XHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGluZGV4IC0gd2lkZ2V0IGV2ZW50IHByaW9yaXR5XHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdFx0eDogbnVtYmVyO1xyXG5cdFx0XHR5OiBudW1iZXI7XHJcblx0XHRcdGR4OiBudW1iZXI7XHJcblx0XHRcdGR5OiBudW1iZXI7XHJcblx0XHRcdGluZGV4OiBudW1iZXI7XHJcblx0XHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NhbnZhc0J1dHRvbk9wdGlvbnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEhcclxuXHRcdH0gLy9Vc2VCdXR0b25cclxuXHRcdGV4cG9ydCBlbnVtIFNjYWxlTW9kZSB7XHJcblx0XHRcdE5PUk1BTCA9IDEsIEZSRUVTQ0FMRSwgQllQQVNTID0gNFxyXG5cdFx0fSAvL1NjYWxlTW9kZVxyXG5cdH0gLy9PcHRzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgZXJyb3JzXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ0FOVjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBIVE1MQ2FudmFzRWxlbWVudC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENUWDogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTUFSUjI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgMi1hdC1sZWFzdCBOdW1iZXJzLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNQVJSOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEFycmF5IG9mIE51bWJlcnMuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVJU0FMUjogUmVmZXJlbmNlRXJyb3IgPSBuZXcgUmVmZXJlbmNlRXJyb3IoXCJPYmplY3QgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtcclxuXHR9IC8vRXJyb3JzXHJcblxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHJvdD0wLDAgLSBSb3RhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoYm90aCBmaW5nZXJzIHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBpbmNoU3dpcGVFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHJvdGF0aW9uIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0ICogQHByb3Age09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gX2Nvb3JkaW5hdGVzIC0gQ3VycmVudCBldmVudCBjb29yZGluYXRlc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdCAqIEBwcm9wIHtvYmplY3R9IF90b3VjaGVzIC0gTWFwIG9mIGFsbCBjdXJyZW50IHRvdWNoZXNcclxuXHQgKiBAcHJvcCB7Q2xhc3N9IENhbnZhc0J1dHRvbiAtIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQHByb3Age1NldDxDYW52YXNCdXR0b24+fSB3Z2V0cyAtIENhbnZhcyB3aWRnZXRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENvbnRyb2xsYWJsZUNhbnZhcyBpbXBsZW1lbnRzIE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0Y29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cdFx0dHJhbnM6IG51bWJlcltdID0gWzAsIDBdO1xyXG5cdFx0c2NsOiBudW1iZXJbXSA9IFsxLCAxXTtcclxuXHRcdHJvdDogbnVtYmVyID0gMDtcclxuXHRcdHBpbjogbnVtYmVyW107XHJcblx0XHR0cmFuc0JvdW5kczogbnVtYmVyW10gPSBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRzY2xCb3VuZHM6IG51bWJlcltdID0gWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGluY2hFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwaW5jaFN3aXBlRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0d2hlZWxFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwYW5FbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR0aWx0RW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0ZXZlbnRzUmV2ZXJzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHVzZUJ1dHRvbjogbnVtYmVyID0gT3B0cy5Vc2VCdXR0b24uVVNFTEVGVDtcclxuXHRcdHNjYWxlTW9kZTogbnVtYmVyID0gT3B0cy5TY2FsZU1vZGUuTk9STUFMOyAvKiogQHRvZG8gbWFzazogZnJlZXNjYWxlLWF4aXMscm90YXRpb24tYXMtc2NhbGluZyAqL1xyXG5cdFx0dHJhbnNTcGVlZDogbnVtYmVyID0gMTtcclxuXHRcdHNjbFNwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0dG91Y2hTZW5zaXRpdml0eTogbnVtYmVyID0gLjU7XHJcblx0XHR3Z2V0czogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRwcml2YXRlIF9oYW5kbGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9tb2JpbGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX3ByZXNzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdF9hZGFwdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRwcml2YXRlIF9jb29yZGluYXRlczogbnVtYmVyW10gPSBbIF07XHJcblx0XHRwcml2YXRlIF90b3VjaGVzOiBudW1iZXJbXVtdID0gWyBdO1xyXG5cdFx0c3RhdGljIENhbnZhc0J1dHRvbjogQ2xhc3M7XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0ge1xyXG5cdFx0XHR0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FudmFzXCIpWzBdLFxyXG5cdFx0XHR0cmFuczogWzAsIDBdLFxyXG5cdFx0XHRzY2w6IFsxLCAxXSxcclxuXHRcdFx0cm90OiAwLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoU3dpcGVFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC41LFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHBpbmNoU3dpcGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlXHJcblx0XHRcdH0sXHJcblx0XHRcdHdnZXRzOiBuZXcgU2V0KClcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDb250cm9sbGFibGVDYW52YXMgY29uc3RydWN0b3JcclxuXHRcdCAqIEBwYXJhbSB7T3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zfSBvcHRzPz1Db250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMgLSBDb250cm9sbGFibGVDYW52YXMgT3B0aW9uc1xyXG5cdFx0ICogQGNvbnN0cnVjdG9yXHJcblx0XHQgKi9cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cykge1xyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cyk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoIShvcHRzLnRhcmdldCBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UQ0FOVjtcclxuXHRcdFx0fSBlbHNlIGlmIChbb3B0cy50cmFucywgb3B0cy5zY2wsIG9wdHMudHJhbnNCb3VuZHMsIG9wdHMuc2NsQm91bmRzXS5zb21lKGFyciA9PiAhKGFyciBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBhcnIubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKGFycikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpbmhlcml0KG9wdHMuX2FkYXB0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzLl9hZGFwdHMpOyAgLy9QT1NTSUJMRSBFUlJPUlxyXG5cclxuXHRcdFx0aWYgKG9wdHMucGluID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRvcHRzLnBpbiA9IFtvcHRzLnRhcmdldC53aWR0aCAvIDIsIG9wdHMudGFyZ2V0LmhlaWdodCAvIDJdO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEob3B0cy5waW4gaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IG9wdHMucGluLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShvcHRzLnBpbikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XHJcblx0XHRcdHRoaXMuY29udGV4dCA9IHRoaXMudGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcblx0XHRcdHRoaXMuX2FkYXB0cyA9IDxPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzPnsgfTtcclxuXHRcdFx0aW5oZXJpdCh0aGlzLl9hZGFwdHMsIG9wdHMuX2FkYXB0cyk7XHJcblxyXG5cdFx0XHR0aGlzLnJvdCA9IG9wdHMucm90ICogMTtcclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHJcblx0XHRcdHRoaXMuZHJhZ0VuYWJsZWQgPSAhIW9wdHMuZHJhZ0VuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hFbmFibGVkID0gISFvcHRzLnBpbmNoRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5waW5jaFN3aXBlRW5hYmxlZCA9ICEhb3B0cy5waW5jaFN3aXBlRW5hYmxlZDtcclxuXHRcdFx0dGhpcy53aGVlbEVuYWJsZWQgPSAhIW9wdHMud2hlZWxFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBhbkVuYWJsZWQgPSAhIW9wdHMucGFuRW5hYmxlZDtcclxuXHRcdFx0dGhpcy50aWx0RW5hYmxlZCA9ICEhb3B0cy50aWx0RW5hYmxlZDtcclxuXHRcdFx0dGhpcy5ldmVudHNSZXZlcnNlZCA9ICEhb3B0cy5ldmVudHNSZXZlcnNlZDtcclxuXHJcblx0XHRcdHRoaXMuX2hhbmRsZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLl9jb29yZGluYXRlcyA9IFswLCAwXTtcclxuXHRcdFx0dGhpcy5fdG91Y2hlcyA9IFsgXTtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID0gQ29udHJvbGxhYmxlQ2FudmFzLmlzTW9iaWxlO1xyXG5cdFx0XHRpZiAoIUNvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCkgQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ID0gQ29udHJvbGxhYmxlQ2FudmFzLmxpbmVUb1BpeDtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Z2V0IHJhdGlvKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnRhcmdldC53aWR0aCAvIHRoaXMudGFyZ2V0LmhlaWdodDtcclxuXHRcdH0gLy9nLXJhdGlvXHJcblxyXG5cdFx0Z2V0IG1pbigpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5taW4odGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1taW5cclxuXHRcdGdldCBtYXgoKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWF4XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogRW5hYmxlIGNvbnRyb2xzLCBjYWxsIG9ubHkgb25jZVxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBmb3JjZT89ZmFsc2UgLSBGb3JjZSBoYW5kbGVcclxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufSBib3VuZD8gLSB3aGV0aGVyIGJpbmQgc3VjZWVkZWQgb3IgaXQgd2FzIGFscmVhZHkgYm91bmQgZWFybGllclxyXG5cdFx0ICovXHJcblx0XHRoYW5kbGUoZm9yY2U6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAoIXRoaXMuX2hhbmRsZWQgfHwgZm9yY2UpIHtcclxuXHRcdFx0XHR0aGlzLl9tb2JpbGUgPyB0aGlzLl9tb2JpbGVBZGFwdCgpIDogdGhpcy5fcGNBZGFwdCgpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9oYW5kbGVkID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vaGFuZGxlXHJcblxyXG5cdFx0YWRkV2lkZ2V0KGRhdGE6IENhbnZhc0J1dHRvbiB8IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyk6IENhbnZhc0J1dHRvbiB7XHJcblx0XHRcdGlmIChkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uICYmICF0aGlzLndnZXRzLmhhcyhkYXRhKSkge1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoIShkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uKSkge1xyXG5cdFx0XHRcdGRhdGEgPSBuZXcgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbig8T3B0cy5DYW52YXNCdXR0b25PcHRpb25zPmRhdGEpO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVJU0FMUjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7XHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQucm90YXRlKHRoaXMucm90KTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vcmV0cmFuc2Zvcm1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSB0cmFuc2xhdGlvbiBmdW5jdGlvbiBmb3IgaWNvbmljIHRyYW5zbGF0ZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSB4IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT0wIC0geSB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IHRyYW5zIC0gUmV0dXJucyBjdXJyZW50IHRvdGFsIHRyYW5zbGF0aW9uXHJcblx0XHQgKi9cclxuXHRcdHRyYW5zbGF0ZSh4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwLCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBib3VuZChOdW1iZXIoIWFicyA/ICh0cm4gKyBieVtpZHhdKSA6IGJ5W2lkeF0pLCB0aGlzLnRyYW5zQm91bmRzW2lkeF0sIHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzbHV0ZSBzY2FsZSBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IHNjbCAtIFJldHVybnMgY3VycmVudCB0b3RhbCBzY2FsaW5nXHJcblx0XHQgKi9cclxuXHRcdHNjYWxlKHg6IG51bWJlciA9IDEsIHk6IG51bWJlciA9IHgsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYm91bmQoTnVtYmVyKCFhYnMgPyAoc2NsICogYnlbaWR4XSkgOiBieVtpZHhdKSwgdGhpcy5zY2xCb3VuZHNbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy9zY2FsZVxyXG5cclxuXHJcblx0XHRwcml2YXRlIF9tb2JpbGVBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLl9hZGFwdHMucGluY2hTd2lwZSA9IHRoaXMuX2FkYXB0cy5waW5jaCA9IHRoaXMuX2FkYXB0cy5kcmFnID0gKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlTW92ZShlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCAoZTogVG91Y2hFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IHRydWUpO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IGZhbHNlKTtcclxuXHRcdFx0XHRpZiAoKHRoaXMudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMud2hlZWwgJiYgdGhpcy53aGVlbEVuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5fYWRhcHRzLndoZWVsID0gKGU6IFdoZWVsRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy53aGVlbChlLCB0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19wY0FkYXB0XHJcblxyXG5cdFx0c3RhdGljIGRyYWdQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRpZiAoKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmICgoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpID09PSAyKSB8fCAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggPT09IDMpIHx8ICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uID09PSAyKSkpIHx8ICgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFQk9USCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRUJPVEggJiYgKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSAhPT0gMikgJiYgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoICE9PSAzKSAmJiAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMikpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuX3ByZXNzZWQpIHtcclxuXHRcdFx0XHRjYy50cmFuc2xhdGUoZXZlbnQubW92ZW1lbnRYICogY2MudHJhbnNTcGVlZCwgZXZlbnQubW92ZW1lbnRZICogY2MudHJhbnNTcGVlZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnUENcclxuXHJcblx0XHRzdGF0aWMgZHJhZ01vYmlsZU1vdmUoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2soYXJyOiBudW1iZXJbXSwgY3VycjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoYXJyLmV2ZXJ5KChhcjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gTWF0aC5hYnMoYXIgLSBjdXJyW2lkeF0pID49IGNjLnRvdWNoU2Vuc2l0aXZpdHkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9IC8vY2hlY2tcclxuXHRcdFx0ZnVuY3Rpb24gYXJyYXluZ2UodGxpczogVG91Y2hMaXN0KTogbnVtYmVyW11bXSB7XHJcblx0XHRcdFx0cmV0dXJuIFtbdGxpc1swXS5jbGllbnRYLCB0bGlzWzBdLmNsaWVudFldLCBbdGxpc1sxXS5jbGllbnRYLCB0bGlzWzFdLmNsaWVudFldXTtcclxuXHRcdFx0fSAvL2FycmF5bmdlXHJcblx0XHRcdGZ1bmN0aW9uIGV2ZXJ5KHQ6IG51bWJlcltdW10sIG50OiBudW1iZXJbXVtdLCBhbGw6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCBvdXQgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoYWxsICYmIGNoZWNrKHRbMF0sIG50WzBdKSAmJiBjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWxsKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzBdLCBudFswXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHRcdH0gLy9ldmVyeVxyXG5cdFx0XHRmdW5jdGlvbiBpbmgob25lOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlc1swXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdFx0aWYgKCFvbmUpIGNjLl90b3VjaGVzWzFdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0fSAvL2luaFxyXG5cclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLltjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0sIGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy50cmFuc1NwZWVkKSk7XHJcblx0XHRcdFx0aW5oKHRydWUpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA9PT0gMikge1xyXG5cdFx0XHRcdGlmIChjYy5waW5jaEVuYWJsZWQgJiYgKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkJZUEFTUykgPT09IE9wdHMuU2NhbGVNb2RlLkJZUEFTUykge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKFwic2NhbGluZyBieXBhc3NcIik7ICAvL1NQRUNJQUwgQ0VOVEVSKlxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoY2MucGluY2hTd2lwZUVuYWJsZWQgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzKSkge1xyXG5cdFx0XHRcdFx0Y29uc29sZS5pbmZvKFwicm90YXRpb25cIik7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChjYy5waW5jaEVuYWJsZWQgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzLCB0cnVlKSkgeyAgLy9ORUVERUQgRk9SIFBSRUNJU0lPTiFcclxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhcInNjYWxpbmdcIik7XHJcblx0XHRcdFx0XHRpZiAoKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkgPT09IE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkge1xyXG5cclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0XHRsZXQgaW5pZGlzdDogbnVtYmVyID0gZGlzdChbY2MuX3RvdWNoZXNbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdLCBjYy5fdG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0pLFxyXG5cdFx0XHRcdFx0XHRcdGRpczogbnVtYmVyID0gZGlzdChbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AsIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSksXHJcblx0XHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzWzBdWzBdICsgY2MuX3RvdWNoZXNbMV1bMF0sIGNjLl90b3VjaGVzWzBdWzFdICsgY2MuX3RvdWNoZXNbMV1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0XHRkOiBudW1iZXIgPSBkaXMgLyBpbmlkaXN0LFxyXG5cdFx0XHRcdFx0XHRcdG50b3VjaGVzOiBudW1iZXJbXSA9IGl0b3VjaGVzLm1hcCgoaTogbnVtYmVyKSA9PiBpICogKDEgLSBkKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRjYy50cmFuc2xhdGUoLi4ubnRvdWNoZXMpO1xyXG5cdFx0XHRcdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aW5oKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnTW9iaWxlTW92ZVxyXG5cdFx0c3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmICghY3VzdCkge1xyXG5cdFx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiBjYy5fdG91Y2hlc1t0LmlkZW50aWZpZXJdID0gW3QuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjYy5fdG91Y2hlc1tjYy5fdG91Y2hlcy5sZW5ndGggLSAxXTtcclxuXHRcdH0gLy9kcmFnTW9iaWxlU3RhcnRcclxuXHRcdHN0YXRpYyBkcmFnTW9iaWxlRW5kKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXMuc3BsaWNlKHQuaWRlbnRpZmllciwgMSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRpZiAoT2JqZWN0LmtleXMoY2MuX3RvdWNoZXMpLmxlbmd0aCA9PSAxKSB7XHJcblx0XHRcdFx0Q29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVTdGFydChldmVudCwgY2MsIHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHN0YXRpYyB3aGVlbChldmVudDogV2hlZWxFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRsZXQgZDogbnVtYmVyID0gMSAtIGNjLnNjbFNwZWVkICogQ29udHJvbGxhYmxlQ2FudmFzLmZpeERlbHRhKGV2ZW50LmRlbHRhTW9kZSwgZXZlbnQuZGVsdGFZKSAvIGNjLm1pbixcclxuXHRcdFx0XHRjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdLCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdXTtcclxuXHRcdFx0Y2MudHJhbnNsYXRlKC4uLmNvb3Jkcy5tYXAoKGM6IG51bWJlcikgPT4gYyAqICgxIC0gZCkpKTtcclxuXHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHR9IC8vd2hlZWxcclxuXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGlzTW9iaWxlKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBvZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dpbmRvd3MgUGhvbmUvaSlcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZGV0ZWN0TW9iaWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGxpbmVUb1BpeCgpOiBudW1iZXIge1xyXG5cdFx0XHRsZXQgcjogbnVtYmVyLFxyXG5cdFx0XHRcdGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xyXG5cdFx0XHRpZnJhbWUuc3JjID0gJyMnO1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XHJcblx0XHRcdGxldCBpd2luOiBXaW5kb3cgPSBpZnJhbWUuY29udGVudFdpbmRvdyxcclxuXHRcdFx0XHRpZG9jOiBEb2N1bWVudCA9IGl3aW4uZG9jdW1lbnQ7XHJcblx0XHRcdGlkb2Mub3BlbigpO1xyXG5cdFx0XHRpZG9jLndyaXRlKCc8IURPQ1RZUEUgaHRtbD48aHRtbD48aGVhZD48L2hlYWQ+PGJvZHk+PHA+YTwvcD48L2JvZHk+PC9odG1sPicpO1xyXG5cdFx0XHRpZG9jLmNsb3NlKCk7XHJcblx0XHRcdGxldCBzcGFuOiBIVE1MRWxlbWVudCA9IDxIVE1MRWxlbWVudD5pZG9jLmJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XHJcblx0XHRcdHIgPSBzcGFuLm9mZnNldEhlaWdodDtcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRyZXR1cm4gcjtcclxuXHRcdH0gLy9saW5lVG9QaXhcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBmaXhEZWx0YShtb2RlOiBudW1iZXIsIGRlbHRhWTogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdFx0aWYgKG1vZGUgPT09IDEpIHtcclxuXHRcdFx0XHRyZXR1cm4gQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ICogZGVsdGFZO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG1vZGUgPT09IDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBkZWx0YVk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9maXhEZWx0YVxyXG5cdFx0XHJcblx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc1xyXG5cclxuXHQvKipcclxuXHQgKiBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBtZW1iZXJvZiBDb250cm9sbGFibGVDYW52YXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR4IC0gd2lkdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBkeSAtIGhlaWdodFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGluZGV4IC0gZXF1aXZhbGVudCB0byBDU1Mgei1pbmRleFxyXG5cdCAqL1xyXG5cdGNsYXNzIENhbnZhc0J1dHRvbiBpbXBsZW1lbnRzIE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHR4OiBudW1iZXIgPSAwO1xyXG5cdFx0eTogbnVtYmVyID0gMDtcclxuXHRcdGR4OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHk6IG51bWJlciA9IDA7XHJcblx0XHRpbmRleDogbnVtYmVyID0gLTE7XHJcblx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdHByaXZhdGUgcHN0YXRlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9pZDogbnVtYmVyO1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdHByaXZhdGUgc3RhdGljIF9pZGNudHI6IG51bWJlciA9IDA7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IHtcclxuXHRcdFx0eDogMCxcclxuXHRcdFx0eTogMCxcclxuXHRcdFx0ZHg6IDAsXHJcblx0XHRcdGR5OiAwLFxyXG5cdFx0XHRpbmRleDogLTEsXHJcblx0XHRcdHBzdGF0ZTogZmFsc2UsXHJcblx0XHRcdHBhcmVudDogbmV3IENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpIHsgIC8vRE9VQkxFQ0xJQ0ssIExPTkdDTElDSywgRFJBRywgLi4uIFVTRVItSU1QTEVNRU5URUQoPylcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpO1xyXG5cclxuXHRcdFx0aWYgKFtvcHRzLngsIG9wdHMueSwgb3B0cy5keCwgb3B0cy5keV0uc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy54ID0gb3B0cy54ICogMTtcclxuXHRcdFx0dGhpcy55ID0gb3B0cy55ICogMTtcclxuXHRcdFx0dGhpcy5keCA9IG9wdHMuZHggKiAxO1xyXG5cdFx0XHR0aGlzLmR5ID0gb3B0cy5keSAqIDE7XHJcblx0XHRcdHRoaXMuX2lkID0gQ2FudmFzQnV0dG9uLl9pZGNudHIrKztcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGJsdXIoLi4uYW55OiBhbnlbXSkge1xyXG5cclxuXHRcdH0gLy9ibHVyXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0Zm9jdXMoLi4uYW55OiBhbnlbXSkge1xyXG5cclxuXHRcdH0gLy9mb2N1c1xyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGNsaWNrKCkge1xyXG5cclxuXHRcdH0gLy9jbGlja1xyXG5cclxuXHRcdGlzT24ocmVsYXRpdmVDb29yZHM6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBvdXQ6IGJvb2xlYW4gPSBpc1dpdGhpbihbdGhpcy54LCB0aGlzLnksIHRoaXMuZHgsIHRoaXMuZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSk7XHJcblxyXG5cdFx0XHRpZiAob3V0ICYmICF0aGlzLnBzdGF0ZSkge1xyXG5cdFx0XHRcdHRoaXMuZm9jdXMocmVsYXRpdmVDb29yZHMpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCFvdXQgJiYgdGhpcy5wc3RhdGUpIHtcclxuXHRcdFx0XHR0aGlzLmJsdXIocmVsYXRpdmVDb29yZHMpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL2lzT25cclxuXHR9XHJcblxyXG5cdENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24gPSBDYW52YXNCdXR0b247XHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgY2xhc3Mgb2ZmZXJpbmcgbWF0aGVtYXRpY2FsIFZlY3RvciB1dGlsaXRpZXNcclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAY2xhc3NcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHByb3BzIC0gdmVjdG9yIHZlcnRpY2VzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIFZlY3RvciB7XHJcblx0XHRwcm9wczogbnVtYmVyW107XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocHJvcHM6IG51bWJlcltdID0gWyBdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHJcblx0fSAvL1ZlY3RvclxyXG5cclxufSAvL0NhbnZhc0NvbnRyb2xzXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDYW52YXNDb250cm9scy5Db250cm9sbGFibGVDYW52YXM7XHJcbiJdfQ==