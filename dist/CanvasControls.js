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
            return this.trans = this.trans.map((trn, idx) => bound(Number(!abs ? (trn + by[idx]) : by[idx]), this.transBounds[idx], this.transBounds[idx + 2]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVILFlBQVksQ0FBQzs7QUFDYiwyQkFBeUI7QUFFekI7Ozs7R0FJRztBQUVIOzs7OztHQUtHO0FBQ0gsSUFBYyxjQUFjLENBK2pDM0I7QUEvakNELFdBQWMsY0FBYztJQUkzQjs7Ozs7Ozs7T0FRRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLFlBQXNCLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxJQUFZLEVBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pLLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQ25CLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsU0FBUztJQU5LLHNCQUFPLFVBTXRCLENBQUE7SUFDRDs7Ozs7Ozs7O09BU0c7SUFDSCxTQUFnQixLQUFLLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBWSxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsT0FBTztJQUZPLG9CQUFLLFFBRXBCLENBQUE7SUFDRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0IsS0FBSyxDQUFDLENBQVMs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Q0gsS0FBSyxDQUFDLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQyxFQUFFLE1BQWUsS0FBSztZQUN2RCxJQUFJLEVBQUUsR0FBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsY0FBYztnQkFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULElBQUksSUFBSSxHQUFhLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBVSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0wsT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pKO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekssT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJ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QyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDelAsR0FBRyxHQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQzNOLFFBQVEsR0FBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMxUixDQUFDLEdBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQzVGLFFBQVEsR0FBYSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRWpGLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckI7cUJBQU07b0JBQ04sWUFBWTtvQkFDWixJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDek8sR0FBRyxHQUFXLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQ2hQLFFBQVEsR0FBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFD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QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ3JILENBQUMsR0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDbEgsRUFBRSxHQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUM3SCxFQUFFLEdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQzdILEdBQUcsR0FBWSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFM0csSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQzthQUNwQjtZQUVELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDLE9BQU87TUFDUixjQUFjO0lBaEZSLHdCQUFXLEdBQVcsRUFBRSxDQUFDO0lBQ2pCLG9CQUFPLEdBQVcsQ0FBQyxDQUFDO0lBQ25DOzs7O09BSUc7SUFDSSx3QkFBVyxHQUE2QjtRQUM5QyxDQUFDLEVBQUUsQ0FBQztRQUNKLENBQUMsRUFBRSxDQUFDO1FBQ0osRUFBRSxFQUFFLENBQUM7UUFDTCxFQUFFLEVBQUUsQ0FBQztRQUNMLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDVCxNQUFNLEVBQUUsS0FBSztRQUNiLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLENBQUM7UUFDWCxNQUFNLEVBQUUsSUFBSSxrQkFBa0I7S0FDOUIsQ0FBQztJQTdCVSwyQkFBWSxlQTRGeEIsQ0FBQTtJQUVELGtCQUFrQixDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7SUFFL0M7Ozs7O09BS0c7SUFDSCxNQUFhLE1BQU07UUFHbEIsWUFBWSxRQUFrQixFQUFHO1lBQ2hDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLE1BQU07UUFFUjs7Ozs7O1dBTUc7UUFDSCxHQUFHLENBQUMsSUFBcUIsRUFBRSxNQUFjLENBQUM7WUFDekMsSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO2dCQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQyxDQUFDLENBQUMsQ0FBQzthQUNIO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBWSxFQUFFLEdBQVcsRUFBRSxFQUFFO29CQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLENBQUMsQ0FBQyxDQUFDO2FBQ0g7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxLQUFLO1FBQ1A7Ozs7OztXQU1HO1FBQ0gsSUFBSSxDQUFDLElBQXFCLEVBQUUsTUFBYyxDQUFDO1lBQzFDLElBQUksSUFBSSxZQUFZLE1BQU0sRUFBRTtnQkFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzdDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7aUJBQU07Z0JBQ04sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxNQUFNO1FBQ1I7Ozs7O1dBS0c7UUFDSCxHQUFHLENBQUMsSUFBWTtZQUNmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RixDQUFDLENBQUMsS0FBSztLQUNQLENBQUMsUUFBUTtJQXRERyxxQkFBTSxTQXNEbEIsQ0FBQTtJQUVEOztPQUVHO0lBQ0gsTUFBYSxjQUFjO1FBSTFCLFlBQVksU0FBd0IsRUFBRSxNQUFtRCxFQUFFLFdBQW9CLEtBQUs7WUFIcEgsY0FBUyxHQUFrQixFQUFHLENBQUM7WUFDL0IsY0FBUyxHQUFXLENBQUMsQ0FBQztZQUdyQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQztZQUNoQyxJQUFJLFFBQVE7Z0JBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDLE1BQU07UUFFUjs7O1dBR0c7UUFDSCxJQUFJLENBQUMsTUFBa0Q7WUFDdEQsSUFBSSxNQUFNO2dCQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1lBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBZ0IsRUFBRSxFQUFFO2dCQUMzQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEdBQVMsRUFBRTtvQkFDdkMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7d0JBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztxQkFDL0I7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxNQUFNO1FBQ1IsV0FBVztRQUNYLElBQUksQ0FBQyxHQUFpQixFQUFFLElBQWEsSUFBVSxDQUFDLENBQUMsTUFBTTtRQUV2RDs7Ozs7Ozs7V0FRRztRQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBZ0IsRUFBRSxNQUFtRCxFQUFFLFdBQW9CLElBQUk7WUFDNUcsSUFBSSxPQUFPLEdBQXVCLEVBQUcsQ0FBQztZQUV0QyxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sRUFBRTtnQkFDdkIsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNsQjtZQUVELE9BQU8sSUFBSSxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN0RCxDQUFDLENBQUMsUUFBUTtRQUNWOzs7Ozs7OztXQVFHO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFnQixFQUFFLE1BQW1ELEVBQUUsV0FBb0IsSUFBSTtZQUM1RyxJQUFJLFNBQVMsR0FBdUIsRUFBRyxDQUFDO1lBRXhDLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2dCQUN2QixJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNiLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEI7WUFFRCxPQUFPLElBQUksY0FBYyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLFFBQVE7S0FDVixDQUFDLGdCQUFnQjtJQW5FTCw2QkFBYyxpQkFtRTFCLENBQUE7QUFFRixDQUFDLEVBL2pDYSxjQUFjLEdBQWQsc0JBQWMsS0FBZCxzQkFBYyxRQStqQzNCLENBQUMsZ0JBQWdCO0FBRWxCLGtCQUFlLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIEFuZ2xlIGJldHdlZW4gMyBwb2lucyAoUmFkaWFucyk6XHJcbiAqIHBjOiBjZW50ZXIvcG9sZVxyXG4gKiBwbjogcG9pbnQgbmV3IGNvb3JkaW5hdGVzXHJcbiAqIHBwOiBwb2ludCBwYXN0IGNvb3JkaW5hdGVzXHJcbiAqIFxyXG4gKiBhdGFuMihwbnkgLSBwY3ksIHBueCAtIHBjeCkgLSBhdGFuMihwcHkgLSBwY3ksIHBweCAtIHBjeClcclxuICovXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuaW1wb3J0IFwiQGJhYmVsL3BvbHlmaWxsXCI7XHJcblxyXG4vKipcclxuICogQGZpbGUgQ2FudmFzQ29udHJvbHMudHNcclxuICogQGNvcHlyaWdodCBWYWxlbi4gSC4gMmsxOFxyXG4gKiBAYXV0aG9yIFZhbGVuLkguIDxhbHRlcm5hdGl2ZXh4eHlAZ21haWwuY29tPlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBUaGUgcm9vdCBvZiB0aGUgbWFpbiBsaWJyYXJ5XHJcbiAqIEBtb2R1bGUgQ2FudmFzQ29udHJvbHNcclxuICogQGxpY2Vuc2UgSVNDXHJcbiAqIEBnbG9iYWxcclxuICovXHJcbmV4cG9ydCBtb2R1bGUgQ2FudmFzQ29udHJvbHMge1xyXG5cclxuXHR0eXBlIENsYXNzID0geyBuZXcoLi4uYXJnczogYW55W10pOiBhbnk7IH07XHJcblxyXG5cdC8qKlxyXG5cdCAqIElmIGBkZXN0YCBsYWNrcyBhIHByb3BlcnR5IHRoYXQgYHRhcmdgIGhhcyB0aGVuIHRoYXQgcHJvcGVydHkgaXMgY29waWVkIGludG8gYGRlc3RgXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IGRlc3QgLSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGFyZyAtIGJhc2Ugb2JqZWN0XHJcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY29uZGl0aW9uIC0gaW5oZXJpdGFuY2UgY29uZGl0aW9uXHJcblx0ICogQHJldHVybnMge29iamVjdH0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGluaGVyaXQoZGVzdDoge30sIHRhcmc6IHt9LCBjb25kaXRpb246IEZ1bmN0aW9uID0gKGRlc3Q6IHt9LCB0YXJnOiB7fSwgcHJvcDogc3RyaW5nKTogYW55ID0+IGRlc3RbcHJvcF0gPT09IHVuZGVmaW5lZCAmJiAoZGVzdFtwcm9wXSA9IHRhcmdbcHJvcF0pKToge30ge1xyXG5cdFx0Zm9yIChsZXQgaSBpbiB0YXJnKSB7XHJcblx0XHRcdGNvbmRpdGlvbihkZXN0LCB0YXJnLCBpKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZGVzdDtcclxuXHR9IC8vaW5oZXJpdFxyXG5cdC8qKlxyXG5cdCAqIFJlc3RyaWN0IG51bWJlcidzIHJhbmdlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSB0YXJnZXQgbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gbWF4aW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gcD0wIC0gcHJlY2lzaW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIsIHA6IG51bWJlciA9IDApOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNICsgcCA/IE0gOiAobiA8IG0gLSBwID8gbSA6IG4pO1xyXG5cdH0gLy9ib3VuZFxyXG5cdC8qKlxyXG5cdCAqIERvd25zcGVlZCBpbmNyZW1lbnRhdGlvblxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG0gLSBtaW5pbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBNYXhpbXVtXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG9wIC0gb3BlcmF0aW9uXHJcblx0ICogQHJldHVybnMge251bWJlcn0gblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBibG9jayhuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBvcDogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdGlmIChuID4gTSAmJiBvcCA+IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPiBNKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtICYmIG9wIDwgMCkge1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH0gZWxzZSBpZiAobiA8IG0pIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9XHJcblx0fSAvL2Jsb2NrXHJcblx0LyoqXHJcblx0ICogQ2FsY3VsYXRlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBYcyAtIFggY29vcmRpbmF0ZXNcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBZcyAtIFkgY29vcmRpbmF0ZXNcclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBkaXN0YW5jZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBkaXN0KFhzOiBudW1iZXJbXSwgWXM6IG51bWJlcltdKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQoW1hzWzFdIC0gWHNbMF0sIFlzWzFdIC0gWXNbMF1dLm1hcCgodjogbnVtYmVyKSA9PiBNYXRoLnBvdyh2LCAyKSkucmVkdWNlKChhY2M6IG51bWJlciwgdjogbnVtYmVyKSA9PiBhY2MgKyB2KSk7XHJcblx0fSAvL2Rpc3RcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBpbnNpZGUgYW4gYXJlYVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IGJveCAtIHgseSxkeCxkeVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IHBvaW50IC0geCx5XHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHNlbnNpdGl2aXR5IC0gZXh0cmEgYm91bmRhcnlcclxuXHQgKiBAcmV0dXJucyBib29sZWFuXHJcblx0ICogQGlubmVyXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGlzV2l0aGluKGJveDogbnVtYmVyW10sIHBvaW50OiBudW1iZXJbXSwgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC41KTogYm9vbGVhbiB7XHJcblx0XHRyZXR1cm4gYm94WzBdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMF0gJiYgYm94WzBdICsgYm94WzJdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMF0gJiYgYm94WzFdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMV0gJiYgYm94WzFdICsgYm94WzNdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMV07XHJcblx0fSAvL2lzV2l0aGluXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgT3B0aW9uc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9wdHMge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoMSBmaW5nZXIgb25seSBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHRcdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdFx0ICogQG1lbWJlciB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0XHR0cmFucz86IG51bWJlcltdO1xyXG5cdFx0XHRzY2w/OiBudW1iZXJbXTtcclxuXHRcdFx0ZHJhZ0VuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwaW5jaEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR3aGVlbEVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRrZXlzRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBhbkVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR0aWx0RW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdGV2ZW50c1JldmVyc2VkPzogYm9vbGVhbjtcclxuXHRcdFx0dXNlQnV0dG9uPzogbnVtYmVyO1xyXG5cdFx0XHRzY2FsZU1vZGU/OiBudW1iZXI7XHJcblx0XHRcdHRyYW5zQm91bmRzPzogbnVtYmVyW107XHJcblx0XHRcdHNjbEJvdW5kcz86IG51bWJlcltdO1xyXG5cdFx0XHR0cmFuc1NwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHRzY2xTcGVlZD86IG51bWJlcjtcclxuXHRcdFx0dG91Y2hTZW5zaXRpdml0eT86IG51bWJlcjtcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eT86IG51bWJlcjtcclxuXHRcdFx0X2FkYXB0cz86IENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0XHR3Z2V0cz86IFNldDxDYW52YXNCdXR0b24+O1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnNcclxuXHRcdC8qKlxyXG5cdFx0ICogTTogbW9iaWxlXHJcblx0XHQgKiBQOiBwY1xyXG5cdFx0ICogTVA6IGJvdGhcclxuXHRcdCAqIFxyXG5cdFx0ICogZHJhZzpcclxuXHRcdCAqXHRQOiBtb3VzZSAgaG9sZCAmIG1vdmVcclxuXHRcdCAqXHRNOiB0b3VjaCAgaG9sZCAmIG1vdmVcclxuXHRcdCAqIHBpbmNoOlxyXG5cdFx0ICpcdHRvdWNoICAyLWZpbmdlciAmIG1vdmVcclxuXHRcdCAqIHdoZWVsOlxyXG5cdFx0ICpcdHdoZWVsICBtb3ZlICBbcGMgcGluY2gtZXF1aXZhbGVudF1cclxuXHRcdCAqIHBhbjpcclxuXHRcdCAqXHRkaXNwb3NpdGlvbiBmcm9tIGNlbnRlciBjYXVzZXMgY29uc3RhbnQgdHJhbnNsYXRpb25cclxuXHRcdCAqIHRpbHQ6XHJcblx0XHQgKlx0ZGV2aWNlbW90aW9uICBjYXVzZXMgcGFubmluZypcclxuXHRcdCAqXHRcclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnMge1xyXG5cdFx0XHRkcmFnOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHBpbmNoPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NXHJcblx0XHRcdHdoZWVsPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9QXHJcblx0XHRcdHBhbjogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHR0aWx0PzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRjbGljazogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzXHJcblx0XHQvKipcclxuXHRcdCAqIE9wdGlvbnMgb2YgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvblxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeCAtIHdpZGdldCB3aWR0aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeSAtIHdpZGdldCBoZWlnaHRcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gaW5kZXggLSB3aWRnZXQgZXZlbnQgcHJpb3JpdHlcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENhbnZhc0J1dHRvbk9wdGlvbnMge1xyXG5cdFx0XHR4OiBudW1iZXI7XHJcblx0XHRcdHk6IG51bWJlcjtcclxuXHRcdFx0ZHg6IG51bWJlcjtcclxuXHRcdFx0ZHk6IG51bWJlcjtcclxuXHRcdFx0aW5kZXg/OiBudW1iZXI7XHJcblx0XHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0XHRlbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cG9zaXRpb24/OiBudW1iZXI7XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ2FudmFzQnV0dG9uT3B0aW9uc1xyXG5cclxuXHRcdGV4cG9ydCBlbnVtIFVzZUJ1dHRvbiB7XHJcblx0XHRcdFVTRUxFRlQgPSAxLCBVU0VSSUdIVCwgVVNFQk9USFxyXG5cdFx0fSAvL1VzZUJ1dHRvblxyXG5cdFx0ZXhwb3J0IGVudW0gU2NhbGVNb2RlIHtcclxuXHRcdFx0Tk9STUFMID0gMSwgRlJFRVNDQUxFXHJcblx0XHR9IC8vU2NhbGVNb2RlXHJcblx0XHRleHBvcnQgZW51bSBQb3NpdGlvbiB7XHJcblx0XHRcdEZJWEVEID0gMSwgQUJTT0xVVEUsIFVOU0NBTEFCTEUgPSA0XHJcblx0XHR9IC8vUG9zaXRpb25cclxuXHR9IC8vT3B0c1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIGVycm9yc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIEVycm9ycyB7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENBTlY6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gSFRNTENhbnZhc0VsZW1lbnQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDVFg6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU1BUlIyOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEFycmF5IG9mIDItYXQtbGVhc3QgTnVtYmVycy5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTTogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIHZhbGlkIE51bWJlci5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRUlTQUxSOiBSZWZlcmVuY2VFcnJvciA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk9iamVjdCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO1xyXG5cdH0gLy9FcnJvcnNcclxuXHJcblx0LyoqXHJcblx0ICogVHlwZSBvZiBLZXlCaW5kXHJcblx0ICovXHJcblx0ZXhwb3J0IHR5cGUgS2V5ID0ge1xyXG5cdFx0a2V5OiBzdHJpbmc7XHJcblx0XHRjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW47XHJcblx0XHRpZDogbnVtYmVyO1xyXG5cdFx0dHlwZTogc3RyaW5nO1xyXG5cdH07XHJcblxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0ICogQHByb3Age251bWJlcltdfSBfY29vcmRpbmF0ZXMgLSBDdXJyZW50IGV2ZW50IGNvb3JkaW5hdGVzXHJcblx0ICogQHByb3Age251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0ICogQHByb3Age29iamVjdH0gX3RvdWNoZXMgLSBNYXAgb2YgYWxsIGN1cnJlbnQgdG91Y2hlc1xyXG5cdCAqIEBwcm9wIHtDbGFzc30gQ2FudmFzQnV0dG9uIC0gQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAcHJvcCB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cGluOiBudW1iZXJbXTsgIC8vT0JTXHJcblx0XHR0cmFuc0JvdW5kczogbnVtYmVyW10gPSBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRzY2xCb3VuZHM6IG51bWJlcltdID0gWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGluY2hFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGtleXNFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwYW5FbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTsgIC8vT0JTXHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7XHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlciA9IDgwMDtcclxuXHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdGtleWJpbmRzOiBLZXlCaW5kO1xyXG5cdFx0cHJpdmF0ZSBfem9vbUNoYW5nZWQ6IGJvb2xlYW5bXSA9IFtmYWxzZSwgZmFsc2VdO1xyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9wcmVzc2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9jbGt0aW1lOiBudW1iZXIgPSAwO1xyXG5cdFx0X2FkYXB0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdHByaXZhdGUgX2Nvb3JkaW5hdGVzOiBudW1iZXJbXSA9IFsgXTtcclxuXHRcdHByaXZhdGUgX3RvdWNoZXM6IG51bWJlcltdW10gPSBbIF07XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0c3RhdGljIENhbnZhc0J1dHRvbjogQ2xhc3M7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGRlZmF1bHRPcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSB7XHJcblx0XHRcdHRhcmdldDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjYW52YXNcIilbMF0sXHJcblx0XHRcdHRyYW5zOiBbMCwgMF0sXHJcblx0XHRcdHNjbDogWzEsIDFdLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHdoZWVsRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdGtleXNFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC4zNSxcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eTogODAwLFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWNrOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3Z2V0czogbmV3IFNldCgpXHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCEob3B0cy50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVENBTlY7XHJcblx0XHRcdH0gZWxzZSBpZiAoW29wdHMudHJhbnMsIG9wdHMuc2NsLCBvcHRzLnRyYW5zQm91bmRzLCBvcHRzLnNjbEJvdW5kc10uc29tZShhcnIgPT4gIShhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgYXJyLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShhcnIpLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW5oZXJpdChvcHRzLl9hZGFwdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cy5fYWRhcHRzKTsgIC8vUE9TU0lCTEUgRVJST1JcclxuXHJcblx0XHRcdGlmIChvcHRzLnBpbiA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0b3B0cy5waW4gPSBbb3B0cy50YXJnZXQud2lkdGggLyAyLCBvcHRzLnRhcmdldC5oZWlnaHQgLyAyXTtcclxuXHRcdFx0fSBlbHNlIGlmICghKG9wdHMucGluIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBvcHRzLnBpbi5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20ob3B0cy5waW4pLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xyXG5cdFx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLnRhcmdldC5nZXRDb250ZXh0KFwiMmRcIik7XHJcblx0XHRcdHRoaXMua2V5YmluZHMgPSBuZXcgS2V5QmluZCh0aGlzLnRhcmdldCwgb3B0cy5rZXlzRW5hYmxlZCk7XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLl9hZGFwdHMgPSA8T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycz57IH07XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHJcblx0XHRcdHRoaXMuZHJhZ0VuYWJsZWQgPSAhIW9wdHMuZHJhZ0VuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hFbmFibGVkID0gISFvcHRzLnBpbmNoRW5hYmxlZDtcclxuXHRcdFx0dGhpcy53aGVlbEVuYWJsZWQgPSAhIW9wdHMud2hlZWxFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBhbkVuYWJsZWQgPSAhIW9wdHMucGFuRW5hYmxlZDtcclxuXHRcdFx0dGhpcy50aWx0RW5hYmxlZCA9ICEhb3B0cy50aWx0RW5hYmxlZDtcclxuXHRcdFx0dGhpcy5ldmVudHNSZXZlcnNlZCA9ICEhb3B0cy5ldmVudHNSZXZlcnNlZDtcclxuXHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbIF07XHJcblx0XHRcdHRoaXMuX21vYmlsZSA9IENvbnRyb2xsYWJsZUNhbnZhcy5pc01vYmlsZTtcclxuXHRcdFx0aWYgKCFDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXgpIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCA9IENvbnRyb2xsYWJsZUNhbnZhcy5saW5lVG9QaXg7XHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLnRhcmdldCwgXCJfY2NfXCIsIHtcclxuXHRcdFx0XHR2YWx1ZTogdGhpcyxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3cml0YWJsZTogZmFsc2UsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlXHJcblx0XHRcdH0pO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHRnZXQgcmF0aW8oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMudGFyZ2V0LndpZHRoIC8gdGhpcy50YXJnZXQuaGVpZ2h0O1xyXG5cdFx0fSAvL2ctcmF0aW8gIE9CU1xyXG5cdFx0Z2V0IG1pbigpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5taW4odGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1taW5cclxuXHRcdGdldCBtYXgoKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWF4ICBPQlNcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBFbmFibGUgY29udHJvbHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqL1xyXG5cdFx0aGFuZGxlKCk6IHZvaWQge1xyXG5cdFx0XHR0aGlzLl9tb2JpbGUgPyB0aGlzLl9tb2JpbGVBZGFwdCgpIDogdGhpcy5fcGNBZGFwdCgpO1xyXG5cdFx0fSAvL2hhbmRsZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgKC9jcmVhdGUpIGEgd2lkZ2V0IGluIHRoZSBjb250cm9sbGVyXHJcblx0XHQgKiBAcGFyYW0ge0NvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b258T3B0cy5DYW52YXNCdXR0b25PcHRpb25zfSBkYXRhIC0gY29uc3RydWN0b3Igb3B0aW9uc1xyXG5cdFx0ICogQHJldHVybiB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbn0gdGhlIHdpZGdldFxyXG5cdFx0ICovXHJcblx0XHRhZGRXaWRnZXQoZGF0YTogQ2FudmFzQnV0dG9uIHwgT3B0cy5DYW52YXNCdXR0b25PcHRpb25zKTogQ2FudmFzQnV0dG9uIHtcclxuXHRcdFx0aWYgKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24gJiYgIXRoaXMud2dldHMuaGFzKGRhdGEpKSB7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoIShkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uKSkge1xyXG5cdFx0XHRcdGRhdGEgPSBuZXcgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbig8T3B0cy5DYW52YXNCdXR0b25PcHRpb25zPmRhdGEpO1xyXG5cdFx0XHRcdGRhdGEucGFyZW50ID0gdGhpcztcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FSVNBTFI7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIDxDYW52YXNCdXR0b24+ZGF0YTtcclxuXHRcdH0gLy9hZGRXaWRnZXRcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBSZS1hcHBseSBpbnRlcm5hbCB0cmFuc2Zvcm1hdGlvbnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtDb250cm9sbGFibGVDYW52YXN9IHRoaXMgLSBGb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdHJldHJhbnNmb3JtKCk6IFRoaXNUeXBlPENvbnRyb2xsYWJsZUNhbnZhcz4ge1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApOyAgLy9TS0VXL1JPVEFURSBOT1QgSU1QTEVNRU5URUQhIVxyXG5cdFx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKHRoaXMudHJhbnNbMF0sIHRoaXMudHJhbnNbMV0pO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5zY2xbMF0sIHRoaXMuc2NsWzFdKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vcmV0cmFuc2Zvcm1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSB0cmFuc2xhdGlvbiBmdW5jdGlvbiBmb3IgaWNvbmljIHRyYW5zbGF0ZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTAgLSB4IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT0wIC0geSB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgdHJhbnNsYXRpb24gb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgdHJhbnNsYXRpb25cclxuXHRcdCAqL1xyXG5cdFx0dHJhbnNsYXRlKHg6IG51bWJlciA9IDAsIHk6IG51bWJlciA9IDAsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRpZiAodGhpcy5ldmVudHNSZXZlcnNlZCkgYnkgPSBieS5tYXAoKGI6IG51bWJlcik6IG51bWJlciA9PiAtYik7XHJcblx0XHRcdHJldHVybiB0aGlzLnRyYW5zID0gdGhpcy50cmFucy5tYXAoKHRybjogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChOdW1iZXIoIWFicyA/ICh0cm4gKyBieVtpZHhdKSA6IGJ5W2lkeF0pLCB0aGlzLnRyYW5zQm91bmRzW2lkeF0sIHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgc2NhbGUgb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgc2NhbGluZ1xyXG5cdFx0ICovXHJcblx0XHRzY2FsZSh4OiBudW1iZXIgPSAxLCB5OiBudW1iZXIgPSB4LCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzUmV2ZXJzZWQpIGJ5ID0gYnkubWFwKChiOiBudW1iZXIpOiBudW1iZXIgPT4gLWIpO1xyXG5cdFx0XHRpZiAoIWFicykge1xyXG5cdFx0XHRcdGxldCBuc2NsOiBudW1iZXJbXSA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IHNjbCAqIGJ5W2lkeF0pO1xyXG5cdFx0XHRcdG5zY2wgPSBbbnNjbFswXSAtIHRoaXMuc2NsWzBdLCBuc2NsWzFdIC0gdGhpcy5zY2xbMV1dO1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgdGhpcy5zY2xbMV0gIT09IGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSBbYmxvY2sodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSwgbnNjbFswXSksIGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl96b29tQ2hhbmdlZCA9IFt0aGlzLnNjbFswXSAhPT0gYm91bmQodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSksIHRoaXMuc2NsWzFdICE9PSBib3VuZCh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdKV07XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMuc2NsID0gdGhpcy5zY2wubWFwKChzY2w6IG51bWJlciwgaWR4OiBudW1iZXIpOiBudW1iZXIgPT4gYm91bmQoc2NsICogYnlbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4XSwgdGhpcy5zY2xCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3NjYWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghKHRoaXMuX2FkYXB0cy5kcmFnIHx8IHRoaXMuX2FkYXB0cy5waW5jaCkgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5fYWRhcHRzLnBpbmNoID0gdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVNb3ZlKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCEodGhpcy5fYWRhcHRzLmRyYWcgfHwgdGhpcy5fYWRhcHRzLmNsaWNrKSAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5fY2xrdGltZSA9IERhdGUubm93KCk7XHJcblx0XHRcdFx0XHR0aGlzLl9wcmVzc2VkID0gdHJ1ZTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLl9hZGFwdHMuY2xpY2sgPSAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IENvbnRyb2xsYWJsZUNhbnZhcy5jbGlja1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgKGU/OiBNb3VzZUV2ZW50KTogdm9pZCA9PiB0aGlzLl9hZGFwdHMuY2xpY2soZSkpO1xyXG5cdFx0XHRcdGlmICgodGhpcy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSB0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGU6IE1vdXNlRXZlbnQpID0+IGUucHJldmVudERlZmF1bHQoKSwgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy53aGVlbCAmJiB0aGlzLndoZWVsRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB0aGlzLl9hZGFwdHMud2hlZWwgPSAoZTogV2hlZWxFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLndoZWVsKGUsIHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19wY0FkYXB0XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgY2xpY2tQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFsoZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAoZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dLFxyXG5cdFx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gZmFsc2U7XHJcblx0XHR9IC8vY2xpY2tQQ1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0sXHJcblx0XHRcdFx0cmVsOiBudW1iZXJbXSA9IFtdLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0Y2MuX2Nvb3JkaW5hdGVzID0gY29vcmRzO1xyXG5cclxuXHRcdFx0aWYgKCgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSA9PT0gMikgfHwgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoID09PSAzKSB8fCAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiA9PT0gMikpKSB8fCAoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRUJPVEgpICE9PSBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIICYmICgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgIT09IDIpICYmICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCAhPT0gMykgJiYgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gIT09IDIpKSkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl9wcmVzc2VkKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZShldmVudC5tb3ZlbWVudFggKiBjYy50cmFuc1NwZWVkLCBldmVudC5tb3ZlbWVudFkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKHJlbCA9IGNvb3Jkcy5tYXAoKGM6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IChjIC0gY2MudHJhbnNbaWR4XSkgLyBjYy5zY2xbaWR4XSkpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKHJlbCkpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZHJhZ1BDXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZU1vdmUoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2soYXJyOiBudW1iZXJbXSwgY3VycjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoYXJyLmV2ZXJ5KChhcjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gTWF0aC5hYnMoYXIgLSBjdXJyW2lkeF0pID49IGNjLnRvdWNoU2Vuc2l0aXZpdHkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9IC8vY2hlY2tcclxuXHRcdFx0ZnVuY3Rpb24gYXJyYXluZ2UodGxpczogVG91Y2hMaXN0KTogbnVtYmVyW11bXSB7XHJcblx0XHRcdFx0cmV0dXJuIFtbdGxpc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLCBbdGxpc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdXTtcclxuXHRcdFx0fSAvL2FycmF5bmdlXHJcblx0XHRcdGZ1bmN0aW9uIGV2ZXJ5KHQ6IG51bWJlcltdW10sIG50OiBudW1iZXJbXVtdLCBhbGw6IGJvb2xlYW4gPSBmYWxzZSwgb25jZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0bGV0IG91dCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChhbGwgJiYgY2hlY2sodFswXSwgbnRbMF0pICYmIGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChhbGwpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMF0sIG50WzBdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSBvbmNlIHx8ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHRcdH0gLy9ldmVyeVxyXG5cdFx0XHRmdW5jdGlvbiBpbmgob25lOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlc1swXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdFx0aWYgKCFvbmUpIGNjLl90b3VjaGVzWzFdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0fSAvL2luaFxyXG5cclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuZHJhZ0VuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0bGV0IGNwOiBudW1iZXJbXSA9IEFycmF5LmZyb20oY2MudHJhbnMpLFxyXG5cdFx0XHRcdFx0ZGlzOiBudW1iZXI7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLltjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0sIGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy50cmFuc1NwZWVkKSk7XHJcblx0XHRcdFx0ZGlzID0gZGlzdChbY3BbMF0sIGNjLnRyYW5zWzBdXSwgW2NwWzFdLCBjYy50cmFuc1sxXV0pO1xyXG5cdFx0XHRcdGlmIChkaXMgPiBjYy50b3VjaFNlbnNpdGl2aXR5KSBjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdFx0aW5oKHRydWUpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNjLnBpbmNoRW5hYmxlZCAmJiBjYy5fdG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzLCBmYWxzZSwgdHJ1ZSkpIHtcclxuXHRcdFx0XHRpZiAoKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkgPT09IE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkge1xyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlcltdID0gW01hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdKSwgTWF0aC5hYnMoY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSAtIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV0pXSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXJbXSA9IFtNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSAyICogY2MudGFyZ2V0Lm9mZnNldExlZnQpLCBNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSAyICogY2MudGFyZ2V0Lm9mZnNldFRvcCldLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlcltdID0gW2Rpc1swXSAvIGluaWRpc3RbMF0sIGRpc1sxXSAvIGluaWRpc3RbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2Muc2NsU3BlZWQpLFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgKiAoMSAtIGRbaWR4XSkpO1xyXG5cclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWRbMF0pIGNjLnRyYW5zbGF0ZShudG91Y2hlc1swXSk7XHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkWzFdKSBjYy50cmFuc2xhdGUobnRvdWNoZXNbMV0pO1xyXG5cdFx0XHRcdFx0Y2Muc2NhbGUoZFswXSwgZFsxXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlciA9IGRpc3QoW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF1dLCBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0pLFxyXG5cdFx0XHRcdFx0XHRkaXM6IG51bWJlciA9IGRpc3QoW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdF0sIFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wLCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSksXHJcblx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0ZDogbnVtYmVyID0gY2Muc2NsU3BlZWQgKiBkaXMgLyBpbmlkaXN0LFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlcikgPT4gaSAqICgxIC0gZCkpO1xyXG5cclxuXHRcdFx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgIGNjLnRyYW5zbGF0ZSguLi5udG91Y2hlcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGluaCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ01vYmlsZU1vdmVcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRpZiAoIWN1c3QpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSxcclxuXHRcdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0QXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgodDogVG91Y2gpID0+IGNjLl90b3VjaGVzW3QuaWRlbnRpZmllcl0gPSBbdC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdKTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgdG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcclxuXHRcdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMoY29vcmRzKSk7XHJcblx0XHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjYy5fdG91Y2hlc1tjYy5fdG91Y2hlcy5sZW5ndGggLSAxXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gdHJ1ZTtcclxuXHRcdH0gLy9kcmFnTW9iaWxlU3RhcnRcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVFbmQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdLFxyXG5cdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCB0b3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG5cdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEgJiYgRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhjYy5fdG91Y2hlcykubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGV2ZW50LCBjYywgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHdoZWVsKGV2ZW50OiBXaGVlbEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGxldCBkOiBudW1iZXIgPSAxIC0gY2Muc2NsU3BlZWQgKiBDb250cm9sbGFibGVDYW52YXMuZml4RGVsdGEoZXZlbnQuZGVsdGFNb2RlLCBldmVudC5kZWx0YVkpIC8gY2MubWluLFxyXG5cdFx0XHRcdGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0sIGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV1dO1xyXG5cdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgY2MudHJhbnNsYXRlKC4uLmNvb3Jkcy5tYXAoKGM6IG51bWJlcikgPT4gYyAqICgxIC0gZCkpKTtcclxuXHRcdH0gLy93aGVlbFxyXG5cdFx0XHJcblx0XHRcclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBpc01vYmlsZSgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvd2ViT1MvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2lzTW9iaWxlXHJcblx0XHRcclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBsaW5lVG9QaXgoKTogbnVtYmVyIHtcclxuXHRcdFx0bGV0IHI6IG51bWJlcixcclxuXHRcdFx0XHRpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuXHRcdFx0aWZyYW1lLnNyYyA9ICcjJztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRsZXQgaXdpbjogV2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3csXHJcblx0XHRcdFx0aWRvYzogRG9jdW1lbnQgPSBpd2luLmRvY3VtZW50O1xyXG5cdFx0XHRpZG9jLm9wZW4oKTtcclxuXHRcdFx0aWRvYy53cml0ZSgnPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PC9oZWFkPjxib2R5PjxwPmE8L3A+PC9ib2R5PjwvaHRtbD4nKTtcclxuXHRcdFx0aWRvYy5jbG9zZSgpO1xyXG5cdFx0XHRsZXQgc3BhbjogSFRNTEVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+aWRvYy5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG5cdFx0XHRyID0gc3Bhbi5vZmZzZXRIZWlnaHQ7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0cmV0dXJuIHI7XHJcblx0XHR9IC8vbGluZVRvUGl4XHJcblx0XHRcclxuXHRcdHByaXZhdGUgc3RhdGljIGZpeERlbHRhKG1vZGU6IG51bWJlciwgZGVsdGFZOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAobW9kZSA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggKiBkZWx0YVk7XHJcblx0XHRcdH0gZWxzZSBpZiAobW9kZSA9PT0gMikge1xyXG5cdFx0XHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGRlbHRhWTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2ZpeERlbHRhXHJcblx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIHRvIGNvbnRyb2wga2V5Ym9hcmQgZXZlbnRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIEtleUJpbmQge1xyXG5cdFx0cHJlc3M6IEtleVtdID0gWyBdO1xyXG5cdFx0ZG93bjogS2V5W10gPSBbIF07XHJcblx0XHR1cDogS2V5W10gPSBbIF07XHJcblx0XHRlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHRcdF9ib3VuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWQ6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXA6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHsgfTtcclxuXHJcblx0XHRzdGF0aWMgX2lkY250ciA9IDA7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWQ6IG51bWJlciA9IDU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWR1cDogbnVtYmVyID0gLjU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWRNYXg6IG51bWJlciA9IDIwO1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkdXBFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0c3RhdGljIGFycm93QmluZGluZ3M6IHtcclxuXHRcdFx0W2tleTogc3RyaW5nXTogbnVtYmVyW107XHJcblx0XHR9ID0ge1xyXG5cdFx0XHRcdEFycm93VXA6IFswLCAxXSxcclxuXHRcdFx0XHRBcnJvd0Rvd246IFswLCAtMV0sXHJcblx0XHRcdFx0QXJyb3dMZWZ0OiBbMSwgMF0sXHJcblx0XHRcdFx0QXJyb3dSaWdodDogWy0xLCAwXVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBiaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLmFycm93QmluZGluZ3MsIEtleUJpbmQuYXJyb3dCaW5kaW5ncyk7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkdXAgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkdXA7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXggPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkTWF4O1xyXG5cdFx0XHRiaW5kICYmIHRoaXMuYmluZCgpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHRcdFxyXG5cdFx0c3RhdGljIGFycm93TW92ZShldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmICh0eXBlID09PSBcImtleWRvd25cIikge1xyXG5cdFx0XHRcdGV2ZW50LnRhcmdldFtcIl9jY19cIl0udHJhbnNsYXRlKHRoaXMuYXJyb3dNb3ZlU3BlZWQgKiB0aGlzLmFycm93QmluZGluZ3NbZXZlbnQua2V5XVswXSwgdGhpcy5hcnJvd01vdmVTcGVlZCAqIHRoaXMuYXJyb3dCaW5kaW5nc1tldmVudC5rZXldWzFdKTtcclxuXHRcdFx0XHRpZiAodGhpcy5hcnJvd01vdmVTcGVlZHVwRW5hYmxlZCkgdGhpcy5hcnJvd01vdmVTcGVlZCA9IGJvdW5kKHRoaXMuYXJyb3dNb3ZlU3BlZWQgKyB0aGlzLmFycm93TW92ZVNwZWVkdXAsIDAsIHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXgpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9hcnJvd01vdmVcclxuXHJcblx0XHRiaW5kQXJyb3dzKCk6IHZvaWQge1xyXG5cdFx0XHRmb3IgKGxldCBpIGluIHRoaXMuYXJyb3dCaW5kaW5ncykge1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXlkb3duKGksIEtleUJpbmQuYXJyb3dNb3ZlLmJpbmQodGhpcykpO1xyXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJLZXl1cChpLCBLZXlCaW5kLmFycm93TW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmJpbmRBcnJvd3MgPSAoKTogdm9pZCA9PiB7IH07XHJcblx0XHR9IC8vYmluZEFycm93c1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBrZXkgZXZlbnQgbGlzdGVuZXJzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuXHRcdCAqL1xyXG5cdFx0YmluZCgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9ib3VuZCkge1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXlwcmVzc1wiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5dXBcIiwgZXZlbnQpLCBmYWxzZSk7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4gPT4gdGhpcy5faGFuZGxlci5iaW5kKHRoaXMpKFwia2V5ZG93blwiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5fYm91bmQgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9iaW5kXHJcblxyXG5cdFx0X2hhbmRsZXIodHlwZTogc3RyaW5nLCBldmVudDogS2V5Ym9hcmRFdmVudCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgaGFuZGxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzW3R5cGUucmVwbGFjZShcImtleVwiLCAnJyldLmZvckVhY2goKGtleTogS2V5KTogdm9pZCA9PiB7XHJcblx0XHRcdFx0aWYgKGtleS5rZXkgPT09IGV2ZW50LmtleSkge1xyXG5cdFx0XHRcdFx0aGFuZGxlZCA9ICFrZXkuY2FsbGJhY2soZXZlbnQsIHR5cGUpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBoYW5kbGVkO1xyXG5cdFx0fSAvL19oYW5kbGVyXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXlwcmVzcyhrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnByZXNzLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwicHJlc3NcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXByZXNzXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleWRvd24oa2V5OiBzdHJpbmcsIGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbik6IEtleSB7XHJcblx0XHRcdGxldCBvdXQ6IEtleTtcclxuXHRcdFx0dGhpcy5kb3duLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwiZG93blwiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5ZG93blxyXG5cdFx0LyoqXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGNiKGV2ZW50KVxyXG5cdFx0ICogQHJldHVybnMge0tleX1cclxuXHRcdCAqL1xyXG5cdFx0cmVnaXN0ZXJLZXl1cChrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLnVwLnB1c2gob3V0ID0geyBrZXk6IGtleSwgY2FsbGJhY2s6IGNhbGxiYWNrLCBpZDogS2V5QmluZC5faWRjbnRyKyssIHR5cGU6IFwidXBcIiB9KTtcclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9yZWdpc3RlcktleXVwXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7S2V5fSBrZXlcclxuXHRcdCAqL1xyXG5cdFx0dW5yZWdpc3RlcihrZXk6IEtleSB8IG51bWJlciB8IHN0cmluZywgcmVwbDogS2V5KTogS2V5IHwgS2V5W10gfCBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwibnVtYmVyXCIpIHtcclxuXHRcdFx0XHRsZXQgaWR4OiBudW1iZXI7XHJcblx0XHRcdFx0aWYgKChpZHggPSB0aGlzLnByZXNzLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5wcmVzcy5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKChpZHggPSB0aGlzLmRvd24uZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRvd24uc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIGlmICgoaWR4ID0gdGhpcy51cC5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMudXAuc3BsaWNlKGlkeCwgMSwgcmVwbCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdHRoaXMucHJlc3MgPSB0aGlzLnByZXNzLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0XHR0aGlzLmRvd24gPSB0aGlzLmRvd24uZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHRcdHRoaXMudXAgPSB0aGlzLnVwLmZpbHRlcigoazogS2V5KTogYm9vbGVhbiA9PiBrLmtleSAhPT0ga2V5KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdGhpc1trZXkudHlwZV0uc3BsaWNlKHRoaXNba2V5LnR5cGVdLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkuaWQpLCAxLCByZXBsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3VucmVnaXN0ZXJcclxuXHR9IC8vS2V5QmluZFxyXG5cclxuXHQvKipcclxuXHQgKiBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBtZW1iZXJvZiBDb250cm9sbGFibGVDYW52YXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR4IC0gd2lkdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBkeSAtIGhlaWdodFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGluZGV4IC0gZXF1aXZhbGVudCB0byBDU1Mgei1pbmRleFxyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBDYW52YXNCdXR0b24gaW1wbGVtZW50cyBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMge1xyXG5cdFx0eDogbnVtYmVyID0gMDtcclxuXHRcdHk6IG51bWJlciA9IDA7XHJcblx0XHRkeDogbnVtYmVyID0gMDtcclxuXHRcdGR5OiBudW1iZXIgPSAwO1xyXG5cdFx0aW5kZXg6IG51bWJlciA9IC0xO1xyXG5cdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRfaWQ6IG51bWJlcjtcclxuXHRcdGVuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0cHN0YXRlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwb3NpdGlvbjogbnVtYmVyID0gMjtcclxuXHJcblx0XHRzdGF0aWMgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC4zO1xyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2lkY250cjogbnVtYmVyID0gMDtcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDYW52YXNCdXR0b25cclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IHtcclxuXHRcdFx0eDogMCxcclxuXHRcdFx0eTogMCxcclxuXHRcdFx0ZHg6IDAsXHJcblx0XHRcdGR5OiAwLFxyXG5cdFx0XHRpbmRleDogLTEsXHJcblx0XHRcdHBzdGF0ZTogZmFsc2UsXHJcblx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdHBvc2l0aW9uOiAyLFxyXG5cdFx0XHRwYXJlbnQ6IG5ldyBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdH07XHJcblxyXG5cdFx0Y29uc3RydWN0b3Iob3B0czogT3B0cy5DYW52YXNCdXR0b25PcHRpb25zID0gQ2FudmFzQnV0dG9uLmRlZmF1bHRPcHRzKSB7ICAvL0RPVUJMRUNMSUNLLCBMT05HQ0xJQ0ssIERSQUcsIC4uLiBVU0VSLUlNUExFTUVOVEVEKD8pXHJcblx0XHRcdGluaGVyaXQob3B0cywgQ2FudmFzQnV0dG9uLmRlZmF1bHRPcHRzKTtcclxuXHJcblx0XHRcdGlmIChbb3B0cy54LCBvcHRzLnksIG9wdHMuZHgsIG9wdHMuZHksIG9wdHMucG9zaXRpb24sIG9wdHMuaW5kZXhdLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU07XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHRoaXMueCA9IG9wdHMueCAqIDE7XHJcblx0XHRcdHRoaXMueSA9IG9wdHMueSAqIDE7XHJcblx0XHRcdHRoaXMuZHggPSBvcHRzLmR4ICogMTtcclxuXHRcdFx0dGhpcy5keSA9IG9wdHMuZHkgKiAxO1xyXG5cdFx0XHR0aGlzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbiB8IDA7XHJcblx0XHRcdHRoaXMuaW5kZXggPSBvcHRzLmluZGV4IHwgMDtcclxuXHRcdFx0dGhpcy5lbmFibGVkID0gISFvcHRzLmVuYWJsZWQ7XHJcblx0XHRcdHRoaXMuX2lkID0gQ2FudmFzQnV0dG9uLl9pZGNudHIrKztcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZXhpdGVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGJsdXIoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9ibHVyXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBlbnRlcmVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGZvY3VzKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2ZvY3VzXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBjbGlja2VkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGNsaWNrKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vY2xpY2tcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGFib3ZlIHRoZSB3aWRnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyW119IHJlbGF0aXZlQ29vcmRzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdF9pc09uKHJlbGF0aXZlQ29vcmRzOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRsZXQgeDogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLkZJWEVEKSA9PT0gT3B0cy5Qb3NpdGlvbi5GSVhFRCA/IHRoaXMueCAtIHRoaXMucGFyZW50LnRyYW5zWzBdIDogdGhpcy54LFxyXG5cdFx0XHRcdHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyB0aGlzLnkgLSB0aGlzLnBhcmVudC50cmFuc1sxXSA6IHRoaXMueSxcclxuXHRcdFx0XHRkeDogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUpID09PSBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUgPyB0aGlzLmR4ICogdGhpcy5wYXJlbnQuc2NsWzBdIDogdGhpcy5keCxcclxuXHRcdFx0XHRkeTogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUpID09PSBPcHRzLlBvc2l0aW9uLlVOU0NBTEFCTEUgPyB0aGlzLmR5ICogdGhpcy5wYXJlbnQuc2NsWzFdIDogdGhpcy5keSxcclxuXHRcdFx0XHRvdXQ6IGJvb2xlYW4gPSBpc1dpdGhpbihbeCwgeSwgZHgsIGR5XSwgW3JlbGF0aXZlQ29vcmRzWzBdLCByZWxhdGl2ZUNvb3Jkc1sxXV0sIENhbnZhc0J1dHRvbi5zZW5zaXRpdml0eSk7XHJcblxyXG5cdFx0XHRpZiAoIW91dCAmJiB0aGlzLnBzdGF0ZSkge1xyXG5cdFx0XHRcdHRoaXMuYmx1cihyZWxhdGl2ZUNvb3Jkcyk7XHJcblx0XHRcdFx0dGhpcy5wc3RhdGUgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdH0gLy9faXNPblxyXG5cdH0gLy9DYW52YXNCdXR0b25cclxuXHJcblx0Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbiA9IENhbnZhc0J1dHRvbjtcclxuXHJcblx0LyoqXHJcblx0ICogQSBjbGFzcyBvZmZlcmluZyBtYXRoZW1hdGljYWwgVmVjdG9yIHV0aWxpdGllc1xyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBjbGFzc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcHJvcHMgLSB2ZWN0b3IgdmVydGljZXNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgVmVjdG9yIHtcclxuXHRcdHByb3BzOiBudW1iZXJbXTtcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihwcm9wczogbnVtYmVyW10gPSBbIF0pIHtcclxuXHRcdFx0dGhpcy5wcm9wcyA9IEFycmF5LmZyb20ocHJvcHMubWFwKE51bWJlcikpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCBhIHZlY3RvciBvciBudW1iZXIgdG8gY3VycmVudCB2ZWN0b3JcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7VmVjdG9yfG51bWJlcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHN1YiAtIFNldCB0byBgLTFgIHRvIHN1YnN0cmFjdCBpbnN0ZWFkXHJcblx0XHQgKiBAcmV0dXJucyBgdGhpc2AgZm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRhZGQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBzdWI6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSArPSBzdWIgKiB0YXJnW2lkeF07XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZztcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9hZGRcclxuXHRcdC8qKlxyXG5cdFx0ICogTXVsdGlwbHkgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBkaXYgLSBTZXQgdG8gYC0xYCB0byBkaXZpZGUgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0bXVsdCh0YXJnOiBWZWN0b3IgfCBudW1iZXIsIGRpdjogbnVtYmVyID0gMSk6IFRoaXNUeXBlPFZlY3Rvcj4ge1xyXG5cdFx0XHRpZiAodGFyZyBpbnN0YW5jZW9mIFZlY3Rvcikge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICo9IE1hdGgucG93KHRhcmdbaWR4XSwgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnLCBkaXYpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL211bHRcclxuXHRcdC8qKlxyXG5cdFx0ICogRG90IHByb2R1Y3Qgb2YgMiB2ZWN0b3JzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHJldHVybnMgcHJvZHVjdFxyXG5cdFx0ICovXHJcblx0XHRkb3QodGFyZzogVmVjdG9yKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcHMucmVkdWNlKChhY2M6IG51bWJlciwgdmFsOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBhY2MgKyB2YWwgKiB0YXJnW2lkeF0pO1xyXG5cdFx0fSAvL2RvdFxyXG5cdH0gLy9WZWN0b3JcclxuXHJcblx0LyoqXHJcblx0ICogQHByb3Age0hUTUxFbGVtZW50W119IHJlc291cmNlcyAtIEFsbCBIVE1MIHJlc291cmNlIGVsZW1lbnRzIHdpdGggXCJsb2FkXCIgbGlzdGVuZXJzIHRoYXQgd2lsbCBiZSBsb2FkZWQuIGxpa2U6IGF1ZGlvL2ltZ1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRyZXNvdXJjZXM6IEhUTUxFbGVtZW50W10gPSBbIF07XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbIF07XHJcblxyXG5cdFx0XHRmb3IgKGxldCB1cmwgb2YgdXJsaXN0KSB7XHJcblx0XHRcdFx0bGV0IGltZyA9IG5ldyBJbWFnZSgpO1xyXG5cdFx0XHRcdGltZy5zcmMgPSB1cmw7XHJcblx0XHRcdFx0aW1nbGlzdC5wdXNoKGltZyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIoaW1nbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vaW1hZ2VzXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgYXVkaW8gYnkgVVJMc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmdbXX0gdXJsaXN0IC0gbGlzdCBvZiB1cmxzXHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbmxvYWQgLSBjYWxsYmFja1xyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhdXRvYmluZD10cnVlIC0gYXV0byBiaW5kXHJcblx0XHQgKiBAcmV0dXJucyB7UmVzb3VyY2VMb2FkZXJ9IHRoZSBsb2FkZXJcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGF1ZGlvcyh1cmxpc3Q6IHN0cmluZ1tdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gdHJ1ZSk6IFJlc291cmNlTG9hZGVyIHtcclxuXHRcdFx0bGV0IGF1ZGlvbGlzdDogSFRNTEF1ZGlvRWxlbWVudFtdID0gWyBdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgdXJsIG9mIHVybGlzdCkge1xyXG5cdFx0XHRcdGxldCBhdWRpbyA9IG5ldyBBdWRpbyh1cmwpO1xyXG5cdFx0XHRcdGF1ZGlvLmxvYWQoKTtcclxuXHRcdFx0XHRhdWRpb2xpc3QucHVzaChhdWRpbyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIoYXVkaW9saXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9hdWRpb3NcclxuXHR9IC8vUmVzb3VyY2VMb2FkZXJcclxuXHJcbn0gLy9DYW52YXNDb250cm9sc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2FudmFzQ29udHJvbHMuQ29udHJvbGxhYmxlQ2FudmFzO1xyXG4iXX0=