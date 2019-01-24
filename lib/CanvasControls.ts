/*
 * Angle between 3 poins (Radians):
 * pc: center/pole
 * pn: point new coordinates
 * pp: point past coordinates
 * 
 * atan2(pny - pcy, pnx - pcx) - atan2(ppy - pcy, ppx - pcx)
 */

"use strict";
import "@babel/polyfill";

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
export module CanvasControls {

	type Class = { new(...args: any[]): any; };

	/**
	 * If `dest` lacks a property that `targ` has then that property is copied into `dest`
	 * @function
	 * @inner
	 * @param {object} dest - destination object
	 * @param {object} targ - base object
	 * @param {Function} condition - inheritance condition
	 * @returns {object} destination object
	 */
	export function inherit(dest: {}, targ: {}, condition: Function = (dest: {}, targ: {}, prop: string): any => dest[prop] === undefined && (dest[prop] = targ[prop])): {} {
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
	 * @param {number} p=0 - precision
	 * @returns {number} bound number
	 */
	export function bound(n: number, m: number, M: number, p: number = 0): number {
		return n > M + p ? M : (n < m - p ? m : n);
	} //bound
	/**
	 * Downspeed incrementation
	 * @param {number} n - number
	 * @param {number} m - minimum
	 * @param {number} M - Maximum
	 * @param {number} op - operation
	 * @returns {number} n
	 */
	export function block(n: number, m: number, M: number, op: number): number {
		if (n > M && op > 0) {
			return n;
		} else if (n > M) {
			return n + op;
		} else if (n < m && op < 0) {
			return n;
		} else if (n < m) {
			return n + op;
		} else {
			return n + op;
		}
	} //block
	/**
	 * Calculate distance between 2 points
	 * @param {number[]} Xs - X coordinates
	 * @param {number[]} Ys - Y coordinates
	 * @returns {number} distance
	 * @function
	 * @inner
	 */
	export function dist(Xs: number[], Ys: number[]): number {
		return Math.sqrt([Xs[1] - Xs[0], Ys[1] - Ys[0]].map((v: number) => Math.pow(v, 2)).reduce((acc: number, v: number) => acc + v));
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
	export function isWithin(box: number[], point: number[], sensitivity: number = .5): boolean {
		return box[0] - sensitivity <= point[0] && box[0] + box[2] + sensitivity >= point[0] && box[1] - sensitivity <= point[1] && box[1] + box[3] + sensitivity >= point[1];
	} //isWithin

	/**
	 * A holder for all Options
	 * @namespace
	 */
	export namespace Opts {
		/**
		 * A wrapper for the targeted canvas element
		 * @interface
		 * @inner
		 * @member {HTMLCanvasElement} target=firstCanvOccurInDoc - Bound canvas
		 * @member {number[]} trans=0,0 - Translation
		 * @member {number[]} scl=1,1 - Scaling
		 * @member {number[]} rot=0,0 - Rotation
		 * @member {number[]} pin?=this.target.width/2,this.target.height/2 - Pseudo-center
		 * @member {number[]} transBound=-Infinity,-Infinity,Infinity,Infinity - Max translation boundaries
		 * @member {boolean} dragEnabled=false - Enable translation on drag
		 * @member {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (1 finger only shall move)
		 * @member {boolean} wheelEnabled=false - Enable scaling on mouse wheel
		 * @prop {boolean} keysEnabled=false - Enable keyabord events listener
		 * @member {boolean} panEnabled=false - Enable translation based on mouse/finger distance from pin (pseudo-center)
		 * @member {boolean} tiltEnabled=false - Enable translation on device movement
		 * @member {boolean} eventsReversed=false - Toggle reverse-operations
		 * @member {Opts.UseButton} useButton=Opts.UseButton.USELEFT - Respond to left-click, right or both
		 * @member {number} transSpeed=1 - Translation speed factor
		 * @member {number} sclSpeed=1 - Scaling speed factor
		 * @member {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
		 * @member {Set<CanvasButton>} wgets - Canvas widgets
		 */
		export declare interface ControllableCanvasOptions {
			target: HTMLCanvasElement;
			trans?: number[];
			scl?: number[];
			dragEnabled?: boolean;
			pinchEnabled?: boolean;
			wheelEnabled?: boolean;
			keysEnabled?: boolean;
			panEnabled?: boolean;
			tiltEnabled?: boolean;
			eventsReversed?: boolean;
			useButton?: number;
			scaleMode?: number;
			transBounds?: number[];
			sclBounds?: number[];
			transSpeed?: number;
			sclSpeed?: number;
			touchSensitivity?: number;
			clickSensitivity?: number;
			_adapts?: ControllableCanvasAdapters;
			wgets?: Set<CanvasButton>;
			[prop: string]: any;
		} //ControllableCanvasOptions
		/**
		 * M: mobile
		 * P: pc
		 * MP: both
		 * 
		 * drag:
		 *	P: mouse  hold & move
		 *	M: touch  hold & move
		 * pinch:
		 *	touch  2-finger & move
		 * wheel:
		 *	wheel  move  [pc pinch-equivalent]
		 * pan:
		 *	disposition from center causes constant translation
		 * tilt:
		 *	devicemotion  causes panning*
		 *	
		 * @interface
		 * @inner
		 */
		export declare interface ControllableCanvasAdapters {
			drag: Function | boolean;  //MP
			pinch?: Function | boolean;  //M
			wheel?: Function | boolean;  //P
			pan: Function | boolean;  //MP
			tilt?: Function | boolean;  //MP
			click: Function | boolean;  //MP
			[prop: string]: any;
		} //ControllableCanvasAdapters
		/**
		 * Options of ControllableCanvas.CanvasButton
		 * @interface
		 * @inner
		 * @member {number} x - x coordinate
		 * @member {number} y - y coordinate
		 * @member {number} dx - widget width
		 * @member {number} dy - widget height
		 * @member {number} index - widget event priority
		 */
		export declare interface CanvasButtonOptions {
			x: number;
			y: number;
			dx: number;
			dy: number;
			index?: number;
			parent: ControllableCanvas;
			enabled?: boolean;
			position?: number;
			[prop: string]: any;
		} //CanvasButtonOptions

		export enum UseButton {
			USELEFT = 1, USERIGHT, USEBOTH
		} //UseButton
		export enum ScaleMode {
			NORMAL = 1, FREESCALE
		} //ScaleMode
		export enum Position {
			FIXED = 1, ABSOLUTE, UNSCALABLE = 4
		} //Position
	} //Opts

	/**
	 * A holder for all errors
	 * @namespace
	 */
	export namespace Errors {
		export const ENOTCANV: TypeError = new TypeError("Not an HTMLCanvasElement.");
		export const ENOTCTX: TypeError = new TypeError("Not a CanvasRenderingContext2D.");
		export const ENOTNUMARR2: TypeError = new TypeError("Not an Array of 2-at-least Numbers.");
		export const ENOTNUM: TypeError = new TypeError("Not a valid Number.");
		export const EISALR: ReferenceError = new ReferenceError("Object is already registered.");
	} //Errors

	/**
	 * Type of KeyBind
	 */
	export type Key = {
		key: string;
		callback: (event: KeyboardEvent, type: string) => boolean;
		id: number;
		type: string;
	};

	
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
	export class ControllableCanvas implements Opts.ControllableCanvasOptions {
		target: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
		trans: number[] = [0, 0];
		scl: number[] = [1, 1];
		pin: number[];  //OBS
		transBounds: number[] = [-Infinity, -Infinity, Infinity, Infinity];
		sclBounds: number[] = [0, 0, Infinity, Infinity];
		dragEnabled: boolean = false;
		pinchEnabled: boolean = false;
		wheelEnabled: boolean = false;
		keysEnabled: boolean = false;
		panEnabled: boolean = false;  //OBS
		tiltEnabled: boolean = false;  //OBS
		eventsReversed: boolean = false;
		useButton: number = Opts.UseButton.USELEFT;
		scaleMode: number = Opts.ScaleMode.NORMAL;
		transSpeed: number = 1;
		sclSpeed: number = 1;
		touchSensitivity: number = .5;
		clickSensitivity: number = 800;
		wgets: Set<CanvasButton>;
		keybinds: KeyBind;
		private _zoomChanged: boolean[] = [false, false];
		private _mobile: boolean = false;
		private _pressed: boolean = false;
		private _clktime: number = 0;
		_adapts: Opts.ControllableCanvasAdapters;
		private _coordinates: number[] = [ ];
		private _touches: number[][] = [ ];

		private static _linepix: number = 10;
		static CanvasButton: Class;
		/**
		 * Default options for ControllableCanvas
		 * @readonly
		 * @static
		 */
		static defaultOpts: Opts.ControllableCanvasOptions = {
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

		/**
		 * ControllableCanvas constructor
		 * @param {Opts.ControllableCanvasOptions} opts?=ControllableCanvas.defaultOpts - ControllableCanvas Options
		 * @constructor
		 */
		constructor(opts: Opts.ControllableCanvasOptions = ControllableCanvas.defaultOpts) {
			inherit(opts, ControllableCanvas.defaultOpts);
			
			if (!(opts.target instanceof HTMLCanvasElement)) {
				throw Errors.ENOTCANV;
			} else if ([opts.trans, opts.scl, opts.transBounds, opts.sclBounds].some(arr => !(arr instanceof Array || <any>arr instanceof Float32Array || <any>arr instanceof Float64Array) || arr.length < 2 || Array.from(arr).some((num: any) => isNaN(num) || num === ''))) {
				throw Errors.ENOTNUMARR2;
			}

			inherit(opts._adapts, ControllableCanvas.defaultOpts._adapts);  //POSSIBLE ERROR

			if (opts.pin === undefined) {
				opts.pin = [opts.target.width / 2, opts.target.height / 2];
			} else if (!(opts.pin instanceof Array || <any>opts.pin instanceof Float32Array || <any>opts.pin instanceof Float64Array) || opts.pin.length < 2 || Array.from(opts.pin).some((num: any) => isNaN(num) || num === '')) {
				throw Errors.ENOTNUMARR2;
			}
			
			this.target = opts.target;
			this.context = this.target.getContext("2d");
			this.keybinds = new KeyBind(this.target, opts.keysEnabled);
			
			this._adapts = <Opts.ControllableCanvasAdapters>{ };
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
			this.transBounds = Array.from(opts.transBounds).map(Number);  // x, y, X, Y
			this.sclBounds = Array.from(opts.sclBounds).map(Number);  // x, y, X, Y

			this.dragEnabled = !!opts.dragEnabled;
			this.pinchEnabled = !!opts.pinchEnabled;
			this.wheelEnabled = !!opts.wheelEnabled;
			this.panEnabled = !!opts.panEnabled;
			this.tiltEnabled = !!opts.tiltEnabled;
			this.eventsReversed = !!opts.eventsReversed;

			this._pressed = false;
			this._coordinates = [0, 0];
			this._touches = [ ];
			this._mobile = ControllableCanvas.isMobile;
			if (!ControllableCanvas._linepix) ControllableCanvas._linepix = ControllableCanvas.lineToPix;
			Object.defineProperty(this.target, "_cc_", {
				value: this,
				enumerable: false,
				writable: false,
				configurable: true
			});
		} //ctor

		get ratio(): number {
			return this.target.width / this.target.height;
		} //g-ratio  OBS
		get min(): number {
			return Math.min(this.target.width, this.target.height);
		} //g-min
		get max(): number {
			return Math.max(this.target.width, this.target.height);
		} //g-max  OBS


		/**
		 * Enable controls
		 * @method
		 */
		handle(): void {
			this._mobile ? this._mobileAdapt() : this._pcAdapt();
		} //handle
		/**
		 * Add (/create) a widget in the controller
		 * @param {ControllableCanvas.CanvasButton|Opts.CanvasButtonOptions} data - constructor options
		 * @return {ControllableCanvas.CanvasButton} the widget
		 */
		addWidget(data: CanvasButton | Opts.CanvasButtonOptions): CanvasButton {
			if (data instanceof CanvasButton && !this.wgets.has(data)) {
				data.parent = this;
				this.wgets.add(<CanvasButton>data);
			} else if (!(data instanceof CanvasButton)) {
				data = new ControllableCanvas.CanvasButton(<Opts.CanvasButtonOptions>data);
				data.parent = this;
				this.wgets.add(<CanvasButton>data);
			} else {
				throw Errors.EISALR;
			}
			return <CanvasButton>data;
		} //addWidget


		/**
		 * Re-apply internal transformations
		 * @method
		 * @returns {ControllableCanvas} this - For method chaining
		 */
		retransform(): ThisType<ControllableCanvas> {
			this.context.setTransform(1, 0, 0, 1, 0, 0);  //SKEW/ROTATE NOT IMPLEMENTED!!
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
		translate(x: number = 0, y: number = 0, abs: boolean = false): number[] {
			let by: number[] = [x, y].map(Number);
			if (this.eventsReversed) by = by.map((b: number): number => -b);
			return this.trans = this.trans.map((trn: number, idx: number): number => bound(Number(!abs ? (trn + by[idx]) : by[idx]), this.transBounds[idx], this.transBounds[idx + 2]));
		} //translate
		/**
		 * Intermediate scaling function for iconic scale before the real
		 * @method
		 * @param {number} x=1 - x scale
		 * @param {number} y=x - y scale
		 * @param {boolean} abs?=false - absolute scale or relative to current
		 * @returns {number[]} Returns current total scaling
		 */
		scale(x: number = 1, y: number = x, abs: boolean = false): number[] {
			let by: number[] = [x, y].map(Number);
			if (this.eventsReversed) by = by.map((b: number): number => -b);
			if (!abs) {
				let nscl: number[] = this.scl.map((scl: number, idx: number): number => scl * by[idx]);
				nscl = [nscl[0] - this.scl[0], nscl[1] - this.scl[1]];
				this._zoomChanged = [this.scl[0] !== block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), this.scl[1] !== block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
				return this.scl = [block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
			} else {
				this._zoomChanged = [this.scl[0] !== bound(this.scl[0], this.sclBounds[0], this.sclBounds[2]), this.scl[1] !== bound(this.scl[1], this.sclBounds[1], this.sclBounds[3])];
				return this.scl = this.scl.map((scl: number, idx: number): number => bound(scl * by[idx], this.sclBounds[idx], this.sclBounds[idx + 2]));
			}
		} //scale

		private _mobileAdapt(): void {
			if (!(this._adapts.drag || this._adapts.pinch) && this.dragEnabled) {
				this.target.addEventListener("touchstart", (e: TouchEvent): void => ControllableCanvas.dragMobileStart(e, this), { passive: false });
				this.target.addEventListener("touchmove", this._adapts.pinch = this._adapts.drag = (e: TouchEvent): void => ControllableCanvas.dragMobileMove(e, this), { passive: false });
				this.target.addEventListener("touchend", (e: TouchEvent): void => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
				this.target.addEventListener("touchcancel", (e: TouchEvent): void => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
			}
			if (!this._adapts.tilt && this.tiltEnabled) {
				//TODO
			}
		} //_mobileAdapt
		private _pcAdapt(): void {
			if (!(this._adapts.drag || this._adapts.click) && this.dragEnabled) {
				this.target.addEventListener("mousemove", this._adapts.drag = (e: MouseEvent): void => ControllableCanvas.dragPC(e, this));
				this.target.addEventListener("mousedown", (e?: MouseEvent): void => {
					this._clktime = Date.now();
					this._pressed = true;
				});
				this.target.addEventListener("mouseup", this._adapts.click = (e?: MouseEvent): void => ControllableCanvas.clickPC(e, this));
				//@ts-ignore
				this.target.addEventListener("mouseout", (e?: MouseEvent): void => this._adapts.click(e));
				if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT) this.target.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault(), { capture: true, passive: false });
			}
			if (!this._adapts.wheel && this.wheelEnabled) {
				this.target.addEventListener("wheel", this._adapts.wheel = (e: WheelEvent): void => ControllableCanvas.wheel(e, this));
			}
			if (!this._adapts.tilt && this.tiltEnabled) {
				//TODO
			}
		} //_pcAdapt

		private static clickPC(event: MouseEvent, cc: ControllableCanvas): void {
			if (Date.now() - cc._clktime <= cc.clickSensitivity) {
				let coords: number[] = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]],
					sorted = Array.from(cc.wgets.entries()).map((s: CanvasButton[]) => s[1]).sort((a: CanvasButton, b: CanvasButton) => b._id - a._id),
					ret: boolean = false;

				for (let butt of sorted) {
					butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
					if (ret) break;
				}
			}
			cc._clktime = 0;
			cc._pressed = false;
		} //clickPC

		private static dragPC(event: MouseEvent, cc: ControllableCanvas): void {
			event.preventDefault();

			let coords: number[] = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop],
				rel: number[] = [],
				ret: boolean = false;

			cc._coordinates = coords;

			if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
				return;
			}

			if (cc._pressed) {
				cc._clktime = 0;
				cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
			}

			for (let butt of cc.wgets) {
				butt.enabled && butt._isOn(rel = coords.map((c: number, idx: number) => (c - cc.trans[idx]) / cc.scl[idx])) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
				if (ret) break;
			}
		} //dragPC

		private static dragMobileMove(event: TouchEvent, cc: ControllableCanvas): void {
			function check(arr: number[], curr: number[]): boolean {
				if (arr.every((ar: number, idx: number) => Math.abs(ar - curr[idx]) >= cc.touchSensitivity)) {
					return true;
				}
				return false;
			} //check
			function arraynge(tlis: TouchList): number[][] {
				return [[tlis[0].clientX - cc.target.offsetLeft, tlis[0].clientY - cc.target.offsetTop], [tlis[1].clientX - cc.target.offsetLeft, tlis[1].clientY - cc.target.offsetTop]];
			} //arraynge
			function every(t: number[][], nt: number[][], all: boolean = false, once: boolean = false): boolean {
				let out = false;
				if (all && check(t[0], nt[0]) && check(t[1], nt[1])) {
					return true;
				} else if (all) {
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
			function inh(one: boolean = false): void {
				cc._touches[0] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
				if (!one) cc._touches[1] = [event.targetTouches[1].clientX - cc.target.offsetLeft, event.targetTouches[1].clientY - cc.target.offsetTop];
			} //inh

			event.preventDefault();

			let coords: number[] = [event.targetTouches[event.targetTouches.length - 1].clientX - cc.target.offsetLeft, event.targetTouches[event.targetTouches.length - 1].clientY - cc.target.offsetTop];

			if (cc.dragEnabled && cc._touches.length === 1) {
				let cp: number[] = Array.from(cc.trans),
					dis: number;
				cc.translate(...[coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map((v: number) => v * cc.transSpeed));
				dis = dist([cp[0], cc.trans[0]], [cp[1], cc.trans[1]]);
				if (dis > cc.touchSensitivity) cc._clktime = 0;
				inh(true);
			} else if (cc.pinchEnabled && cc._touches.length === 2 && event.targetTouches.length === 2 && every(arraynge(event.targetTouches), cc._touches, false, true)) {
				if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {
					let inidist: number[] = [Math.abs(cc._touches[event.targetTouches[0].identifier][0] - cc._touches[event.targetTouches[1].identifier][0]), Math.abs(cc._touches[event.targetTouches[0].identifier][1] - cc._touches[event.targetTouches[1].identifier][1])],
						dis: number[] = [Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX - 2 * cc.target.offsetLeft), Math.abs(event.targetTouches[0].clientY - event.targetTouches[1].clientY - 2 * cc.target.offsetTop)],
						itouches: number[] = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map((i: number, idx: number) => i / 2 - cc.trans[idx]),
						d: number[] = [dis[0] / inidist[0], dis[1] / inidist[1]].map((v: number) => v * cc.sclSpeed),
						ntouches: number[] = itouches.map((i: number, idx: number) => i * (1 - d[idx]));

					if (cc._zoomChanged[0]) cc.translate(ntouches[0]);
					if (cc._zoomChanged[1]) cc.translate(ntouches[1]);
					cc.scale(d[0], d[1]);
				} else {
					//@ts-ignore
					let inidist: number = dist([cc._touches[event.targetTouches[0].identifier][0], cc._touches[event.targetTouches[1].identifier][0]], [cc._touches[event.targetTouches[0].identifier][1], cc._touches[event.targetTouches[1].identifier][1]]),
						dis: number = dist([event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[1].clientX - cc.target.offsetLeft], [event.targetTouches[0].clientY - cc.target.offsetTop, event.targetTouches[1].clientY - cc.target.offsetTop]),
						itouches: number[] = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map((i: number, idx: number) => i / 2 - cc.trans[idx]),
						d: number = cc.sclSpeed * dis / inidist,
						ntouches: number[] = itouches.map((i: number) => i * (1 - d));

					cc.scale(d);
					if (cc._zoomChanged.every((zm: boolean): boolean => zm))  cc.translate(...ntouches);
				}
				inh();
			}

			cc._coordinates = coords;
		} //dragMobileMove
		private static dragMobileStart(event: TouchEvent, cc: ControllableCanvas, cust: boolean = false): void {
			event.preventDefault();

			if (!cust) {
				let coords: number[],
					sorted = Array.from(cc.wgets.entries()).map((s: CanvasButton[]) => s[1]).sort((a: CanvasButton, b: CanvasButton) => b._id - a._id),
					ret: boolean = false;

				Array.from(event.changedTouches).forEach((t: Touch) => cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop]);

				for (let touch of event.changedTouches) {
					coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];

					for (let butt of sorted) {
						butt.enabled && butt._isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
						if (ret) break;
					}
				}
			}

			if (cc._touches.length === 1) {
				cc._clktime = Date.now();
				cc._coordinates = cc._touches[cc._touches.length - 1];
			} else {
				cc._clktime = 0;
			}

			cc._pressed = true;
		} //dragMobileStart
		private static dragMobileEnd(event: TouchEvent, cc: ControllableCanvas): void {
			event.preventDefault();

			let coords: number[],
				sorted = Array.from(cc.wgets.entries()).map((s: CanvasButton[]) => s[1]).sort((a: CanvasButton, b: CanvasButton) => b._id - a._id),
				ret: boolean = false;

			for (let touch of event.changedTouches) {
				coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];

				for (let butt of sorted) {
					butt.enabled && butt._isOn(coords);
				}
			}

			if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
				for (let butt of sorted) {
					butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
					if (ret) break;
				}

				cc._clktime = 0;
			}

			Array.from(event.changedTouches).forEach((t: Touch) => {
				cc._touches.splice(t.identifier, 1);
			});

			if (Object.keys(cc._touches).length == 1) {
				ControllableCanvas.dragMobileStart(event, cc, true);
			}

			cc._pressed = !!cc._touches.length;
		} //dragMobileEnd

		private static wheel(event: WheelEvent, cc: ControllableCanvas): void {
			event.preventDefault();
			let d: number = 1 - cc.sclSpeed * ControllableCanvas.fixDelta(event.deltaMode, event.deltaY) / cc.min,
				coords: number[] = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]];
			cc.scale(d);
			if (cc._zoomChanged.every((zm: boolean): boolean => zm)) cc.translate(...coords.map((c: number) => c * (1 - d)));
		} //wheel
		
		
		private static get isMobile(): boolean {
			if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i)
				|| navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i)
				|| navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)
			) {
				return true;
			} else {
				return false;
			}
		} //isMobile
		
		private static get lineToPix(): number {
			let r: number,
				iframe: HTMLIFrameElement = document.createElement("iframe");
			iframe.src = '#';
			document.body.appendChild(iframe);
			let iwin: Window = iframe.contentWindow,
				idoc: Document = iwin.document;
			idoc.open();
			idoc.write('<!DOCTYPE html><html><head></head><body><p>a</p></body></html>');
			idoc.close();
			let span: HTMLElement = <HTMLElement>idoc.body.firstElementChild;
			r = span.offsetHeight;
			document.body.removeChild(iframe);
			return r;
		} //lineToPix
		
		private static fixDelta(mode: number, deltaY: number): number {
			if (mode === 1) {
				return ControllableCanvas._linepix * deltaY;
			} else if (mode === 2) {
				return window.innerHeight;
			} else {
				return deltaY;
			}
		} //fixDelta
	} //ControllableCanvas

	/**
	 * A class to control keyboard events
	 */
	export class KeyBind {
		press: Key[] = [ ];
		down: Key[] = [ ];
		up: Key[] = [ ];
		element: HTMLElement;
		_bound: boolean = false;
		arrowMoveSpeed: number;
		arrowMoveSpeedup: number;
		arrowMoveSpeedMax: number;
		arrowMoveSpeedupEnabled: boolean = true;
		arrowBindings: {
			[key: string]: number[];
		} = { };

		static _idcntr = 0;
		static arrowMoveSpeed: number = 5;
		static arrowMoveSpeedup: number = .5;
		static arrowMoveSpeedMax: number = 20;
		static arrowMoveSpeedupEnabled: boolean;
		static arrowBindings: {
			[key: string]: number[];
		} = {
				ArrowUp: [0, 1],
				ArrowDown: [0, -1],
				ArrowLeft: [1, 0],
				ArrowRight: [-1, 0]
			};

		constructor(element: HTMLElement, bind: boolean = false) {
			this.element = element;
			Object.assign(this.arrowBindings, KeyBind.arrowBindings);
			this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
			this.arrowMoveSpeedup = KeyBind.arrowMoveSpeedup;
			this.arrowMoveSpeedMax = KeyBind.arrowMoveSpeedMax;
			bind && this.bind();
		} //ctor
		
		static arrowMove(event: KeyboardEvent, type: string): boolean {
			if (type === "keydown") {
				event.target["_cc_"].translate(this.arrowMoveSpeed * this.arrowBindings[event.key][0], this.arrowMoveSpeed * this.arrowBindings[event.key][1]);
				if (this.arrowMoveSpeedupEnabled) this.arrowMoveSpeed = bound(this.arrowMoveSpeed + this.arrowMoveSpeedup, 0, this.arrowMoveSpeedMax);
			} else {
				this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
			}
			return false;
		} //arrowMove

		bindArrows(): void {
			for (let i in this.arrowBindings) {
				this.registerKeydown(i, KeyBind.arrowMove.bind(this));
				this.registerKeyup(i, KeyBind.arrowMove.bind(this));
			}
			this.bindArrows = (): void => { };
		} //bindArrows

		/**
		 * Bind key event listeners
		 * @method
		 * @returns {boolean}
		 */
		bind(): boolean {
			if (!this._bound) {
				this.element.addEventListener("keypress", (event: KeyboardEvent): boolean => this._handler.bind(this)("keypress", event), false);
				this.element.addEventListener("keyup", (event: KeyboardEvent): boolean => this._handler.bind(this)("keyup", event), false);
				this.element.addEventListener("keydown", (event: KeyboardEvent): boolean => this._handler.bind(this)("keydown", event), false);
				return this._bound = true;
			}
			return false;
		} //bind

		_handler(type: string, event: KeyboardEvent): boolean {
			let handled: boolean = false;
			this[type.replace("key", '')].forEach((key: Key): void => {
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
		registerKeypress(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key {
			let out: Key;
			this.press.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "press" });
			return out;
		} //registerKeypress
		/**
		 * @method
		 * @param {string} key
		 * @param {Function} callback - cb(event)
		 * @returns {Key}
		 */
		registerKeydown(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key {
			let out: Key;
			this.down.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "down" });
			return out;
		} //registerKeydown
		/**
		 * @method
		 * @param {string} key
		 * @param {Function} callback - cb(event)
		 * @returns {Key}
		 */
		registerKeyup(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key {
			let out: Key;
			this.up.push(out = { key: key, callback: callback, id: KeyBind._idcntr++, type: "up" });
			return out;
		} //registerKeyup
		/**
		 * @method
		 * @param {Key} key
		 */
		unregister(key: Key | number | string, repl: Key): Key | Key[] | boolean {
			if (typeof key === "number") {
				let idx: number;
				if ((idx = this.press.findIndex((k: Key): boolean => k.id === key)) >= 0) {
					return this.press.splice(idx, 1, repl);
				} else if ((idx = this.down.findIndex((k: Key): boolean => k.id === key)) >= 0) {
					return this.down.splice(idx, 1, repl);
				} else if ((idx = this.up.findIndex((k: Key): boolean => k.id === key)) >= 0) {
					return this.up.splice(idx, 1, repl);
				} else {
					return false;
				}
			} else if (typeof key === "string") {
				this.press = this.press.filter((k: Key): boolean => k.key !== key);
				this.down = this.down.filter((k: Key): boolean => k.key !== key);
				this.up = this.up.filter((k: Key): boolean => k.key !== key);
			} else {
				return this[key.type].splice(this[key.type].findIndex((k: Key): boolean => k.id === key.id), 1, repl);
			}
		} //unregister
	} //KeyBind

	/**
	 * A widget-making class for canvas
	 * @memberof ControllableCanvas
	 * @prop {number} x - x coordinate
	 * @prop {number} y - y coordinate
	 * @prop {number} dx - width
	 * @prop {number} dy - height
	 * @prop {number} index - equivalent to CSS z-index
	 */
	export class CanvasButton implements Opts.CanvasButtonOptions {
		x: number = 0;
		y: number = 0;
		dx: number = 0;
		dy: number = 0;
		index: number = -1;
		parent: ControllableCanvas;
		_id: number;
		enabled: boolean = true;
		pstate: boolean = false;
		position: number = 2;

		static sensitivity: number = .3;
		private static _idcntr: number = 0;
		/**
		 * Default options for CanvasButton
		 * @readonly
		 * @static
		 */
		static defaultOpts: Opts.CanvasButtonOptions = {
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

		constructor(opts: Opts.CanvasButtonOptions = CanvasButton.defaultOpts) {  //DOUBLECLICK, LONGCLICK, DRAG, ... USER-IMPLEMENTED(?)
			inherit(opts, CanvasButton.defaultOpts);

			if ([opts.x, opts.y, opts.dx, opts.dy, opts.position, opts.index].some((num: any) => isNaN(num) || num === '')) {
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
		blur(...any: any[]): boolean {
			return true;
		} //blur
		//@Override
		/**
		 * Checks if button was entered and decides whether to propagate
		 * @param any
		 */
		focus(...any: any[]): boolean {
			return false;
		} //focus
		//@Override
		/**
		 * Checks if button was clicked and decides whether to propagate
		 * @param any
		 */
		click(...any: any[]): boolean {
			return true;
		} //click

		/**
		 * Checks if pointer is above the widget
		 * @param {number[]} relativeCoords
		 * @method
		 */
		_isOn(relativeCoords: number[]): boolean {
			let x: number = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.x - this.parent.trans[0] : this.x,
				y: number = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? this.y - this.parent.trans[1] : this.y,
				dx: number = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dx * this.parent.scl[0] : this.dx,
				dy: number = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dy * this.parent.scl[1] : this.dy,
				out: boolean = isWithin([x, y, dx, dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);

			if (!out && this.pstate) {
				this.blur(relativeCoords);
				this.pstate = false;
			}

			return out;
		} //_isOn
	} //CanvasButton

	ControllableCanvas.CanvasButton = CanvasButton;

	/**
	 * A class offering mathematical Vector utilities
	 * @inner
	 * @class
	 * @prop {number[]} props - vector vertices
	 */
	export class Vector {
		props: number[];

		constructor(props: number[] = [ ]) {
			this.props = Array.from(props.map(Number));
		} //ctor

		/**
		 * Add a vector or number to current vector
		 * @method
		 * @param {Vector|number} targ - target
		 * @param {number} sub - Set to `-1` to substract instead
		 * @returns `this` for method chaining
		 */
		add(targ: Vector | number, sub: number = 1): ThisType<Vector> {
			if (targ instanceof Vector) {
				this.props.forEach((prop: number, idx: number) => {
					this.props[idx] += sub * targ[idx];
				});
			} else {
				this.props.forEach((prop: number, idx: number) => {
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
		mult(targ: Vector | number, div: number = 1): ThisType<Vector> {
			if (targ instanceof Vector) {
				this.props.forEach((prop: number, idx: number) => {
					this.props[idx] *= Math.pow(targ[idx], div);
				});
			} else {
				this.props.forEach((prop: number, idx: number) => {
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
		dot(targ: Vector): number {
			return this.props.reduce((acc: number, val: number, idx: number) => acc + val * targ[idx]);
		} //dot
	} //Vector

	/**
	 * @prop {HTMLElement[]} resources - All HTML resource elements with "load" listeners that will be loaded. like: audio/img
	 */
	export class ResourceLoader {
		resources: HTMLElement[] = [ ];
		_loadcntr: number = 0;

		constructor(resources: HTMLElement[], onload?: (res?: HTMLElement, load?: number) => void, autobind: boolean = false) {
			this.resources = Array.from(resources);
			this.load = onload || this.load;
			if (autobind) this.bind(this.load);
		} //ctor

		/**
		 * Bind load events and await loadend
		 * @param {Function} onload? - code to execute once loaded
		 */
		bind(onload: (res?: HTMLElement, load?: number) => void): void {
			if (onload) this.load = onload;
			this.resources.forEach((res: HTMLElement) => {
				res.addEventListener("load", (): void => {
					if (++this._loadcntr === this.resources.length) {
						this.load(res, this._loadcntr);
					}
				});
			});
		} //bind
		//@Override
		load(res?: HTMLElement, load?: number): void { } //load

		/**
		 * Load images by URLs
		 * @method
		 * @static
		 * @param {string[]} urlist - list of urls
		 * @param {Function} onload - callback
		 * @param {boolean} autobind=true - auto bind
		 * @returns {ResourceLoader} the loader
		 */
		static images(urlist: string[], onload?: (res?: HTMLElement, load?: number) => void, autobind: boolean = true): ResourceLoader {
			let imglist: HTMLImageElement[] = [ ];

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
		static audios(urlist: string[], onload?: (res?: HTMLElement, load?: number) => void, autobind: boolean = true): ResourceLoader {
			let audiolist: HTMLAudioElement[] = [ ];

			for (let url of urlist) {
				let audio = new Audio(url);
				audio.load();
				audiolist.push(audio);
			}

			return new ResourceLoader(audiolist, onload, autobind);
		} //audios
	} //ResourceLoader

} //CanvasControls

export default CanvasControls.ControllableCanvas;
