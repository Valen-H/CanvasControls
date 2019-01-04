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

	/**
	 * If `dest` lacks a property that `targ` has then that property is copied into `dest`
	 * @function
	 * @inner
	 * @param {object} dest - destination object
	 * @param {object} targ - base object
	 * @param {Function} condition - inheritance condition
	 * @returns {object} destination object
	 */
	function inherit(dest: {}, targ: {}, condition: Function = (dest: {}, targ: {}, prop: string): any => dest[prop] === undefined && (dest[prop] = targ[prop])): {} {
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
	function bound(n: number, m: number, M: number): number {
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
	function dist(Xs: number[], Ys: number[]): number {
		return Math.sqrt([Xs[1] - Xs[0], Ys[1] - Ys[0]].map((v: number) => Math.pow(v, 2)).reduce((acc: number, v: number) => acc + v));
	} //dist

	/**
	 * A holder for all Options
	 * @namespace
	 */
	export namespace Opts {

		/**
		 * A wrapper for the targeted canvas element
		 * @interface
		 * @inner
		 * @prop {HTMLCanvasElement} target=firstCanvOccurInDoc - Bound canvas
		 * @prop {number[]} trans=0,0 - Translation
		 * @prop {number[]} scl=1,1 - Scaling
		 * @prop {number[]} rot=0,0 - Rotation
		 * @prop {number[]} pin?=this.target.width/2,this.target.height/2 - Pseudo-center
		 * @prop {number[]} transBound=-Infinity,-Infinity,Infinity,Infinity - Max translation boundaries
		 * @prop {boolean} dragEnabled=false - Enable translation on drag
		 * @prop {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (1 finger only shall move)
		 * @prop {boolean} pinchSwipeEnabled=false - Enable rotation on 2-finger pinch (both fingers shall move)
		 * @prop {boolean} wheelEnabled=false - Enable scaling on mouse wheel
		 * @prop {boolean} panEnabled=false - Enable translation based on mouse/finger distance from pin (pseudo-center)
		 * @prop {boolean} tiltEnabled=false - Enable translation on device movement
		 * @prop {boolean} eventsReversed=false - Toggle reverse-operations
		 * @prop {Opts.UseButton} useButton=Opts.UseButton.USELEFT - Respond to left-click, right or both
		 * @prop {number} transSpeed=1 - Translation speed factor
		 * @prop {number} sclSpeed=1 - Scaling speed factor
		 * @prop {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
		 */
		export declare interface ControllableCanvasOptions {
			target: HTMLCanvasElement;
			trans: number[];
			scl: number[];
			rot: number;
			dragEnabled: boolean;
			pinchEnabled: boolean;
			pinchSwipeEnabled: boolean;
			wheelEnabled: boolean;
			panEnabled: boolean;
			tiltEnabled: boolean;
			eventsReversed: boolean;
			useButton: number;
			scaleMode: number;
			transBounds: number[];
			sclBounds: number[];
			transSpeed: number;
			sclSpeed: number;
			touchSensitivity: number;
			_adapts: ControllableCanvasAdapters;
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
		 *	touch  2-finger & 1-move
		 * pinchSwipe:
		 *	touch  2-finger & 2-move
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
			drag?: Function | boolean;  //MP
			pinch?: Function | boolean;  //M
			pinchSwipe?: Function | boolean;  //M
			wheel?: Function | boolean;  //P
			pan?: Function | boolean;  //MP
			tilt?: Function | boolean;  //MP
			[prop: string]: any;
		} //ControllableCanvasAdapters

		export enum UseButton {
			USELEFT = 1, USERIGHT, USEBOTH
		} //UseButton
		export enum ScaleMode {
			NORMAL = 1, FREESCALE, BYPASS = 4
		} //ScaleMode
	} //Opts

	/**
	 * A holder for all errors
	 * @namespace
	 */
	export namespace Errors {
		export const ENOTCANV: TypeError = new TypeError("Not an HTMLCanvasElement.");
		export const ENOTCTX: TypeError = new TypeError("Not a CanvasRenderingContext2D.");
		export const ENOTNUMARR2: TypeError = new TypeError("Not an Array of 2-at-least Numbers.");
	} //Errors

	
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
	 */
	export class ControllableCanvas implements Opts.ControllableCanvasOptions {
		target: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
		trans: number[] = [0, 0];
		scl: number[] = [1, 1];
		rot: number = 0;
		pin: number[];
		transBounds: number[] = [-Infinity, -Infinity, Infinity, Infinity];
		sclBounds: number[] = [0, 0, Infinity, Infinity];
		dragEnabled: boolean = false;
		pinchEnabled: boolean = false;
		pinchSwipeEnabled: boolean = false;
		wheelEnabled: boolean = false;
		panEnabled: boolean = false;
		tiltEnabled: boolean = false;
		eventsReversed: boolean = false;
		useButton: number = Opts.UseButton.USELEFT;
		scaleMode: number = Opts.ScaleMode.NORMAL; /** @todo mask: freescale-axis,rotation-as-scaling */
		transSpeed: number = 1;
		sclSpeed: number = 1;
		touchSensitivity: number = .5;
		private _handled: boolean = false;
		private _mobile: boolean = false;
		private _pressed: boolean = false;
		_adapts: Opts.ControllableCanvasAdapters;
		private _coordinates: number[] = [ ];
		private _touches: number[][] = [ ];

		private static _linepix: number = 10;
		/**
		 * Default options for ControllableCanvas
		 * @readonly
		 * @static
		 */
		static defaultOpts: Opts.ControllableCanvasOptions = {
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
			touchSensitivity: .5,
			sclBounds: [0, 0, Infinity, Infinity],
			transBounds: [-Infinity, -Infinity, Infinity, Infinity],
			_adapts: {
				drag: false,
				pinch: false,
				pinchSwipe: false,
				wheel: false,
				pan: false,
				tilt: false
			}
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

			this._adapts = <Opts.ControllableCanvasAdapters>{ };
			inherit(this._adapts, opts._adapts);

			this.rot = opts.rot * 1;
			this.transSpeed = opts.transSpeed * 1;
			this.sclSpeed = opts.sclSpeed * 1;
			this.touchSensitivity = opts.touchSensitivity * 1;
			this.useButton = opts.useButton | 0;
			this.scaleMode = opts.scaleMode | 0;

			this.trans = Array.from(opts.trans).map(Number);
			this.scl = Array.from(opts.scl).map(Number);
			this.pin = Array.from(opts.pin).map(Number);
			this.transBounds = Array.from(opts.transBounds).map(Number);  // x, y, X, Y
			this.sclBounds = Array.from(opts.sclBounds).map(Number);  // x, y, X, Y

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
			this._touches = [ ];
			this._mobile = ControllableCanvas.isMobile;
			if (!ControllableCanvas._linepix) ControllableCanvas._linepix = ControllableCanvas.lineToPix;
		} //ctor

		get ratio(): number {
			return this.target.width / this.target.height;
		} //g-ratio

		get min(): number {
			return Math.min(this.target.width, this.target.height);
		} //g-min
		get max(): number {
			return Math.max(this.target.width, this.target.height);
		} //g-max


		/**
		 * Enable controls, call only once
		 * @param {boolean} force?=false - Force handle
		 * @returns {boolean} bound? - whether bind suceeded or it was already bound earlier
		 */
		handle(force: boolean = false): boolean {
			if (!this._handled || force) {
				this._mobile ? this._mobileAdapt() : this._pcAdapt();
				return this._handled = true;
			}
			return false;
		} //handle


		/**
		 * Re-apply internal transformations
		 * @returns {ControllableCanvas} this - For method chaining
		 */
		retransform(): ThisType<ControllableCanvas> {
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			this.context.translate(this.trans[0], this.trans[1]);
			this.context.scale(this.scl[0], this.scl[1]);
			this.context.rotate(this.rot);
			return this;
		} //retransform

		/**
		 * Intermediate translation function for iconic translate before the real
		 * @param {number} x=0 - x translation
		 * @param {number} y=0 - y translation
		 * @param {boolean} abs?=false - abslute translation or relative to current
		 * @returns {number[]} trans - Returns current total translation
		 */
		translate(x: number = 0, y: number = 0, abs: boolean = false): number[] {
			let by: number[] = [x, y].map(Number);
			return this.trans = this.trans.map((trn: number, idx: number) => bound(Number(!abs ? (trn + by[idx]) : by[idx]), this.transBounds[idx], this.transBounds[idx + 2]));
		} //translate
		/**
		 * Intermediate scaling function for iconic scale before the real
		 * @param {number} x=1 - x scale
		 * @param {number} y=x - y scale
		 * @param {boolean} abs?=false - abslute scale or relative to current
		 * @returns {number[]} scl - Returns current total scaling
		 */
		scale(x: number = 1, y: number = x, abs: boolean = false): number[] {
			let by: number[] = [x, y].map(Number);
			return this.scl = this.scl.map((scl: number, idx: number) => bound(Number(!abs ? (scl * by[idx]) : by[idx]), this.sclBounds[idx], this.sclBounds[idx + 2]));
		} //scale


		private _mobileAdapt(): void {
			if (!this._adapts.drag && this.dragEnabled) {
				this.target.addEventListener("touchstart", (e: TouchEvent) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
				this.target.addEventListener("touchmove", this._adapts.pinchSwipe = this._adapts.pinch = this._adapts.drag = (e: TouchEvent) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
				this.target.addEventListener("touchend", (e: TouchEvent) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
				this.target.addEventListener("touchcancel", (e: TouchEvent) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
			}
			if (!this._adapts.tilt) {

			}
		} //_mobileAdapt
		private _pcAdapt(): void {
			if (!this._adapts.drag && this.dragEnabled) {
				this.target.addEventListener("mousemove", this._adapts.drag = (e: MouseEvent) => ControllableCanvas.dragPC(e, this));
				this.target.addEventListener("mousedown", (e?: MouseEvent) => this._pressed = true);
				this.target.addEventListener("mouseup", (e?: MouseEvent) => this._pressed = false);
				if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT) this.target.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault(), { capture: true, passive: false });
			}
			if (!this._adapts.wheel && this.wheelEnabled) {
				this.target.addEventListener("wheel", this._adapts.wheel = (e: WheelEvent) => ControllableCanvas.wheel(e, this));
			}
			if (!this._adapts.tilt) {

			}
		} //_pcAdapt

		static dragPC(event: MouseEvent, cc: ControllableCanvas): void {
			if (((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2))) || ((cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
				return;
			}

			event.preventDefault();

			let coords: number[] = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop];

			if (cc._pressed) {
				cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
			}

			cc._coordinates = coords;
		} //dragPC

		static dragMobileMove(event: TouchEvent, cc: ControllableCanvas): void {
			function check(arr: number[], curr: number[]): boolean {
				if (arr.every((ar: number, idx: number) => Math.abs(ar - curr[idx]) >= cc.touchSensitivity)) {
					return true;
				}
				return false;
			} //check
			function arraynge(tlis: TouchList): number[][] {
				return [[tlis[0].clientX, tlis[0].clientY], [tlis[1].clientX, tlis[1].clientY]];
			} //arraynge
			function every(t: number[][], nt: number[][], all: boolean = false): boolean {
				let out = false;
				if (all && check(t[0], nt[0]) && check(t[1], nt[1])) {
					return true;
				} else if (all) {
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
			function inh(one: boolean = false): void {
				cc._touches[0] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
				if (!one) cc._touches[1] = [event.targetTouches[1].clientX - cc.target.offsetLeft, event.targetTouches[1].clientY - cc.target.offsetTop];
			} //inh

			event.preventDefault();

			let coords: number[] = [event.targetTouches[event.targetTouches.length - 1].clientX - cc.target.offsetLeft, event.targetTouches[event.targetTouches.length - 1].clientY - cc.target.offsetTop];

			if (cc._touches.length === 1) {
				cc.translate(...[coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map((v: number) => v * cc.transSpeed));
				inh(true);
			} else if (cc._touches.length === 2 && event.targetTouches.length === 2) {
				if (cc.pinchEnabled && (cc.scaleMode & Opts.ScaleMode.BYPASS) === Opts.ScaleMode.BYPASS) {
					console.info("scaling bypass");  //SPECIAL CENTER*
				} else if (cc.pinchSwipeEnabled && every(arraynge(event.targetTouches), cc._touches)) {
					console.info("rotation");
				} else if (cc.pinchEnabled && every(arraynge(event.targetTouches), cc._touches, true)) {  //NEEDED FOR PRECISION!
					console.info("scaling");
					if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {

					} else {
						//@ts-ignore
						let inidist: number = dist([cc._touches[event.changedTouches[0].identifier][0], cc._touches[event.changedTouches[1].identifier][0]], [cc._touches[event.changedTouches[0].identifier][1], cc._touches[event.changedTouches[1].identifier][1]]),
							dis: number = dist([event.changedTouches[0].clientX - cc.target.offsetLeft, event.changedTouches[1].clientX - cc.target.offsetLeft], [event.changedTouches[0].clientY - cc.target.offsetTop, event.changedTouches[1].clientY - cc.target.offsetTop]),
							itouches: number[] = [cc._touches[0][0] + cc._touches[1][0], cc._touches[0][1] + cc._touches[1][1]].map((i: number, idx: number) => i / 2 - cc.trans[idx]),
							d: number = dis / inidist,
							ntouches: number[] = itouches.map((i: number) => i * (1 - d));

						cc.translate(...ntouches);
						cc.scale(d);
					}
				}
				inh();
			}

			cc._coordinates = coords;
		} //dragMobileMove
		static dragMobileStart(event: TouchEvent, cc: ControllableCanvas, cust: boolean = false): void {
			event.preventDefault();
			if (!cust) {
				Array.from(event.changedTouches).forEach((t: Touch) => cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop]);
			}
			cc._coordinates = cc._touches[cc._touches.length - 1];
		} //dragMobileStart
		static dragMobileEnd(event: TouchEvent, cc: ControllableCanvas): void {
			event.preventDefault();
			Array.from(event.changedTouches).forEach((t: Touch) => {
				cc._touches.splice(t.identifier, 1);
			});
			if (Object.keys(cc._touches).length == 1) {
				ControllableCanvas.dragMobileStart(event, cc, true);
			}
		} //dragMobileEnd

		static wheel(event: WheelEvent, cc: ControllableCanvas): void {
			event.preventDefault();
			let d: number = 1 - cc.sclSpeed * ControllableCanvas.fixDelta(event.deltaMode, event.deltaY) / cc.min,
				coords: number[] = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]];
			cc.translate(...coords.map((c: number) => c * (1 - d)));
			cc.scale(d);
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
		} //detectMobile

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

} //CanvasControls

export default CanvasControls.ControllableCanvas;
