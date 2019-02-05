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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUdIOztHQUVHO0FBRUgsWUFBWSxDQUFDOztBQUNiLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBRUg7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0FtbEMzQjtBQW5sQ0QsV0FBYyxjQUFjO0lBSTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBZ0IsT0FBTyxDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsWUFBc0IsQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLElBQVksRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakssS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDbkIsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxTQUFTO0lBTkssc0JBQU8sVUFNdEIsQ0FBQTtJQUNEOzs7Ozs7Ozs7T0FTRztJQUNILFNBQWdCLEtBQUssQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLENBQVMsRUFBRSxJQUFZLENBQUM7UUFDbkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUMsQ0FBQyxPQUFPO0lBRk8sb0JBQUssUUFFcEIsQ0FBQTtJQUNEOzs7Ozs7O09BT0c7SUFDSCxTQUFnQixLQUFL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O2dCQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0wsT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pKO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNB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QUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQzNOLFFBQVEsR0FBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMxUixDQUFDLEdBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQzVGLFFBQVEsR0FBYSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRWpGLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckI7cUJBQU07b0JBQ04sWUFBWTtvQkFDWixJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDek8sR0FBRyxHQUFXLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQ2hQLFFBQVEsR0FBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMxUixDQUFDLEdBQVcsRUFBRSxDQUFDLFFBQVEsR0FBRyxHQUFHLEdBQUcsT0FBTyxFQUN2QyxRQUFRLEdBQWEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxH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QUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUM1SSxDQUFDLEdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUN6SSxFQUFFLEdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQzdILEVBQUUsR0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFDN0gsR0FBRyxHQUFZLFFB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QyxnQkFBZ0I7QUFFbEIsa0JBQWUsY0FBYyxDQUFDLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQW5nbGUgYmV0d2VlbiAzIHBvaW5zIChSYWRpYW5zKTpcclxuICogcGM6IGNlbnRlci9wb2xlXHJcbiAqIHBuOiBwb2ludCBuZXcgY29vcmRpbmF0ZXNcclxuICogcHA6IHBvaW50IHBhc3QgY29vcmRpbmF0ZXNcclxuICogXHJcbiAqIGF0YW4yKHBueSAtIHBjeSwgcG54IC0gcGN4KSAtIGF0YW4yKHBweSAtIHBjeSwgcHB4IC0gcGN4KVxyXG4gKi9cclxuXHJcblxyXG4vKlxyXG4gKiBjZW50ZXJlZCB6b29tIGJyZWFrcyB3aXRoIHRyYW5zQm91bmRzIC0gbm9ybWFsL2FjY2VwdGFibGVcclxuICovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuaW1wb3J0IFwiQGJhYmVsL3BvbHlmaWxsXCI7XHJcblxyXG4vKipcclxuICogQGZpbGUgQ2FudmFzQ29udHJvbHMudHNcclxuICogQGNvcHlyaWdodCBWYWxlbi4gSC4gMmsxOFxyXG4gKiBAYXV0aG9yIFZhbGVuLkguIDxhbHRlcm5hdGl2ZXh4eHlAZ21haWwuY29tPlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUaGUgcm9vdCBvZiB0aGUgbWFpbiBsaWJyYXJ5XHJcbiAqIEBtb2R1bGUgQ2FudmFzQ29udHJvbHNcclxuICogQGxpY2Vuc2UgSVNDXHJcbiAqIEBnbG9iYWxcclxuICovXHJcbmV4cG9ydCBtb2R1bGUgQ2FudmFzQ29udHJvbHMge1xyXG5cclxuXHR0eXBlIENsYXNzID0geyBuZXcoLi4uYXJnczogYW55W10pOiBhbnk7IH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIElmIGBkZXN0YCBsYWNrcyBhIHByb3BlcnR5IHRoYXQgYHRhcmdgIGhhcyB0aGVuIHRoYXQgcHJvcGVydHkgaXMgY29waWVkIGludG8gYGRlc3RgXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IGRlc3QgLSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGFyZyAtIGJhc2Ugb2JqZWN0XHJcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY29uZGl0aW9uIC0gaW5oZXJpdGFuY2UgY29uZGl0aW9uXHJcblx0ICogQHJldHVybnMge29iamVjdH0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGluaGVyaXQoZGVzdDoge30sIHRhcmc6IHt9LCBjb25kaXRpb246IEZ1bmN0aW9uID0gKGRlc3Q6IHt9LCB0YXJnOiB7fSwgcHJvcDogc3RyaW5nKTogYW55ID0+IGRlc3RbcHJvcF0gPT09IHVuZGVmaW5lZCAmJiAoZGVzdFtwcm9wXSA9IHRhcmdbcHJvcF0pKToge30ge1xyXG5cdFx0Zm9yIChsZXQgaSBpbiB0YXJnKSB7XHJcblx0XHRcdGNvbmRpdGlvbihkZXN0LCB0YXJnLCBpKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZGVzdDtcclxuXHR9IC8vaW5oZXJpdFxyXG5cdC8qKlxyXG5cdCAqIFJlc3RyaWN0IG51bWJlcidzIHJhbmdlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSB0YXJnZXQgbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gbWF4aW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gcD0wIC0gcHJlY2lzaW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIsIHA6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNICsgcCA/IE0gOiAobiA8IG0gLSBwID8gbSA6IG4pO1xyXG5cdH0gLy9ib3VuZFxyXG5cdC8qKlxyXG5cdCAqIERvd25zcGVlZCBpbmNyZW1lbnRhdGlvblxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBNYXhpbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9wIC0gb3BlcmF0aW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBibG9jayhuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBvcDogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdGlmIChuID4gTSAmJiBvcCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPiBNKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtICYmIG9wIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH0gZWxzZSBpZiAobiA8IG0pIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9XHJcblx0fSAvL2Jsb2NrXHJcblx0LyoqXHJcblx0ICogQ2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBYcyAtIFggY29vcmRpbmF0ZXNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBZcyAtIFkgY29vcmRpbmF0ZXNcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBkaXN0YW5jZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBkaXN0KFhzOiBudW1iZXJbXSwgWXM6IG51bWJlcltdKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQoW1hzWzFdIC0gWHNbMF0sIFlzWzFdIC0gWXNbMF1dLm1hcCgodjogbnVtYmVyKSA9PiBNYXRoLnBvdyh2LCAyKSkucmVkdWNlKChhY2M6IG51bWJlciwgdjogbnVtYmVyKSA9PiBhY2MgKyB2KSk7XHJcblx0fSAvL2Rpc3RcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBpbnNpZGUgYW4gYXJlYVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGJveCAtIHgseSxkeCxkeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IHBvaW50IC0geCx5XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHNlbnNpdGl2aXR5IC0gZXh0cmEgYm91bmRhcnlcclxuXHQgKiBAcmV0dXJucyBib29sZWFuXHJcblx0ICogQGlubmVyXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGlzV2l0aGluKGJveDogbnVtYmVyW10sIHBvaW50OiBudW1iZXJbXSwgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC41KTogYm9vbGVhbiB7XHJcblx0XHRyZXR1cm4gYm94WzBdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMF0gJiYgYm94WzBdICsgYm94WzJdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMF0gJiYgYm94WzFdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMV0gJiYgYm94WzFdICsgYm94WzNdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMV07XHJcblx0fSAvL2lzV2l0aGluXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgT3B0aW9uc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9wdHMge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHluYW1pY1RyYW5zQm91bmRzPXRydWUgLSB0cmFuc0JvdW5kcyBkZXBlbmQgb24gc2NhbGluZ1xyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKDEgZmluZ2VyIG9ubHkgc2hhbGwgbW92ZSlcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0XHQgKiBAcHJvcCB7Ym9vbGVhbn0ga2V5c0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUga2V5YWJvcmQgZXZlbnRzIGxpc3RlbmVyXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwYW5FbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIGJhc2VkIG9uIG1vdXNlL2ZpbmdlciBkaXN0YW5jZSBmcm9tIHBpbiAocHNldWRvLWNlbnRlcilcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gZXZlbnRzUmV2ZXJzZWQ9ZmFsc2UgLSBUb2dnbGUgcmV2ZXJzZS1vcGVyYXRpb25zXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLlVzZUJ1dHRvbn0gdXNlQnV0dG9uPU9wdHMuVXNlQnV0dG9uLlVTRUxFRlQgLSBSZXNwb25kIHRvIGxlZnQtY2xpY2ssIHJpZ2h0IG9yIGJvdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHNjbFNwZWVkPTEgLSBTY2FsaW5nIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc30gX2FkYXB0cyAtIE1hcCBvZiBhbGwgY3VycmVudGx5IGF0dGFjaGVkIGNvbnRyb2wgZXZlbnQgYWRhcHRlcnNcclxuXHRcdCAqIEBtZW1iZXIge1NldDxDYW52YXNCdXR0b24+fSB3Z2V0cyAtIENhbnZhcyB3aWRnZXRzXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdFx0dGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdFx0dHJhbnM/OiBudW1iZXJbXTtcclxuXHRcdFx0c2NsPzogbnVtYmVyW107XHJcblx0XHRcdGRyYWdFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cGluY2hFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0d2hlZWxFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0a2V5c0VuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwYW5FbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0dGlsdEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRldmVudHNSZXZlcnNlZD86IGJvb2xlYW47XHJcblx0XHRcdHVzZUJ1dHRvbj86IG51bWJlcjtcclxuXHRcdFx0c2NhbGVNb2RlPzogbnVtYmVyO1xyXG5cdFx0XHR0cmFuc0JvdW5kcz86IG51bWJlcltdO1xyXG5cdFx0XHRzY2xCb3VuZHM/OiBudW1iZXJbXTtcclxuXHRcdFx0dHJhbnNTcGVlZD86IG51bWJlcjtcclxuXHRcdFx0ZHluYW1pY1RyYW5zQm91bmRzPzogYm9vbGVhbjtcclxuXHRcdFx0c2NsU3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk/OiBudW1iZXI7XHJcblx0XHRcdGNsaWNrU2Vuc2l0aXZpdHk/OiBudW1iZXI7XHJcblx0XHRcdF9hZGFwdHM/OiBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdFx0d2dldHM/OiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNPcHRpb25zXHJcblx0XHQvKipcclxuXHRcdCAqIE06IG1vYmlsZVxyXG5cdFx0ICogUDogcGNcclxuXHRcdCAqIE1QOiBib3RoXHJcblx0XHQgKiBcclxuXHRcdCAqIGRyYWc6XHJcblx0XHQgKlx0UDogbW91c2UgIGhvbGQgJiBtb3ZlXHJcblx0XHQgKlx0TTogdG91Y2ggIGhvbGQgJiBtb3ZlXHJcblx0XHQgKiBwaW5jaDpcclxuXHRcdCAqXHR0b3VjaCAgMi1maW5nZXIgJiBtb3ZlXHJcblx0XHQgKiB3aGVlbDpcclxuXHRcdCAqXHR3aGVlbCAgbW92ZSAgW3BjIHBpbmNoLWVxdWl2YWxlbnRdXHJcblx0XHQgKiBwYW46XHJcblx0XHQgKlx0ZGlzcG9zaXRpb24gZnJvbSBjZW50ZXIgY2F1c2VzIGNvbnN0YW50IHRyYW5zbGF0aW9uXHJcblx0XHQgKiB0aWx0OlxyXG5cdFx0ICpcdGRldmljZW1vdGlvbiAgY2F1c2VzIHBhbm5pbmcqXHJcblx0XHQgKlx0XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzIHtcclxuXHRcdFx0ZHJhZzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRwaW5jaD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVxyXG5cdFx0XHR3aGVlbD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vUFxyXG5cdFx0XHRwYW46IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0dGlsdD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0Y2xpY2s6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBPcHRpb25zIG9mIENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b25cclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHggLSB3aWRnZXQgd2lkdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHkgLSB3aWRnZXQgaGVpZ2h0XHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGluZGV4IC0gd2lkZ2V0IGV2ZW50IHByaW9yaXR5XHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdFx0eDogbnVtYmVyO1xyXG5cdFx0XHR5OiBudW1iZXI7XHJcblx0XHRcdGR4OiBudW1iZXI7XHJcblx0XHRcdGR5OiBudW1iZXI7XHJcblx0XHRcdGluZGV4PzogbnVtYmVyO1xyXG5cdFx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdFx0ZW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBvc2l0aW9uPzogbnVtYmVyO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NhbnZhc0J1dHRvbk9wdGlvbnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEgsIFVTRVdIRUVMLCBVU0VBTEwgPSA3XHJcblx0XHR9IC8vVXNlQnV0dG9uXHJcblx0XHRleHBvcnQgZW51bSBTY2FsZU1vZGUge1xyXG5cdFx0XHROT1JNQUwgPSAxLCBGUkVFU0NBTEVcclxuXHRcdH0gLy9TY2FsZU1vZGVcclxuXHRcdGV4cG9ydCBlbnVtIFBvc2l0aW9uIHtcclxuXHRcdFx0RklYRUQgPSAxLCBBQlNPTFVURSwgVU5TQ0FMQUJMRSA9IDRcclxuXHRcdH0gLy9Qb3NpdGlvblxyXG5cdH0gLy9PcHRzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgZXJyb3JzXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ0FOVjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBIVE1MQ2FudmFzRWxlbWVudC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENUWDogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTUFSUjI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgMi1hdC1sZWFzdCBOdW1iZXJzLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgdmFsaWQgTnVtYmVyLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFSVNBTFI6IFJlZmVyZW5jZUVycm9yID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiT2JqZWN0IGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5cIik7XHJcblx0fSAvL0Vycm9yc1xyXG5cclxuXHQvKipcclxuXHQgKiBUeXBlIG9mIEtleUJpbmRcclxuXHQgKi9cclxuXHRleHBvcnQgdHlwZSBLZXkgPSB7XHJcblx0XHRrZXk6IHN0cmluZztcclxuXHRcdGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuXHRcdGlkOiBudW1iZXI7XHJcblx0XHR0eXBlOiBzdHJpbmc7XHJcblx0fTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGR5bmFtaWNUcmFuc0JvdW5kcz10cnVlIC0gdHJhbnNCb3VuZHMgZGVwZW5kIG9uIHNjYWxpbmdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoYm90aCBmaW5nZXJzIHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGtleXNFbmFibGVkPWZhbHNlIC0gRW5hYmxlIGtleWFib3JkIGV2ZW50cyBsaXN0ZW5lclxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwYW5FbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIGJhc2VkIG9uIG1vdXNlL2ZpbmdlciBkaXN0YW5jZSBmcm9tIHBpbiAocHNldWRvLWNlbnRlcilcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0ICogQHByb3Age2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdCAqIEBwcm9wIHtPcHRzLlVzZUJ1dHRvbn0gdXNlQnV0dG9uPU9wdHMuVXNlQnV0dG9uLlVTRUxFRlQgLSBSZXNwb25kIHRvIGxlZnQtY2xpY2ssIHJpZ2h0IG9yIGJvdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IF9jb29yZGluYXRlcyAtIEN1cnJlbnQgZXZlbnQgY29vcmRpbmF0ZXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc30gX2FkYXB0cyAtIE1hcCBvZiBhbGwgY3VycmVudGx5IGF0dGFjaGVkIGNvbnRyb2wgZXZlbnQgYWRhcHRlcnNcclxuXHQgKiBAcHJvcCB7b2JqZWN0fSBfdG91Y2hlcyAtIE1hcCBvZiBhbGwgY3VycmVudCB0b3VjaGVzXHJcblx0ICogQHByb3Age0NsYXNzfSBDYW52YXNCdXR0b24gLSBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBwcm9wIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBDb250cm9sbGFibGVDYW52YXMgaW1wbGVtZW50cyBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0dGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHRcdHRyYW5zOiBudW1iZXJbXSA9IFswLCAwXTtcclxuXHRcdHNjbDogbnVtYmVyW10gPSBbMSwgMV07XHJcblx0XHRwaW46IG51bWJlcltdOyAgLy9PQlNcclxuXHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXSA9IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGR5bmFtaWNUcmFuc0JvdW5kczogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRzY2xCb3VuZHM6IG51bWJlcltdID0gWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGluY2hFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGtleXNFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwYW5FbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTsgIC8vT0JTXHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7XHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlciA9IDgwMDtcclxuXHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdGtleWJpbmRzOiBLZXlCaW5kO1xyXG5cdFx0cHJpdmF0ZSBfem9vbUNoYW5nZWQ6IGJvb2xlYW5bXSA9IFtmYWxzZSwgZmFsc2VdO1xyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9wcmVzc2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9jbGt0aW1lOiBudW1iZXIgPSAwO1xyXG5cdFx0X2FkYXB0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdF9jb29yZGluYXRlczogbnVtYmVyW10gPSBbXTtcclxuXHRcdHByaXZhdGUgX3RvdWNoZXM6IG51bWJlcltdW10gPSBbXTtcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBfbGluZXBpeDogbnVtYmVyID0gMTA7XHJcblx0XHRzdGF0aWMgQ2FudmFzQnV0dG9uOiBDbGFzcztcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IHtcclxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhbnZhc1wiKVswXSxcclxuXHRcdFx0dHJhbnM6IFswLCAwXSxcclxuXHRcdFx0c2NsOiBbMSwgMV0sXHJcblx0XHRcdGRyYWdFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGluY2hFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0a2V5c0VuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRwYW5FbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0dGlsdEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRldmVudHNSZXZlcnNlZDogZmFsc2UsXHJcblx0XHRcdGR5bmFtaWNUcmFuc0JvdW5kczogdHJ1ZSxcclxuXHRcdFx0dXNlQnV0dG9uOiAxLFxyXG5cdFx0XHRzY2FsZU1vZGU6IDEsXHJcblx0XHRcdHRyYW5zU3BlZWQ6IDEsXHJcblx0XHRcdHNjbFNwZWVkOiAxLFxyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5OiAuMzUsXHJcblx0XHRcdGNsaWNrU2Vuc2l0aXZpdHk6IDgwMCxcclxuXHRcdFx0c2NsQm91bmRzOiBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XSxcclxuXHRcdFx0dHJhbnNCb3VuZHM6IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XSxcclxuXHRcdFx0X2FkYXB0czoge1xyXG5cdFx0XHRcdGRyYWc6IGZhbHNlLFxyXG5cdFx0XHRcdHBpbmNoOiBmYWxzZSxcclxuXHRcdFx0XHR3aGVlbDogZmFsc2UsXHJcblx0XHRcdFx0cGFuOiBmYWxzZSxcclxuXHRcdFx0XHR0aWx0OiBmYWxzZSxcclxuXHRcdFx0XHRjbGljazogZmFsc2VcclxuXHRcdFx0fSxcclxuXHRcdFx0d2dldHM6IG5ldyBTZXQoKVxyXG5cdFx0fTtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENvbnRyb2xsYWJsZUNhbnZhcyBjb25zdHJ1Y3RvclxyXG5cdFx0ICogQHBhcmFtIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnN9IG9wdHM/PUNvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cyAtIENvbnRyb2xsYWJsZUNhbnZhcyBPcHRpb25zXHJcblx0XHQgKiBAY29uc3RydWN0b3JcclxuXHRcdCAqL1xyXG5cdFx0Y29uc3RydWN0b3Iob3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0gQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKSB7XHJcblx0XHRcdGluaGVyaXQob3B0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKTtcclxuXHJcblx0XHRcdGlmICghKG9wdHMudGFyZ2V0IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1RDQU5WO1xyXG5cdFx0XHR9IGVsc2UgaWYgKFtvcHRzLnRyYW5zLCBvcHRzLnNjbCwgb3B0cy50cmFuc0JvdW5kcywgb3B0cy5zY2xCb3VuZHNdLnNvbWUoYXJyID0+ICEoYXJyIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IGFyci5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20oYXJyKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGluaGVyaXQob3B0cy5fYWRhcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMuX2FkYXB0cyk7ICAvL1BPU1NJQkxFIEVSUk9SXHJcblxyXG5cdFx0XHRpZiAob3B0cy5waW4gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG9wdHMucGluID0gW29wdHMudGFyZ2V0LndpZHRoIC8gMiwgb3B0cy50YXJnZXQuaGVpZ2h0IC8gMl07XHJcblx0XHRcdH0gZWxzZSBpZiAoIShvcHRzLnBpbiBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgb3B0cy5waW4ubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKG9wdHMucGluKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy50YXJnZXQgPSBvcHRzLnRhcmdldDtcclxuXHRcdFx0dGhpcy5jb250ZXh0ID0gdGhpcy50YXJnZXQuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdFx0XHR0aGlzLmtleWJpbmRzID0gbmV3IEtleUJpbmQodGhpcy50YXJnZXQsIG9wdHMua2V5c0VuYWJsZWQpO1xyXG5cclxuXHRcdFx0dGhpcy5fYWRhcHRzID0gPE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM+e307XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPSAhIW9wdHMuZHluYW1pY1RyYW5zQm91bmRzO1xyXG5cclxuXHRcdFx0dGhpcy5kcmFnRW5hYmxlZCA9ICEhb3B0cy5kcmFnRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5waW5jaEVuYWJsZWQgPSAhIW9wdHMucGluY2hFbmFibGVkO1xyXG5cdFx0XHR0aGlzLndoZWVsRW5hYmxlZCA9ICEhb3B0cy53aGVlbEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGFuRW5hYmxlZCA9ICEhb3B0cy5wYW5FbmFibGVkO1xyXG5cdFx0XHR0aGlzLnRpbHRFbmFibGVkID0gISFvcHRzLnRpbHRFbmFibGVkO1xyXG5cdFx0XHR0aGlzLmV2ZW50c1JldmVyc2VkID0gISFvcHRzLmV2ZW50c1JldmVyc2VkO1xyXG5cclxuXHRcdFx0dGhpcy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLl9jb29yZGluYXRlcyA9IFswLCAwXTtcclxuXHRcdFx0dGhpcy5fdG91Y2hlcyA9IFtdO1xyXG5cdFx0XHR0aGlzLl9tb2JpbGUgPSBDb250cm9sbGFibGVDYW52YXMuaXNNb2JpbGU7XHJcblx0XHRcdGlmICghQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4KSBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggPSBDb250cm9sbGFibGVDYW52YXMubGluZVRvUGl4O1xyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy50YXJnZXQsIFwiX2NjX1wiLCB7XHJcblx0XHRcdFx0dmFsdWU6IHRoaXMsXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0d3JpdGFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG5cdFx0XHR9KTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Z2V0IHJhdGlvKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnRhcmdldC53aWR0aCAvIHRoaXMudGFyZ2V0LmhlaWdodDtcclxuXHRcdH0gLy9nLXJhdGlvICBPQlNcclxuXHRcdGdldCBtaW4oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWluKHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWluXHJcblx0XHRnZXQgbWF4KCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1heCh0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1heCAgT0JTXHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogRW5hYmxlIGNvbnRyb2xzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdGhhbmRsZSgpOiB2b2lkIHtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID8gdGhpcy5fbW9iaWxlQWRhcHQoKSA6IHRoaXMuX3BjQWRhcHQoKTtcclxuXHRcdH0gLy9oYW5kbGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQWRkICgvY3JlYXRlKSBhIHdpZGdldCBpbiB0aGUgY29udHJvbGxlclxyXG5cdFx0ICogQHBhcmFtIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9uc30gZGF0YSAtIGNvbnN0cnVjdG9yIG9wdGlvbnNcclxuXHRcdCAqIEByZXR1cm4ge0NvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b259IHRoZSB3aWRnZXRcclxuXHRcdCAqL1xyXG5cdFx0YWRkV2lkZ2V0KGRhdGE6IENhbnZhc0J1dHRvbiB8IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyk6IENhbnZhc0J1dHRvbiB7XHJcblx0XHRcdGlmIChkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uICYmICF0aGlzLndnZXRzLmhhcyhkYXRhKSkge1xyXG5cdFx0XHRcdGRhdGEucGFyZW50ID0gdGhpcztcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbikpIHtcclxuXHRcdFx0XHRkYXRhID0gbmV3IENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24oPE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucz5kYXRhKTtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRUlTQUxSO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiA8Q2FudmFzQnV0dG9uPmRhdGE7XHJcblx0XHR9IC8vYWRkV2lkZ2V0XHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogUmUtYXBwbHkgaW50ZXJuYWwgdHJhbnNmb3JtYXRpb25zXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcmV0dXJucyB7Q29udHJvbGxhYmxlQ2FudmFzfSB0aGlzIC0gRm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRyZXRyYW5zZm9ybSgpOiBUaGlzVHlwZTxDb250cm9sbGFibGVDYW52YXM+IHtcclxuXHRcdFx0dGhpcy5jb250ZXh0LnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTsgIC8vU0tFVy9ST1RBVEUgTk9UIElNUExFTUVOVEVEISFcclxuXHRcdFx0dGhpcy5jb250ZXh0LnRyYW5zbGF0ZSh0aGlzLnRyYW5zWzBdLCB0aGlzLnRyYW5zWzFdKTtcclxuXHRcdFx0dGhpcy5jb250ZXh0LnNjYWxlKHRoaXMuc2NsWzBdLCB0aGlzLnNjbFsxXSk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL3JldHJhbnNmb3JtXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBJbnRlcm1lZGlhdGUgdHJhbnNsYXRpb24gZnVuY3Rpb24gZm9yIGljb25pYyB0cmFuc2xhdGUgYmVmb3JlIHRoZSByZWFsXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geD0wIC0geCB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHk9MCAtIHkgdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWJzPz1mYWxzZSAtIGFic29sdXRlIHRyYW5zbGF0aW9uIG9yIHJlbGF0aXZlIHRvIGN1cnJlbnRcclxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJbXX0gUmV0dXJucyBjdXJyZW50IHRvdGFsIHRyYW5zbGF0aW9uXHJcblx0XHQgKi9cclxuXHRcdHRyYW5zbGF0ZSh4OiBudW1iZXIgPSAwLCB5OiBudW1iZXIgPSAwLCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzUmV2ZXJzZWQpIGJ5ID0gYnkubWFwKChiOiBudW1iZXIpOiBudW1iZXIgPT4gLWIpO1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50cmFucyA9IHRoaXMudHJhbnMubWFwKCh0cm46IG51bWJlciwgaWR4OiBudW1iZXIpOiBudW1iZXIgPT4gYm91bmQoTnVtYmVyKCFhYnMgPyAodHJuICsgYnlbaWR4XSkgOiBieVtpZHhdKSwgdGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPyB0aGlzLnRyYW5zQm91bmRzW2lkeF0gKiB0aGlzLnNjbFtpZHhdIDogdGhpcy50cmFuc0JvdW5kc1tpZHhdLCB0aGlzLmR5bmFtaWNUcmFuc0JvdW5kcyA/IHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0gKiB0aGlzLnNjbFtpZHhdIDogdGhpcy50cmFuc0JvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0fSAvL3RyYW5zbGF0ZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBJbnRlcm1lZGlhdGUgc2NhbGluZyBmdW5jdGlvbiBmb3IgaWNvbmljIHNjYWxlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MSAtIHggc2NhbGVcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PXggLSB5IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSBzY2FsZSBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCBzY2FsaW5nXHJcblx0XHQgKi9cclxuXHRcdHNjYWxlKHg6IG51bWJlciA9IDEsIHk6IG51bWJlciA9IHgsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRpZiAodGhpcy5ldmVudHNSZXZlcnNlZCkgYnkgPSBieS5tYXAoKGI6IG51bWJlcik6IG51bWJlciA9PiAtYik7XHJcblx0XHRcdGlmICghYWJzKSB7XHJcblx0XHRcdFx0bGV0IG5zY2w6IG51bWJlcltdID0gdGhpcy5zY2wubWFwKChzY2w6IG51bWJlciwgaWR4OiBudW1iZXIpOiBudW1iZXIgPT4gc2NsICogYnlbaWR4XSk7XHJcblx0XHRcdFx0bnNjbCA9IFtuc2NsWzBdIC0gdGhpcy5zY2xbMF0sIG5zY2xbMV0gLSB0aGlzLnNjbFsxXV07XHJcblx0XHRcdFx0dGhpcy5fem9vbUNoYW5nZWQgPSBbdGhpcy5zY2xbMF0gIT09IGJsb2NrKHRoaXMuc2NsWzBdLCB0aGlzLnNjbEJvdW5kc1swXSwgdGhpcy5zY2xCb3VuZHNbMl0sIG5zY2xbMF0pLCB0aGlzLnNjbFsxXSAhPT0gYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbCA9IFtibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBib3VuZCh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdKSwgdGhpcy5zY2xbMV0gIT09IGJvdW5kKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10pXTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChzY2wgKiBieVtpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vc2NhbGVcclxuXHJcblx0XHRwcml2YXRlIF9tb2JpbGVBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCEodGhpcy5fYWRhcHRzLmRyYWcgfHwgdGhpcy5fYWRhcHRzLnBpbmNoKSAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLl9hZGFwdHMucGluY2ggPSB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZU1vdmUoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIiwgKGU6IFRvdWNoRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQgJiYgdGhpcy50aWx0RW5hYmxlZCkge1xyXG5cdFx0XHRcdC8vVE9ET1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vX21vYmlsZUFkYXB0XHJcblx0XHRwcml2YXRlIF9wY0FkYXB0KCk6IHZvaWQge1xyXG5cdFx0XHRpZiAoISh0aGlzLl9hZGFwdHMuZHJhZyB8fCB0aGlzLl9hZGFwdHMuY2xpY2spICYmIHRoaXMuZHJhZ0VuYWJsZWQpIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMuX2FkYXB0cy5kcmFnID0gKGU6IE1vdXNlRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnUEMoZSwgdGhpcykpO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGU/OiBNb3VzZUV2ZW50KTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLl9jbGt0aW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0XHRcdHRoaXMuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMuX2FkYXB0cy5jbGljayA9IChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmNsaWNrUEMoZSwgdGhpcykpO1xyXG5cdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IHRoaXMuX2FkYXB0cy5jbGljayhlKSk7XHJcblx0XHRcdFx0aWYgKCh0aGlzLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZTogTW91c2VFdmVudCkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLndoZWVsICYmIHRoaXMud2hlZWxFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHRoaXMuX2FkYXB0cy53aGVlbCA9IChlOiBXaGVlbEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMud2hlZWwoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQgJiYgdGhpcy50aWx0RW5hYmxlZCkge1xyXG5cdFx0XHRcdC8vVE9ET1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vX3BjQWRhcHRcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBjbGlja1BDKGV2ZW50OiBNb3VzZUV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGlmIChEYXRlLm5vdygpIC0gY2MuX2Nsa3RpbWUgPD0gY2MuY2xpY2tTZW5zaXRpdml0eSkge1xyXG5cdFx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gWyhldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sIChldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV0sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpICYmIChyZXQgPSBidXR0LmNsaWNrKGNvb3JkcywgZXZlbnQpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gZmFsc2U7XHJcblx0XHR9IC8vY2xpY2tQQ1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0sXHJcblx0XHRcdFx0cmVsOiBudW1iZXJbXSA9IFtdLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY29vcmRzO1xyXG5cclxuXHRcdFx0LyppZiAoKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmICgoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpID09PSAyKSB8fCAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggPT09IDMpIHx8ICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uID09PSAyKSkpIHx8ICgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFQk9USCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRUJPVEggJiYgKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSAhPT0gMikgJiYgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoICE9PSAzKSAmJiAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMikpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9Ki9cclxuXHJcblx0XHRcdGlmIChjYy5fcHJlc3NlZCkgY2MuX2Nsa3RpbWUgPSAwO1xyXG5cclxuXHRcdFx0aWYgKChldmVudC5idXR0b25zICYgY2MudXNlQnV0dG9uKSAhPT0gZXZlbnQuYnV0dG9ucykge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl9wcmVzc2VkKSB7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKGV2ZW50Lm1vdmVtZW50WCAqIGNjLnRyYW5zU3BlZWQsIGV2ZW50Lm1vdmVtZW50WSAqIGNjLnRyYW5zU3BlZWQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKGxldCBidXR0IG9mIGNjLndnZXRzKSB7XHJcblx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24ocmVsID0gY29vcmRzLm1hcCgoYzogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gKGMgLSBjYy50cmFuc1tpZHhdKSAvIGNjLnNjbFtpZHhdKSkgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMocmVsKSk7XHJcblx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9kcmFnUENcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnTW9iaWxlTW92ZShldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVjayhhcnI6IG51bWJlcltdLCBjdXJyOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmIChhcnIuZXZlcnkoKGFyOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBNYXRoLmFicyhhciAtIGN1cnJbaWR4XSkgPj0gY2MudG91Y2hTZW5zaXRpdml0eSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH0gLy9jaGVja1xyXG5cdFx0XHRmdW5jdGlvbiBhcnJheW5nZSh0bGlzOiBUb3VjaExpc3QpOiBudW1iZXJbXVtdIHtcclxuXHRcdFx0XHRyZXR1cm4gW1t0bGlzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdGxpc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0sIFt0bGlzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdGxpc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF1dO1xyXG5cdFx0XHR9IC8vYXJyYXluZ2VcclxuXHRcdFx0ZnVuY3Rpb24gZXZlcnkodDogbnVtYmVyW11bXSwgbnQ6IG51bWJlcltdW10sIGFsbDogYm9vbGVhbiA9IGZhbHNlLCBvbmNlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuXHRcdFx0XHRsZXQgb3V0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGFsbCAmJiBjaGVjayh0WzBdLCBudFswXSkgJiYgY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGFsbCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFswXSwgbnRbMF0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSBvbmNlIHx8ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9IG9uY2UgfHwgIW91dDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdFx0fSAvL2V2ZXJ5XHJcblx0XHRcdGZ1bmN0aW9uIGluaChvbmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzWzBdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0XHRpZiAoIW9uZSkgY2MuX3RvdWNoZXNbMV0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHR9IC8vaW5oXHJcblxyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCAtIDFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCAtIDFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHJcblx0XHRcdGlmIChjYy5kcmFnRW5hYmxlZCAmJiBjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEpIHtcclxuXHRcdFx0XHRsZXQgY3A6IG51bWJlcltdID0gQXJyYXkuZnJvbShjYy50cmFucyksXHJcblx0XHRcdFx0XHRkaXM6IG51bWJlcjtcclxuXHRcdFx0XHRjYy50cmFuc2xhdGUoLi4uW2Nvb3Jkc1swXSAtIGNjLl9jb29yZGluYXRlc1swXSwgY29vcmRzWzFdIC0gY2MuX2Nvb3JkaW5hdGVzWzFdXS5tYXAoKHY6IG51bWJlcikgPT4gdiAqIGNjLnRyYW5zU3BlZWQpKTtcclxuXHRcdFx0XHRkaXMgPSBkaXN0KFtjcFswXSwgY2MudHJhbnNbMF1dLCBbY3BbMV0sIGNjLnRyYW5zWzFdXSk7XHJcblx0XHRcdFx0aWYgKGRpcyA+IGNjLnRvdWNoU2Vuc2l0aXZpdHkpIGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0XHRpbmgodHJ1ZSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoY2MucGluY2hFbmFibGVkICYmIGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVyeShhcnJheW5nZShldmVudC50YXJnZXRUb3VjaGVzKSwgY2MuX3RvdWNoZXMsIGZhbHNlLCB0cnVlKSkge1xyXG5cdFx0XHRcdGlmICgoY2Muc2NhbGVNb2RlICYgT3B0cy5TY2FsZU1vZGUuRlJFRVNDQUxFKSA9PT0gT3B0cy5TY2FsZU1vZGUuRlJFRVNDQUxFKSB7XHJcblx0XHRcdFx0XHRsZXQgaW5pZGlzdDogbnVtYmVyW10gPSBbTWF0aC5hYnMoY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSAtIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0pLCBNYXRoLmFicyhjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdIC0gY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXSldLFxyXG5cdFx0XHRcdFx0XHRkaXM6IG51bWJlcltdID0gW01hdGguYWJzKGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIDIgKiBjYy50YXJnZXQub2Zmc2V0TGVmdCksIE1hdGguYWJzKGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WSAtIDIgKiBjYy50YXJnZXQub2Zmc2V0VG9wKV0sXHJcblx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0ZDogbnVtYmVyW10gPSBbZGlzWzBdIC8gaW5pZGlzdFswXSwgZGlzWzFdIC8gaW5pZGlzdFsxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy5zY2xTcGVlZCksXHJcblx0XHRcdFx0XHRcdG50b3VjaGVzOiBudW1iZXJbXSA9IGl0b3VjaGVzLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAqICgxIC0gZFtpZHhdKSk7XHJcblxyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZFswXSkgY2MudHJhbnNsYXRlKG50b3VjaGVzWzBdKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWRbMV0pIGNjLnRyYW5zbGF0ZShudG91Y2hlc1sxXSk7XHJcblx0XHRcdFx0XHRjYy5zY2FsZShkWzBdLCBkWzFdKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0Ly9AdHMtaWdub3JlXHJcblx0XHRcdFx0XHRsZXQgaW5pZGlzdDogbnVtYmVyID0gZGlzdChbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXV0sIFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXSksXHJcblx0XHRcdFx0XHRcdGRpczogbnVtYmVyID0gZGlzdChbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0XSwgW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AsIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdKSxcclxuXHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0ubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpIC8gMiAtIGNjLnRyYW5zW2lkeF0pLFxyXG5cdFx0XHRcdFx0XHRkOiBudW1iZXIgPSBjYy5zY2xTcGVlZCAqIGRpcyAvIGluaWRpc3QsXHJcblx0XHRcdFx0XHRcdG50b3VjaGVzOiBudW1iZXJbXSA9IGl0b3VjaGVzLm1hcCgoaTogbnVtYmVyKSA9PiBpICogKDEgLSBkKSk7XHJcblxyXG5cdFx0XHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkLmV2ZXJ5KCh6bTogYm9vbGVhbik6IGJvb2xlYW4gPT4gem0pKSBjYy50cmFuc2xhdGUoLi4ubnRvdWNoZXMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpbmgoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY29vcmRzO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVNb3ZlXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnTW9iaWxlU3RhcnQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMsIGN1c3Q6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0aWYgKCFjdXN0KSB7XHJcblx0XHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiBjYy5fdG91Y2hlc1t0LmlkZW50aWZpZXJdID0gW3QuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSk7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0XHRjb29yZHMgPSBbKHRvdWNoLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdKSAvIGNjLnNjbFswXSwgKHRvdWNoLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV0pIC8gY2Muc2NsWzFdXTtcclxuXHJcblx0XHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKGNvb3JkcykpO1xyXG5cdFx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEpIHtcclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY2MuX3RvdWNoZXNbY2MuX3RvdWNoZXMubGVuZ3RoIC0gMV07XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fcHJlc3NlZCA9IHRydWU7XHJcblx0XHR9IC8vZHJhZ01vYmlsZVN0YXJ0XHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnTW9iaWxlRW5kKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSxcclxuXHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgdG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcclxuXHRcdFx0XHRjb29yZHMgPSBbKHRvdWNoLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdKSAvIGNjLnNjbFswXSwgKHRvdWNoLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV0pIC8gY2Muc2NsWzFdXTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3Jkcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxICYmIERhdGUubm93KCkgLSBjYy5fY2xrdGltZSA8PSBjYy5jbGlja1NlbnNpdGl2aXR5KSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzLCBldmVudCkpO1xyXG5cdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXMuc3BsaWNlKHQuaWRlbnRpZmllciwgMSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0aWYgKE9iamVjdC5rZXlzKGNjLl90b3VjaGVzKS5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZXZlbnQsIGNjLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSAhIWNjLl90b3VjaGVzLmxlbmd0aDtcclxuXHRcdH0gLy9kcmFnTW9iaWxlRW5kXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgd2hlZWwoZXZlbnQ6IFdoZWVsRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0bGV0IGQ6IG51bWJlciA9IDEgLSBjYy5zY2xTcGVlZCAqIENvbnRyb2xsYWJsZUNhbnZhcy5maXhEZWx0YShldmVudC5kZWx0YU1vZGUsIGV2ZW50LmRlbHRhWSkgLyBjYy5taW4sXHJcblx0XHRcdFx0Y29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV07XHJcblx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkLmV2ZXJ5KCh6bTogYm9vbGVhbik6IGJvb2xlYW4gPT4gem0pKSBjYy50cmFuc2xhdGUoLi4uY29vcmRzLm1hcCgoYzogbnVtYmVyKSA9PiBjICogKDEgLSBkKSkpO1xyXG5cdFx0fSAvL3doZWVsXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBHZXQgc2NyZWVuLWVxdWl2YWxlbnQgY29vcmRpbmF0ZXMgdGhhdCBieXBhc3MgdHJhbnNmb3JtYXRpb25zLlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfVxyXG5cdFx0ICovXHJcblx0XHRnZXRDb29yZHMoKTogbnVtYmVyW10ge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fY29vcmRpbmF0ZXMubWFwKChjOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IChjIC0gdGhpcy50cmFuc1tpZHhdKSAvIHRoaXMuc2NsW2lkeF0pO1xyXG5cdFx0fSAvL2dldENvb3Jkc1xyXG5cclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgaXNNb2JpbGUoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL3dlYk9TL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQYWQvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9pc01vYmlsZVxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBsaW5lVG9QaXgoKTogbnVtYmVyIHtcclxuXHRcdFx0bGV0IHI6IG51bWJlcixcclxuXHRcdFx0XHRpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuXHRcdFx0aWZyYW1lLnNyYyA9ICcjJztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRsZXQgaXdpbjogV2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3csXHJcblx0XHRcdFx0aWRvYzogRG9jdW1lbnQgPSBpd2luLmRvY3VtZW50O1xyXG5cdFx0XHRpZG9jLm9wZW4oKTtcclxuXHRcdFx0aWRvYy53cml0ZSgnPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PC9oZWFkPjxib2R5PjxwPmE8L3A+PC9ib2R5PjwvaHRtbD4nKTtcclxuXHRcdFx0aWRvYy5jbG9zZSgpO1xyXG5cdFx0XHRsZXQgc3BhbjogSFRNTEVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+aWRvYy5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG5cdFx0XHRyID0gc3Bhbi5vZmZzZXRIZWlnaHQ7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0cmV0dXJuIHI7XHJcblx0XHR9IC8vbGluZVRvUGl4XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZml4RGVsdGEobW9kZTogbnVtYmVyLCBkZWx0YVk6IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRcdGlmIChtb2RlID09PSAxKSB7XHJcblx0XHRcdFx0cmV0dXJuIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCAqIGRlbHRhWTtcclxuXHRcdFx0fSBlbHNlIGlmIChtb2RlID09PSAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZGVsdGFZO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZml4RGVsdGFcclxuXHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgY2xhc3MgdG8gY29udHJvbCBrZXlib2FyZCBldmVudHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgS2V5QmluZCB7XHJcblx0XHRwcmVzczogS2V5W10gPSBbXTtcclxuXHRcdGRvd246IEtleVtdID0gW107XHJcblx0XHR1cDogS2V5W10gPSBbXTtcclxuXHRcdGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG5cdFx0X2JvdW5kOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRhcnJvd01vdmVTcGVlZDogbnVtYmVyO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWR1cDogbnVtYmVyO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWRNYXg6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXBFbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcclxuXHRcdGFycm93QmluZGluZ3M6IHtcclxuXHRcdFx0W2tleTogc3RyaW5nXTogbnVtYmVyW107XHJcblx0XHR9ID0ge307XHJcblxyXG5cdFx0c3RhdGljIF9pZGNudHIgPSAwO1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkOiBudW1iZXIgPSA1O1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkdXA6IG51bWJlciA9IC41O1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXIgPSAyMDtcclxuXHRcdHN0YXRpYyBhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdHN0YXRpYyBhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHtcclxuXHRcdFx0XHRBcnJvd1VwOiBbMCwgMV0sXHJcblx0XHRcdFx0QXJyb3dEb3duOiBbMCwgLTFdLFxyXG5cdFx0XHRcdEFycm93TGVmdDogWzEsIDBdLFxyXG5cdFx0XHRcdEFycm93UmlnaHQ6IFstMSwgMF1cclxuXHRcdFx0fTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihlbGVtZW50OiBIVE1MRWxlbWVudCwgYmluZDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblx0XHRcdHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcblx0XHRcdE9iamVjdC5hc3NpZ24odGhpcy5hcnJvd0JpbmRpbmdzLCBLZXlCaW5kLmFycm93QmluZGluZ3MpO1xyXG5cdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkID0gS2V5QmluZC5hcnJvd01vdmVTcGVlZDtcclxuXHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZHVwID0gS2V5QmluZC5hcnJvd01vdmVTcGVlZHVwO1xyXG5cdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkTWF4ID0gS2V5QmluZC5hcnJvd01vdmVTcGVlZE1heDtcclxuXHRcdFx0YmluZCAmJiB0aGlzLmJpbmQoKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0c3RhdGljIGFycm93TW92ZShldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmICh0eXBlID09PSBcImtleWRvd25cIikge1xyXG5cdFx0XHRcdGV2ZW50LnRhcmdldFtcIl9jY19cIl0udHJhbnNsYXRlKHRoaXMuYXJyb3dNb3ZlU3BlZWQgKiB0aGlzLmFycm93QmluZGluZ3NbZXZlbnQua2V5XVswXSwgdGhpcy5hcnJvd01vdmVTcGVlZCAqIHRoaXMuYXJyb3dCaW5kaW5nc1tldmVudC5rZXldWzFdKTtcclxuXHRcdFx0XHRpZiAodGhpcy5hcnJvd01vdmVTcGVlZHVwRW5hYmxlZCkgdGhpcy5hcnJvd01vdmVTcGVlZCA9IGJvdW5kKHRoaXMuYXJyb3dNb3ZlU3BlZWQgKyB0aGlzLmFycm93TW92ZVNwZWVkdXAsIDAsIHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9hcnJvd01vdmVcclxuXHJcblx0XHRiaW5kQXJyb3dzKCk6IHZvaWQge1xyXG5cdFx0XHRmb3IgKGxldCBpIGluIHRoaXMuYXJyb3dCaW5kaW5ncykge1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXlkb3duKGksIEtleUJpbmQuYXJyb3dNb3ZlLmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXl1cChpLCBLZXlCaW5kLmFycm93TW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmJpbmRBcnJvd3MgPSAoKTogdm9pZCA9PiB7IH07XHJcblx0XHR9IC8vYmluZEFycm93c1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBrZXkgZXZlbnQgbGlzdGVuZXJzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuXHRcdCAqL1xyXG5cdFx0YmluZCgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9ib3VuZCkge1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXlwcmVzc1wiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5dXBcIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5ZG93blwiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fYm91bmQgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9iaW5kXHJcblxyXG5cdFx0X2hhbmRsZXIodHlwZTogc3RyaW5nLCBldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgaGFuZGxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzW3R5cGUucmVwbGFjZShcImtleVwiLCAnJyldLmZvckVhY2goKGtleTogS2V5KTogdm9pZCA9PiB7XHJcblx0XHRcdFx0aWYgKGtleS5rZXkgPT09IGV2ZW50LmtleSkge1xyXG5cdFx0XHRcdFx0aGFuZGxlZCA9ICFrZXkuY2FsbGJhY2soZXZlbnQsIHR5cGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBoYW5kbGVkO1xyXG5cdFx0fSAvL19oYW5kbGVyXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXlwcmVzcyhrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnByZXNzLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwicHJlc3NcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXByZXNzXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleWRvd24oa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy5kb3duLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwiZG93blwiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5ZG93blxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXl1cChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnVwLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwidXBcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXVwXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7S2V5fSBrZXlcclxuXHRcdCAqL1xyXG5cdFx0dW5yZWdpc3RlcihrZXk6IEtleSB8IG51bWJlciB8IHN0cmluZywgcmVwbDogS2V5KTogS2V5IHwgS2V5W10gfCBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwibnVtYmVyXCIpIHtcclxuXHRcdFx0XHRsZXQgaWR4OiBudW1iZXI7XHJcblx0XHRcdFx0aWYgKChpZHggPSB0aGlzLnByZXNzLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcmVzcy5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKChpZHggPSB0aGlzLmRvd24uZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvd24uc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICgoaWR4ID0gdGhpcy51cC5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMudXAuc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdHRoaXMucHJlc3MgPSB0aGlzLnByZXNzLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0XHR0aGlzLmRvd24gPSB0aGlzLmRvd24uZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHRcdHRoaXMudXAgPSB0aGlzLnVwLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpc1trZXkudHlwZV0uc3BsaWNlKHRoaXNba2V5LnR5cGVdLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkuaWQpLCAxLCByZXBsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3VucmVnaXN0ZXJcclxuXHR9IC8vS2V5QmluZFxyXG5cclxuXHQvKipcclxuXHQgKiBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBtZW1iZXJvZiBDb250cm9sbGFibGVDYW52YXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR4IC0gd2lkdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBkeSAtIGhlaWdodFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGluZGV4IC0gZXF1aXZhbGVudCB0byBDU1Mgei1pbmRleFxyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBDYW52YXNCdXR0b24gaW1wbGVtZW50cyBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMge1xyXG5cdFx0eDogbnVtYmVyID0gMDtcclxuXHRcdHk6IG51bWJlciA9IDA7XHJcblx0XHRkeDogbnVtYmVyID0gMDtcclxuXHRcdGR5OiBudW1iZXIgPSAwO1xyXG5cdFx0aW5kZXg6IG51bWJlciA9IC0xO1xyXG5cdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRfaWQ6IG51bWJlcjtcclxuXHRcdGVuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0cHN0YXRlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwb3NpdGlvbjogbnVtYmVyID0gMjtcclxuXHJcblx0XHRzdGF0aWMgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC4zO1xyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2lkY250cjogbnVtYmVyID0gMDtcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDYW52YXNCdXR0b25cclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IHtcclxuXHRcdFx0eDogMCxcclxuXHRcdFx0eTogMCxcclxuXHRcdFx0ZHg6IDAsXHJcblx0XHRcdGR5OiAwLFxyXG5cdFx0XHRpbmRleDogLTEsXHJcblx0XHRcdHBzdGF0ZTogZmFsc2UsXHJcblx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdHBvc2l0aW9uOiAyLFxyXG5cdFx0XHRwYXJlbnQ6IG5ldyBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdH07XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iob3B0czogT3B0cy5DYW52YXNCdXR0b25PcHRpb25zID0gQ2FudmFzQnV0dG9uLmRlZmF1bHRPcHRzKSB7ICAvL0RPVUJMRUNMSUNLLCBMT05HQ0xJQ0ssIERSQUcsIC4uLiBVU0VSLUlNUExFTUVOVEVEKD8pXHJcblx0XHRcdGluaGVyaXQob3B0cywgQ2FudmFzQnV0dG9uLmRlZmF1bHRPcHRzKTtcclxuXHJcblx0XHRcdGlmIChbb3B0cy54LCBvcHRzLnksIG9wdHMuZHgsIG9wdHMuZHksIG9wdHMucG9zaXRpb24sIG9wdHMuaW5kZXhdLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU07XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMueCA9IG9wdHMueCAqIDE7XHJcblx0XHRcdHRoaXMueSA9IG9wdHMueSAqIDE7XHJcblx0XHRcdHRoaXMuZHggPSBvcHRzLmR4ICogMTtcclxuXHRcdFx0dGhpcy5keSA9IG9wdHMuZHkgKiAxO1xyXG5cdFx0XHR0aGlzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiB8IDA7XHJcblx0XHRcdHRoaXMuaW5kZXggPSBvcHRzLmluZGV4IHwgMDtcclxuXHRcdFx0dGhpcy5lbmFibGVkID0gISFvcHRzLmVuYWJsZWQ7XHJcblx0XHRcdHRoaXMuX2lkID0gQ2FudmFzQnV0dG9uLl9pZGNudHIrKztcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZXhpdGVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGJsdXIoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9ibHVyXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBlbnRlcmVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGZvY3VzKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2ZvY3VzXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBjbGlja2VkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGNsaWNrKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vY2xpY2tcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGFib3ZlIHRoZSB3aWRnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyW119IHJlbGF0aXZlQ29vcmRzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdF9pc09uKHJlbGF0aXZlQ29vcmRzOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgeDogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLkZJWEVEKSA9PT0gT3B0cy5Qb3NpdGlvbi5GSVhFRCA/ICh0aGlzLnggLSB0aGlzLnBhcmVudC50cmFuc1swXSkgLyB0aGlzLnBhcmVudC5zY2xbMF0gOiB0aGlzLngsXHJcblx0XHRcdFx0eTogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLkZJWEVEKSA9PT0gT3B0cy5Qb3NpdGlvbi5GSVhFRCA/ICh0aGlzLnkgLSB0aGlzLnBhcmVudC50cmFuc1sxXSkgLyB0aGlzLnBhcmVudC5zY2xbMV0gOiB0aGlzLnksXHJcblx0XHRcdFx0ZHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFKSA9PT0gT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFID8gdGhpcy5keCAvIHRoaXMucGFyZW50LnNjbFswXSA6IHRoaXMuZHgsXHJcblx0XHRcdFx0ZHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFKSA9PT0gT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFID8gdGhpcy5keSAvIHRoaXMucGFyZW50LnNjbFsxXSA6IHRoaXMuZHksXHJcblx0XHRcdFx0b3V0OiBib29sZWFuID0gaXNXaXRoaW4oW3gsIHksIGR4LCBkeV0sIFtyZWxhdGl2ZUNvb3Jkc1swXSwgcmVsYXRpdmVDb29yZHNbMV1dLCBDYW52YXNCdXR0b24uc2Vuc2l0aXZpdHkpO1xyXG5cclxuXHRcdFx0aWYgKCFvdXQgJiYgdGhpcy5wc3RhdGUpIHtcclxuXHRcdFx0XHR0aGlzLmJsdXIocmVsYXRpdmVDb29yZHMpO1xyXG5cdFx0XHRcdHRoaXMucHN0YXRlID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vX2lzT25cclxuXHR9IC8vQ2FudmFzQnV0dG9uXHJcblxyXG5cdENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24gPSBDYW52YXNCdXR0b247XHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgY2xhc3Mgb2ZmZXJpbmcgbWF0aGVtYXRpY2FsIFZlY3RvciB1dGlsaXRpZXNcclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAY2xhc3NcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHByb3BzIC0gdmVjdG9yIHZlcnRpY2VzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIFZlY3RvciB7XHJcblx0XHRwcm9wczogbnVtYmVyW107XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocHJvcHM6IG51bWJlcltdID0gW10pIHtcclxuXHRcdFx0dGhpcy5wcm9wcyA9IEFycmF5LmZyb20ocHJvcHMubWFwKE51bWJlcikpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCBhIHZlY3RvciBvciBudW1iZXIgdG8gY3VycmVudCB2ZWN0b3JcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7VmVjdG9yfG51bWJlcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHN1YiAtIFNldCB0byBgLTFgIHRvIHN1YnN0cmFjdCBpbnN0ZWFkXHJcblx0XHQgKiBAcmV0dXJucyBgdGhpc2AgZm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRhZGQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBzdWI6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSArPSBzdWIgKiB0YXJnW2lkeF07XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZztcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9hZGRcclxuXHRcdC8qKlxyXG5cdFx0ICogTXVsdGlwbHkgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBkaXYgLSBTZXQgdG8gYC0xYCB0byBkaXZpZGUgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0bXVsdCh0YXJnOiBWZWN0b3IgfCBudW1iZXIsIGRpdjogbnVtYmVyID0gMSk6IFRoaXNUeXBlPFZlY3Rvcj4ge1xyXG5cdFx0XHRpZiAodGFyZyBpbnN0YW5jZW9mIFZlY3Rvcikge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICo9IE1hdGgucG93KHRhcmdbaWR4XSwgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnLCBkaXYpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL211bHRcclxuXHRcdC8qKlxyXG5cdFx0ICogRG90IHByb2R1Y3Qgb2YgMiB2ZWN0b3JzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHJldHVybnMgcHJvZHVjdFxyXG5cdFx0ICovXHJcblx0XHRkb3QodGFyZzogVmVjdG9yKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcHMucmVkdWNlKChhY2M6IG51bWJlciwgdmFsOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBhY2MgKyB2YWwgKiB0YXJnW2lkeF0pO1xyXG5cdFx0fSAvL2RvdFxyXG5cdH0gLy9WZWN0b3JcclxuXHJcblx0LyoqXHJcblx0ICogQHByb3Age0hUTUxFbGVtZW50W119IHJlc291cmNlcyAtIEFsbCBIVE1MIHJlc291cmNlIGVsZW1lbnRzIHdpdGggXCJsb2FkXCIgbGlzdGVuZXJzIHRoYXQgd2lsbCBiZSBsb2FkZWQuIGxpa2U6IGF1ZGlvL2ltZ1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRyZXNvdXJjZXM6IEhUTUxFbGVtZW50W10gPSBbXTtcclxuXHRcdF9sb2FkY250cjogbnVtYmVyID0gMDtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihyZXNvdXJjZXM6IEhUTUxFbGVtZW50W10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cdFx0XHR0aGlzLnJlc291cmNlcyA9IEFycmF5LmZyb20ocmVzb3VyY2VzKTtcclxuXHRcdFx0dGhpcy5sb2FkID0gb25sb2FkIHx8IHRoaXMubG9hZDtcclxuXHRcdFx0aWYgKGF1dG9iaW5kKSB0aGlzLmJpbmQodGhpcy5sb2FkKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBCaW5kIGxvYWQgZXZlbnRzIGFuZCBhd2FpdCBsb2FkZW5kXHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbmxvYWQ/IC0gY29kZSB0byBleGVjdXRlIG9uY2UgbG9hZGVkXHJcblx0XHQgKi9cclxuXHRcdGJpbmQob25sb2FkOiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcclxuXHRcdFx0aWYgKG9ubG9hZCkgdGhpcy5sb2FkID0gb25sb2FkO1xyXG5cdFx0XHR0aGlzLnJlc291cmNlcy5mb3JFYWNoKChyZXM6IEhUTUxFbGVtZW50KSA9PiB7XHJcblx0XHRcdFx0cmVzLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRcdGlmICgrK3RoaXMuX2xvYWRjbnRyID09PSB0aGlzLnJlc291cmNlcy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0dGhpcy5sb2FkKHJlcywgdGhpcy5fbG9hZGNudHIpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gLy9iaW5kXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0bG9hZChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcik6IHZvaWQgeyB9IC8vbG9hZFxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogTG9hZCBpbWFnZXMgYnkgVVJMc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmdbXX0gdXJsaXN0IC0gbGlzdCBvZiB1cmxzXHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbmxvYWQgLSBjYWxsYmFja1xyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhdXRvYmluZD10cnVlIC0gYXV0byBiaW5kXHJcblx0XHQgKiBAcmV0dXJucyB7UmVzb3VyY2VMb2FkZXJ9IHRoZSBsb2FkZXJcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGltYWdlcyh1cmxpc3Q6IHN0cmluZ1tdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gdHJ1ZSk6IFJlc291cmNlTG9hZGVyIHtcclxuXHRcdFx0bGV0IGltZ2xpc3Q6IEhUTUxJbWFnZUVsZW1lbnRbXSA9IFtdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgdXJsIG9mIHVybGlzdCkge1xyXG5cdFx0XHRcdGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuXHRcdFx0XHRpbWcuc3JjID0gdXJsO1xyXG5cdFx0XHRcdGltZ2xpc3QucHVzaChpbWcpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGltZ2xpc3QsIG9ubG9hZCwgYXV0b2JpbmQpO1xyXG5cdFx0fSAvL2ltYWdlc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBMb2FkIGF1ZGlvIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBhdWRpb3ModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBhdWRpb2xpc3Q6IEhUTUxBdWRpb0VsZW1lbnRbXSA9IFtdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgdXJsIG9mIHVybGlzdCkge1xyXG5cdFx0XHRcdGxldCBhdWRpbyA9IG5ldyBBdWRpbyh1cmwpO1xyXG5cdFx0XHRcdGF1ZGlvLmxvYWQoKTtcclxuXHRcdFx0XHRhdWRpb2xpc3QucHVzaChhdWRpbyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIoYXVkaW9saXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9hdWRpb3NcclxuXHR9IC8vUmVzb3VyY2VMb2FkZXJcclxuXHJcbn0gLy9DYW52YXNDb250cm9sc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2FudmFzQ29udHJvbHMuQ29udHJvbGxhYmxlQ2FudmFzO1xyXG4iXX0=