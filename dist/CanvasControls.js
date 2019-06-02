/*
 * Angle between 3 poins (Radians):
 * pc: center/pole
 * pn: point new coordinates
 * pp: point past coordinates
 *
 * atan2(pny - pcy, pnx - pcx) - atan2(ppy - pcy, ppx - pcx)
 */
/**
 * @todo Widget Dragging?
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
            this._isDragging = false;
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
                this.target.addEventListener("mousedown", (e) => ControllableCanvas.pressPC(e, this));
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
            event.preventDefault();
            if (Date.now() - cc._clktime <= cc.clickSensitivity) {
                let coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
                for (let butt of sorted) {
                    butt.enabled && butt._isOn(coords) && (ret = butt.click(coords, event));
                    if (ret)
                        break;
                }
            }
            let drags = Array.from(cc.wgets.values()).filter((butt) => butt._dragIgnited);
            for (let butt of drags) {
                butt.drag([0, 0]);
                butt._dragIgnited = false;
                cc._isDragging = false;
            }
            cc._clktime = 0;
            cc._pressed = false;
        } //clickPC
        static pressPC(event, cc) {
            event.preventDefault();
            cc._clktime = Date.now();
            cc._pressed = true;
            let coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
            for (let butt of sorted) {
                if (butt.enabled && butt._isOn(coords) && butt.isDraggable) {
                    cc._isDragging = true;
                    ret = butt.drag([0, 0]);
                }
                if (ret)
                    break;
            }
        } //pressPC
        static dragPC(event, cc) {
            event.preventDefault();
            let coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop], rel = [], ret = false;
            /*if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
                return;
            }*/
            if (cc._pressed)
                cc._clktime = 0;
            if ((event.buttons & cc.useButton) !== event.buttons) {
                return;
            }
            if (cc._pressed && !cc._isDragging) {
                cc.translate((coords[0] - cc._coordinates[0]) * cc.transSpeed, (coords[1] - cc._coordinates[1]) * cc.transSpeed);
            }
            for (let butt of cc.wgets) {
                if (butt.enabled && butt.isDraggable && butt._dragIgnited) {
                    let by = [(coords[0] - cc._coordinates[0]) * cc.transSpeed / cc.scl[0], (coords[1] - cc._coordinates[1]) * cc.transSpeed / cc.scl[1]];
                    cc._isDragging = true;
                    ret = butt.drag(by);
                    if (ret)
                        break;
                }
            }
            ret = null;
            cc._coordinates = coords;
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
        _isDragging: false,
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
            this.isDraggable = false;
            this._dragIgnited = false;
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
            this.isDraggable = !!opts.isDraggable;
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
        //@Override
        /**
         * @description OnDrag event (blocking).
         * @author V. H.
         * @date 2019-06-02
         * @param {[number, number]} by - coordinates
         * @returns {boolean}
         * @memberof CanvasButton
         */
        drag(by) {
            this._dragIgnited = true;
            return true;
        } //drag
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
        isDraggable: false,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVIOztHQUVHO0FBR0g7O0dBRUc7QUFFSCxZQUFZLENBQUM7O0FBQ2IsMkJBQXlCO0FBRXpCOzs7O0dBSUc7QUFFSDs7Ozs7R0FLRztBQUNILElBQWMsY0FBYyxDQXlxQzNCO0FBenFDRCxXQUFjLGNBQWM7SUFJM0I7Ozs7Ozs7O09BUUc7SUFDSCxTQUFnQixPQUFPLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxZQUFzQixDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsSUFBWSxFQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqSyxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNuQixTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLFNBQVM7SUFOSyxzQkFBTyxVQU10QixDQUFBO0lBQ0Q7Ozs7Ozs7OztPQVNHO0lBQ0gsU0FBZ0IsS0FBSyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUyxFQUFFLElBQVksQ0FBQztRQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQyxDQUFDLE9BQU87SUFGTyxvQkFBSyxRQUVwQixDQUFBO0lBQ0Q7Ozs7Ozs7T0FPRztJQUNI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QUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNMLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xKLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQzthQUNoQjtpQkFBTTtnQkFDTixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdB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S0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3pQLEdBQUcsR0FBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUMzTixRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDMVIsQ0FBQyxHQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUM1RixRQUFRLEdBQWEsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVqRixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckIsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2xEO3FCQUFNO29CQUNOLFlBQVk7b0JBQ1osSUFBSSxPQUFPLEdBQVcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3pPLEdBQUcsR0FBVyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUNoUCxRQUFRLEdBQWEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxF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QUMsR0FBRyxDQUFDLENBQUM7Z0JBQzNCLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDYixTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RCO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELENBQUMsQ0FBQyxRQUFRO0tBQ1YsQ0FBQyxnQkFBZ0I7SUFuRUwsNkJBQWMsaUJBbUUxQixDQUFBO0FBRUYsQ0FBQyxFQXpxQ2EsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUF5cUMzQixDQUFDLGdCQUFnQjtBQUVsQixrQkFBZSxjQUFjLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBBbmdsZSBiZXR3ZWVuIDMgcG9pbnMgKFJhZGlhbnMpOlxyXG4gKiBwYzogY2VudGVyL3BvbGVcclxuICogcG46IHBvaW50IG5ldyBjb29yZGluYXRlc1xyXG4gKiBwcDogcG9pbnQgcGFzdCBjb29yZGluYXRlc1xyXG4gKiBcclxuICogYXRhbjIocG55IC0gcGN5LCBwbnggLSBwY3gpIC0gYXRhbjIocHB5IC0gcGN5LCBwcHggLSBwY3gpXHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEB0b2RvIFdpZGdldCBEcmFnZ2luZz9cclxuICovXHJcblxyXG5cclxuLypcclxuICogY2VudGVyZWQgem9vbSBicmVha3Mgd2l0aCB0cmFuc0JvdW5kcyAtIG5vcm1hbC9hY2NlcHRhYmxlXHJcbiAqL1xyXG5cclxuXCJ1c2Ugc3RyaWN0XCI7XHJcbmltcG9ydCBcIkBiYWJlbC9wb2x5ZmlsbFwiO1xyXG5cclxuLyoqXHJcbiAqIEBmaWxlIENhbnZhc0NvbnRyb2xzLnRzXHJcbiAqIEBjb3B5cmlnaHQgVmFsZW4uIEguIDJrMThcclxuICogQGF1dGhvciBWYWxlbi5ILiA8YWx0ZXJuYXRpdmV4eHh5QGdtYWlsLmNvbT5cclxuICovXHJcblxyXG4vKipcclxuICogVGhlIHJvb3Qgb2YgdGhlIG1haW4gbGlicmFyeVxyXG4gKiBAbW9kdWxlIENhbnZhc0NvbnRyb2xzXHJcbiAqIEBsaWNlbnNlIElTQ1xyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG5leHBvcnQgbW9kdWxlIENhbnZhc0NvbnRyb2xzIHtcclxuXHJcblx0dHlwZSBDbGFzcyA9IHsgbmV3KC4uLmFyZ3M6IGFueVtdKTogYW55OyB9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJZiBgZGVzdGAgbGFja3MgYSBwcm9wZXJ0eSB0aGF0IGB0YXJnYCBoYXMgdGhlbiB0aGF0IHByb3BlcnR5IGlzIGNvcGllZCBpbnRvIGBkZXN0YFxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0IC0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICogQHBhcmFtIHtvYmplY3R9IHRhcmcgLSBiYXNlIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmRpdGlvbiAtIGluaGVyaXRhbmNlIGNvbmRpdGlvblxyXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBpbmhlcml0KGRlc3Q6IHt9LCB0YXJnOiB7fSwgY29uZGl0aW9uOiBGdW5jdGlvbiA9IChkZXN0OiB7fSwgdGFyZzoge30sIHByb3A6IHN0cmluZyk6IGFueSA9PiBkZXN0W3Byb3BdID09PSB1bmRlZmluZWQgJiYgKGRlc3RbcHJvcF0gPSB0YXJnW3Byb3BdKSk6IHt9IHtcclxuXHRcdGZvciAobGV0IGkgaW4gdGFyZykge1xyXG5cdFx0XHRjb25kaXRpb24oZGVzdCwgdGFyZywgaSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlc3Q7XHJcblx0fSAvL2luaGVyaXRcclxuXHQvKipcclxuXHQgKiBSZXN0cmljdCBudW1iZXIncyByYW5nZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gdGFyZ2V0IG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gTSAtIG1heGltdW0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IHA9MCAtIHByZWNpc2lvblxyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGJvdW5kIG51bWJlclxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBib3VuZChuOiBudW1iZXIsIG06IG51bWJlciwgTTogbnVtYmVyLCBwOiBudW1iZXIgPSAwKTogbnVtYmVyIHtcclxuXHRcdHJldHVybiBuID4gTSArIHAgPyBNIDogKG4gPCBtIC0gcCA/IG0gOiBuKTtcclxuXHR9IC8vYm91bmRcclxuXHQvKipcclxuXHQgKiBEb3duc3BlZWQgaW5jcmVtZW50YXRpb25cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbiAtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBNIC0gTWF4aW11bVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBvcCAtIG9wZXJhdGlvblxyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IG5cclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gYmxvY2sobjogbnVtYmVyLCBtOiBudW1iZXIsIE06IG51bWJlciwgb3A6IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRpZiAobiA+IE0gJiYgb3AgPiAwKSB7XHJcblx0XHRcdHJldHVybiBuO1xyXG5cdFx0fSBlbHNlIGlmIChuID4gTSkge1xyXG5cdFx0XHRyZXR1cm4gbiArIG9wO1xyXG5cdFx0fSBlbHNlIGlmIChuIDwgbSAmJiBvcCA8IDApIHtcclxuXHRcdFx0cmV0dXJuIG47XHJcblx0XHR9IGVsc2UgaWYgKG4gPCBtKSB7XHJcblx0XHRcdHJldHVybiBuICsgb3A7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gbiArIG9wO1xyXG5cdFx0fVxyXG5cdH0gLy9ibG9ja1xyXG5cdC8qKlxyXG5cdCAqIENhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWHMgLSBYIGNvb3JkaW5hdGVzXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gWXMgLSBZIGNvb3JkaW5hdGVzXHJcblx0ICogQHJldHVybnMge251bWJlcn0gZGlzdGFuY2VcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gZGlzdChYczogbnVtYmVyW10sIFlzOiBudW1iZXJbXSk6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFtYc1sxXSAtIFhzWzBdLCBZc1sxXSAtIFlzWzBdXS5tYXAoKHY6IG51bWJlcikgPT4gTWF0aC5wb3codiwgMikpLnJlZHVjZSgoYWNjOiBudW1iZXIsIHY6IG51bWJlcikgPT4gYWNjICsgdikpO1xyXG5cdH0gLy9kaXN0XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgaW5zaWRlIGFuIGFyZWFcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBib3ggLSB4LHksZHgsZHlcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBwb2ludCAtIHgseVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzZW5zaXRpdml0eSAtIGV4dHJhIGJvdW5kYXJ5XHJcblx0ICogQHJldHVybnMgYm9vbGVhblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqL1xyXG5cdGV4cG9ydCBmdW5jdGlvbiBpc1dpdGhpbihib3g6IG51bWJlcltdLCBwb2ludDogbnVtYmVyW10sIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNSk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIGJveFswXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzBdICYmIGJveFswXSArIGJveFsyXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzBdICYmIGJveFsxXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzFdICYmIGJveFsxXSArIGJveFszXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzFdO1xyXG5cdH0gLy9pc1dpdGhpblxyXG5cclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIE9wdGlvbnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBPcHRzIHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQSB3cmFwcGVyIGZvciB0aGUgdGFyZ2V0ZWQgY2FudmFzIGVsZW1lbnRcclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gdHJhbnM9MCwwIC0gVHJhbnNsYXRpb25cclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSBzY2w9MSwxIC0gU2NhbGluZ1xyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHJvdD0wLDAgLSBSb3RhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFuc0JvdW5kPS1JbmZpbml0eSwtSW5maW5pdHksSW5maW5pdHksSW5maW5pdHkgLSBNYXggdHJhbnNsYXRpb24gYm91bmRhcmllc1xyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IGR5bmFtaWNUcmFuc0JvdW5kcz10cnVlIC0gdHJhbnNCb3VuZHMgZGVwZW5kIG9uIHNjYWxpbmdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IGtleXNFbmFibGVkPWZhbHNlIC0gRW5hYmxlIGtleWFib3JkIGV2ZW50cyBsaXN0ZW5lclxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0XHQgKiBAbWVtYmVyIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHRcdHJlYWRvbmx5IHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRcdHRyYW5zPzogbnVtYmVyW107XHJcblx0XHRcdHNjbD86IG51bWJlcltdO1xyXG5cdFx0XHRkcmFnRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBpbmNoRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHdoZWVsRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdGtleXNFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cGFuRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHRpbHRFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VCdXR0b24/OiBudW1iZXI7XHJcblx0XHRcdHNjYWxlTW9kZT86IG51bWJlcjtcclxuXHRcdFx0dHJhbnNCb3VuZHM/OiBudW1iZXJbXTtcclxuXHRcdFx0c2NsQm91bmRzPzogbnVtYmVyW107XHJcblx0XHRcdHRyYW5zU3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdGR5bmFtaWNUcmFuc0JvdW5kcz86IGJvb2xlYW47XHJcblx0XHRcdHNjbFNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRfYWRhcHRzPzogQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRcdHdnZXRzPzogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBNOiBtb2JpbGVcclxuXHRcdCAqIFA6IHBjXHJcblx0XHQgKiBNUDogYm90aFxyXG5cdFx0ICogXHJcblx0XHQgKiBkcmFnOlxyXG5cdFx0ICpcdFA6IG1vdXNlICBob2xkICYgbW92ZVxyXG5cdFx0ICpcdE06IHRvdWNoICBob2xkICYgbW92ZVxyXG5cdFx0ICogcGluY2g6XHJcblx0XHQgKlx0dG91Y2ggIDItZmluZ2VyICYgbW92ZVxyXG5cdFx0ICogd2hlZWw6XHJcblx0XHQgKlx0d2hlZWwgIG1vdmUgIFtwYyBwaW5jaC1lcXVpdmFsZW50XVxyXG5cdFx0ICogcGFuOlxyXG5cdFx0ICpcdGRpc3Bvc2l0aW9uIGZyb20gY2VudGVyIGNhdXNlcyBjb25zdGFudCB0cmFuc2xhdGlvblxyXG5cdFx0ICogdGlsdDpcclxuXHRcdCAqXHRkZXZpY2Vtb3Rpb24gIGNhdXNlcyBwYW5uaW5nKlxyXG5cdFx0ICpcdFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycyB7XHJcblx0XHRcdGRyYWc6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0cGluY2g/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0d2hlZWw/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL1BcclxuXHRcdFx0cGFuOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHRpbHQ/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdGNsaWNrOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnNcclxuXHRcdC8qKlxyXG5cdFx0ICogT3B0aW9ucyBvZiBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geCAtIHggY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR4IC0gd2lkZ2V0IHdpZHRoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR5IC0gd2lkZ2V0IGhlaWdodFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBpbmRleCAtIHdpZGdldCBldmVudCBwcmlvcml0eVxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHRcdHg6IG51bWJlcjtcclxuXHRcdFx0eTogbnVtYmVyO1xyXG5cdFx0XHRkeDogbnVtYmVyO1xyXG5cdFx0XHRkeTogbnVtYmVyO1xyXG5cdFx0XHRpbmRleD86IG51bWJlcjtcclxuXHRcdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRcdGVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwb3NpdGlvbj86IG51bWJlcjtcclxuXHRcdFx0aXNEcmFnZ2FibGU/OiBib29sZWFuO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NhbnZhc0J1dHRvbk9wdGlvbnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEgsIFVTRVdIRUVMLCBVU0VBTEwgPSA3XHJcblx0XHR9IC8vVXNlQnV0dG9uXHJcblx0XHRleHBvcnQgZW51bSBTY2FsZU1vZGUge1xyXG5cdFx0XHROT1JNQUwgPSAxLCBGUkVFU0NBTEVcclxuXHRcdH0gLy9TY2FsZU1vZGVcclxuXHRcdGV4cG9ydCBlbnVtIFBvc2l0aW9uIHtcclxuXHRcdFx0RklYRUQgPSAxLCBBQlNPTFVURSwgVU5TQ0FMQUJMRSA9IDRcclxuXHRcdH0gLy9Qb3NpdGlvblxyXG5cdH0gLy9PcHRzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgZXJyb3JzXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ0FOVjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBIVE1MQ2FudmFzRWxlbWVudC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENUWDogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTUFSUjI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgMi1hdC1sZWFzdCBOdW1iZXJzLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgdmFsaWQgTnVtYmVyLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFSVNBTFI6IFJlZmVyZW5jZUVycm9yID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiT2JqZWN0IGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PQ0NBTlY6IFJlZmVyZW5jZUVycm9yID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiTm90IGEgQ29udHJvbGFibGVDYW52YXMgZWxlbWVudC5cIik7XHJcblx0fSAvL0Vycm9yc1xyXG5cclxuXHQvKipcclxuXHQgKiBUeXBlIG9mIEtleUJpbmRcclxuXHQgKi9cclxuXHRleHBvcnQgdHlwZSBLZXkgPSB7XHJcblx0XHRrZXk6IHN0cmluZztcclxuXHRcdGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuXHRcdGlkOiBudW1iZXI7XHJcblx0XHR0eXBlOiBzdHJpbmc7XHJcblx0fTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGR5bmFtaWNUcmFuc0JvdW5kcz10cnVlIC0gdHJhbnNCb3VuZHMgZGVwZW5kIG9uIHNjYWxpbmdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gZHJhZ0VuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZHJhZ1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoYm90aCBmaW5nZXJzIHNoYWxsIG1vdmUpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHdoZWVsRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIG1vdXNlIHdoZWVsXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGtleXNFbmFibGVkPWZhbHNlIC0gRW5hYmxlIGtleWFib3JkIGV2ZW50cyBsaXN0ZW5lclxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwYW5FbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIGJhc2VkIG9uIG1vdXNlL2ZpbmdlciBkaXN0YW5jZSBmcm9tIHBpbiAocHNldWRvLWNlbnRlcilcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0ICogQHByb3Age2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdCAqIEBwcm9wIHtPcHRzLlVzZUJ1dHRvbn0gdXNlQnV0dG9uPU9wdHMuVXNlQnV0dG9uLlVTRUxFRlQgLSBSZXNwb25kIHRvIGxlZnQtY2xpY2ssIHJpZ2h0IG9yIGJvdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IF9jb29yZGluYXRlcyAtIEN1cnJlbnQgZXZlbnQgY29vcmRpbmF0ZXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc30gX2FkYXB0cyAtIE1hcCBvZiBhbGwgY3VycmVudGx5IGF0dGFjaGVkIGNvbnRyb2wgZXZlbnQgYWRhcHRlcnNcclxuXHQgKiBAcHJvcCB7b2JqZWN0fSBfdG91Y2hlcyAtIE1hcCBvZiBhbGwgY3VycmVudCB0b3VjaGVzXHJcblx0ICogQHByb3Age0NsYXNzfSBDYW52YXNCdXR0b24gLSBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBwcm9wIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBDb250cm9sbGFibGVDYW52YXMgaW1wbGVtZW50cyBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0cmVhZG9ubHkgdGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdHJlYWRvbmx5IGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHRcdHRyYW5zOiBudW1iZXJbXSA9IFswLCAwXTtcclxuXHRcdHNjbDogbnVtYmVyW10gPSBbMSwgMV07XHJcblx0XHRwaW46IG51bWJlcltdOyAgLy9PQlNcclxuXHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXSA9IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGR5bmFtaWNUcmFuc0JvdW5kczogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRzY2xCb3VuZHM6IG51bWJlcltdID0gWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGluY2hFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGtleXNFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwYW5FbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTsgIC8vT0JTXHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7XHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlciA9IDgwMDtcclxuXHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdGtleWJpbmRzOiBLZXlCaW5kO1xyXG5cdFx0cHJpdmF0ZSBfem9vbUNoYW5nZWQ6IGJvb2xlYW5bXSA9IFtmYWxzZSwgZmFsc2VdO1xyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9wcmVzc2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9pc0RyYWdnaW5nOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9jbGt0aW1lOiBudW1iZXIgPSAwO1xyXG5cdFx0X2FkYXB0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdF9jb29yZGluYXRlczogbnVtYmVyW10gPSBbXTtcclxuXHRcdHByaXZhdGUgX3RvdWNoZXM6IG51bWJlcltdW10gPSBbXTtcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBfbGluZXBpeDogbnVtYmVyID0gMTA7XHJcblx0XHRzdGF0aWMgQ2FudmFzQnV0dG9uOiBDbGFzcztcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IHtcclxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhbnZhc1wiKVswXSxcclxuXHRcdFx0dHJhbnM6IFswLCAwXSxcclxuXHRcdFx0c2NsOiBbMSwgMV0sXHJcblx0XHRcdGRyYWdFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGluY2hFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0a2V5c0VuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRwYW5FbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0dGlsdEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRldmVudHNSZXZlcnNlZDogZmFsc2UsXHJcblx0XHRcdGR5bmFtaWNUcmFuc0JvdW5kczogdHJ1ZSxcclxuXHRcdFx0X2lzRHJhZ2dpbmc6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC4zNSxcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eTogODAwLFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWNrOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3Z2V0czogbmV3IFNldCgpXHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRwdWJsaWMgY29uc3RydWN0b3Iob3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0gQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKSB7XHJcblx0XHRcdGluaGVyaXQob3B0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKTtcclxuXHJcblx0XHRcdGlmICghKG9wdHMudGFyZ2V0IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1RDQU5WO1xyXG5cdFx0XHR9IGVsc2UgaWYgKFtvcHRzLnRyYW5zLCBvcHRzLnNjbCwgb3B0cy50cmFuc0JvdW5kcywgb3B0cy5zY2xCb3VuZHNdLnNvbWUoYXJyID0+ICEoYXJyIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IGFyci5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20oYXJyKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGluaGVyaXQob3B0cy5fYWRhcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMuX2FkYXB0cyk7ICAvL1BPU1NJQkxFIEVSUk9SXHJcblxyXG5cdFx0XHRpZiAob3B0cy5waW4gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG9wdHMucGluID0gW29wdHMudGFyZ2V0LndpZHRoIC8gMiwgb3B0cy50YXJnZXQuaGVpZ2h0IC8gMl07XHJcblx0XHRcdH0gZWxzZSBpZiAoIShvcHRzLnBpbiBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgb3B0cy5waW4ubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKG9wdHMucGluKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy50YXJnZXQgPSBvcHRzLnRhcmdldDtcclxuXHRcdFx0dGhpcy5jb250ZXh0ID0gdGhpcy50YXJnZXQuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdFx0XHR0aGlzLmtleWJpbmRzID0gbmV3IEtleUJpbmQodGhpcy50YXJnZXQsIG9wdHMua2V5c0VuYWJsZWQpO1xyXG5cclxuXHRcdFx0dGhpcy5fYWRhcHRzID0gPE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM+e307XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPSAhIW9wdHMuZHluYW1pY1RyYW5zQm91bmRzO1xyXG5cclxuXHRcdFx0dGhpcy5kcmFnRW5hYmxlZCA9ICEhb3B0cy5kcmFnRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5waW5jaEVuYWJsZWQgPSAhIW9wdHMucGluY2hFbmFibGVkO1xyXG5cdFx0XHR0aGlzLndoZWVsRW5hYmxlZCA9ICEhb3B0cy53aGVlbEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGFuRW5hYmxlZCA9ICEhb3B0cy5wYW5FbmFibGVkO1xyXG5cdFx0XHR0aGlzLnRpbHRFbmFibGVkID0gISFvcHRzLnRpbHRFbmFibGVkO1xyXG5cdFx0XHR0aGlzLmV2ZW50c1JldmVyc2VkID0gISFvcHRzLmV2ZW50c1JldmVyc2VkO1xyXG5cclxuXHRcdFx0dGhpcy5fcHJlc3NlZCA9IGZhbHNlO1xyXG5cdFx0XHR0aGlzLl9jb29yZGluYXRlcyA9IFswLCAwXTtcclxuXHRcdFx0dGhpcy5fdG91Y2hlcyA9IFtdO1xyXG5cdFx0XHR0aGlzLl9tb2JpbGUgPSBDb250cm9sbGFibGVDYW52YXMuaXNNb2JpbGU7XHJcblx0XHRcdGlmICghQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4KSBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggPSBDb250cm9sbGFibGVDYW52YXMubGluZVRvUGl4O1xyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy50YXJnZXQsIFwiX2NjX1wiLCB7XHJcblx0XHRcdFx0dmFsdWU6IHRoaXMsXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0d3JpdGFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG5cdFx0XHR9KTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Z2V0IHJhdGlvKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnRhcmdldC53aWR0aCAvIHRoaXMudGFyZ2V0LmhlaWdodDtcclxuXHRcdH0gLy9nLXJhdGlvICBPQlNcclxuXHRcdGdldCBtaW4oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWluKHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWluXHJcblx0XHRnZXQgbWF4KCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1heCh0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1heCAgT0JTXHJcblxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogRW5hYmxlIGNvbnRyb2xzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdGhhbmRsZSgpOiB2b2lkIHtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID8gdGhpcy5fbW9iaWxlQWRhcHQoKSA6IHRoaXMuX3BjQWRhcHQoKTtcclxuXHRcdH0gLy9oYW5kbGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQWRkICgvY3JlYXRlKSBhIHdpZGdldCBpbiB0aGUgY29udHJvbGxlclxyXG5cdFx0ICogQHBhcmFtIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9uc30gZGF0YSAtIGNvbnN0cnVjdG9yIG9wdGlvbnNcclxuXHRcdCAqIEByZXR1cm4ge0NvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b259IHRoZSB3aWRnZXRcclxuXHRcdCAqL1xyXG5cdFx0YWRkV2lkZ2V0KGRhdGE6IENhbnZhc0J1dHRvbiB8IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyk6IENhbnZhc0J1dHRvbiB7XHJcblx0XHRcdGlmIChkYXRhIGluc3RhbmNlb2YgQ2FudmFzQnV0dG9uICYmICF0aGlzLndnZXRzLmhhcyhkYXRhKSkge1xyXG5cdFx0XHRcdGRhdGEucGFyZW50ID0gdGhpcztcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbikpIHtcclxuXHRcdFx0XHRkYXRhID0gbmV3IENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24oPE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucz5kYXRhKTtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRUlTQUxSO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7ICAvL1NLRVcvUk9UQVRFIE5PVCBJTVBMRU1FTlRFRCEhXHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9yZXRyYW5zZm9ybVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHRyYW5zbGF0aW9uIGZ1bmN0aW9uIGZvciBpY29uaWMgdHJhbnNsYXRlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIHggdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSB5IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKTogbnVtYmVyID0+IC1iKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IGJvdW5kKE51bWJlcighYWJzID8gKHRybiArIGJ5W2lkeF0pIDogYnlbaWR4XSksIHRoaXMuZHluYW1pY1RyYW5zQm91bmRzID8gdGhpcy50cmFuc0JvdW5kc1tpZHhdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4XSwgdGhpcy5keW5hbWljVHJhbnNCb3VuZHMgPyB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdICogdGhpcy5zY2xbaWR4XSA6IHRoaXMudHJhbnNCb3VuZHNbaWR4ICsgMl0pKTtcclxuXHRcdH0gLy90cmFuc2xhdGVcclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHNjYWxpbmcgZnVuY3Rpb24gZm9yIGljb25pYyBzY2FsZSBiZWZvcmUgdGhlIHJlYWxcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB4PTEgLSB4IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geT14IC0geSBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhYnM/PWZhbHNlIC0gYWJzb2x1dGUgc2NhbGUgb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgc2NhbGluZ1xyXG5cdFx0ICovXHJcblx0XHRzY2FsZSh4OiBudW1iZXIgPSAxLCB5OiBudW1iZXIgPSB4LCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0aWYgKHRoaXMuZXZlbnRzUmV2ZXJzZWQpIGJ5ID0gYnkubWFwKChiOiBudW1iZXIpOiBudW1iZXIgPT4gLWIpO1xyXG5cdFx0XHRpZiAoIWFicykge1xyXG5cdFx0XHRcdGxldCBuc2NsOiBudW1iZXJbXSA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IHNjbCAqIGJ5W2lkeF0pO1xyXG5cdFx0XHRcdG5zY2wgPSBbbnNjbFswXSAtIHRoaXMuc2NsWzBdLCBuc2NsWzFdIC0gdGhpcy5zY2xbMV1dO1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgdGhpcy5zY2xbMV0gIT09IGJsb2NrKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10sIG5zY2xbMV0pXTtcclxuXHRcdFx0XHR0aGlzLnNjbCA9IFtibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLl96b29tQ2hhbmdlZCA9IFt0aGlzLnNjbFswXSAhPT0gYm91bmQodGhpcy5zY2xbMF0sIHRoaXMuc2NsQm91bmRzWzBdLCB0aGlzLnNjbEJvdW5kc1syXSksIHRoaXMuc2NsWzFdICE9PSBib3VuZCh0aGlzLnNjbFsxXSwgdGhpcy5zY2xCb3VuZHNbMV0sIHRoaXMuc2NsQm91bmRzWzNdKV07XHJcblx0XHRcdFx0dGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChzY2wgKiBieVtpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbDtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL3NjYWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghKHRoaXMuX2FkYXB0cy5kcmFnIHx8IHRoaXMuX2FkYXB0cy5waW5jaCkgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5fYWRhcHRzLnBpbmNoID0gdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVNb3ZlKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZTogVG91Y2hFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIChlOiBUb3VjaEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCEodGhpcy5fYWRhcHRzLmRyYWcgfHwgdGhpcy5fYWRhcHRzLmNsaWNrKSAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLnByZXNzUEMoZSwgdGhpcykpO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMuX2FkYXB0cy5jbGljayA9IChlPzogTW91c2VFdmVudCk6IHZvaWQgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmNsaWNrUEMoZSwgdGhpcykpO1xyXG5cdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLCAoZT86IE1vdXNlRXZlbnQpOiB2b2lkID0+IHRoaXMuX2FkYXB0cy5jbGljayhlKSk7XHJcblx0XHRcdFx0aWYgKCh0aGlzLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZTogTW91c2VFdmVudCkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLndoZWVsICYmIHRoaXMud2hlZWxFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHRoaXMuX2FkYXB0cy53aGVlbCA9IChlOiBXaGVlbEV2ZW50KTogdm9pZCA9PiBDb250cm9sbGFibGVDYW52YXMud2hlZWwoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQgJiYgdGhpcy50aWx0RW5hYmxlZCkge1xyXG5cdFx0XHRcdC8vVE9ET1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vX3BjQWRhcHRcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBjbGlja1BDKGV2ZW50OiBNb3VzZUV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFsoZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAoZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dLFxyXG5cdFx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMsIGV2ZW50KSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxldCBkcmFncyA9IEFycmF5LmZyb20oY2Mud2dldHMudmFsdWVzKCkpLmZpbHRlcigoYnV0dDogQ2FudmFzQnV0dG9uKTogYm9vbGVhbiA9PiBidXR0Ll9kcmFnSWduaXRlZCk7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBidXR0IG9mIGRyYWdzKSB7XHJcblx0XHRcdFx0YnV0dC5kcmFnKFsgMCwgMCBdKTtcclxuXHRcdFx0XHRidXR0Ll9kcmFnSWduaXRlZCA9IGZhbHNlO1xyXG5cdFx0XHRcdGNjLl9pc0RyYWdnaW5nID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdH0gLy9jbGlja1BDXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgcHJlc3NQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0Y2MuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRjYy5fcHJlc3NlZCA9IHRydWU7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFsoZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAoZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dLFxyXG5cdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdGlmIChidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpICYmIGJ1dHQuaXNEcmFnZ2FibGUpIHtcclxuXHRcdFx0XHRcdGNjLl9pc0RyYWdnaW5nID0gdHJ1ZTtcclxuXHRcdFx0XHRcdHJldCA9IGJ1dHQuZHJhZyhbMCwgMF0pO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9wcmVzc1BDXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ1BDKGV2ZW50OiBNb3VzZUV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSxcclxuXHRcdFx0XHRyZWw6IG51bWJlcltdID0gWyBdLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0XHRcdFxyXG5cdFx0XHQvKmlmICgoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKCgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgPT09IDIpIHx8ICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCA9PT0gMykgfHwgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gPT09IDIpKSkgfHwgKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmIChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFQk9USCAmJiAoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpICE9PSAyKSAmJiAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggIT09IDMpICYmICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uICE9PSAyKSkpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH0qL1xyXG5cclxuXHRcdFx0aWYgKGNjLl9wcmVzc2VkKSBjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoKGV2ZW50LmJ1dHRvbnMgJiBjYy51c2VCdXR0b24pICE9PSBldmVudC5idXR0b25zKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoY2MuX3ByZXNzZWQgJiYgIWNjLl9pc0RyYWdnaW5nKSB7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKChjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0pICogY2MudHJhbnNTcGVlZCwgKGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXSkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGlmIChidXR0LmVuYWJsZWQgJiYgYnV0dC5pc0RyYWdnYWJsZSAmJiBidXR0Ll9kcmFnSWduaXRlZCkge1xyXG5cdFx0XHRcdFx0bGV0IGJ5OiBbbnVtYmVyLCBudW1iZXJdID0gWyhjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0pICogY2MudHJhbnNTcGVlZCAvIGNjLnNjbFswXSwgKGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXSkgKiBjYy50cmFuc1NwZWVkIC8gY2Muc2NsWzFdXTtcclxuXHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0Y2MuX2lzRHJhZ2dpbmcgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRyZXQgPSBidXR0LmRyYWcoYnkpO1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHJldCA9IG51bGw7XHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHJcblx0XHRcdGZvciAobGV0IGJ1dHQgb2YgY2Mud2dldHMpIHtcclxuXHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihyZWwgPSBjb29yZHMubWFwKChjOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiAoYyAtIGNjLnRyYW5zW2lkeF0pIC8gY2Muc2NsW2lkeF0pKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhyZWwpKTtcclxuXHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2RyYWdQQ1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVNb3ZlKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrKGFycjogbnVtYmVyW10sIGN1cnI6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKGFyci5ldmVyeSgoYXI6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IE1hdGguYWJzKGFyIC0gY3VycltpZHhdKSA+PSBjYy50b3VjaFNlbnNpdGl2aXR5KSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSAvL2NoZWNrXHJcblx0XHRcdGZ1bmN0aW9uIGFycmF5bmdlKHRsaXM6IFRvdWNoTGlzdCk6IG51bWJlcltdW10ge1xyXG5cdFx0XHRcdHJldHVybiBbW3RsaXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSwgW3RsaXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0bGlzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXV07XHJcblx0XHRcdH0gLy9hcnJheW5nZVxyXG5cdFx0XHRmdW5jdGlvbiBldmVyeSh0OiBudW1iZXJbXVtdLCBudDogbnVtYmVyW11bXSwgYWxsOiBib29sZWFuID0gZmFsc2UsIG9uY2U6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGxldCBvdXQgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoYWxsICYmIGNoZWNrKHRbMF0sIG50WzBdKSAmJiBjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoYWxsKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzBdLCBudFswXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9IG9uY2UgfHwgIW91dDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0XHR9IC8vZXZlcnlcclxuXHRcdFx0ZnVuY3Rpb24gaW5oKG9uZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXNbMF0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHRcdGlmICghb25lKSBjYy5fdG91Y2hlc1sxXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdH0gLy9pbmhcclxuXHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cclxuXHRcdFx0aWYgKGNjLmRyYWdFbmFibGVkICYmIGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGxldCBjcDogbnVtYmVyW10gPSBBcnJheS5mcm9tKGNjLnRyYW5zKSxcclxuXHRcdFx0XHRcdGRpczogbnVtYmVyO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZSguLi5bY29vcmRzWzBdIC0gY2MuX2Nvb3JkaW5hdGVzWzBdLCBjb29yZHNbMV0gLSBjYy5fY29vcmRpbmF0ZXNbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2MudHJhbnNTcGVlZCkpO1xyXG5cdFx0XHRcdGRpcyA9IGRpc3QoW2NwWzBdLCBjYy50cmFuc1swXV0sIFtjcFsxXSwgY2MudHJhbnNbMV1dKTtcclxuXHRcdFx0XHRpZiAoZGlzID4gY2MudG91Y2hTZW5zaXRpdml0eSkgY2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGluaCh0cnVlKTtcclxuXHRcdFx0fSBlbHNlIGlmIChjYy5waW5jaEVuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID09PSAyICYmIGV2ZXJ5KGFycmF5bmdlKGV2ZW50LnRhcmdldFRvdWNoZXMpLCBjYy5fdG91Y2hlcywgZmFsc2UsIHRydWUpKSB7XHJcblx0XHRcdFx0aWYgKChjYy5zY2FsZU1vZGUgJiBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpID09PSBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpIHtcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXJbXSA9IFtNYXRoLmFicyhjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdIC0gY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSksIE1hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdKV0sXHJcblx0XHRcdFx0XHRcdGRpczogbnVtYmVyW10gPSBbTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRMZWZ0KSwgTWF0aC5hYnMoZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gMiAqIGNjLnRhcmdldC5vZmZzZXRUb3ApXSxcclxuXHRcdFx0XHRcdFx0aXRvdWNoZXM6IG51bWJlcltdID0gW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0ubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpIC8gMiAtIGNjLnRyYW5zW2lkeF0pLFxyXG5cdFx0XHRcdFx0XHRkOiBudW1iZXJbXSA9IFtkaXNbMF0gLyBpbmlkaXN0WzBdLCBkaXNbMV0gLyBpbmlkaXN0WzFdXS5tYXAoKHY6IG51bWJlcikgPT4gdiAqIGNjLnNjbFNwZWVkKSxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBpICogKDEgLSBkW2lkeF0pKTtcclxuXHJcblx0XHRcdFx0XHRjYy5zY2FsZShkWzBdLCBkWzFdKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWRbMF0pIGNjLnRyYW5zbGF0ZShudG91Y2hlc1swXSk7XHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkWzFdKSBjYy50cmFuc2xhdGUobnRvdWNoZXNbMV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXIgPSBkaXN0KFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dKSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXIgPSBkaXN0KFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlciA9IGNjLnNjbFNwZWVkICogZGlzIC8gaW5pZGlzdCxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIpID0+IGkgKiAoMSAtIGQpKTtcclxuXHJcblx0XHRcdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWQuZXZlcnkoKHptOiBib29sZWFuKTogYm9vbGVhbiA9PiB6bSkpIGNjLnRyYW5zbGF0ZSguLi5udG91Y2hlcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGluaCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ01vYmlsZU1vdmVcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRpZiAoIWN1c3QpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSxcclxuXHRcdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0QXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgodDogVG91Y2gpID0+IGNjLl90b3VjaGVzW3QuaWRlbnRpZmllcl0gPSBbdC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdKTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgdG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcclxuXHRcdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMoY29vcmRzKSk7XHJcblx0XHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjYy5fdG91Y2hlc1tjYy5fdG91Y2hlcy5sZW5ndGggLSAxXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gdHJ1ZTtcclxuXHRcdH0gLy9kcmFnTW9iaWxlU3RhcnRcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVFbmQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdLFxyXG5cdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCB0b3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG5cdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEgJiYgRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMsIGV2ZW50KSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0QXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgodDogVG91Y2gpID0+IHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlcy5zcGxpY2UodC5pZGVudGlmaWVyLCAxKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRpZiAoT2JqZWN0LmtleXMoY2MuX3RvdWNoZXMpLmxlbmd0aCA9PSAxKSB7XHJcblx0XHRcdFx0Q29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVTdGFydChldmVudCwgY2MsIHRydWUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fcHJlc3NlZCA9ICEhY2MuX3RvdWNoZXMubGVuZ3RoO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVFbmRcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyB3aGVlbChldmVudDogV2hlZWxFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRsZXQgZDogbnVtYmVyID0gMSAtIGNjLnNjbFNwZWVkICogQ29udHJvbGxhYmxlQ2FudmFzLmZpeERlbHRhKGV2ZW50LmRlbHRhTW9kZSwgZXZlbnQuZGVsdGFZKSAvIGNjLm1pbixcclxuXHRcdFx0XHRjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdLCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdXTtcclxuXHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWQuZXZlcnkoKHptOiBib29sZWFuKTogYm9vbGVhbiA9PiB6bSkpIGNjLnRyYW5zbGF0ZSguLi5jb29yZHMubWFwKChjOiBudW1iZXIpID0+IGMgKiAoMSAtIGQpKSk7XHJcblx0XHR9IC8vd2hlZWxcclxuXHJcblxyXG5cdFx0X2ZvcmNlRHJhZ1BDKCk6IHZvaWQgeyAgLy9PQlNcclxuXHRcdFx0bGV0IGZha2U6IE1vdXNlRXZlbnQgPSBuZXcgTW91c2VFdmVudChcIm1vdXNlbW92ZVwiLCB7XHJcblx0XHRcdFx0dmlldzogd2luZG93LFxyXG5cdFx0XHRcdGJ1YmJsZXM6IHRydWUsXHJcblx0XHRcdFx0Y2FuY2VsYWJsZTogZmFsc2UsXHJcblx0XHRcdFx0Y2xpZW50WDogdGhpcy5fY29vcmRpbmF0ZXNbMF0gKyB0aGlzLnRhcmdldC5vZmZzZXRMZWZ0LFxyXG5cdFx0XHRcdGNsaWVudFk6IHRoaXMuX2Nvb3JkaW5hdGVzWzFdICsgdGhpcy50YXJnZXQub2Zmc2V0VG9wLFxyXG5cdFx0XHRcdGJ1dHRvbnM6IHRoaXMudXNlQnV0dG9uLFxyXG5cdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdG1vdmVtZW50WDogMCxcclxuXHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRtb3ZlbWVudFk6IDBcclxuXHRcdFx0fSk7XHJcblx0XHRcdHRoaXMudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZmFrZSk7XHJcblx0XHR9IC8vX2ZvcmNlRHJhZ1BDXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBHZXQgc2NyZWVuLWVxdWl2YWxlbnQgY29vcmRpbmF0ZXMgdGhhdCBieXBhc3MgdHJhbnNmb3JtYXRpb25zLlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfVxyXG5cdFx0ICovXHJcblx0XHRnZXRDb29yZHMoKTogbnVtYmVyW10geyAgLy9PQlNcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2Nvb3JkaW5hdGVzLm1hcCgoYzogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiAoYyAtIHRoaXMudHJhbnNbaWR4XSkgLyB0aGlzLnNjbFtpZHhdKTtcclxuXHRcdH0gLy9nZXRDb29yZHNcclxuXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGlzTW9iaWxlKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC93ZWJPUy9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGFkL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBvZC9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9CbGFja0JlcnJ5L2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1dpbmRvd3MgUGhvbmUvaSlcclxuXHRcdFx0KSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vaXNNb2JpbGVcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgbGluZVRvUGl4KCk6IG51bWJlciB7XHJcblx0XHRcdGxldCByOiBudW1iZXIsXHJcblx0XHRcdFx0aWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcblx0XHRcdGlmcmFtZS5zcmMgPSAnIyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0bGV0IGl3aW46IFdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93LFxyXG5cdFx0XHRcdGlkb2M6IERvY3VtZW50ID0gaXdpbi5kb2N1bWVudDtcclxuXHRcdFx0aWRvYy5vcGVuKCk7XHJcblx0XHRcdGlkb2Mud3JpdGUoJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48cD5hPC9wPjwvYm9keT48L2h0bWw+Jyk7XHJcblx0XHRcdGlkb2MuY2xvc2UoKTtcclxuXHRcdFx0bGV0IHNwYW46IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50Pmlkb2MuYm9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxuXHRcdFx0ciA9IHNwYW4ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcblx0XHRcdHJldHVybiByO1xyXG5cdFx0fSAvL2xpbmVUb1BpeFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGZpeERlbHRhKG1vZGU6IG51bWJlciwgZGVsdGFZOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAobW9kZSA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggKiBkZWx0YVk7XHJcblx0XHRcdH0gZWxzZSBpZiAobW9kZSA9PT0gMikge1xyXG5cdFx0XHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGRlbHRhWTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2ZpeERlbHRhXHJcblx0fSAvL0NvbnRyb2xsYWJsZUNhbnZhc1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIHRvIGNvbnRyb2wga2V5Ym9hcmQgZXZlbnRzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIEtleUJpbmQge1xyXG5cdFx0cHJlc3M6IEtleVtdID0gW107XHJcblx0XHRkb3duOiBLZXlbXSA9IFtdO1xyXG5cdFx0dXA6IEtleVtdID0gW107XHJcblx0XHRyZWFkb25seSBlbGVtZW50OiBIVE1MRWxlbWVudDtcclxuXHRcdF9ib3VuZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWQ6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkdXA6IG51bWJlcjtcclxuXHRcdGFycm93TW92ZVNwZWVkTWF4OiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwRW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRhcnJvd0JpbmRpbmdzOiB7XHJcblx0XHRcdFtrZXk6IHN0cmluZ106IG51bWJlcltdO1xyXG5cdFx0fSA9IHsgfTtcclxuXHJcblx0XHRzdGF0aWMgX2lkY250ciA9IDA7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWQ6IG51bWJlciA9IDU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWR1cDogbnVtYmVyID0gLjU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWRNYXg6IG51bWJlciA9IDIwO1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkdXBFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0c3RhdGljIGFycm93QmluZGluZ3M6IHtcclxuXHRcdFx0W2tleTogc3RyaW5nXTogbnVtYmVyW107XHJcblx0XHR9ID0ge1xyXG5cdFx0XHRcdEFycm93VXA6IFswLCAxXSxcclxuXHRcdFx0XHRBcnJvd0Rvd246IFswLCAtMV0sXHJcblx0XHRcdFx0QXJyb3dMZWZ0OiBbMSwgMF0sXHJcblx0XHRcdFx0QXJyb3dSaWdodDogWy0xLCAwXVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBiaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLmFycm93QmluZGluZ3MsIEtleUJpbmQuYXJyb3dCaW5kaW5ncyk7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkdXAgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkdXA7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXggPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkTWF4O1xyXG5cdFx0XHRiaW5kICYmIHRoaXMuYmluZCgpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGUgPT09IFwia2V5ZG93blwiKSB7XHJcblx0XHRcdFx0ZXZlbnQudGFyZ2V0W1wiX2NjX1wiXS50cmFuc2xhdGUodGhpcy5hcnJvd01vdmVTcGVlZCAqIHRoaXMuYXJyb3dCaW5kaW5nc1tldmVudC5rZXldWzBdLCB0aGlzLmFycm93TW92ZVNwZWVkICogdGhpcy5hcnJvd0JpbmRpbmdzW2V2ZW50LmtleV1bMV0pO1xyXG5cdFx0XHRcdGV2ZW50LnRhcmdldFtcIl9jY19cIl0uX2ZvcmNlRHJhZ1BDKCk7XHJcblx0XHRcdFx0aWYgKHRoaXMuYXJyb3dNb3ZlU3BlZWR1cEVuYWJsZWQpIHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBib3VuZCh0aGlzLmFycm93TW92ZVNwZWVkICsgdGhpcy5hcnJvd01vdmVTcGVlZHVwLCAwLCB0aGlzLmFycm93TW92ZVNwZWVkTWF4KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkID0gS2V5QmluZC5hcnJvd01vdmVTcGVlZDtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vYXJyb3dNb3ZlXHJcblxyXG5cdFx0YmluZEFycm93cygpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLmVsZW1lbnRbXCJfY2NfXCJdKSB0aHJvdyBFcnJvcnMuRU5PQ0NBTlY7XHJcblx0XHRcdGZvciAobGV0IGkgaW4gdGhpcy5hcnJvd0JpbmRpbmdzKSB7XHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlcktleWRvd24oaSwgS2V5QmluZC5hcnJvd01vdmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlcktleXVwKGksIEtleUJpbmQuYXJyb3dNb3ZlLmJpbmQodGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuYmluZEFycm93cyA9ICgpOiB2b2lkID0+IHsgfTtcclxuXHRcdH0gLy9iaW5kQXJyb3dzXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBCaW5kIGtleSBldmVudCBsaXN0ZW5lcnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdFx0ICovXHJcblx0XHRiaW5kKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAoIXRoaXMuX2JvdW5kKSB7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleXByZXNzXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXl1cFwiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXlkb3duXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9ib3VuZCA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2JpbmRcclxuXHJcblx0XHRfaGFuZGxlcih0eXBlOiBzdHJpbmcsIGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBoYW5kbGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRcdHRoaXNbdHlwZS5yZXBsYWNlKFwia2V5XCIsICcnKV0uZm9yRWFjaCgoa2V5OiBLZXkpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRpZiAoa2V5LmtleSA9PT0gZXZlbnQua2V5KSB7XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gIWtleS5jYWxsYmFjayhldmVudCwgdHlwZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZWQ7XHJcblx0XHR9IC8vX2hhbmRsZXJcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleXByZXNzKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMucHJlc3MucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJwcmVzc1wiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5cHJlc3NcclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5ZG93bihrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLmRvd24ucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJkb3duXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXlkb3duXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleXVwKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMudXAucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJ1cFwiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5dXBcclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtLZXl9IGtleVxyXG5cdFx0ICovXHJcblx0XHR1bnJlZ2lzdGVyKGtleTogS2V5IHwgbnVtYmVyIHwgc3RyaW5nLCByZXBsOiBLZXkpOiBLZXkgfCBLZXlbXSB8IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJudW1iZXJcIikge1xyXG5cdFx0XHRcdGxldCBpZHg6IG51bWJlcjtcclxuXHRcdFx0XHRpZiAoKGlkeCA9IHRoaXMucHJlc3MuZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByZXNzLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoKGlkeCA9IHRoaXMuZG93bi5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG93bi5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKChpZHggPSB0aGlzLnVwLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy51cC5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0dGhpcy5wcmVzcyA9IHRoaXMucHJlc3MuZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHRcdHRoaXMuZG93biA9IHRoaXMuZG93bi5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdFx0dGhpcy51cCA9IHRoaXMudXAuZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzW2tleS50eXBlXS5zcGxpY2UodGhpc1trZXkudHlwZV0uZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleS5pZCksIDEsIHJlcGwpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vdW5yZWdpc3RlclxyXG5cdH0gLy9LZXlCaW5kXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQG1lbWJlcm9mIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0gZHggLSB3aWR0aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR5IC0gaGVpZ2h0XHJcblx0ICogQHByb3Age251bWJlcn0gaW5kZXggLSBlcXVpdmFsZW50IHRvIENTUyB6LWluZGV4XHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENhbnZhc0J1dHRvbiBpbXBsZW1lbnRzIE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHR4OiBudW1iZXIgPSAwO1xyXG5cdFx0eTogbnVtYmVyID0gMDtcclxuXHRcdGR4OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHk6IG51bWJlciA9IDA7XHJcblx0XHRpbmRleDogbnVtYmVyID0gLTE7XHJcblx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdF9pZDogbnVtYmVyO1xyXG5cdFx0ZW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRwc3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBvc2l0aW9uOiBudW1iZXIgPSAyO1xyXG5cdFx0aXNEcmFnZ2FibGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdF9kcmFnSWduaXRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdHN0YXRpYyBzZW5zaXRpdml0eTogbnVtYmVyID0gLjM7XHJcblx0XHRwcml2YXRlIHN0YXRpYyBfaWRjbnRyOiBudW1iZXIgPSAwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENhbnZhc0J1dHRvblxyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5DYW52YXNCdXR0b25PcHRpb25zID0ge1xyXG5cdFx0XHR4OiAwLFxyXG5cdFx0XHR5OiAwLFxyXG5cdFx0XHRkeDogMCxcclxuXHRcdFx0ZHk6IDAsXHJcblx0XHRcdGluZGV4OiAtMSxcclxuXHRcdFx0cHN0YXRlOiBmYWxzZSxcclxuXHRcdFx0ZW5hYmxlZDogdHJ1ZSxcclxuXHRcdFx0aXNEcmFnZ2FibGU6IGZhbHNlLFxyXG5cdFx0XHRwb3NpdGlvbjogMixcclxuXHRcdFx0cGFyZW50OiBuZXcgQ29udHJvbGxhYmxlQ2FudmFzXHJcblx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKG9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cykgeyAgLy9ET1VCTEVDTElDSywgTE9OR0NMSUNLLCBEUkFHLCAuLi4gVVNFUi1JTVBMRU1FTlRFRCg/KVxyXG5cdFx0XHRpbmhlcml0KG9wdHMsIENhbnZhc0J1dHRvbi5kZWZhdWx0T3B0cyk7XHJcblxyXG5cdFx0XHRpZiAoW29wdHMueCwgb3B0cy55LCBvcHRzLmR4LCBvcHRzLmR5LCBvcHRzLnBvc2l0aW9uLCBvcHRzLmluZGV4XS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGlzLnggPSBvcHRzLnggKiAxO1xyXG5cdFx0XHR0aGlzLnkgPSBvcHRzLnkgKiAxO1xyXG5cdFx0XHR0aGlzLmR4ID0gb3B0cy5keCAqIDE7XHJcblx0XHRcdHRoaXMuZHkgPSBvcHRzLmR5ICogMTtcclxuXHRcdFx0dGhpcy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb24gfCAwO1xyXG5cdFx0XHR0aGlzLmluZGV4ID0gb3B0cy5pbmRleCB8IDA7XHJcblx0XHRcdHRoaXMuZW5hYmxlZCA9ICEhb3B0cy5lbmFibGVkO1xyXG5cdFx0XHR0aGlzLmlzRHJhZ2dhYmxlID0gISFvcHRzLmlzRHJhZ2dhYmxlO1xyXG5cdFx0XHR0aGlzLl9pZCA9IENhbnZhc0J1dHRvbi5faWRjbnRyKys7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGV4aXRlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRibHVyKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vYmx1clxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZW50ZXJlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRmb2N1cyguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH0gLy9mb2N1c1xyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgY2xpY2tlZCBhbmQgZGVjaWRlcyB3aGV0aGVyIHRvIHByb3BhZ2F0ZVxyXG5cdFx0ICogQHBhcmFtIGFueVxyXG5cdFx0ICovXHJcblx0XHRjbGljayguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2NsaWNrXHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQGRlc2NyaXB0aW9uIE9uRHJhZyBldmVudCAoYmxvY2tpbmcpLlxyXG5cdFx0ICogQGF1dGhvciBWLiBILlxyXG5cdFx0ICogQGRhdGUgMjAxOS0wNi0wMlxyXG5cdFx0ICogQHBhcmFtIHtbbnVtYmVyLCBudW1iZXJdfSBieSAtIGNvb3JkaW5hdGVzXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuXHRcdCAqIEBtZW1iZXJvZiBDYW52YXNCdXR0b25cclxuXHRcdCAqL1xyXG5cdFx0ZHJhZyhieTogW251bWJlciwgbnVtYmVyXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHR0aGlzLl9kcmFnSWduaXRlZCA9IHRydWU7XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9kcmFnXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgcG9pbnRlciBpcyBhYm92ZSB0aGUgd2lkZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcltdfSByZWxhdGl2ZUNvb3Jkc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRfaXNPbihyZWxhdGl2ZUNvb3JkczogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy54IC0gdGhpcy5wYXJlbnQudHJhbnNbMF0pIC8gdGhpcy5wYXJlbnQuc2NsWzBdIDogdGhpcy54LFxyXG5cdFx0XHRcdHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyAodGhpcy55IC0gdGhpcy5wYXJlbnQudHJhbnNbMV0pIC8gdGhpcy5wYXJlbnQuc2NsWzFdIDogdGhpcy55LFxyXG5cdFx0XHRcdGR4OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHggLyB0aGlzLnBhcmVudC5zY2xbMF0gOiB0aGlzLmR4LFxyXG5cdFx0XHRcdGR5OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHkgLyB0aGlzLnBhcmVudC5zY2xbMV0gOiB0aGlzLmR5LFxyXG5cdFx0XHRcdG91dDogYm9vbGVhbiA9IGlzV2l0aGluKFt4LCB5LCBkeCwgZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSwgQ2FudmFzQnV0dG9uLnNlbnNpdGl2aXR5KTtcclxuXHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL19pc09uXHJcblx0fSAvL0NhbnZhc0J1dHRvblxyXG5cclxuXHRDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uID0gQ2FudmFzQnV0dG9uO1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIG9mZmVyaW5nIG1hdGhlbWF0aWNhbCBWZWN0b3IgdXRpbGl0aWVzXHJcblx0ICogQGlubmVyXHJcblx0ICogQGNsYXNzXHJcblx0ICogQHByb3Age251bWJlcltdfSBwcm9wcyAtIHZlY3RvciB2ZXJ0aWNlc1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBWZWN0b3Ige1xyXG5cdFx0cHJvcHM6IG51bWJlcltdO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHByb3BzOiBudW1iZXJbXSA9IFtdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHR9IC8vVmVjdG9yXHJcblxyXG5cdC8qKlxyXG5cdCAqIEBwcm9wIHtIVE1MRWxlbWVudFtdfSByZXNvdXJjZXMgLSBBbGwgSFRNTCByZXNvdXJjZSBlbGVtZW50cyB3aXRoIFwibG9hZFwiIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgbG9hZGVkLiBsaWtlOiBhdWRpby9pbWdcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0cmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcblx0XHRcdFx0aW1nLnNyYyA9IHVybDtcclxuXHRcdFx0XHRpbWdsaXN0LnB1c2goaW1nKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcihpbWdsaXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9pbWFnZXNcclxuXHRcdC8qKlxyXG5cdFx0ICogTG9hZCBhdWRpbyBieSBVUkxzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ1tdfSB1cmxpc3QgLSBsaXN0IG9mIHVybHNcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IG9ubG9hZCAtIGNhbGxiYWNrXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9iaW5kPXRydWUgLSBhdXRvIGJpbmRcclxuXHRcdCAqIEByZXR1cm5zIHtSZXNvdXJjZUxvYWRlcn0gdGhlIGxvYWRlclxyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgYXVkaW9zKHVybGlzdDogc3RyaW5nW10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSB0cnVlKTogUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0XHRsZXQgYXVkaW9saXN0OiBIVE1MQXVkaW9FbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgYXVkaW8gPSBuZXcgQXVkaW8odXJsKTtcclxuXHRcdFx0XHRhdWRpby5sb2FkKCk7XHJcblx0XHRcdFx0YXVkaW9saXN0LnB1c2goYXVkaW8pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGF1ZGlvbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vYXVkaW9zXHJcblx0fSAvL1Jlc291cmNlTG9hZGVyXHJcblxyXG59IC8vQ2FudmFzQ29udHJvbHNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENhbnZhc0NvbnRyb2xzLkNvbnRyb2xsYWJsZUNhbnZhcztcclxuIl19