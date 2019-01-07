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
            this.clickSensitivity = 800;
            this._handled = false;
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
            this.rot = opts.rot * 1;
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
            if (!this._adapts.click) {
                this.target.addEventListener("click", this._adapts.click = (e) => ControllableCanvas.clickPC(e, this));
            }
        } //_pcAdapt
        static dragPC(event, cc) {
            if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
                return;
            }
            event.preventDefault();
            let coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop], rel = [], ret = false;
            if (cc._pressed) {
                cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
            }
            for (let butt of cc.wgets) {
                butt.enabled && butt.isOn(rel = coords.map((c, idx) => c - cc.trans[idx])) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
                if (ret)
                    break;
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
                let cp = Array.from(cc.trans), dis;
                cc.translate(...[coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map((v) => v * cc.transSpeed));
                dis = dist([cp[0], cc.trans[0]], [cp[1], cc.trans[1]]);
                if (dis > cc.touchSensitivity)
                    cc._clktime = 0;
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
                let coords = [event.changedTouches[event.changedTouches.length - 1].clientX - cc.target.offsetLeft - cc.trans[0], event.changedTouches[event.changedTouches.length - 1].clientY - cc.target.offsetTop - cc.trans[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
                Array.from(event.changedTouches).forEach((t) => cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop]);
                for (let butt of sorted) {
                    butt.enabled && butt.isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
                    if (ret)
                        break;
                }
            }
            if (cc._touches.length === 1) {
                cc._clktime = Date.now();
            }
            else {
                cc._clktime = 0;
            }
            cc._pressed = true;
            cc._coordinates = cc._touches[cc._touches.length - 1];
        } //dragMobileStart
        static dragMobileEnd(event, cc) {
            event.preventDefault();
            if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
                let coords = [event.changedTouches[event.changedTouches.length - 1].clientX - cc.target.offsetLeft - cc.trans[0], event.changedTouches[event.changedTouches.length - 1].clientY - cc.target.offsetTop - cc.trans[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
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
            let coords = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]], sorted = Array.from(cc.wgets.entries()).map((s) => s[1]).sort((a, b) => b._id - a._id), ret = false;
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
        touchSensitivity: .35,
        clickSensitivity: 800,
        sclBounds: [0, 0, Infinity, Infinity],
        transBounds: [-Infinity, -Infinity, Infinity, Infinity],
        _adapts: {
            drag: false,
            pinch: false,
            pinchSwipe: false,
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
            let out = isWithin([this.x, this.y, this.dx, this.dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);
            if (!out && this.pstate) {
                this.blur(relativeCoords);
                this.pstate = false;
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
        enabled: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FudmFzQ29udHJvbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvQ2FudmFzQ29udHJvbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLDJCQUF5QjtBQUV6Qjs7OztHQUlHO0FBR0g7Ozs7O0dBS0c7QUFDSCxJQUFjLGNBQWMsQ0FveUIzQjtBQXB5QkQsV0FBYyxjQUFjO0lBSTNCOzs7Ozs7OztPQVFHO0lBQ0gsU0FBUyxPQUFPLENBQUMsSUFBUSxFQUFFLElBQVEsRUFBRSxZQUFzQixDQUFDLElBQVEsRUFBRSxJQUFRLEVBQUUsSUFBWSxFQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxSixLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNuQixTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztTQUN6QjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLFNBQVM7SUFFWDs7Ozs7Ozs7T0FRRztJQUNILFNBQVMsS0FBSyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxPQUFPO0lBRVQ7Ozs7Ozs7T0FPRztJQUNILFNBQVMsSUFBSSxDQUFDLEVBQVksRUFBRSxFQUFZO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFB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QUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDbmdCLE9BQU87YUFDUDtZQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV2QixJQUFJLE1BQU0sR0FBYSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLE9BQU8sR0FBRyxFQUFFLENB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RyxDQUFDLElBQVk7WUFDZixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxHQUFXLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDNUYsQ0FBQyxDQUFDLEtBQUs7S0FFUCxDQUFDLFFBQVE7SUF2REcscUJBQU0sU0F1RGxCLENBQUE7QUFFRixDQUFDLEVBcHlCYSxjQUFjLEdBQWQsc0JBQWMsS0FBZCxzQkFBYyxRQW95QjNCLENBQUMsZ0JBQWdCO0FBRWxCLGtCQUFlLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xyXG5cclxuaW1wb3J0IFwiQGJhYmVsL3BvbHlmaWxsXCI7XHJcblxyXG4vKipcclxuICogQGZpbGUgQ2FudmFzQ29udHJvbHMudHNcclxuICogQGNvcHlyaWdodCBWYWxlbi4gSC4gMmsxOFxyXG4gKiBAYXV0aG9yIFZhbGVuLkguIDxhbHRlcm5hdGl2ZXh4eHlAZ21haWwuY29tPlxyXG4gKi9cclxuXHJcblxyXG4vKipcclxuICogVGhlIHJvb3Qgb2YgdGhlIG1haW4gbGlicmFyeVxyXG4gKiBAbW9kdWxlIENhbnZhc0NvbnRyb2xzXHJcbiAqIEBsaWNlbnNlIElTQ1xyXG4gKiBAZ2xvYmFsXHJcbiAqL1xyXG5leHBvcnQgbW9kdWxlIENhbnZhc0NvbnRyb2xzIHtcclxuXHJcblx0dHlwZSBDbGFzcyA9IHsgbmV3KC4uLmFyZ3M6IGFueVtdKTogYW55OyB9O1xyXG5cclxuXHQvKipcclxuXHQgKiBJZiBgZGVzdGAgbGFja3MgYSBwcm9wZXJ0eSB0aGF0IGB0YXJnYCBoYXMgdGhlbiB0aGF0IHByb3BlcnR5IGlzIGNvcGllZCBpbnRvIGBkZXN0YFxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBkZXN0IC0gZGVzdGluYXRpb24gb2JqZWN0XHJcblx0ICogQHBhcmFtIHtvYmplY3R9IHRhcmcgLSBiYXNlIG9iamVjdFxyXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbmRpdGlvbiAtIGluaGVyaXRhbmNlIGNvbmRpdGlvblxyXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9IGRlc3RpbmF0aW9uIG9iamVjdFxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIGluaGVyaXQoZGVzdDoge30sIHRhcmc6IHt9LCBjb25kaXRpb246IEZ1bmN0aW9uID0gKGRlc3Q6IHt9LCB0YXJnOiB7fSwgcHJvcDogc3RyaW5nKTogYW55ID0+IGRlc3RbcHJvcF0gPT09IHVuZGVmaW5lZCAmJiAoZGVzdFtwcm9wXSA9IHRhcmdbcHJvcF0pKToge30ge1xyXG5cdFx0Zm9yIChsZXQgaSBpbiB0YXJnKSB7XHJcblx0XHRcdGNvbmRpdGlvbihkZXN0LCB0YXJnLCBpKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZGVzdDtcclxuXHR9IC8vaW5oZXJpdFxyXG5cclxuXHQvKipcclxuXHQgKiBSZXN0cmljdCBudW1iZXIncyByYW5nZVxyXG5cdCAqIEBmdW5jdGlvblxyXG5cdCAqIEBpbm5lclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBuIC0gdGFyZ2V0IG51bWJlclxyXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBtIC0gbWluaW11bSBudW1iZXJcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gTSAtIG1heGltdW0gbnVtYmVyXHJcblx0ICogQHJldHVybnMge251bWJlcn0gYm91bmQgbnVtYmVyXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gYm91bmQobjogbnVtYmVyLCBtOiBudW1iZXIsIE06IG51bWJlcik6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gbiA+IE0gPyBNIDogKG4gPCBtID8gbSA6IG4pO1xyXG5cdH0gLy9ib3VuZFxyXG5cclxuXHQvKipcclxuXHQgKiBDYWxjdWxhdGUgZGlzdGFuY2UgYmV0d2VlbiAyIHBvaW50c1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFhzIC0gWCBjb29yZGluYXRlc1xyXG5cdCAqIEBwYXJhbSB7bnVtYmVyW119IFlzIC0gWSBjb29yZGluYXRlc1xyXG5cdCAqIEByZXR1cm5zIHtudW1iZXJ9IGRpc3RhbmNlXHJcblx0ICogQGZ1bmN0aW9uXHJcblx0ICogQGlubmVyXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gZGlzdChYczogbnVtYmVyW10sIFlzOiBudW1iZXJbXSk6IG51bWJlciB7XHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFtYc1sxXSAtIFhzWzBdLCBZc1sxXSAtIFlzWzBdXS5tYXAoKHY6IG51bWJlcikgPT4gTWF0aC5wb3codiwgMikpLnJlZHVjZSgoYWNjOiBudW1iZXIsIHY6IG51bWJlcikgPT4gYWNjICsgdikpO1xyXG5cdH0gLy9kaXN0XHJcblxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGluc2lkZSBhbiBhcmVhXHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gYm94IC0geCx5LGR4LGR5XHJcblx0ICogQHBhcmFtIHtudW1iZXJbXX0gcG9pbnQgLSB4LHlcclxuXHQgKiBAcGFyYW0ge251bWJlcn0gc2Vuc2l0aXZpdHkgLSBleHRyYSBib3VuZGFyeVxyXG5cdCAqIEByZXR1cm5zIGJvb2xlYW5cclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAZnVuY3Rpb25cclxuXHQgKi9cclxuXHRmdW5jdGlvbiBpc1dpdGhpbihib3g6IG51bWJlcltdLCBwb2ludDogbnVtYmVyW10sIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNSk6IGJvb2xlYW4ge1xyXG5cdFx0cmV0dXJuIGJveFswXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzBdICYmIGJveFswXSArIGJveFsyXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzBdICYmIGJveFsxXSAtIHNlbnNpdGl2aXR5IDw9IHBvaW50WzFdICYmIGJveFsxXSArIGJveFszXSArIHNlbnNpdGl2aXR5ID49IHBvaW50WzFdO1xyXG5cdH0gLy9pc1dpdGhpblxyXG5cclxuXHQvKipcclxuXHQgKiBBIGhvbGRlciBmb3IgYWxsIE9wdGlvbnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBPcHRzIHtcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEEgd3JhcHBlciBmb3IgdGhlIHRhcmdldGVkIGNhbnZhcyBlbGVtZW50XHJcblx0XHQgKiBAaW50ZXJmYWNlXHJcblx0XHQgKiBAaW5uZXJcclxuXHRcdCAqIEBtZW1iZXIge0hUTUxDYW52YXNFbGVtZW50fSB0YXJnZXQ9Zmlyc3RDYW52T2NjdXJJbkRvYyAtIEJvdW5kIGNhbnZhc1xyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gc2NsPTEsMSAtIFNjYWxpbmdcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSByb3Q9MCwwIC0gUm90YXRpb25cclxuXHRcdCAqIEBtZW1iZXIge251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJbXX0gdHJhbnNCb3VuZD0tSW5maW5pdHksLUluZmluaXR5LEluZmluaXR5LEluZmluaXR5IC0gTWF4IHRyYW5zbGF0aW9uIGJvdW5kYXJpZXNcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGRyYWdFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRyYWdcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoICgxIGZpbmdlciBvbmx5IHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSBwaW5jaFN3aXBlRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSByb3RhdGlvbiBvbiAyLWZpbmdlciBwaW5jaCAoYm90aCBmaW5nZXJzIHNoYWxsIG1vdmUpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB3aGVlbEVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgc2NhbGluZyBvbiBtb3VzZSB3aGVlbFxyXG5cdFx0ICogQG1lbWJlciB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0XHQgKiBAbWVtYmVyIHtib29sZWFufSB0aWx0RW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkZXZpY2UgbW92ZW1lbnRcclxuXHRcdCAqIEBtZW1iZXIge2Jvb2xlYW59IGV2ZW50c1JldmVyc2VkPWZhbHNlIC0gVG9nZ2xlIHJldmVyc2Utb3BlcmF0aW9uc1xyXG5cdFx0ICogQG1lbWJlciB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHRyYW5zU3BlZWQ9MSAtIFRyYW5zbGF0aW9uIHNwZWVkIGZhY3RvclxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBzY2xTcGVlZD0xIC0gU2NhbGluZyBzcGVlZCBmYWN0b3JcclxuXHRcdCAqIEBtZW1iZXIge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0XHQgKiBAbWVtYmVyIHtTZXQ8Q2FudmFzQnV0dG9uPn0gd2dldHMgLSBDYW52YXMgd2lkZ2V0c1xyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9ucyB7XHJcblx0XHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRcdHRyYW5zOiBudW1iZXJbXTtcclxuXHRcdFx0c2NsOiBudW1iZXJbXTtcclxuXHRcdFx0cm90OiBudW1iZXI7XHJcblx0XHRcdGRyYWdFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHBpbmNoU3dpcGVFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHBhbkVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdHRpbHRFbmFibGVkOiBib29sZWFuO1xyXG5cdFx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbjtcclxuXHRcdFx0dXNlQnV0dG9uOiBudW1iZXI7XHJcblx0XHRcdHNjYWxlTW9kZTogbnVtYmVyO1xyXG5cdFx0XHR0cmFuc0JvdW5kczogbnVtYmVyW107XHJcblx0XHRcdHNjbEJvdW5kczogbnVtYmVyW107XHJcblx0XHRcdHRyYW5zU3BlZWQ6IG51bWJlcjtcclxuXHRcdFx0c2NsU3BlZWQ6IG51bWJlcjtcclxuXHRcdFx0dG91Y2hTZW5zaXRpdml0eTogbnVtYmVyO1xyXG5cdFx0XHRjbGlja1NlbnNpdGl2aXR5OiBudW1iZXI7XHJcblx0XHRcdF9hZGFwdHM6IENvbnRyb2xsYWJsZUNhbnZhc0FkYXB0ZXJzO1xyXG5cdFx0XHR3Z2V0czogU2V0PENhbnZhc0J1dHRvbj47XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogTTogbW9iaWxlXHJcblx0XHQgKiBQOiBwY1xyXG5cdFx0ICogTVA6IGJvdGhcclxuXHRcdCAqIFxyXG5cdFx0ICogZHJhZzpcclxuXHRcdCAqXHRQOiBtb3VzZSAgaG9sZCAmIG1vdmVcclxuXHRcdCAqXHRNOiB0b3VjaCAgaG9sZCAmIG1vdmVcclxuXHRcdCAqIHBpbmNoOlxyXG5cdFx0ICpcdHRvdWNoICAyLWZpbmdlciAmIDItbW92ZVxyXG5cdFx0ICogcGluY2hTd2lwZTpcclxuXHRcdCAqXHR0b3VjaCAgMi1maW5nZXIgJiAxLW1vdmVcclxuXHRcdCAqIHdoZWVsOlxyXG5cdFx0ICpcdHdoZWVsICBtb3ZlICBbcGMgcGluY2gtZXF1aXZhbGVudF1cclxuXHRcdCAqIHBhbjpcclxuXHRcdCAqXHRkaXNwb3NpdGlvbiBmcm9tIGNlbnRlciBjYXVzZXMgY29uc3RhbnQgdHJhbnNsYXRpb25cclxuXHRcdCAqIHRpbHQ6XHJcblx0XHQgKlx0ZGV2aWNlbW90aW9uICBjYXVzZXMgcGFubmluZypcclxuXHRcdCAqXHRcclxuXHRcdCAqIEBpbnRlcmZhY2VcclxuXHRcdCAqIEBpbm5lclxyXG5cdFx0ICovXHJcblx0XHRleHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnMge1xyXG5cdFx0XHRkcmFnOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHBpbmNoPzogRnVuY3Rpb24gfCBib29sZWFuOyAgLy9NXHJcblx0XHRcdHBpbmNoU3dpcGU/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01cclxuXHRcdFx0d2hlZWw/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL1BcclxuXHRcdFx0cGFuOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdHRpbHQ/OiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdGNsaWNrOiBGdW5jdGlvbiB8IGJvb2xlYW47ICAvL01QXHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnNcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIE9wdGlvbnMgb2YgQ29udHJvbGxhYmxlQ2FudmFzLkNhbnZhc0J1dHRvblxyXG5cdFx0ICogQGludGVyZmFjZVxyXG5cdFx0ICogQGlubmVyXHJcblx0XHQgKiBAbWVtYmVyIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0geSAtIHkgY29vcmRpbmF0ZVxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeCAtIHdpZGdldCB3aWR0aFxyXG5cdFx0ICogQG1lbWJlciB7bnVtYmVyfSBkeSAtIHdpZGdldCBoZWlnaHRcclxuXHRcdCAqIEBtZW1iZXIge251bWJlcn0gaW5kZXggLSB3aWRnZXQgZXZlbnQgcHJpb3JpdHlcclxuXHRcdCAqL1xyXG5cdFx0ZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIENhbnZhc0J1dHRvbk9wdGlvbnMge1xyXG5cdFx0XHR4OiBudW1iZXI7XHJcblx0XHRcdHk6IG51bWJlcjtcclxuXHRcdFx0ZHg6IG51bWJlcjtcclxuXHRcdFx0ZHk6IG51bWJlcjtcclxuXHRcdFx0aW5kZXg6IG51bWJlcjtcclxuXHRcdFx0cGFyZW50OiBDb250cm9sbGFibGVDYW52YXM7XHJcblx0XHRcdGVuYWJsZWQ6IGJvb2xlYW47XHJcblx0XHRcdFtwcm9wOiBzdHJpbmddOiBhbnk7XHJcblx0XHR9IC8vQ2FudmFzQnV0dG9uT3B0aW9uc1xyXG5cclxuXHRcdGV4cG9ydCBlbnVtIFVzZUJ1dHRvbiB7XHJcblx0XHRcdFVTRUxFRlQgPSAxLCBVU0VSSUdIVCwgVVNFQk9USFxyXG5cdFx0fSAvL1VzZUJ1dHRvblxyXG5cdFx0ZXhwb3J0IGVudW0gU2NhbGVNb2RlIHtcclxuXHRcdFx0Tk9STUFMID0gMSwgRlJFRVNDQUxFLCBCWVBBU1MgPSA0XHJcblx0XHR9IC8vU2NhbGVNb2RlXHJcblx0fSAvL09wdHNcclxuXHJcblx0LyoqXHJcblx0ICogQSBob2xkZXIgZm9yIGFsbCBlcnJvcnNcclxuXHQgKiBAbmFtZXNwYWNlXHJcblx0ICovXHJcblx0ZXhwb3J0IG5hbWVzcGFjZSBFcnJvcnMge1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1RDQU5WOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGFuIEhUTUxDYW52YXNFbGVtZW50LlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UQ1RYOiBUeXBlRXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiTm90IGEgQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELlwiKTtcclxuXHRcdGV4cG9ydCBjb25zdCBFTk9UTlVNQVJSMjogVHlwZUVycm9yID0gbmV3IFR5cGVFcnJvcihcIk5vdCBhbiBBcnJheSBvZiAyLWF0LWxlYXN0IE51bWJlcnMuXCIpO1xyXG5cdFx0ZXhwb3J0IGNvbnN0IEVOT1ROVU1BUlI6IFR5cGVFcnJvciA9IG5ldyBUeXBlRXJyb3IoXCJOb3QgYW4gQXJyYXkgb2YgTnVtYmVycy5cIik7XHJcblx0XHRleHBvcnQgY29uc3QgRUlTQUxSOiBSZWZlcmVuY2VFcnJvciA9IG5ldyBSZWZlcmVuY2VFcnJvcihcIk9iamVjdCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuXCIpO1xyXG5cdH0gLy9FcnJvcnNcclxuXHJcblx0XHJcblx0LyoqXHJcblx0ICogQSB3cmFwcGVyIGZvciB0aGUgdGFyZ2V0ZWQgY2FudmFzIGVsZW1lbnRcclxuXHQgKiBAY2xhc3NcclxuXHQgKiBAaW1wbGVtZW50cyB7T3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zfVxyXG5cdCAqIEBwcm9wIHtIVE1MQ2FudmFzRWxlbWVudH0gdGFyZ2V0PWZpcnN0Q2Fudk9jY3VySW5Eb2MgLSBCb3VuZCBjYW52YXNcclxuXHQgKiBAcHJvcCB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjb250ZXh0Pz10YXJnZXQuZ2V0Q29udGV4dChcIjJkXCIpIC0gVGhlIDJkIGNvbnRleHQgY3JlYXRlZCBvdXQgb2YgYHRhcmdldGBcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHRyYW5zPTAsMCAtIFRyYW5zbGF0aW9uXHJcblx0ICogQHByb3Age251bWJlcltdfSBzY2w9MSwxIC0gU2NhbGluZ1xyXG5cdCAqIEBwcm9wIHtudW1iZXJbXX0gcm90PTAsMCAtIFJvdGF0aW9uXHJcblx0ICogQHByb3Age251bWJlcltdfSBwaW4/PXRoaXMudGFyZ2V0LndpZHRoLzIsdGhpcy50YXJnZXQuaGVpZ2h0LzIgLSBQc2V1ZG8tY2VudGVyXHJcblx0ICogQHByb3Age251bWJlcltdfSB0cmFuc0JvdW5kPS1JbmZpbml0eSwtSW5maW5pdHksSW5maW5pdHksSW5maW5pdHkgLSBNYXggdHJhbnNsYXRpb24gYm91bmRhcmllc1xyXG5cdCAqIEBwcm9wIHtib29sZWFufSBkcmFnRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBvbiBkcmFnXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHBpbmNoRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSBzY2FsaW5nIG9uIDItZmluZ2VyIHBpbmNoIChib3RoIGZpbmdlcnMgc2hhbGwgbW92ZSlcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGluY2hTd2lwZUVuYWJsZWQ9ZmFsc2UgLSBFbmFibGUgcm90YXRpb24gb24gMi1maW5nZXIgcGluY2ggKDEgZmluZ2VyIG9ubHkgc2hhbGwgbW92ZSlcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gd2hlZWxFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHNjYWxpbmcgb24gbW91c2Ugd2hlZWxcclxuXHQgKiBAcHJvcCB7Ym9vbGVhbn0gcGFuRW5hYmxlZD1mYWxzZSAtIEVuYWJsZSB0cmFuc2xhdGlvbiBiYXNlZCBvbiBtb3VzZS9maW5nZXIgZGlzdGFuY2UgZnJvbSBwaW4gKHBzZXVkby1jZW50ZXIpXHJcblx0ICogQHByb3Age2Jvb2xlYW59IHRpbHRFbmFibGVkPWZhbHNlIC0gRW5hYmxlIHRyYW5zbGF0aW9uIG9uIGRldmljZSBtb3ZlbWVudFxyXG5cdCAqIEBwcm9wIHtib29sZWFufSBldmVudHNSZXZlcnNlZD1mYWxzZSAtIFRvZ2dsZSByZXZlcnNlLW9wZXJhdGlvbnNcclxuXHQgKiBAcHJvcCB7T3B0cy5Vc2VCdXR0b259IHVzZUJ1dHRvbj1PcHRzLlVzZUJ1dHRvbi5VU0VMRUZUIC0gUmVzcG9uZCB0byBsZWZ0LWNsaWNrLCByaWdodCBvciBib3RoXHJcblx0ICogQHByb3Age251bWJlcltdfSBfY29vcmRpbmF0ZXMgLSBDdXJyZW50IGV2ZW50IGNvb3JkaW5hdGVzXHJcblx0ICogQHByb3Age251bWJlcn0gdHJhbnNTcGVlZD0xIC0gVHJhbnNsYXRpb24gc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age251bWJlcn0gc2NsU3BlZWQ9MSAtIFNjYWxpbmcgc3BlZWQgZmFjdG9yXHJcblx0ICogQHByb3Age09wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnN9IF9hZGFwdHMgLSBNYXAgb2YgYWxsIGN1cnJlbnRseSBhdHRhY2hlZCBjb250cm9sIGV2ZW50IGFkYXB0ZXJzXHJcblx0ICogQHByb3Age29iamVjdH0gX3RvdWNoZXMgLSBNYXAgb2YgYWxsIGN1cnJlbnQgdG91Y2hlc1xyXG5cdCAqIEBwcm9wIHtDbGFzc30gQ2FudmFzQnV0dG9uIC0gQSB3aWRnZXQtbWFraW5nIGNsYXNzIGZvciBjYW52YXNcclxuXHQgKiBAcHJvcCB7U2V0PENhbnZhc0J1dHRvbj59IHdnZXRzIC0gQ2FudmFzIHdpZGdldHNcclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgQ29udHJvbGxhYmxlQ2FudmFzIGltcGxlbWVudHMgT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zIHtcclxuXHRcdHRhcmdldDogSFRNTENhbnZhc0VsZW1lbnQ7XHJcblx0XHRjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcblx0XHR0cmFuczogbnVtYmVyW10gPSBbMCwgMF07XHJcblx0XHRzY2w6IG51bWJlcltdID0gWzEsIDFdO1xyXG5cdFx0cm90OiBudW1iZXIgPSAwO1xyXG5cdFx0cGluOiBudW1iZXJbXTtcclxuXHRcdHRyYW5zQm91bmRzOiBudW1iZXJbXSA9IFstSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdHNjbEJvdW5kczogbnVtYmVyW10gPSBbMCwgMCwgSW5maW5pdHksIEluZmluaXR5XTtcclxuXHRcdGRyYWdFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRwaW5jaEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBpbmNoU3dpcGVFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHR3aGVlbEVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHBhbkVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHRpbHRFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XHJcblx0XHRldmVudHNSZXZlcnNlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0dXNlQnV0dG9uOiBudW1iZXIgPSBPcHRzLlVzZUJ1dHRvbi5VU0VMRUZUO1xyXG5cdFx0c2NhbGVNb2RlOiBudW1iZXIgPSBPcHRzLlNjYWxlTW9kZS5OT1JNQUw7IC8qKiBAdG9kbyBtYXNrOiBmcmVlc2NhbGUtYXhpcyxyb3RhdGlvbi1hcy1zY2FsaW5nICovXHJcblx0XHR0cmFuc1NwZWVkOiBudW1iZXIgPSAxO1xyXG5cdFx0c2NsU3BlZWQ6IG51bWJlciA9IDE7XHJcblx0XHR0b3VjaFNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdGNsaWNrU2Vuc2l0aXZpdHk6IG51bWJlciA9IDgwMDtcclxuXHRcdHdnZXRzOiBTZXQ8Q2FudmFzQnV0dG9uPjtcclxuXHRcdHByaXZhdGUgX2hhbmRsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdHByaXZhdGUgX21vYmlsZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfcHJlc3NlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cdFx0cHJpdmF0ZSBfY2xrdGltZTogbnVtYmVyID0gMDtcclxuXHRcdF9hZGFwdHM6IE9wdHMuQ29udHJvbGxhYmxlQ2FudmFzQWRhcHRlcnM7XHJcblx0XHRwcml2YXRlIF9jb29yZGluYXRlczogbnVtYmVyW10gPSBbIF07XHJcblx0XHRwcml2YXRlIF90b3VjaGVzOiBudW1iZXJbXVtdID0gWyBdO1xyXG5cdFx0c3RhdGljIENhbnZhc0J1dHRvbjogQ2xhc3M7XHJcblxyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgX2xpbmVwaXg6IG51bWJlciA9IDEwO1xyXG5cdFx0LyoqXHJcblx0XHQgKiBEZWZhdWx0IG9wdGlvbnMgZm9yIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0ICogQHJlYWRvbmx5XHJcblx0XHQgKiBAc3RhdGljXHJcblx0XHQgKi9cclxuXHRcdHN0YXRpYyBkZWZhdWx0T3B0czogT3B0cy5Db250cm9sbGFibGVDYW52YXNPcHRpb25zID0ge1xyXG5cdFx0XHR0YXJnZXQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2FudmFzXCIpWzBdLFxyXG5cdFx0XHR0cmFuczogWzAsIDBdLFxyXG5cdFx0XHRzY2w6IFsxLCAxXSxcclxuXHRcdFx0cm90OiAwLFxyXG5cdFx0XHRkcmFnRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHBpbmNoU3dpcGVFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0d2hlZWxFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0cGFuRW5hYmxlZDogZmFsc2UsXHJcblx0XHRcdHRpbHRFbmFibGVkOiBmYWxzZSxcclxuXHRcdFx0ZXZlbnRzUmV2ZXJzZWQ6IGZhbHNlLFxyXG5cdFx0XHR1c2VCdXR0b246IDEsXHJcblx0XHRcdHNjYWxlTW9kZTogMSxcclxuXHRcdFx0dHJhbnNTcGVlZDogMSxcclxuXHRcdFx0c2NsU3BlZWQ6IDEsXHJcblx0XHRcdHRvdWNoU2Vuc2l0aXZpdHk6IC4zNSxcclxuXHRcdFx0Y2xpY2tTZW5zaXRpdml0eTogODAwLFxyXG5cdFx0XHRzY2xCb3VuZHM6IFswLCAwLCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHR0cmFuc0JvdW5kczogWy1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHldLFxyXG5cdFx0XHRfYWRhcHRzOiB7XHJcblx0XHRcdFx0ZHJhZzogZmFsc2UsXHJcblx0XHRcdFx0cGluY2g6IGZhbHNlLFxyXG5cdFx0XHRcdHBpbmNoU3dpcGU6IGZhbHNlLFxyXG5cdFx0XHRcdHdoZWVsOiBmYWxzZSxcclxuXHRcdFx0XHRwYW46IGZhbHNlLFxyXG5cdFx0XHRcdHRpbHQ6IGZhbHNlLFxyXG5cdFx0XHRcdGNsaWNrOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR3Z2V0czogbmV3IFNldCgpXHJcblx0XHR9O1xyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICogQ29udHJvbGxhYmxlQ2FudmFzIGNvbnN0cnVjdG9yXHJcblx0XHQgKiBAcGFyYW0ge09wdHMuQ29udHJvbGxhYmxlQ2FudmFzT3B0aW9uc30gb3B0cz89Q29udHJvbGxhYmxlQ2FudmFzLmRlZmF1bHRPcHRzIC0gQ29udHJvbGxhYmxlQ2FudmFzIE9wdGlvbnNcclxuXHRcdCAqIEBjb25zdHJ1Y3RvclxyXG5cdFx0ICovXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNvbnRyb2xsYWJsZUNhbnZhc09wdGlvbnMgPSBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpIHtcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDb250cm9sbGFibGVDYW52YXMuZGVmYXVsdE9wdHMpO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKCEob3B0cy50YXJnZXQgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVENBTlY7XHJcblx0XHRcdH0gZWxzZSBpZiAoW29wdHMudHJhbnMsIG9wdHMuc2NsLCBvcHRzLnRyYW5zQm91bmRzLCBvcHRzLnNjbEJvdW5kc10uc29tZShhcnIgPT4gIShhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55PmFyciBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkgfHwgYXJyLmxlbmd0aCA8IDIgfHwgQXJyYXkuZnJvbShhcnIpLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSkge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FTk9UTlVNQVJSMjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW5oZXJpdChvcHRzLl9hZGFwdHMsIENvbnRyb2xsYWJsZUNhbnZhcy5kZWZhdWx0T3B0cy5fYWRhcHRzKTsgIC8vUE9TU0lCTEUgRVJST1JcclxuXHJcblx0XHRcdGlmIChvcHRzLnBpbiA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0b3B0cy5waW4gPSBbb3B0cy50YXJnZXQud2lkdGggLyAyLCBvcHRzLnRhcmdldC5oZWlnaHQgLyAyXTtcclxuXHRcdFx0fSBlbHNlIGlmICghKG9wdHMucGluIGluc3RhbmNlb2YgQXJyYXkgfHwgPGFueT5vcHRzLnBpbiBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fCA8YW55Pm9wdHMucGluIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB8fCBvcHRzLnBpbi5sZW5ndGggPCAyIHx8IEFycmF5LmZyb20ob3B0cy5waW4pLnNvbWUoKG51bTogYW55KSA9PiBpc05hTihudW0pIHx8IG51bSA9PT0gJycpKSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3JzLkVOT1ROVU1BUlIyO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xyXG5cdFx0XHR0aGlzLmNvbnRleHQgPSB0aGlzLnRhcmdldC5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG5cdFx0XHR0aGlzLl9hZGFwdHMgPSA8T3B0cy5Db250cm9sbGFibGVDYW52YXNBZGFwdGVycz57IH07XHJcblx0XHRcdGluaGVyaXQodGhpcy5fYWRhcHRzLCBvcHRzLl9hZGFwdHMpO1xyXG5cclxuXHRcdFx0dGhpcy5yb3QgPSBvcHRzLnJvdCAqIDE7XHJcblx0XHRcdHRoaXMudHJhbnNTcGVlZCA9IG9wdHMudHJhbnNTcGVlZCAqIDE7XHJcblx0XHRcdHRoaXMuc2NsU3BlZWQgPSBvcHRzLnNjbFNwZWVkICogMTtcclxuXHRcdFx0dGhpcy50b3VjaFNlbnNpdGl2aXR5ID0gb3B0cy50b3VjaFNlbnNpdGl2aXR5ICogMTtcclxuXHRcdFx0dGhpcy5jbGlja1NlbnNpdGl2aXR5ID0gb3B0cy5jbGlja1NlbnNpdGl2aXR5ICogMTtcclxuXHRcdFx0dGhpcy51c2VCdXR0b24gPSBvcHRzLnVzZUJ1dHRvbiB8IDA7XHJcblx0XHRcdHRoaXMuc2NhbGVNb2RlID0gb3B0cy5zY2FsZU1vZGUgfCAwO1xyXG5cclxuXHRcdFx0dGhpcy53Z2V0cyA9IG5ldyBTZXQob3B0cy53Z2V0cyk7XHJcblxyXG5cdFx0XHR0aGlzLnRyYW5zID0gQXJyYXkuZnJvbShvcHRzLnRyYW5zKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5zY2wgPSBBcnJheS5mcm9tKG9wdHMuc2NsKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy5waW4gPSBBcnJheS5mcm9tKG9wdHMucGluKS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0dGhpcy50cmFuc0JvdW5kcyA9IEFycmF5LmZyb20ob3B0cy50cmFuc0JvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblx0XHRcdHRoaXMuc2NsQm91bmRzID0gQXJyYXkuZnJvbShvcHRzLnNjbEJvdW5kcykubWFwKE51bWJlcik7ICAvLyB4LCB5LCBYLCBZXHJcblxyXG5cdFx0XHR0aGlzLmRyYWdFbmFibGVkID0gISFvcHRzLmRyYWdFbmFibGVkO1xyXG5cdFx0XHR0aGlzLnBpbmNoRW5hYmxlZCA9ICEhb3B0cy5waW5jaEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMucGluY2hTd2lwZUVuYWJsZWQgPSAhIW9wdHMucGluY2hTd2lwZUVuYWJsZWQ7XHJcblx0XHRcdHRoaXMud2hlZWxFbmFibGVkID0gISFvcHRzLndoZWVsRW5hYmxlZDtcclxuXHRcdFx0dGhpcy5wYW5FbmFibGVkID0gISFvcHRzLnBhbkVuYWJsZWQ7XHJcblx0XHRcdHRoaXMudGlsdEVuYWJsZWQgPSAhIW9wdHMudGlsdEVuYWJsZWQ7XHJcblx0XHRcdHRoaXMuZXZlbnRzUmV2ZXJzZWQgPSAhIW9wdHMuZXZlbnRzUmV2ZXJzZWQ7XHJcblxyXG5cdFx0XHR0aGlzLl9oYW5kbGVkID0gZmFsc2U7XHJcblx0XHRcdHRoaXMuX3ByZXNzZWQgPSBmYWxzZTtcclxuXHRcdFx0dGhpcy5fY29vcmRpbmF0ZXMgPSBbMCwgMF07XHJcblx0XHRcdHRoaXMuX3RvdWNoZXMgPSBbIF07XHJcblx0XHRcdHRoaXMuX21vYmlsZSA9IENvbnRyb2xsYWJsZUNhbnZhcy5pc01vYmlsZTtcclxuXHRcdFx0aWYgKCFDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXgpIENvbnRyb2xsYWJsZUNhbnZhcy5fbGluZXBpeCA9IENvbnRyb2xsYWJsZUNhbnZhcy5saW5lVG9QaXg7XHJcblx0XHR9IC8vY3RvclxyXG5cclxuXHRcdGdldCByYXRpbygpOiBudW1iZXIge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy50YXJnZXQud2lkdGggLyB0aGlzLnRhcmdldC5oZWlnaHQ7XHJcblx0XHR9IC8vZy1yYXRpb1xyXG5cclxuXHRcdGdldCBtaW4oKTogbnVtYmVyIHtcclxuXHRcdFx0cmV0dXJuIE1hdGgubWluKHRoaXMudGFyZ2V0LndpZHRoLCB0aGlzLnRhcmdldC5oZWlnaHQpO1xyXG5cdFx0fSAvL2ctbWluXHJcblx0XHRnZXQgbWF4KCk6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiBNYXRoLm1heCh0aGlzLnRhcmdldC53aWR0aCwgdGhpcy50YXJnZXQuaGVpZ2h0KTtcclxuXHRcdH0gLy9nLW1heFxyXG5cclxuXHJcblx0XHQvKipcclxuXHRcdCAqIEVuYWJsZSBjb250cm9scywgY2FsbCBvbmx5IG9uY2VcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gZm9yY2U/PWZhbHNlIC0gRm9yY2UgaGFuZGxlXHJcblx0XHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gYm91bmQ/IC0gd2hldGhlciBiaW5kIHN1Y2VlZGVkIG9yIGl0IHdhcyBhbHJlYWR5IGJvdW5kIGVhcmxpZXJcclxuXHRcdCAqL1xyXG5cdFx0aGFuZGxlKGZvcmNlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuXHRcdFx0aWYgKCF0aGlzLl9oYW5kbGVkIHx8IGZvcmNlKSB7XHJcblx0XHRcdFx0dGhpcy5fbW9iaWxlID8gdGhpcy5fbW9iaWxlQWRhcHQoKSA6IHRoaXMuX3BjQWRhcHQoKTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy5faGFuZGxlZCA9IHRydWU7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2hhbmRsZVxyXG5cclxuXHRcdGFkZFdpZGdldChkYXRhOiBDYW52YXNCdXR0b24gfCBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMpOiBDYW52YXNCdXR0b24ge1xyXG5cdFx0XHRpZiAoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbiAmJiAhdGhpcy53Z2V0cy5oYXMoZGF0YSkpIHtcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCEoZGF0YSBpbnN0YW5jZW9mIENhbnZhc0J1dHRvbikpIHtcclxuXHRcdFx0XHRkYXRhID0gbmV3IENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24oPE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucz5kYXRhKTtcclxuXHRcdFx0XHR0aGlzLndnZXRzLmFkZCg8Q2FudmFzQnV0dG9uPmRhdGEpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9ycy5FSVNBTFI7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIDxDYW52YXNCdXR0b24+ZGF0YTtcclxuXHRcdH0gLy9hZGRXaWRnZXRcclxuXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBSZS1hcHBseSBpbnRlcm5hbCB0cmFuc2Zvcm1hdGlvbnNcclxuXHRcdCAqIEBtZXRob2RcclxuXHRcdCAqIEByZXR1cm5zIHtDb250cm9sbGFibGVDYW52YXN9IHRoaXMgLSBGb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdHJldHJhbnNmb3JtKCk6IFRoaXNUeXBlPENvbnRyb2xsYWJsZUNhbnZhcz4ge1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQudHJhbnNsYXRlKHRoaXMudHJhbnNbMF0sIHRoaXMudHJhbnNbMV0pO1xyXG5cdFx0XHR0aGlzLmNvbnRleHQuc2NhbGUodGhpcy5zY2xbMF0sIHRoaXMuc2NsWzFdKTtcclxuXHRcdFx0dGhpcy5jb250ZXh0LnJvdGF0ZSh0aGlzLnJvdCk7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fSAvL3JldHJhbnNmb3JtXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBJbnRlcm1lZGlhdGUgdHJhbnNsYXRpb24gZnVuY3Rpb24gZm9yIGljb25pYyB0cmFuc2xhdGUgYmVmb3JlIHRoZSByZWFsXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geD0wIC0geCB0cmFuc2xhdGlvblxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHk9MCAtIHkgdHJhbnNsYXRpb25cclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWJzPz1mYWxzZSAtIGFic2x1dGUgdHJhbnNsYXRpb24gb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSB0cmFucyAtIFJldHVybnMgY3VycmVudCB0b3RhbCB0cmFuc2xhdGlvblxyXG5cdFx0ICovXHJcblx0XHR0cmFuc2xhdGUoeDogbnVtYmVyID0gMCwgeTogbnVtYmVyID0gMCwgYWJzOiBib29sZWFuID0gZmFsc2UpOiBudW1iZXJbXSB7XHJcblx0XHRcdGxldCBieTogbnVtYmVyW10gPSBbeCwgeV0ubWFwKE51bWJlcik7XHJcblx0XHRcdHJldHVybiB0aGlzLnRyYW5zID0gdGhpcy50cmFucy5tYXAoKHRybjogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYm91bmQoTnVtYmVyKCFhYnMgPyAodHJuICsgYnlbaWR4XSkgOiBieVtpZHhdKSwgdGhpcy50cmFuc0JvdW5kc1tpZHhdLCB0aGlzLnRyYW5zQm91bmRzW2lkeCArIDJdKSk7XHJcblx0XHR9IC8vdHJhbnNsYXRlXHJcblx0XHQvKipcclxuXHRcdCAqIEludGVybWVkaWF0ZSBzY2FsaW5nIGZ1bmN0aW9uIGZvciBpY29uaWMgc2NhbGUgYmVmb3JlIHRoZSByZWFsXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0geD0xIC0geCBzY2FsZVxyXG5cdFx0ICogQHBhcmFtIHtudW1iZXJ9IHk9eCAtIHkgc2NhbGVcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWJzPz1mYWxzZSAtIGFic2x1dGUgc2NhbGUgb3IgcmVsYXRpdmUgdG8gY3VycmVudFxyXG5cdFx0ICogQHJldHVybnMge251bWJlcltdfSBzY2wgLSBSZXR1cm5zIGN1cnJlbnQgdG90YWwgc2NhbGluZ1xyXG5cdFx0ICovXHJcblx0XHRzY2FsZSh4OiBudW1iZXIgPSAxLCB5OiBudW1iZXIgPSB4LCBhYnM6IGJvb2xlYW4gPSBmYWxzZSk6IG51bWJlcltdIHtcclxuXHRcdFx0bGV0IGJ5OiBudW1iZXJbXSA9IFt4LCB5XS5tYXAoTnVtYmVyKTtcclxuXHRcdFx0cmV0dXJuIHRoaXMuc2NsID0gdGhpcy5zY2wubWFwKChzY2w6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGJvdW5kKE51bWJlcighYWJzID8gKHNjbCAqIGJ5W2lkeF0pIDogYnlbaWR4XSksIHRoaXMuc2NsQm91bmRzW2lkeF0sIHRoaXMuc2NsQm91bmRzW2lkeCArIDJdKSk7XHJcblx0XHR9IC8vc2NhbGVcclxuXHJcblxyXG5cdFx0cHJpdmF0ZSBfbW9iaWxlQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLmRyYWcgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZVN0YXJ0KGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgdGhpcy5fYWRhcHRzLnBpbmNoU3dpcGUgPSB0aGlzLl9hZGFwdHMucGluY2ggPSB0aGlzLl9hZGFwdHMuZHJhZyA9IChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZU1vdmUoZSwgdGhpcyksIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChlOiBUb3VjaEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMuZHJhZ01vYmlsZUVuZChlLCB0aGlzKSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hjYW5jZWxcIiwgKGU6IFRvdWNoRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5kcmFnTW9iaWxlRW5kKGUsIHRoaXMpLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQpIHtcclxuXHJcblx0XHRcdH1cclxuXHRcdH0gLy9fbW9iaWxlQWRhcHRcclxuXHRcdHByaXZhdGUgX3BjQWRhcHQoKTogdm9pZCB7XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLmRyYWcgJiYgdGhpcy5kcmFnRW5hYmxlZCkge1xyXG5cdFx0XHRcdHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5fYWRhcHRzLmRyYWcgPSAoZTogTW91c2VFdmVudCkgPT4gQ29udHJvbGxhYmxlQ2FudmFzLmRyYWdQQyhlLCB0aGlzKSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZT86IE1vdXNlRXZlbnQpID0+IHRoaXMuX3ByZXNzZWQgPSB0cnVlKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAoZT86IE1vdXNlRXZlbnQpID0+IHRoaXMuX3ByZXNzZWQgPSBmYWxzZSk7XHJcblx0XHRcdFx0aWYgKCh0aGlzLnVzZUJ1dHRvbiAmIE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUKSA9PT0gT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpIHRoaXMudGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZTogTW91c2VFdmVudCkgPT4gZS5wcmV2ZW50RGVmYXVsdCgpLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLndoZWVsICYmIHRoaXMud2hlZWxFbmFibGVkKSB7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIndoZWVsXCIsIHRoaXMuX2FkYXB0cy53aGVlbCA9IChlOiBXaGVlbEV2ZW50KSA9PiBDb250cm9sbGFibGVDYW52YXMud2hlZWwoZSwgdGhpcykpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGhpcy5fYWRhcHRzLnRpbHQpIHtcclxuXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCF0aGlzLl9hZGFwdHMuY2xpY2spIHtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5fYWRhcHRzLmNsaWNrID0gKGU6IE1vdXNlRXZlbnQpID0+IENvbnRyb2xsYWJsZUNhbnZhcy5jbGlja1BDKGUsIHRoaXMpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL19wY0FkYXB0XHJcblxyXG5cdFx0c3RhdGljIGRyYWdQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRpZiAoKChjYy51c2VCdXR0b24gJiBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRVJJR0hUICYmICgoKFwiYnV0dG9uc1wiIGluIGV2ZW50KSAmJiAoZXZlbnQuYnV0dG9ucyAmIDIpID09PSAyKSB8fCAoKFwid2hpY2hcIiBpbiBldmVudCkgJiYgZXZlbnQud2hpY2ggPT09IDMpIHx8ICgoXCJidXR0b25cIiBpbiBldmVudCkgJiYgZXZlbnQuYnV0dG9uID09PSAyKSkpIHx8ICgoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFUklHSFQpID09PSBPcHRzLlVzZUJ1dHRvbi5VU0VSSUdIVCAmJiAoY2MudXNlQnV0dG9uICYgT3B0cy5Vc2VCdXR0b24uVVNFQk9USCkgIT09IE9wdHMuVXNlQnV0dG9uLlVTRUJPVEggJiYgKChcImJ1dHRvbnNcIiBpbiBldmVudCkgJiYgKGV2ZW50LmJ1dHRvbnMgJiAyKSAhPT0gMikgJiYgKChcIndoaWNoXCIgaW4gZXZlbnQpICYmIGV2ZW50LndoaWNoICE9PSAzKSAmJiAoKFwiYnV0dG9uXCIgaW4gZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMikpKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuXHRcdFx0bGV0IGNvb3JkczogbnVtYmVyW10gPSBbZXZlbnQuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0sXHJcblx0XHRcdFx0cmVsOiBudW1iZXJbXSA9IFtdLFxyXG5cdFx0XHRcdHJldDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdFx0aWYgKGNjLl9wcmVzc2VkKSB7XHJcblx0XHRcdFx0Y2MudHJhbnNsYXRlKGV2ZW50Lm1vdmVtZW50WCAqIGNjLnRyYW5zU3BlZWQsIGV2ZW50Lm1vdmVtZW50WSAqIGNjLnRyYW5zU3BlZWQpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3IgKGxldCBidXR0IG9mIGNjLndnZXRzKSB7XHJcblx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuaXNPbihyZWwgPSBjb29yZHMubWFwKChjOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiBjIC0gY2MudHJhbnNbaWR4XSkpICYmICFidXR0LnBzdGF0ZSAmJiAoYnV0dC5wc3RhdGUgPSB0cnVlLCByZXQgPSBidXR0LmZvY3VzKHJlbCkpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ1BDXHJcblxyXG5cdFx0c3RhdGljIGRyYWdNb2JpbGVNb3ZlKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGZ1bmN0aW9uIGNoZWNrKGFycjogbnVtYmVyW10sIGN1cnI6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdFx0aWYgKGFyci5ldmVyeSgoYXI6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IE1hdGguYWJzKGFyIC0gY3VycltpZHhdKSA+PSBjYy50b3VjaFNlbnNpdGl2aXR5KSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0fSAvL2NoZWNrXHJcblx0XHRcdGZ1bmN0aW9uIGFycmF5bmdlKHRsaXM6IFRvdWNoTGlzdCk6IG51bWJlcltdW10ge1xyXG5cdFx0XHRcdHJldHVybiBbW3RsaXNbMF0uY2xpZW50WCwgdGxpc1swXS5jbGllbnRZXSwgW3RsaXNbMV0uY2xpZW50WCwgdGxpc1sxXS5jbGllbnRZXV07XHJcblx0XHRcdH0gLy9hcnJheW5nZVxyXG5cdFx0XHRmdW5jdGlvbiBldmVyeSh0OiBudW1iZXJbXVtdLCBudDogbnVtYmVyW11bXSwgYWxsOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcclxuXHRcdFx0XHRsZXQgb3V0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGFsbCAmJiBjaGVjayh0WzBdLCBudFswXSkgJiYgY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGFsbCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFswXSwgbnRbMF0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY2hlY2sodFsxXSwgbnRbMV0pKSB7XHJcblx0XHRcdFx0XHRvdXQgPSAhb3V0O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0XHR9IC8vZXZlcnlcclxuXHRcdFx0ZnVuY3Rpb24gaW5oKG9uZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXNbMF0gPSBbZXZlbnQudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cdFx0XHRcdGlmICghb25lKSBjYy5fdG91Y2hlc1sxXSA9IFtldmVudC50YXJnZXRUb3VjaGVzWzFdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQudGFyZ2V0VG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF07XHJcblx0XHRcdH0gLy9pbmhcclxuXHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC50YXJnZXRUb3VjaGVzW2V2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3BdO1xyXG5cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGxldCBjcDogbnVtYmVyW10gPSBBcnJheS5mcm9tKGNjLnRyYW5zKSxcclxuXHRcdFx0XHRcdGRpczogbnVtYmVyO1xyXG5cdFx0XHRcdGNjLnRyYW5zbGF0ZSguLi5bY29vcmRzWzBdIC0gY2MuX2Nvb3JkaW5hdGVzWzBdLCBjb29yZHNbMV0gLSBjYy5fY29vcmRpbmF0ZXNbMV1dLm1hcCgodjogbnVtYmVyKSA9PiB2ICogY2MudHJhbnNTcGVlZCkpO1xyXG5cdFx0XHRcdGRpcyA9IGRpc3QoW2NwWzBdLCBjYy50cmFuc1swXV0sIFtjcFsxXSwgY2MudHJhbnNbMV1dKTtcclxuXHRcdFx0XHRpZiAoZGlzID4gY2MudG91Y2hTZW5zaXRpdml0eSkgY2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHRcdGluaCh0cnVlKTtcclxuXHRcdFx0fSBlbHNlIGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDIgJiYgZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDIpIHtcclxuXHRcdFx0XHRpZiAoY2MucGluY2hFbmFibGVkICYmIChjYy5zY2FsZU1vZGUgJiBPcHRzLlNjYWxlTW9kZS5CWVBBU1MpID09PSBPcHRzLlNjYWxlTW9kZS5CWVBBU1MpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhcInNjYWxpbmcgYnlwYXNzXCIpOyAgLy9TUEVDSUFMIENFTlRFUipcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGNjLnBpbmNoU3dpcGVFbmFibGVkICYmIGV2ZXJ5KGFycmF5bmdlKGV2ZW50LnRhcmdldFRvdWNoZXMpLCBjYy5fdG91Y2hlcykpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhcInJvdGF0aW9uXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoY2MucGluY2hFbmFibGVkICYmIGV2ZXJ5KGFycmF5bmdlKGV2ZW50LnRhcmdldFRvdWNoZXMpLCBjYy5fdG91Y2hlcywgdHJ1ZSkpIHsgIC8vTkVFREVEIEZPUiBQUkVDSVNJT04hXHJcblx0XHRcdFx0XHRjb25zb2xlLmluZm8oXCJzY2FsaW5nXCIpO1xyXG5cdFx0XHRcdFx0aWYgKChjYy5zY2FsZU1vZGUgJiBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpID09PSBPcHRzLlNjYWxlTW9kZS5GUkVFU0NBTEUpIHtcclxuXHJcblx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHQvL0B0cy1pZ25vcmVcclxuXHRcdFx0XHRcdFx0bGV0IGluaWRpc3Q6IG51bWJlciA9IGRpc3QoW2NjLl90b3VjaGVzW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmlkZW50aWZpZXJdWzBdLCBjYy5fdG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5pZGVudGlmaWVyXVswXV0sIFtjYy5fdG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlc1swXS5pZGVudGlmaWVyXVsxXSwgY2MuX3RvdWNoZXNbZXZlbnQuY2hhbmdlZFRvdWNoZXNbMV0uaWRlbnRpZmllcl1bMV1dKSxcclxuXHRcdFx0XHRcdFx0XHRkaXM6IG51bWJlciA9IGRpc3QoW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMV0uY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0XSwgW2V2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wLCBldmVudC5jaGFuZ2VkVG91Y2hlc1sxXS5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcF0pLFxyXG5cdFx0XHRcdFx0XHRcdGl0b3VjaGVzOiBudW1iZXJbXSA9IFtjYy5fdG91Y2hlc1swXVswXSArIGNjLl90b3VjaGVzWzFdWzBdLCBjYy5fdG91Y2hlc1swXVsxXSArIGNjLl90b3VjaGVzWzFdWzFdXS5tYXAoKGk6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IGkgLyAyIC0gY2MudHJhbnNbaWR4XSksXHJcblx0XHRcdFx0XHRcdFx0ZDogbnVtYmVyID0gZGlzIC8gaW5pZGlzdCxcclxuXHRcdFx0XHRcdFx0XHRudG91Y2hlczogbnVtYmVyW10gPSBpdG91Y2hlcy5tYXAoKGk6IG51bWJlcikgPT4gaSAqICgxIC0gZCkpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y2MudHJhbnNsYXRlKC4uLm50b3VjaGVzKTtcclxuXHRcdFx0XHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGluaCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjb29yZHM7XHJcblx0XHR9IC8vZHJhZ01vYmlsZU1vdmVcclxuXHRcdHN0YXRpYyBkcmFnTW9iaWxlU3RhcnQoZXZlbnQ6IFRvdWNoRXZlbnQsIGNjOiBDb250cm9sbGFibGVDYW52YXMsIGN1c3Q6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRpZiAoIWN1c3QpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jaGFuZ2VkVG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV0sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiBjYy5fdG91Y2hlc1t0LmlkZW50aWZpZXJdID0gW3QuY2xpZW50WCAtIGNjLnRhcmdldC5vZmZzZXRMZWZ0LCB0LmNsaWVudFkgLSBjYy50YXJnZXQub2Zmc2V0VG9wXSk7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5pc09uKGNvb3JkcykgJiYgIWJ1dHQucHN0YXRlICYmIChidXR0LnBzdGF0ZSA9IHRydWUsIHJldCA9IGJ1dHQuZm9jdXMoY29vcmRzKSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGNjLl90b3VjaGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdGNjLl9jbGt0aW1lID0gRGF0ZS5ub3coKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjYy5fY2xrdGltZSA9IDA7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2MuX3ByZXNzZWQgPSB0cnVlO1xyXG5cdFx0XHRjYy5fY29vcmRpbmF0ZXMgPSBjYy5fdG91Y2hlc1tjYy5fdG91Y2hlcy5sZW5ndGggLSAxXTtcclxuXHRcdH0gLy9kcmFnTW9iaWxlU3RhcnRcclxuXHRcdHN0YXRpYyBkcmFnTW9iaWxlRW5kKGV2ZW50OiBUb3VjaEV2ZW50LCBjYzogQ29udHJvbGxhYmxlQ2FudmFzKTogdm9pZCB7XHJcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGlmIChjYy5fdG91Y2hlcy5sZW5ndGggPT09IDEgJiYgRGF0ZS5ub3coKSAtIGNjLl9jbGt0aW1lIDw9IGNjLmNsaWNrU2Vuc2l0aXZpdHkpIHtcclxuXHRcdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jaGFuZ2VkVG91Y2hlc1tldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggLSAxXS5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoIC0gMV0uY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV0sXHJcblx0XHRcdFx0XHRzb3J0ZWQgPSBBcnJheS5mcm9tKGNjLndnZXRzLmVudHJpZXMoKSkubWFwKChzOiBDYW52YXNCdXR0b25bXSkgPT4gc1sxXSkuc29ydCgoYTogQ2FudmFzQnV0dG9uLCBiOiBDYW52YXNCdXR0b24pID0+IGIuX2lkIC0gYS5faWQpLFxyXG5cdFx0XHRcdFx0cmV0OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0XHRidXR0LmVuYWJsZWQgJiYgYnV0dC5pc09uKGNvb3JkcykgJiYgKHJldCA9IGJ1dHQuY2xpY2soY29vcmRzKSk7XHJcblx0XHRcdFx0XHRpZiAocmV0KSBicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2MuX2Nsa3RpbWUgPSAwO1xyXG5cdFx0XHR9XHJcblx0XHRcdEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHQ6IFRvdWNoKSA9PiB7XHJcblx0XHRcdFx0Y2MuX3RvdWNoZXMuc3BsaWNlKHQuaWRlbnRpZmllciwgMSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRpZiAoT2JqZWN0LmtleXMoY2MuX3RvdWNoZXMpLmxlbmd0aCA9PSAxKSB7XHJcblx0XHRcdFx0Q29udHJvbGxhYmxlQ2FudmFzLmRyYWdNb2JpbGVTdGFydChldmVudCwgY2MsIHRydWUpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNjLl9wcmVzc2VkID0gISFjYy5fdG91Y2hlcy5sZW5ndGg7XHJcblx0XHR9IC8vZHJhZ01vYmlsZUVuZFxyXG5cclxuXHRcdHN0YXRpYyB3aGVlbChldmVudDogV2hlZWxFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRsZXQgZDogbnVtYmVyID0gMSAtIGNjLnNjbFNwZWVkICogQ29udHJvbGxhYmxlQ2FudmFzLmZpeERlbHRhKGV2ZW50LmRlbHRhTW9kZSwgZXZlbnQuZGVsdGFZKSAvIGNjLm1pbixcclxuXHRcdFx0XHRjb29yZHM6IG51bWJlcltdID0gW2V2ZW50LmNsaWVudFggLSBjYy50YXJnZXQub2Zmc2V0TGVmdCAtIGNjLnRyYW5zWzBdLCBldmVudC5jbGllbnRZIC0gY2MudGFyZ2V0Lm9mZnNldFRvcCAtIGNjLnRyYW5zWzFdXTtcclxuXHRcdFx0Y2MudHJhbnNsYXRlKC4uLmNvb3Jkcy5tYXAoKGM6IG51bWJlcikgPT4gYyAqICgxIC0gZCkpKTtcclxuXHRcdFx0Y2Muc2NhbGUoZCk7XHJcblx0XHR9IC8vd2hlZWxcclxuXHJcblx0XHRzdGF0aWMgY2xpY2tQQyhldmVudDogTW91c2VFdmVudCwgY2M6IENvbnRyb2xsYWJsZUNhbnZhcyk6IHZvaWQge1xyXG5cdFx0XHRsZXQgY29vcmRzOiBudW1iZXJbXSA9IFtldmVudC5jbGllbnRYIC0gY2MudGFyZ2V0Lm9mZnNldExlZnQgLSBjYy50cmFuc1swXSwgZXZlbnQuY2xpZW50WSAtIGNjLnRhcmdldC5vZmZzZXRUb3AgLSBjYy50cmFuc1sxXV0sXHJcblx0XHRcdFx0c29ydGVkID0gQXJyYXkuZnJvbShjYy53Z2V0cy5lbnRyaWVzKCkpLm1hcCgoczogQ2FudmFzQnV0dG9uW10pID0+IHNbMV0pLnNvcnQoKGE6IENhbnZhc0J1dHRvbiwgYjogQ2FudmFzQnV0dG9uKSA9PiBiLl9pZCAtIGEuX2lkKSxcclxuXHRcdFx0XHRyZXQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHRcdFx0XHJcblx0XHRcdGZvciAobGV0IGJ1dHQgb2Ygc29ydGVkKSB7XHJcblx0XHRcdFx0YnV0dC5lbmFibGVkICYmIGJ1dHQuaXNPbihjb29yZHMpICYmIChyZXQgPSBidXR0LmNsaWNrKGNvb3JkcykpO1xyXG5cdFx0XHRcdGlmIChyZXQpIGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9IC8vY2xpY2tQQ1xyXG5cclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgaXNNb2JpbGUoKTogYm9vbGVhbiB7XHJcblx0XHRcdGlmIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL3dlYk9TL2kpXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvaVBob25lL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL2lQYWQvaSlcclxuXHRcdFx0XHR8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpIHx8IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0JsYWNrQmVycnkvaSkgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvV2luZG93cyBQaG9uZS9pKVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdH1cclxuXHRcdH0gLy9kZXRlY3RNb2JpbGVcclxuXHJcblx0XHRwcml2YXRlIHN0YXRpYyBnZXQgbGluZVRvUGl4KCk6IG51bWJlciB7XHJcblx0XHRcdGxldCByOiBudW1iZXIsXHJcblx0XHRcdFx0aWZyYW1lOiBIVE1MSUZyYW1lRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XHJcblx0XHRcdGlmcmFtZS5zcmMgPSAnIyc7XHJcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcclxuXHRcdFx0bGV0IGl3aW46IFdpbmRvdyA9IGlmcmFtZS5jb250ZW50V2luZG93LFxyXG5cdFx0XHRcdGlkb2M6IERvY3VtZW50ID0gaXdpbi5kb2N1bWVudDtcclxuXHRcdFx0aWRvYy5vcGVuKCk7XHJcblx0XHRcdGlkb2Mud3JpdGUoJzwhRE9DVFlQRSBodG1sPjxodG1sPjxoZWFkPjwvaGVhZD48Ym9keT48cD5hPC9wPjwvYm9keT48L2h0bWw+Jyk7XHJcblx0XHRcdGlkb2MuY2xvc2UoKTtcclxuXHRcdFx0bGV0IHNwYW46IEhUTUxFbGVtZW50ID0gPEhUTUxFbGVtZW50Pmlkb2MuYm9keS5maXJzdEVsZW1lbnRDaGlsZDtcclxuXHRcdFx0ciA9IHNwYW4ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcblx0XHRcdHJldHVybiByO1xyXG5cdFx0fSAvL2xpbmVUb1BpeFxyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIGZpeERlbHRhKG1vZGU6IG51bWJlciwgZGVsdGFZOiBudW1iZXIpOiBudW1iZXIge1xyXG5cdFx0XHRpZiAobW9kZSA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBDb250cm9sbGFibGVDYW52YXMuX2xpbmVwaXggKiBkZWx0YVk7XHJcblx0XHRcdH0gZWxzZSBpZiAobW9kZSA9PT0gMikge1xyXG5cdFx0XHRcdHJldHVybiB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cmV0dXJuIGRlbHRhWTtcclxuXHRcdFx0fVxyXG5cdFx0fSAvL2ZpeERlbHRhXHJcblx0XHRcclxuXHR9IC8vQ29udHJvbGxhYmxlQ2FudmFzXHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgd2lkZ2V0LW1ha2luZyBjbGFzcyBmb3IgY2FudmFzXHJcblx0ICogQG1lbWJlcm9mIENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IHggLSB4IGNvb3JkaW5hdGVcclxuXHQgKiBAcHJvcCB7bnVtYmVyfSB5IC0geSBjb29yZGluYXRlXHJcblx0ICogQHByb3Age251bWJlcn0gZHggLSB3aWR0aFxyXG5cdCAqIEBwcm9wIHtudW1iZXJ9IGR5IC0gaGVpZ2h0XHJcblx0ICogQHByb3Age251bWJlcn0gaW5kZXggLSBlcXVpdmFsZW50IHRvIENTUyB6LWluZGV4XHJcblx0ICovXHJcblx0Y2xhc3MgQ2FudmFzQnV0dG9uIGltcGxlbWVudHMgT3B0cy5DYW52YXNCdXR0b25PcHRpb25zIHtcclxuXHRcdHg6IG51bWJlciA9IDA7XHJcblx0XHR5OiBudW1iZXIgPSAwO1xyXG5cdFx0ZHg6IG51bWJlciA9IDA7XHJcblx0XHRkeTogbnVtYmVyID0gMDtcclxuXHRcdGluZGV4OiBudW1iZXIgPSAtMTtcclxuXHRcdHBhcmVudDogQ29udHJvbGxhYmxlQ2FudmFzO1xyXG5cdFx0X2lkOiBudW1iZXI7XHJcblx0XHRlbmFibGVkOiBib29sZWFuID0gdHJ1ZTtcclxuXHRcdHBzdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuXHRcdHByaXZhdGUgc3RhdGljIHNlbnNpdGl2aXR5OiBudW1iZXIgPSAuNTtcclxuXHRcdHByaXZhdGUgc3RhdGljIF9pZGNudHI6IG51bWJlciA9IDA7XHJcblx0XHQvKipcclxuXHRcdCAqIERlZmF1bHQgb3B0aW9ucyBmb3IgQ2FudmFzQnV0dG9uXHJcblx0XHQgKiBAcmVhZG9ubHlcclxuXHRcdCAqIEBzdGF0aWNcclxuXHRcdCAqL1xyXG5cdFx0cHJpdmF0ZSBzdGF0aWMgZGVmYXVsdE9wdHM6IE9wdHMuQ2FudmFzQnV0dG9uT3B0aW9ucyA9IHtcclxuXHRcdFx0eDogMCxcclxuXHRcdFx0eTogMCxcclxuXHRcdFx0ZHg6IDAsXHJcblx0XHRcdGR5OiAwLFxyXG5cdFx0XHRpbmRleDogLTEsXHJcblx0XHRcdHBzdGF0ZTogZmFsc2UsXHJcblx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdHBhcmVudDogbmV3IENvbnRyb2xsYWJsZUNhbnZhc1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb25zdHJ1Y3RvcihvcHRzOiBPcHRzLkNhbnZhc0J1dHRvbk9wdGlvbnMgPSBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpIHsgIC8vRE9VQkxFQ0xJQ0ssIExPTkdDTElDSywgRFJBRywgLi4uIFVTRVItSU1QTEVNRU5URUQoPylcclxuXHRcdFx0aW5oZXJpdChvcHRzLCBDYW52YXNCdXR0b24uZGVmYXVsdE9wdHMpO1xyXG5cclxuXHRcdFx0aWYgKFtvcHRzLngsIG9wdHMueSwgb3B0cy5keCwgb3B0cy5keV0uc29tZSgobnVtOiBhbnkpID0+IGlzTmFOKG51bSkgfHwgbnVtID09PSAnJykpIHtcclxuXHRcdFx0XHR0aHJvdyBFcnJvcnMuRU5PVE5VTUFSUjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy54ID0gb3B0cy54ICogMTtcclxuXHRcdFx0dGhpcy55ID0gb3B0cy55ICogMTtcclxuXHRcdFx0dGhpcy5keCA9IG9wdHMuZHggKiAxO1xyXG5cdFx0XHR0aGlzLmR5ID0gb3B0cy5keSAqIDE7XHJcblx0XHRcdHRoaXMuX2lkID0gQ2FudmFzQnV0dG9uLl9pZGNudHIrKztcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0Ly9AT3ZlcnJpZGVcclxuXHRcdC8qKlxyXG5cdFx0ICogQ2hlY2tzIGlmIGJ1dHRvbiB3YXMgZXhpdGVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGJsdXIoLi4uYW55OiBhbnlbXSk6IGJvb2xlYW4ge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0gLy9ibHVyXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBlbnRlcmVkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGZvY3VzKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fSAvL2ZvY3VzXHJcblx0XHQvL0BPdmVycmlkZVxyXG5cdFx0LyoqXHJcblx0XHQgKiBDaGVja3MgaWYgYnV0dG9uIHdhcyBjbGlja2VkIGFuZCBkZWNpZGVzIHdoZXRoZXIgdG8gcHJvcGFnYXRlXHJcblx0XHQgKiBAcGFyYW0gYW55XHJcblx0XHQgKi9cclxuXHRcdGNsaWNrKC4uLmFueTogYW55W10pOiBib29sZWFuIHtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9IC8vY2xpY2tcclxuXHJcblx0XHQvKipcclxuXHRcdCAqIENoZWNrcyBpZiBwb2ludGVyIGlzIGFib3ZlIHRoZSB3aWRnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyW119IHJlbGF0aXZlQ29vcmRzXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKi9cclxuXHRcdGlzT24ocmVsYXRpdmVDb29yZHM6IG51bWJlcltdKTogYm9vbGVhbiB7XHJcblx0XHRcdGxldCBvdXQ6IGJvb2xlYW4gPSBpc1dpdGhpbihbdGhpcy54LCB0aGlzLnksIHRoaXMuZHgsIHRoaXMuZHldLCBbcmVsYXRpdmVDb29yZHNbMF0sIHJlbGF0aXZlQ29vcmRzWzFdXSwgQ2FudmFzQnV0dG9uLnNlbnNpdGl2aXR5KTtcclxuXHJcblx0XHRcdGlmICghb3V0ICYmIHRoaXMucHN0YXRlKSB7XHJcblx0XHRcdFx0dGhpcy5ibHVyKHJlbGF0aXZlQ29vcmRzKTtcclxuXHRcdFx0XHR0aGlzLnBzdGF0ZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gb3V0O1xyXG5cdFx0fSAvL2lzT25cclxuXHR9XHJcblxyXG5cdENvbnRyb2xsYWJsZUNhbnZhcy5DYW52YXNCdXR0b24gPSBDYW52YXNCdXR0b247XHJcblxyXG5cdC8qKlxyXG5cdCAqIEEgY2xhc3Mgb2ZmZXJpbmcgbWF0aGVtYXRpY2FsIFZlY3RvciB1dGlsaXRpZXNcclxuXHQgKiBAaW5uZXJcclxuXHQgKiBAY2xhc3NcclxuXHQgKiBAcHJvcCB7bnVtYmVyW119IHByb3BzIC0gdmVjdG9yIHZlcnRpY2VzXHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIFZlY3RvciB7XHJcblx0XHRwcm9wczogbnVtYmVyW107XHJcblxyXG5cdFx0Y29uc3RydWN0b3IocHJvcHM6IG51bWJlcltdID0gWyBdKSB7XHJcblx0XHRcdHRoaXMucHJvcHMgPSBBcnJheS5mcm9tKHByb3BzLm1hcChOdW1iZXIpKTtcclxuXHRcdH0gLy9jdG9yXHJcblxyXG5cdFx0LyoqXHJcblx0XHQgKiBBZGQgYSB2ZWN0b3Igb3IgbnVtYmVyIHRvIGN1cnJlbnQgdmVjdG9yXHJcblx0XHQgKiBAbWV0aG9kXHJcblx0XHQgKiBAcGFyYW0ge1ZlY3RvcnxudW1iZXJ9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEBwYXJhbSB7bnVtYmVyfSBzdWIgLSBTZXQgdG8gYC0xYCB0byBzdWJzdHJhY3QgaW5zdGVhZFxyXG5cdFx0ICogQHJldHVybnMgYHRoaXNgIGZvciBtZXRob2QgY2hhaW5pbmdcclxuXHRcdCAqL1xyXG5cdFx0YWRkKHRhcmc6IFZlY3RvciB8IG51bWJlciwgc3ViOiBudW1iZXIgPSAxKTogVGhpc1R5cGU8VmVjdG9yPiB7XHJcblx0XHRcdGlmICh0YXJnIGluc3RhbmNlb2YgVmVjdG9yKSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKz0gc3ViICogdGFyZ1tpZHhdO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucHJvcHMuZm9yRWFjaCgocHJvcDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5wcm9wc1tpZHhdICs9IHN1YiAqIHRhcmc7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9IC8vYWRkXHJcblx0XHQvKipcclxuXHRcdCAqIE11bHRpcGx5IGEgdmVjdG9yIG9yIG51bWJlciB0byBjdXJyZW50IHZlY3RvclxyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J8bnVtYmVyfSB0YXJnIC0gdGFyZ2V0XHJcblx0XHQgKiBAcGFyYW0ge251bWJlcn0gZGl2IC0gU2V0IHRvIGAtMWAgdG8gZGl2aWRlIGluc3RlYWRcclxuXHRcdCAqIEByZXR1cm5zIGB0aGlzYCBmb3IgbWV0aG9kIGNoYWluaW5nXHJcblx0XHQgKi9cclxuXHRcdG11bHQodGFyZzogVmVjdG9yIHwgbnVtYmVyLCBkaXY6IG51bWJlciA9IDEpOiBUaGlzVHlwZTxWZWN0b3I+IHtcclxuXHRcdFx0aWYgKHRhcmcgaW5zdGFuY2VvZiBWZWN0b3IpIHtcclxuXHRcdFx0XHR0aGlzLnByb3BzLmZvckVhY2goKHByb3A6IG51bWJlciwgaWR4OiBudW1iZXIpID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucHJvcHNbaWR4XSAqPSBNYXRoLnBvdyh0YXJnW2lkeF0sIGRpdik7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5wcm9wcy5mb3JFYWNoKChwcm9wOiBudW1iZXIsIGlkeDogbnVtYmVyKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnByb3BzW2lkeF0gKj0gTWF0aC5wb3codGFyZywgZGl2KTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH0gLy9tdWx0XHJcblx0XHQvKipcclxuXHRcdCAqIERvdCBwcm9kdWN0IG9mIDIgdmVjdG9yc1xyXG5cdFx0ICogQG1ldGhvZFxyXG5cdFx0ICogQHBhcmFtIHtWZWN0b3J9IHRhcmcgLSB0YXJnZXRcclxuXHRcdCAqIEByZXR1cm5zIHByb2R1Y3RcclxuXHRcdCAqL1xyXG5cdFx0ZG90KHRhcmc6IFZlY3Rvcik6IG51bWJlciB7XHJcblx0XHRcdHJldHVybiB0aGlzLnByb3BzLnJlZHVjZSgoYWNjOiBudW1iZXIsIHZhbDogbnVtYmVyLCBpZHg6IG51bWJlcikgPT4gYWNjICsgdmFsICogdGFyZ1tpZHhdKTtcclxuXHRcdH0gLy9kb3RcclxuXHJcblx0fSAvL1ZlY3RvclxyXG5cclxufSAvL0NhbnZhc0NvbnRyb2xzXHJcblxyXG5leHBvcnQgZGVmYXVsdCBDYW52YXNDb250cm9scy5Db250cm9sbGFibGVDYW52YXM7XHJcbiJdfQ==