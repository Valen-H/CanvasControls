import "@babel/polyfill";

/**
 * @file CanvasControls.ts
 * @copyright Valen. H. 2k18
 * @author Valen.H. <alternativexxxy@gmail.com>
 */


/**
 * The root of the main library
 * @module CanvasControls
 */
export module CanvasControls {

	/**
	 * If `dest` lacks a property that `targ` has then that property is copied into `dest`.
	*/
	function inherit(dest: {}, targ: {}, condition: Function = (dest: {}, targ: {}, prop: string): any => dest[prop] === undefined && (dest[prop] = targ[prop])): {} {
		for (let i in targ) {
			condition(dest, targ, i);
		}

		return dest;
	} //inherit

	/**
	 * Restrict number's range
	 */
	function bound(n: number, m: number, M: number): number {
		return n > M ? M : (n < m ? m : n);
	} //bound


	/**
	 * A namespace that holds all options and interfaces of the module
	 */
	export declare namespace Opts {
		export interface ControllableCanvasOptions {
			target: HTMLCanvasElement;
			trans: number[];
			scale: number[];
			rot: number[];
			pin: number[];
			dragEnabled: boolean;
			pinchEnabled: boolean;
			pinchSwipeEnabled: boolean;
			wheelEnabled: boolean;
			panEnabled: boolean;
			tiltEnabled: boolean;
			eventsReversed: boolean;
			blockRight: boolean;
			transBounds: number[];
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
		 */
		export interface ControllableCanvasAdapters {
			drag?: Function;  //MP
			pinch?: Function;  //M
			pinchSwipe?: Function;  //M
			wheel?: Function;  //P
			pan?: Function  //MP
			tilt?: Function  //MP
			[prop: string]: any;
		}
	} //Opts

	/**
	 * A holder for all errors
	 */
	export namespace Errors {
		export const ENOTCANV: Error = new TypeError("Not an HTMLCanvasElement.");
		export const ENOTCTX: Error = new TypeError("Not a CanvasRenderingContext2D.");
		export const ENOTNUMARR2: Error = new TypeError("Not an Array of 2-at-least Numbers.");
	} //Errors

	
	/**
	 * A wrapper for the targeted <canvas> element
	 */
	export class ControllableCanvas implements Opts.ControllableCanvasOptions {
		target: HTMLCanvasElement;
		context: CanvasRenderingContext2D;
		trans: number[];
		scale: number[];
		rot: number[];
		pin: number[];
		transBounds: number[];
		dragEnabled: boolean;
		pinchEnabled: boolean;
		pinchSwipeEnabled: boolean;
		wheelEnabled: boolean;
		panEnabled: boolean;
		tiltEnabled: boolean;
		eventsReversed: boolean;
		blockRight: boolean;
		private _handled: boolean;
		private _mobile: boolean;
		private _pressed: boolean;
		private _adapts: Opts.ControllableCanvasAdapters;
		_coordinates: number[];

		private static _linepix: number;
		static defaultOpts: Opts.ControllableCanvasOptions = {
			target: document.getElementsByTagName("canvas")[0],
			trans: [0, 0],
			scale: [1, 1],
			rot: [0, 0],
			pin: [window.innerWidth / 2, window.innerHeight / 2],
			dragEnabled: false,
			pinchEnabled: false,
			pinchSwipeEnabled: false,
			wheelEnabled: false,
			panEnabled: false,
			tiltEnabled: false,
			eventsReversed: false,
			blockRight: true,
			transBounds: [-Infinity, Infinity, -Infinity, Infinity]
		};

		constructor(opts: Opts.ControllableCanvasOptions = ControllableCanvas.defaultOpts) {
			inherit(opts, ControllableCanvas.defaultOpts);
			
			if (!(opts.target instanceof HTMLCanvasElement)) {
				throw Errors.ENOTCANV;
			} else if ([opts.trans, opts.scale, opts.rot, opts.pin, opts.transBounds].some(arr => !(arr instanceof Array || <any>arr instanceof Float32Array || <any>arr instanceof Float64Array) || arr.length < 2 || Array.from(arr).some((num: any) => isNaN(num) || num === ''))) {
				throw Errors.ENOTNUMARR2;
			}
			
			this.target = opts.target;
			this.context = this.target.getContext("2d");

			this.trans = Array.from(opts.trans).map(Number);
			this.scale = Array.from(opts.scale).map(Number);
			this.rot = Array.from(opts.rot).map(Number);
			this.pin = Array.from(opts.pin).map(Number);
			this.transBounds = Array.from(opts.pin).map(Number);  // x, X, y, Y

			this.dragEnabled = !!opts.dragEnabled;
			this.pinchEnabled = !!opts.pinchEnabled;
			this.pinchSwipeEnabled = !!opts.pinchSwipeEnabled;
			this.wheelEnabled = !!opts.wheelEnabled;
			this.panEnabled = !!opts.panEnabled;
			this.tiltEnabled = !!opts.tiltEnabled;
			this.eventsReversed = !!opts.eventsReversed;
			this.blockRight = !!opts.blockRight;

			this._handled = false;
			this._adapts = { };
			this._mobile = ControllableCanvas.isMobile;
			this._pressed = false;
			this._coordinates = [0, 0];
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

		handle(): boolean {
			if (!this._handled) {
				this._mobile ? this._mobileAdapt() : this._pcAdapt();
				return this._handled = true;
			}
			return false;
		} //handle


		retransform(): ThisType<ControllableCanvas> {
			this.context.setTransform(1, 0, 0, 1, 0, 0);
			//@ts-ignore
			this.context.translate(...this.trans);
			//@ts-ignore
			this.context.scale(...this.scale);
			//@ts-ignore
			this.context.rotate(...this.rot);
			return this;
		} //retransform

		translate(...by: number[]): number[] {
			return this.trans = this.trans.map((trn: number, idx: number) => bound(Number(trn + by[idx]), this.transBounds[idx], this.transBounds[idx + 2]));
		} //translate


		private _mobileAdapt(): void {
			if (!this._adapts.drag) {
				this.target.addEventListener("touchstart", (e: TouchEvent) => ControllableCanvas.dragMobileStart(e, this), { passive: false });
				this.target.addEventListener("touchmove", (e: TouchEvent) => ControllableCanvas.dragMobileMove(e, this), { passive: false });
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
			if (!this._adapts.drag) {
				this.target.addEventListener("mousemove", (e: MouseEvent) => ControllableCanvas.dragPC(e, this));
				this.target.addEventListener("mousedown", (e?: MouseEvent) => this._pressed = true);
				this.target.addEventListener("mouseup", (e?: MouseEvent) => this._pressed = false);
				if (this.blockRight) this.target.addEventListener("contextmenu", (e: MouseEvent) => e.preventDefault(), { capture: true, passive: false });
			}
			if (!this._adapts.wheel) {
				this.target.addEventListener("wheel", (e: WheelEvent) => ControllableCanvas.wheel(e, this));
			}
			if (!this._adapts.tilt) {

			}
		} //_pcAdapt

		static dragPC(event: MouseEvent, cc: ControllableCanvas): void {
			if ((("buttons" in event) && (event.buttons & 2) === 2) || (("which" in event) && event.which === 3) || (("button" in event) && event.button === 2)) {
				return;
			}

			event.preventDefault();

			let coords: number[] = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop];

			if (cc._pressed) {
				cc.translate(event.movementX * (1 / cc.scale[0]), event.movementY * (1 / cc.scale[1]));
			}

			cc._coordinates = coords;
		} //dragPC

		static dragMobileMove(event: TouchEvent, cc: ControllableCanvas): void {
			event.preventDefault();

			let coords: number[] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];

			if (event.targetTouches.length === 1) {
				cc.translate((coords[0] - cc._coordinates[0]) * (1 / cc.scale[0]), (coords[1] - cc._coordinates[1]) * (1 / cc.scale[1]));
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
			let d = ControllableCanvas.fixDelta(event.deltaMode, event.deltaY);
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
