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
export declare module CanvasControls {
    /**
     * A holder for all Options
     * @namespace
     */
    namespace Opts {
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
        interface ControllableCanvasOptions {
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
        }
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
        interface ControllableCanvasAdapters {
            drag?: Function | boolean;
            pinch?: Function | boolean;
            pinchSwipe?: Function | boolean;
            wheel?: Function | boolean;
            pan?: Function | boolean;
            tilt?: Function | boolean;
            [prop: string]: any;
        }
        enum UseButton {
            USELEFT = 1,
            USERIGHT = 2,
            USEBOTH = 3
        }
        enum ScaleMode {
            NORMAL = 1,
            FREESCALE = 2,
            BYPASS = 4
        }
    }
    /**
     * A holder for all errors
     * @namespace
     */
    namespace Errors {
        const ENOTCANV: TypeError;
        const ENOTCTX: TypeError;
        const ENOTNUMARR2: TypeError;
    }
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
    class ControllableCanvas implements Opts.ControllableCanvasOptions {
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
        useButton: number;
        scaleMode: number; /** @todo mask: freescale-axis,rotation-as-scaling */
        transSpeed: number;
        sclSpeed: number;
        touchSensitivity: number;
        private _handled;
        private _mobile;
        private _pressed;
        _adapts: Opts.ControllableCanvasAdapters;
        private _coordinates;
        private _touches;
        private static _linepix;
        /**
         * Default options for ControllableCanvas
         * @readonly
         * @static
         */
        static defaultOpts: Opts.ControllableCanvasOptions;
        /**
         * ControllableCanvas constructor
         * @param {Opts.ControllableCanvasOptions} opts?=ControllableCanvas.defaultOpts - ControllableCanvas Options
         * @constructor
         */
        constructor(opts?: Opts.ControllableCanvasOptions);
        readonly ratio: number;
        readonly min: number;
        readonly max: number;
        /**
         * Enable controls, call only once
         * @param {boolean} force?=false - Force handle
         * @returns {boolean} bound? - whether bind suceeded or it was already bound earlier
         */
        handle(force?: boolean): boolean;
        /**
         * Re-apply internal transformations
         * @returns {ControllableCanvas} this - For method chaining
         */
        retransform(): ThisType<ControllableCanvas>;
        /**
         * Intermediate translation function for iconic translate before the real
         * @param {number} x=0 - x translation
         * @param {number} y=0 - y translation
         * @param {boolean} abs?=false - abslute translation or relative to current
         * @returns {number[]} trans - Returns current total translation
         */
        translate(x?: number, y?: number, abs?: boolean): number[];
        /**
         * Intermediate scaling function for iconic scale before the real
         * @param {number} x=1 - x scale
         * @param {number} y=x - y scale
         * @param {boolean} abs?=false - abslute scale or relative to current
         * @returns {number[]} scl - Returns current total scaling
         */
        scale(x?: number, y?: number, abs?: boolean): number[];
        private _mobileAdapt;
        private _pcAdapt;
        static dragPC(event: MouseEvent, cc: ControllableCanvas): void;
        static dragMobileMove(event: TouchEvent, cc: ControllableCanvas): void;
        static dragMobileStart(event: TouchEvent, cc: ControllableCanvas, cust?: boolean): void;
        static dragMobileEnd(event: TouchEvent, cc: ControllableCanvas): void;
        static wheel(event: WheelEvent, cc: ControllableCanvas): void;
        private static readonly isMobile;
        private static readonly lineToPix;
        private static fixDelta;
    }
}
declare const _default: typeof CanvasControls.ControllableCanvas;
export default _default;
