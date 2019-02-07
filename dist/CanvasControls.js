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
            UseButton[UseButton["USEWHEEL"] = 4] = "USEWHEEL";
            UseButton[UseButton["USEALL"] = 7] = "USEALL";
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
        Errors.ENOCCANV = new ReferenceError("Not a ControlableCanvas element.");
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
                this.scl = [block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
                return this.scl;
            }
            else {
                this._zoomChanged = [this.scl[0] !== bound(this.scl[0], this.sclBounds[0], this.sclBounds[2]), this.scl[1] !== bound(this.scl[1], this.sclBounds[1], this.sclBounds[3])];
                this.scl = this.scl.map((scl, idx) => bound(scl * by[idx], this.sclBounds[idx], this.sclBounds[idx + 2]));
                return this.scl;
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
                    butt.enabled && butt._isOn(coords) && (ret = butt.click(coords, event));
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
            /*if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
                return;
            }*/
            if (cc._pressed)
                cc._clktime = 0;
            if ((event.buttons & cc.useButton) !== event.buttons) {
                return;
            }
            if (cc._pressed) {
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
                    cc.scale(d[0], d[1]);
                    if (cc._zoomChanged[0])
                        cc.translate(ntouches[0]);
                    if (cc._zoomChanged[1])
                        cc.translate(ntouches[1]);
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
                    butt.enabled && butt._isOn(coords) && (ret = butt.click(coords, event));
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
        _forceDragPC() {
            let fake = new MouseEvent("mousemove", {
                view: window,
                bubbles: true,
                cancelable: false,
                clientX: this._coordinates[0] + this.target.offsetLeft,
                clientY: this._coordinates[1] + this.target.offsetTop,
                buttons: this.useButton,
                //@ts-ignore
                movementX: 0,
                //@ts-ignore
                movementY: 0
            });
            this.target.dispatchEvent(fake);
        } //_forceDragPC
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
                event.target["_cc_"]._forceDragPC();
                if (this.arrowMoveSpeedupEnabled)
                    this.arrowMoveSpeed = bound(this.arrowMoveSpeed + this.arrowMoveSpeedup, 0, this.arrowMoveSpeedMax);
            }
            else {
                this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
            }
            return false;
        } //arrowMove
        bindArrows() {
            if (!this.element["_cc_"])
                throw Errors.ENOCCANV;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUdIOztHQUVHO0FBRUgsWUFBWSxDQUFDOztBQUNiLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBRUg7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0F5bUMzQjtBQXptQ0QsV0FBYyxjQUFjO0lBSTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBZ0IsT0FBTyxDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsWUFBc0IsQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLElBQVksRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakssS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDbkIsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxTQUFTO0lBTkssc0JBQU8sVUFNdEIsQ0FBQTtJQUNEOzs7Ozs7Ozs7T0FTRztJQUNILFNBQWdCLEtBQUssQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFZLENBQUM7UUFDbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxPQUFPO0lBRk8sb0JBQUssUUFFcEIsQ0FBQTtJQUNEOzs7Ozs7O09BT0c7SUFDSCxTQUFnQixLQUFL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Q0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNMLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xKLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNoQjtpQkFBTTtnQkFDTixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxD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LGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3pQLEdBQUcsR0FBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUMzTixRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDMVIsQ0FBQyxHQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUM1RixRQUFRLEdBQWEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVqRixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckIsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2xEO3FCQUFNO29CQUNOLFlBQVk7b0JBQ1osSUFBSSxPQUFPLEdBQVcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3pPLEdBQUcsR0FBVyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUNoUCxRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDMVIsQ0FBQyxHQUFXLEVBQUUsQ0FBQyxRQUFRLEdBQUcsR0FBRyxHQUFHLE9BQU8sRUFDdkMsUUFBUSxHQUFhLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUUvRCxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNaLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFXLEVBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7aUJBQ25GO2dCQUNELEdBQUcsRUFBRSxDQUFDO2FBQ047WUFFRCxFQUFFLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztRQUMxQixDQUFDLENBQUMsZ0JBQWdCO1FBQ1YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFpQixFQUFFLEVBQXNCLEVBQUUsT0FBZ0IsS0FBSztZQUM5RixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFdkIsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDVixJQUFJLE1BQWdCLEVBQ25CLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFlLEVBQUUsQ0FBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDbEksR0FBRyxHQUFZLEtBQUssQ0FBQztnQkFFdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBRXhKLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtvQkFDdkMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUU3SSxLQUFLLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTt3QkFDeEIsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ3JHLElBQUksR0FBRzs0QkFBRSxNQUFNO3FCQUNmO2lCQUNEO2FBQ0Q7WUFFRCxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDN0IsRUFBRSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3pCLEVBQUUsQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzthQUN0RDtpQkFBTTtnQkFDTixFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQzthQUNoQjtZQUVELEVBQUUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxpQkFBaUI7UUFDWCxNQUFNLENBQUMsYUFBYSxDQUFDLEtBQWlCLEVBQUUsRUFBc0I7WUFDckUsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRXZCLElBQUksTUFBZ0IsRUFDbkIsTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWUsRUFBRSxDQUFlLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUNsSSxHQUFHLEdBQVksS0FBSyxDQUFDO1lBRXRCLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtnQkFDdkMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU3SSxLQUFLLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTtvQkFDeEIsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUNuQzthQUNEO1lBRUQsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLGdCQUFnQixFQUFFO2dCQUNoRixLQUFLLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTtvQkFDeEIsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3hFLElBQUksR0FBRzt3QkFBRSxNQUFNO2lCQUNmO2dCQUVELEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2FBQ2hCO1lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUU7Z0JBQ3JELEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQ3pDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDcEMsQ0FBQyxDQUFDLGVBQWU7UUFFVCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQWlCLEVBQUUsRUFBc0I7WUFDN0QsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxHQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUNwRyxNQUFNLEdBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUgsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNaLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFXLEVBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsSCxDQUFDLENBQUMsT0FBTztRQUdULFlBQVk7WUFDWCxJQUFJLElBQUksR0FBZSxJQUFJLFVBQVUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ2xELElBQUksRUFBRSxNQUFNO2dCQUNaLE9BQU8sRUFBRSxJQUFJO2dCQUNiLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVU7Z0JBQ3RELE9BQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUztnQkFDckQsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN2QixZQUFZO2dCQUNaLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFlBQVk7Z0JBQ1osU0FBUyxFQUFFLENBQUM7YUFDWixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsY0FBYztRQUVoQjs7OztXQUlHO1FBQ0gsU0FBUztZQUNSLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLENBQUMsQ0FBQyxXQUFXO1FBR0wsTUFBTSxLQUFLLFFBQVE7WUFDMUIsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7bUJBQzVFLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQzttQkFDMUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFDL0g7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7YUFDWjtpQkFBTTtnQkFDTixPQUFPLEtBQUssQ0FBQzthQUNiO1FBQ0YsQ0FBQyxDQUFDLFVBQVU7UUFFSixNQUFNLEtBQUssU0FBUztZQUMzQixJQUFJLENBQVMsRUFDWixNQUFNLEdBQXNCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDakIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsSUFBSSxJQUFJLEdBQVcsTUFBTSxDQUFDLGFBQWEsRUFDdEMsSUFBSSxHQUFhLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDaEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyxnRUFBZ0UsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNiLElBQUksSUFBSSxHQUE2QixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQ2pFLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3RCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQyxDQUFDLFdBQVc7UUFFTCxNQUFNLENBQUMsUUFBUSxDQUFDLElBQVksRUFBRSxNQUFjO1lBQ25ELElBQUksSUFBSSxLQUFLLENBQUMsRUFBRTtnQkFDZixPQUFPLGtCQUFrQixDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7YUFDNUM7aUJBQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUM7YUFDMUI7aUJBQU07Z0JBQ04sT0FBTyxNQUFNLENBQUM7YUFDZDtRQUNGLENBQUMsQ0FBQyxVQUFVO01BQ1gsb0JBQW9CO0lBcGROLDJCQUFRLEdBQVcsRUFBRSxDQUFDO0lBRXJDOzs7O09BSUc7SUFDSSw4QkFBVyxHQUFtQztRQUNwRCxNQUFNLEVBQUUsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2IsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNYLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLFlBQVksRUFBRSxLQUFLO1FBQ25CLFlBQVksRUFBRSxLQUFLO1FBQ25CLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLFdBQVcsRUFBRSxLQUFLO1FBQ2xCLGNBQWMsRUFBRSxLQUFLO1FBQ3JCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsU0FBUyxFQUFFLENBQUM7UUFDWixTQUFTLEVBQUUsQ0FBQztRQUNaLFVBQVUsRUFBRSxDQUFDO1FBQ2IsUUFBUSxFQUFFLENBQUM7UUFDWCxnQkFBZ0IsRUFBRSxHQUFHO1FBQ3JCLGdCQUFnQixFQUFFLEdBQUc7UUFDckIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ3JDLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDdkQsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLEtBQUs7WUFDWCxLQUFLLEVBQUUsS0FBSztZQUNaLEtBQUssRUFBRSxLQUFLO1lBQ1osR0FBRyxFQUFFLEtBQUs7WUFDVixJQUFJLEVBQUUsS0FBSztZQUNYLEtBQUssRUFBRSxLQUFLO1NBQ1o7UUFDRCxLQUFLLEVBQUUsSUFBSSxHQUFHLEVBQUU7S0FDaEIsQ0FBQztJQXBFVSxpQ0FBa0IscUJBb2Y5QixDQUFBO0lBRUQ7O09BRUc7SUFDSCxNQUFhLE9BQU87UUE0Qm5CLFlBQVksT0FBb0IsRUFBRSxPQUFnQixLQUFLO1lBM0J2RCxVQUFLLEdBQVUsRUFBRSxDQUFDO1lBQ2xCLFNBQUksR0FBVSxFQUFFLENBQUM7WUFDakIsT0FBRSxHQUFVLEVBQUUsQ0FBQztZQUVmLFdBQU0sR0FBWSxLQUFLLENBQUM7WUFJeEIsNEJBQXVCLEdBQVksSUFBSSxDQUFDO1lBQ3hDLGtCQUFhLEdBRVQsRUFBRSxDQUFDO1lBaUJOLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDakQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztZQUNuRCxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxNQUFNO1FBRVIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFvQixFQUFFLElBQVk7WUFDbEQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUN2QixLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0ksS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxJQUFJLENBQUMsdUJBQXVCO29CQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN0STtpQkFBTTtnQkFDTixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7YUFDN0M7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUMsQ0FBQyxXQUFXO1FBRWIsVUFBVTtZQUNULElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFBRSxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDakQsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNqQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQ3BEO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLFlBQVk7UUFFZDs7OztXQUlHO1FBQ0gsSUFBSTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQW9CLEVBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDakksSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFvQixFQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNILElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBb0IsRUFBVyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMvSCxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2FBQzFCO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDLENBQUMsTUFBTTtRQUVSLFFBQVEsQ0FBQyxJQUFZLEVBQUUsS0FBb0I7WUFDMUMsSUFBSSxPQUFPLEdBQVksS0FBSyxDQUFDO1lBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQVEsRUFBUSxFQUFFO2dCQUN4RCxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssS0FBSyxDQUFDLEdBQUcsRUFBRTtvQkFDMUIsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3JDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDLENBQUMsVUFBVTtRQUVaOzs7OztXQUtHO1FBQ0gsZ0JBQWdCLENBQUMsR0FBVyxFQUFFLFFBQXlEO1lBQ3RGLElBQUksR0FBUSxDQUFDO1lBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDOUYsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUMsa0JBQWtCO1FBQ3BCOzs7OztXQUtHO1FBQ0gsZUFBZSxDQUFDLEdBQVcsRUFBRSxRQUF5RDtZQUNyRixJQUFJLEdBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzVGLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDLGlCQUFpQjtRQUNuQjs7Ozs7V0FLRztRQUNILGFBQWEsQ0FBQyxHQUFXLEVBQUUsUUFBeUQ7WUFDbkYsSUFBSSxHQUFRLENBQUM7WUFDYixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN4RixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQyxlQUFlO1FBQ2pCOzs7V0FHRztRQUNILFVBQVUsQ0FBQyxHQUEwQixFQUFFLElBQVM7WUFDL0MsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7Z0JBQzVCLElBQUksR0FBVyxDQUFDO2dCQUNoQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUN6RSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3ZDO3FCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFNLEVBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9FLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDdEM7cUJBQU0sSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQU0sRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDN0UsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNwQztxQkFBTTtvQkFDTixPQUFPLEtBQUssQ0FBQztpQkFDYjthQUNEO2lCQUFNLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO2dCQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2FBQzdEO2lCQUFNO2dCQUNOLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFNLEVBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUN0RztRQUNGLENBQUMsQ0FBQyxZQUFZO01BQ2IsU0FBUztJQTdISCxlQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ1osc0JBQWMsR0FBVyxDQUFDLENBQUM7SUFDM0Isd0JBQWdCLEdBQVcsRUFBRSxDQUFDO0lBQzlCLHlCQUFpQixHQUFXLEVBQUUsQ0FBQztJQUUvQixxQkFBYSxHQUVoQjtRQUNGLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDZixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQixVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDbkIsQ0FBQztJQTFCUyxzQkFBTyxVQTJJbkIsQ0FBQTtJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsTUFBYSxZQUFZO1FBK0J4QixZQUFZLE9BQWlDLFlBQVksQ0FBQyxXQUFXO1lBOUJyRSxNQUFDLEdBQVcsQ0FBQyxDQUFDO1lBQ2QsTUFBQyxHQUFXLENBQUMsQ0FBQztZQUNkLE9BQUUsR0FBVyxDQUFDLENBQUM7WUFDZixPQUFFLEdBQVcsQ0FBQyxDQUFDO1lBQ2YsVUFBSyxHQUFXLENBQUMsQ0FBQyxDQUFDO1lBR25CLFlBQU8sR0FBWSxJQUFJLENBQUM7WUFDeEIsV0FBTSxHQUFZLEtBQUssQ0FBQztZQUN4QixhQUFRLEdBQVcsQ0FBQyxDQUFDO1lBc0JwQixPQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFRLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQy9HLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQzthQUNyQjtZQUVELElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDOUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsQ0FBQyxDQUFDLE1BQU07UUFFUixXQUFXO1FBQ1g7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLEdBQUcsR0FBVTtZQUNqQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxNQUFNO1FBQ1IsV0FBVztRQUNYOzs7V0FHRztRQUNILEtBQUssQ0FBQyxHQUFHLEdBQVU7WUFDbEIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDLENBQUMsT0FBTztRQUNULFdBQVc7UUFDWDs7O1dBR0c7UUFDSCxLQUFLLENBQUMsR0FBRyxHQUFVO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLE9BQU87UUFFVDs7OztXQUlHO1FBQ0gsS0FBSyxDQUFDLGNBQXdCO1lBQzdCLElBQUksQ0FBQyxHQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDNUksQ0FBQyxHQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDekksRUFBRSxHQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUM3SCxFQUFFLEdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQzdILEdBQUcsR0FBWSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFM0csSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQzthQUNwQjtZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDLE9BQU87TUFDUixjQUFjO0lBaEZSLHdCQUFXLEdBQVcsRUFBRSxDQUFDO0lBQ2pCLG9CQUFPLEdBQVcsQ0FBQyxDQUFDO0lBQ25DOzs7O09BSUc7SUFDSSx3QkFBVyxHQUE2QjtRQUM5QyxDQUFDLEVBQUUsQ0FBQztRQUNKLENBQUMsRUFBRSxDQUFDO1FBQ0osRUFBRSxFQUFFLENBQUM7UUFDTCxFQUFFLEVBQUUsQ0FBQztRQUNMLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDVCxNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLENBQUM7UUFDWCxNQUFNLEVBQUUsSUFBSSxrQkFBa0I7S0FDOUIsQ0FBQztJQTdCVSwyQkFBWSxlQTRGeEIsQ0FBQTtJQUVELGtCQUFrQixDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7SUFFL0M7Ozs7O09BS0c7SUFDSCxNQUFhLE1BQU07UUFHbEIsWUFBWSxRQUFrQixFQUFFO1lBQy9CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLE1BQU07UUFFUjs7Ozs7O1dBTUc7UUFDSCxHQUFHLENBQUMsSUFBcUIsRUFBRSxNQUFjLENBQUM7WUFDekMsSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO2dCQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQyxDQUFDLENBQUMsQ0FBQzthQUNIO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBWSxFQUFFLEdBQVcsRUFBRSxFQUFFO29CQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLENBQUMsQ0FBQyxDQUFDO2FBQ0g7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxLQUFLO1FBQ1A7Ozs7OztXQU1HO1FBQ0gsSUFBSSxDQUFDLElBQXFCLEVBQUUsTUFBYyxDQUFDO1lBQzFDLElBQUksSUFBSSxZQUFZLE1BQU0sRUFBRTtnQkFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7aUJBQU07Z0JBQ04sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxNQUFNO1FBQ1I7Ozs7O1dBS0c7UUFDSCxHQUFHLENBQUMsSUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RixDQUFDLENBQUMsS0FBSztLQUNQLENBQUMsUUFBUTtJQXRERyxxQkFBTSxTQXNEbEIsQ0FBQTtJQUVEOztPQUVHO0lBQ0gsTUFBYSxjQUFjO1FBSTFCLFlBQVksU0FBd0IsRUFBRSxNQUFtRCxFQUFFLFdBQW9CLEtBQUs7WUFIcEgsY0FBUyxHQUFrQixFQUFFLENBQUM7WUFDOUIsY0FBUyxHQUFXLENBQUMsQ0FBQztZQUdyQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztZQUNoQyxJQUFJLFFBQVE7Z0JBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLE1BQU07UUFFUjs7O1dBR0c7UUFDSCxJQUFJLENBQUMsTUFBa0Q7WUFDdEQsSUFBSSxNQUFNO2dCQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1lBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBZ0IsRUFBRSxFQUFFO2dCQUMzQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEdBQVMsRUFBRTtvQkFDdkMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7d0JBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDL0I7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxNQUFNO1FBQ1IsV0FBVztRQUNYLElBQUksQ0FBQyxHQUFpQixFQUFFLElBQWEsSUFBVSxDQUFDLENBQUMsTUFBTTtRQUV2RDs7Ozs7Ozs7V0FRRztRQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZ0IsRUFBRSxNQUFtRCxFQUFFLFdBQW9CLElBQUk7WUFDNUcsSUFBSSxPQUFPLEdBQXVCLEVBQUUsQ0FBQztZQUVyQyxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNsQjtZQUVELE9BQU8sSUFBSSxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsUUFBUTtRQUNWOzs7Ozs7OztXQVFHO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFnQixFQUFFLE1BQW1ELEVBQUUsV0FBb0IsSUFBSTtZQUM1RyxJQUFJLFNBQVMsR0FBdUIsRUFBRSxDQUFDO1lBRXZDLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2dCQUN2QixJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEI7WUFFRCxPQUFPLElBQUksY0FBYyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLFFBQVE7S0FDVixDQUFDLGdCQUFnQjtJQW5FTCw2QkFBYyxpQkFtRTFCLENBQUE7QUFFRixDQUFDLEVBem1DYSxjQUFjLEdBQWQsc0JBQWMsS0FBZCxzQkFBYyxRQXltQzNCLENBQUMsZ0JBQWdCO0FBRWxCLGtCQUFlLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIEFuZ2xlIGJldHdlZW4gMyBwb2lucyAoUmFkaWFucyk6XHJcbiAqIHBjOiBjZW50ZXIvcG9sZVxyXG4gKiBwbjogcG9pbnQgbmV3IGNvb3JkaW5hdGVzXHJcbiAqIHBwOiBwb2ludCBwYXN0IGNvb3JkaW5hdGVzXHJcbiAqIFxyXG4gKiBhdGFuMihwbnkgLSBwY3ksIHBueCAtIHBjeCkgLSBhdGFuMihwcHkgLSBwY3ksIHBweCAtIHBjeClcclxuICovXHJcblxyXG5cclxuLypcclxuICogY2VudGVyZWQgem9vbSBicmVha3Mgd2l0aCB0cmFuc0JvdW5kcyAtIG5vcm1hbC9hY2NlcHRhYmxlXHJcbiAqL1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbmltcG9ydCBcIkBiYWJlbC9wb2x5ZmlsbFwiO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIENhbnZhc0NvbnRyb2xzLnRzXHJcbiAqIEBjb3B5cmlnaHQgVmFsZW4uIEguIDJrMThcclxuICogQGF1dGhvciBWYWxlbi5ILiA8YWx0ZXJuYXRpdmV4eHh5QGdtYWlsLmNvbT5cclxuICovXHJcblxyXG4vKipcclxuICogVGhlIHJvb3Qgb2YgdGhlIG1haW4gbGlicmFyeVxyXG4gKiBAbW9kdWxlIENhbnZhc0NvbnRyb2xzXHJcbiAqIEBsaWNlbnNlIElTQ1xyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG5leHBvcnQgbW9kdWxlIENhbnZhc0NvbnRyb2xzIHtcclxuXHJcblx0dHlwZSBDbGFzcyA9IHsgbmV3KC4uLmFyZ3M6IGFueVtdKTogYW55OyB9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJZiBgZGVzdGAgbGFja3MgYSBwcm9wZXJ0eSB0aGF0IGB0YXJnYCBoYXMgdGhlbiB0aGF0IHByb3BlcnR5IGlzIGNvcGllZCBpbnRvIGBkZXN0YFxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0IC0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICogQHBhcmFtIHtvYmplY3R9IHRhcmcgLSBiYXNlIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmRpdGlvbiAtIGluaGVyaXRhbmNlIGNvbmRpdGlvblxyXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBpbmhlcml0KGRlc3Q6IHt9LCB0YXJnOiB7fSwgY29uZGl0aW9uOiBGdW5jdGlvbiA9IChkZXN0OiB7fSwgdGFyZzoge30sIHByb3A6IHN0cmluZyk6IGFueSA9PiBkZXN0W3Byb3BdID09PSB1bmRlZmluZWQgJiYgKGRlc3RbcHJvcF0gPSB0YXJnW3Byb3BdKSk6IHt9IHtcclxuXHRcdGZvciAobGV0IGkgaW4gdGFyZykge1xyXG5cdFx0XHRjb25kaXRpb24oZGVzdCwgdGFyZywgaSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlc3Q7XHJcblx0fSAvL2luaGVyaXRcclxuXHQvKipcclxuXHQgKiBSZXN0cmljdCBudW1iZXIncyByYW5nZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gdGFyZ2V0IG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gTSAtIG1heGltdW0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHA9MCAtIHByZWNpc2lvblxyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGJvdW5kIG51bWJlclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBib3VuZChuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBwOiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBuID4gTSArIHAgPyBNIDogKG4gPCBtIC0gcCA/IG0gOiBuKTtcclxuXHR9IC8vYm91bmRcclxuXHQvKipcclxuXHQgKiBEb3duc3BlZWQgaW5jcmVtZW50YXRpb25cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbiAtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gTWF4aW11bVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBvcCAtIG9wZXJhdGlvblxyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IG5cclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gYmxvY2sobjogbnVtYmVyLCBtOiBudW1iZXIsIE06IG51bWJlciwgb3A6IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRpZiAobiA+IE0gJiYgb3AgPiAwKSB7XHJcblx0XHRcdHJldHVybiBuO1xyXG5cdFx0fSBlbHNlIGlmIChuID4gTSkge1xyXG5cdFx0XHRyZXR1cm4gbiArIG9wO1xyXG5cdFx0fSBlbHNlIGlmIChuIDwgbSAmJiBvcCA8IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gbiArIG9wO1xyXG5cdFx0fVxyXG5cdH0gLy9ibG9ja1xyXG5cdC8qKlxyXG5cdCAqIENhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWHMgLSBYIGNvb3JkaW5hdGVzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWXMgLSBZIGNvb3JkaW5hdGVzXHJcblx0ICogQHJldHVybnMge251bWJlcn0gZGlzdGFuY2VcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gZGlzdChYczogbnVtYmVyW10sIFlzOiBudW1iZXJbXSk6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFtYc1sxXSAtIFhzWzBdLCBZc1sxXSAtIFlzWzBdXS5tYXAoKHY6IG51bWJlcikgPT4gTWF0aC5wb3codiwgMikpLnJlZHVjZSgoYWNjOiBudW1iZXIsIHY6IG51bWJlcikgPT4gYWNjICsgdikpO1xyXG5cdH0gLy9kaXN0XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgaW5zaWRlIGFuIGFyZWFcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBib3ggLSB4LHksZHgsZHlcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBwb2ludCAtIHgseVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzZW5zaXRpdml0eSAtIGV4dHJhIGJvdW5kYXJ5XHJcblx0ICogQHJldHVybnMgYm9vbGVhblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBpc1dpdGhpbihib3g6IG51bWJlcltdLCBwb2ludDogbnVtYmVyW10sIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNSk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIGJveFswXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzBdICYmIGJveFswXSArIGJveFsyXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzBdICYmIGJveFsxXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzFdICYmIGJveFsxXSArIGJveFszXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzFdO1xyXG5cdH0gLy9pc1dpdGhpblxyXG5cclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIE9wdGlvbnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBPcHRzIHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQSB3cmFwcGVyIGZvciB0aGUgdGFyZ2V0ZWQgY2FudmFzIGVsZW1lbnRcclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gdHJhbnM9MCwwIC0gVHJhbnNsYXRpb25cclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSBzY2w9MSwxIC0gU2NhbGluZ1xyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHJvdD0wLDAgLSBSb3RhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFuc0JvdW5kPS1JbmZpbml0eSwtSW5maW5pdHksSW5maW5pdHksSW5maW5pdHkgLSBNYXggdHJhbnNsYXRpb24gYm91bmRhcmllc1xyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IGR5bmFtaWNUcmFuc0JvdW5kcz10cnVlIC0gdHJhbnNCb3VuZHMgZGVwZW5kIG9uIHNjYWxpbmdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IGtleXNFbmFibGVkPWZhbHNlIC0gRW5hYmxlIGtleWFib3JkIGV2ZW50cyBsaXN0ZW5lclxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0XHQgKiBAbWVtYmVyIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRcdHRyYW5zPzogbnVtYmVyW107XHJcblx0XHRcdHNjbD86IG51bWJlcltdO1xyXG5cdFx0XHRkcmFnRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBpbmNoRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHdoZWVsRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdGtleXNFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cGFuRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHRpbHRFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VCdXR0b24/OiBudW1iZXI7XHJcblx0XHRcdHNjYWxlTW9kZT86IG51bWJlcjtcclxuXHRcdFx0dHJhbnNCb3VuZHM/OiBudW1iZXJbXTtcclxuXHRcdFx0c2NsQm91bmRzPzogbnVtYmVyW107XHJcblx0XHRcdHRyYW5zU3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdGR5bmFtaWNUcmFuc0JvdW5kcz86IGJvb2xlYW47XHJcblx0XHRcdHNjbFNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRfYWRhcHRzPzogQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRcdHdnZXRzPzogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBNOiBtb2JpbGVcclxuXHRcdCAqIFA6IHBjXHJcblx0XHQgKiBNUDogYm90aFxyXG5cdFx0ICogXHJcblx0XHQgKiBkcmFnOlxyXG5cdFx0ICpcdFA6IG1vdXNlICBob2xkICYgbW92ZVxyXG5cdFx0ICpcdE06IHRvdWNoICBob2xkICYgbW92ZVxyXG5cdFx0ICogcGluY2g6XHJcblx0XHQgKlx0dG91Y2ggIDItZmluZ2VyICYgbW92ZVxyXG5cdFx0ICogd2hlZWw6XHJcblx0XHQgKlx0d2hlZWwgIG1vdmUgIFtwYyBwaW5jaC1lcXVpdmFsZW50XVxyXG5cdFx0ICogcGFuOlxyXG5cdFx0ICpcdGRpc3Bvc2l0aW9uIGZyb20gY2VudGVyIGNhdXNlcyBjb25zdGFudCB0cmFuc2xhdGlvblxyXG5cdFx0ICogdGlsdDpcclxuXHRcdCAqXHRkZXZpY2Vtb3Rpb24gIGNhdXNlcyBwYW5uaW5nKlxyXG5cdFx0ICpcdFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycyB7XHJcblx0XHRcdGRyYWc6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0cGluY2g/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0d2hlZWw/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL1BcclxuXHRcdFx0cGFuOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHRpbHQ/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdGNsaWNrOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnNcclxuXHRcdC8qKlxyXG5cdFx0ICogT3B0aW9ucyBvZiBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geCAtIHggY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR4IC0gd2lkZ2V0IHdpZHRoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR5IC0gd2lkZ2V0IGhlaWdodFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBpbmRleCAtIHdpZGdldCBldmVudCBwcmlvcml0eVxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHRcdHg6IG51bWJlcjtcclxuXHRcdFx0eTogbnVtYmVyO1xyXG5cdFx0XHRkeDogbnVtYmVyO1xyXG5cdFx0XHRkeTogbnVtYmVyO1xyXG5cdFx0XHRpbmRleD86IG51bWJlcjtcclxuXHRcdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRcdGVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwb3NpdGlvbj86IG51bWJlcjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9DYW52YXNCdXR0b25PcHRpb25zXHJcblxyXG5cdFx0ZXhwb3J0IGVudW0gVXNlQnV0dG9uIHtcclxuXHRcdFx0VVNFTEVGVCA9IDEsIFVTRVJJR0hULCBVU0VCT1RILCBVU0VXSEVFTCwgVVNFQUxMID0gN1xyXG5cdFx0fSAvL1VzZUJ1dHRvblxyXG5cdFx0ZXhwb3J0IGVudW0gU2NhbGVNb2RlIHtcclxuXHRcdFx0Tk9STUFMID0gMSwgRlJFRVNDQUxFXHJcblx0XHR9IC8vU2NhbGVNb2RlXHJcblx0XHRleHBvcnQgZW51bSBQb3NpdGlvbiB7XHJcblx0XHRcdEZJWEVEID0gMSwgQUJTT0xVVEUsIFVOU0NBTEFCTEUgPSA0XHJcblx0XHR9IC8vUG9zaXRpb25cclxuXHR9IC8vT3B0c1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIGVycm9yc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVycm9ycyB7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENBTlY6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gSFRNTENhbnZhc0VsZW1lbnQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDVFg6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU1BUlIyOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEFycmF5IG9mIDItYXQtbGVhc3QgTnVtYmVycy5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTTogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIHZhbGlkIE51bWJlci5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRUlTQUxSOiBSZWZlcmVuY2VFcnJvciA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk9iamVjdCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT0NDQU5WOiBSZWZlcmVuY2VFcnJvciA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk5vdCBhIENvbnRyb2xhYmxlQ2FudmFzIGVsZW1lbnQuXCIpO1xyXG5cdH0gLy9FcnJvcnNcclxuXHJcblx0LyoqXHJcblx0ICogVHlwZSBvZiBLZXlCaW5kXHJcblx0ICovXHJcblx0ZXhwb3J0IHR5cGUgS2V5ID0ge1xyXG5cdFx0a2V5OiBzdHJpbmc7XHJcblx0XHRjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW47XHJcblx0XHRpZDogbnVtYmVyO1xyXG5cdFx0dHlwZTogc3RyaW5nO1xyXG5cdH07XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdCAqIEBjbGFzc1xyXG5cdCAqIEBpbXBsZW1lbnRzIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnN9XHJcblx0ICogQHByb3Age0hUTUxDYW52YXNFbGVtZW50fSB0YXJnZXQ9Zmlyc3RDYW52T2NjdXJJbkRvYyAtIEJvdW5kIGNhbnZhc1xyXG5cdCAqIEBwcm9wIHtDYW52YXNSZW5kZXJpbmdDb250ZXh0MkR9IGNvbnRleHQ/PXRhcmdldC5nZXRDb250ZXh0KFwiMmRcIikgLSBUaGUgMmQgY29udGV4dCBjcmVhdGVkIG91dCBvZiBgdGFyZ2V0YFxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gdHJhbnM9MCwwIC0gVHJhbnNsYXRpb25cclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0ICogQHByb3Age251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFuc0JvdW5kPS1JbmZpbml0eSwtSW5maW5pdHksSW5maW5pdHksSW5maW5pdHkgLSBNYXggdHJhbnNsYXRpb24gYm91bmRhcmllc1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBkeW5hbWljVHJhbnNCb3VuZHM9dHJ1ZSAtIHRyYW5zQm91bmRzIGRlcGVuZCBvbiBzY2FsaW5nXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0ICogQHByb3Age251bWJlcltdfSBfY29vcmRpbmF0ZXMgLSBDdXJyZW50IGV2ZW50IGNvb3JkaW5hdGVzXHJcblx0ICogQHByb3Age251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0ICogQHByb3Age29iamVjdH0gX3RvdWNoZXMgLSBNYXAgb2YgYWxsIGN1cnJlbnQgdG91Y2hlc1xyXG5cdCAqIEBwcm9wIHtDbGFzc30gQ2FudmFzQnV0dG9uIC0gQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAcHJvcCB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cGluOiBudW1iZXJbXTsgIC8vT0JTXHJcblx0XHR0cmFuc0JvdW5kczogbnVtYmVyW10gPSBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkeW5hbWljVHJhbnNCb3VuZHM6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0c2NsQm91bmRzOiBudW1iZXJbXSA9IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldO1xyXG5cdFx0ZHJhZ0VuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBpbmNoRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0d2hlZWxFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRrZXlzRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGFuRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlOyAgLy9PQlNcclxuXHRcdHRpbHRFbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0ZXZlbnRzUmV2ZXJzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHVzZUJ1dHRvbjogbnVtYmVyID0gT3B0cy5Vc2VCdXR0b24uVVNFTEVGVDtcclxuXHRcdHNjYWxlTW9kZTogbnVtYmVyID0gT3B0cy5TY2FsZU1vZGUuTk9STUFMO1xyXG5cdFx0dHJhbnNTcGVlZDogbnVtYmVyID0gMTtcclxuXHRcdHNjbFNwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0dG91Y2hTZW5zaXRpdml0eTogbnVtYmVyID0gLjU7XHJcblx0XHRjbGlja1NlbnNpdGl2aXR5OiBudW1iZXIgPSA4MDA7XHJcblx0XHR3Z2V0czogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRrZXliaW5kczogS2V5QmluZDtcclxuXHRcdHByaXZhdGUgX3pvb21DaGFuZ2VkOiBib29sZWFuW10gPSBbZmFsc2UsIGZhbHNlXTtcclxuXHRcdHByaXZhdGUgX21vYmlsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfcHJlc3NlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfY2xrdGltZTogbnVtYmVyID0gMDtcclxuXHRcdF9hZGFwdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRfY29vcmRpbmF0ZXM6IG51bWJlcltdID0gW107XHJcblx0XHRwcml2YXRlIF90b3VjaGVzOiBudW1iZXJbXVtdID0gW107XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0c3RhdGljIENhbnZhc0J1dHRvbjogQ2xhc3M7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSB7XHJcblx0XHRcdHRhcmdldDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYW52YXNcIilbMF0sXHJcblx0XHRcdHRyYW5zOiBbMCwgMF0sXHJcblx0XHRcdHNjbDogWzEsIDFdLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHdoZWVsRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdGtleXNFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHRkeW5hbWljVHJhbnNCb3VuZHM6IHRydWUsXHJcblx0XHRcdHVzZUJ1dHRvbjogMSxcclxuXHRcdFx0c2NhbGVNb2RlOiAxLFxyXG5cdFx0XHR0cmFuc1NwZWVkOiAxLFxyXG5cdFx0XHRzY2xTcGVlZDogMSxcclxuXHRcdFx0dG91Y2hTZW5zaXRpdml0eTogLjM1LFxyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5OiA4MDAsXHJcblx0XHRcdHNjbEJvdW5kczogWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV0sXHJcblx0XHRcdHRyYW5zQm91bmRzOiBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV0sXHJcblx0XHRcdF9hZGFwdHM6IHtcclxuXHRcdFx0XHRkcmFnOiBmYWxzZSxcclxuXHRcdFx0XHRwaW5jaDogZmFsc2UsXHJcblx0XHRcdFx0d2hlZWw6IGZhbHNlLFxyXG5cdFx0XHRcdHBhbjogZmFsc2UsXHJcblx0XHRcdFx0dGlsdDogZmFsc2UsXHJcblx0XHRcdFx0Y2xpY2s6IGZhbHNlXHJcblx0XHRcdH0sXHJcblx0XHRcdHdnZXRzOiBuZXcgU2V0KClcclxuXHRcdH07XHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDb250cm9sbGFibGVDYW52YXMgY29uc3RydWN0b3JcclxuXHRcdCAqIEBwYXJhbSB7T3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zfSBvcHRzPz1Db250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMgLSBDb250cm9sbGFibGVDYW52YXMgT3B0aW9uc1xyXG5cdFx0ICogQGNvbnN0cnVjdG9yXHJcblx0XHQgKi9cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cykge1xyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cyk7XHJcblxyXG5cdFx0XHRpZiAoIShvcHRzLnRhcmdldCBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UQ0FOVjtcclxuXHRcdFx0fSBlbHNlIGlmIChbb3B0cy50cmFucywgb3B0cy5zY2wsIG9wdHMudHJhbnNCb3VuZHMsIG9wdHMuc2NsQm91bmRzXS5zb21lKGFyciA9PiAhKGFyciBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+YXJyIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBhcnIubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKGFycikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpbmhlcml0KG9wdHMuX2FkYXB0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzLl9hZGFwdHMpOyAgLy9QT1NTSUJMRSBFUlJPUlxyXG5cclxuXHRcdFx0aWYgKG9wdHMucGluID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRvcHRzLnBpbiA9IFtvcHRzLnRhcmdldC53aWR0aCAvIDIsIG9wdHMudGFyZ2V0LmhlaWdodCAvIDJdO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEob3B0cy5waW4gaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IG9wdHMucGluLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShvcHRzLnBpbikuc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XHJcblx0XHRcdHRoaXMuY29udGV4dCA9IHRoaXMudGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKTtcclxuXHRcdFx0dGhpcy5rZXliaW5kcyA9IG5ldyBLZXlCaW5kKHRoaXMudGFyZ2V0LCBvcHRzLmtleXNFbmFibGVkKTtcclxuXHJcblx0XHRcdHRoaXMuX2FkYXB0cyA9IDxPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzPnt9O1xyXG5cdFx0XHRpbmhlcml0KHRoaXMuX2FkYXB0cywgb3B0cy5fYWRhcHRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnNTcGVlZCA9IG9wdHMudHJhbnNTcGVlZCAqIDE7XHJcblx0XHRcdHRoaXMuc2NsU3BlZWQgPSBvcHRzLnNjbFNwZWVkICogMTtcclxuXHRcdFx0dGhpcy50b3VjaFNlbnNpdGl2aXR5ID0gb3B0cy50b3VjaFNlbnNpdGl2aXR5ICogMTtcclxuXHRcdFx0dGhpcy5jbGlja1NlbnNpdGl2aXR5ID0gb3B0cy5jbGlja1NlbnNpdGl2aXR5ICogMTtcclxuXHRcdFx0dGhpcy51c2VCdXR0b24gPSBvcHRzLnVzZUJ1dHRvbiB8IDA7XHJcblx0XHRcdHRoaXMuc2NhbGVNb2RlID0gb3B0cy5zY2FsZU1vZGUgfCAwO1xyXG5cclxuXHRcdFx0dGhpcy53Z2V0cyA9IG5ldyBTZXQob3B0cy53Z2V0cyk7XHJcblxyXG5cdFx0XHR0aGlzLnRyYW5zID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5zY2wgPSBBcnJheS5mcm9tKG9wdHMuc2NsKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5waW4gPSBBcnJheS5mcm9tKG9wdHMucGluKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy50cmFuc0JvdW5kcyA9IEFycmF5LmZyb20ob3B0cy50cmFuc0JvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblx0XHRcdHRoaXMuc2NsQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnNjbEJvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblx0XHRcdHRoaXMuZHluYW1pY1RyYW5zQm91bmRzID0gISFvcHRzLmR5bmFtaWNUcmFuc0JvdW5kcztcclxuXHJcblx0XHRcdHRoaXMuZHJhZ0VuYWJsZWQgPSAhIW9wdHMuZHJhZ0VuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hFbmFibGVkID0gISFvcHRzLnBpbmNoRW5hYmxlZDtcclxuXHRcdFx0dGhpcy53aGVlbEVuYWJsZWQgPSAhIW9wdHMud2hlZWxFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBhbkVuYWJsZWQgPSAhIW9wdHMucGFuRW5hYmxlZDtcclxuXHRcdFx0dGhpcy50aWx0RW5hYmxlZCA9ICEhb3B0cy50aWx0RW5hYmxlZDtcclxuXHRcdFx0dGhpcy5ldmVudHNSZXZlcnNlZCA9ICEhb3B0cy5ldmVudHNSZXZlcnNlZDtcclxuXHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbXTtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID0gQ29udHJvbGxhYmxlQ2FudmFzLmlzTW9iaWxlO1xyXG5cdFx0XHRpZiAoIUNvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCkgQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ID0gQ29udHJvbGxhYmxlQ2FudmFzLmxpbmVUb1BpeDtcclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudGFyZ2V0LCBcIl9jY19cIiwge1xyXG5cdFx0XHRcdHZhbHVlOiB0aGlzLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdGdldCByYXRpbygpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50YXJnZXQud2lkdGggLyB0aGlzLnRhcmdldC5oZWlnaHQ7XHJcblx0XHR9IC8vZy1yYXRpbyAgT0JTXHJcblx0XHRnZXQgbWluKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1pbih0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1pblxyXG5cdFx0Z2V0IG1heCgpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgodGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1tYXggIE9CU1xyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9sc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRoYW5kbGUoKTogdm9pZCB7XHJcblx0XHRcdHRoaXMuX21vYmlsZSA/IHRoaXMuX21vYmlsZUFkYXB0KCkgOiB0aGlzLl9wY0FkYXB0KCk7XHJcblx0XHR9IC8vaGFuZGxlXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCAoL2NyZWF0ZSkgYSB3aWRnZXQgaW4gdGhlIGNvbnRyb2xsZXJcclxuXHRcdCAqIEBwYXJhbSB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbnxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnN9IGRhdGEgLSBjb25zdHJ1Y3RvciBvcHRpb25zXHJcblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufSB0aGUgd2lkZ2V0XHJcblx0XHQgKi9cclxuXHRcdGFkZFdpZGdldChkYXRhOiBDYW52YXNCdXR0b24gfCBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMpOiBDYW52YXNCdXR0b24ge1xyXG5cdFx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbiAmJiAhdGhpcy53Z2V0cy5oYXMoZGF0YSkpIHtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIGlmICghKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24pKSB7XHJcblx0XHRcdFx0ZGF0YSA9IG5ldyBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uKDxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnM+ZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVJU0FMUjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7ICAvL1NLRVcvUk9UQVRFIE5PVCBJTVBMRU1FTlRFRCEhXHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9yZXRyYW5zZm9ybVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHRyYW5zbGF0aW9uIGZ1bmN0aW9uIGZvciBpY29uaWMgdHJhbnNsYXRlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIHggdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSB5IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKTogbnVtYmVyID0+IC1iKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IGJvdW5kKE51bWJlcighYWJzID8gKHRybiArIGJ5W2lkeF0pIDogYnlbaWR4XSksIHRoaXMuZHluYW1pY1RyYW5zQm91bmRzID8gdGhpcy50cmFuc0JvdW5kc1tpZHhdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4XSwgdGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPyB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgc2NhbGUgb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgc2NhbGluZ1xyXG5cdFx0ICovXHJcblx0XHRzY2FsZSh4OiBudW1iZXIgPSAxLCB5OiBudW1iZXIgPSB4LCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzUmV2ZXJzZWQpIGJ5ID0gYnkubWFwKChiOiBudW1iZXIpOiBudW1iZXIgPT4gLWIpO1xyXG5cdFx0XHRpZiAoIWFicykge1xyXG5cdFx0XHRcdGxldCBuc2NsOiBudW1iZXJbXSA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IHNjbCAqIGJ5W2lkeF0pO1xyXG5cdFx0XHRcdG5zY2wgPSBbbnNjbFswXSAtIHRoaXMuc2NsWzBdLCBuc2NsWzFdIC0gdGhpcy5zY2xbMV1dO1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgdGhpcy5zY2xbMV0gIT09IGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0XHR0aGlzLnNjbCA9IFtibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl96b29tQ2hhbmdlZCA9IFt0aGlzLnNjbFswXSAhPT0gYm91bmQodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSksIHRoaXMuc2NsWzFdICE9PSBib3VuZCh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdKV07XHJcblx0XHRcdFx0dGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChzY2wgKiBieVtpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbDtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3NjYWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghKHRoaXMuX2FkYXB0cy5kcmFnIHx8IHRoaXMuX2FkYXB0cy5waW5jaCkgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5fYWRhcHRzLnBpbmNoID0gdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVNb3ZlKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCEodGhpcy5fYWRhcHRzLmRyYWcgfHwgdGhpcy5fYWRhcHRzLmNsaWNrKSAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5fY2xrdGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdFx0XHR0aGlzLl9wcmVzc2VkID0gdHJ1ZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLl9hZGFwdHMuY2xpY2sgPSAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5jbGlja1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgKGU/OiBNb3VzZUV2ZW50KTogdm9pZCA9PiB0aGlzLl9hZGFwdHMuY2xpY2soZSkpO1xyXG5cdFx0XHRcdGlmICgodGhpcy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSB0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGU6IE1vdXNlRXZlbnQpID0+IGUucHJldmVudERlZmF1bHQoKSwgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy53aGVlbCAmJiB0aGlzLndoZWVsRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB0aGlzLl9hZGFwdHMud2hlZWwgPSAoZTogV2hlZWxFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLndoZWVsKGUsIHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19wY0FkYXB0XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgY2xpY2tQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFsoZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAoZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dLFxyXG5cdFx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMsIGV2ZW50KSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRjYy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0fSAvL2NsaWNrUENcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLFxyXG5cdFx0XHRcdHJlbDogbnVtYmVyW10gPSBbXSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHJcblx0XHRcdC8qaWYgKCgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSA9PT0gMikgfHwgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoID09PSAzKSB8fCAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiA9PT0gMikpKSB8fCAoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRUJPVEgpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIICYmICgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgIT09IDIpICYmICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCAhPT0gMykgJiYgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gIT09IDIpKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fSovXHJcblxyXG5cdFx0XHRpZiAoY2MuX3ByZXNzZWQpIGNjLl9jbGt0aW1lID0gMDtcclxuXHJcblx0XHRcdGlmICgoZXZlbnQuYnV0dG9ucyAmIGNjLnVzZUJ1dHRvbikgIT09IGV2ZW50LmJ1dHRvbnMpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fcHJlc3NlZCkge1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZShldmVudC5tb3ZlbWVudFggKiBjYy50cmFuc1NwZWVkLCBldmVudC5tb3ZlbWVudFkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKHJlbCA9IGNvb3Jkcy5tYXAoKGM6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IChjIC0gY2MudHJhbnNbaWR4XSkgLyBjYy5zY2xbaWR4XSkpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKHJlbCkpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZHJhZ1BDXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZU1vdmUoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2soYXJyOiBudW1iZXJbXSwgY3VycjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoYXJyLmV2ZXJ5KChhcjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gTWF0aC5hYnMoYXIgLSBjdXJyW2lkeF0pID49IGNjLnRvdWNoU2Vuc2l0aXZpdHkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9IC8vY2hlY2tcclxuXHRcdFx0ZnVuY3Rpb24gYXJyYXluZ2UodGxpczogVG91Y2hMaXN0KTogbnVtYmVyW11bXSB7XHJcblx0XHRcdFx0cmV0dXJuIFtbdGxpc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLCBbdGxpc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdXTtcclxuXHRcdFx0fSAvL2FycmF5bmdlXHJcblx0XHRcdGZ1bmN0aW9uIGV2ZXJ5KHQ6IG51bWJlcltdW10sIG50OiBudW1iZXJbXVtdLCBhbGw6IGJvb2xlYW4gPSBmYWxzZSwgb25jZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0bGV0IG91dCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChhbGwgJiYgY2hlY2sodFswXSwgbnRbMF0pICYmIGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChhbGwpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMF0sIG50WzBdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSBvbmNlIHx8ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHRcdH0gLy9ldmVyeVxyXG5cdFx0XHRmdW5jdGlvbiBpbmgob25lOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlc1swXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdFx0aWYgKCFvbmUpIGNjLl90b3VjaGVzWzFdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0fSAvL2luaFxyXG5cclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuZHJhZ0VuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0bGV0IGNwOiBudW1iZXJbXSA9IEFycmF5LmZyb20oY2MudHJhbnMpLFxyXG5cdFx0XHRcdFx0ZGlzOiBudW1iZXI7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLltjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0sIGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy50cmFuc1NwZWVkKSk7XHJcblx0XHRcdFx0ZGlzID0gZGlzdChbY3BbMF0sIGNjLnRyYW5zWzBdXSwgW2NwWzFdLCBjYy50cmFuc1sxXV0pO1xyXG5cdFx0XHRcdGlmIChkaXMgPiBjYy50b3VjaFNlbnNpdGl2aXR5KSBjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdFx0aW5oKHRydWUpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNjLnBpbmNoRW5hYmxlZCAmJiBjYy5fdG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzLCBmYWxzZSwgdHJ1ZSkpIHtcclxuXHRcdFx0XHRpZiAoKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkgPT09IE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkge1xyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlcltdID0gW01hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdKSwgTWF0aC5hYnMoY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSAtIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV0pXSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXJbXSA9IFtNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSAyICogY2MudGFyZ2V0Lm9mZnNldExlZnQpLCBNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSAyICogY2MudGFyZ2V0Lm9mZnNldFRvcCldLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlcltdID0gW2Rpc1swXSAvIGluaWRpc3RbMF0sIGRpc1sxXSAvIGluaWRpc3RbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2Muc2NsU3BlZWQpLFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgKiAoMSAtIGRbaWR4XSkpO1xyXG5cclxuXHRcdFx0XHRcdGNjLnNjYWxlKGRbMF0sIGRbMV0pO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZFswXSkgY2MudHJhbnNsYXRlKG50b3VjaGVzWzBdKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWRbMV0pIGNjLnRyYW5zbGF0ZShudG91Y2hlc1sxXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlciA9IGRpc3QoW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF1dLCBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0pLFxyXG5cdFx0XHRcdFx0XHRkaXM6IG51bWJlciA9IGRpc3QoW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdF0sIFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wLCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSksXHJcblx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0ZDogbnVtYmVyID0gY2Muc2NsU3BlZWQgKiBkaXMgLyBpbmlkaXN0LFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlcikgPT4gaSAqICgxIC0gZCkpO1xyXG5cclxuXHRcdFx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgY2MudHJhbnNsYXRlKC4uLm50b3VjaGVzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aW5oKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnTW9iaWxlTW92ZVxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZVN0YXJ0KGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzLCBjdXN0OiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGlmICghY3VzdCkge1xyXG5cdFx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdLFxyXG5cdFx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4gY2MuX3RvdWNoZXNbdC5pZGVudGlmaWVyXSA9IFt0LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCB0b3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG5cdFx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblxyXG5cdFx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhjb29yZHMpKTtcclxuXHRcdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNjLl90b3VjaGVzW2NjLl90b3VjaGVzLmxlbmd0aCAtIDFdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVTdGFydFxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZUVuZChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSAmJiBEYXRlLm5vdygpIC0gY2MuX2Nsa3RpbWUgPD0gY2MuY2xpY2tTZW5zaXRpdml0eSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpICYmIChyZXQgPSBidXR0LmNsaWNrKGNvb3JkcywgZXZlbnQpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhjYy5fdG91Y2hlcykubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGV2ZW50LCBjYywgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHdoZWVsKGV2ZW50OiBXaGVlbEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGxldCBkOiBudW1iZXIgPSAxIC0gY2Muc2NsU3BlZWQgKiBDb250cm9sbGFibGVDYW52YXMuZml4RGVsdGEoZXZlbnQuZGVsdGFNb2RlLCBldmVudC5kZWx0YVkpIC8gY2MubWluLFxyXG5cdFx0XHRcdGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0sIGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV1dO1xyXG5cdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgY2MudHJhbnNsYXRlKC4uLmNvb3Jkcy5tYXAoKGM6IG51bWJlcikgPT4gYyAqICgxIC0gZCkpKTtcclxuXHRcdH0gLy93aGVlbFxyXG5cclxuXHJcblx0XHRfZm9yY2VEcmFnUEMoKTogdm9pZCB7XHJcblx0XHRcdGxldCBmYWtlOiBNb3VzZUV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJtb3VzZW1vdmVcIiwge1xyXG5cdFx0XHRcdHZpZXc6IHdpbmRvdyxcclxuXHRcdFx0XHRidWJibGVzOiB0cnVlLFxyXG5cdFx0XHRcdGNhbmNlbGFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWVudFg6IHRoaXMuX2Nvb3JkaW5hdGVzWzBdICsgdGhpcy50YXJnZXQub2Zmc2V0TGVmdCxcclxuXHRcdFx0XHRjbGllbnRZOiB0aGlzLl9jb29yZGluYXRlc1sxXSArIHRoaXMudGFyZ2V0Lm9mZnNldFRvcCxcclxuXHRcdFx0XHRidXR0b25zOiB0aGlzLnVzZUJ1dHRvbixcclxuXHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRtb3ZlbWVudFg6IDAsXHJcblx0XHRcdFx0Ly9AdHMtaWdub3JlXHJcblx0XHRcdFx0bW92ZW1lbnRZOiAwXHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLnRhcmdldC5kaXNwYXRjaEV2ZW50KGZha2UpO1xyXG5cdFx0fSAvL19mb3JjZURyYWdQQ1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogR2V0IHNjcmVlbi1lcXVpdmFsZW50IGNvb3JkaW5hdGVzIHRoYXQgYnlwYXNzIHRyYW5zZm9ybWF0aW9ucy5cclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJbXX1cclxuXHRcdCAqL1xyXG5cdFx0Z2V0Q29vcmRzKCk6IG51bWJlcltdIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2Nvb3JkaW5hdGVzLm1hcCgoYzogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiAoYyAtIHRoaXMudHJhbnNbaWR4XSkgLyB0aGlzLnNjbFtpZHhdKTtcclxuXHRcdH0gLy9nZXRDb29yZHNcclxuXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGlzTW9iaWxlKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBvZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dpbmRvd3MgUGhvbmUvaSlcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vaXNNb2JpbGVcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgbGluZVRvUGl4KCk6IG51bWJlciB7XHJcblx0XHRcdGxldCByOiBudW1iZXIsXHJcblx0XHRcdFx0aWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcblx0XHRcdGlmcmFtZS5zcmMgPSAnIyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0bGV0IGl3aW46IFdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93LFxyXG5cdFx0XHRcdGlkb2M6IERvY3VtZW50ID0gaXdpbi5kb2N1bWVudDtcclxuXHRcdFx0aWRvYy5vcGVuKCk7XHJcblx0XHRcdGlkb2Mud3JpdGUoJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48cD5hPC9wPjwvYm9keT48L2h0bWw+Jyk7XHJcblx0XHRcdGlkb2MuY2xvc2UoKTtcclxuXHRcdFx0bGV0IHNwYW46IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50Pmlkb2MuYm9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxuXHRcdFx0ciA9IHNwYW4ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcblx0XHRcdHJldHVybiByO1xyXG5cdFx0fSAvL2xpbmVUb1BpeFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGZpeERlbHRhKG1vZGU6IG51bWJlciwgZGVsdGFZOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAobW9kZSA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggKiBkZWx0YVk7XHJcblx0XHRcdH0gZWxzZSBpZiAobW9kZSA9PT0gMikge1xyXG5cdFx0XHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGRlbHRhWTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2ZpeERlbHRhXHJcblx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIHRvIGNvbnRyb2wga2V5Ym9hcmQgZXZlbnRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIEtleUJpbmQge1xyXG5cdFx0cHJlc3M6IEtleVtdID0gW107XHJcblx0XHRkb3duOiBLZXlbXSA9IFtdO1xyXG5cdFx0dXA6IEtleVtdID0gW107XHJcblx0XHRlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHRcdF9ib3VuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWQ6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXA6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHt9O1xyXG5cclxuXHRcdHN0YXRpYyBfaWRjbnRyID0gMDtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZDogbnVtYmVyID0gNTtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZHVwOiBudW1iZXIgPSAuNTtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZE1heDogbnVtYmVyID0gMjA7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWR1cEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRzdGF0aWMgYXJyb3dCaW5kaW5nczoge1xyXG5cdFx0XHRba2V5OiBzdHJpbmddOiBudW1iZXJbXTtcclxuXHRcdH0gPSB7XHJcblx0XHRcdFx0QXJyb3dVcDogWzAsIDFdLFxyXG5cdFx0XHRcdEFycm93RG93bjogWzAsIC0xXSxcclxuXHRcdFx0XHRBcnJvd0xlZnQ6IFsxLCAwXSxcclxuXHRcdFx0XHRBcnJvd1JpZ2h0OiBbLTEsIDBdXHJcblx0XHRcdH07XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoZWxlbWVudDogSFRNTEVsZW1lbnQsIGJpbmQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cdFx0XHR0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG5cdFx0XHRPYmplY3QuYXNzaWduKHRoaXMuYXJyb3dCaW5kaW5ncywgS2V5QmluZC5hcnJvd0JpbmRpbmdzKTtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWQ7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWR1cCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWR1cDtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZE1heCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWRNYXg7XHJcblx0XHRcdGJpbmQgJiYgdGhpcy5iaW5kKCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdHN0YXRpYyBhcnJvd01vdmUoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAodHlwZSA9PT0gXCJrZXlkb3duXCIpIHtcclxuXHRcdFx0XHRldmVudC50YXJnZXRbXCJfY2NfXCJdLnRyYW5zbGF0ZSh0aGlzLmFycm93TW92ZVNwZWVkICogdGhpcy5hcnJvd0JpbmRpbmdzW2V2ZW50LmtleV1bMF0sIHRoaXMuYXJyb3dNb3ZlU3BlZWQgKiB0aGlzLmFycm93QmluZGluZ3NbZXZlbnQua2V5XVsxXSk7XHJcblx0XHRcdFx0ZXZlbnQudGFyZ2V0W1wiX2NjX1wiXS5fZm9yY2VEcmFnUEMoKTtcclxuXHRcdFx0XHRpZiAodGhpcy5hcnJvd01vdmVTcGVlZHVwRW5hYmxlZCkgdGhpcy5hcnJvd01vdmVTcGVlZCA9IGJvdW5kKHRoaXMuYXJyb3dNb3ZlU3BlZWQgKyB0aGlzLmFycm93TW92ZVNwZWVkdXAsIDAsIHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9hcnJvd01vdmVcclxuXHJcblx0XHRiaW5kQXJyb3dzKCk6IHZvaWQge1xyXG5cdFx0XHRpZiAoIXRoaXMuZWxlbWVudFtcIl9jY19cIl0pIHRocm93IEVycm9ycy5FTk9DQ0FOVjtcclxuXHRcdFx0Zm9yIChsZXQgaSBpbiB0aGlzLmFycm93QmluZGluZ3MpIHtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyS2V5ZG93bihpLCBLZXlCaW5kLmFycm93TW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnJlZ2lzdGVyS2V5dXAoaSwgS2V5QmluZC5hcnJvd01vdmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0dGhpcy5iaW5kQXJyb3dzID0gKCk6IHZvaWQgPT4geyB9O1xyXG5cdFx0fSAvL2JpbmRBcnJvd3NcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEJpbmQga2V5IGV2ZW50IGxpc3RlbmVyc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge2Jvb2xlYW59XHJcblx0XHQgKi9cclxuXHRcdGJpbmQoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmICghdGhpcy5fYm91bmQpIHtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXByZXNzXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5cHJlc3NcIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleXVwXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleWRvd25cIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuX2JvdW5kID0gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vYmluZFxyXG5cclxuXHRcdF9oYW5kbGVyKHR5cGU6IHN0cmluZywgZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IGhhbmRsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdFx0dGhpc1t0eXBlLnJlcGxhY2UoXCJrZXlcIiwgJycpXS5mb3JFYWNoKChrZXk6IEtleSk6IHZvaWQgPT4ge1xyXG5cdFx0XHRcdGlmIChrZXkua2V5ID09PSBldmVudC5rZXkpIHtcclxuXHRcdFx0XHRcdGhhbmRsZWQgPSAha2V5LmNhbGxiYWNrKGV2ZW50LCB0eXBlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlZDtcclxuXHRcdH0gLy9faGFuZGxlclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5cHJlc3Moa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy5wcmVzcy5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcInByZXNzXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXlwcmVzc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXlkb3duKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMuZG93bi5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcImRvd25cIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleWRvd25cclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5dXAoa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy51cC5wdXNoKG91dCA9IHsga2V5OiBrZXksIGNhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IEtleUJpbmQuX2lkY250cisrLCB0eXBlOiBcInVwXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXl1cFxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge0tleX0ga2V5XHJcblx0XHQgKi9cclxuXHRcdHVucmVnaXN0ZXIoa2V5OiBLZXkgfCBudW1iZXIgfCBzdHJpbmcsIHJlcGw6IEtleSk6IEtleSB8IEtleVtdIHwgYm9vbGVhbiB7XHJcblx0XHRcdGlmICh0eXBlb2Yga2V5ID09PSBcIm51bWJlclwiKSB7XHJcblx0XHRcdFx0bGV0IGlkeDogbnVtYmVyO1xyXG5cdFx0XHRcdGlmICgoaWR4ID0gdGhpcy5wcmVzcy5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMucHJlc3Muc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICgoaWR4ID0gdGhpcy5kb3duLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kb3duLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoKGlkeCA9IHRoaXMudXAuZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnVwLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHR0aGlzLnByZXNzID0gdGhpcy5wcmVzcy5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdFx0dGhpcy5kb3duID0gdGhpcy5kb3duLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0XHR0aGlzLnVwID0gdGhpcy51cC5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXNba2V5LnR5cGVdLnNwbGljZSh0aGlzW2tleS50eXBlXS5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5LmlkKSwgMSwgcmVwbCk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy91bnJlZ2lzdGVyXHJcblx0fSAvL0tleUJpbmRcclxuXHJcblx0LyoqXHJcblx0ICogQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAbWVtYmVyb2YgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0ICogQHByb3Age251bWJlcn0geCAtIHggY29vcmRpbmF0ZVxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBkeCAtIHdpZHRoXHJcblx0ICogQHByb3Age251bWJlcn0gZHkgLSBoZWlnaHRcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBpbmRleCAtIGVxdWl2YWxlbnQgdG8gQ1NTIHotaW5kZXhcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ2FudmFzQnV0dG9uIGltcGxlbWVudHMgT3B0cy5DYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdHg6IG51bWJlciA9IDA7XHJcblx0XHR5OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHg6IG51bWJlciA9IDA7XHJcblx0XHRkeTogbnVtYmVyID0gMDtcclxuXHRcdGluZGV4OiBudW1iZXIgPSAtMTtcclxuXHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0X2lkOiBudW1iZXI7XHJcblx0XHRlbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcclxuXHRcdHBzdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cG9zaXRpb246IG51bWJlciA9IDI7XHJcblxyXG5cdFx0c3RhdGljIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuMztcclxuXHRcdHByaXZhdGUgc3RhdGljIF9pZGNudHI6IG51bWJlciA9IDA7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSB7XHJcblx0XHRcdHg6IDAsXHJcblx0XHRcdHk6IDAsXHJcblx0XHRcdGR4OiAwLFxyXG5cdFx0XHRkeTogMCxcclxuXHRcdFx0aW5kZXg6IC0xLFxyXG5cdFx0XHRwc3RhdGU6IGZhbHNlLFxyXG5cdFx0XHRlbmFibGVkOiB0cnVlLFxyXG5cdFx0XHRwb3NpdGlvbjogMixcclxuXHRcdFx0cGFyZW50OiBuZXcgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cykgeyAgLy9ET1VCTEVDTElDSywgTE9OR0NMSUNLLCBEUkFHLCAuLi4gVVNFUi1JTVBMRU1FTlRFRCg/KVxyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cyk7XHJcblxyXG5cdFx0XHRpZiAoW29wdHMueCwgb3B0cy55LCBvcHRzLmR4LCBvcHRzLmR5LCBvcHRzLnBvc2l0aW9uLCBvcHRzLmluZGV4XS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnggPSBvcHRzLnggKiAxO1xyXG5cdFx0XHR0aGlzLnkgPSBvcHRzLnkgKiAxO1xyXG5cdFx0XHR0aGlzLmR4ID0gb3B0cy5keCAqIDE7XHJcblx0XHRcdHRoaXMuZHkgPSBvcHRzLmR5ICogMTtcclxuXHRcdFx0dGhpcy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfCAwO1xyXG5cdFx0XHR0aGlzLmluZGV4ID0gb3B0cy5pbmRleCB8IDA7XHJcblx0XHRcdHRoaXMuZW5hYmxlZCA9ICEhb3B0cy5lbmFibGVkO1xyXG5cdFx0XHR0aGlzLl9pZCA9IENhbnZhc0J1dHRvbi5faWRjbnRyKys7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGV4aXRlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRibHVyKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vYmx1clxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZW50ZXJlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRmb2N1cyguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9mb2N1c1xyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgY2xpY2tlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRjbGljayguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2NsaWNrXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBhYm92ZSB0aGUgd2lkZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcltdfSByZWxhdGl2ZUNvb3Jkc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRfaXNPbihyZWxhdGl2ZUNvb3JkczogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy54IC0gdGhpcy5wYXJlbnQudHJhbnNbMF0pIC8gdGhpcy5wYXJlbnQuc2NsWzBdIDogdGhpcy54LFxyXG5cdFx0XHRcdHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy55IC0gdGhpcy5wYXJlbnQudHJhbnNbMV0pIC8gdGhpcy5wYXJlbnQuc2NsWzFdIDogdGhpcy55LFxyXG5cdFx0XHRcdGR4OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHggLyB0aGlzLnBhcmVudC5zY2xbMF0gOiB0aGlzLmR4LFxyXG5cdFx0XHRcdGR5OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHkgLyB0aGlzLnBhcmVudC5zY2xbMV0gOiB0aGlzLmR5LFxyXG5cdFx0XHRcdG91dDogYm9vbGVhbiA9IGlzV2l0aGluKFt4LCB5LCBkeCwgZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSwgQ2FudmFzQnV0dG9uLnNlbnNpdGl2aXR5KTtcclxuXHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL19pc09uXHJcblx0fSAvL0NhbnZhc0J1dHRvblxyXG5cclxuXHRDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uID0gQ2FudmFzQnV0dG9uO1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIG9mZmVyaW5nIG1hdGhlbWF0aWNhbCBWZWN0b3IgdXRpbGl0aWVzXHJcblx0ICogQGlubmVyXHJcblx0ICogQGNsYXNzXHJcblx0ICogQHByb3Age251bWJlcltdfSBwcm9wcyAtIHZlY3RvciB2ZXJ0aWNlc1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBWZWN0b3Ige1xyXG5cdFx0cHJvcHM6IG51bWJlcltdO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHByb3BzOiBudW1iZXJbXSA9IFtdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHR9IC8vVmVjdG9yXHJcblxyXG5cdC8qKlxyXG5cdCAqIEBwcm9wIHtIVE1MRWxlbWVudFtdfSByZXNvdXJjZXMgLSBBbGwgSFRNTCByZXNvdXJjZSBlbGVtZW50cyB3aXRoIFwibG9hZFwiIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgbG9hZGVkLiBsaWtlOiBhdWRpby9pbWdcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0cmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcblx0XHRcdFx0aW1nLnNyYyA9IHVybDtcclxuXHRcdFx0XHRpbWdsaXN0LnB1c2goaW1nKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcihpbWdsaXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9pbWFnZXNcclxuXHRcdC8qKlxyXG5cdFx0ICogTG9hZCBhdWRpbyBieSBVUkxzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ1tdfSB1cmxpc3QgLSBsaXN0IG9mIHVybHNcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IG9ubG9hZCAtIGNhbGxiYWNrXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9iaW5kPXRydWUgLSBhdXRvIGJpbmRcclxuXHRcdCAqIEByZXR1cm5zIHtSZXNvdXJjZUxvYWRlcn0gdGhlIGxvYWRlclxyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgYXVkaW9zKHVybGlzdDogc3RyaW5nW10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSB0cnVlKTogUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0XHRsZXQgYXVkaW9saXN0OiBIVE1MQXVkaW9FbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgYXVkaW8gPSBuZXcgQXVkaW8odXJsKTtcclxuXHRcdFx0XHRhdWRpby5sb2FkKCk7XHJcblx0XHRcdFx0YXVkaW9saXN0LnB1c2goYXVkaW8pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGF1ZGlvbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vYXVkaW9zXHJcblx0fSAvL1Jlc291cmNlTG9hZGVyXHJcblxyXG59IC8vQ2FudmFzQ29udHJvbHNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENhbnZhc0NvbnRyb2xzLkNvbnRyb2xsYWJsZUNhbnZhcztcclxuIl19