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
            if (!this._adapts.drag && this.dragEnabled) {
                this.target.addEventListener("touchstart", (e) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
                this.target.addEventListener("touchmove", this._adapts.pinch = this._adapts.drag = (e) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
                this.target.addEventListener("touchend", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
                this.target.addEventListener("touchcancel", (e) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
            }
            if (!this._adapts.tilt && this.tiltEnabled) {
            }
        } //_mobileAdapt
        _pcAdapt() {
            if (!this._adapts.drag && this.dragEnabled) {
                this.target.addEventListener("mousemove", this._adapts.drag = (e) => ControllableCanvas.dragPC(e, this));
                this.target.addEventListener("mousedown", (e) => this._pressed = true);
                this.target.addEventListener("mouseup", (e) => this._pressed = false);
                this.target.addEventListener("mouseout", (e) => this._pressed = false);
                if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT)
                    this.target.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true, passive: false });
            }
            if (!this._adapts.wheel && this.wheelEnabled) {
                this.target.addEventListener("wheel", this._adapts.wheel = (e) => ControllableCanvas.wheel(e, this));
            }
            if (!this._adapts.tilt && this.tiltEnabled) {
                //TODO
            }
            if (!this._adapts.click) {
                this.target.addEventListener("click", this._adapts.click = (e) => ControllableCanvas.clickPC(e, this));
            }
        } //_pcAdapt
        static dragPC(event, cc) {
            event.preventDefault();
            let coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop], rel = [], ret = false;
            cc._coordinates = coords;
            if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
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
        static clickPC(event, cc) {
            let coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
            for (let butt of sorted) {
                butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
                if (ret)
                    break;
            }
        } //clickPC
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVILFlBQVksQ0FBQzs7QUFDYiwyQkFBeUI7QUFFekI7Ozs7R0FJRztBQUVIOzs7OztHQUtHO0FBQ0gsSUFBYyxjQUFjLENBeWpDM0I7QUF6akNELFdBQWMsY0FBYztJQUkzQjs7Ozs7Ozs7T0FRRztJQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLFlBQXNCLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxJQUFZLEVBQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pLLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1lBQ25CLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDLENBQUMsU0FBUztJQU5LLHNCQUFPLFVBTXRCLENBQUE7SUFDRDs7Ozs7Ozs7O09BU0c7SUFDSCxTQUFnQixLQUFLLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTLEVBQUUsSUFBWSxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsT0FBTztJQUZPLG9CQUFLLFFBRXBCLENBQUE7SUFDRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0IsS0FBSyxDQUFDLENBQVMs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Q0gsS0FBSyxDQUFDLElBQVksQ0FBQyxFQUFFLElBQVksQ0FBQyxFQUFFLE1BQWUsS0FBSztZQUN2RCxJQUFJLEVBQUUsR0FBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEMsSUFBSSxJQUFJLENBQUMsY0FBYztnQkFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULElBQUksSUFBSSxHQUFhLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBVSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0wsT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pKO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekssT0FBTyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxJ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QUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN6UCxHQUFHLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDM04sUUFBUSxHQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzFSLENBQUMsR0FBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFDNUYsUUFBUSxHQUFhLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFakYsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO3dCQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNyQjtxQkFBTTtvQkFDTixZQUFZO29CQUNaLElBQUksT0FBTyxHQUFXLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN6TyxHQUFHLEdBQVcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDaFAsUUFBUSxHQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzFSLENBQUMsR0FBVyxFQUFFLENBQUMsUUFBUSxHQUFHLEdBQUcsR0FBRyxPQUFPLEVBQ3ZDLFFBQVEsR0FBYSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFL0QsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDWixJQUFJLEVBQUUsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBVyxFQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7d0JBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO2lCQUNuRjtnQkFDRCxHQUFHLEVBQUUsQ0FBQzthQUNOO1lBRUQsRUFBRSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7UUFDMUIsQ0FBQyxDQUFDLGdCQUFnQjtRQUNWLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBaUIsRUFBRSxFQUFzQixFQUFFLE9BQWdCLEtBQUs7WUFDOUYsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRXZCLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ1YsSUFBSSxNQUFnQixFQUNuQixNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBZSxFQUFFLENBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ2xJLEdBQUcsR0FBWSxLQUFLLENBQUM7Z0JBRXRCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUV4SixLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7b0JBQ3ZDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFN0ksS0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7d0JBQ3hCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNyRyxJQUFJLEdBQUc7NEJBQUUsTUFBTTtxQkFDZjtpQkFDRDthQUNEO1lBRUQsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQzdCLEVBQUUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN6QixFQUFFLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDdEQ7aUJBQU07Z0JBQ04sRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7YUFDaEI7WUFFRCxFQUFFLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUMsaUJBQWlCO1FBQ1gsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFpQixFQUFFLEVBQXNCO1lBQ3JFLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQWdCLEVBQ25CLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFlLEVBQUUsQ0FBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDbEksR0FBRyxHQUFZLEtBQUssQ0FBQztZQUV0QixLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7Z0JBQ3ZDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFN0ksS0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDbkM7YUFDRDtZQUVELElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEYsS0FBSyxJQUFJLElBQUksSUFBSSxNQUFNLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ2pFLElBQUksR0FBRzt3QkFBRSxNQUFNO2lCQUNmO2dCQUVELEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2FBQ2hCO1lBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUU7Z0JBQ3JELEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQ3pDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDcEMsQ0FBQyxDQUFDLGVBQWU7UUFFVCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQWlCLEVBQUUsRUFBc0I7WUFDN0QsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxHQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUNwRyxNQUFNLEdBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUgsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNaLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFXLEVBQVcsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFBRSxFQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsSCxDQUFDLENBQUMsT0FBTztRQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBaUIsRUFBRSxFQUFzQjtZQUMvRCxJQUFJLE1BQU0sR0FBYSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDekosTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQWUsRUFBRSxDQUFlLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUNsSSxHQUFHLEdBQVksS0FBSyxDQUFDO1lBRXRCLEtBQUssSUFBSSxJQUFJLElBQUksTUFBTSxFQUFFO2dCQUN4QixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLEdBQUc7b0JBQUUsTUFBTTthQUNmO1FBQ0YsQ0FBQyxDQUFDLFNBQVM7UUFHSCxNQUFNLEtBQUssUUFBUTtZQUMxQixJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQzttQkFDNUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO21CQUMxRSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUMvSDtnQkFDRCxPQUFPLElBQUksQ0FBQzthQUNaO2lCQUFNO2dCQUNOLE9BQU8sS0FBSyxDQUFDO2FBQ2I7UUFDRixDQUFDLENBQUMsVUFBVTtRQUVKLE1BQU0sS0FBSyxTQUFTO1lBQzNCLElBQUksQ0FBUyxFQUNaLE1BQU0sR0FBc0IsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUNqQixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxJQUFJLElBQUksR0FBVyxNQUFNLENBQUMsYUFBYSxFQUN0QyxJQUFJLEdBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNoQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixJQUFJLENBQUMsS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2IsSUFBSSxJQUFJLEdBQTZCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDakUsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbEMsT0FBTyxDQUFDLENBQUM7UUFDVixDQUFDLENBQUMsV0FBVztRQUVMLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBWSxFQUFFLE1BQWM7WUFDbkQsSUFBSSxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUNmLE9BQU8sa0JBQWtCLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQzthQUM1QztpQkFBTSxJQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQ3RCLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQzthQUMxQjtpQkFBTTtnQkFDTixPQUFPLE1BQU0sQ0FBQzthQUNkO1FBQ0YsQ0FBQyxDQUFDLFVBQVU7TUFDWCxvQkFBb0I7SUEzYU4sMkJBQVEsR0FBVyxFQUFFLENBQUM7SUFFckM7Ozs7T0FJRztJQUNJLDhCQUFXLEdBQW1DO1FBQ3BELE1BQU0sRUFBRSxRQUFRLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDYixHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ1gsV0FBVyxFQUFFLEtBQUs7UUFDbEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsV0FBVyxFQUFFLEtBQUs7UUFDbEIsVUFBVSxFQUFFLEtBQUs7UUFDakIsV0FBVyxFQUFFLEtBQUs7UUFDbEIsY0FBYyxFQUFFLEtBQUs7UUFDckIsU0FBUyxFQUFFLENBQUM7UUFDWixTQUFTLEVBQUUsQ0FBQztRQUNaLFVBQVUsRUFBRSxDQUFDO1FBQ2IsUUFBUSxFQUFFLENBQUM7UUFDWCxnQkFBZ0IsRUFBRSxHQUFHO1FBQ3JCLGdCQUFnQixFQUFFLEdBQUc7UUFDckIsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO1FBQ3JDLFdBQVcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7UUFDdkQsT0FBTyxFQUFFO1lBQ1IsSUFBSSxFQUFFLEtBQUs7WUFDWCxLQUFLLEVBQUUsS0FBSztZQUNaLEtBQUssRUFBRSxLQUFLO1lBQ1osR0FBRyxFQUFFLEtBQUs7WUFDVixJQUFJLEVBQUUsS0FBSztZQUNYLEtBQUssRUFBRSxLQUFLO1NBQ1o7UUFDRCxLQUFLLEVBQUUsSUFBSSxHQUFHLEVBQUU7S0FDaEIsQ0FBQztJQWxFVSxpQ0FBa0IscUJBMGM5QixDQUFBO0lBRUQ7O09BRUc7SUFDSCxNQUFhLE9BQU87UUE0Qm5CLFlBQVksT0FBb0IsRUFBRSxPQUFnQixLQUFLO1lBM0J2RCxVQUFLLEdBQVUsRUFBRSxDQUFDO1lBQ2xCLFNBQUksR0FBVSxFQUFFLENBQUM7WUFDakIsT0FBRSxHQUFVLEVBQUUsQ0FBQztZQUVmLFdBQU0sR0FBWSxLQUFLLENBQUM7WUFJeEIsNEJBQXVCLEdBQVksSUFBSSxDQUFDO1lBQ3hDLGtCQUFhLEdBRVQsRUFBRSxDQUFDO1lBaUJOLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQzdDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDakQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztZQUNuRCxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxNQUFNO1FBRVIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFvQixFQUFFLElBQVk7WUFDbEQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUN2QixLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0ksSUFBSSxJQUFJLENBQUMsdUJBQXVCO29CQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN0STtpQkFBTTtnQkFDTixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7YUFDN0M7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUMsQ0FBQyxXQUFXO1FBRWIsVUFBVTtZQUNULEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNwRDtZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25DLENBQUMsQ0FBQyxZQUFZO1FBRWQ7Ozs7V0FJRztRQUNILElBQUk7WUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxLQUFvQixFQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2pJLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBb0IsRUFBVyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMzSCxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQW9CLEVBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0gsT0FBTyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzthQUMxQjtZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLE1BQU07UUFFUixRQUFRLENBQUMsSUFBWSxFQUFFLEtBQW9CO1lBQzFDLElBQUksT0FBTyxHQUFZLEtBQUssQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFRLEVBQVEsRUFBRTtnQkFDeEQsSUFBSSxHQUFHLENBQUMsR0FBRyxLQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7b0JBQzFCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNyQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQyxDQUFDLFVBQVU7UUFFWjs7Ozs7V0FLRztRQUNILGdCQUFnQixDQUFDLEdBQVcsRUFBRSxRQUF5RDtZQUN0RixJQUFJLEdBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQyxDQUFDLGtCQUFrQjtRQUNwQjs7Ozs7V0FLRztRQUNILGVBQWUsQ0FBQyxHQUFXLEVBQUUsUUFBeUQ7WUFDckYsSUFBSSxHQUFRLENBQUM7WUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUM1RixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQyxpQkFBaUI7UUFDbkI7Ozs7O1dBS0c7UUFDSCxhQUFhLENBQUMsR0FBVyxFQUFFLFFBQXlEO1lBQ25GLElBQUksR0FBUSxDQUFDO1lBQ2IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDeEYsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUMsZUFBZTtRQUNqQjs7O1dBR0c7UUFDSCxVQUFVLENBQUMsR0FBMEIsRUFBRSxJQUFTO1lBQy9DLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO2dCQUM1QixJQUFJLEdBQVcsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQU0sRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDekUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUN2QztxQkFBTSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUMvRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3RDO3FCQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFNLEVBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzdFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDcEM7cUJBQU07b0JBQ04sT0FBTyxLQUFLLENBQUM7aUJBQ2I7YUFDRDtpQkFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDakUsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQU0sRUFBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQzthQUM3RDtpQkFBTTtnQkFDTixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBTSxFQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDdEc7UUFDRixDQUFDLENBQUMsWUFBWTtNQUNiLFNBQVM7SUEzSEgsZUFBTyxHQUFHLENBQUMsQ0FBQztJQUNaLHNCQUFjLEdBQVcsQ0FBQyxDQUFDO0lBQzNCLHdCQUFnQixHQUFXLEVBQUUsQ0FBQztJQUM5Qix5QkFBaUIsR0FBVyxFQUFFLENBQUM7SUFFL0IscUJBQWEsR0FFaEI7UUFDRixPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2YsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakIsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ25CLENBQUM7SUExQlMsc0JBQU8sVUF5SW5CLENBQUE7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILE1BQWEsWUFBWTtRQStCeEIsWUFBWSxPQUFpQyxZQUFZLENBQUMsV0FBVztZQTlCckUsTUFBQyxHQUFXLENBQUMsQ0FBQztZQUNkLE1BQUMsR0FBVyxDQUFDLENBQUM7WUFDZCxPQUFFLEdBQVcsQ0FBQyxDQUFDO1lBQ2YsT0FBRSxHQUFXLENBQUMsQ0FBQztZQUNmLFVBQUssR0FBVyxDQUFDLENBQUMsQ0FBQztZQUduQixZQUFPLEdBQVksSUFBSSxDQUFDO1lBQ3hCLFdBQU0sR0FBWSxLQUFLLENBQUM7WUFDeEIsYUFBUSxHQUFXLENBQUMsQ0FBQztZQXNCcEIsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFO2dCQUMvRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDckI7WUFFRCxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN0QixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzlCLElBQUksQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25DLENBQUMsQ0FBQyxNQUFNO1FBRVIsV0FBVztRQUNYOzs7V0FHRztRQUNILElBQUksQ0FBQyxHQUFHLEdBQVU7WUFDakIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDLENBQUMsTUFBTTtRQUNSLFdBQVc7UUFDWDs7O1dBR0c7UUFDSCxLQUFLLENBQUMsR0FBRyxHQUFVO1lBQ2xCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLE9BQU87UUFDVCxXQUFXO1FBQ1g7OztXQUdHO1FBQ0gsS0FBSyxDQUFDLEdBQUcsR0FBVTtZQUNsQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQyxPQUFPO1FBRVQ7Ozs7V0FJRztRQUNILEtBQUssQ0FBQyxjQUF3QjtZQUM3QixJQUFJLENBQUMsR0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFDckgsQ0FBQyxHQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUNsSCxFQUFFLEdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQzdILEVBQUUsR0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFDN0gsR0FBRyxHQUFZLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUzRyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2FBQ3BCO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUMsT0FBTztNQUNSLGNBQWM7SUFoRlIsd0JBQVcsR0FBVyxFQUFFLENBQUM7SUFDakIsb0JBQU8sR0FBVyxDQUFDLENBQUM7SUFDbkM7Ozs7T0FJRztJQUNJLHdCQUFXLEdBQTZCO1FBQzlDLENBQUMsRUFBRSxDQUFDO1FBQ0osQ0FBQyxFQUFFLENBQUM7UUFDSixFQUFFLEVBQUUsQ0FBQztRQUNMLEVBQUUsRUFBRSxDQUFDO1FBQ0wsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNULE1BQU0sRUFBRSxLQUFLO1FBQ2IsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsQ0FBQztRQUNYLE1BQU0sRUFBRSxJQUFJLGtCQUFrQjtLQUM5QixDQUFDO0lBN0JVLDJCQUFZLGVBNEZ4QixDQUFBO0lBRUQsa0JBQWtCLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUUvQzs7Ozs7T0FLRztJQUNILE1BQWEsTUFBTTtRQUdsQixZQUFZLFFBQWtCLEVBQUU7WUFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsTUFBTTtRQUVSOzs7Ozs7V0FNRztRQUNILEdBQUcsQ0FBQyxJQUFxQixFQUFFLE1BQWMsQ0FBQztZQUN6QyxJQUFJLElBQUksWUFBWSxNQUFNLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBWSxFQUFFLEdBQVcsRUFBRSxFQUFFO29CQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLENBQUMsQ0FBQyxDQUFDO2FBQ0g7aUJBQU07Z0JBQ04sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLEVBQUU7b0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLENBQUM7YUFDSDtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLEtBQUs7UUFDUDs7Ozs7O1dBTUc7UUFDSCxJQUFJLENBQUMsSUFBcUIsRUFBRSxNQUFjLENBQUM7WUFDMUMsSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO2dCQUMzQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDN0MsQ0FBQyxDQUFDLENBQUM7YUFDSDtpQkFBTTtnQkFDTixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDeEMsQ0FBQyxDQUFDLENBQUM7YUFDSDtZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLE1BQU07UUFDUjs7Ozs7V0FLRztRQUNILEdBQUcsQ0FBQyxJQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUMsQ0FBQyxLQUFLO0tBQ1AsQ0FBQyxRQUFRO0lBdERHLHFCQUFNLFNBc0RsQixDQUFBO0lBRUQ7O09BRUc7SUFDSCxNQUFhLGNBQWM7UUFJMUIsWUFBWSxTQUF3QixFQUFFLE1BQW1ELEVBQUUsV0FBb0IsS0FBSztZQUhwSCxjQUFTLEdBQWtCLEVBQUUsQ0FBQztZQUM5QixjQUFTLEdBQVcsQ0FBQyxDQUFDO1lBR3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2hDLElBQUksUUFBUTtnQkFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsTUFBTTtRQUVSOzs7V0FHRztRQUNILElBQUksQ0FBQyxNQUFrRDtZQUN0RCxJQUFJLE1BQU07Z0JBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7WUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFnQixFQUFFLEVBQUU7Z0JBQzNDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBUyxFQUFFO29CQUN2QyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTt3QkFDL0MsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3FCQUMvQjtnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLE1BQU07UUFDUixXQUFXO1FBQ1gsSUFBSSxDQUFDLEdBQWlCLEVBQUUsSUFBYSxJQUFVLENBQUMsQ0FBQyxNQUFNO1FBRXZEOzs7Ozs7OztXQVFHO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFnQixFQUFFLE1BQW1ELEVBQUUsV0FBb0IsSUFBSTtZQUM1RyxJQUFJLE9BQU8sR0FBdUIsRUFBRSxDQUFDO1lBRXJDLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO2dCQUN2QixJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN0QixHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztnQkFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2xCO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUMsQ0FBQyxRQUFRO1FBQ1Y7Ozs7Ozs7O1dBUUc7UUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQWdCLEVBQUUsTUFBbUQsRUFBRSxXQUFvQixJQUFJO1lBQzVHLElBQUksU0FBUyxHQUF1QixFQUFFLENBQUM7WUFFdkMsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7Z0JBQ3ZCLElBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2IsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtZQUVELE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsUUFBUTtLQUNWLENBQUMsZ0JBQWdCO0lBbkVMLDZCQUFjLGlCQW1FMUIsQ0FBQTtBQUVGLENBQUMsRUF6akNhLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBeWpDM0IsQ0FBQyxnQkFBZ0I7QUFFbEIsa0JBQWUsY0FBYyxDQUFDLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQW5nbGUgYmV0d2VlbiAzIHBvaW5zIChSYWRpYW5zKTpcclxuICogcGM6IGNlbnRlci9wb2xlXHJcbiAqIHBuOiBwb2ludCBuZXcgY29vcmRpbmF0ZXNcclxuICogcHA6IHBvaW50IHBhc3QgY29vcmRpbmF0ZXNcclxuICogXHJcbiAqIGF0YW4yKHBueSAtIHBjeSwgcG54IC0gcGN4KSAtIGF0YW4yKHBweSAtIHBjeSwgcHB4IC0gcGN4KVxyXG4gKi9cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5pbXBvcnQgXCJAYmFiZWwvcG9seWZpbGxcIjtcclxuXHJcbi8qKlxyXG4gKiBAZmlsZSBDYW52YXNDb250cm9scy50c1xyXG4gKiBAY29weXJpZ2h0IFZhbGVuLiBILiAyazE4XHJcbiAqIEBhdXRob3IgVmFsZW4uSC4gPGFsdGVybmF0aXZleHh4eUBnbWFpbC5jb20+XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFRoZSByb290IG9mIHRoZSBtYWluIGxpYnJhcnlcclxuICogQG1vZHVsZSBDYW52YXNDb250cm9sc1xyXG4gKiBAbGljZW5zZSBJU0NcclxuICogQGdsb2JhbFxyXG4gKi9cclxuZXhwb3J0IG1vZHVsZSBDYW52YXNDb250cm9scyB7XHJcblxyXG5cdHR5cGUgQ2xhc3MgPSB7IG5ldyguLi5hcmdzOiBhbnlbXSk6IGFueTsgfTtcclxuXHJcblx0LyoqXHJcblx0ICogSWYgYGRlc3RgIGxhY2tzIGEgcHJvcGVydHkgdGhhdCBgdGFyZ2AgaGFzIHRoZW4gdGhhdCBwcm9wZXJ0eSBpcyBjb3BpZWQgaW50byBgZGVzdGBcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGVzdCAtIGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnIC0gYmFzZSBvYmplY3RcclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25kaXRpb24gLSBpbmhlcml0YW5jZSBjb25kaXRpb25cclxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gaW5oZXJpdChkZXN0OiB7fSwgdGFyZzoge30sIGNvbmRpdGlvbjogRnVuY3Rpb24gPSAoZGVzdDoge30sIHRhcmc6IHt9LCBwcm9wOiBzdHJpbmcpOiBhbnkgPT4gZGVzdFtwcm9wXSA9PT0gdW5kZWZpbmVkICYmIChkZXN0W3Byb3BdID0gdGFyZ1twcm9wXSkpOiB7fSB7XHJcblx0XHRmb3IgKGxldCBpIGluIHRhcmcpIHtcclxuXHRcdFx0Y29uZGl0aW9uKGRlc3QsIHRhcmcsIGkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkZXN0O1xyXG5cdH0gLy9pbmhlcml0XHJcblx0LyoqXHJcblx0ICogUmVzdHJpY3QgbnVtYmVyJ3MgcmFuZ2VcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbiAtIHRhcmdldCBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbSAtIG1pbmltdW0gbnVtYmVyXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IE0gLSBtYXhpbXVtIG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBwPTAgLSBwcmVjaXNpb25cclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBib3VuZCBudW1iZXJcclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gYm91bmQobjogbnVtYmVyLCBtOiBudW1iZXIsIE06IG51bWJlciwgcDogbnVtYmVyID0gMCk6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gbiA+IE0gKyBwID8gTSA6IChuIDwgbSAtIHAgPyBtIDogbik7XHJcblx0fSAvL2JvdW5kXHJcblx0LyoqXHJcblx0ICogRG93bnNwZWVkIGluY3JlbWVudGF0aW9uXHJcblx0ICogQHBhcmFtIHtudW1iZXJ9IG4gLSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gbSAtIG1pbmltdW1cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gTSAtIE1heGltdW1cclxuXHQgKiBAcGFyYW0ge251bWJlcn0gb3AgLSBvcGVyYXRpb25cclxuXHQgKiBAcmV0dXJucyB7bnVtYmVyfSBuXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJsb2NrKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIsIG9wOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0aWYgKG4gPiBNICYmIG9wID4gMCkge1xyXG5cdFx0XHRyZXR1cm4gbjtcclxuXHRcdH0gZWxzZSBpZiAobiA+IE0pIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH0gZWxzZSBpZiAobiA8IG0gJiYgb3AgPCAwKSB7XHJcblx0XHRcdHJldHVybiBuO1xyXG5cdFx0fSBlbHNlIGlmIChuIDwgbSkge1xyXG5cdFx0XHRyZXR1cm4gbiArIG9wO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIG4gKyBvcDtcclxuXHRcdH1cclxuXHR9IC8vYmxvY2tcclxuXHQvKipcclxuXHQgKiBDYWxjdWxhdGUgZGlzdGFuY2UgYmV0d2VlbiAyIHBvaW50c1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFhzIC0gWCBjb29yZGluYXRlc1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFlzIC0gWSBjb29yZGluYXRlc1xyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGRpc3RhbmNlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGRpc3QoWHM6IG51bWJlcltdLCBZczogbnVtYmVyW10pOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIE1hdGguc3FydChbWHNbMV0gLSBYc1swXSwgWXNbMV0gLSBZc1swXV0ubWFwKCh2OiBudW1iZXIpID0+IE1hdGgucG93KHYsIDIpKS5yZWR1Y2UoKGFjYzogbnVtYmVyLCB2OiBudW1iZXIpID0+IGFjYyArIHYpKTtcclxuXHR9IC8vZGlzdFxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGluc2lkZSBhbiBhcmVhXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gYm94IC0geCx5LGR4LGR5XHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gcG9pbnQgLSB4LHlcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc2Vuc2l0aXZpdHkgLSBleHRyYSBib3VuZGFyeVxyXG5cdCAqIEByZXR1cm5zIGJvb2xlYW5cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKi9cclxuXHRleHBvcnQgZnVuY3Rpb24gaXNXaXRoaW4oYm94OiBudW1iZXJbXSwgcG9pbnQ6IG51bWJlcltdLCBzZW5zaXRpdml0eTogbnVtYmVyID0gLjUpOiBib29sZWFuIHtcclxuXHRcdHJldHVybiBib3hbMF0gLSBzZW5zaXRpdml0eSA8PSBwb2ludFswXSAmJiBib3hbMF0gKyBib3hbMl0gKyBzZW5zaXRpdml0eSA+PSBwb2ludFswXSAmJiBib3hbMV0gLSBzZW5zaXRpdml0eSA8PSBwb2ludFsxXSAmJiBib3hbMV0gKyBib3hbM10gKyBzZW5zaXRpdml0eSA+PSBwb2ludFsxXTtcclxuXHR9IC8vaXNXaXRoaW5cclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBPcHRpb25zXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgT3B0cyB7XHJcblx0XHQvKipcclxuXHRcdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB0YXJnZXQ9Zmlyc3RDYW52T2NjdXJJbkRvYyAtIEJvdW5kIGNhbnZhc1xyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSByb3Q9MCwwIC0gUm90YXRpb25cclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdFx0ICogQHByb3Age2Jvb2xlYW59IGtleXNFbmFibGVkPWZhbHNlIC0gRW5hYmxlIGtleWFib3JkIGV2ZW50cyBsaXN0ZW5lclxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0XHQgKiBAbWVtYmVyIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRcdHRyYW5zPzogbnVtYmVyW107XHJcblx0XHRcdHNjbD86IG51bWJlcltdO1xyXG5cdFx0XHRkcmFnRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHBpbmNoRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHdoZWVsRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdGtleXNFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0cGFuRW5hYmxlZD86IGJvb2xlYW47XHJcblx0XHRcdHRpbHRFbmFibGVkPzogYm9vbGVhbjtcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ/OiBib29sZWFuO1xyXG5cdFx0XHR1c2VCdXR0b24/OiBudW1iZXI7XHJcblx0XHRcdHNjYWxlTW9kZT86IG51bWJlcjtcclxuXHRcdFx0dHJhbnNCb3VuZHM/OiBudW1iZXJbXTtcclxuXHRcdFx0c2NsQm91bmRzPzogbnVtYmVyW107XHJcblx0XHRcdHRyYW5zU3BlZWQ/OiBudW1iZXI7XHJcblx0XHRcdHNjbFNwZWVkPzogbnVtYmVyO1xyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5PzogbnVtYmVyO1xyXG5cdFx0XHRfYWRhcHRzPzogQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRcdHdnZXRzPzogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBNOiBtb2JpbGVcclxuXHRcdCAqIFA6IHBjXHJcblx0XHQgKiBNUDogYm90aFxyXG5cdFx0ICogXHJcblx0XHQgKiBkcmFnOlxyXG5cdFx0ICpcdFA6IG1vdXNlICBob2xkICYgbW92ZVxyXG5cdFx0ICpcdE06IHRvdWNoICBob2xkICYgbW92ZVxyXG5cdFx0ICogcGluY2g6XHJcblx0XHQgKlx0dG91Y2ggIDItZmluZ2VyICYgbW92ZVxyXG5cdFx0ICogd2hlZWw6XHJcblx0XHQgKlx0d2hlZWwgIG1vdmUgIFtwYyBwaW5jaC1lcXVpdmFsZW50XVxyXG5cdFx0ICogcGFuOlxyXG5cdFx0ICpcdGRpc3Bvc2l0aW9uIGZyb20gY2VudGVyIGNhdXNlcyBjb25zdGFudCB0cmFuc2xhdGlvblxyXG5cdFx0ICogdGlsdDpcclxuXHRcdCAqXHRkZXZpY2Vtb3Rpb24gIGNhdXNlcyBwYW5uaW5nKlxyXG5cdFx0ICpcdFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDb250cm9sbGFibGVDYW52YXNBZGFwdGVycyB7XHJcblx0XHRcdGRyYWc6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0cGluY2g/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0d2hlZWw/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL1BcclxuXHRcdFx0cGFuOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHRpbHQ/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdGNsaWNrOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnNcclxuXHRcdC8qKlxyXG5cdFx0ICogT3B0aW9ucyBvZiBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geCAtIHggY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR4IC0gd2lkZ2V0IHdpZHRoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGR5IC0gd2lkZ2V0IGhlaWdodFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBpbmRleCAtIHdpZGdldCBldmVudCBwcmlvcml0eVxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHRcdHg6IG51bWJlcjtcclxuXHRcdFx0eTogbnVtYmVyO1xyXG5cdFx0XHRkeDogbnVtYmVyO1xyXG5cdFx0XHRkeTogbnVtYmVyO1xyXG5cdFx0XHRpbmRleD86IG51bWJlcjtcclxuXHRcdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRcdGVuYWJsZWQ/OiBib29sZWFuO1xyXG5cdFx0XHRwb3NpdGlvbj86IG51bWJlcjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9DYW52YXNCdXR0b25PcHRpb25zXHJcblxyXG5cdFx0ZXhwb3J0IGVudW0gVXNlQnV0dG9uIHtcclxuXHRcdFx0VVNFTEVGVCA9IDEsIFVTRVJJR0hULCBVU0VCT1RIXHJcblx0XHR9IC8vVXNlQnV0dG9uXHJcblx0XHRleHBvcnQgZW51bSBTY2FsZU1vZGUge1xyXG5cdFx0XHROT1JNQUwgPSAxLCBGUkVFU0NBTEVcclxuXHRcdH0gLy9TY2FsZU1vZGVcclxuXHRcdGV4cG9ydCBlbnVtIFBvc2l0aW9uIHtcclxuXHRcdFx0RklYRUQgPSAxLCBBQlNPTFVURSwgVU5TQ0FMQUJMRSA9IDRcclxuXHRcdH0gLy9Qb3NpdGlvblxyXG5cdH0gLy9PcHRzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgZXJyb3JzXHJcblx0ICogQG5hbWVzcGFjZVxyXG5cdCAqL1xyXG5cdGV4cG9ydCBuYW1lc3BhY2UgRXJyb3JzIHtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ0FOVjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBIVE1MQ2FudmFzRWxlbWVudC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVENUWDogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhIENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRU5PVE5VTUFSUjI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgMi1hdC1sZWFzdCBOdW1iZXJzLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgdmFsaWQgTnVtYmVyLlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFSVNBTFI6IFJlZmVyZW5jZUVycm9yID0gbmV3IFJlZmVyZW5jZUVycm9yKFwiT2JqZWN0IGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5cIik7XHJcblx0fSAvL0Vycm9yc1xyXG5cclxuXHQvKipcclxuXHQgKiBUeXBlIG9mIEtleUJpbmRcclxuXHQgKi9cclxuXHRleHBvcnQgdHlwZSBLZXkgPSB7XHJcblx0XHRrZXk6IHN0cmluZztcclxuXHRcdGNhbGxiYWNrOiAoZXZlbnQ6IEtleWJvYXJkRXZlbnQsIHR5cGU6IHN0cmluZykgPT4gYm9vbGVhbjtcclxuXHRcdGlkOiBudW1iZXI7XHJcblx0XHR0eXBlOiBzdHJpbmc7XHJcblx0fTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBrZXlzRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBrZXlhYm9yZCBldmVudHMgbGlzdGVuZXJcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0ICogQHByb3Age251bWJlcltdfSBfY29vcmRpbmF0ZXMgLSBDdXJyZW50IGV2ZW50IGNvb3JkaW5hdGVzXHJcblx0ICogQHByb3Age251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0ICogQHByb3Age29iamVjdH0gX3RvdWNoZXMgLSBNYXAgb2YgYWxsIGN1cnJlbnQgdG91Y2hlc1xyXG5cdCAqIEBwcm9wIHtDbGFzc30gQ2FudmFzQnV0dG9uIC0gQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAcHJvcCB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cGluOiBudW1iZXJbXTsgIC8vT0JTXHJcblx0XHR0cmFuc0JvdW5kczogbnVtYmVyW10gPSBbLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRzY2xCb3VuZHM6IG51bWJlcltdID0gWzAsIDAsIEluZmluaXR5LCBJbmZpbml0eV07XHJcblx0XHRkcmFnRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGluY2hFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGtleXNFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwYW5FbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTsgIC8vT0JTXHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7XHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlciA9IDgwMDtcclxuXHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdGtleWJpbmRzOiBLZXlCaW5kO1xyXG5cdFx0cHJpdmF0ZSBfem9vbUNoYW5nZWQ6IGJvb2xlYW5bXSA9IFtmYWxzZSwgZmFsc2VdO1xyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9wcmVzc2VkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwcml2YXRlIF9jbGt0aW1lOiBudW1iZXIgPSAwO1xyXG5cdFx0X2FkYXB0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycztcclxuXHRcdHByaXZhdGUgX2Nvb3JkaW5hdGVzOiBudW1iZXJbXSA9IFtdO1xyXG5cdFx0cHJpdmF0ZSBfdG91Y2hlczogbnVtYmVyW11bXSA9IFtdO1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIF9saW5lcGl4OiBudW1iZXIgPSAxMDtcclxuXHRcdHN0YXRpYyBDYW52YXNCdXR0b246IENsYXNzO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0ge1xyXG5cdFx0XHR0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FudmFzXCIpWzBdLFxyXG5cdFx0XHR0cmFuczogWzAsIDBdLFxyXG5cdFx0XHRzY2w6IFsxLCAxXSxcclxuXHRcdFx0ZHJhZ0VuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRwaW5jaEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHR3aGVlbEVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHRrZXlzRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBhbkVuYWJsZWQ6IGZhbHNlLFxyXG5cdFx0XHR0aWx0RW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdGV2ZW50c1JldmVyc2VkOiBmYWxzZSxcclxuXHRcdFx0dXNlQnV0dG9uOiAxLFxyXG5cdFx0XHRzY2FsZU1vZGU6IDEsXHJcblx0XHRcdHRyYW5zU3BlZWQ6IDEsXHJcblx0XHRcdHNjbFNwZWVkOiAxLFxyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5OiAuMzUsXHJcblx0XHRcdGNsaWNrU2Vuc2l0aXZpdHk6IDgwMCxcclxuXHRcdFx0c2NsQm91bmRzOiBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XSxcclxuXHRcdFx0dHJhbnNCb3VuZHM6IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XSxcclxuXHRcdFx0X2FkYXB0czoge1xyXG5cdFx0XHRcdGRyYWc6IGZhbHNlLFxyXG5cdFx0XHRcdHBpbmNoOiBmYWxzZSxcclxuXHRcdFx0XHR3aGVlbDogZmFsc2UsXHJcblx0XHRcdFx0cGFuOiBmYWxzZSxcclxuXHRcdFx0XHR0aWx0OiBmYWxzZSxcclxuXHRcdFx0XHRjbGljazogZmFsc2VcclxuXHRcdFx0fSxcclxuXHRcdFx0d2dldHM6IG5ldyBTZXQoKVxyXG5cdFx0fTtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENvbnRyb2xsYWJsZUNhbnZhcyBjb25zdHJ1Y3RvclxyXG5cdFx0ICogQHBhcmFtIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnN9IG9wdHM/PUNvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cyAtIENvbnRyb2xsYWJsZUNhbnZhcyBPcHRpb25zXHJcblx0XHQgKiBAY29uc3RydWN0b3JcclxuXHRcdCAqL1xyXG5cdFx0Y29uc3RydWN0b3Iob3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0gQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKSB7XHJcblx0XHRcdGluaGVyaXQob3B0cywgQ29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzKTtcclxuXHJcblx0XHRcdGlmICghKG9wdHMudGFyZ2V0IGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1RDQU5WO1xyXG5cdFx0XHR9IGVsc2UgaWYgKFtvcHRzLnRyYW5zLCBvcHRzLnNjbCwgb3B0cy50cmFuc0JvdW5kcywgb3B0cy5zY2xCb3VuZHNdLnNvbWUoYXJyID0+ICEoYXJyIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5hcnIgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHx8IGFyci5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20oYXJyKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjI7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGluaGVyaXQob3B0cy5fYWRhcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMuX2FkYXB0cyk7ICAvL1BPU1NJQkxFIEVSUk9SXHJcblxyXG5cdFx0XHRpZiAob3B0cy5waW4gPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdG9wdHMucGluID0gW29wdHMudGFyZ2V0LndpZHRoIC8gMiwgb3B0cy50YXJnZXQuaGVpZ2h0IC8gMl07XHJcblx0XHRcdH0gZWxzZSBpZiAoIShvcHRzLnBpbiBpbnN0YW5jZW9mIEFycmF5IHx8IDxhbnk+b3B0cy5waW4gaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgb3B0cy5waW4ubGVuZ3RoIDwgMiB8fCBBcnJheS5mcm9tKG9wdHMucGluKS5zb21lKChudW06IGFueSkgPT4gaXNOYU4obnVtKSB8fCBudW0gPT09ICcnKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy50YXJnZXQgPSBvcHRzLnRhcmdldDtcclxuXHRcdFx0dGhpcy5jb250ZXh0ID0gdGhpcy50YXJnZXQuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cdFx0XHR0aGlzLmtleWJpbmRzID0gbmV3IEtleUJpbmQodGhpcy50YXJnZXQsIG9wdHMua2V5c0VuYWJsZWQpO1xyXG5cclxuXHRcdFx0dGhpcy5fYWRhcHRzID0gPE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM+e307XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHJcblx0XHRcdHRoaXMuZHJhZ0VuYWJsZWQgPSAhIW9wdHMuZHJhZ0VuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hFbmFibGVkID0gISFvcHRzLnBpbmNoRW5hYmxlZDtcclxuXHRcdFx0dGhpcy53aGVlbEVuYWJsZWQgPSAhIW9wdHMud2hlZWxFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBhbkVuYWJsZWQgPSAhIW9wdHMucGFuRW5hYmxlZDtcclxuXHRcdFx0dGhpcy50aWx0RW5hYmxlZCA9ICEhb3B0cy50aWx0RW5hYmxlZDtcclxuXHRcdFx0dGhpcy5ldmVudHNSZXZlcnNlZCA9ICEhb3B0cy5ldmVudHNSZXZlcnNlZDtcclxuXHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbXTtcclxuXHRcdFx0dGhpcy5fbW9iaWxlID0gQ29udHJvbGxhYmxlQ2FudmFzLmlzTW9iaWxlO1xyXG5cdFx0XHRpZiAoIUNvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCkgQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ID0gQ29udHJvbGxhYmxlQ2FudmFzLmxpbmVUb1BpeDtcclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMudGFyZ2V0LCBcIl9jY19cIiwge1xyXG5cdFx0XHRcdHZhbHVlOiB0aGlzLFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdyaXRhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWVcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdGdldCByYXRpbygpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50YXJnZXQud2lkdGggLyB0aGlzLnRhcmdldC5oZWlnaHQ7XHJcblx0XHR9IC8vZy1yYXRpbyAgT0JTXHJcblx0XHRnZXQgbWluKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1pbih0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1pblxyXG5cdFx0Z2V0IG1heCgpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgodGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1tYXggIE9CU1xyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9sc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRoYW5kbGUoKTogdm9pZCB7XHJcblx0XHRcdHRoaXMuX21vYmlsZSA/IHRoaXMuX21vYmlsZUFkYXB0KCkgOiB0aGlzLl9wY0FkYXB0KCk7XHJcblx0XHR9IC8vaGFuZGxlXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCAoL2NyZWF0ZSkgYSB3aWRnZXQgaW4gdGhlIGNvbnRyb2xsZXJcclxuXHRcdCAqIEBwYXJhbSB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbnxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnN9IGRhdGEgLSBjb25zdHJ1Y3RvciBvcHRpb25zXHJcblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufSB0aGUgd2lkZ2V0XHJcblx0XHQgKi9cclxuXHRcdGFkZFdpZGdldChkYXRhOiBDYW52YXNCdXR0b24gfCBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMpOiBDYW52YXNCdXR0b24ge1xyXG5cdFx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbiAmJiAhdGhpcy53Z2V0cy5oYXMoZGF0YSkpIHtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIGlmICghKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24pKSB7XHJcblx0XHRcdFx0ZGF0YSA9IG5ldyBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uKDxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnM+ZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVJU0FMUjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7ICAvL1NLRVcvUk9UQVRFIE5PVCBJTVBMRU1FTlRFRCEhXHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9yZXRyYW5zZm9ybVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHRyYW5zbGF0aW9uIGZ1bmN0aW9uIGZvciBpY29uaWMgdHJhbnNsYXRlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIHggdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSB5IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKTogbnVtYmVyID0+IC1iKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMudHJhbnMgPSB0aGlzLnRyYW5zLm1hcCgodHJuOiBudW1iZXIsIGlkeDogbnVtYmVyKTogbnVtYmVyID0+IGJvdW5kKE51bWJlcighYWJzID8gKHRybiArIGJ5W2lkeF0pIDogYnlbaWR4XSksIHRoaXMudHJhbnNCb3VuZHNbaWR4XSwgdGhpcy50cmFuc0JvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0fSAvL3RyYW5zbGF0ZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBJbnRlcm1lZGlhdGUgc2NhbGluZyBmdW5jdGlvbiBmb3IgaWNvbmljIHNjYWxlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MSAtIHggc2NhbGVcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PXggLSB5IHNjYWxlXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSBzY2FsZSBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCBzY2FsaW5nXHJcblx0XHQgKi9cclxuXHRcdHNjYWxlKHg6IG51bWJlciA9IDEsIHk6IG51bWJlciA9IHgsIGFiczogYm9vbGVhbiA9IGZhbHNlKTogbnVtYmVyW10ge1xyXG5cdFx0XHRsZXQgYnk6IG51bWJlcltdID0gW3gsIHldLm1hcChOdW1iZXIpO1xyXG5cdFx0XHRpZiAodGhpcy5ldmVudHNSZXZlcnNlZCkgYnkgPSBieS5tYXAoKGI6IG51bWJlcik6IG51bWJlciA9PiAtYik7XHJcblx0XHRcdGlmICghYWJzKSB7XHJcblx0XHRcdFx0bGV0IG5zY2w6IG51bWJlcltdID0gdGhpcy5zY2wubWFwKChzY2w6IG51bWJlciwgaWR4OiBudW1iZXIpOiBudW1iZXIgPT4gc2NsICogYnlbaWR4XSk7XHJcblx0XHRcdFx0bnNjbCA9IFtuc2NsWzBdIC0gdGhpcy5zY2xbMF0sIG5zY2xbMV0gLSB0aGlzLnNjbFsxXV07XHJcblx0XHRcdFx0dGhpcy5fem9vbUNoYW5nZWQgPSBbdGhpcy5zY2xbMF0gIT09IGJsb2NrKHRoaXMuc2NsWzBdLCB0aGlzLnNjbEJvdW5kc1swXSwgdGhpcy5zY2xCb3VuZHNbMl0sIG5zY2xbMF0pLCB0aGlzLnNjbFsxXSAhPT0gYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLnNjbCA9IFtibG9jayh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdLCBuc2NsWzBdKSwgYmxvY2sodGhpcy5zY2xbMV0sIHRoaXMuc2NsQm91bmRzWzFdLCB0aGlzLnNjbEJvdW5kc1szXSwgbnNjbFsxXSldO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMuX3pvb21DaGFuZ2VkID0gW3RoaXMuc2NsWzBdICE9PSBib3VuZCh0aGlzLnNjbFswXSwgdGhpcy5zY2xCb3VuZHNbMF0sIHRoaXMuc2NsQm91bmRzWzJdKSwgdGhpcy5zY2xbMV0gIT09IGJvdW5kKHRoaXMuc2NsWzFdLCB0aGlzLnNjbEJvdW5kc1sxXSwgdGhpcy5zY2xCb3VuZHNbM10pXTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5zY2wgPSB0aGlzLnNjbC5tYXAoKHNjbDogbnVtYmVyLCBpZHg6IG51bWJlcik6IG51bWJlciA9PiBib3VuZChzY2wgKiBieVtpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vc2NhbGVcclxuXHJcblx0XHRwcml2YXRlIF9tb2JpbGVBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCB0aGlzLl9hZGFwdHMucGluY2ggPSB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZU1vdmUoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQgJiYgdGhpcy50aWx0RW5hYmxlZCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0fSAvL19tb2JpbGVBZGFwdFxyXG5cdFx0cHJpdmF0ZSBfcGNBZGFwdCgpOiB2b2lkIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuZHJhZyAmJiB0aGlzLmRyYWdFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBNb3VzZUV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IHRydWUpO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChlPzogTW91c2VFdmVudCkgPT4gdGhpcy5fcHJlc3NlZCA9IGZhbHNlKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIiwgKGU/OiBNb3VzZUV2ZW50KSA9PiB0aGlzLl9wcmVzc2VkID0gZmFsc2UpO1xyXG5cdFx0XHRcdGlmICgodGhpcy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSB0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGU6IE1vdXNlRXZlbnQpID0+IGUucHJldmVudERlZmF1bHQoKSwgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy53aGVlbCAmJiB0aGlzLndoZWVsRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ3aGVlbFwiLCB0aGlzLl9hZGFwdHMud2hlZWwgPSAoZTogV2hlZWxFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLndoZWVsKGUsIHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHRcdFx0XHQvL1RPRE9cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy5jbGljaykge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLl9hZGFwdHMuY2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmNsaWNrUEMoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vX3BjQWRhcHRcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLFxyXG5cdFx0XHRcdHJlbDogbnVtYmVyW10gPSBbXSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHJcblx0XHRcdGlmICgoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKCgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgPT09IDIpIHx8ICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCA9PT0gMykgfHwgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gPT09IDIpKSkgfHwgKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmIChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFQk9USCAmJiAoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpICE9PSAyKSAmJiAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggIT09IDMpICYmICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uICE9PSAyKSkpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fcHJlc3NlZCkge1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZShldmVudC5tb3ZlbWVudFggKiBjYy50cmFuc1NwZWVkLCBldmVudC5tb3ZlbWVudFkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKHJlbCA9IGNvb3Jkcy5tYXAoKGM6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IChjIC0gY2MudHJhbnNbaWR4XSkgLyBjYy5zY2xbaWR4XSkpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKHJlbCkpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZHJhZ1BDXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZU1vdmUoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZnVuY3Rpb24gY2hlY2soYXJyOiBudW1iZXJbXSwgY3VycjogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0XHRpZiAoYXJyLmV2ZXJ5KChhcjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gTWF0aC5hYnMoYXIgLSBjdXJyW2lkeF0pID49IGNjLnRvdWNoU2Vuc2l0aXZpdHkpKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9IC8vY2hlY2tcclxuXHRcdFx0ZnVuY3Rpb24gYXJyYXluZ2UodGxpczogVG91Y2hMaXN0KTogbnVtYmVyW11bXSB7XHJcblx0XHRcdFx0cmV0dXJuIFtbdGxpc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLCBbdGxpc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHRsaXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdXTtcclxuXHRcdFx0fSAvL2FycmF5bmdlXHJcblx0XHRcdGZ1bmN0aW9uIGV2ZXJ5KHQ6IG51bWJlcltdW10sIG50OiBudW1iZXJbXVtdLCBhbGw6IGJvb2xlYW4gPSBmYWxzZSwgb25jZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0bGV0IG91dCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChhbGwgJiYgY2hlY2sodFswXSwgbnRbMF0pICYmIGNoZWNrKHRbMV0sIG50WzFdKSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChhbGwpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNoZWNrKHRbMF0sIG50WzBdKSkge1xyXG5cdFx0XHRcdFx0b3V0ID0gb25jZSB8fCAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSBvbmNlIHx8ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHRcdH0gLy9ldmVyeVxyXG5cdFx0XHRmdW5jdGlvbiBpbmgob25lOiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0XHRjYy5fdG91Y2hlc1swXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdFx0aWYgKCFvbmUpIGNjLl90b3VjaGVzWzFdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0fSAvL2luaFxyXG5cclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblxyXG5cdFx0XHRpZiAoY2MuZHJhZ0VuYWJsZWQgJiYgY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0bGV0IGNwOiBudW1iZXJbXSA9IEFycmF5LmZyb20oY2MudHJhbnMpLFxyXG5cdFx0XHRcdFx0ZGlzOiBudW1iZXI7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLltjb29yZHNbMF0gLSBjYy5fY29vcmRpbmF0ZXNbMF0sIGNvb3Jkc1sxXSAtIGNjLl9jb29yZGluYXRlc1sxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy50cmFuc1NwZWVkKSk7XHJcblx0XHRcdFx0ZGlzID0gZGlzdChbY3BbMF0sIGNjLnRyYW5zWzBdXSwgW2NwWzFdLCBjYy50cmFuc1sxXV0pO1xyXG5cdFx0XHRcdGlmIChkaXMgPiBjYy50b3VjaFNlbnNpdGl2aXR5KSBjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdFx0aW5oKHRydWUpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNjLnBpbmNoRW5hYmxlZCAmJiBjYy5fdG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlcnkoYXJyYXluZ2UoZXZlbnQudGFyZ2V0VG91Y2hlcyksIGNjLl90b3VjaGVzLCBmYWxzZSwgdHJ1ZSkpIHtcclxuXHRcdFx0XHRpZiAoKGNjLnNjYWxlTW9kZSAmIE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkgPT09IE9wdHMuU2NhbGVNb2RlLkZSRUVTQ0FMRSkge1xyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlcltdID0gW01hdGguYWJzKGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0gLSBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdKSwgTWF0aC5hYnMoY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSAtIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV0pXSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXJbXSA9IFtNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSAyICogY2MudGFyZ2V0Lm9mZnNldExlZnQpLCBNYXRoLmFicyhldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSAyICogY2MudGFyZ2V0Lm9mZnNldFRvcCldLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlcltdID0gW2Rpc1swXSAvIGluaWRpc3RbMF0sIGRpc1sxXSAvIGluaWRpc3RbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2Muc2NsU3BlZWQpLFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgKiAoMSAtIGRbaWR4XSkpO1xyXG5cclxuXHRcdFx0XHRcdGlmIChjYy5fem9vbUNoYW5nZWRbMF0pIGNjLnRyYW5zbGF0ZShudG91Y2hlc1swXSk7XHJcblx0XHRcdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkWzFdKSBjYy50cmFuc2xhdGUobnRvdWNoZXNbMV0pO1xyXG5cdFx0XHRcdFx0Y2Muc2NhbGUoZFswXSwgZFsxXSk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdC8vQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlciA9IGRpc3QoW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF1dLCBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXV0pLFxyXG5cdFx0XHRcdFx0XHRkaXM6IG51bWJlciA9IGRpc3QoW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdF0sIFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wLCBldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSksXHJcblx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0ZDogbnVtYmVyID0gY2Muc2NsU3BlZWQgKiBkaXMgLyBpbmlkaXN0LFxyXG5cdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlcikgPT4gaSAqICgxIC0gZCkpO1xyXG5cclxuXHRcdFx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0XHRcdFx0aWYgKGNjLl96b29tQ2hhbmdlZC5ldmVyeSgoem06IGJvb2xlYW4pOiBib29sZWFuID0+IHptKSkgY2MudHJhbnNsYXRlKC4uLm50b3VjaGVzKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aW5oKCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHRcdH0gLy9kcmFnTW9iaWxlTW92ZVxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZVN0YXJ0KGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzLCBjdXN0OiBib29sZWFuID0gZmFsc2UpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGlmICghY3VzdCkge1xyXG5cdFx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdLFxyXG5cdFx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4gY2MuX3RvdWNoZXNbdC5pZGVudGlmaWVyXSA9IFt0LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCB0b3VjaCBvZiBldmVudC5jaGFuZ2VkVG91Y2hlcykge1xyXG5cdFx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblxyXG5cdFx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuX2lzT24oY29vcmRzKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhjb29yZHMpKTtcclxuXHRcdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNjLl90b3VjaGVzW2NjLl90b3VjaGVzLmxlbmd0aCAtIDFdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVTdGFydFxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZUVuZChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSAmJiBEYXRlLm5vdygpIC0gY2MuX2Nsa3RpbWUgPD0gY2MuY2xpY2tTZW5zaXRpdml0eSkge1xyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5faXNPbihjb29yZHMpICYmIChyZXQgPSBidXR0LmNsaWNrKGNvb3JkcykpO1xyXG5cdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXMuc3BsaWNlKHQuaWRlbnRpZmllciwgMSk7XHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0aWYgKE9iamVjdC5rZXlzKGNjLl90b3VjaGVzKS5sZW5ndGggPT0gMSkge1xyXG5cdFx0XHRcdENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlU3RhcnQoZXZlbnQsIGNjLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSAhIWNjLl90b3VjaGVzLmxlbmd0aDtcclxuXHRcdH0gLy9kcmFnTW9iaWxlRW5kXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgd2hlZWwoZXZlbnQ6IFdoZWVsRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHRcdFx0bGV0IGQ6IG51bWJlciA9IDEgLSBjYy5zY2xTcGVlZCAqIENvbnRyb2xsYWJsZUNhbnZhcy5maXhEZWx0YShldmVudC5kZWx0YU1vZGUsIGV2ZW50LmRlbHRhWSkgLyBjYy5taW4sXHJcblx0XHRcdFx0Y29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV07XHJcblx0XHRcdGNjLnNjYWxlKGQpO1xyXG5cdFx0XHRpZiAoY2MuX3pvb21DaGFuZ2VkLmV2ZXJ5KCh6bTogYm9vbGVhbik6IGJvb2xlYW4gPT4gem0pKSBjYy50cmFuc2xhdGUoLi4uY29vcmRzLm1hcCgoYzogbnVtYmVyKSA9PiBjICogKDEgLSBkKSkpO1xyXG5cdFx0fSAvL3doZWVsXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgY2xpY2tQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFsoZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAoZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dLFxyXG5cdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBidXR0IG9mIHNvcnRlZCkge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0Ll9pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzKSk7XHJcblx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9jbGlja1BDXHJcblxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBpc01vYmlsZSgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvd2ViT1MvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2lzTW9iaWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZ2V0IGxpbmVUb1BpeCgpOiBudW1iZXIge1xyXG5cdFx0XHRsZXQgcjogbnVtYmVyLFxyXG5cdFx0XHRcdGlmcmFtZTogSFRNTElGcmFtZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpO1xyXG5cdFx0XHRpZnJhbWUuc3JjID0gJyMnO1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XHJcblx0XHRcdGxldCBpd2luOiBXaW5kb3cgPSBpZnJhbWUuY29udGVudFdpbmRvdyxcclxuXHRcdFx0XHRpZG9jOiBEb2N1bWVudCA9IGl3aW4uZG9jdW1lbnQ7XHJcblx0XHRcdGlkb2Mub3BlbigpO1xyXG5cdFx0XHRpZG9jLndyaXRlKCc8IURPQ1RZUEUgaHRtbD48aHRtbD48aGVhZD48L2hlYWQ+PGJvZHk+PHA+YTwvcD48L2JvZHk+PC9odG1sPicpO1xyXG5cdFx0XHRpZG9jLmNsb3NlKCk7XHJcblx0XHRcdGxldCBzcGFuOiBIVE1MRWxlbWVudCA9IDxIVE1MRWxlbWVudD5pZG9jLmJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XHJcblx0XHRcdHIgPSBzcGFuLm9mZnNldEhlaWdodDtcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRyZXR1cm4gcjtcclxuXHRcdH0gLy9saW5lVG9QaXhcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBmaXhEZWx0YShtb2RlOiBudW1iZXIsIGRlbHRhWTogbnVtYmVyKTogbnVtYmVyIHtcclxuXHRcdFx0aWYgKG1vZGUgPT09IDEpIHtcclxuXHRcdFx0XHRyZXR1cm4gQ29udHJvbGxhYmxlQ2FudmFzLl9saW5lcGl4ICogZGVsdGFZO1xyXG5cdFx0XHR9IGVsc2UgaWYgKG1vZGUgPT09IDIpIHtcclxuXHRcdFx0XHRyZXR1cm4gd2luZG93LmlubmVySGVpZ2h0O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBkZWx0YVk7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9maXhEZWx0YVxyXG5cdH0gLy9Db250cm9sbGFibGVDYW52YXNcclxuXHJcblx0LyoqXHJcblx0ICogQSBjbGFzcyB0byBjb250cm9sIGtleWJvYXJkIGV2ZW50c1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBLZXlCaW5kIHtcclxuXHRcdHByZXNzOiBLZXlbXSA9IFtdO1xyXG5cdFx0ZG93bjogS2V5W10gPSBbXTtcclxuXHRcdHVwOiBLZXlbXSA9IFtdO1xyXG5cdFx0ZWxlbWVudDogSFRNTEVsZW1lbnQ7XHJcblx0XHRfYm91bmQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdGFycm93TW92ZVNwZWVkOiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZHVwOiBudW1iZXI7XHJcblx0XHRhcnJvd01vdmVTcGVlZE1heDogbnVtYmVyO1xyXG5cdFx0YXJyb3dNb3ZlU3BlZWR1cEVuYWJsZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cdFx0YXJyb3dCaW5kaW5nczoge1xyXG5cdFx0XHRba2V5OiBzdHJpbmddOiBudW1iZXJbXTtcclxuXHRcdH0gPSB7fTtcclxuXHJcblx0XHRzdGF0aWMgX2lkY250ciA9IDA7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWQ6IG51bWJlciA9IDU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWR1cDogbnVtYmVyID0gLjU7XHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlU3BlZWRNYXg6IG51bWJlciA9IDIwO1xyXG5cdFx0c3RhdGljIGFycm93TW92ZVNwZWVkdXBFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0c3RhdGljIGFycm93QmluZGluZ3M6IHtcclxuXHRcdFx0W2tleTogc3RyaW5nXTogbnVtYmVyW107XHJcblx0XHR9ID0ge1xyXG5cdFx0XHRcdEFycm93VXA6IFswLCAxXSxcclxuXHRcdFx0XHRBcnJvd0Rvd246IFswLCAtMV0sXHJcblx0XHRcdFx0QXJyb3dMZWZ0OiBbMSwgMF0sXHJcblx0XHRcdFx0QXJyb3dSaWdodDogWy0xLCAwXVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBiaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5lbGVtZW50ID0gZWxlbWVudDtcclxuXHRcdFx0T2JqZWN0LmFzc2lnbih0aGlzLmFycm93QmluZGluZ3MsIEtleUJpbmQuYXJyb3dCaW5kaW5ncyk7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWQgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkO1xyXG5cdFx0XHR0aGlzLmFycm93TW92ZVNwZWVkdXAgPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkdXA7XHJcblx0XHRcdHRoaXMuYXJyb3dNb3ZlU3BlZWRNYXggPSBLZXlCaW5kLmFycm93TW92ZVNwZWVkTWF4O1xyXG5cdFx0XHRiaW5kICYmIHRoaXMuYmluZCgpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHRzdGF0aWMgYXJyb3dNb3ZlKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKHR5cGUgPT09IFwia2V5ZG93blwiKSB7XHJcblx0XHRcdFx0ZXZlbnQudGFyZ2V0W1wiX2NjX1wiXS50cmFuc2xhdGUodGhpcy5hcnJvd01vdmVTcGVlZCAqIHRoaXMuYXJyb3dCaW5kaW5nc1tldmVudC5rZXldWzBdLCB0aGlzLmFycm93TW92ZVNwZWVkICogdGhpcy5hcnJvd0JpbmRpbmdzW2V2ZW50LmtleV1bMV0pO1xyXG5cdFx0XHRcdGlmICh0aGlzLmFycm93TW92ZVNwZWVkdXBFbmFibGVkKSB0aGlzLmFycm93TW92ZVNwZWVkID0gYm91bmQodGhpcy5hcnJvd01vdmVTcGVlZCArIHRoaXMuYXJyb3dNb3ZlU3BlZWR1cCwgMCwgdGhpcy5hcnJvd01vdmVTcGVlZE1heCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5hcnJvd01vdmVTcGVlZCA9IEtleUJpbmQuYXJyb3dNb3ZlU3BlZWQ7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2Fycm93TW92ZVxyXG5cclxuXHRcdGJpbmRBcnJvd3MoKTogdm9pZCB7XHJcblx0XHRcdGZvciAobGV0IGkgaW4gdGhpcy5hcnJvd0JpbmRpbmdzKSB7XHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlcktleWRvd24oaSwgS2V5QmluZC5hcnJvd01vdmUuYmluZCh0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy5yZWdpc3RlcktleXVwKGksIEtleUJpbmQuYXJyb3dNb3ZlLmJpbmQodGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuYmluZEFycm93cyA9ICgpOiB2b2lkID0+IHsgfTtcclxuXHRcdH0gLy9iaW5kQXJyb3dzXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBCaW5kIGtleSBldmVudCBsaXN0ZW5lcnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtib29sZWFufVxyXG5cdFx0ICovXHJcblx0XHRiaW5kKCk6IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAoIXRoaXMuX2JvdW5kKSB7XHJcblx0XHRcdFx0dGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlwcmVzc1wiLCAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiBib29sZWFuID0+IHRoaXMuX2hhbmRsZXIuYmluZCh0aGlzKShcImtleXByZXNzXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXl1cFwiLCBldmVudCksIGZhbHNlKTtcclxuXHRcdFx0XHR0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiA9PiB0aGlzLl9oYW5kbGVyLmJpbmQodGhpcykoXCJrZXlkb3duXCIsIGV2ZW50KSwgZmFsc2UpO1xyXG5cdFx0XHRcdHJldHVybiB0aGlzLl9ib3VuZCA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2JpbmRcclxuXHJcblx0XHRfaGFuZGxlcih0eXBlOiBzdHJpbmcsIGV2ZW50OiBLZXlib2FyZEV2ZW50KTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBoYW5kbGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRcdHRoaXNbdHlwZS5yZXBsYWNlKFwia2V5XCIsICcnKV0uZm9yRWFjaCgoa2V5OiBLZXkpOiB2b2lkID0+IHtcclxuXHRcdFx0XHRpZiAoa2V5LmtleSA9PT0gZXZlbnQua2V5KSB7XHJcblx0XHRcdFx0XHRoYW5kbGVkID0gIWtleS5jYWxsYmFjayhldmVudCwgdHlwZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZWQ7XHJcblx0XHR9IC8vX2hhbmRsZXJcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleXByZXNzKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMucHJlc3MucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJwcmVzc1wiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5cHJlc3NcclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmd9IGtleVxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBjYihldmVudClcclxuXHRcdCAqIEByZXR1cm5zIHtLZXl9XHJcblx0XHQgKi9cclxuXHRcdHJlZ2lzdGVyS2V5ZG93bihrZXk6IHN0cmluZywgY2FsbGJhY2s6IChldmVudDogS2V5Ym9hcmRFdmVudCwgdHlwZTogc3RyaW5nKSA9PiBib29sZWFuKTogS2V5IHtcclxuXHRcdFx0bGV0IG91dDogS2V5O1xyXG5cdFx0XHR0aGlzLmRvd24ucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJkb3duXCIgfSk7XHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vcmVnaXN0ZXJLZXlkb3duXHJcblx0XHQvKipcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gY2IoZXZlbnQpXHJcblx0XHQgKiBAcmV0dXJucyB7S2V5fVxyXG5cdFx0ICovXHJcblx0XHRyZWdpc3RlcktleXVwKGtleTogc3RyaW5nLCBjYWxsYmFjazogKGV2ZW50OiBLZXlib2FyZEV2ZW50LCB0eXBlOiBzdHJpbmcpID0+IGJvb2xlYW4pOiBLZXkge1xyXG5cdFx0XHRsZXQgb3V0OiBLZXk7XHJcblx0XHRcdHRoaXMudXAucHVzaChvdXQgPSB7IGtleToga2V5LCBjYWxsYmFjazogY2FsbGJhY2ssIGlkOiBLZXlCaW5kLl9pZGNudHIrKywgdHlwZTogXCJ1cFwiIH0pO1xyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL3JlZ2lzdGVyS2V5dXBcclxuXHRcdC8qKlxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtLZXl9IGtleVxyXG5cdFx0ICovXHJcblx0XHR1bnJlZ2lzdGVyKGtleTogS2V5IHwgbnVtYmVyIHwgc3RyaW5nLCByZXBsOiBLZXkpOiBLZXkgfCBLZXlbXSB8IGJvb2xlYW4ge1xyXG5cdFx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJudW1iZXJcIikge1xyXG5cdFx0XHRcdGxldCBpZHg6IG51bWJlcjtcclxuXHRcdFx0XHRpZiAoKGlkeCA9IHRoaXMucHJlc3MuZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleSkpID49IDApIHtcclxuXHRcdFx0XHRcdHJldHVybiB0aGlzLnByZXNzLnNwbGljZShpZHgsIDEsIHJlcGwpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoKGlkeCA9IHRoaXMuZG93bi5maW5kSW5kZXgoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5pZCA9PT0ga2V5KSkgPj0gMCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZG93bi5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKChpZHggPSB0aGlzLnVwLmZpbmRJbmRleCgoazogS2V5KTogYm9vbGVhbiA9PiBrLmlkID09PSBrZXkpKSA+PSAwKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy51cC5zcGxpY2UoaWR4LCAxLCByZXBsKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0dGhpcy5wcmVzcyA9IHRoaXMucHJlc3MuZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHRcdHRoaXMuZG93biA9IHRoaXMuZG93bi5maWx0ZXIoKGs6IEtleSk6IGJvb2xlYW4gPT4gay5rZXkgIT09IGtleSk7XHJcblx0XHRcdFx0dGhpcy51cCA9IHRoaXMudXAuZmlsdGVyKChrOiBLZXkpOiBib29sZWFuID0+IGsua2V5ICE9PSBrZXkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0aGlzW2tleS50eXBlXS5zcGxpY2UodGhpc1trZXkudHlwZV0uZmluZEluZGV4KChrOiBLZXkpOiBib29sZWFuID0+IGsuaWQgPT09IGtleS5pZCksIDEsIHJlcGwpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vdW5yZWdpc3RlclxyXG5cdH0gLy9LZXlCaW5kXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQG1lbWJlcm9mIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0gZHggLSB3aWR0aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR5IC0gaGVpZ2h0XHJcblx0ICogQHByb3Age251bWJlcn0gaW5kZXggLSBlcXVpdmFsZW50IHRvIENTUyB6LWluZGV4XHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENhbnZhc0J1dHRvbiBpbXBsZW1lbnRzIE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHR4OiBudW1iZXIgPSAwO1xyXG5cdFx0eTogbnVtYmVyID0gMDtcclxuXHRcdGR4OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHk6IG51bWJlciA9IDA7XHJcblx0XHRpbmRleDogbnVtYmVyID0gLTE7XHJcblx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdF9pZDogbnVtYmVyO1xyXG5cdFx0ZW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRwc3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBvc2l0aW9uOiBudW1iZXIgPSAyO1xyXG5cclxuXHRcdHN0YXRpYyBzZW5zaXRpdml0eTogbnVtYmVyID0gLjM7XHJcblx0XHRwcml2YXRlIHN0YXRpYyBfaWRjbnRyOiBudW1iZXIgPSAwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENhbnZhc0J1dHRvblxyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5DYW52YXNCdXR0b25PcHRpb25zID0ge1xyXG5cdFx0XHR4OiAwLFxyXG5cdFx0XHR5OiAwLFxyXG5cdFx0XHRkeDogMCxcclxuXHRcdFx0ZHk6IDAsXHJcblx0XHRcdGluZGV4OiAtMSxcclxuXHRcdFx0cHN0YXRlOiBmYWxzZSxcclxuXHRcdFx0ZW5hYmxlZDogdHJ1ZSxcclxuXHRcdFx0cG9zaXRpb246IDIsXHJcblx0XHRcdHBhcmVudDogbmV3IENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpIHsgIC8vRE9VQkxFQ0xJQ0ssIExPTkdDTElDSywgRFJBRywgLi4uIFVTRVItSU1QTEVNRU5URUQoPylcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpO1xyXG5cclxuXHRcdFx0aWYgKFtvcHRzLngsIG9wdHMueSwgb3B0cy5keCwgb3B0cy5keSwgb3B0cy5wb3NpdGlvbiwgb3B0cy5pbmRleF0uc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy54ID0gb3B0cy54ICogMTtcclxuXHRcdFx0dGhpcy55ID0gb3B0cy55ICogMTtcclxuXHRcdFx0dGhpcy5keCA9IG9wdHMuZHggKiAxO1xyXG5cdFx0XHR0aGlzLmR5ID0gb3B0cy5keSAqIDE7XHJcblx0XHRcdHRoaXMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uIHwgMDtcclxuXHRcdFx0dGhpcy5pbmRleCA9IG9wdHMuaW5kZXggfCAwO1xyXG5cdFx0XHR0aGlzLmVuYWJsZWQgPSAhIW9wdHMuZW5hYmxlZDtcclxuXHRcdFx0dGhpcy5faWQgPSBDYW52YXNCdXR0b24uX2lkY250cisrO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBleGl0ZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Ymx1ciguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2JsdXJcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGVudGVyZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Zm9jdXMoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vZm9jdXNcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGNsaWNrZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Y2xpY2soLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9jbGlja1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgYWJvdmUgdGhlIHdpZGdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJbXX0gcmVsYXRpdmVDb29yZHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqL1xyXG5cdFx0X2lzT24ocmVsYXRpdmVDb29yZHM6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCB4OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uRklYRUQpID09PSBPcHRzLlBvc2l0aW9uLkZJWEVEID8gdGhpcy54IC0gdGhpcy5wYXJlbnQudHJhbnNbMF0gOiB0aGlzLngsXHJcblx0XHRcdFx0eTogbnVtYmVyID0gKHRoaXMucG9zaXRpb24gJiBPcHRzLlBvc2l0aW9uLkZJWEVEKSA9PT0gT3B0cy5Qb3NpdGlvbi5GSVhFRCA/IHRoaXMueSAtIHRoaXMucGFyZW50LnRyYW5zWzFdIDogdGhpcy55LFxyXG5cdFx0XHRcdGR4OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHggKiB0aGlzLnBhcmVudC5zY2xbMF0gOiB0aGlzLmR4LFxyXG5cdFx0XHRcdGR5OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSkgPT09IE9wdHMuUG9zaXRpb24uVU5TQ0FMQUJMRSA/IHRoaXMuZHkgKiB0aGlzLnBhcmVudC5zY2xbMV0gOiB0aGlzLmR5LFxyXG5cdFx0XHRcdG91dDogYm9vbGVhbiA9IGlzV2l0aGluKFt4LCB5LCBkeCwgZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSwgQ2FudmFzQnV0dG9uLnNlbnNpdGl2aXR5KTtcclxuXHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL19pc09uXHJcblx0fSAvL0NhbnZhc0J1dHRvblxyXG5cclxuXHRDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uID0gQ2FudmFzQnV0dG9uO1xyXG5cclxuXHQvKipcclxuXHQgKiBBIGNsYXNzIG9mZmVyaW5nIG1hdGhlbWF0aWNhbCBWZWN0b3IgdXRpbGl0aWVzXHJcblx0ICogQGlubmVyXHJcblx0ICogQGNsYXNzXHJcblx0ICogQHByb3Age251bWJlcltdfSBwcm9wcyAtIHZlY3RvciB2ZXJ0aWNlc1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBWZWN0b3Ige1xyXG5cdFx0cHJvcHM6IG51bWJlcltdO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKHByb3BzOiBudW1iZXJbXSA9IFtdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHR9IC8vVmVjdG9yXHJcblxyXG5cdC8qKlxyXG5cdCAqIEBwcm9wIHtIVE1MRWxlbWVudFtdfSByZXNvdXJjZXMgLSBBbGwgSFRNTCByZXNvdXJjZSBlbGVtZW50cyB3aXRoIFwibG9hZFwiIGxpc3RlbmVycyB0aGF0IHdpbGwgYmUgbG9hZGVkLiBsaWtlOiBhdWRpby9pbWdcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0cmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdID0gW107XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgaW1nID0gbmV3IEltYWdlKCk7XHJcblx0XHRcdFx0aW1nLnNyYyA9IHVybDtcclxuXHRcdFx0XHRpbWdsaXN0LnB1c2goaW1nKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIG5ldyBSZXNvdXJjZUxvYWRlcihpbWdsaXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9pbWFnZXNcclxuXHRcdC8qKlxyXG5cdFx0ICogTG9hZCBhdWRpbyBieSBVUkxzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKiBAcGFyYW0ge3N0cmluZ1tdfSB1cmxpc3QgLSBsaXN0IG9mIHVybHNcclxuXHRcdCAqIEBwYXJhbSB7RnVuY3Rpb259IG9ubG9hZCAtIGNhbGxiYWNrXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9iaW5kPXRydWUgLSBhdXRvIGJpbmRcclxuXHRcdCAqIEByZXR1cm5zIHtSZXNvdXJjZUxvYWRlcn0gdGhlIGxvYWRlclxyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgYXVkaW9zKHVybGlzdDogc3RyaW5nW10sIG9ubG9hZD86IChyZXM/OiBIVE1MRWxlbWVudCwgbG9hZD86IG51bWJlcikgPT4gdm9pZCwgYXV0b2JpbmQ6IGJvb2xlYW4gPSB0cnVlKTogUmVzb3VyY2VMb2FkZXIge1xyXG5cdFx0XHRsZXQgYXVkaW9saXN0OiBIVE1MQXVkaW9FbGVtZW50W10gPSBbXTtcclxuXHJcblx0XHRcdGZvciAobGV0IHVybCBvZiB1cmxpc3QpIHtcclxuXHRcdFx0XHRsZXQgYXVkaW8gPSBuZXcgQXVkaW8odXJsKTtcclxuXHRcdFx0XHRhdWRpby5sb2FkKCk7XHJcblx0XHRcdFx0YXVkaW9saXN0LnB1c2goYXVkaW8pO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gbmV3IFJlc291cmNlTG9hZGVyKGF1ZGlvbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vYXVkaW9zXHJcblx0fSAvL1Jlc291cmNlTG9hZGVyXHJcblxyXG59IC8vQ2FudmFzQ29udHJvbHNcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENhbnZhc0NvbnRyb2xzLkNvbnRyb2xsYWJsZUNhbnZhcztcclxuIl19