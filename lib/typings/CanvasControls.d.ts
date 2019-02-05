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
    type Class = {
        new (...args: any[]): any;
    };
    /**
     * If `dest` lacks a property that `targ` has then that property is copied into `dest`
     * @function
     * @inner
     * @param {object} dest - destination object
     * @param {object} targ - base object
     * @param {Function} condition - inheritance condition
     * @returns {object} destination object
     */
    function inherit(dest: {}, targ: {}, condition?: Function): {};
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
    function bound(n: number, m: number, M: number, p?: number): number;
    /**
     * Downspeed incrementation
     * @param {number} n - number
     * @param {number} m - minimum
     * @param {number} M - Maximum
     * @param {number} op - operation
     * @returns {number} n
     */
    function block(n: number, m: number, M: number, op: number): number;
    /**
     * Calculate distance between 2 points
     * @param {number[]} Xs - X coordinates
     * @param {number[]} Ys - Y coordinates
     * @returns {number} distance
     * @function
     * @inner
     */
    function dist(Xs: number[], Ys: number[]): number;
    /**
     * Checks if pointer is inside an area
     * @param {number[]} box - x,y,dx,dy
     * @param {number[]} point - x,y
     * @param {number} sensitivity - extra boundary
     * @returns boolean
     * @inner
     * @function
     */
    function isWithin(box: number[], point: number[], sensitivity?: number): boolean;
    /**
     * A holder for all Options
     * @namespace
     */
    namespace Opts {
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
         * @prop {boolean} dynamicTransBounds=true - transBounds depend on scaling
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
        interface ControllableCanvasOptions {
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
            dynamicTransBounds?: boolean;
            sclSpeed?: number;
            touchSensitivity?: number;
            clickSensitivity?: number;
            _adapts?: ControllableCanvasAdapters;
            wgets?: Set<CanvasButton>;
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
        interface ControllableCanvasAdapters {
            drag: Function | boolean;
            pinch?: Function | boolean;
            wheel?: Function | boolean;
            pan: Function | boolean;
            tilt?: Function | boolean;
            click: Function | boolean;
            [prop: string]: any;
        }
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
        interface CanvasButtonOptions {
            x: number;
            y: number;
            dx: number;
            dy: number;
            index?: number;
            parent: ControllableCanvas;
            enabled?: boolean;
            position?: number;
            [prop: string]: any;
        }
        enum UseButton {
            USELEFT = 1,
            USERIGHT = 2,
            USEBOTH = 3,
            USEWHEEL = 4,
            USEALL = 7
        }
        enum ScaleMode {
            NORMAL = 1,
            FREESCALE = 2
        }
        enum Position {
            FIXED = 1,
            ABSOLUTE = 2,
            UNSCALABLE = 4
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
        const ENOTNUM: TypeError;
        const EISALR: ReferenceError;
    }
    /**
     * Type of KeyBind
     */
    type Key = {
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
    class ControllableCanvas implements Opts.ControllableCanvasOptions {
        target: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        trans: number[];
        scl: number[];
        pin: number[];
        transBounds: number[];
        dynamicTransBounds: boolean;
        sclBounds: number[];
        dragEnabled: boolean;
        pinchEnabled: boolean;
        wheelEnabled: boolean;
        keysEnabled: boolean;
        panEnabled: boolean;
        tiltEnabled: boolean;
        eventsReversed: boolean;
        useButton: number;
        scaleMode: number;
        transSpeed: number;
        sclSpeed: number;
        touchSensitivity: number;
        clickSensitivity: number;
        wgets: Set<CanvasButton>;
        keybinds: KeyBind;
        private _zoomChanged;
        private _mobile;
        private _pressed;
        private _clktime;
        _adapts: Opts.ControllableCanvasAdapters;
        _coordinates: number[];
        private _touches;
        private static _linepix;
        static CanvasButton: Class;
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
         * Enable controls
         * @method
         */
        handle(): void;
        /**
         * Add (/create) a widget in the controller
         * @param {ControllableCanvas.CanvasButton|Opts.CanvasButtonOptions} data - constructor options
         * @return {ControllableCanvas.CanvasButton} the widget
         */
        addWidget(data: CanvasButton | Opts.CanvasButtonOptions): CanvasButton;
        /**
         * Re-apply internal transformations
         * @method
         * @returns {ControllableCanvas} this - For method chaining
         */
        retransform(): ThisType<ControllableCanvas>;
        /**
         * Intermediate translation function for iconic translate before the real
         * @method
         * @param {number} x=0 - x translation
         * @param {number} y=0 - y translation
         * @param {boolean} abs?=false - absolute translation or relative to current
         * @returns {number[]} Returns current total translation
         */
        translate(x?: number, y?: number, abs?: boolean): number[];
        /**
         * Intermediate scaling function for iconic scale before the real
         * @method
         * @param {number} x=1 - x scale
         * @param {number} y=x - y scale
         * @param {boolean} abs?=false - absolute scale or relative to current
         * @returns {number[]} Returns current total scaling
         */
        scale(x?: number, y?: number, abs?: boolean): number[];
        private _mobileAdapt;
        private _pcAdapt;
        private static clickPC;
        private static dragPC;
        private static dragMobileMove;
        private static dragMobileStart;
        private static dragMobileEnd;
        private static wheel;
        /**
         * Get screen-equivalent coordinates that bypass transformations.
         * @method
         * @returns {number[]}
         */
        getCoords(): number[];
        private static readonly isMobile;
        private static readonly lineToPix;
        private static fixDelta;
    }
    /**
     * A class to control keyboard events
     */
    class KeyBind {
        press: Key[];
        down: Key[];
        up: Key[];
        element: HTMLElement;
        _bound: boolean;
        arrowMoveSpeed: number;
        arrowMoveSpeedup: number;
        arrowMoveSpeedMax: number;
        arrowMoveSpeedupEnabled: boolean;
        arrowBindings: {
            [key: string]: number[];
        };
        static _idcntr: number;
        static arrowMoveSpeed: number;
        static arrowMoveSpeedup: number;
        static arrowMoveSpeedMax: number;
        static arrowMoveSpeedupEnabled: boolean;
        static arrowBindings: {
            [key: string]: number[];
        };
        constructor(element: HTMLElement, bind?: boolean);
        static arrowMove(event: KeyboardEvent, type: string): boolean;
        bindArrows(): void;
        /**
         * Bind key event listeners
         * @method
         * @returns {boolean}
         */
        bind(): boolean;
        _handler(type: string, event: KeyboardEvent): boolean;
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeypress(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key;
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeydown(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key;
        /**
         * @method
         * @param {string} key
         * @param {Function} callback - cb(event)
         * @returns {Key}
         */
        registerKeyup(key: string, callback: (event: KeyboardEvent, type: string) => boolean): Key;
        /**
         * @method
         * @param {Key} key
         */
        unregister(key: Key | number | string, repl: Key): Key | Key[] | boolean;
    }
    /**
     * A widget-making class for canvas
     * @memberof ControllableCanvas
     * @prop {number} x - x coordinate
     * @prop {number} y - y coordinate
     * @prop {number} dx - width
     * @prop {number} dy - height
     * @prop {number} index - equivalent to CSS z-index
     */
    class CanvasButton implements Opts.CanvasButtonOptions {
        x: number;
        y: number;
        dx: number;
        dy: number;
        index: number;
        parent: ControllableCanvas;
        _id: number;
        enabled: boolean;
        pstate: boolean;
        position: number;
        static sensitivity: number;
        private static _idcntr;
        /**
         * Default options for CanvasButton
         * @readonly
         * @static
         */
        static defaultOpts: Opts.CanvasButtonOptions;
        constructor(opts?: Opts.CanvasButtonOptions);
        /**
         * Checks if button was exited and decides whether to propagate
         * @param any
         */
        blur(...any: any[]): boolean;
        /**
         * Checks if button was entered and decides whether to propagate
         * @param any
         */
        focus(...any: any[]): boolean;
        /**
         * Checks if button was clicked and decides whether to propagate
         * @param any
         */
        click(...any: any[]): boolean;
        /**
         * Checks if pointer is above the widget
         * @param {number[]} relativeCoords
         * @method
         */
        _isOn(relativeCoords: number[]): boolean;
    }
    /**
     * A class offering mathematical Vector utilities
     * @inner
     * @class
     * @prop {number[]} props - vector vertices
     */
    class Vector {
        props: number[];
        constructor(props?: number[]);
        /**
         * Add a vector or number to current vector
         * @method
         * @param {Vector|number} targ - target
         * @param {number} sub - Set to `-1` to substract instead
         * @returns `this` for method chaining
         */
        add(targ: Vector | number, sub?: number): ThisType<Vector>;
        /**
         * Multiply a vector or number to current vector
         * @method
         * @param {Vector|number} targ - target
         * @param {number} div - Set to `-1` to divide instead
         * @returns `this` for method chaining
         */
        mult(targ: Vector | number, div?: number): ThisType<Vector>;
        /**
         * Dot product of 2 vectors
         * @method
         * @param {Vector} targ - target
         * @returns product
         */
        dot(targ: Vector): number;
    }
    /**
     * @prop {HTMLElement[]} resources - All HTML resource elements with "load" listeners that will be loaded. like: audio/img
     */
    class ResourceLoader {
        resources: HTMLElement[];
        _loadcntr: number;
        constructor(resources: HTMLElement[], onload?: (res?: HTMLElement, load?: number) => void, autobind?: boolean);
        /**
         * Bind load events and await loadend
         * @param {Function} onload? - code to execute once loaded
         */
        bind(onload: (res?: HTMLElement, load?: number) => void): void;
        load(res?: HTMLElement, load?: number): void;
        /**
         * Load images by URLs
         * @method
         * @static
         * @param {string[]} urlist - list of urls
         * @param {Function} onload - callback
         * @param {boolean} autobind=true - auto bind
         * @returns {ResourceLoader} the loader
         */
        static images(urlist: string[], onload?: (res?: HTMLElement, load?: number) => void, autobind?: boolean): ResourceLoader;
        /**
         * Load audio by URLs
         * @method
         * @static
         * @param {string[]} urlist - list of urls
         * @param {Function} onload - callback
         * @param {boolean} autobind=true - auto bind
         * @returns {ResourceLoader} the loader
         */
        static audios(urlist: string[], onload?: (res?: HTMLElement, load?: number) => void, autobind?: boolean): ResourceLoader;
    }
}
declare const _default: typeof CanvasControls.ControllableCanvas;
export default _default;
