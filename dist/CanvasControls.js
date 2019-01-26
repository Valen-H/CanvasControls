/*
 * Angle between 3 poins (Radians):
 * pc: center/pole
 * pn: point new coordinates
 * pp: point past coordinates
 *
 * atan2(pny - pcy, pnx - pcx) - atan2(ppy - pcy, ppx - pcx)
 */
/*
 * centered zoom breaks with transBounds - normal/acceptable
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
        /**
         * Get screen-equivalent coordinates that bypass transformations.
         * @method
         * @returns {number[]}
         */
        getCoords() {
            return this._coordinates.map((c, idx) => (c - this.trans[idx]) / this.scl[idx]);
        } //getCoords
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
            let x = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? (this.x - this.parent.trans[0]) / this.parent.scl[0] : this.x, y = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? (this.y - this.parent.trans[1]) / this.parent.scl[1] : this.y, dx = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dx / this.parent.scl[0] : this.dx, dy = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dy / this.parent.scl[1] : this.dy, out = isWithin([x, y, dx, dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUdIOztHQUVHO0FBRUgsWUFBWSxDQUFDOztBQUNiLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBRUg7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0E4a0MzQjtBQTlrQ0QsV0FBYyxjQUFjO0lBSTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBZ0IsT0FBTyxDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsWUFBc0IsQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLElBQVksRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakssS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDbkIsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxTQUFTO0lBTkssc0JBQU8sVUFNdEIsQ0FBQTtJQUNEOzs7Ozs7Ozs7T0FTRztJQUNILFNBQWdCLEtBQUssQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFZLENBQUM7UUFDbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxPQUFPO0lBRk8sb0JBQUssUUFFcEIsQ0FBQTtJQUNEOzs7Ozs7O09BT0c7SUFDSCxTQUFnQixLQUFL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LElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNMLE9BQU8sSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6SjtpQkFBTTtnQkFDTixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJ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QyxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUM3SixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO29CQUMzRSxJQUFJLE9BQU8sR0FBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3pQLEdBQUcsR0FBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FB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QUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztnQkFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2xCO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxRQUFRO1FBQ1Y7Ozs7Ozs7O1dBUUc7UUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQWdCLEVBQUUsTUFBbUQsRUFBRSxXQUFvQixJQUFJO1lBQzVHLElBQUksU0FBUyxHQUF1QixFQUFFLENBQUM7WUFFdkMsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7Z0JBQ3ZCLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2IsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtZQUVELE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsUUFBUTtLQUNWLENBQUMsZ0JBQWdCO0lBbkVMLDZCQUFjLGlCQW1FMUIsQ0FBQTtBQUVGLENBQUMsRUE5a0NhLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBOGtDM0IsQ0FBQyxnQkFBZ0I7QUFFbEIsa0JBQWUsY0FBYyxDQUFDLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQW5nbGUgYmV0d2VlbiAzIHBvaW5zIChSYWRpYW5zKTpcclxuICogcGM6IGNlbnRlci9wb2xlXHJcbiAqIHBuOiBwb2ludCBuZXcgY29vcmRpbmF0ZXNcclxuICogcHA6IHBvaW50IHBhc3QgY29vcmRpbmF0ZXNcclxuICogXHJcbiAqIGF0YW4yKHBueSAtIHBjeSwgcG54IC0gcGN4KSAtIGF0YW4yKHBweSAtIHBjeSwgcHB4IC0gcGN4KVxyXG4gKi9cclxuXHJcblxyXG4vKlxyXG4gKiBjZW50ZXJlZCB6b29tIGJyZWFrcyB3aXRoIHRyYW5zQm91bmRzIC0gbm9ybWFsL2FjY2VwdGFibGVcclxuICovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuaW1wb3J0IFwiQGJhYmVsL3BvbHlmaWxsXCI7XHJcblxyXG4vKipcclxuICogQGZpbGUgQ2FudmFzQ29udHJvbHMudHNcclxuICogQGNvcHlyaWdodCBWYWxlbi4gSC4gMmsxOFxyXG4gKiBAYXV0aG9yIFZhbGVuLkguIDxhbHRlcm5hdGl2ZXh4eHlAZ21haWwuY29tPlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUaGUgcm9vdCBvZiB0aGUgbWFpbiBsaWJyYXJ5XHJcbiAqIEBtb2R1bGUgQ2FudmFzQ29udHJvbHNcclxuICogQGxpY2Vuc2UgSVNDXHJcbiAqIEBnbG9iYWxcclxuICovXHJcbmV4cG9ydCBtb2R1bGUgQ2FudmFzQ29udHJvbHMge1xyXG5cclxuXHR0eXBlIENsYXNzID0geyBuZXcoLi4uYXJnczogYW55W10pOiBhbnk7IH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIElmIGBkZXN0YCBsYWNrcyBhIHByb3BlcnR5IHRoYXQgYHRhcmdgIGhhcyB0aGVuIHRoYXQgcHJvcGVydHkgaXMgY29waWVkIGludG8gYGRlc3RgXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IGRlc3QgLSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGFyZyAtIGJhc2Ugb2JqZWN0XHJcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY29uZGl0aW9uIC0gaW5oZXJpdGFuY2UgY29uZGl0aW9uXHJcblx0ICogQHJldHVybnMge29iamVjdH0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGluaGVyaXQoZGVzdDoge30sIHRhcmc6IHt9LCBjb25kaXRpb246IEZ1bmN0aW9uID0gKGRlc3Q6IHt9LCB0YXJnOiB7fSwgcHJvcDogc3RyaW5nKTogYW55ID0+IGRlc3RbcHJvcF0gPT09IHVuZGVmaW5lZCAmJiAoZGVzdFtwcm9wXSA9IHRhcmdbcHJvcF0pKToge30ge1xyXG5cdFx0Zm9yIChsZXQgaSBpbiB0YXJnKSB7XHJcblx0XHRcdGNvbmRpdGlvbihkZXN0LCB0YXJnLCBpKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZGVzdDtcclxuXHR9IC8vaW5oZXJpdFxyXG5cdC8qKlxyXG5cdCAqIFJlc3RyaWN0IG51bWJlcidzIHJhbmdlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSB0YXJnZXQgbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gbWF4aW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gcD0wIC0gcHJlY2lzaW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIsIHA6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNICsgcCA/IE0gOiAobiA8IG0gLSBwID8gbSA6IG4pO1xyXG5cdH0gLy9ib3VuZFxyXG5cdC8qKlxyXG5cdCAqIERvd25zcGVlZCBpbmNyZW1lbnRhdGlvblxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBNYXhpbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9wIC0gb3BlcmF0aW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBibG9jayhuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBvcDogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdGlmIChuID4gTSAmJiBvcCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPiBNKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtICYmIG9wIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH0gZWxzZSBpZiAobiA8IG0pIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9XHJcblx0fSAvL2Jsb2NrXHJcblx0LyoqXHJcblx0ICogQ2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBYcyAtIFggY29vcmRpbmF0ZXNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBZcyAtIFkgY29vcmRpbmF0ZXNcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBkaXN0YW5jZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBkaXN0KFhzOiBudW1iZXJbXSwgWXM6IG51bWJlcltdKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQoW1hzWzFdIC0gWHNbMF0sIFlzWzFdIC0gWXNbMF1dLm1hcCgodjogbnVtYmVyKSA9PiBNYXRoLnBvdyh2LCAyKSkucmVkdWNlKChhY2M6IG51bWJlciwgdjogbnVtYmVyKSA9PiBhY2MgKyB2KSk7XHJcblx0fSAvL2Rpc3RcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBpbnNpZGUgYW4gYXJlYVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGJveCAtIHgseSxkeCxkeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IHBvaW50IC0geCx5XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHNlbnNpdGl2aXR5IC0gZXh0cmEgYm91bmRhcnlcclxuXHQgKiBAcmV0dXJucyBib29sZWFuXHJcblx0ICogQGlubmVyXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGlzV2l0aGluKGJveDogbnVtYmVyW10sIHBvaW50OiBudW1iZXJbXSwgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC41KTogYm9vbGVhbiB7XHJcblx0XHRyZXR1cm4gYm94WzBdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMF0gJiYgYm94WzBdICsgYm94WzJdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMF0gJiYgYm94WzFdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMV0gJiYgYm94WzFdICsgYm94WzNdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMV07XHJcblx0fSAvL2lzV2l0aGluXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgT3B0aW9uc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9wdHMge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHluYW1pY1RyYW5zQm91bmRzPXRydWUgLSB0cmFuc0JvdW5kcyBkZXBlbmQgb24gc2NhbGluZ1xyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKDEgZmluZ2VyIG9ubHkgc2hhbGwgbW92ZSlcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0ga2V5c0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUga2V5YWJvcmQgZXZlbnRzIGxpc3RlbmVyXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwYW5FbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIGJhc2VkIG9uIG1vdXNlL2ZpbmdlciBkaXN0YW5jZSBmcm9tIHBpbiAocHNldWRvLWNlbnRlcilcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLlVzZUJ1dHRvbn0gdXNlQnV0dG9uPU9wdHMuVXNlQnV0dG9uLlVTRUxFRlQgLSBSZXNwb25kIHRvIGxlZnQtY2xpY2ssIHJpZ2h0IG9yIGJvdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc30gX2FkYXB0cyAtIE1hcCBvZiBhbGwgY3VycmVudGx5IGF0dGFjaGVkIGNvbnRyb2wgZXZlbnQgYWRhcHRlcnNcclxuXHRcdCAqIEBtZW1iZXIge1NldDxDYW52YXNCdXR0b24+fSB3Z2V0cyAtIENhbnZhcyB3aWRnZXRzXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdFx0dGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdFx0dHJhbnM/OiBudW1iZXJbXTtcclxuXHRcdFx0c2NsPzogbnVtYmVyW107XHJcblx0XHRcdGRyYWdFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cGluY2hFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0d2hlZWxFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0a2V5c0VuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwYW5FbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0dGlsdEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRldmVudHNSZXZlcnNlZD86IGJvb2xlYW47XHJcblx0XHRcdHVzZUJ1dHRvbj86IG51bWJlcjtcclxuXHRcdFx0c2NhbGVNb2RlPzogbnVtYmVyO1xyXG5cdFx0XHR0cmFuc0JvdW5kcz86IG51bWJlcltdO1xyXG5cdFx0XHRzY2xCb3VuZHM/OiBudW1iZXJbXTtcclxuXHRcdFx0dHJhbnNTcGVlZD86IG51bWJlcjtcclxuXHRcdFx0ZHluYW1pY1RyYW5zQm91bmRzPzogYm9vbGVhbjtcclxuXHRcdFx0c2NsU3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk/OiBudW1iZXI7XHJcblx0XHRcdGNsaWNrU2Vuc2l0aXZpdHk/OiBudW1iZXI7XHJcblx0XHRcdF9hZGFwdHM/OiBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdFx0d2dldHM/OiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNPcHRpb25zXHJcblx0XHQvKipcclxuXHRcdCAqIE06IG1vYmlsZVxyXG5cdFx0ICogUDogcGNcclxuXHRcdCAqIE1QOiBib3RoXHJcblx0XHQgKiBcclxuXHRcdCAqIGRyYWc6XHJcblx0XHQgKlx0UDogbW91c2UgIGhvbGQgJiBtb3ZlXHJcblx0XHQgKlx0TTogdG91Y2ggIGhvbGQgJiBtb3ZlXHJcblx0XHQgKiBwaW5jaDpcclxuXHRcdCAqXHR0b3VjaCAgMi1maW5nZXIgJiBtb3ZlXHJcblx0XHQgKiB3aGVlbDpcclxuXHRcdCAqXHR3aGVlbCAgbW92ZSAgW3BjIHBpbmNoLWVxdWl2YWxlbnRdXHJcblx0XHQgKiBwYW46XHJcblx0XHQgKlx0ZGlzcG9zaXRpb24gZnJvbSBjZW50ZXIgY2F1c2VzIGNvbnN0YW50IHRyYW5zbGF0aW9uXHJcblx0XHQgKiB0aWx0OlxyXG5cdFx0ICpcdGRldmljZW1vdGlvbiAgY2F1c2VzIHBhbm5pbmcqXHJcblx0XHQgKlx0XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzIHtcclxuXHRcdFx0ZHJhZzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRwaW5jaD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVxyXG5cdFx0XHR3aGVlbD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vUFxyXG5cdFx0XHRwYW46IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0dGlsdD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0Y2xpY2s6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBPcHRpb25zIG9mIENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b25cclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHggLSB3aWRnZXQgd2lkdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHkgLSB3aWRnZXQgaGVpZ2h0XHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGluZGV4IC0gd2lkZ2V0IGV2ZW50IHByaW9yaXR5XHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdFx0eDogbnVtYmVyO1xyXG5cdFx0XHR5OiBudW1iZXI7XHJcblx0XHRcdGR4OiBudW1iZXI7XHJcblx0XHRcdGR5OiBudW1iZXI7XHJcblx0XHRcdGluZGV4PzogbnVtYmVyO1xyXG5cdFx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdFx0ZW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBvc2l0aW9uPzogbnVtYmVyO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NhbnZhc0J1dHRvbk9wdGlvbnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEhcclxuXHRcdH0gLy9Vc2VCdXR0b25cclxuXHRcdGV4cG9ydCBlbnVtIFNjYWxlTW9kZSB7XHJcblx0XHRcdE5PUk1BTCA9IDEsIEZSRUVTQ0FMRVxyXG5cdFx0fSAvL1NjYWxlTW9kZVxyXG5cdFx0ZXhwb3J0IGVudW0gUG9zaXRpb24ge1xyXG5cdFx0XHRGSVhFRCA9IDEsIEFCU09MVVRFLCBVTlNDQUxBQkxFID0gNFxyXG5cdFx0fSAvL1Bvc2l0aW9uXHJcblx0fSAvL09wdHNcclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBlcnJvcnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMge1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDQU5WOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEhUTUxDYW52YXNFbGVtZW50LlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ1RYOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNQVJSMjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBBcnJheSBvZiAyLWF0LWxlYXN0IE51bWJlcnMuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU06IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSB2YWxpZCBOdW1iZXIuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVJU0FMUjogUmVmZXJlbmNlRXJyb3IgPSBuZXcgUmVmZXJlbmNlRXJyb3IoXCJPYmplY3QgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtcclxuXHR9IC8vRXJyb3JzXHJcblxyXG5cdC8qKlxyXG5cdCAqIFR5cGUgb2YgS2V5QmluZFxyXG5cdCAqL1xyXG5cdGV4cG9ydCB0eXBlIEtleSA9IHtcclxuXHRcdGtleTogc3RyaW5nO1xyXG5cdFx0Y2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuO1xyXG5cdFx0aWQ6IG51bWJlcjtcclxuXHRcdHR5cGU6IHN0cmluZztcclxuXHR9O1xyXG5cclxuXHJcblx0LyoqXHJcblx0ICogQSB3cmFwcGVyIGZvciB0aGUgdGFyZ2V0ZWQgY2FudmFzIGVsZW1lbnRcclxuXHQgKiBAY2xhc3NcclxuXHQgKiBAaW1wbGVtZW50cyB7T3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zfVxyXG5cdCAqIEBwcm9wIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHQgKiBAcHJvcCB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0Pz10YXJnZXQuZ2V0Q29udGV4dChcIjJkXCIpIC0gVGhlIDJkIGNvbnRleHQgY3JlYXRlZCBvdXQgb2YgYHRhcmdldGBcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0ICogQHByb3Age251bWJlcltdfSBzY2w9MSwxIC0gU2NhbGluZ1xyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHluYW1pY1RyYW5zQm91bmRzPXRydWUgLSB0cmFuc0JvdW5kcyBkZXBlbmQgb24gc2NhbGluZ1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoIChib3RoIGZpbmdlcnMgc2hhbGwgbW92ZSlcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0ga2V5c0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUga2V5YWJvcmQgZXZlbnRzIGxpc3RlbmVyXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0ICogQHByb3Age09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gX2Nvb3JkaW5hdGVzIC0gQ3VycmVudCBldmVudCBjb29yZGluYXRlc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdCAqIEBwcm9wIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdCAqIEBwcm9wIHtvYmplY3R9IF90b3VjaGVzIC0gTWFwIG9mIGFsbCBjdXJyZW50IHRvdWNoZXNcclxuXHQgKiBAcHJvcCB7Q2xhc3N9IENhbnZhc0J1dHRvbiAtIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQHByb3Age1NldDxDYW52YXNCdXR0b24+fSB3Z2V0cyAtIENhbnZhcyB3aWRnZXRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENvbnRyb2xsYWJsZUNhbnZhcyBpbXBsZW1lbnRzIE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0Y29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cdFx0dHJhbnM6IG51bWJlcltdID0gWzAsIDBdO1xyXG5cdFx0c2NsOiBudW1iZXJbXSA9IFsxLCAxXTtcclxuXHRcdHBpbjogbnVtYmVyW107ICAvL09CU1xyXG5cdFx0dHJhbnNCb3VuZHM6IG51bWJlcltdID0gWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldO1xyXG5cdFx0ZHluYW1pY1RyYW5zQm91bmRzOiBib29sZWFuID0gdHJ1ZTtcclxuXHRcdHNjbEJvdW5kczogbnVtYmVyW10gPSBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGRyYWdFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHdoZWVsRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0a2V5c0VuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBhbkVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTsgIC8vT0JTXHJcblx0XHR0aWx0RW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlOyAgLy9PQlNcclxuXHRcdGV2ZW50c1JldmVyc2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR1c2VCdXR0b246IG51bWJlciA9IE9wdHMuVXNlQnV0dG9uLlVTRUxFRlQ7XHJcblx0XHRzY2FsZU1vZGU6IG51bWJlciA9IE9wdHMuU2NhbGVNb2RlLk5PUk1BTDtcclxuXHRcdHRyYW5zU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHRzY2xTcGVlZDogbnVtYmVyID0gMTtcclxuXHRcdHRvdWNoU2Vuc2l0aXZpdHk6IG51bWJlciA9IC41O1xyXG5cdFx0Y2xpY2tTZW5zaXRpdml0eTogbnVtYmVyID0gODAwO1xyXG5cdFx0d2dldHM6IFNldDxDYW52YXNCdXR0b24+O1xyXG5cdFx0a2V5YmluZHM6IEtleUJpbmQ7XHJcblx0XHRwcml2YXRlIF96b29tQ2hhbmdlZDogYm9vbGVhbltdID0gW2ZhbHNlLCBmYWxzZV07XHJcblx0XHRwcml2YXRlIF9tb2JpbGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX3ByZXNzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX2Nsa3RpbWU6IG51bWJlciA9IDA7XHJcblx0XHRfYWRhcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0X2Nvb3JkaW5hdGVzOiBudW1iZXJbXSA9IFtdO1xyXG5cdFx0cHJpdmF0ZSBfdG91Y2hlczogbnVtYmVyW11bXSA9IFtdO1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIF9saW5lcGl4OiBudW1iZXIgPSAxMDtcclxuXHRcdHN0YXRpYyBDYW52YXNCdXR0b246IENsYXNzO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0ge1xyXG5cdFx0XHR0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FudmFzXCIpWzBdLFxyXG5cdFx0XHR0cmFuczogWzAsIDBdLFxyXG5cdFx0XHRzY2w6IFsxLCAxXSxcclxuXHRcdFx0ZHJhZ0VuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRwaW5jaEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHR3aGVlbEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRrZXlzRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBhbkVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHR0aWx0RW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdGV2ZW50c1JldmVyc2VkOiBmYWxzZSxcclxuXHRcdFx0ZHluYW1pY1RyYW5zQm91bmRzOiB0cnVlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC4zNSxcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eTogODAwLFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWNrOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3Z2V0czogbmV3IFNldCgpXHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpO1xyXG5cclxuXHRcdFx0aWYgKCEob3B0cy50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVENBTlY7XHJcblx0XHRcdH0gZWxzZSBpZiAoW29wdHMudHJhbnMsIG9wdHMuc2NsLCBvcHRzLnRyYW5zQm91bmRzLCBvcHRzLnNjbEJvdW5kc10uc29tZShhcnIgPT4gIShhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgYXJyLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShhcnIpLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW5oZXJpdChvcHRzLl9hZGFwdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cy5fYWRhcHRzKTsgIC8vUE9TU0lCTEUgRVJST1JcclxuXHJcblx0XHRcdGlmIChvcHRzLnBpbiA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0b3B0cy5waW4gPSBbb3B0cy50YXJnZXQud2lkdGggLyAyLCBvcHRzLnRhcmdldC5oZWlnaHQgLyAyXTtcclxuXHRcdFx0fSBlbHNlIGlmICghKG9wdHMucGluIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBvcHRzLnBpbi5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20ob3B0cy5waW4pLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xyXG5cdFx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLnRhcmdldC5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0XHRcdHRoaXMua2V5YmluZHMgPSBuZXcgS2V5QmluZCh0aGlzLnRhcmdldCwgb3B0cy5rZXlzRW5hYmxlZCk7XHJcblxyXG5cdFx0XHR0aGlzLl9hZGFwdHMgPSA8T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycz57fTtcclxuXHRcdFx0aW5oZXJpdCh0aGlzLl9hZGFwdHMsIG9wdHMuX2FkYXB0cyk7XHJcblxyXG5cdFx0XHR0aGlzLnRyYW5zU3BlZWQgPSBvcHRzLnRyYW5zU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnNjbFNwZWVkID0gb3B0cy5zY2xTcGVlZCAqIDE7XHJcblx0XHRcdHRoaXMudG91Y2hTZW5zaXRpdml0eSA9IG9wdHMudG91Y2hTZW5zaXRpdml0eSAqIDE7XHJcblx0XHRcdHRoaXMuY2xpY2tTZW5zaXRpdml0eSA9IG9wdHMuY2xpY2tTZW5zaXRpdml0eSAqIDE7XHJcblx0XHRcdHRoaXMudXNlQnV0dG9uID0gb3B0cy51c2VCdXR0b24gfCAwO1xyXG5cdFx0XHR0aGlzLnNjYWxlTW9kZSA9IG9wdHMuc2NhbGVNb2RlIHwgMDtcclxuXHJcblx0XHRcdHRoaXMud2dldHMgPSBuZXcgU2V0KG9wdHMud2dldHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFucyA9IEFycmF5LmZyb20ob3B0cy50cmFucykubWFwKE51bWJlcik7XHJcblx0XHRcdHRoaXMuc2NsID0gQXJyYXkuZnJvbShvcHRzLnNjbCkubWFwKE51bWJlcik7XHJcblx0XHRcdHRoaXMucGluID0gQXJyYXkuZnJvbShvcHRzLnBpbikubWFwKE51bWJlcik7XHJcblx0XHRcdHRoaXMudHJhbnNCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnNCb3VuZHMpLm1hcChOdW1iZXIpOyAgLy8geCwgeSwgWCwgWVxyXG5cdFx0XHR0aGlzLnNjbEJvdW5kcyA9IEFycmF5LmZyb20ob3B0cy5zY2xCb3VuZHMpLm1hcChOdW1iZXIpOyAgLy8geCwgeSwgWCwgWVxyXG5cdFx0XHR0aGlzLmR5bmFtaWNUcmFuc0JvdW5kcyA9ICEhb3B0cy5keW5hbWljVHJhbnNCb3VuZHM7XHJcblxyXG5cdFx0XHR0aGlzLmRyYWdFbmFibGVkID0gISFvcHRzLmRyYWdFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBpbmNoRW5hYmxlZCA9ICEhb3B0cy5waW5jaEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMud2hlZWxFbmFibGVkID0gISFvcHRzLndoZWVsRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5wYW5FbmFibGVkID0gISFvcHRzLnBhbkVuYWJsZWQ7XHJcblx0XHRcdHRoaXMudGlsdEVuYWJsZWQgPSAhIW9wdHMudGlsdEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMuZXZlbnRzUmV2ZXJzZWQgPSAhIW9wdHMuZXZlbnRzUmV2ZXJzZWQ7XHJcblxyXG5cdFx0XHR0aGlzLl9wcmVzc2VkID0gZmFsc2U7XHJcblx0XHRcdHRoaXMuX2Nvb3JkaW5hdGVzID0gWzAsIDBdO1xyXG5cdFx0XHR0aGlzLl90b3VjaGVzID0gW107XHJcblx0XHRcdHRoaXMuX21vYmlsZSA9IENvbnRyb2xsYWJsZUNhbnZhcy5pc01vYmlsZTtcclxuXHRcdFx0aWYgKCFDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXgpIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCA9IENvbnRyb2xsYWJsZUNhbnZhcy5saW5lVG9QaXg7XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnRhcmdldCwgXCJfY2NfXCIsIHtcclxuXHRcdFx0XHR2YWx1ZTogdGhpcyxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogZmFsc2UsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXHJcblx0XHRcdH0pO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHRnZXQgcmF0aW8oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMudGFyZ2V0LndpZHRoIC8gdGhpcy50YXJnZXQuaGVpZ2h0O1xyXG5cdFx0fSAvL2ctcmF0aW8gIE9CU1xyXG5cdFx0Z2V0IG1pbigpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5taW4odGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1taW5cclxuXHRcdGdldCBtYXgoKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWF4ICBPQlNcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBFbmFibGUgY29udHJvbHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqL1xyXG5cdFx0aGFuZGxlKCk6IHZvaWQge1xyXG5cdFx0XHR0aGlzLl9tb2JpbGUgPyB0aGlzLl9tb2JpbGVBZGFwdCgpIDogdGhpcy5fcGNBZGFwdCgpO1xyXG5cdFx0fSAvL2hhbmRsZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgKC9jcmVhdGUpIGEgd2lkZ2V0IGluIHRoZSBjb250cm9sbGVyXHJcblx0XHQgKiBAcGFyYW0ge0NvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b258T3B0cy5DYW52YXNCdXR0b25PcHRpb25zfSBkYXRhIC0gY29uc3RydWN0b3Igb3B0aW9uc1xyXG5cdFx0ICogQHJldHVybiB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbn0gdGhlIHdpZGdldFxyXG5cdFx0ICovXHJcblx0XHRhZGRXaWRnZXQoZGF0YTogQ2FudmFzQnV0dG9uIHwgT3B0cy5DYW52YXNCdXR0b25PcHRpb25zKTogQ2FudmFzQnV0dG9uIHtcclxuXHRcdFx0aWYgKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24gJiYgIXRoaXMud2dldHMuaGFzKGRhdGEpKSB7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoIShkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uKSkge1xyXG5cdFx0XHRcdGRhdGEgPSBuZXcgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbig8T3B0cy5DYW52YXNCdXR0b25PcHRpb25zPmRhdGEpO1xyXG5cdFx0XHRcdGRhdGEucGFyZW50ID0gdGhpcztcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FSVNBTFI7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIDxDYW52YXNCdXR0b24+ZGF0YTtcclxuXHRcdH0gLy9hZGRXaWRnZXRcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBSZS1hcHBseSBpbnRlcm5hbCB0cmFuc2Zvcm1hdGlvbnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtDb250cm9sbGFibGVDYW52YXN9IHRoaXMgLSBGb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdHJldHJhbnNmb3JtKCk6IFRoaXNUeXBlPENvbnRyb2xsYWJsZUNhbnZhcz4ge1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApOyAgLy9TS0VXL1JPVEFURSBOT1QgSU1QTEVNRU5URUQhIVxyXG5cdFx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKHRoaXMudHJhbnNbMF0sIHRoaXMudHJhbnNbMV0pO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5zY2xbMF0sIHRoaXMuc2NsWzFdKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vcmV0cmFuc2Zvcm1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSB0cmFuc2xhdGlvbiBmdW5jdGlvbiBmb3IgaWNvbmljIHRyYW5zbGF0ZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSB4IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT0wIC0geSB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgdHJhbnNsYXRpb24gb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgdHJhbnNsYXRpb25cclxuXHRcdCAqL1xyXG5cdFx0dHJhbnNsYXRlKHg6IG51bWJlciA9IDAsIHk6IG51bWJlciA9IDAsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRpZiAodGhpcy5ldmVudHNSZXZlcnNlZCkgYnkgPSBieS5tYXAoKGI6IG51bWJlcik6IG51bWJlciA9PiAtYik7XHJcblx0XHRcdHJldHVybiB0aGlzLnRyYW5zID0gdGhpcy50cmFucy5tYXAoKHRybjogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChOdW1iZXIoIWFicyA/ICh0cm4gKyBieVtpZHhdKSA6IGJ5W2lkeF0pLCB0aGlzLmR5bmFtaWNUcmFuc0JvdW5kcyA/IHRoaXMudHJhbnNCb3VuZHNbaWR4XSAqIHRoaXMuc2NsW2lkeF0gOiB0aGlzLnRyYW5zQm91bmRzW2lkeF0sIHRoaXMuZHluYW1pY1RyYW5zQm91bmRzID8gdGhpcy50cmFuc0JvdW5kc1tpZHggKyAyXSAqIHRoaXMuc2NsW2lkeF0gOiB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdKSk7XHJcblx0XHR9IC8vdHJhbnNsYXRlXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSBzY2FsaW5nIGZ1bmN0aW9uIGZvciBpY29uaWMgc2NhbGUgYmVmb3JlIHRoZSByZWFsXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geD0xIC0geCBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHk9eCAtIHkgc2NhbGVcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWJzPz1mYWxzZSAtIGFic29sdXRlIHNjYWxlIG9yIHJlbGF0aXZlIHRvIGN1cnJlbnRcclxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJbXX0gUmV0dXJucyBjdXJyZW50IHRvdGFsIHNjYWxpbmdcclxuXHRcdCAqL1xyXG5cdFx0c2NhbGUoeDogbnVtYmVyID0gMSwgeTogbnVtYmVyID0geCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKTogbnVtYmVyID0+IC1iKTtcclxuXHRcdFx0aWYgKCFhYnMpIHtcclxuXHRcdFx0XHRsZXQgbnNjbDogbnVtYmVyW10gPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBzY2wgKiBieVtpZHhdKTtcclxuXHRcdFx0XHRuc2NsID0gW25zY2xbMF0gLSB0aGlzLnNjbFswXSwgbnNjbFsxXSAtIHRoaXMuc2NsWzFdXTtcclxuXHRcdFx0XHR0aGlzLl96b29tQ2hhbmdlZCA9IFt0aGlzLnNjbFswXSAhPT0gYmxvY2sodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSwgbnNjbFswXSksIHRoaXMuc2NsWzFdICE9PSBibG9jayh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdLCBuc2NsWzFdKV07XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2NsID0gW2Jsb2NrKHRoaXMuc2NsWzBdLCB0aGlzLnNjbEJvdW5kc1swXSwgdGhpcy5zY2xCb3VuZHNbMl0sIG5zY2xbMF0pLCBibG9jayh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdLCBuc2NsWzFdKV07XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5fem9vbUNoYW5nZWQgPSBbdGhpcy5zY2xbMF0gIT09IGJvdW5kKHRoaXMuc2NsWzBdLCB0aGlzLnNjbEJvdW5kc1swXSwgdGhpcy5zY2xCb3VuZHNbMl0pLCB0aGlzLnNjbFsxXSAhPT0gYm91bmQodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSldO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbCA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IGJvdW5kKHNjbCAqIGJ5W2lkeF0sIHRoaXMuc2NsQm91bmRzW2lkeF0sIHRoaXMuc2NsQm91bmRzW2lkeCArIDJdKSk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9zY2FsZVxyXG5cclxuXHRcdHByaXZhdGUgX21vYmlsZUFkYXB0KCk6IHZvaWQge1xyXG5cdFx0XHRpZiAoISh0aGlzLl9hZGFwdHMuZHJhZyB8fCB0aGlzLl9hZGFwdHMucGluY2gpICYmIHRoaXMuZHJhZ0VuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVTdGFydChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIHRoaXMuX2FkYXB0cy5waW5jaCA9IHRoaXMuX2FkYXB0cy5kcmFnID0gKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlTW92ZShlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGNhbmNlbFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCAmJiB0aGlzLnRpbHRFbmFibGVkKSB7XHJcblx0XHRcdFx0Ly9UT0RPXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fbW9iaWxlQWRhcHRcclxuXHRcdHByaXZhdGUgX3BjQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghKHRoaXMuX2FkYXB0cy5kcmFnIHx8IHRoaXMuX2FkYXB0cy5jbGljaykgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogTW91c2VFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRcdHRoaXMuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdFx0dGhpcy5fcHJlc3NlZCA9IHRydWU7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5fYWRhcHRzLmNsaWNrID0gKGU/OiBNb3VzZUV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuY2xpY2tQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0Ly9AdHMtaWdub3JlXHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsIChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4gdGhpcy5fYWRhcHRzLmNsaWNrKGUpKTtcclxuXHRcdFx0XHRpZiAoKHRoaXMudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIChlOiBNb3VzZUV2ZW50KSA9PiBlLnByZXZlbnREZWZhdWx0KCksIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMud2hlZWwgJiYgdGhpcy53aGVlbEVuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgdGhpcy5fYWRhcHRzLndoZWVsID0gKGU6IFdoZWVsRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy53aGVlbChlLCB0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMudGlsdCAmJiB0aGlzLnRpbHRFbmFibGVkKSB7XHJcblx0XHRcdFx0Ly9UT0RPXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fcGNBZGFwdFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGNsaWNrUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0aWYgKERhdGUubm93KCkgLSBjYy5fY2xrdGltZSA8PSBjYy5jbGlja1NlbnNpdGl2aXR5KSB7XHJcblx0XHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbKGV2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdKSAvIGNjLnNjbFswXSwgKGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV0pIC8gY2Muc2NsWzFdXSxcclxuXHRcdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzKSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRjYy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0fSAvL2NsaWNrUENcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLFxyXG5cdFx0XHRcdHJlbDogbnVtYmVyW10gPSBbXSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHJcblx0XHRcdGlmICgoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKCgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgPT09IDIpIHx8ICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCA9PT0gMykgfHwgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gPT09IDIpKSkgfHwgKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmIChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFQk9USCAmJiAoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpICE9PSAyKSAmJiAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggIT09IDMpICYmICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uICE9PSAyKSkpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fcHJlc3NlZCkge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0XHRjYy50cmFuc2xhdGUoZXZlbnQubW92ZW1lbnRYICogY2MudHJhbnNTcGVlZCwgZXZlbnQubW92ZW1lbnRZICogY2MudHJhbnNTcGVlZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZvciAobGV0IGJ1dHQgb2YgY2Mud2dldHMpIHtcclxuXHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihyZWwgPSBjb29yZHMubWFwKChjOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiAoYyAtIGNjLnRyYW5zW2lkeF0pIC8gY2Muc2NsW2lkeF0pKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhyZWwpKTtcclxuXHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2RyYWdQQ1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVNb3ZlKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrKGFycjogbnVtYmVyW10sIGN1cnI6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKGFyci5ldmVyeSgoYXI6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IE1hdGguYWJzKGFyIC0gY3VycltpZHhdKSA+PSBjYy50b3VjaFNlbnNpdGl2aXR5KSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSAvL2NoZWNrXHJcblx0XHRcdGZ1bmN0aW9uIGFycmF5bmdlKHRsaXM6IFRvdWNoTGlzdCk6IG51bWJlcltdW10ge1xyXG5cdFx0XHRcdHJldHVybiBbW3RsaXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSwgW3RsaXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXV07XHJcblx0XHRcdH0gLy9hcnJheW5nZVxyXG5cdFx0XHRmdW5jdGlvbiBldmVyeSh0OiBudW1iZXJbXVtdLCBudDogbnVtYmVyW11bXSwgYWxsOiBib29sZWFuID0gZmFsc2UsIG9uY2U6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCBvdXQgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoYWxsICYmIGNoZWNrKHRbMF0sIG50WzBdKSAmJiBjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWxsKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzBdLCBudFswXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9IG9uY2UgfHwgIW91dDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0XHR9IC8vZXZlcnlcclxuXHRcdFx0ZnVuY3Rpb24gaW5oKG9uZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXNbMF0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHRcdGlmICghb25lKSBjYy5fdG91Y2hlc1sxXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdH0gLy9pbmhcclxuXHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cclxuXHRcdFx0aWYgKGNjLmRyYWdFbmFibGVkICYmIGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGxldCBjcDogbnVtYmVyW10gPSBBcnJheS5mcm9tKGNjLnRyYW5zKSxcclxuXHRcdFx0XHRcdGRpczogbnVtYmVyO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZSguLi5bY29vcmRzWzBdIC0gY2MuX2Nvb3JkaW5hdGVzWzBdLCBjb29yZHNbMV0gLSBjYy5fY29vcmRpbmF0ZXNbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2MudHJhbnNTcGVlZCkpO1xyXG5cdFx0XHRcdGRpcyA9IGRpc3QoW2NwWzBdLCBjYy50cmFuc1swXV0sIFtjcFsxXSwgY2MudHJhbnNbMV1dKTtcclxuXHRcdFx0XHRpZiAoZGlzID4gY2MudG91Y2hTZW5zaXRpdml0eSkgY2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGluaCh0cnVlKTtcclxuXHRcdFx0fSBlbHNlIGlmIChjYy5waW5jaEVuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZXJ5KGFycmF5bmdlKGV2ZW50LnRhcmdldFRvdWNoZXMpLCBjYy5fdG91Y2hlcywgZmFsc2UsIHRydWUpKSB7XHJcblx0XHRcdFx0aWYgKChjYy5zY2FsZU1vZGUgJiBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpID09PSBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpIHtcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXJbXSA9IFtNYXRoLmFicyhjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdIC0gY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSksIE1hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdKV0sXHJcblx0XHRcdFx0XHRcdGRpczogbnVtYmVyW10gPSBbTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRMZWZ0KSwgTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRUb3ApXSxcclxuXHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0ubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpIC8gMiAtIGNjLnRyYW5zW2lkeF0pLFxyXG5cdFx0XHRcdFx0XHRkOiBudW1iZXJbXSA9IFtkaXNbMF0gLyBpbmlkaXN0WzBdLCBkaXNbMV0gLyBpbmlkaXN0WzFdXS5tYXAoKHY6IG51bWJlcikgPT4gdiAqIGNjLnNjbFNwZWVkKSxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpICogKDEgLSBkW2lkeF0pKTtcclxuXHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkWzBdKSBjYy50cmFuc2xhdGUobnRvdWNoZXNbMF0pO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZFsxXSkgY2MudHJhbnNsYXRlKG50b3VjaGVzWzFdKTtcclxuXHRcdFx0XHRcdGNjLnNjYWxlKGRbMF0sIGRbMV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXIgPSBkaXN0KFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dKSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXIgPSBkaXN0KFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlciA9IGNjLnNjbFNwZWVkICogZGlzIC8gaW5pZGlzdCxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIpID0+IGkgKiAoMSAtIGQpKTtcclxuXHJcblx0XHRcdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWQuZXZlcnkoKHptOiBib29sZWFuKTogYm9vbGVhbiA9PiB6bSkpIGNjLnRyYW5zbGF0ZSguLi5udG91Y2hlcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGluaCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ01vYmlsZU1vdmVcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRpZiAoIWN1c3QpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSxcclxuXHRcdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0QXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgodDogVG91Y2gpID0+IGNjLl90b3VjaGVzW3QuaWRlbnRpZmllcl0gPSBbdC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdKTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgdG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcclxuXHRcdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMoY29vcmRzKSk7XHJcblx0XHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjYy5fdG91Y2hlc1tjYy5fdG91Y2hlcy5sZW5ndGggLSAxXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gdHJ1ZTtcclxuXHRcdH0gLy9kcmFnTW9iaWxlU3RhcnRcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVFbmQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdLFxyXG5cdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCB0b3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG5cdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEgJiYgRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhjYy5fdG91Y2hlcykubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGV2ZW50LCBjYywgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHdoZWVsKGV2ZW50OiBXaGVlbEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGxldCBkOiBudW1iZXIgPSAxIC0gY2Muc2NsU3BlZWQgKiBDb250cm9sbGFibGVDYW52YXMuZml4RGVsdGEoZXZlbnQuZGVsdGFNb2RlLCBldmVudC5kZWx0YVkpIC8gY2MubWluLFxyXG5cdFx0XHRcdGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0sIGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV1dO1xyXG5cdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgY2MudHJhbnNsYXRlKC4uLmNvb3Jkcy5tYXAoKGM6IG51bWJlcikgPT4gYyAqICgxIC0gZCkpKTtcclxuXHRcdH0gLy93aGVlbFxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogR2V0IHNjcmVlbi1lcXVpdmFsZW50IGNvb3JkaW5hdGVzIHRoYXQgYnlwYXNzIHRyYW5zZm9ybWF0aW9ucy5cclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cclxuXHRcdCAqL1xyXG5cdFx0Z2V0Q29vcmRzKCk6IG51bWJlcltdIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2Nvb3JkaW5hdGVzLm1hcCgoYzogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiAoYyAtIHRoaXMudHJhbnNbaWR4XSkgLyB0aGlzLnNjbFtpZHhdKTtcclxuXHRcdH0gLy9nZXRDb29yZHNcclxuXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGlzTW9iaWxlKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBvZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dpbmRvd3MgUGhvbmUvaSlcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vaXNNb2JpbGVcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgbGluZVRvUGl4KCk6IG51bWJlciB7XHJcblx0XHRcdGxldCByOiBudW1iZXIsXHJcblx0XHRcdFx0aWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcblx0XHRcdGlmcmFtZS5zcmMgPSAnIyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0bGV0IGl3aW46IFdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93LFxyXG5cdFx0XHRcdGlkb2M6IERvY3VtZW50ID0gaXdpbi5kb2N1bWVudDtcclxuXHRcdFx0aWRvYy5vcGVuKCk7XHJcblx0XHRcdGlkb2Mud3JpdGUoJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48cD5hPC9wPjwvYm9keT48L2h0bWw+Jyk7XHJcblx0XHRcdGlkb2MuY2xvc2UoKTtcclxuXHRcdFx0bGV0IHNwYW46IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50Pmlkb2MuYm9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxuXHRcdFx0ciA9IHNwYW4ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcblx0XHRcdHJldHVybiByO1xyXG5cdFx0fSAvL2xpbmVUb1BpeFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGZpeERlbHRhKG1vZGU6IG51bWJlciwgZGVsdGFZOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAobW9kZSA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggKiBkZWx0YVk7XHJcblx0XHRcdH0gZWxzZSBpZiAobW9kZSA9PT0gMikge1xyXG5cdFx0XHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGRlbHRhWTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2ZpeERlbHRhXHJcblx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIHRvIGNvbnRyb2wga2V5Ym9hcmQgZXZlbnRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIEtleUJpbmQge1xyXG5cdFx0cHJlc3M6IEtleVtdID0gW107XHJcblx0XHRkb3duOiBLZXlbXSA9IFtdO1xyXG5cdFx0dXA6IEtleVtdID0gW107XHJcblx0XHRlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHRcdF9ib3VuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWQ6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXA6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHt9O1xyXG5cclxuXHRcdHN0YXRpYyBfaWRjbnRyID0gMDtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZDogbnVtYmVyID0gNTtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZHVwOiBudW1iZXIgPSAuNTtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZE1heDogbnVtYmVyID0gMjA7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWR1cEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRzdGF0aWMgYXJyb3dCaW5kaW5nczoge1xyXG5cdFx0XHRba2V5OiBzdHJpbmddOiBudW1iZXJbXTtcclxuXHRcdH0gPSB7XHJcblx0XHRcdFx0QXJyb3dVcDogWzAsIDFdLFxyXG5cdFx0XHRcdEFycm93RG93bjogWzAsIC0xXSxcclxuXHRcdFx0XHRBcnJvd0xlZnQ6IFsxLCAwXSxcclxuXHRcdFx0XHRBcnJvd1JpZ2h0OiBbLTEsIDBdXHJcblx0XHRcdH07XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGJpbmQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMuYXJyb3dCaW5kaW5ncywgS2V5QmluZC5hcnJvd0JpbmRpbmdzKTtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWQ7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWR1cCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWR1cDtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZE1heCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWRNYXg7XHJcblx0XHRcdGJpbmQgJiYgdGhpcy5iaW5kKCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdHN0YXRpYyBhcnJvd01vdmUoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAodHlwZSA9PT0gXCJrZXlkb3duXCIpIHtcclxuXHRcdFx0XHRldmVudC50YXJnZXRbXCJfY2NfXCJdLnRyYW5zbGF0ZSh0aGlzLmFycm93TW92ZVNwZWVkICogdGhpcy5hcnJvd0JpbmRpbmdzW2V2ZW50LmtleV1bMF0sIHRoaXMuYXJyb3dNb3ZlU3BlZWQgKiB0aGlzLmFycm93QmluZGluZ3NbZXZlbnQua2V5XVsxXSk7XHJcblx0XHRcdFx0aWYgKHRoaXMuYXJyb3dNb3ZlU3BlZWR1cEVuYWJsZWQpIHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBib3VuZCh0aGlzLmFycm93TW92ZVNwZWVkICsgdGhpcy5hcnJvd01vdmVTcGVlZHVwLCAwLCB0aGlzLmFycm93TW92ZVNwZWVkTWF4KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkID0gS2V5QmluZC5hcnJvd01vdmVTcGVlZDtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vYXJyb3dNb3ZlXHJcblxyXG5cdFx0YmluZEFycm93cygpOiB2b2lkIHtcclxuXHRcdFx0Zm9yIChsZXQgaSBpbiB0aGlzLmFycm93QmluZGluZ3MpIHtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyS2V5ZG93bihpLCBLZXlCaW5kLmFycm93TW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyS2V5dXAoaSwgS2V5QmluZC5hcnJvd01vdmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5iaW5kQXJyb3dzID0gKCk6IHZvaWQgPT4geyB9O1xyXG5cdFx0fSAvL2JpbmRBcnJvd3NcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEJpbmQga2V5IGV2ZW50IGxpc3RlbmVyc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGJpbmQoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmICghdGhpcy5fYm91bmQpIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5cHJlc3NcIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleXVwXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleWRvd25cIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2JvdW5kID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vYmluZFxyXG5cclxuXHRcdF9oYW5kbGVyKHR5cGU6IHN0cmluZywgZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IGhhbmRsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdFx0dGhpc1t0eXBlLnJlcGxhY2UoXCJrZXlcIiwgJycpXS5mb3JFYWNoKChrZXk6IEtleSk6IHZvaWQgPT4ge1xyXG5cdFx0XHRcdGlmIChrZXkua2V5ID09PSBldmVudC5rZXkpIHtcclxuXHRcdFx0XHRcdGhhbmRsZWQgPSAha2V5LmNhbGxiYWNrKGV2ZW50LCB0eXBlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlZDtcclxuXHRcdH0gLy9faGFuZGxlclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5cHJlc3Moa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy5wcmVzcy5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcInByZXNzXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXlwcmVzc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXlkb3duKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMuZG93bi5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcImRvd25cIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleWRvd25cclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5dXAoa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy51cC5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcInVwXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXl1cFxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge0tleX0ga2V5XHJcblx0XHQgKi9cclxuXHRcdHVucmVnaXN0ZXIoa2V5OiBLZXkgfCBudW1iZXIgfCBzdHJpbmcsIHJlcGw6IEtleSk6IEtleSB8IEtleVtdIHwgYm9vbGVhbiB7XHJcblx0XHRcdGlmICh0eXBlb2Yga2V5ID09PSBcIm51bWJlclwiKSB7XHJcblx0XHRcdFx0bGV0IGlkeDogbnVtYmVyO1xyXG5cdFx0XHRcdGlmICgoaWR4ID0gdGhpcy5wcmVzcy5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMucHJlc3Muc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICgoaWR4ID0gdGhpcy5kb3duLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb3duLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoKGlkeCA9IHRoaXMudXAuZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnVwLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHR0aGlzLnByZXNzID0gdGhpcy5wcmVzcy5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdFx0dGhpcy5kb3duID0gdGhpcy5kb3duLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0XHR0aGlzLnVwID0gdGhpcy51cC5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXNba2V5LnR5cGVdLnNwbGljZSh0aGlzW2tleS50eXBlXS5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5LmlkKSwgMSwgcmVwbCk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy91bnJlZ2lzdGVyXHJcblx0fSAvL0tleUJpbmRcclxuXHJcblx0LyoqXHJcblx0ICogQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAbWVtYmVyb2YgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0ICogQHByb3Age251bWJlcn0geCAtIHggY29vcmRpbmF0ZVxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBkeCAtIHdpZHRoXHJcblx0ICogQHByb3Age251bWJlcn0gZHkgLSBoZWlnaHRcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBpbmRleCAtIGVxdWl2YWxlbnQgdG8gQ1NTIHotaW5kZXhcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ2FudmFzQnV0dG9uIGltcGxlbWVudHMgT3B0cy5DYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdHg6IG51bWJlciA9IDA7XHJcblx0XHR5OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHg6IG51bWJlciA9IDA7XHJcblx0XHRkeTogbnVtYmVyID0gMDtcclxuXHRcdGluZGV4OiBudW1iZXIgPSAtMTtcclxuXHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0X2lkOiBudW1iZXI7XHJcblx0XHRlbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcclxuXHRcdHBzdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cG9zaXRpb246IG51bWJlciA9IDI7XHJcblxyXG5cdFx0c3RhdGljIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuMztcclxuXHRcdHByaXZhdGUgc3RhdGljIF9pZGNudHI6IG51bWJlciA9IDA7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSB7XHJcblx0XHRcdHg6IDAsXHJcblx0XHRcdHk6IDAsXHJcblx0XHRcdGR4OiAwLFxyXG5cdFx0XHRkeTogMCxcclxuXHRcdFx0aW5kZXg6IC0xLFxyXG5cdFx0XHRwc3RhdGU6IGZhbHNlLFxyXG5cdFx0XHRlbmFibGVkOiB0cnVlLFxyXG5cdFx0XHRwb3NpdGlvbjogMixcclxuXHRcdFx0cGFyZW50OiBuZXcgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cykgeyAgLy9ET1VCTEVDTElDSywgTE9OR0NMSUNLLCBEUkFHLCAuLi4gVVNFUi1JTVBMRU1FTlRFRCg/KVxyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cyk7XHJcblxyXG5cdFx0XHRpZiAoW29wdHMueCwgb3B0cy55LCBvcHRzLmR4LCBvcHRzLmR5LCBvcHRzLnBvc2l0aW9uLCBvcHRzLmluZGV4XS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnggPSBvcHRzLnggKiAxO1xyXG5cdFx0XHR0aGlzLnkgPSBvcHRzLnkgKiAxO1xyXG5cdFx0XHR0aGlzLmR4ID0gb3B0cy5keCAqIDE7XHJcblx0XHRcdHRoaXMuZHkgPSBvcHRzLmR5ICogMTtcclxuXHRcdFx0dGhpcy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfCAwO1xyXG5cdFx0XHR0aGlzLmluZGV4ID0gb3B0cy5pbmRleCB8IDA7XHJcblx0XHRcdHRoaXMuZW5hYmxlZCA9ICEhb3B0cy5lbmFibGVkO1xyXG5cdFx0XHR0aGlzLl9pZCA9IENhbnZhc0J1dHRvbi5faWRjbnRyKys7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGV4aXRlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRibHVyKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vYmx1clxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZW50ZXJlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRmb2N1cyguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9mb2N1c1xyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgY2xpY2tlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRjbGljayguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2NsaWNrXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBhYm92ZSB0aGUgd2lkZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcltdfSByZWxhdGl2ZUNvb3Jkc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRfaXNPbihyZWxhdGl2ZUNvb3JkczogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy54IC0gdGhpcy5wYXJlbnQudHJhbnNbMF0pIC8gdGhpcy5wYXJlbnQuc2NsWzBdIDogdGhpcy54LFxyXG5cdFx0XHRcdHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy55IC0gdGhpcy5wYXJlbnQudHJhbnNbMV0pIC8gdGhpcy5wYXJlbnQuc2NsWzFdIDogdGhpcy55LFxyXG5cdFx0XHRcdGR4OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHggLyB0aGlzLnBhcmVudC5zY2xbMF0gOiB0aGlzLmR4LFxyXG5cdFx0XHRcdGR5OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHkgLyB0aGlzLnBhcmVudC5zY2xbMV0gOiB0aGlzLmR5LFxyXG5cdFx0XHRcdG91dDogYm9vbGVhbiA9IGlzV2l0aGluKFt4LCB5LCBkeCwgZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSwgQ2FudmFzQnV0dG9uLnNlbnNpdGl2aXR5KTtcclxuXHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL19pc09uXHJcblx0fSAvL0NhbnZhc0J1dHRvblxyXG5cclxuXHRDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uID0gQ2FudmFzQnV0dG9uO1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIG9mZmVyaW5nIG1hdGhlbWF0aWNhbCBWZWN0b3IgdXRpbGl0aWVzXHJcblx0ICogQGlubmVyXHJcblx0ICogQGNsYXNzXHJcblx0ICogQHByb3Age251bWJlcltdfSBwcm9wcyAtIHZlY3RvciB2ZXJ0aWNlc1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBWZWN0b3Ige1xyXG5cdFx0cHJvcHM6IG51bWJlcltdO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHByb3BzOiBudW1iZXJbXSA9IFtdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHR9IC8vVmVjdG9yXHJcblxyXG5cdC8qKlxyXG5cdCAqIEBwcm9wIHtIVE1MRWxlbWVudFtdfSByZXNvdXJjZXMgLSBBbGwgSFRNTCByZXNvdXJjZSBlbGVtZW50cyB3aXRoIFwibG9hZFwiIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgbG9hZGVkLiBsaWtlOiBhdWRpby9pbWdcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0cmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcblx0XHRcdFx0aW1nLnNyYyA9IHVybDtcclxuXHRcdFx0XHRpbWdsaXN0LnB1c2goaW1nKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcihpbWdsaXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9pbWFnZXNcclxuXHRcdC8qKlxyXG5cdFx0ICogTG9hZCBhdWRpbyBieSBVUkxzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ1tdfSB1cmxpc3QgLSBsaXN0IG9mIHVybHNcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IG9ubG9hZCAtIGNhbGxiYWNrXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9iaW5kPXRydWUgLSBhdXRvIGJpbmRcclxuXHRcdCAqIEByZXR1cm5zIHtSZXNvdXJjZUxvYWRlcn0gdGhlIGxvYWRlclxyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgYXVkaW9zKHVybGlzdDogc3RyaW5nW10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSB0cnVlKTogUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0XHRsZXQgYXVkaW9saXN0OiBIVE1MQXVkaW9FbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgYXVkaW8gPSBuZXcgQXVkaW8odXJsKTtcclxuXHRcdFx0XHRhdWRpby5sb2FkKCk7XHJcblx0XHRcdFx0YXVkaW9saXN0LnB1c2goYXVkaW8pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGF1ZGlvbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vYXVkaW9zXHJcblx0fSAvL1Jlc291cmNlTG9hZGVyXHJcblxyXG59IC8vQ2FudmFzQ29udHJvbHNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENhbnZhc0NvbnRyb2xzLkNvbnRyb2xsYWJsZUNhbnZhcztcclxuIl19