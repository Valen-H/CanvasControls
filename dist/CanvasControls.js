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
    CanvasControls.bound = bound;
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
            this.panEnabled = false; //OBS
            this.tiltEnabled = false; //OBS
            this.eventsReversed = false;
            this.useButton = Opts.UseButton.USELEFT;
            this.scaleMode = Opts.ScaleMode.NORMAL;
            this.transSpeed = 1;
            this.sclSpeed = 1;
            this.touchSensitivity = .5;
            this.clickSensitivity = 800;
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
            return this.scl = this.scl.map((scl, idx) => bound(Number(!abs ? (scl * by[idx]) : by[idx]), this.sclBounds[idx], this.sclBounds[idx + 2]));
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
                if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT)
                    this.target.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true, passive: false });
            }
            if (!this._adapts.wheel && this.wheelEnabled) {
                this.target.addEventListener("wheel", this._adapts.wheel = (e) => ControllableCanvas.wheel(e, this));
            }
            if (!this._adapts.tilt && this.tiltEnabled) {
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
                butt.enabled && butt.isOn(rel = coords.map((c, idx) => (c - cc.trans[idx]) / cc.scl[idx])) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
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
                    cc.translate(...ntouches);
                    cc.scale(d[0], d[1]);
                }
                else {
                    //@ts-ignore
                    let inidist = dist([cc._touches[event.targetTouches[0].identifier][0], cc._touches[event.targetTouches[1].identifier][0]], [cc._touches[event.targetTouches[0].identifier][1], cc._touches[event.targetTouches[1].identifier][1]]), dis = dist([event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[1].clientX - cc.target.offsetLeft], [event.targetTouches[0].clientY - cc.target.offsetTop, event.targetTouches[1].clientY - cc.target.offsetTop]), itouches = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map((i, idx) => i / 2 - cc.trans[idx]), d = cc.sclSpeed * dis / inidist, ntouches = itouches.map((i) => i * (1 - d));
                    cc.translate(...ntouches);
                    cc.scale(d);
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
                        butt.enabled && butt.isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
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
                    butt.enabled && butt.isOn(coords);
                }
            }
            if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
                for (let butt of sorted) {
                    butt.enabled && butt.isOn(coords) && (ret = butt.click(coords));
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
            cc.translate(...coords.map((c) => c * (1 - d)));
            cc.scale(d);
        } //wheel
        static clickPC(event, cc) {
            let coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
            for (let butt of sorted) {
                butt.enabled && butt.isOn(coords) && (ret = butt.click(coords));
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
        dragEnabled: false,
        pinchEnabled: false,
        wheelEnabled: false,
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
        isOn(relativeCoords) {
            let x = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.x - this.parent.trans[0] : this.x, y = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.y - this.parent.trans[1] : this.y, dx = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dx * this.parent.scl[0] : this.dx, dy = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dy * this.parent.scl[1] : this.dy, out = isWithin([x, y, dx, dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);
            if (!out && this.pstate) {
                this.blur(relativeCoords);
                this.pstate = false;
            }
            return out;
        } //isOn
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7R0FPRztBQUVILFlBQVksQ0FBQzs7QUFDYiwyQkFBeUI7QUFFekI7Ozs7R0FJRztBQUVIOzs7OztHQUtHO0FBQ0gsSUFBYyxjQUFjLENBbTNCM0I7QUFuM0JELFdBQWMsY0FBYztJQUkzQjs7Ozs7Ozs7T0FRRztJQUNILFNBQVMsT0FBTyxDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsWUFBc0IsQ0FBQyxJQUFRLEVBQUUsSUFBUSxFQUFFLElBQVksRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUosS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7WUFDbkIsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxTQUFTO0lBQ1g7Ozs7Ozs7O09BUUc7SUFDSCxTQUFnQixLQUFLLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTO1FBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEMsQ0FBQyxDQUFDLE9BQU87SUFGTyxvQkFBSyxRQUVwQixDQUFBO0lBQ0Q7Ozs7Ozs7T0FPRztJQUNILFNBQVMsSUFBSSxDQUFDLEVBQVksRUFBRSxFQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFD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RUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDN0osSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtvQkFDM0UsSUFBSSxPQUFPLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN6UCxHQUFHLEdBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDM04sUUFBUSxHQUFhLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzFSLENBQUMsR0FBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFDNUYsUUFBUSxHQUFhLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsR0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFakYsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO29CQUMxQixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckI7cUJBQU07b0JBQ04sWUFBWTtvQkFDWixJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDek8sR0FBRyxHQUFXLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQ2hQLFFBQVEsR0FBYSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxD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S0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2IsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtZQUVELE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4RCxDQUFDLENBQUMsUUFBUTtLQUNWLENBQUMsZ0JBQWdCO0lBbkVMLDZCQUFjLGlCQW1FMUIsQ0FBQTtBQUVGLENBQUMsRUFuM0JhLGNBQWMsR0FBZCxzQkFBYyxLQUFkLHNCQUFjLFFBbTNCM0IsQ0FBQyxnQkFBZ0I7QUFFbEIsa0JBQWUsY0FBYyxDQUFDLGtCQUFrQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQW5nbGUgYmV0d2VlbiAzIHBvaW5zIChSYWRpYW5zKTpcclxuICogcGM6IGNlbnRlci9wb2xlXHJcbiAqIHBuOiBwb2ludCBuZXcgY29vcmRpbmF0ZXNcclxuICogcHA6IHBvaW50IHBhc3QgY29vcmRpbmF0ZXNcclxuICogXHJcbiAqIGF0YW4yKHBueSAtIHBjeSwgcG54IC0gcGN4KSAtIGF0YW4yKHBweSAtIHBjeSwgcHB4IC0gcGN4KVxyXG4gKi9cclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5pbXBvcnQgXCJAYmFiZWwvcG9seWZpbGxcIjtcclxuXHJcbi8qKlxyXG4gKiBAZmlsZSBDYW52YXNDb250cm9scy50c1xyXG4gKiBAY29weXJpZ2h0IFZhbGVuLiBILiAyazE4XHJcbiAqIEBhdXRob3IgVmFsZW4uSC4gPGFsdGVybmF0aXZleHh4eUBnbWFpbC5jb20+XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIFRoZSByb290IG9mIHRoZSBtYWluIGxpYnJhcnlcclxuICogQG1vZHVsZSBDYW52YXNDb250cm9sc1xyXG4gKiBAbGljZW5zZSBJU0NcclxuICogQGdsb2JhbFxyXG4gKi9cclxuZXhwb3J0IG1vZHVsZSBDYW52YXNDb250cm9scyB7XHJcblxyXG5cdHR5cGUgQ2xhc3MgPSB7IG5ldyguLi5hcmdzOiBhbnlbXSk6IGFueTsgfTtcclxuXHJcblx0LyoqXHJcblx0ICogSWYgYGRlc3RgIGxhY2tzIGEgcHJvcGVydHkgdGhhdCBgdGFyZ2AgaGFzIHRoZW4gdGhhdCBwcm9wZXJ0eSBpcyBjb3BpZWQgaW50byBgZGVzdGBcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gZGVzdCAtIGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnIC0gYmFzZSBvYmplY3RcclxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb25kaXRpb24gLSBpbmhlcml0YW5jZSBjb25kaXRpb25cclxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fSBkZXN0aW5hdGlvbiBvYmplY3RcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBpbmhlcml0KGRlc3Q6IHt9LCB0YXJnOiB7fSwgY29uZGl0aW9uOiBGdW5jdGlvbiA9IChkZXN0OiB7fSwgdGFyZzoge30sIHByb3A6IHN0cmluZyk6IGFueSA9PiBkZXN0W3Byb3BdID09PSB1bmRlZmluZWQgJiYgKGRlc3RbcHJvcF0gPSB0YXJnW3Byb3BdKSk6IHt9IHtcclxuXHRcdGZvciAobGV0IGkgaW4gdGFyZykge1xyXG5cdFx0XHRjb25kaXRpb24oZGVzdCwgdGFyZywgaSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlc3Q7XHJcblx0fSAvL2luaGVyaXRcclxuXHQvKipcclxuXHQgKiBSZXN0cmljdCBudW1iZXIncyByYW5nZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gdGFyZ2V0IG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gTSAtIG1heGltdW0gbnVtYmVyXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZXhwb3J0IGZ1bmN0aW9uIGJvdW5kKG46IG51bWJlciwgbTogbnVtYmVyLCBNOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0cmV0dXJuIG4gPiBNID8gTSA6IChuIDwgbSA/IG0gOiBuKTtcclxuXHR9IC8vYm91bmRcclxuXHQvKipcclxuXHQgKiBDYWxjdWxhdGUgZGlzdGFuY2UgYmV0d2VlbiAyIHBvaW50c1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFhzIC0gWCBjb29yZGluYXRlc1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFlzIC0gWSBjb29yZGluYXRlc1xyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGRpc3RhbmNlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZGlzdChYczogbnVtYmVyW10sIFlzOiBudW1iZXJbXSk6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFtYc1sxXSAtIFhzWzBdLCBZc1sxXSAtIFlzWzBdXS5tYXAoKHY6IG51bWJlcikgPT4gTWF0aC5wb3codiwgMikpLnJlZHVjZSgoYWNjOiBudW1iZXIsIHY6IG51bWJlcikgPT4gYWNjICsgdikpO1xyXG5cdH0gLy9kaXN0XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgaW5zaWRlIGFuIGFyZWFcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBib3ggLSB4LHksZHgsZHlcclxuXHQgKiBAcGFyYW0ge251bWJlcltdfSBwb2ludCAtIHgseVxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBzZW5zaXRpdml0eSAtIGV4dHJhIGJvdW5kYXJ5XHJcblx0ICogQHJldHVybnMgYm9vbGVhblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGlzV2l0aGluKGJveDogbnVtYmVyW10sIHBvaW50OiBudW1iZXJbXSwgc2Vuc2l0aXZpdHk6IG51bWJlciA9IC41KTogYm9vbGVhbiB7XHJcblx0XHRyZXR1cm4gYm94WzBdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMF0gJiYgYm94WzBdICsgYm94WzJdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMF0gJiYgYm94WzFdIC0gc2Vuc2l0aXZpdHkgPD0gcG9pbnRbMV0gJiYgYm94WzFdICsgYm94WzNdICsgc2Vuc2l0aXZpdHkgPj0gcG9pbnRbMV07XHJcblx0fSAvL2lzV2l0aGluXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgaG9sZGVyIGZvciBhbGwgT3B0aW9uc1xyXG5cdCAqIEBuYW1lc3BhY2VcclxuXHQgKi9cclxuXHRleHBvcnQgbmFtZXNwYWNlIE9wdHMge1xyXG5cdFx0LyoqXHJcblx0XHQgKiBBIHdyYXBwZXIgZm9yIHRoZSB0YXJnZXRlZCBjYW52YXMgZWxlbWVudFxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHNjbD0xLDEgLSBTY2FsaW5nXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gcGluPz10aGlzLnRhcmdldC53aWR0aC8yLHRoaXMudGFyZ2V0LmhlaWdodC8yIC0gUHNldWRvLWNlbnRlclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwaW5jaEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiAyLWZpbmdlciBwaW5jaCAoMSBmaW5nZXIgb25seSBzaGFsbCBtb3ZlKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBhbkVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gYmFzZWQgb24gbW91c2UvZmluZ2VyIGRpc3RhbmNlIGZyb20gcGluIChwc2V1ZG8tY2VudGVyKVxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuVXNlQnV0dG9ufSB1c2VCdXR0b249T3B0cy5Vc2VCdXR0b24uVVNFTEVGVCAtIFJlc3BvbmQgdG8gbGVmdC1jbGljaywgcmlnaHQgb3IgYm90aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0XHQgKiBAbWVtYmVyIHtPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzfSBfYWRhcHRzIC0gTWFwIG9mIGFsbCBjdXJyZW50bHkgYXR0YWNoZWQgY29udHJvbCBldmVudCBhZGFwdGVyc1xyXG5cdFx0ICogQG1lbWJlciB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0XHR0YXJnZXQ6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdFx0XHR0cmFuczogbnVtYmVyW107XHJcblx0XHRcdHNjbDogbnVtYmVyW107XHJcblx0XHRcdGRyYWdFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHdoZWVsRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0cGFuRW5hYmxlZDogYm9vbGVhbjtcclxuXHRcdFx0dGlsdEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdGV2ZW50c1JldmVyc2VkOiBib29sZWFuO1xyXG5cdFx0XHR1c2VCdXR0b246IG51bWJlcjtcclxuXHRcdFx0c2NhbGVNb2RlOiBudW1iZXI7XHJcblx0XHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXTtcclxuXHRcdFx0c2NsQm91bmRzOiBudW1iZXJbXTtcclxuXHRcdFx0dHJhbnNTcGVlZDogbnVtYmVyO1xyXG5cdFx0XHRzY2xTcGVlZDogbnVtYmVyO1xyXG5cdFx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXI7XHJcblx0XHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlcjtcclxuXHRcdFx0X2FkYXB0czogQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNPcHRpb25zXHJcblx0XHQvKipcclxuXHRcdCAqIE06IG1vYmlsZVxyXG5cdFx0ICogUDogcGNcclxuXHRcdCAqIE1QOiBib3RoXHJcblx0XHQgKiBcclxuXHRcdCAqIGRyYWc6XHJcblx0XHQgKlx0UDogbW91c2UgIGhvbGQgJiBtb3ZlXHJcblx0XHQgKlx0TTogdG91Y2ggIGhvbGQgJiBtb3ZlXHJcblx0XHQgKiBwaW5jaDpcclxuXHRcdCAqXHR0b3VjaCAgMi1maW5nZXIgJiBtb3ZlXHJcblx0XHQgKiB3aGVlbDpcclxuXHRcdCAqXHR3aGVlbCAgbW92ZSAgW3BjIHBpbmNoLWVxdWl2YWxlbnRdXHJcblx0XHQgKiBwYW46XHJcblx0XHQgKlx0ZGlzcG9zaXRpb24gZnJvbSBjZW50ZXIgY2F1c2VzIGNvbnN0YW50IHRyYW5zbGF0aW9uXHJcblx0XHQgKiB0aWx0OlxyXG5cdFx0ICpcdGRldmljZW1vdGlvbiAgY2F1c2VzIHBhbm5pbmcqXHJcblx0XHQgKlx0XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzIHtcclxuXHRcdFx0ZHJhZzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NUFxyXG5cdFx0XHRwaW5jaD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVxyXG5cdFx0XHR3aGVlbD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vUFxyXG5cdFx0XHRwYW46IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0dGlsdD86IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0Y2xpY2s6IEZ1bmN0aW9uIHwgYm9vbGVhbjsgIC8vTVBcclxuXHRcdFx0W3Byb3A6IHN0cmluZ106IGFueTtcclxuXHRcdH0gLy9Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc1xyXG5cdFx0LyoqXHJcblx0XHQgKiBPcHRpb25zIG9mIENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b25cclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSB4IC0geCBjb29yZGluYXRlXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHkgLSB5IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHggLSB3aWRnZXQgd2lkdGhcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gZHkgLSB3aWRnZXQgaGVpZ2h0XHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IGluZGV4IC0gd2lkZ2V0IGV2ZW50IHByaW9yaXR5XHJcblx0XHQgKi9cclxuXHRcdGV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBDYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdFx0eDogbnVtYmVyO1xyXG5cdFx0XHR5OiBudW1iZXI7XHJcblx0XHRcdGR4OiBudW1iZXI7XHJcblx0XHRcdGR5OiBudW1iZXI7XHJcblx0XHRcdGluZGV4OiBudW1iZXI7XHJcblx0XHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0XHRlbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRwb3NpdGlvbjogbnVtYmVyO1xyXG5cdFx0XHRbcHJvcDogc3RyaW5nXTogYW55O1xyXG5cdFx0fSAvL0NhbnZhc0J1dHRvbk9wdGlvbnNcclxuXHJcblx0XHRleHBvcnQgZW51bSBVc2VCdXR0b24ge1xyXG5cdFx0XHRVU0VMRUZUID0gMSwgVVNFUklHSFQsIFVTRUJPVEhcclxuXHRcdH0gLy9Vc2VCdXR0b25cclxuXHRcdGV4cG9ydCBlbnVtIFNjYWxlTW9kZSB7XHJcblx0XHRcdE5PUk1BTCA9IDEsIEZSRUVTQ0FMRVxyXG5cdFx0fSAvL1NjYWxlTW9kZVxyXG5cdFx0ZXhwb3J0IGVudW0gUG9zaXRpb24ge1xyXG5cdFx0XHRGSVhFRCA9IDEsIEFCU09MVVRFLCBVTlNDQUxBQkxFID0gNFxyXG5cdFx0fSAvL1Bvc2l0aW9uXHJcblx0fSAvL09wdHNcclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBlcnJvcnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMge1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDQU5WOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEhUTUxDYW52YXNFbGVtZW50LlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ1RYOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNQVJSMjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBBcnJheSBvZiAyLWF0LWxlYXN0IE51bWJlcnMuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU06IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYSB2YWxpZCBOdW1iZXIuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVJU0FMUjogUmVmZXJlbmNlRXJyb3IgPSBuZXcgUmVmZXJlbmNlRXJyb3IoXCJPYmplY3QgaXMgYWxyZWFkeSByZWdpc3RlcmVkLlwiKTtcclxuXHR9IC8vRXJyb3JzXHJcblxyXG5cdFxyXG5cdC8qKlxyXG5cdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0ICogQGNsYXNzXHJcblx0ICogQGltcGxlbWVudHMge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc31cclxuXHQgKiBAcHJvcCB7SFRNTENhbnZhc0VsZW1lbnR9IHRhcmdldD1maXJzdENhbnZPY2N1ckluRG9jIC0gQm91bmQgY2FudmFzXHJcblx0ICogQHByb3Age0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY29udGV4dD89dGFyZ2V0LmdldENvbnRleHQoXCIyZFwiKSAtIFRoZSAyZCBjb250ZXh0IGNyZWF0ZWQgb3V0IG9mIGB0YXJnZXRgXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFucz0wLDAgLSBUcmFuc2xhdGlvblxyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHBpbj89dGhpcy50YXJnZXQud2lkdGgvMix0aGlzLnRhcmdldC5oZWlnaHQvMiAtIFBzZXVkby1jZW50ZXJcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zQm91bmQ9LUluZmluaXR5LC1JbmZpbml0eSxJbmZpbml0eSxJbmZpbml0eSAtIE1heCB0cmFuc2xhdGlvbiBib3VuZGFyaWVzXHJcblx0ICogQHByb3Age2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gMi1maW5nZXIgcGluY2ggKGJvdGggZmluZ2VycyBzaGFsbCBtb3ZlKVxyXG5cdCAqIEBwcm9wIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBwYW5FbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIGJhc2VkIG9uIG1vdXNlL2ZpbmdlciBkaXN0YW5jZSBmcm9tIHBpbiAocHNldWRvLWNlbnRlcilcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gdGlsdEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgdHJhbnNsYXRpb24gb24gZGV2aWNlIG1vdmVtZW50XHJcblx0ICogQHByb3Age2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdCAqIEBwcm9wIHtPcHRzLlVzZUJ1dHRvbn0gdXNlQnV0dG9uPU9wdHMuVXNlQnV0dG9uLlVTRUxFRlQgLSBSZXNwb25kIHRvIGxlZnQtY2xpY2ssIHJpZ2h0IG9yIGJvdGhcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IF9jb29yZGluYXRlcyAtIEN1cnJlbnQgZXZlbnQgY29vcmRpbmF0ZXNcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB0cmFuc1NwZWVkPTEgLSBUcmFuc2xhdGlvbiBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHQgKiBAcHJvcCB7T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVyc30gX2FkYXB0cyAtIE1hcCBvZiBhbGwgY3VycmVudGx5IGF0dGFjaGVkIGNvbnRyb2wgZXZlbnQgYWRhcHRlcnNcclxuXHQgKiBAcHJvcCB7b2JqZWN0fSBfdG91Y2hlcyAtIE1hcCBvZiBhbGwgY3VycmVudCB0b3VjaGVzXHJcblx0ICogQHByb3Age0NsYXNzfSBDYW52YXNCdXR0b24gLSBBIHdpZGdldC1tYWtpbmcgY2xhc3MgZm9yIGNhbnZhc1xyXG5cdCAqIEBwcm9wIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBDb250cm9sbGFibGVDYW52YXMgaW1wbGVtZW50cyBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMge1xyXG5cdFx0dGFyZ2V0OiBIVE1MQ2FudmFzRWxlbWVudDtcclxuXHRcdGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuXHRcdHRyYW5zOiBudW1iZXJbXSA9IFswLCAwXTtcclxuXHRcdHNjbDogbnVtYmVyW10gPSBbMSwgMV07XHJcblx0XHRwaW46IG51bWJlcltdOyAgLy9PQlNcclxuXHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXSA9IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdHNjbEJvdW5kczogbnVtYmVyW10gPSBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGRyYWdFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHdoZWVsRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cGFuRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlOyAgLy9PQlNcclxuXHRcdHRpbHRFbmFibGVkOiBib29sZWFuID0gZmFsc2U7ICAvL09CU1xyXG5cdFx0ZXZlbnRzUmV2ZXJzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHVzZUJ1dHRvbjogbnVtYmVyID0gT3B0cy5Vc2VCdXR0b24uVVNFTEVGVDtcclxuXHRcdHNjYWxlTW9kZTogbnVtYmVyID0gT3B0cy5TY2FsZU1vZGUuTk9STUFMO1xyXG5cdFx0dHJhbnNTcGVlZDogbnVtYmVyID0gMTtcclxuXHRcdHNjbFNwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0dG91Y2hTZW5zaXRpdml0eTogbnVtYmVyID0gLjU7XHJcblx0XHRjbGlja1NlbnNpdGl2aXR5OiBudW1iZXIgPSA4MDA7XHJcblx0XHR3Z2V0czogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRwcml2YXRlIF9tb2JpbGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX3ByZXNzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX2Nsa3RpbWU6IG51bWJlciA9IDA7XHJcblx0XHRfYWRhcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0cHJpdmF0ZSBfY29vcmRpbmF0ZXM6IG51bWJlcltdID0gWyBdO1xyXG5cdFx0cHJpdmF0ZSBfdG91Y2hlczogbnVtYmVyW11bXSA9IFsgXTtcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBfbGluZXBpeDogbnVtYmVyID0gMTA7XHJcblx0XHRzdGF0aWMgQ2FudmFzQnV0dG9uOiBDbGFzcztcclxuXHRcdC8qKlxyXG5cdFx0ICogRGVmYXVsdCBvcHRpb25zIGZvciBDb250cm9sbGFibGVDYW52YXNcclxuXHRcdCAqIEByZWFkb25seVxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICovXHJcblx0XHRzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyA9IHtcclxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImNhbnZhc1wiKVswXSxcclxuXHRcdFx0dHJhbnM6IFswLCAwXSxcclxuXHRcdFx0c2NsOiBbMSwgMV0sXHJcblx0XHRcdGRyYWdFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGluY2hFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC4zNSxcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eTogODAwLFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWNrOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3Z2V0czogbmV3IFNldCgpXHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCEob3B0cy50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVENBTlY7XHJcblx0XHRcdH0gZWxzZSBpZiAoW29wdHMudHJhbnMsIG9wdHMuc2NsLCBvcHRzLnRyYW5zQm91bmRzLCBvcHRzLnNjbEJvdW5kc10uc29tZShhcnIgPT4gIShhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgYXJyLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShhcnIpLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW5oZXJpdChvcHRzLl9hZGFwdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cy5fYWRhcHRzKTsgIC8vUE9TU0lCTEUgRVJST1JcclxuXHJcblx0XHRcdGlmIChvcHRzLnBpbiA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0b3B0cy5waW4gPSBbb3B0cy50YXJnZXQud2lkdGggLyAyLCBvcHRzLnRhcmdldC5oZWlnaHQgLyAyXTtcclxuXHRcdFx0fSBlbHNlIGlmICghKG9wdHMucGluIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBvcHRzLnBpbi5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20ob3B0cy5waW4pLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xyXG5cdFx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLnRhcmdldC5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5cdFx0XHR0aGlzLl9hZGFwdHMgPSA8T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycz57IH07XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy50cmFuc1NwZWVkID0gb3B0cy50cmFuc1NwZWVkICogMTtcclxuXHRcdFx0dGhpcy5zY2xTcGVlZCA9IG9wdHMuc2NsU3BlZWQgKiAxO1xyXG5cdFx0XHR0aGlzLnRvdWNoU2Vuc2l0aXZpdHkgPSBvcHRzLnRvdWNoU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLmNsaWNrU2Vuc2l0aXZpdHkgPSBvcHRzLmNsaWNrU2Vuc2l0aXZpdHkgKiAxO1xyXG5cdFx0XHR0aGlzLnVzZUJ1dHRvbiA9IG9wdHMudXNlQnV0dG9uIHwgMDtcclxuXHRcdFx0dGhpcy5zY2FsZU1vZGUgPSBvcHRzLnNjYWxlTW9kZSB8IDA7XHJcblxyXG5cdFx0XHR0aGlzLndnZXRzID0gbmV3IFNldChvcHRzLndnZXRzKTtcclxuXHJcblx0XHRcdHRoaXMudHJhbnMgPSBBcnJheS5mcm9tKG9wdHMudHJhbnMpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnNjbCA9IEFycmF5LmZyb20ob3B0cy5zY2wpLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnBpbiA9IEFycmF5LmZyb20ob3B0cy5waW4pLm1hcChOdW1iZXIpO1xyXG5cdFx0XHR0aGlzLnRyYW5zQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHRcdFx0dGhpcy5zY2xCb3VuZHMgPSBBcnJheS5mcm9tKG9wdHMuc2NsQm91bmRzKS5tYXAoTnVtYmVyKTsgIC8vIHgsIHksIFgsIFlcclxuXHJcblx0XHRcdHRoaXMuZHJhZ0VuYWJsZWQgPSAhIW9wdHMuZHJhZ0VuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hFbmFibGVkID0gISFvcHRzLnBpbmNoRW5hYmxlZDtcclxuXHRcdFx0dGhpcy53aGVlbEVuYWJsZWQgPSAhIW9wdHMud2hlZWxFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBhbkVuYWJsZWQgPSAhIW9wdHMucGFuRW5hYmxlZDtcclxuXHRcdFx0dGhpcy50aWx0RW5hYmxlZCA9ICEhb3B0cy50aWx0RW5hYmxlZDtcclxuXHRcdFx0dGhpcy5ldmVudHNSZXZlcnNlZCA9ICEhb3B0cy5ldmVudHNSZXZlcnNlZDtcclxuXHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbIF07XHJcblx0XHRcdHRoaXMuX21vYmlsZSA9IENvbnRyb2xsYWJsZUNhbnZhcy5pc01vYmlsZTtcclxuXHRcdFx0aWYgKCFDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXgpIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCA9IENvbnRyb2xsYWJsZUNhbnZhcy5saW5lVG9QaXg7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdGdldCByYXRpbygpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50YXJnZXQud2lkdGggLyB0aGlzLnRhcmdldC5oZWlnaHQ7XHJcblx0XHR9IC8vZy1yYXRpbyAgT0JTXHJcblx0XHRnZXQgbWluKCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1pbih0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1pblxyXG5cdFx0Z2V0IG1heCgpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgodGhpcy50YXJnZXQud2lkdGgsIHRoaXMudGFyZ2V0LmhlaWdodCk7XHJcblx0XHR9IC8vZy1tYXggIE9CU1xyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9sc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICovXHJcblx0XHRoYW5kbGUoKTogdm9pZCB7XHJcblx0XHRcdHRoaXMuX21vYmlsZSA/IHRoaXMuX21vYmlsZUFkYXB0KCkgOiB0aGlzLl9wY0FkYXB0KCk7XHJcblx0XHR9IC8vaGFuZGxlXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCAoL2NyZWF0ZSkgYSB3aWRnZXQgaW4gdGhlIGNvbnRyb2xsZXJcclxuXHRcdCAqIEBwYXJhbSB7Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbnxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnN9IGRhdGEgLSBjb25zdHJ1Y3RvciBvcHRpb25zXHJcblx0XHQgKiBAcmV0dXJuIHtDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9ufSB0aGUgd2lkZ2V0XHJcblx0XHQgKi9cclxuXHRcdGFkZFdpZGdldChkYXRhOiBDYW52YXNCdXR0b24gfCBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMpOiBDYW52YXNCdXR0b24ge1xyXG5cdFx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbiAmJiAhdGhpcy53Z2V0cy5oYXMoZGF0YSkpIHtcclxuXHRcdFx0XHRkYXRhLnBhcmVudCA9IHRoaXM7XHJcblx0XHRcdFx0dGhpcy53Z2V0cy5hZGQoPENhbnZhc0J1dHRvbj5kYXRhKTtcclxuXHRcdFx0fSBlbHNlIGlmICghKGRhdGEgaW5zdGFuY2VvZiBDYW52YXNCdXR0b24pKSB7XHJcblx0XHRcdFx0ZGF0YSA9IG5ldyBDb250cm9sbGFibGVDYW52YXMuQ2FudmFzQnV0dG9uKDxPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnM+ZGF0YSk7XHJcblx0XHRcdFx0ZGF0YS5wYXJlbnQgPSB0aGlzO1xyXG5cdFx0XHRcdHRoaXMud2dldHMuYWRkKDxDYW52YXNCdXR0b24+ZGF0YSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVJU0FMUjtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gPENhbnZhc0J1dHRvbj5kYXRhO1xyXG5cdFx0fSAvL2FkZFdpZGdldFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIFJlLWFwcGx5IGludGVybmFsIHRyYW5zZm9ybWF0aW9uc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHJldHVybnMge0NvbnRyb2xsYWJsZUNhbnZhc30gdGhpcyAtIEZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0cmV0cmFuc2Zvcm0oKTogVGhpc1R5cGU8Q29udHJvbGxhYmxlQ2FudmFzPiB7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7ICAvL1NLRVcvUk9UQVRFIE5PVCBJTVBMRU1FTlRFRCEhXHJcblx0XHRcdHRoaXMuY29udGV4dC50cmFuc2xhdGUodGhpcy50cmFuc1swXSwgdGhpcy50cmFuc1sxXSk7XHJcblx0XHRcdHRoaXMuY29udGV4dC5zY2FsZSh0aGlzLnNjbFswXSwgdGhpcy5zY2xbMV0pO1xyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9yZXRyYW5zZm9ybVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogSW50ZXJtZWRpYXRlIHRyYW5zbGF0aW9uIGZ1bmN0aW9uIGZvciBpY29uaWMgdHJhbnNsYXRlIGJlZm9yZSB0aGUgcmVhbFxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHg9MCAtIHggdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSB5PTAgLSB5IHRyYW5zbGF0aW9uXHJcblx0XHQgKiBAcGFyYW0ge2Jvb2xlYW59IGFicz89ZmFsc2UgLSBhYnNvbHV0ZSB0cmFuc2xhdGlvbiBvciByZWxhdGl2ZSB0byBjdXJyZW50XHJcblx0XHQgKiBAcmV0dXJucyB7bnVtYmVyW119IFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKSA9PiAtYik7XHJcblx0XHRcdHJldHVybiB0aGlzLnRyYW5zID0gdGhpcy50cmFucy5tYXAoKHRybjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYm91bmQoTnVtYmVyKCFhYnMgPyAodHJuICsgYnlbaWR4XSkgOiBieVtpZHhdKSwgdGhpcy50cmFuc0JvdW5kc1tpZHhdLCB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdKSk7XHJcblx0XHR9IC8vdHJhbnNsYXRlXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSBzY2FsaW5nIGZ1bmN0aW9uIGZvciBpY29uaWMgc2NhbGUgYmVmb3JlIHRoZSByZWFsXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geD0xIC0geCBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHk9eCAtIHkgc2NhbGVcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWJzPz1mYWxzZSAtIGFic29sdXRlIHNjYWxlIG9yIHJlbGF0aXZlIHRvIGN1cnJlbnRcclxuXHRcdCAqIEByZXR1cm5zIHtudW1iZXJbXX0gUmV0dXJucyBjdXJyZW50IHRvdGFsIHNjYWxpbmdcclxuXHRcdCAqL1xyXG5cdFx0c2NhbGUoeDogbnVtYmVyID0gMSwgeTogbnVtYmVyID0geCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdGlmICh0aGlzLmV2ZW50c1JldmVyc2VkKSBieSA9IGJ5Lm1hcCgoYjogbnVtYmVyKSA9PiAtYik7XHJcblx0XHRcdHJldHVybiB0aGlzLnNjbCA9IHRoaXMuc2NsLm1hcCgoc2NsOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBib3VuZChOdW1iZXIoIWFicyA/IChzY2wgKiBieVtpZHhdKSA6IGJ5W2lkeF0pLCB0aGlzLnNjbEJvdW5kc1tpZHhdLCB0aGlzLnNjbEJvdW5kc1tpZHggKyAyXSkpO1xyXG5cdFx0fSAvL3NjYWxlXHJcblxyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLmRyYWcgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5fYWRhcHRzLnBpbmNoID0gdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogVG91Y2hFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVNb3ZlKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZTogVG91Y2hFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVFbmQoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoY2FuY2VsXCIsIChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy50aWx0ICYmIHRoaXMudGlsdEVuYWJsZWQpIHtcclxuXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fbW9iaWxlQWRhcHRcclxuXHRcdHByaXZhdGUgX3BjQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLmRyYWcgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogTW91c2VFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZT86IE1vdXNlRXZlbnQpID0+IHRoaXMuX3ByZXNzZWQgPSB0cnVlKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAoZT86IE1vdXNlRXZlbnQpID0+IHRoaXMuX3ByZXNzZWQgPSBmYWxzZSk7XHJcblx0XHRcdFx0aWYgKCh0aGlzLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZTogTW91c2VFdmVudCkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLndoZWVsICYmIHRoaXMud2hlZWxFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHRoaXMuX2FkYXB0cy53aGVlbCA9IChlOiBXaGVlbEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMud2hlZWwoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQgJiYgdGhpcy50aWx0RW5hYmxlZCkge1xyXG5cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRoaXMuX2FkYXB0cy5jbGljaykge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLl9hZGFwdHMuY2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmNsaWNrUEMoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vX3BjQWRhcHRcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdGxldCBjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdLFxyXG5cdFx0XHRcdHJlbDogbnVtYmVyW10gPSBbXSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNvb3JkcztcclxuXHJcblx0XHRcdGlmICgoKGNjLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQgJiYgKCgoXCJidXR0b25zXCIgaW4gZXZlbnQpICYmIChldmVudC5idXR0b25zICYgMikgPT09IDIpIHx8ICgoXCJ3aGljaFwiIGluIGV2ZW50KSAmJiBldmVudC53aGljaCA9PT0gMykgfHwgKChcImJ1dHRvblwiIGluIGV2ZW50KSAmJiBldmVudC5idXR0b24gPT09IDIpKSkgfHwgKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgPT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmIChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VCT1RIKSAhPT0gT3B0cy5Vc2VCdXR0b24uVVNFQk9USCAmJiAoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpICE9PSAyKSAmJiAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggIT09IDMpICYmICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uICE9PSAyKSkpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjYy5fcHJlc3NlZCkge1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZShldmVudC5tb3ZlbWVudFggKiBjYy50cmFuc1NwZWVkLCBldmVudC5tb3ZlbWVudFkgKiBjYy50cmFuc1NwZWVkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBjYy53Z2V0cykge1xyXG5cdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0LmlzT24ocmVsID0gY29vcmRzLm1hcCgoYzogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gKGMgLSBjYy50cmFuc1tpZHhdKSAvIGNjLnNjbFtpZHhdKSkgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMocmVsKSk7XHJcblx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9kcmFnUENcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBkcmFnTW9iaWxlTW92ZShldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRmdW5jdGlvbiBjaGVjayhhcnI6IG51bWJlcltdLCBjdXJyOiBudW1iZXJbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRcdGlmIChhcnIuZXZlcnkoKGFyOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBNYXRoLmFicyhhciAtIGN1cnJbaWR4XSkgPj0gY2MudG91Y2hTZW5zaXRpdml0eSkpIHtcclxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH0gLy9jaGVja1xyXG5cdFx0XHRmdW5jdGlvbiBhcnJheW5nZSh0bGlzOiBUb3VjaExpc3QpOiBudW1iZXJbXVtdIHtcclxuXHRcdFx0XHRyZXR1cm4gW1t0bGlzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdGxpc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0sIFt0bGlzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgdGxpc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF1dO1xyXG5cdFx0XHR9IC8vYXJyYXluZ2VcclxuXHRcdFx0ZnVuY3Rpb24gZXZlcnkodDogbnVtYmVyW11bXSwgbnQ6IG51bWJlcltdW10sIGFsbDogYm9vbGVhbiA9IGZhbHNlLCBvbmNlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuXHRcdFx0XHRsZXQgb3V0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGFsbCAmJiBjaGVjayh0WzBdLCBudFswXSkgJiYgY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGFsbCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFswXSwgbnRbMF0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSBvbmNlIHx8ICFvdXQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjaGVjayh0WzFdLCBudFsxXSkpIHtcclxuXHRcdFx0XHRcdG91dCA9IG9uY2UgfHwgIW91dDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIG91dDtcclxuXHRcdFx0fSAvL2V2ZXJ5XHJcblx0XHRcdGZ1bmN0aW9uIGluaChvbmU6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzWzBdID0gW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHRcdFx0XHRpZiAoIW9uZSkgY2MuX3RvdWNoZXNbMV0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHR9IC8vaW5oXHJcblxyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCAtIDFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCAtIDFdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXTtcclxuXHJcblx0XHRcdGlmIChjYy5kcmFnRW5hYmxlZCAmJiBjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEpIHtcclxuXHRcdFx0XHRsZXQgY3A6IG51bWJlcltdID0gQXJyYXkuZnJvbShjYy50cmFucyksXHJcblx0XHRcdFx0XHRkaXM6IG51bWJlcjtcclxuXHRcdFx0XHRjYy50cmFuc2xhdGUoLi4uW2Nvb3Jkc1swXSAtIGNjLl9jb29yZGluYXRlc1swXSwgY29vcmRzWzFdIC0gY2MuX2Nvb3JkaW5hdGVzWzFdXS5tYXAoKHY6IG51bWJlcikgPT4gdiAqIGNjLnRyYW5zU3BlZWQpKTtcclxuXHRcdFx0XHRkaXMgPSBkaXN0KFtjcFswXSwgY2MudHJhbnNbMF1dLCBbY3BbMV0sIGNjLnRyYW5zWzFdXSk7XHJcblx0XHRcdFx0aWYgKGRpcyA+IGNjLnRvdWNoU2Vuc2l0aXZpdHkpIGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0XHRpbmgodHJ1ZSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoY2MucGluY2hFbmFibGVkICYmIGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA9PT0gMiAmJiBldmVyeShhcnJheW5nZShldmVudC50YXJnZXRUb3VjaGVzKSwgY2MuX3RvdWNoZXMsIGZhbHNlLCB0cnVlKSkge1xyXG5cdFx0XHRcdGlmICgoY2Muc2NhbGVNb2RlICYgT3B0cy5TY2FsZU1vZGUuRlJFRVNDQUxFKSA9PT0gT3B0cy5TY2FsZU1vZGUuRlJFRVNDQUxFKSB7XHJcblx0XHRcdFx0XHRsZXQgaW5pZGlzdDogbnVtYmVyW10gPSBbTWF0aC5hYnMoY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSAtIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0pLCBNYXRoLmFicyhjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzFdIC0gY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVsxXSldLFxyXG5cdFx0XHRcdFx0XHRkaXM6IG51bWJlcltdID0gW01hdGguYWJzKGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WCAtIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WCAtIDIgKiBjYy50YXJnZXQub2Zmc2V0TGVmdCksIE1hdGguYWJzKGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGV2ZW50LnRhcmdldFRvdWNoZXNbMV0uY2xpZW50WSAtIDIgKiBjYy50YXJnZXQub2Zmc2V0VG9wKV0sXHJcblx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdICsgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXSwgY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAvIDIgLSBjYy50cmFuc1tpZHhdKSxcclxuXHRcdFx0XHRcdFx0ZDogbnVtYmVyW10gPSBbZGlzWzBdIC8gaW5pZGlzdFswXSwgZGlzWzFdIC8gaW5pZGlzdFsxXV0ubWFwKCh2OiBudW1iZXIpID0+IHYgKiBjYy5zY2xTcGVlZCksXHJcblx0XHRcdFx0XHRcdG50b3VjaGVzOiBudW1iZXJbXSA9IGl0b3VjaGVzLm1hcCgoaTogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gaSAqICgxIC0gZFtpZHhdKSk7XHJcblxyXG5cdFx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLm50b3VjaGVzKTtcclxuXHRcdFx0XHRcdGNjLnNjYWxlKGRbMF0sIGRbMV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRcdGxldCBpbmlkaXN0OiBudW1iZXIgPSBkaXN0KFtjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzBdXSwgW2NjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dKSxcclxuXHRcdFx0XHRcdFx0ZGlzOiBudW1iZXIgPSBkaXN0KFtldmVudC50YXJnZXRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnRdLCBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pLFxyXG5cdFx0XHRcdFx0XHRpdG91Y2hlczogbnVtYmVyW10gPSBbY2MuX3RvdWNoZXNbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5pZGVudGlmaWVyXVswXSArIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMF0sIGNjLl90b3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXNbMF0uaWRlbnRpZmllcl1bMV0gKyBjYy5fdG91Y2hlc1tldmVudC50YXJnZXRUb3VjaGVzWzFdLmlkZW50aWZpZXJdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdGQ6IG51bWJlciA9IGNjLnNjbFNwZWVkICogZGlzIC8gaW5pZGlzdCxcclxuXHRcdFx0XHRcdFx0bnRvdWNoZXM6IG51bWJlcltdID0gaXRvdWNoZXMubWFwKChpOiBudW1iZXIpID0+IGkgKiAoMSAtIGQpKTtcclxuXHJcblx0XHRcdFx0XHRjYy50cmFuc2xhdGUoLi4ubnRvdWNoZXMpO1xyXG5cdFx0XHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGluaCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ01vYmlsZU1vdmVcclxuXHRcdHByaXZhdGUgc3RhdGljIGRyYWdNb2JpbGVTdGFydChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcywgY3VzdDogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRpZiAoIWN1c3QpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSxcclxuXHRcdFx0XHRcdHNvcnRlZCA9IEFycmF5LmZyb20oY2Mud2dldHMuZW50cmllcygpKS5tYXAoKHM6IENhbnZhc0J1dHRvbltdKSA9PiBzWzFdKS5zb3J0KChhOiBDYW52YXNCdXR0b24sIGI6IENhbnZhc0J1dHRvbikgPT4gYi5faWQgLSBhLl9pZCksXHJcblx0XHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdFx0QXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgodDogVG91Y2gpID0+IGNjLl90b3VjaGVzW3QuaWRlbnRpZmllcl0gPSBbdC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIHQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdKTtcclxuXHJcblx0XHRcdFx0Zm9yIChsZXQgdG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcclxuXHRcdFx0XHRcdGNvb3JkcyA9IFsodG91Y2guY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0pIC8gY2Muc2NsWzBdLCAodG91Y2guY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXSkgLyBjYy5zY2xbMV1dO1xyXG5cclxuXHRcdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0LmlzT24oY29vcmRzKSAmJiAhYnV0dC5wc3RhdGUgJiYgKGJ1dHQucHN0YXRlID0gdHJ1ZSwgcmV0ID0gYnV0dC5mb2N1cyhjb29yZHMpKTtcclxuXHRcdFx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxKSB7XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSBEYXRlLm5vdygpO1xyXG5cdFx0XHRcdGNjLl9jb29yZGluYXRlcyA9IGNjLl90b3VjaGVzW2NjLl90b3VjaGVzLmxlbmd0aCAtIDFdO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0fSAvL2RyYWdNb2JpbGVTdGFydFxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZHJhZ01vYmlsZUVuZChldmVudDogVG91Y2hFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10sXHJcblx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0XHRcdGZvciAobGV0IHRvdWNoIG9mIGV2ZW50LmNoYW5nZWRUb3VjaGVzKSB7XHJcblx0XHRcdFx0Y29vcmRzID0gWyh0b3VjaC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSkgLyBjYy5zY2xbMF0sICh0b3VjaC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdKSAvIGNjLnNjbFsxXV07XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5pc09uKGNvb3Jkcyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoY2MuX3RvdWNoZXMubGVuZ3RoID09PSAxICYmIERhdGUubm93KCkgLSBjYy5fY2xrdGltZSA8PSBjYy5jbGlja1NlbnNpdGl2aXR5KSB7XHJcblx0XHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRcdGJ1dHQuZW5hYmxlZCAmJiBidXR0LmlzT24oY29vcmRzKSAmJiAocmV0ID0gYnV0dC5jbGljayhjb29yZHMpKTtcclxuXHRcdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRBcnJheS5mcm9tKGV2ZW50LmNoYW5nZWRUb3VjaGVzKS5mb3JFYWNoKCh0OiBUb3VjaCkgPT4ge1xyXG5cdFx0XHRcdGNjLl90b3VjaGVzLnNwbGljZSh0LmlkZW50aWZpZXIsIDEpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhjYy5fdG91Y2hlcykubGVuZ3RoID09IDEpIHtcclxuXHRcdFx0XHRDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGV2ZW50LCBjYywgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHdoZWVsKGV2ZW50OiBXaGVlbEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGxldCBkOiBudW1iZXIgPSAxIC0gY2Muc2NsU3BlZWQgKiBDb250cm9sbGFibGVDYW52YXMuZml4RGVsdGEoZXZlbnQuZGVsdGFNb2RlLCBldmVudC5kZWx0YVkpIC8gY2MubWluLFxyXG5cdFx0XHRcdGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0IC0gY2MudHJhbnNbMF0sIGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV1dO1xyXG5cdFx0XHRjYy50cmFuc2xhdGUoLi4uY29vcmRzLm1hcCgoYzogbnVtYmVyKSA9PiBjICogKDEgLSBkKSkpO1xyXG5cdFx0XHRjYy5zY2FsZShkKTtcclxuXHRcdH0gLy93aGVlbFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGNsaWNrUEMoZXZlbnQ6IE1vdXNlRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMpOiB2b2lkIHtcclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbKGV2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdKSAvIGNjLnNjbFswXSwgKGV2ZW50LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wIC0gY2MudHJhbnNbMV0pIC8gY2Muc2NsWzFdXSxcclxuXHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0XHRcclxuXHRcdFx0Zm9yIChsZXQgYnV0dCBvZiBzb3J0ZWQpIHtcclxuXHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzKSk7XHJcblx0XHRcdFx0aWYgKHJldCkgYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9jbGlja1BDXHJcblxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBpc01vYmlsZSgpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvd2ViT1MvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBhZC9pKVxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQmxhY2tCZXJyeS9pKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9XaW5kb3dzIFBob25lL2kpXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2RldGVjdE1vYmlsZVxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGdldCBsaW5lVG9QaXgoKTogbnVtYmVyIHtcclxuXHRcdFx0bGV0IHI6IG51bWJlcixcclxuXHRcdFx0XHRpZnJhbWU6IEhUTUxJRnJhbWVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcclxuXHRcdFx0aWZyYW1lLnNyYyA9ICcjJztcclxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG5cdFx0XHRsZXQgaXdpbjogV2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3csXHJcblx0XHRcdFx0aWRvYzogRG9jdW1lbnQgPSBpd2luLmRvY3VtZW50O1xyXG5cdFx0XHRpZG9jLm9wZW4oKTtcclxuXHRcdFx0aWRvYy53cml0ZSgnPCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PC9oZWFkPjxib2R5PjxwPmE8L3A+PC9ib2R5PjwvaHRtbD4nKTtcclxuXHRcdFx0aWRvYy5jbG9zZSgpO1xyXG5cdFx0XHRsZXQgc3BhbjogSFRNTEVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+aWRvYy5ib2R5LmZpcnN0RWxlbWVudENoaWxkO1xyXG5cdFx0XHRyID0gc3Bhbi5vZmZzZXRIZWlnaHQ7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0cmV0dXJuIHI7XHJcblx0XHR9IC8vbGluZVRvUGl4XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZml4RGVsdGEobW9kZTogbnVtYmVyLCBkZWx0YVk6IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRcdGlmIChtb2RlID09PSAxKSB7XHJcblx0XHRcdFx0cmV0dXJuIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCAqIGRlbHRhWTtcclxuXHRcdFx0fSBlbHNlIGlmIChtb2RlID09PSAyKSB7XHJcblx0XHRcdFx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZGVsdGFZO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vZml4RGVsdGFcclxuXHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQG1lbWJlcm9mIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0gZHggLSB3aWR0aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR5IC0gaGVpZ2h0XHJcblx0ICogQHByb3Age251bWJlcn0gaW5kZXggLSBlcXVpdmFsZW50IHRvIENTUyB6LWluZGV4XHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIENhbnZhc0J1dHRvbiBpbXBsZW1lbnRzIE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyB7XHJcblx0XHR4OiBudW1iZXIgPSAwO1xyXG5cdFx0eTogbnVtYmVyID0gMDtcclxuXHRcdGR4OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHk6IG51bWJlciA9IDA7XHJcblx0XHRpbmRleDogbnVtYmVyID0gLTE7XHJcblx0XHRwYXJlbnQ6IENvbnRyb2xsYWJsZUNhbnZhcztcclxuXHRcdF9pZDogbnVtYmVyO1xyXG5cdFx0ZW5hYmxlZDogYm9vbGVhbiA9IHRydWU7XHJcblx0XHRwc3RhdGU6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBvc2l0aW9uOiBudW1iZXIgPSAyO1xyXG5cclxuXHRcdHN0YXRpYyBzZW5zaXRpdml0eTogbnVtYmVyID0gLjM7XHJcblx0XHRwcml2YXRlIHN0YXRpYyBfaWRjbnRyOiBudW1iZXIgPSAwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENhbnZhc0J1dHRvblxyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5DYW52YXNCdXR0b25PcHRpb25zID0ge1xyXG5cdFx0XHR4OiAwLFxyXG5cdFx0XHR5OiAwLFxyXG5cdFx0XHRkeDogMCxcclxuXHRcdFx0ZHk6IDAsXHJcblx0XHRcdGluZGV4OiAtMSxcclxuXHRcdFx0cHN0YXRlOiBmYWxzZSxcclxuXHRcdFx0ZW5hYmxlZDogdHJ1ZSxcclxuXHRcdFx0cG9zaXRpb246IDIsXHJcblx0XHRcdHBhcmVudDogbmV3IENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpIHsgIC8vRE9VQkxFQ0xJQ0ssIExPTkdDTElDSywgRFJBRywgLi4uIFVTRVItSU1QTEVNRU5URUQoPylcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpO1xyXG5cclxuXHRcdFx0aWYgKFtvcHRzLngsIG9wdHMueSwgb3B0cy5keCwgb3B0cy5keSwgb3B0cy5wb3NpdGlvbiwgb3B0cy5pbmRleF0uc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy54ID0gb3B0cy54ICogMTtcclxuXHRcdFx0dGhpcy55ID0gb3B0cy55ICogMTtcclxuXHRcdFx0dGhpcy5keCA9IG9wdHMuZHggKiAxO1xyXG5cdFx0XHR0aGlzLmR5ID0gb3B0cy5keSAqIDE7XHJcblx0XHRcdHRoaXMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uIHwgMDtcclxuXHRcdFx0dGhpcy5pbmRleCA9IG9wdHMuaW5kZXggfCAwO1xyXG5cdFx0XHR0aGlzLmVuYWJsZWQgPSAhIW9wdHMuZW5hYmxlZDtcclxuXHRcdFx0dGhpcy5faWQgPSBDYW52YXNCdXR0b24uX2lkY250cisrO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBleGl0ZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Ymx1ciguLi5hbnk6IGFueVtdKTogYm9vbGVhbiB7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fSAvL2JsdXJcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGVudGVyZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Zm9jdXMoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9IC8vZm9jdXNcclxuXHRcdC8vQE92ZXJyaWRlXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBidXR0b24gd2FzIGNsaWNrZWQgYW5kIGRlY2lkZXMgd2hldGhlciB0byBwcm9wYWdhdGVcclxuXHRcdCAqIEBwYXJhbSBhbnlcclxuXHRcdCAqL1xyXG5cdFx0Y2xpY2soLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9jbGlja1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIHBvaW50ZXIgaXMgYWJvdmUgdGhlIHdpZGdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJbXX0gcmVsYXRpdmVDb29yZHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqL1xyXG5cdFx0aXNPbihyZWxhdGl2ZUNvb3JkczogbnVtYmVyW10pOiBib29sZWFuIHtcclxuXHRcdFx0bGV0IHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5GSVhFRCkgPT09IE9wdHMuUG9zaXRpb24uRklYRUQgPyB0aGlzLnggLSB0aGlzLnBhcmVudC50cmFuc1swXSA6IHRoaXMueCxcclxuXHRcdFx0XHR5OiBudW1iZXIgPSAodGhpcy5wb3NpdGlvbiAmIE9wdHMuUG9zaXRpb24uRklYRUQpID09PSBPcHRzLlBvc2l0aW9uLkZJWEVEID8gdGhpcy55IC0gdGhpcy5wYXJlbnQudHJhbnNbMV0gOiB0aGlzLnksXHJcblx0XHRcdFx0ZHg6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFKSA9PT0gT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFID8gdGhpcy5keCAqIHRoaXMucGFyZW50LnNjbFswXSA6IHRoaXMuZHgsXHJcblx0XHRcdFx0ZHk6IG51bWJlciA9ICh0aGlzLnBvc2l0aW9uICYgT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFKSA9PT0gT3B0cy5Qb3NpdGlvbi5VTlNDQUxBQkxFID8gdGhpcy5keSAqIHRoaXMucGFyZW50LnNjbFsxXSA6IHRoaXMuZHksXHJcblx0XHRcdFx0b3V0OiBib29sZWFuID0gaXNXaXRoaW4oW3gsIHksIGR4LCBkeV0sIFtyZWxhdGl2ZUNvb3Jkc1swXSwgcmVsYXRpdmVDb29yZHNbMV1dLCBDYW52YXNCdXR0b24uc2Vuc2l0aXZpdHkpO1xyXG5cclxuXHRcdFx0aWYgKCFvdXQgJiYgdGhpcy5wc3RhdGUpIHtcclxuXHRcdFx0XHR0aGlzLmJsdXIocmVsYXRpdmVDb29yZHMpO1xyXG5cdFx0XHRcdHRoaXMucHN0YXRlID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBvdXQ7XHJcblx0XHR9IC8vaXNPblxyXG5cdH0gLy9DYW52YXNCdXR0b25cclxuXHJcblx0Q29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvbiA9IENhbnZhc0J1dHRvbjtcclxuXHJcblx0LyoqXHJcblx0ICogQSBjbGFzcyBvZmZlcmluZyBtYXRoZW1hdGljYWwgVmVjdG9yIHV0aWxpdGllc1xyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBjbGFzc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcHJvcHMgLSB2ZWN0b3IgdmVydGljZXNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgVmVjdG9yIHtcclxuXHRcdHByb3BzOiBudW1iZXJbXTtcclxuXHJcblx0XHRjb25zdHJ1Y3Rvcihwcm9wczogbnVtYmVyW10gPSBbIF0pIHtcclxuXHRcdFx0dGhpcy5wcm9wcyA9IEFycmF5LmZyb20ocHJvcHMubWFwKE51bWJlcikpO1xyXG5cdFx0fSAvL2N0b3JcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEFkZCBhIHZlY3RvciBvciBudW1iZXIgdG8gY3VycmVudCB2ZWN0b3JcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7VmVjdG9yfG51bWJlcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHN1YiAtIFNldCB0byBgLTFgIHRvIHN1YnN0cmFjdCBpbnN0ZWFkXHJcblx0XHQgKiBAcmV0dXJucyBgdGhpc2AgZm9yIG1ldGhvZCBjaGFpbmluZ1xyXG5cdFx0ICovXHJcblx0XHRhZGQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBzdWI6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSArPSBzdWIgKiB0YXJnW2lkeF07XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZztcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9hZGRcclxuXHRcdC8qKlxyXG5cdFx0ICogTXVsdGlwbHkgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBkaXYgLSBTZXQgdG8gYC0xYCB0byBkaXZpZGUgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0bXVsdCh0YXJnOiBWZWN0b3IgfCBudW1iZXIsIGRpdjogbnVtYmVyID0gMSk6IFRoaXNUeXBlPFZlY3Rvcj4ge1xyXG5cdFx0XHRpZiAodGFyZyBpbnN0YW5jZW9mIFZlY3Rvcikge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICo9IE1hdGgucG93KHRhcmdbaWR4XSwgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnLCBkaXYpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL211bHRcclxuXHRcdC8qKlxyXG5cdFx0ICogRG90IHByb2R1Y3Qgb2YgMiB2ZWN0b3JzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3Rvcn0gdGFyZyAtIHRhcmdldFxyXG5cdFx0ICogQHJldHVybnMgcHJvZHVjdFxyXG5cdFx0ICovXHJcblx0XHRkb3QodGFyZzogVmVjdG9yKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIHRoaXMucHJvcHMucmVkdWNlKChhY2M6IG51bWJlciwgdmFsOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBhY2MgKyB2YWwgKiB0YXJnW2lkeF0pO1xyXG5cdFx0fSAvL2RvdFxyXG5cdH0gLy9WZWN0b3JcclxuXHJcblx0LyoqXHJcblx0ICogQHByb3Age0hUTUxFbGVtZW50W119IHJlc291cmNlcyAtIEFsbCBIVE1MIHJlc291cmNlIGVsZW1lbnRzIHdpdGggXCJsb2FkXCIgbGlzdGVuZXJzIHRoYXQgd2lsbCBiZSBsb2FkZWQuIGxpa2U6IGF1ZGlvL2ltZ1xyXG5cdCAqL1xyXG5cdGV4cG9ydCBjbGFzcyBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRyZXNvdXJjZXM6IEhUTUxFbGVtZW50W10gPSBbIF07XHJcblx0XHRfbG9hZGNudHI6IG51bWJlciA9IDA7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocmVzb3VyY2VzOiBIVE1MRWxlbWVudFtdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMgPSBBcnJheS5mcm9tKHJlc291cmNlcyk7XHJcblx0XHRcdHRoaXMubG9hZCA9IG9ubG9hZCB8fCB0aGlzLmxvYWQ7XHJcblx0XHRcdGlmIChhdXRvYmluZCkgdGhpcy5iaW5kKHRoaXMubG9hZCk7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQmluZCBsb2FkIGV2ZW50cyBhbmQgYXdhaXQgbG9hZGVuZFxyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkPyAtIGNvZGUgdG8gZXhlY3V0ZSBvbmNlIGxvYWRlZFxyXG5cdFx0ICovXHJcblx0XHRiaW5kKG9ubG9hZDogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRcdGlmIChvbmxvYWQpIHRoaXMubG9hZCA9IG9ubG9hZDtcclxuXHRcdFx0dGhpcy5yZXNvdXJjZXMuZm9yRWFjaCgocmVzOiBIVE1MRWxlbWVudCkgPT4ge1xyXG5cdFx0XHRcdHJlcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKTogdm9pZCA9PiB7XHJcblx0XHRcdFx0XHRpZiAoKyt0aGlzLl9sb2FkY250ciA9PT0gdGhpcy5yZXNvdXJjZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdHRoaXMubG9hZChyZXMsIHRoaXMuX2xvYWRjbnRyKTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fSk7XHJcblx0XHR9IC8vYmluZFxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdGxvYWQocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpOiB2b2lkIHsgfSAvL2xvYWRcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgaW1hZ2VzIGJ5IFVSTHNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqIEBwYXJhbSB7c3RyaW5nW119IHVybGlzdCAtIGxpc3Qgb2YgdXJsc1xyXG5cdFx0ICogQHBhcmFtIHtGdW5jdGlvbn0gb25sb2FkIC0gY2FsbGJhY2tcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b2JpbmQ9dHJ1ZSAtIGF1dG8gYmluZFxyXG5cdFx0ICogQHJldHVybnMge1Jlc291cmNlTG9hZGVyfSB0aGUgbG9hZGVyXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBpbWFnZXModXJsaXN0OiBzdHJpbmdbXSwgb25sb2FkPzogKHJlcz86IEhUTUxFbGVtZW50LCBsb2FkPzogbnVtYmVyKSA9PiB2b2lkLCBhdXRvYmluZDogYm9vbGVhbiA9IHRydWUpOiBSZXNvdXJjZUxvYWRlciB7XHJcblx0XHRcdGxldCBpbWdsaXN0OiBIVE1MSW1hZ2VFbGVtZW50W10gPSBbIF07XHJcblxyXG5cdFx0XHRmb3IgKGxldCB1cmwgb2YgdXJsaXN0KSB7XHJcblx0XHRcdFx0bGV0IGltZyA9IG5ldyBJbWFnZSgpO1xyXG5cdFx0XHRcdGltZy5zcmMgPSB1cmw7XHJcblx0XHRcdFx0aW1nbGlzdC5wdXNoKGltZyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIoaW1nbGlzdCwgb25sb2FkLCBhdXRvYmluZCk7XHJcblx0XHR9IC8vaW1hZ2VzXHJcblx0XHQvKipcclxuXHRcdCAqIExvYWQgYXVkaW8gYnkgVVJMc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHN0YXRpY1xyXG5cdFx0ICogQHBhcmFtIHtzdHJpbmdbXX0gdXJsaXN0IC0gbGlzdCBvZiB1cmxzXHJcblx0XHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbmxvYWQgLSBjYWxsYmFja1xyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhdXRvYmluZD10cnVlIC0gYXV0byBiaW5kXHJcblx0XHQgKiBAcmV0dXJucyB7UmVzb3VyY2VMb2FkZXJ9IHRoZSBsb2FkZXJcclxuXHRcdCAqL1xyXG5cdFx0c3RhdGljIGF1ZGlvcyh1cmxpc3Q6IHN0cmluZ1tdLCBvbmxvYWQ/OiAocmVzPzogSFRNTEVsZW1lbnQsIGxvYWQ/OiBudW1iZXIpID0+IHZvaWQsIGF1dG9iaW5kOiBib29sZWFuID0gdHJ1ZSk6IFJlc291cmNlTG9hZGVyIHtcclxuXHRcdFx0bGV0IGF1ZGlvbGlzdDogSFRNTEF1ZGlvRWxlbWVudFtdID0gWyBdO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgdXJsIG9mIHVybGlzdCkge1xyXG5cdFx0XHRcdGxldCBhdWRpbyA9IG5ldyBBdWRpbyh1cmwpO1xyXG5cdFx0XHRcdGF1ZGlvLmxvYWQoKTtcclxuXHRcdFx0XHRhdWRpb2xpc3QucHVzaChhdWRpbyk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBuZXcgUmVzb3VyY2VMb2FkZXIoYXVkaW9saXN0LCBvbmxvYWQsIGF1dG9iaW5kKTtcclxuXHRcdH0gLy9hdWRpb3NcclxuXHR9IC8vUmVzb3VyY2VMb2FkZXJcclxuXHJcbn0gLy9DYW52YXNDb250cm9sc1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQ2FudmFzQ29udHJvbHMuQ29udHJvbGxhYmxlQ2FudmFzO1xyXG4iXX0=