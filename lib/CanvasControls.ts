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
	 */
	function bound(n: number, m: number, M: number): number {
		return n > M ? M : (n < m ? m : n);
	} //bound


	/**
	 * A namespace that holds all options and interfaces of the module
	 * @namespace
	 * @inner
	 */
	export declare namespace Opts {

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
		 * @prop {boolean} useRight=false - Use right click as main
		 * @prop {number} transSpeed=1 - Translation speed factor
		 * @prop {number} sclSpeed=1 - Scaling speed factor
		 * @prop {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
		 */
		export interface ControllableCanvasOptions {
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
			useRight: boolean;
			transBounds: number[];
			sclBounds: number[];
			transSpeed: number;
			sclSpeed: number;
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
		export interface ControllableCanvasAdapters {
			drag?: Function | boolean;  //MP
			pinch?: Function | boolean;  //M
			pinchSwipe?: Function | boolean;  //M
			wheel?: Function | boolean;  //P
			pan?: Function | boolean;  //MP
			tilt?: Function | boolean;  //MP
			[prop: string]: any;
		}
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
	 * @prop {boolean} pinchEnabled=false - Enable scaling on 2-finger pinch (1 finger only shall move)
	 * @prop {boolean} pinchSwipeEnabled=false - Enable rotation on 2-finger pinch (both fingers shall move)
	 * @prop {boolean} wheelEnabled=false - Enable scaling on mouse wheel
	 * @prop {boolean} panEnabled=false - Enable translation based on mouse/finger distance from pin (pseudo-center)
	 * @prop {boolean} tiltEnabled=false - Enable translation on device movement
	 * @prop {boolean} eventsReversed=false - Toggle reverse-operations
	 * @prop {boolean} useRight=false - Use right click as main
	 * @prop {number[]} _coordinates - Current event coordinates
	 * @prop {number} transSpeed=1 - Translation speed factor
	 * @prop {number} sclSpeed=1 - Scaling speed factor
	 * @prop {Opts.ControllableCanvasAdapters} _adapts - Map of all currently attached control event adapters
	 */
	export class ControllableCanvas implements Opts.ControllableCanvasOptions {
		target: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
		trans: number[];
		scl: number[];
		rot: number;
		pin: number[];
		transBounds: number[];
		sclBounds: number[];
		dragEnabled: boolean;
		pinchEnabled: boolean;
		pinchSwipeEnabled: boolean;
		wheelEnabled: boolean;
		panEnabled: boolean;
		tiltEnabled: boolean;
		eventsReversed: boolean;
		useRight: boolean;  /** @todo Symbol: useboth,useleft,useright */
		transSpeed: number;
		sclSpeed: number;
		private _handled: boolean;
		private _mobile: boolean;
		private _pressed: boolean;
		_adapts: Opts.ControllableCanvasAdapters;
		_coordinates: number[];

		private static _linepix: number;
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
			useRight: false,
			transSpeed: 1,
			sclSpeed: 1,
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

			inherit(opts._adapts, ControllableCanvas.defaultOpts._adapts);

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
			this.useRight = !!opts.useRight;

			this._handled = false;
			this._mobile = ControllableCanvas.isMobile;
			this._pressed = false;
			this._coordinates = [0, 0];
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
			let by: number[] = [x, y];
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
			let by: number[] = [x, y];
			return this.scl = this.scl.map((scl: number, idx: number) => bound(Number(!abs ? (scl * by[idx]) : by[idx]), this.sclBounds[idx], this.sclBounds[idx + 2]));
		} //scale


		private _mobileAdapt(): void {
			if (!this._adapts.drag && this.dragEnabled) {
				this.target.addEventListener("touchstart", (e: TouchEvent) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
				this.target.addEventListener("touchmove", this._adapts.drag = (e: TouchEvent) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
				this.target.addEventListener("touchend", (e: TouchEvent) => ControllableCanvas.dragMobileEnd(e, this), { passive: false });
			}
			if (!this._adapts.pinch) {

			}
			if (!this._adapts.pinchSwipe) {

			}
			if (!this._adapts.tilt) {

			}
		} //_mobileAdapt
		private _pcAdapt(): void {
			if (!this._adapts.drag && this.dragEnabled) {
				this.target.addEventListener("mousemove", this._adapts.drag = (e: MouseEvent) => ControllableCanvas.dragPC(e, this));
				this.target.addEventListener("mousedown", (e?: MouseEvent) => this._pressed = true);
				this.target.addEventListener("mouseup", (e?: MouseEvent) => this._pressed = false);
				if (this.useRight) this.target.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault(), { capture: true, passive: false });
			}
			if (!this._adapts.wheel && this.wheelEnabled) {
				this.target.addEventListener("wheel", this._adapts.wheel = (e: WheelEvent) => ControllableCanvas.wheel(e, this));
			}
			if (!this._adapts.tilt) {

			}
		} //_pcAdapt

		static dragPC(event: MouseEvent, cc: ControllableCanvas): void {
			if ((!cc.useRight && (("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2)) || (cc.useRight && (("buttons" in event) && (event.buttons & 2) !== 2) && (("which" in event) && event.which !== 3) && (("button" in event) && event.button !== 2))) {
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
			event.preventDefault();

			let coords: number[] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];

			if (event.targetTouches.length === 1) {
				cc.translate(coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]);
			}

			cc._coordinates = coords;
		} //dragMobileMove
		static dragMobileStart(event: TouchEvent, cc: ControllableCanvas): void {
			event.preventDefault();
			cc._coordinates = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
		} //dragMobileStart
		static dragMobileEnd(event: TouchEvent, cc: ControllableCanvas): void {
			event.preventDefault();
			if (event.targetTouches.length == 1) {
				ControllableCanvas.dragMobileStart(event, cc);
			}
		} //dragMobileEnd

		static wheel(event: WheelEvent, cc: ControllableCanvas): void {
			let d: number = 1 - cc.sclSpeed * ControllableCanvas.fixDelta(event.deltaMode, event.deltaY) / cc.max,
				coords: number[] = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]],
				ncoord: number[] = coords.map((c: number, idx: number) => c * (1 - d));
			cc.translate(...ncoord);
			cc.scale(d, d);
			console.log(ncoord, coords);
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
