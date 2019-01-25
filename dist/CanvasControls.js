/*
 * Angle between 3 poins (Radians):
 * pc: center/pole
 * pn: point new coordinates
 * pp: point past coordinates
 *
 * atan2(pny - pcy, pnx - pcx) - atan2(ppy - pcy, ppx - pcx)
 */
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
    CanvasControls.inherit = inherit;
    /**
     * Restrict number's range
     * @function
     * @inner
     * @param {number} n - target number
     * @param {number} m - minimum number
     * @param {number} M - maximum number
     * @param {number} p=0 - precision
     * @returns {number} bound number
     */
    function bound(n, m, M, p = 0) {
        return n > M + p ? M : (n < m - p ? m : n);
    } //bound
    CanvasControls.bound = bound;
    /**
     * Downspeed incrementation
     * @param {number} n - number
     * @param {number} m - minimum
     * @param {number} M - Maximum
     * @param {number} op - operation
     * @returns {number} n
     */
    function block(n, m, M, op) {
        if (n > M && op > 0) {
            return n;
        }
        else if (n > M) {
            return n + op;
        }
        else if (n < m && op < 0) {
            return n;
        }
        else if (n < m) {
            return n + op;
        }
        else {
            return n + op;
        }
    } //block
    CanvasControls.block = block;
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
    CanvasControls.dist = dist;
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
    CanvasControls.isWithin = isWithin;
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
        })(ScaleMode = Opts.ScaleMode || (Opts.ScaleMode = {})); //ScaleMode
        let Position;
        (function (Position) {
            Position[Position["FIXED"] = 1] = "FIXED";
            Position[Position["ABSOLUTE"] = 2] = "ABSOLUTE";
            Position[Position["UNSCALABLE"] = 4] = "UNSCALABLE";
        })(Position = Opts.Position || (Opts.Position = {})); //Position
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
        Errors.ENOTNUM = new TypeError("Not a valid Number.");
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
     * @prop {number[]} pin?=this.target.width/2,this.target.height/2 - Pseudo-center
     * @prop {number[]} transBound=-Infinity,-Infinity,Infinity,Infinity - Max translation boundaries
     * @prop {boolean} dynamicTransBounds=true - transBounds depend on scaling
     * @prop {boolean} dragEnabled=false - Enable translation on drag
     * @prop {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (both fingers shall move)
     * @prop {boolean} wheelEnabled=false - Enable scaling on mouse wheel
     * @prop {boolean} keysEnabled=false - Enable keyabord events listener
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
            this.transBounds = [-Infinity, -Infinity, Infinity, Infinity];
            this.dynamicTransBounds = true;
            this.sclBounds = [0, 0, Infinity, Infinity];
            this.dragEnabled = false;
            this.pinchEnabled = false;
            this.wheelEnabled = false;
            this.keysEnabled = false;
            this.panEnabled = false; //OBS
            this.tiltEnabled = false; //OBS
            this.eventsReversed = false;
            this.useButton = Opts.UseButton.USELEFT;
            this.scaleMode = Opts.ScaleMode.NORMAL;
            this.transSpeed = 1;
            this.sclSpeed = 1;
            this.touchSensitivity = .5;
            this.clickSensitivity = 800;
            this._zoomChanged = [false, false];
            this._mobile = false;
            this._pressed = false;
            this._clktime = 0;
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
            this.keybinds = new KeyBind(this.target, opts.keysEnabled);
            this._adapts = {};
            inherit(this._adapts, opts._adapts);
            this.transSpeed = opts.transSpeed * 1;
            this.sclSpeed = opts.sclSpeed * 1;
            this.touchSensitivity = opts.touchSensitivity * 1;
            this.clickSensitivity = opts.clickSensitivity * 1;
            this.useButton = opts.useButton | 0;
            this.scaleMode = opts.scaleMode | 0;
            this.wgets = new Set(opts.wgets);
            this.trans = Array.from(opts.trans).map(Number);
            this.scl = Array.from(opts.scl).map(Number);
            this.pin = Array.from(opts.pin).map(Number);
            this.transBounds = Array.from(opts.transBounds).map(Number); // x, y, X, Y
            this.sclBounds = Array.from(opts.sclBounds).map(Number); // x, y, X, Y
            this.dynamicTransBounds = !!opts.dynamicTransBounds;
            this.dragEnabled = !!opts.dragEnabled;
            this.pinchEnabled = !!opts.pinchEnabled;
            this.wheelEnabled = !!opts.wheelEnabled;
            this.panEnabled = !!opts.panEnabled;
            this.tiltEnabled = !!opts.tiltEnabled;
            this.eventsReversed = !!opts.eventsReversed;
            this._pressed = false;
            this._coordinates = [0, 0];
            this._touches = [];
            this._mobile = ControllableCanvas.isMobile;
            if (!ControllableCanvas._linepix)
                ControllableCanvas._linepix = ControllableCanvas.lineToPix;
            Object.defineProperty(this.target, "_cc_", {
                value: this,
                enumerable: false,
                writable: false,
                configurable: true
            });
        } //ctor
        get ratio() {
            return this.target.width / this.target.height;
        } //g-ratio  OBS
        get min() {
            return Math.min(this.target.width, this.target.height);
        } //g-min
        get max() {
            return Math.max(this.target.width, this.target.height);
        } //g-max  OBS
        /**
         * Enable controls
         * @method
         */
        handle() {
            this._mobile ? this._mobileAdapt() : this._pcAdapt();
        } //handle
        /**
         * Add (/create) a widget in the controller
         * @param {ControllableCanvas.CanvasButton|Opts.CanvasButtonOptions} data - constructor options
         * @return {ControllableCanvas.CanvasButton} the widget
         */
        addWidget(data) {
            if (data instanceof CanvasButton && !this.wgets.has(data)) {
                data.parent = this;
                this.wgets.add(data);
            }
            else if (!(data instanceof CanvasButton)) {
                data = new ControllableCanvas.CanvasButton(data);
                data.parent = this;
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
            this.context.setTransform(1, 0, 0, 1, 0, 0); //SKEW/ROTATE NOT IMPLEMENTED!!
            this.context.translate(this.trans[0], this.trans[1]);
            this.context.scale(this.scl[0], this.scl[1]);
            return this;
        } //retransform
        /**
         * Intermediate translation function for iconic translate before the real
         * @method
         * @param {number} x=0 - x translation
         * @param {number} y=0 - y translation
         * @param {boolean} abs?=false - absolute translation or relative to current
         * @returns {number[]} Returns current total translation
         */
        translate(x = 0, y = 0, abs = false) {
            let by = [x, y].map(Number);
            if (this.eventsReversed)
                by = by.map((b) => -b);
            return this.trans = this.trans.map((trn, idx) => bound(Number(!abs ? (trn + by[idx]) : by[idx]), this.dynamicTransBounds ? this.transBounds[idx] * this.scl[idx] : this.transBounds[idx], this.dynamicTransBounds ? this.transBounds[idx + 2] * this.scl[idx] : this.transBounds[idx + 2]));
        } //translate
        /**
         * Intermediate scaling function for iconic scale before the real
         * @method
         * @param {number} x=1 - x scale
         * @param {number} y=x - y scale
         * @param {boolean} abs?=false - absolute scale or relative to current
         * @returns {number[]} Returns current total scaling
         */
        scale(x = 1, y = x, abs = false) {
            let by = [x, y].map(Number);
            if (this.eventsReversed)
                by = by.map((b) => -b);
            if (!abs) {
                let nscl = this.scl.map((scl, idx) => scl * by[idx]);
                nscl = [nscl[0] - this.scl[0], nscl[1] - this.scl[1]];
                this._zoomChanged = [this.scl[0] !== block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), this.scl[1] !== block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
                return this.scl = [block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
            }
            else {
                this._zoomChanged = [this.scl[0] !== bound(this.scl[0], this.sclBounds[0], this.sclBounds[2]), this.scl[1] !== bound(this.scl[1], this.sclBounds[1], this.sclBounds[3])];
                return this.scl = this.scl.map((scl, idx) => bound(scl * by[idx], this.sclBounds[idx], this.sclBounds[idx + 2]));
            }
        } //scale
        _mobileAdapt() {
            if (!(this._adapts.drag || this._adapts.pinch) && this.dragEnabled) {
                this.target.addEventListener("touchstart", (e) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
                this.target.addEventListener("touchmove", this._adapts.pinch = this._adapts.drag = (e) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
                this.target.addEventListener("touchend", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
                this.target.addEventListener("touchcancel", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
            }
            if (!this._adapts.tilt && this.tiltEnabled) {
                //TODO
            }
        } //_mobileAdapt
        _pcAdapt() {
            if (!(this._adapts.drag || this._adapts.click) && this.dragEnabled) {
                this.target.addEventListener("mousemove", this._adapts.drag = (e) => ControllableCanvas.dragPC(e, this));
                this.target.addEventListener("mousedown", (e) => {
                    this._clktime = Date.now();
                    this._pressed = true;
                });
                this.target.addEventListener("mouseup", this._adapts.click = (e) => ControllableCanvas.clickPC(e, this));
                //@ts-ignore
                this.target.addEventListener("mouseout", (e) => this._adapts.click(e));
                if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT)
                    this.target.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true, passive: false });
            }
            if (!this._adapts.wheel && this.wheelEnabled) {
                this.target.addEventListener("wheel", this._adapts.wheel = (e) => ControllableCanvas.wheel(e, this));
            }
            if (!this._adapts.tilt && this.tiltEnabled) {
                //TODO
            }
        } //_pcAdapt
        static clickPC(event, cc) {
            if (Date.now() - cc._clktime <= cc.clickSensitivity) {
                let coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
                for (let butt of sorted) {
                    butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
                    if (ret)
                        break;
                }
            }
            cc._clktime = 0;
            cc._pressed = false;
        } //clickPC
        static dragPC(event, cc) {
            event.preventDefault();
            let coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop], rel = [], ret = false;
            cc._coordinates = coords;
            if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
                return;
            }
            if (cc._pressed) {
                cc._clktime = 0;
                cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
            }
            for (let butt of cc.wgets) {
                butt.enabled && butt._isOn(rel = coords.map((c, idx) => (c - cc.trans[idx]) / cc.scl[idx])) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
                if (ret)
                    break;
            }
        } //dragPC
        static dragMobileMove(event, cc) {
            function check(arr, curr) {
                if (arr.every((ar, idx) => Math.abs(ar - curr[idx]) >= cc.touchSensitivity)) {
                    return true;
                }
                return false;
            } //check
            function arraynge(tlis) {
                return [[tlis[0].clientX - cc.target.offsetLeft, tlis[0].clientY - cc.target.offsetTop], [tlis[1].clientX - cc.target.offsetLeft, tlis[1].clientY - cc.target.offsetTop]];
            } //arraynge
            function every(t, nt, all = false, once = false) {
                let out = false;
                if (all && check(t[0], nt[0]) && check(t[1], nt[1])) {
                    return true;
                }
                else if (all) {
                    return false;
                }
                if (check(t[0], nt[0])) {
                    out = once || !out;
                }
                if (check(t[1], nt[1])) {
                    out = once || !out;
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
            if (cc.dragEnabled && cc._touches.length === 1) {
                let cp = Array.from(cc.trans), dis;
                cc.translate(...[coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map((v) => v * cc.transSpeed));
                dis = dist([cp[0], cc.trans[0]], [cp[1], cc.trans[1]]);
                if (dis > cc.touchSensitivity)
                    cc._clktime = 0;
                inh(true);
            }
            else if (cc.pinchEnabled && cc._touches.length === 2 && event.targetTouches.length === 2 && every(arraynge(event.targetTouches), cc._touches, false, true)) {
                if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {
                    let inidist = [Math.abs(cc._touches[event.targetTouches[0].identifier][0] - cc._touches[event.targetTouches[1].identifier][0]), Math.abs(cc._touches[event.targetTouches[0].identifier][1] - cc._touches[event.targetTouches[1].identifier][1])], dis = [Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX - 2 * cc.target.offsetLeft), Math.abs(event.targetTouches[0].clientY - event.targetTouches[1].clientY - 2 * cc.target.offsetTop)], itouches = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map((i, idx) => i / 2 - cc.trans[idx]), d = [dis[0] / inidist[0], dis[1] / inidist[1]].map((v) => v * cc.sclSpeed), ntouches = itouches.map((i, idx) => i * (1 - d[idx]));
                    if (cc._zoomChanged[0])
                        cc.translate(ntouches[0]);
                    if (cc._zoomChanged[1])
                        cc.translate(ntouches[1]);
                    cc.scale(d[0], d[1]);
                }
                else {
                    //@ts-ignore
                    let inidist = dist([cc._touches[event.targetTouches[0].identifier][0], cc._touches[event.targetTouches[1].identifier][0]], [cc._touches[event.targetTouches[0].identifier][1], cc._touches[event.targetTouches[1].identifier][1]]), dis = dist([event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[1].clientX - cc.target.offsetLeft], [event.targetTouches[0].clientY - cc.target.offsetTop, event.targetTouches[1].clientY - cc.target.offsetTop]), itouches = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map((i, idx) => i / 2 - cc.trans[idx]), d = cc.sclSpeed * dis / inidist, ntouches = itouches.map((i) => i * (1 - d));
                    cc.scale(d);
                    if (cc._zoomChanged.every((zm) => zm))
                        cc.translate(...ntouches);
                }
                inh();
            }
            cc._coordinates = coords;
        } //dragMobileMove
        static dragMobileStart(event, cc, cust = false) {
            event.preventDefault();
            if (!cust) {
                let coords, sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
                Array.from(event.changedTouches).forEach((t) => cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop]);
                for (let touch of event.changedTouches) {
                    coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];
                    for (let butt of sorted) {
                        butt.enabled && butt._isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
                        if (ret)
                            break;
                    }
                }
            }
            if (cc._touches.length === 1) {
                cc._clktime = Date.now();
                cc._coordinates = cc._touches[cc._touches.length - 1];
            }
            else {
                cc._clktime = 0;
            }
            cc._pressed = true;
        } //dragMobileStart
        static dragMobileEnd(event, cc) {
            event.preventDefault();
            let coords, sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
            for (let touch of event.changedTouches) {
                coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];
                for (let butt of sorted) {
                    butt.enabled && butt._isOn(coords);
                }
            }
            if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
                for (let butt of sorted) {
                    butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
                    if (ret)
                        break;
                }
                cc._clktime = 0;
            }
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
            cc.scale(d);
            if (cc._zoomChanged.every((zm) => zm))
                cc.translate(...coords.map((c) => c * (1 - d)));
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
        } //isMobile
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
        dragEnabled: false,
        pinchEnabled: false,
        wheelEnabled: false,
        keysEnabled: false,
        panEnabled: false,
        tiltEnabled: false,
        eventsReversed: false,
        dynamicTransBounds: true,
        useButton: 1,
        scaleMode: 1,
        transSpeed: 1,
        sclSpeed: 1,
        touchSensitivity: .35,
        clickSensitivity: 800,
        sclBounds: [0, 0, Infinity, Infinity],
        transBounds: [-Infinity, -Infinity, Infinity, Infinity],
        _adapts: {
            drag: false,
            pinch: false,
            wheel: false,
            pan: false,
            tilt: false,
            click: false
        },
        wgets: new Set()
    };
    CanvasControls.ControllableCanvas = ControllableCanvas;
    /**
     * A class to control keyboard events
     */
    class KeyBind {
        constructor(element, bind = false) {
            this.press = [];
            this.down = [];
            this.up = [];
            this._bound = false;
            this.arrowMoveSpeedupEnabled = true;
            this.arrowBindings = {};
            this.element = element;
            Object.assign(this.arrowBindings, KeyBind.arrowBindings);
            this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
            this.arrowMoveSpeedup = KeyBind.arrowMoveSpeedup;
            this.arrowMoveSpeedMax = KeyBind.arrowMoveSpeedMax;
            bind && this.bind();
        } //ctor
        static arrowMove(event, type) {
            if (type === "keydown") {
                event.target["_cc_"].translate(this.arrowMoveSpeed * this.arrowBindings[event.key][0], this.arrowMoveSpeed * this.arrowBindings[event.key][1]);
                if (this.arrowMoveSpeedupEnabled)
                    this.arrowMoveSpeed = bound(this.arrowMoveSpeed + this.arrowMoveSpeedup, 0, this.arrowMoveSpeedMax);
            }
            else {
                this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
            }
            return false;
        } //arrowMove
        bindArrows() {
            for (let i in this.arrowBindings) {
                this.registerKeydown(i, KeyBind.arrowMove.bind(this));
                this.registerKeyup(i, KeyBind.arrowMove.bind(this));
            }
            this.bindArrows = () => { };
        } //bindArrows
        /**
         * Bind key event listeners
         * @method
         * @returns {boolean}
         */
        bind() {
            if (!this._bound) {
                this.element.addEventListener("keypress", (event) => this._handler.bind(this)("keypress", event), false);
                this.element.addEventListener("keyup", (event) => this._handler.bind(this)("keyup", event), false);
                this.element.addEventListener("keydown", (event) => this._handler.bind(this)("keydown", event), false);
                return this._bound = true;
            }
            return false;
        } //bind
        _handler(type, event) {
            let handled = false;
            this[type.replace("key", '')].forEach((key) => {
                if (key.key === event.key) {
                    handled = !key.callback(event, type);
                }
            });
            return handled;
        } //_handler
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeypress(key, callback) {
            let out;
            this.press.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "press" });
            return out;
        } //registerKeypress
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeydown(key, callback) {
            let out;
            this.down.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "down" });
            return out;
        } //registerKeydown
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeyup(key, callback) {
            let out;
            this.up.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "up" });
            return out;
        } //registerKeyup
        /**
         * @method
         * @param {Key} key
         */
        unregister(key, repl) {
            if (typeof key === "number") {
                let idx;
                if ((idx = this.press.findIndex((k) => k.id === key)) >= 0) {
                    return this.press.splice(idx, 1, repl);
                }
                else if ((idx = this.down.findIndex((k) => k.id === key)) >= 0) {
                    return this.down.splice(idx, 1, repl);
                }
                else if ((idx = this.up.findIndex((k) => k.id === key)) >= 0) {
                    return this.up.splice(idx, 1, repl);
                }
                else {
                    return false;
                }
            }
            else if (typeof key === "string") {
                this.press = this.press.filter((k) => k.key !== key);
                this.down = this.down.filter((k) => k.key !== key);
                this.up = this.up.filter((k) => k.key !== key);
            }
            else {
                return this[key.type].splice(this[key.type].findIndex((k) => k.id === key.id), 1, repl);
            }
        } //unregister
    } //KeyBind
    KeyBind._idcntr = 0;
    KeyBind.arrowMoveSpeed = 5;
    KeyBind.arrowMoveSpeedup = .5;
    KeyBind.arrowMoveSpeedMax = 20;
    KeyBind.arrowBindings = {
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
        ArrowLeft: [1, 0],
        ArrowRight: [-1, 0]
    };
    CanvasControls.KeyBind = KeyBind;
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
            this.enabled = true;
            this.pstate = false;
            this.position = 2;
            inherit(opts, CanvasButton.defaultOpts);
            if ([opts.x, opts.y, opts.dx, opts.dy, opts.position, opts.index].some((num) => isNaN(num) || num === '')) {
                throw Errors.ENOTNUM;
            }
            this.x = opts.x * 1;
            this.y = opts.y * 1;
            this.dx = opts.dx * 1;
            this.dy = opts.dy * 1;
            this.position = opts.position | 0;
            this.index = opts.index | 0;
            this.enabled = !!opts.enabled;
            this._id = CanvasButton._idcntr++;
        } //ctor
        //@Override
        /**
         * Checks if button was exited and decides whether to propagate
         * @param any
         */
        blur(...any) {
            return true;
        } //blur
        //@Override
        /**
         * Checks if button was entered and decides whether to propagate
         * @param any
         */
        focus(...any) {
            return false;
        } //focus
        //@Override
        /**
         * Checks if button was clicked and decides whether to propagate
         * @param any
         */
        click(...any) {
            return true;
        } //click
        /**
         * Checks if pointer is above the widget
         * @param {number[]} relativeCoords
         * @method
         */
        _isOn(relativeCoords) {
            let x = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.x - this.parent.trans[0] : this.x, y = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.y - this.parent.trans[1] : this.y, dx = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dx * this.parent.scl[0] : this.dx, dy = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dy * this.parent.scl[1] : this.dy, out = isWithin([x, y, dx, dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);
            if (!out && this.pstate) {
                this.blur(relativeCoords);
                this.pstate = false;
            }
            return out;
        } //_isOn
    } //CanvasButton
    CanvasButton.sensitivity = .3;
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
        enabled: true,
        position: 2,
        parent: new ControllableCanvas
    };
    CanvasControls.CanvasButton = CanvasButton;
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
    /**
     * @prop {HTMLElement[]} resources - All HTML resource elements with "load" listeners that will be loaded. like: audio/img
     */
    class ResourceLoader {
        constructor(resources, onload, autobind = false) {
            this.resources = [];
            this._loadcntr = 0;
            this.resources = Array.from(resources);
            this.load = onload || this.load;
            if (autobind)
                this.bind(this.load);
        } //ctor
        /**
         * Bind load events and await loadend
         * @param {Function} onload? - code to execute once loaded
         */
        bind(onload) {
            if (onload)
                this.load = onload;
            this.resources.forEach((res) => {
                res.addEventListener("load", () => {
                    if (++this._loadcntr === this.resources.length) {
                        this.load(res, this._loadcntr);
                    }
                });
            });
        } //bind
        //@Override
        load(res, load) { } //load
        /**
         * Load images by URLs
         * @method
         * @static
         * @param {string[]} urlist - list of urls
         * @param {Function} onload - callback
         * @param {boolean} autobind=true - auto bind
         * @returns {ResourceLoader} the loader
         */
        static images(urlist, onload, autobind = true) {
            let imglist = [];
            for (let url of urlist) {
                let img = new Image();
                img.src = url;
                imglist.push(img);
            }
            return new ResourceLoader(imglist, onload, autobind);
        } //images
        /**
         * Load audio by URLs
         * @method
         * @static
         * @param {string[]} urlist - list of urls
         * @param {Function} onload - callback
         * @param {boolean} autobind=true - auto bind
         * @returns {ResourceLoader} the loader
         */
        static audios(urlist, onload, autobind = true) {
            let audiolist = [];
            for (let url of urlist) {
                let audio = new Audio(url);
                audio.load();
                audiolist.push(audio);
            }
            return new ResourceLoader(audiolist, onload, autobind);
        } //audios
    } //ResourceLoader
    CanvasControls.ResourceLoader = ResourceLoader;
})(CanvasControls = exports.CanvasControls || (exports.CanvasControls = {})); //CanvasControls
exports.default = CanvasControls.ControllableCanvas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVILFlBQVksQ0FBQzs7QUFDYiwyQkFBeUI7QUFFekI7Ozs7R0FJRztBQUVIOzs7OztHQUtHO0FBQ0gsSUFBYyxjQUFjLENBcWtDM0I7QUFya0NELFdBQWMsY0FBYztJQUkzQjs7Ozs7Ozs7T0FRRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLFlBQXNCLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxJQUFZLEVBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pLLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQ25CLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsU0FBUztJQU5LLHNCQUFPLFVBTXRCLENBQUE7SUFDRDs7Ozs7Ozs7O09BU0c7SUFDSCxTQUFnQixLQUFLLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBWSxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsT0FBTztJQUZPLG9CQUFLLFFBRXBCLENBQUE7SUFDRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0IsS0FBSyxDQUFDLENBQVMs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QyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyVCxDQUFDLENBQUMsV0FBVztRQUNiOzs7Ozs7O1dBT0c7UUFDSCxLQUFLLENBQUMsSUFBWSxDQUFDLEVBQUUsSUFBWSxDQUFDLEVBQUUsTUFBZSxLQUFLO1lBQ3ZELElBQUksRUFBRSxHQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QyxJQUFJLElBQUksQ0FBQyxjQUFjO2dCQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsSUFBSSxJQUFJLEdBQWEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFVLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzTCxPQUFPLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDeko7aUJBQU07Z0JBQ04sSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcs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LENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDN0osSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtvQkFDM0UsSUFBSSxPQUFPLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN6UCxHQUFHLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDM04sUUFBUSxHQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzFSLENBQUMsR0FBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFDNUYsUUFBUSxHQUFhLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFakYsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQyxZ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RyxDQUFDLENBQUM7Z0JBQzNCLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDYixTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RCO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxRQUFRO0tBQ1YsQ0FBQyxnQkFBZ0I7SUFuRUwsNkJBQWMsaUJBbUUxQixDQUFBO0FBRUYsQ0FBQyxFQXJrQ2EsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFxa0MzQixDQUFDLGdCQUFnQjtBQUVsQixrQkFBZSxjQUFjLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBBbmdsZSBiZXR3ZWVuIDMgcG9pbnMgKFJhZGlhbnMpOlxyXG4gKiBwYzogY2VudGVyL3BvbGVcclxuICogcG46IHBvaW50IG5ldyBjb29yZGluYXRlc1xyXG4gKiBwcDogcG9pbnQgcGFzdCBjb29yZGluYXRlc1xyXG4gKiBcclxuICogYXRhbjIocG55IC0gcGN5LCBwbnggLSBwY3gpIC0gYXRhbjIocHB5IC0gcGN5LCBwcHggLSBwY3gpXHJcbiAqL1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbmltcG9ydCBcIkBiYWJlbC9wb2x5ZmlsbFwiO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIENhbnZhc0NvbnRyb2xzLnRzXHJcbiAqIEBjb3B5cmlnaHQgVmFsZW4uIEguIDJrMThcclxuICogQGF1dGhvciBWYWxlbi5ILiA8YWx0ZXJuYXRpdmV4eHh5QGdtYWlsLmNvbT5cclxuICovXHJcblxyXG4vKipcclxuICogVGhlIHJvb3Qgb2YgdGhlIG1haW4gbGlicmFyeVxyXG4gKiBAbW9kdWxlIENhbnZhc0NvbnRyb2xzXHJcbiAqIEBsaWNlbnNlIElTQ1xyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG5leHBvcnQgbW9kdWxlIENhbnZhc0NvbnRyb2xzIHtcclxuXHRcclxuXHR0eXBlIENsYXNzID0geyBuZXcoLi4uYXJnczogYW55W10pOiBhbnk7IH07XHJcblx0XHJcblx0LyoqXHJcblx0ICogSWYgYGRlc3RgIGxhY2tzIGEgcHJvcGVydHkgdGhhdCBgdGFyZ2AgaGFzIHRoZW4gdGhhdCBwcm9wZXJ0eSBpcyBjb3BpZWQgaW50byBgZGVzdGBcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGVzdCAtIGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnIC0gYmFzZSBvYmplY3RcclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25kaXRpb24gLSBpbmhlcml0YW5jZSBjb25kaXRpb25cclxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gaW5oZXJpdChkZXN0OiB7fSwgdGFyZzoge30sIGNvbmRpdGlvbjogRnVuY3Rpb24gPSAoZGVzdDoge30sIHRhcmc6IHt9LCBwcm9wOiBzdHJpbmcpOiBhbnkgPT4gZGVzdFtwcm9wXSA9PT0gdW5kZWZpbmVkICYmIChkZXN0W3Byb3BdID0gdGFyZ1twcm9wXSkpOiB7fSB7XHJcblx0XHRmb3IgKGxldCBpIGluIHRhcmcpIHtcclxuXHRcdFx0Y29uZGl0aW9uKGRlc3QsIHRhcmcsIGkpO1xyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRyZXR1cm4gZGVzdDtcclxuXHR9IC8vaW5oZXJpdFxyXG5cdC8qKlxyXG5cdCAqIFJlc3RyaWN0IG51bWJlcidzIHJhbmdlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSB0YXJnZXQgbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gbWF4aW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gcD0wIC0gcHJlY2lzaW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIsIHA6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNICsgcCA/IE0gOiAobiA8IG0gLSBwID8gbSA6IG4pO1xyXG5cdH0gLy9ib3VuZFxyXG5cdC8qKlxyXG5cdCAqIERvd25zcGVlZCBpbmNyZW1lbnRhdGlvblxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBNYXhpbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9wIC0gb3BlcmF0aW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBibG9jayhuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBvcDogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdGlmIChuID4gTSAmJiBvcCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPiBNKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtICYmIG9wIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH0gZWxzZSBpZiAobiA8IG0pIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9XHJcblx0fSAvL2Jsb2NrXHJcblx0LyoqXHJcblx0ICogQ2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBYcyAtIFggY29vcmRpbmF0ZXNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBZcyAtIFkgY29vcmRpbmF0ZXNcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBkaXN0YW5jZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBkaXN0KFhzOiBudW1iZXJbXSwgWXM6IG51bWJlcltdKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQoW1hzWzFdIC0gWHNbMF0sIFlzWzFdIC0gWXNbMF1dLm1hcCgodjogbnVtYmVyKSA9PiBNYXRoLnBvdyh2LCAyKSkucmVkdWNlKChhY2M6IG51bWJlciwgdjogbnVtYmVyKSA9PiBhY2MgKyB2KSk7XHJcblx0fSAvL2Rpc3RcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBpbnNpZGUgYW4gYXJlYVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGJveCAtIHgseSxkeCxkeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IHBvaW50IC0geCx5XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHNlbnNpdGl2aXR5IC0gZXh0cmEgYm91bmRhcnlcclxuXHQgKiBAcmV0dXJucyBib29sZWFuXHJcblx0ICogQGlubmVyXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGlzV2l0aGluKGJveDogbnVtYmVyW10sIHBvaW50OiBudW1iZXJbXSwgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC41KTogYm9vbGVhbiB7XHJcblx0XHRyZXR1cm4gYm94WzBdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMF0gJiYgYm94WzBdICsgYm94WzJdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMF0gJiYgYm94WzFdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMV0gJiYgYm94WzFdICsgYm94WzNdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMV07XHJcblx0fSAvL2lzV2l0aGluXHJcblx0XHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBPcHRpb25zXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT3B0cyB7XHJcblx0XHQvKipcclxuXHRcdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB0YXJnZXQ9Zmlyc3RDYW52T2NjdXJJbkRvYyAtIEJvdW5kIGNhbnZhc1xyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSByb3Q9MCwwIC0gUm90YXRpb25cclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHRcdCAqIEBwcm9wIHtib29sZWFufSBkeW5hbWljVHJhbnNCb3VuZHM9dHJ1ZSAtIHRyYW5zQm91bmRzIGRlcGVuZCBvbiBzY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoMSBmaW5nZXIgb25seSBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHRcdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdFx0ICogQG1lbWJlciB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0XHR0cmFucz86IG51bWJlcltdO1xyXG5cdFx0XHRzY2w/OiBudW1iZXJbXTtcclxuXHRcdFx0ZHJhZ0VuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwaW5jaEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR3aGVlbEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRrZXlzRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBhbkVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR0aWx0RW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdGV2ZW50c1JldmVyc2VkPzogYm9vbGVhbjtcclxuXHRcdFx0dXNlQnV0dG9uPzogbnVtYmVyO1xyXG5cdFx0XHRzY2FsZU1vZGU/OiBudW1iZXI7XHJcblx0XHRcdHRyYW5zQm91bmRzPzogbnVtYmVyW107XHJcblx0XHRcdHNjbEJvdW5kcz86IG51bWJlcltdO1xyXG5cdFx0XHR0cmFuc1NwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHRkeW5hbWljVHJhbnNCb3VuZHM/OiBib29sZWFuO1xyXG5cdFx0XHRzY2xTcGVlZD86IG51bWJlcjtcclxuXHRcdFx0dG91Y2hTZW5zaXRpdml0eT86IG51bWJlcjtcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eT86IG51bWJlcjtcclxuXHRcdFx0X2FkYXB0cz86IENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0XHR3Z2V0cz86IFNldDxDYW52YXNCdXR0b24+O1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnNcclxuXHRcdC8qKlxyXG5cdFx0ICogTTogbW9iaWxlXHJcblx0XHQgKiBQOiBwY1xyXG5cdFx0ICogTVA6IGJvdGhcclxuXHRcdCAqIFxyXG5cdFx0ICogZHJhZzpcclxuXHRcdCAqXHRQOiBtb3VzZSAgaG9sZCAmIG1vdmVcclxuXHRcdCAqXHRNOiB0b3VjaCAgaG9sZCAmIG1vdmVcclxuXHRcdCAqIHBpbmNoOlxyXG5cdFx0ICpcdHRvdWNoICAyLWZpbmdlciAmIG1vdmVcclxuXHRcdCAqIHdoZWVsOlxyXG5cdFx0ICpcdHdoZWVsICBtb3ZlICBbcGMgcGluY2gtZXF1aXZhbGVudF1cclxuXHRcdCAqIHBhbjpcclxuXHRcdCAqXHRkaXNwb3NpdGlvbiBmcm9tIGNlbnRlciBjYXVzZXMgY29uc3RhbnQgdHJhbnNsYXRpb25cclxuXHRcdCAqIHRpbHQ6XHJcblx0XHQgKlx0ZGV2aWNlbW90aW9uICBjYXVzZXMgcGFubmluZypcclxuXHRcdCAqXHRcclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnMge1xyXG5cdFx0XHRkcmFnOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHBpbmNoPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NXHJcblx0XHRcdHdoZWVsPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9QXHJcblx0XHRcdHBhbjogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHR0aWx0PzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRjbGljazogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzXHJcblx0XHQvKipcclxuXHRcdCAqIE9wdGlvbnMgb2YgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvblxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeCAtIHdpZGdldCB3aWR0aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeSAtIHdpZGdldCBoZWlnaHRcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gaW5kZXggLSB3aWRnZXQgZXZlbnQgcHJpb3JpdHlcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENhbnZhc0J1dHRvbk9wdGlvbnMge1xyXG5cdFx0XHR4OiBudW1iZXI7XHJcblx0XHRcdHk6IG51bWJlcjtcclxuXHRcdFx0ZHg6IG51bWJlcjtcclxuXHRcdFx0ZHk6IG51bWJlcjtcclxuXHRcdFx0aW5kZXg/OiBudW1iZXI7XHJcblx0XHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0XHRlbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cG9zaXRpb24/OiBudW1iZXI7XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ2FudmFzQnV0dG9uT3B0aW9uc1xyXG5cdFx0XHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEhcclxuXHRcdH0gLy9Vc2VCdXR0b25cclxuXHRcdGV4cG9ydCBlbnVtIFNjYWxlTW9kZSB7XHJcblx0XHRcdE5PUk1BTCA9IDEsIEZSRUVTQ0FMRVxyXG5cdFx0fSAvL1NjYWxlTW9kZVxyXG5cdFx0ZXhwb3J0IGVudW0gUG9zaXRpb24ge1xyXG5cdFx0XHRGSVhFRCA9IDEsIEFCU09MVVRFLCBVTlNDQUxBQkxFID0gNFxyXG5cdFx0fSAvL1Bvc2l0aW9uXHJcblx0fSAvL09wdHNcclxuXHRcclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIGVycm9yc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVycm9ycyB7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENBTlY6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gSFRNTENhbnZhc0VsZW1lbnQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDVFg6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU1BUlIyOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEFycmF5IG9mIDItYXQtbGVhc3QgTnVtYmVycy5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTTogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIHZhbGlkIE51bWJlci5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRUlTQUxSOiBSZWZlcmVuY2VFcnJvciA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk9iamVjdCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO1xyXG5cdH0gLy9FcnJvcnNcclxuXHRcclxuXHQvKipcclxuXHQgKiBUeXBlIG9mIEtleUJpbmRcclxuXHQgKi9cclxuXHRleHBvcnQgdHlwZSBLZXkgPSB7XHJcblx0XHRrZXk6IHN0cmluZztcclxuXHRcdGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuXHRcdGlkOiBudW1iZXI7XHJcblx0XHR0eXBlOiBzdHJpbmc7XHJcblx0fTtcclxuXHRcclxuXHRcclxuXHQvKipcclxuXHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdCAqIEBjbGFzc1xyXG5cdCAqIEBpbXBsZW1lbnRzIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnN9XHJcblx0ICogQHByb3Age0hUTUxDYW52YXNFbGVtZW50fSB0YXJnZXQ9Zmlyc3RDYW52T2NjdXJJbkRvYyAtIEJvdW5kIGNhbnZhc1xyXG5cdCAqIEBwcm9wIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQ/PXRhcmdldC5nZXRDb250ZXh0KFwiMmRcIikgLSBUaGUgMmQgY29udGV4dCBjcmVhdGVkIG91dCBvZiBgdGFyZ2V0YFxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gdHJhbnM9MCwwIC0gVHJhbnNsYXRpb25cclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0ICogQHByb3Age251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFuc0JvdW5kPS1JbmZpbml0eSwtSW5maW5pdHksSW5maW5pdHksSW5maW5pdHkgLSBNYXggdHJhbnNsYXRpb24gYm91bmRhcmllc1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBkeW5hbWljVHJhbnNCb3VuZHM9dHJ1ZSAtIHRyYW5zQm91bmRzIGRlcGVuZCBvbiBzY2FsaW5nXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0ICogQHByb3Age251bWJlcltdfSBfY29vcmRpbmF0ZXMgLSBDdXJyZW50IGV2ZW50IGNvb3JkaW5hdGVzXHJcblx0ICogQHByb3Age251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0ICogQHByb3Age29iamVjdH0gX3RvdWNoZXMgLSBNYXAgb2YgYWxsIGN1cnJlbnQgdG91Y2hlc1xyXG5cdCAqIEBwcm9wIHtDbGFzc30gQ2FudmFzQnV0dG9uIC0gQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAcHJvcCB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cGluOiBudW1iZXJbXTsgIC8vT0JTXHJcblx0XHR0cmFuc0JvdW5kczogbnVtYmVyW10gPSBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkeW5hbWljVHJhbnNCb3VuZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0c2NsQm91bmRzOiBudW1iZXJbXSA9IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldO1xyXG5cdFx0ZHJhZ0VuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBpbmNoRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0d2hlZWxFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRrZXlzRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGFuRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlOyAgLy9PQlNcclxuXHRcdHRpbHRFbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0ZXZlbnRzUmV2ZXJzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHVzZUJ1dHRvbjogbnVtYmVyID0gT3B0cy5Vc2VCdXR0b24uVVNFTEVGVDtcclxuXHRcdHNjYWxlTW9kZTogbnVtYmVyID0gT3B0cy5TY2FsZU1vZGUuTk9STUFMO1xyXG5cdFx0dHJhbnNTcGVlZDogbnVtYmVyID0gMTtcclxuXHRcdHNjbFNwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0dG91Y2hTZW5zaXRpdml0eTogbnVtYmVyID0gLjU7XHJcblx0XHRjbGlja1NlbnNpdGl2aXR5OiBudW1iZXIgPSA4MDA7XHJcblx0XHR3Z2V0czogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRrZXliaW5kczogS2V5QmluZDtcclxuXHRcdHByaXZhdGUgX3pvb21DaGFuZ2VkOiBib29sZWFuW10gPSBbZmFsc2UsIGZhbHNlXTtcclxuXHRcdHByaXZhdGUgX21vYmlsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfcHJlc3NlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfY2xrdGltZTogbnVtYmVyID0gMDtcclxuXHRcdF9hZGFwdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRfY29vcmRpbmF0ZXM6IG51bWJlcltdID0gWyBdO1xyXG5cdFx0cHJpdmF0ZSBfdG91Y2hlczogbnVtYmVyW11bXSA9IFsgXTtcclxuXHRcdFxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0c3RhdGljIENhbnZhc0J1dHRvbjogQ2xhc3M7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSB7XHJcblx0XHRcdHRhcmdldDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYW52YXNcIilbMF0sXHJcblx0XHRcdHRyYW5zOiBbMCwgMF0sXHJcblx0XHRcdHNjbDogWzEsIDFdLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHdoZWVsRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdGtleXNFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHRkeW5hbWljVHJhbnNCb3VuZHM6IHRydWUsXHJcblx0XHRcdHVzZUJ1dHRvbjogMSxcclxuXHRcdFx0c2NhbGVNb2RlOiAxLFxyXG5cdFx0XHR0cmFuc1NwZWVkOiAxLFxyXG5cdFx0XHRzY2xTcGVlZDogMSxcclxuXHRcdFx0dG91Y2hTZW5zaXRpdml0eTogLjM1LFxyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5OiA4MDAsXHJcblx0XHRcdHNjbEJvdW5kczogWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV0sXHJcblx0XHRcdHRyYW5zQm91bmRzOiBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV0sXHJcblx0XHRcdF9hZGFwdHM6IHtcclxuXHRcdFx0XHRkcmFnOiBmYWxzZSxcclxuXHRcdFx0XHRwaW5jaDogZmFsc2UsXHJcblx0XHRcdFx0d2hlZWw6IGZhbHNlLFxyXG5cdFx0XHRcdHBhbjogZmFsc2UsXHJcblx0XHRcdFx0dGlsdDogZmFsc2UsXHJcblx0XHRcdFx0Y2xpY2s6IGZhbHNlXHJcblx0XHRcdH0sXHJcblx0XHRcdHdnZXRzOiBuZXcgU2V0KClcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCEob3B0cy50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVENBTlY7XHJcblx0XHRcdH0gZWxzZSBpZiAoW29wdHMudHJhbnMsIG9wdHMuc2NsLCBvcHRzLnRyYW5zQm91bmRzLCBvcHRzLnNjbEJvdW5kc10uc29tZShhcnIgPT4gIShhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgYXJyLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShhcnIpLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aW5oZXJpdChvcHRzLl9hZGFwdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cy5fYWRhcHRzKTsgIC8vUE9TU0lCTEUgRVJST1JcclxuXHRcdFx0XHJcblx0XHRcdGlmIChvcHRzLnBpbiA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0b3B0cy5waW4gPSBbb3B0cy50YXJnZXQud2lkdGggLyAyLCBvcHRzLnRhcmdldC5oZWlnaHQgLyAyXTtcclxuXHRcdFx0fSBlbHNlIGlmICghKG9wdHMucGluIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBvcHRzLnBpbi5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20ob3B0cy5waW4pLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xyXG5cdFx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLnRhcmdldC5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0XHRcdHRoaXMua2V5YmluZHMgPSBuZXcgS2V5QmluZCh0aGlzLnRhcmdldCwgb3B0cy5rZXlzRW5hYmxlZCk7XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLl9hZGFwdHMgPSA8T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycz57IH07XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cdFx0XHRcclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHRcdFx0XHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPSAhIW9wdHMuZHluYW1pY1RyYW5zQm91bmRzO1xyXG5cdFx0XHRcclxuXHRcdFx0dGhpcy5kcmFnRW5hYmxlZCA9ICEhb3B0cy5kcmFnRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5waW5jaEVuYWJsZWQgPSAhIW9wdHMucGluY2hFbmFibGVkO1xyXG5cdFx0XHR0aGlzLndoZWVsRW5hYmxlZCA9ICEhb3B0cy53aGVlbEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGFuRW5hYmxlZCA9ICEhb3B0cy5wYW5FbmFibGVkO1xyXG5cdFx0XHR0aGlzLnRpbHRFbmFibGVkID0gISFvcHRzLnRpbHRFbmFibGVkO1xyXG5cdFx0XHR0aGlzLmV2ZW50c1JldmVyc2VkID0gISFvcHRzLmV2ZW50c1JldmVyc2VkO1xyXG5cdFx0XHRcclxuXHRcdFx0dGhpcy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLl9jb29yZGluYXRlcyA9IFswLCAwXTtcclxuXHRcdFx0dGhpcy5fdG91Y2hlcyA9IFsgXTtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID0gQ29udHJvbGxhYmxlQ2FudmFzLmlzTW9iaWxlO1xyXG5cdFx0XHRpZiAoIUNvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCkgQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ID0gQ29udHJvbGxhYmxlQ2FudmFzLmxpbmVUb1BpeDtcclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudGFyZ2V0LCBcIl9jY19cIiwge1xyXG5cdFx0XHRcdHZhbHVlOiB0aGlzLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vY3RvclxyXG5cdFx0XHJcblx0XHRnZXQgcmF0aW8oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMudGFyZ2V0LndpZHRoIC8gdGhpcy50YXJnZXQuaGVpZ2h0O1xyXG5cdFx0fSAvL2ctcmF0aW8gIE9CU1xyXG5cdFx0Z2V0IG1pbigpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5taW4odGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1taW5cclxuXHRcdGdldCBtYXgoKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWF4ICBPQlNcclxuXHRcdFxyXG5cdFx0XHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9sc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRoYW5kbGUoKTogdm9pZCB7XHJcblx0XHRcdHRoaXMuX21vYmlsZSA/IHRoaXMuX21vYmlsZUFkYXB0KCkgOiB0aGlzLl9wY0FkYXB0KCk7XHJcblx0XHR9IC8vaGFuZGxlXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCAoL2NyZWF0ZSkgYSB3aWRnZXQgaW4gdGhlIGNvbnRyb2xsZXJcclxuXHRcdCAqIEBwYXJhbSB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbnxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnN9IGRhdGEgLSBjb25zdHJ1Y3RvciBvcHRpb25zXHJcblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufSB0aGUgd2lkZ2V0XHJcblx0XHQgKi9cclxuXHRcdGFkZFdpZGdldChkYXRhOiBDYW52YXNCdXR0b24gfCBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMpOiBDYW52YXNCdXR0b24ge1xyXG5cdFx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbiAmJiAhdGhpcy53Z2V0cy5oYXMoZGF0YSkpIHtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIGlmICghKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24pKSB7XHJcblx0XHRcdFx0ZGF0YSA9IG5ldyBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uKDxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnM+ZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVJU0FMUjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cdFx0XHJcblx0XHRcclxuXHRcdC8qKlxyXG5cdFx0ICogUmUtYXBwbHkgaW50ZXJuYWwgdHJhbnNmb3JtYXRpb25zXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcmV0dXJucyB7Q29udHJvbGxhYmxlQ2FudmFzfSB0aGlzIC0gRm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRyZXRyYW5zZm9ybSgpOiBUaGlzVHlwZTxDb250cm9sbGFibGVDYW52YXM+IHtcclxuXHRcdFx0dGhpcy5jb250ZXh0LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTsgIC8vU0tFVy9ST1RBVEUgTk9UIElNUExFTUVOVEVEISFcclxuXHRcdFx0dGhpcy5jb250ZXh0LnRyYW5zbGF0ZSh0aGlzLnRyYW5zWzBdLCB0aGlzLnRyYW5zWzFdKTtcclxuXHRcdFx0dGhpcy5jb250ZXh0LnNjYWxlKHRoaXMuc2NsWzBdLCB0aGlzLnNjbFsxXSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL3JldHJhbnNmb3JtXHJcblx0XHRcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHRyYW5zbGF0aW9uIGZ1bmN0aW9uIGZvciBpY29uaWMgdHJhbnNsYXRlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIHggdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSB5IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKTogbnVtYmVyID0+IC1iKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IGJvdW5kKE51bWJlcighYWJzID8gKHRybiArIGJ5W2lkeF0pIDogYnlbaWR4XSksIHRoaXMuZHluYW1pY1RyYW5zQm91bmRzID8gdGhpcy50cmFuc0JvdW5kc1tpZHhdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4XSwgdGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPyB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgc2NhbGUgb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgc2NhbGluZ1xyXG5cdFx0ICovXHJcblx0XHRzY2FsZSh4OiBudW1iZXIgPSAxLCB5OiBudW1iZXIgPSB4LCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzUmV2ZXJzZWQpIGJ5ID0gYnkubWFwKChiOiBudW1iZXIpOiBudW1iZXIgPT4gLWIpO1xyXG5cdFx0XHRpZiAoIWFicykge1xyXG5cdFx0XHRcdGxldCBuc2NsOiBudW1iZXJbXSA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IHNjbCAqIGJ5W2lkeF0pO1xyXG5cdFx0XHRcdG5zY2wgPSBbbnNjbFswXSAtIHRoaXMuc2NsWzBdLCBuc2NsWzFdIC0gdGhpcy5zY2xbMV1dO1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgdGhpcy5zY2xbMV0gIT09IGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSBbYmxvY2sodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSwgbnNjbFswXSksIGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl96b29tQ2hhbmdlZCA9IFt0aGlzLnNjbFswXSAhPT0gYm91bmQodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSksIHRoaXMuc2NsWzFdICE9PSBib3VuZCh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdKV07XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2NsID0gdGhpcy5zY2wubWFwKChzY2w6IG51bWJlciwgaWR4OiBudW1iZXIpOiBudW1iZXIgPT4gYm91bmQoc2NsICogYnlbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3NjYWxlXHJcblx0XHRcclxuXHRcdHByaXZhdGUgX21vYmlsZUFkYXB0KCk6IHZvaWQge1xyXG5cdFx0XHRpZiAoISh0aGlzLl9hZGFwdHMuZHJhZyB8fCB0aGlzLl9hZGFwdHMucGluY2gpICYmIHRoaXMuZHJhZ0VuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVTdGFydChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuX2FkYXB0cy5waW5jaCA9IHRoaXMuX2FkYXB0cy5kcmFnID0gKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlTW92ZShlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCAmJiB0aGlzLnRpbHRFbmFibGVkKSB7XHJcblx0XHRcdFx0Ly9UT0RPXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fbW9iaWxlQWRhcHRcclxuXHRcdHByaXZhdGUgX3BjQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghKHRoaXMuX2FkYXB0cy5kcmFnIHx8IHRoaXMuX2FkYXB0cy5jbGljaykgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRcdHRoaXMuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdFx0dGhpcy5fcHJlc3NlZCA9IHRydWU7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5fYWRhcHRzLmNsaWNrID0gKGU/OiBNb3VzZUV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuY2xpY2tQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0Ly9AdHMtaWdub3JlXHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4gdGhpcy5fYWRhcHRzLmNsaWNrKGUpKTtcclxuXHRcdFx0XHRpZiAoKHRoaXMudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMud2hlZWwgJiYgdGhpcy53aGVlbEVuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5fYWRhcHRzLndoZWVsID0gKGU6IFdoZWVsRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy53aGVlbChlLCB0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCAmJiB0aGlzLnRpbHRFbmFibGVkKSB7XHJcblx0XHRcdFx0Ly9UT0RPXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fcGNBZGFwdFxyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBjbGlja1BDKGV2ZW50OiBNb3VzZUV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGlmIChEYXRlLm5vdygpIC0gY2MuX2Nsa3RpbWUgPD0gY2MuY2xpY2tTZW5zaXRpdml0eSkge1xyXG5cdFx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gWyhldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sIChldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV0sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gZmFsc2U7XHJcblx0XHR9IC8vY2xpY2tQQ1xyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0XHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLFxyXG5cdFx0XHRcdHJlbDogbnVtYmVyW10gPSBbXSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdFx0XHRcclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY29vcmRzO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSA9PT0gMikgfHwgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoID09PSAzKSB8fCAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiA9PT0gMikpKSB8fCAoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRUJPVEgpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIICYmICgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgIT09IDIpICYmICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCAhPT0gMykgJiYgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gIT09IDIpKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGNjLl9wcmVzc2VkKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZShldmVudC5tb3ZlbWVudFggKiBjYy50cmFuc1NwZWVkLCBldmVudC5tb3ZlbWVudFkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKHJlbCA9IGNvb3Jkcy5tYXAoKGM6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IChjIC0gY2MudHJhbnNbaWR4XSkgLyBjYy5zY2xbaWR4XSkpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKHJlbCkpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZHJhZ1BDXHJcblx0XHRcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVNb3ZlKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrKGFycjogbnVtYmVyW10sIGN1cnI6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKGFyci5ldmVyeSgoYXI6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IE1hdGguYWJzKGFyIC0gY3VycltpZHhdKSA+PSBjYy50b3VjaFNlbnNpdGl2aXR5KSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSAvL2NoZWNrXHJcblx0XHRcdGZ1bmN0aW9uIGFycmF5bmdlKHRsaXM6IFRvdWNoTGlzdCk6IG51bWJlcltdW10ge1xyXG5cdFx0XHRcdHJldHVybiBbW3RsaXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSwgW3RsaXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXV07XHJcblx0XHRcdH0gLy9hcnJheW5nZVxyXG5cdFx0XHRmdW5jdGlvbiBldmVyeSh0OiBudW1iZXJbXVtdLCBudDogbnVtYmVyW11bXSwgYWxsOiBib29sZWFuID0gZmFsc2UsIG9uY2U6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCBvdXQgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoYWxsICYmIGNoZWNrKHRbMF0sIG50WzBdKSAmJiBjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWxsKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzBdLCBudFswXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9IG9uY2UgfHwgIW91dDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0XHR9IC8vZXZlcnlcclxuXHRcdFx0ZnVuY3Rpb24gaW5oKG9uZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXNbMF0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHRcdGlmICghb25lKSBjYy5fdG91Y2hlc1sxXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdH0gLy9pbmhcclxuXHRcdFx0XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGNjLmRyYWdFbmFibGVkICYmIGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGxldCBjcDogbnVtYmVyW10gPSBBcnJheS5mcm9tKGNjLnRyYW5zKSxcclxuXHRcdFx0XHRcdGRpczogbnVtYmVyO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZSguLi5bY29vcmRzWzBdIC0gY2MuX2Nvb3JkaW5hdGVzWzBdLCBjb29yZHNbMV0gLSBjYy5fY29vcmRpbmF0ZXNbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2MudHJhbnNTcGVlZCkpO1xyXG5cdFx0XHRcdGRpcyA9IGRpc3QoW2NwWzBdLCBjYy50cmFuc1swXV0sIFtjcFsxXSwgY2MudHJhbnNbMV1dKTtcclxuXHRcdFx0XHRpZiAoZGlzID4gY2MudG91Y2hTZW5zaXRpdml0eSkgY2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGluaCh0cnVlKTtcclxuXHRcdFx0fSBlbHNlIGlmIChjYy5waW5jaEVuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZXJ5KGFycmF5bmdlKGV2ZW50LnRhcmdldFRvdWNoZXMpLCBjYy5fdG91Y2hlcywgZmFsc2UsIHRydWUpKSB7XHJcblx0XHRcdFx0aWYgKChjYy5zY2FsZU1vZGUgJiBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpID09PSBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpIHtcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXJbXSA9IFtNYXRoLmFicyhjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdIC0gY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSksIE1hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdKV0sXHJcblx0XHRcdFx0XHRcdGRpczogbnVtYmVyW10gPSBbTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRMZWZ0KSwgTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRUb3ApXSxcclxuXHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0ubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpIC8gMiAtIGNjLnRyYW5zW2lkeF0pLFxyXG5cdFx0XHRcdFx0XHRkOiBudW1iZXJbXSA9IFtkaXNbMF0gLyBpbmlkaXN0WzBdLCBkaXNbMV0gLyBpbmlkaXN0WzFdXS5tYXAoKHY6IG51bWJlcikgPT4gdiAqIGNjLnNjbFNwZWVkKSxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpICogKDEgLSBkW2lkeF0pKTtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkWzBdKSBjYy50cmFuc2xhdGUobnRvdWNoZXNbMF0pO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZFsxXSkgY2MudHJhbnNsYXRlKG50b3VjaGVzWzFdKTtcclxuXHRcdFx0XHRcdGNjLnNjYWxlKGRbMF0sIGRbMV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXIgPSBkaXN0KFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dKSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXIgPSBkaXN0KFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlciA9IGNjLnNjbFNwZWVkICogZGlzIC8gaW5pZGlzdCxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIpID0+IGkgKiAoMSAtIGQpKTtcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWQuZXZlcnkoKHptOiBib29sZWFuKTogYm9vbGVhbiA9PiB6bSkpICBjYy50cmFuc2xhdGUoLi4ubnRvdWNoZXMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpbmgoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY29vcmRzO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVNb3ZlXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnTW9iaWxlU3RhcnQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMsIGN1c3Q6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCFjdXN0KSB7XHJcblx0XHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcclxuXHRcdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4gY2MuX3RvdWNoZXNbdC5pZGVudGlmaWVyXSA9IFt0LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0XHRjb29yZHMgPSBbKHRvdWNoLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdKSAvIGNjLnNjbFswXSwgKHRvdWNoLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV0pIC8gY2Muc2NsWzFdXTtcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhjb29yZHMpKTtcclxuXHRcdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNjLl90b3VjaGVzW2NjLl90b3VjaGVzLmxlbmd0aCAtIDFdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVTdGFydFxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZUVuZChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdFx0XHJcblx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3Jkcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxICYmIERhdGUubm93KCkgLSBjYy5fY2xrdGltZSA8PSBjYy5jbGlja1NlbnNpdGl2aXR5KSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzKSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHRcdFx0XHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhjYy5fdG91Y2hlcykubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGV2ZW50LCBjYywgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyB3aGVlbChldmVudDogV2hlZWxFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRsZXQgZDogbnVtYmVyID0gMSAtIGNjLnNjbFNwZWVkICogQ29udHJvbGxhYmxlQ2FudmFzLmZpeERlbHRhKGV2ZW50LmRlbHRhTW9kZSwgZXZlbnQuZGVsdGFZKSAvIGNjLm1pbixcclxuXHRcdFx0XHRjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdLCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdXTtcclxuXHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWQuZXZlcnkoKHptOiBib29sZWFuKTogYm9vbGVhbiA9PiB6bSkpIGNjLnRyYW5zbGF0ZSguLi5jb29yZHMubWFwKChjOiBudW1iZXIpID0+IGMgKiAoMSAtIGQpKSk7XHJcblx0XHR9IC8vd2hlZWxcclxuXHRcdFxyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgaXNNb2JpbGUoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL3dlYk9TL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQYWQvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9pc01vYmlsZVxyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgbGluZVRvUGl4KCk6IG51bWJlciB7XHJcblx0XHRcdGxldCByOiBudW1iZXIsXHJcblx0XHRcdFx0aWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcblx0XHRcdGlmcmFtZS5zcmMgPSAnIyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0bGV0IGl3aW46IFdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93LFxyXG5cdFx0XHRcdGlkb2M6IERvY3VtZW50ID0gaXdpbi5kb2N1bWVudDtcclxuXHRcdFx0aWRvYy5vcGVuKCk7XHJcblx0XHRcdGlkb2Mud3JpdGUoJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48cD5hPC9wPjwvYm9keT48L2h0bWw+Jyk7XHJcblx0XHRcdGlkb2MuY2xvc2UoKTtcclxuXHRcdFx0bGV0IHNwYW46IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50Pmlkb2MuYm9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxuXHRcdFx0ciA9IHNwYW4ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcblx0XHRcdHJldHVybiByO1xyXG5cdFx0fSAvL2xpbmVUb1BpeFxyXG5cdFx0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBmaXhEZWx0YShtb2RlOiBudW1iZXIsIGRlbHRhWTogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdFx0aWYgKG1vZGUgPT09IDEpIHtcclxuXHRcdFx0XHRyZXR1cm4gQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ICogZGVsdGFZO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG1vZGUgPT09IDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBkZWx0YVk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9maXhEZWx0YVxyXG5cdH0gLy9Db250cm9sbGFibGVDYW52YXNcclxuXHRcclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIHRvIGNvbnRyb2wga2V5Ym9hcmQgZXZlbnRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIEtleUJpbmQge1xyXG5cdFx0cHJlc3M6IEtleVtdID0gWyBdO1xyXG5cdFx0ZG93bjogS2V5W10gPSBbIF07XHJcblx0XHR1cDogS2V5W10gPSBbIF07XHJcblx0XHRlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHRcdF9ib3VuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWQ6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXA6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHsgfTtcclxuXHRcdFxyXG5cdFx0c3RhdGljIF9pZGNudHIgPSAwO1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkOiBudW1iZXIgPSA1O1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkdXA6IG51bWJlciA9IC41O1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXIgPSAyMDtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdHN0YXRpYyBhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHtcclxuXHRcdFx0XHRBcnJvd1VwOiBbMCwgMV0sXHJcblx0XHRcdFx0QXJyb3dEb3duOiBbMCwgLTFdLFxyXG5cdFx0XHRcdEFycm93TGVmdDogWzEsIDBdLFxyXG5cdFx0XHRcdEFycm93UmlnaHQ6IFstMSwgMF1cclxuXHRcdFx0fTtcclxuXHRcdFxyXG5cdFx0Y29uc3RydWN0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGJpbmQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMuYXJyb3dCaW5kaW5ncywgS2V5QmluZC5hcnJvd0JpbmRpbmdzKTtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWQ7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWR1cCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWR1cDtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZE1heCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWRNYXg7XHJcblx0XHRcdGJpbmQgJiYgdGhpcy5iaW5kKCk7XHJcblx0XHR9IC8vY3RvclxyXG5cdFx0XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGUgPT09IFwia2V5ZG93blwiKSB7XHJcblx0XHRcdFx0ZXZlbnQudGFyZ2V0W1wiX2NjX1wiXS50cmFuc2xhdGUodGhpcy5hcnJvd01vdmVTcGVlZCAqIHRoaXMuYXJyb3dCaW5kaW5nc1tldmVudC5rZXldWzBdLCB0aGlzLmFycm93TW92ZVNwZWVkICogdGhpcy5hcnJvd0JpbmRpbmdzW2V2ZW50LmtleV1bMV0pO1xyXG5cdFx0XHRcdGlmICh0aGlzLmFycm93TW92ZVNwZWVkdXBFbmFibGVkKSB0aGlzLmFycm93TW92ZVNwZWVkID0gYm91bmQodGhpcy5hcnJvd01vdmVTcGVlZCArIHRoaXMuYXJyb3dNb3ZlU3BlZWR1cCwgMCwgdGhpcy5hcnJvd01vdmVTcGVlZE1heCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2Fycm93TW92ZVxyXG5cdFx0XHJcblx0XHRiaW5kQXJyb3dzKCk6IHZvaWQge1xyXG5cdFx0XHRmb3IgKGxldCBpIGluIHRoaXMuYXJyb3dCaW5kaW5ncykge1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXlkb3duKGksIEtleUJpbmQuYXJyb3dNb3ZlLmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXl1cChpLCBLZXlCaW5kLmFycm93TW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmJpbmRBcnJvd3MgPSAoKTogdm9pZCA9PiB7IH07XHJcblx0XHR9IC8vYmluZEFycm93c1xyXG5cdFx0XHJcblx0XHQvKipcclxuXHRcdCAqIEJpbmQga2V5IGV2ZW50IGxpc3RlbmVyc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGJpbmQoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmICghdGhpcy5fYm91bmQpIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5cHJlc3NcIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleXVwXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleWRvd25cIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2JvdW5kID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0XHJcblx0XHRfaGFuZGxlcih0eXBlOiBzdHJpbmcsIGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBoYW5kbGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRcdHRoaXNbdHlwZS5yZXBsYWNlKFwia2V5XCIsICcnKV0uZm9yRWFjaCgoa2V5OiBLZXkpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRpZiAoa2V5LmtleSA9PT0gZXZlbnQua2V5KSB7XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gIWtleS5jYWxsYmFjayhldmVudCwgdHlwZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZWQ7XHJcblx0XHR9IC8vX2hhbmRsZXJcclxuXHRcdFxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXlwcmVzcyhrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnByZXNzLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwicHJlc3NcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXByZXNzXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleWRvd24oa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy5kb3duLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwiZG93blwiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5ZG93blxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXl1cChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnVwLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwidXBcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXVwXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7S2V5fSBrZXlcclxuXHRcdCAqL1xyXG5cdFx0dW5yZWdpc3RlcihrZXk6IEtleSB8IG51bWJlciB8IHN0cmluZywgcmVwbDogS2V5KTogS2V5IHwgS2V5W10gfCBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwibnVtYmVyXCIpIHtcclxuXHRcdFx0XHRsZXQgaWR4OiBudW1iZXI7XHJcblx0XHRcdFx0aWYgKChpZHggPSB0aGlzLnByZXNzLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcmVzcy5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKChpZHggPSB0aGlzLmRvd24uZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvd24uc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICgoaWR4ID0gdGhpcy51cC5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMudXAuc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdHRoaXMucHJlc3MgPSB0aGlzLnByZXNzLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0XHR0aGlzLmRvd24gPSB0aGlzLmRvd24uZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHRcdHRoaXMudXAgPSB0aGlzLnVwLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpc1trZXkudHlwZV0uc3BsaWNlKHRoaXNba2V5LnR5cGVdLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkuaWQpLCAxLCByZXBsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3VucmVnaXN0ZXJcclxuXHR9IC8vS2V5QmluZFxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQG1lbWJlcm9mIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0gZHggLSB3aWR0aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR5IC0gaGVpZ2h0XHJcblx0ICogQHByb3Age251bWJlcn0gaW5kZXggLSBlcXVpdmFsZW50IHRvIENTUyB6LWluZGV4XHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENhbnZhc0J1dHRvbiBpbXBsZW1lbnRzIE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHR4OiBudW1iZXIgPSAwO1xyXG5cdFx0eTogbnVtYmVyID0gMDtcclxuXHRcdGR4OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHk6IG51bWJlciA9IDA7XHJcblx0XHRpbmRleDogbnVtYmVyID0gLTE7XHJcblx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdF9pZDogbnVtYmVyO1xyXG5cdFx0ZW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRwc3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBvc2l0aW9uOiBudW1iZXIgPSAyO1xyXG5cdFx0XHJcblx0XHRzdGF0aWMgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC4zO1xyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2lkY250cjogbnVtYmVyID0gMDtcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDYW52YXNCdXR0b25cclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IHtcclxuXHRcdFx0eDogMCxcclxuXHRcdFx0eTogMCxcclxuXHRcdFx0ZHg6IDAsXHJcblx0XHRcdGR5OiAwLFxyXG5cdFx0XHRpbmRleDogLTEsXHJcblx0XHRcdHBzdGF0ZTogZmFsc2UsXHJcblx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdHBvc2l0aW9uOiAyLFxyXG5cdFx0XHRwYXJlbnQ6IG5ldyBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdH07XHJcblx0XHRcclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cykgeyAgLy9ET1VCTEVDTElDSywgTE9OR0NMSUNLLCBEUkFHLCAuLi4gVVNFUi1JTVBMRU1FTlRFRCg/KVxyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cyk7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoW29wdHMueCwgb3B0cy55LCBvcHRzLmR4LCBvcHRzLmR5LCBvcHRzLnBvc2l0aW9uLCBvcHRzLmluZGV4XS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnggPSBvcHRzLnggKiAxO1xyXG5cdFx0XHR0aGlzLnkgPSBvcHRzLnkgKiAxO1xyXG5cdFx0XHR0aGlzLmR4ID0gb3B0cy5keCAqIDE7XHJcblx0XHRcdHRoaXMuZHkgPSBvcHRzLmR5ICogMTtcclxuXHRcdFx0dGhpcy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfCAwO1xyXG5cdFx0XHR0aGlzLmluZGV4ID0gb3B0cy5pbmRleCB8IDA7XHJcblx0XHRcdHRoaXMuZW5hYmxlZCA9ICEhb3B0cy5lbmFibGVkO1xyXG5cdFx0XHR0aGlzLl9pZCA9IENhbnZhc0J1dHRvbi5faWRjbnRyKys7XHJcblx0XHR9IC8vY3RvclxyXG5cdFx0XHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBleGl0ZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Ymx1ciguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2JsdXJcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGVudGVyZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Zm9jdXMoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vZm9jdXNcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGNsaWNrZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Y2xpY2soLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9jbGlja1xyXG5cdFx0XHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGFib3ZlIHRoZSB3aWRnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyW119IHJlbGF0aXZlQ29vcmRzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdF9pc09uKHJlbGF0aXZlQ29vcmRzOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgeDogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLkZJWEVEKSA9PT0gT3B0cy5Qb3NpdGlvbi5GSVhFRCA/IHRoaXMueCAtIHRoaXMucGFyZW50LnRyYW5zWzBdIDogdGhpcy54LFxyXG5cdFx0XHRcdHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyB0aGlzLnkgLSB0aGlzLnBhcmVudC50cmFuc1sxXSA6IHRoaXMueSxcclxuXHRcdFx0XHRkeDogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUpID09PSBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUgPyB0aGlzLmR4ICogdGhpcy5wYXJlbnQuc2NsWzBdIDogdGhpcy5keCxcclxuXHRcdFx0XHRkeTogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUpID09PSBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUgPyB0aGlzLmR5ICogdGhpcy5wYXJlbnQuc2NsWzFdIDogdGhpcy5keSxcclxuXHRcdFx0XHRvdXQ6IGJvb2xlYW4gPSBpc1dpdGhpbihbeCwgeSwgZHgsIGR5XSwgW3JlbGF0aXZlQ29vcmRzWzBdLCByZWxhdGl2ZUNvb3Jkc1sxXV0sIENhbnZhc0J1dHRvbi5zZW5zaXRpdml0eSk7XHJcblx0XHRcdFx0XHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL19pc09uXHJcblx0fSAvL0NhbnZhc0J1dHRvblxyXG5cdFxyXG5cdENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24gPSBDYW52YXNCdXR0b247XHJcblx0XHJcblx0LyoqXHJcblx0ICogQSBjbGFzcyBvZmZlcmluZyBtYXRoZW1hdGljYWwgVmVjdG9yIHV0aWxpdGllc1xyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBjbGFzc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcHJvcHMgLSB2ZWN0b3IgdmVydGljZXNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgVmVjdG9yIHtcclxuXHRcdHByb3BzOiBudW1iZXJbXTtcclxuXHRcdFxyXG5cdFx0Y29uc3RydWN0b3IocHJvcHM6IG51bWJlcltdID0gWyBdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblx0XHRcclxuXHRcdC8qKlxyXG5cdFx0ICogQWRkIGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gc3ViIC0gU2V0IHRvIGAtMWAgdG8gc3Vic3RyYWN0IGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdGFkZCh0YXJnOiBWZWN0b3IgfCBudW1iZXIsIHN1YjogbnVtYmVyID0gMSk6IFRoaXNUeXBlPFZlY3Rvcj4ge1xyXG5cdFx0XHRpZiAodGFyZyBpbnN0YW5jZW9mIFZlY3Rvcikge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmdbaWR4XTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSArPSBzdWIgKiB0YXJnO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL2FkZFxyXG5cdFx0LyoqXHJcblx0XHQgKiBNdWx0aXBseSBhIHZlY3RvciBvciBudW1iZXIgdG8gY3VycmVudCB2ZWN0b3JcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7VmVjdG9yfG51bWJlcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IGRpdiAtIFNldCB0byBgLTFgIHRvIGRpdmlkZSBpbnN0ZWFkXHJcblx0XHQgKiBAcmV0dXJucyBgdGhpc2AgZm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRtdWx0KHRhcmc6IFZlY3RvciB8IG51bWJlciwgZGl2OiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZ1tpZHhdLCBkaXYpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICo9IE1hdGgucG93KHRhcmcsIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vbXVsdFxyXG5cdFx0LyoqXHJcblx0XHQgKiBEb3QgcHJvZHVjdCBvZiAyIHZlY3RvcnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7VmVjdG9yfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcmV0dXJucyBwcm9kdWN0XHJcblx0XHQgKi9cclxuXHRcdGRvdCh0YXJnOiBWZWN0b3IpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5wcm9wcy5yZWR1Y2UoKGFjYzogbnVtYmVyLCB2YWw6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGFjYyArIHZhbCAqIHRhcmdbaWR4XSk7XHJcblx0XHR9IC8vZG90XHJcblx0fSAvL1ZlY3RvclxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEBwcm9wIHtIVE1MRWxlbWVudFtdfSByZXNvdXJjZXMgLSBBbGwgSFRNTCByZXNvdXJjZSBlbGVtZW50cyB3aXRoIFwibG9hZFwiIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgbG9hZGVkLiBsaWtlOiBhdWRpby9pbWdcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0cmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdID0gWyBdO1xyXG5cdFx0X2xvYWRjbnRyOiBudW1iZXIgPSAwO1xyXG5cdFx0XHJcblx0XHRjb25zdHJ1Y3RvcihyZXNvdXJjZXM6IEhUTUxFbGVtZW50W10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cdFx0XHR0aGlzLnJlc291cmNlcyA9IEFycmF5LmZyb20ocmVzb3VyY2VzKTtcclxuXHRcdFx0dGhpcy5sb2FkID0gb25sb2FkIHx8IHRoaXMubG9hZDtcclxuXHRcdFx0aWYgKGF1dG9iaW5kKSB0aGlzLmJpbmQodGhpcy5sb2FkKTtcclxuXHRcdH0gLy9jdG9yXHJcblx0XHRcclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHRcdFxyXG5cdFx0LyoqXHJcblx0XHQgKiBMb2FkIGltYWdlcyBieSBVUkxzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ1tdfSB1cmxpc3QgLSBsaXN0IG9mIHVybHNcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IG9ubG9hZCAtIGNhbGxiYWNrXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9iaW5kPXRydWUgLSBhdXRvIGJpbmRcclxuXHRcdCAqIEByZXR1cm5zIHtSZXNvdXJjZUxvYWRlcn0gdGhlIGxvYWRlclxyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgaW1hZ2VzKHVybGlzdDogc3RyaW5nW10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSB0cnVlKTogUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0XHRsZXQgaW1nbGlzdDogSFRNTEltYWdlRWxlbWVudFtdID0gWyBdO1xyXG5cdFx0XHRcclxuXHRcdFx0Zm9yIChsZXQgdXJsIG9mIHVybGlzdCkge1xyXG5cdFx0XHRcdGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuXHRcdFx0XHRpbWcuc3JjID0gdXJsO1xyXG5cdFx0XHRcdGltZ2xpc3QucHVzaChpbWcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGltZ2xpc3QsIG9ubG9hZCwgYXV0b2JpbmQpO1xyXG5cdFx0fSAvL2ltYWdlc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBMb2FkIGF1ZGlvIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBhdWRpb3ModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBhdWRpb2xpc3Q6IEhUTUxBdWRpb0VsZW1lbnRbXSA9IFsgXTtcclxuXHRcdFx0XHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgYXVkaW8gPSBuZXcgQXVkaW8odXJsKTtcclxuXHRcdFx0XHRhdWRpby5sb2FkKCk7XHJcblx0XHRcdFx0YXVkaW9saXN0LnB1c2goYXVkaW8pO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGF1ZGlvbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vYXVkaW9zXHJcblx0fSAvL1Jlc291cmNlTG9hZGVyXHJcblx0XHJcbn0gLy9DYW52YXNDb250cm9sc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2FudmFzQ29udHJvbHMuQ29udHJvbGxhYmxlQ2FudmFzO1xyXG4iXX0=