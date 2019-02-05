/*
 * Angle between 3 poins (Radians):
 * pc: center/pole
 * pn: point new coordinates
 * pp: point past coordinates
 *
 * atan2(pny - pcy, pnx - pcx) - atan2(ppy - pcy, ppx - pcx)
 */

/*
 * centered zoom breaks with transBounds - normal/acceptable
 */
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
  function inherit(dest, targ) {
    var condition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (dest, targ, prop) {
      return dest[prop] === undefined && (dest[prop] = targ[prop]);
    };

    for (var i in targ) {
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

  function bound(n, m, M) {
    var p = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    return n > M + p ? M : n < m - p ? m : n;
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
    return Math.sqrt([Xs[1] - Xs[0], Ys[1] - Ys[0]].map(function (v) {
      return Math.pow(v, 2);
    }).reduce(function (acc, v) {
      return acc + v;
    }));
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

  function isWithin(box, point) {
    var sensitivity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .5;
    return box[0] - sensitivity <= point[0] && box[0] + box[2] + sensitivity >= point[0] && box[1] - sensitivity <= point[1] && box[1] + box[3] + sensitivity >= point[1];
  } //isWithin


  CanvasControls.isWithin = isWithin;
  /**
   * A holder for all Options
   * @namespace
   */

  var Opts;

  (function (Opts) {
    var UseButton;

    (function (UseButton) {
      UseButton[UseButton["USELEFT"] = 1] = "USELEFT";
      UseButton[UseButton["USERIGHT"] = 2] = "USERIGHT";
      UseButton[UseButton["USEBOTH"] = 3] = "USEBOTH";
    })(UseButton = Opts.UseButton || (Opts.UseButton = {})); //UseButton


    var ScaleMode;

    (function (ScaleMode) {
      ScaleMode[ScaleMode["NORMAL"] = 1] = "NORMAL";
      ScaleMode[ScaleMode["FREESCALE"] = 2] = "FREESCALE";
    })(ScaleMode = Opts.ScaleMode || (Opts.ScaleMode = {})); //ScaleMode


    var Position;

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


  var Errors;

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


  var ControllableCanvas =
  /*#__PURE__*/
  function () {
    /**
     * ControllableCanvas constructor
     * @param {Opts.ControllableCanvasOptions} opts?=ControllableCanvas.defaultOpts - ControllableCanvas Options
     * @constructor
     */
    function ControllableCanvas() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ControllableCanvas.defaultOpts;

      _classCallCheck(this, ControllableCanvas);

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
      this._clktime = 0;
      this._coordinates = [];
      this._touches = [];
      inherit(opts, ControllableCanvas.defaultOpts);

      if (!(opts.target instanceof HTMLCanvasElement)) {
        throw Errors.ENOTCANV;
      } else if ([opts.trans, opts.scl, opts.transBounds, opts.sclBounds].some(function (arr) {
        return !(arr instanceof Array || arr instanceof Float32Array || arr instanceof Float64Array) || arr.length < 2 || Array.from(arr).some(function (num) {
          return isNaN(num) || num === '';
        });
      })) {
        throw Errors.ENOTNUMARR2;
      }

      inherit(opts._adapts, ControllableCanvas.defaultOpts._adapts); //POSSIBLE ERROR

      if (opts.pin === undefined) {
        opts.pin = [opts.target.width / 2, opts.target.height / 2];
      } else if (!(opts.pin instanceof Array || opts.pin instanceof Float32Array || opts.pin instanceof Float64Array) || opts.pin.length < 2 || Array.from(opts.pin).some(function (num) {
        return isNaN(num) || num === '';
      })) {
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
      if (!ControllableCanvas._linepix) ControllableCanvas._linepix = ControllableCanvas.lineToPix;
      Object.defineProperty(this.target, "_cc_", {
        value: this,
        enumerable: false,
        writable: false,
        configurable: true
      });
    } //ctor


    _createClass(ControllableCanvas, [{
      key: "handle",
      //g-max  OBS

      /**
       * Enable controls
       * @method
       */
      value: function handle() {
        this._mobile ? this._mobileAdapt() : this._pcAdapt();
      } //handle

      /**
       * Add (/create) a widget in the controller
       * @param {ControllableCanvas.CanvasButton|Opts.CanvasButtonOptions} data - constructor options
       * @return {ControllableCanvas.CanvasButton} the widget
       */

    }, {
      key: "addWidget",
      value: function addWidget(data) {
        if (data instanceof CanvasButton && !this.wgets.has(data)) {
          data.parent = this;
          this.wgets.add(data);
        } else if (!(data instanceof CanvasButton)) {
          data = new ControllableCanvas.CanvasButton(data);
          data.parent = this;
          this.wgets.add(data);
        } else {
          throw Errors.EISALR;
        }

        return data;
      } //addWidget

      /**
       * Re-apply internal transformations
       * @method
       * @returns {ControllableCanvas} this - For method chaining
       */

    }, {
      key: "retransform",
      value: function retransform() {
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

    }, {
      key: "translate",
      value: function translate() {
        var _this = this;

        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var abs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var by = [x, y].map(Number);
        if (this.eventsReversed) by = by.map(function (b) {
          return -b;
        });
        return this.trans = this.trans.map(function (trn, idx) {
          return bound(Number(!abs ? trn + by[idx] : by[idx]), _this.dynamicTransBounds ? _this.transBounds[idx] * _this.scl[idx] : _this.transBounds[idx], _this.dynamicTransBounds ? _this.transBounds[idx + 2] * _this.scl[idx] : _this.transBounds[idx + 2]);
        });
      } //translate

      /**
       * Intermediate scaling function for iconic scale before the real
       * @method
       * @param {number} x=1 - x scale
       * @param {number} y=x - y scale
       * @param {boolean} abs?=false - absolute scale or relative to current
       * @returns {number[]} Returns current total scaling
       */

    }, {
      key: "scale",
      value: function scale() {
        var _this2 = this;

        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : x;
        var abs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var by = [x, y].map(Number);
        if (this.eventsReversed) by = by.map(function (b) {
          return -b;
        });

        if (!abs) {
          var nscl = this.scl.map(function (scl, idx) {
            return scl * by[idx];
          });
          nscl = [nscl[0] - this.scl[0], nscl[1] - this.scl[1]];
          this._zoomChanged = [this.scl[0] !== block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), this.scl[1] !== block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
          return this.scl = [block(this.scl[0], this.sclBounds[0], this.sclBounds[2], nscl[0]), block(this.scl[1], this.sclBounds[1], this.sclBounds[3], nscl[1])];
        } else {
          this._zoomChanged = [this.scl[0] !== bound(this.scl[0], this.sclBounds[0], this.sclBounds[2]), this.scl[1] !== bound(this.scl[1], this.sclBounds[1], this.sclBounds[3])];
          return this.scl = this.scl.map(function (scl, idx) {
            return bound(scl * by[idx], _this2.sclBounds[idx], _this2.sclBounds[idx + 2]);
          });
        }
      } //scale

    }, {
      key: "_mobileAdapt",
      value: function _mobileAdapt() {
        var _this3 = this;

        if (!(this._adapts.drag || this._adapts.pinch) && this.dragEnabled) {
          this.target.addEventListener("touchstart", function (e) {
            return ControllableCanvas.dragMobileStart(e, _this3);
          }, {
            passive: false
          });
          this.target.addEventListener("touchmove", this._adapts.pinch = this._adapts.drag = function (e) {
            return ControllableCanvas.dragMobileMove(e, _this3);
          }, {
            passive: false
          });
          this.target.addEventListener("touchend", function (e) {
            return ControllableCanvas.dragMobileEnd(e, _this3);
          }, {
            passive: false
          });
          this.target.addEventListener("touchcancel", function (e) {
            return ControllableCanvas.dragMobileEnd(e, _this3);
          }, {
            passive: false
          });
        }

        if (!this._adapts.tilt && this.tiltEnabled) {//TODO
        }
      } //_mobileAdapt

    }, {
      key: "_pcAdapt",
      value: function _pcAdapt() {
        var _this4 = this;

        if (!(this._adapts.drag || this._adapts.click) && this.dragEnabled) {
          this.target.addEventListener("mousemove", this._adapts.drag = function (e) {
            return ControllableCanvas.dragPC(e, _this4);
          });
          this.target.addEventListener("mousedown", function (e) {
            _this4._clktime = Date.now();
            _this4._pressed = true;
          });
          this.target.addEventListener("mouseup", this._adapts.click = function (e) {
            return ControllableCanvas.clickPC(e, _this4);
          }); //@ts-ignore

          this.target.addEventListener("mouseout", function (e) {
            return _this4._adapts.click(e);
          });
          if ((this.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT) this.target.addEventListener("contextmenu", function (e) {
            return e.preventDefault();
          }, {
            capture: true,
            passive: false
          });
        }

        if (!this._adapts.wheel && this.wheelEnabled) {
          this.target.addEventListener("wheel", this._adapts.wheel = function (e) {
            return ControllableCanvas.wheel(e, _this4);
          });
        }

        if (!this._adapts.tilt && this.tiltEnabled) {//TODO
        }
      } //_pcAdapt

    }, {
      key: "getCoords",
      //wheel

      /**
       * Get screen-equivalent coordinates that bypass transformations.
       * @method
       * @returns {number[]}
       */
      value: function getCoords() {
        var _this5 = this;

        return this._coordinates.map(function (c, idx) {
          return (c - _this5.trans[idx]) / _this5.scl[idx];
        });
      } //getCoords

    }, {
      key: "ratio",
      get: function get() {
        return this.target.width / this.target.height;
      } //g-ratio  OBS

    }, {
      key: "min",
      get: function get() {
        return Math.min(this.target.width, this.target.height);
      } //g-min

    }, {
      key: "max",
      get: function get() {
        return Math.max(this.target.width, this.target.height);
      }
    }], [{
      key: "clickPC",
      value: function clickPC(event, cc) {
        if (Date.now() - cc._clktime <= cc.clickSensitivity) {
          var coords = [(event.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (event.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]],
              sorted = Array.from(cc.wgets.entries()).map(function (s) {
            return s[1];
          }).sort(function (a, b) {
            return b._id - a._id;
          }),
              ret = false;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = sorted[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var butt = _step.value;
              butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
              if (ret) break;
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }

        cc._clktime = 0;
        cc._pressed = false;
      } //clickPC

    }, {
      key: "dragPC",
      value: function dragPC(event, cc) {
        event.preventDefault();
        var coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop],
            rel = [],
            ret = false;
        cc._coordinates = coords;

        if ((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ("buttons" in event && (event.buttons & 2) === 2 || "which" in event && event.which === 3 || "button" in event && event.button === 2) || (cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && "buttons" in event && (event.buttons & 2) !== 2 && "which" in event && event.which !== 3 && "button" in event && event.button !== 2) {
          return;
        }

        if (cc._pressed) {
          cc._clktime = 0;
          cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
        }

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = cc.wgets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var butt = _step2.value;
            butt.enabled && butt._isOn(rel = coords.map(function (c, idx) {
              return (c - cc.trans[idx]) / cc.scl[idx];
            })) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
            if (ret) break;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      } //dragPC

    }, {
      key: "dragMobileMove",
      value: function dragMobileMove(event, cc) {
        function check(arr, curr) {
          if (arr.every(function (ar, idx) {
            return Math.abs(ar - curr[idx]) >= cc.touchSensitivity;
          })) {
            return true;
          }

          return false;
        } //check


        function arraynge(tlis) {
          return [[tlis[0].clientX - cc.target.offsetLeft, tlis[0].clientY - cc.target.offsetTop], [tlis[1].clientX - cc.target.offsetLeft, tlis[1].clientY - cc.target.offsetTop]];
        } //arraynge


        function every(t, nt) {
          var all = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
          var once = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
          var out = false;

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


        function inh() {
          var one = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
          cc._touches[0] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
          if (!one) cc._touches[1] = [event.targetTouches[1].clientX - cc.target.offsetLeft, event.targetTouches[1].clientY - cc.target.offsetTop];
        } //inh


        event.preventDefault();
        var coords = [event.targetTouches[event.targetTouches.length - 1].clientX - cc.target.offsetLeft, event.targetTouches[event.targetTouches.length - 1].clientY - cc.target.offsetTop];

        if (cc.dragEnabled && cc._touches.length === 1) {
          var cp = Array.from(cc.trans),
              dis;
          cc.translate.apply(cc, _toConsumableArray([coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map(function (v) {
            return v * cc.transSpeed;
          })));
          dis = dist([cp[0], cc.trans[0]], [cp[1], cc.trans[1]]);
          if (dis > cc.touchSensitivity) cc._clktime = 0;
          inh(true);
        } else if (cc.pinchEnabled && cc._touches.length === 2 && event.targetTouches.length === 2 && every(arraynge(event.targetTouches), cc._touches, false, true)) {
          if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {
            var inidist = [Math.abs(cc._touches[event.targetTouches[0].identifier][0] - cc._touches[event.targetTouches[1].identifier][0]), Math.abs(cc._touches[event.targetTouches[0].identifier][1] - cc._touches[event.targetTouches[1].identifier][1])],
                _dis = [Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX - 2 * cc.target.offsetLeft), Math.abs(event.targetTouches[0].clientY - event.targetTouches[1].clientY - 2 * cc.target.offsetTop)],
                itouches = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map(function (i, idx) {
              return i / 2 - cc.trans[idx];
            }),
                d = [_dis[0] / inidist[0], _dis[1] / inidist[1]].map(function (v) {
              return v * cc.sclSpeed;
            }),
                ntouches = itouches.map(function (i, idx) {
              return i * (1 - d[idx]);
            });
            if (cc._zoomChanged[0]) cc.translate(ntouches[0]);
            if (cc._zoomChanged[1]) cc.translate(ntouches[1]);
            cc.scale(d[0], d[1]);
          } else {
            //@ts-ignore
            var _inidist = dist([cc._touches[event.targetTouches[0].identifier][0], cc._touches[event.targetTouches[1].identifier][0]], [cc._touches[event.targetTouches[0].identifier][1], cc._touches[event.targetTouches[1].identifier][1]]),
                _dis2 = dist([event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[1].clientX - cc.target.offsetLeft], [event.targetTouches[0].clientY - cc.target.offsetTop, event.targetTouches[1].clientY - cc.target.offsetTop]),
                _itouches = [cc._touches[event.targetTouches[0].identifier][0] + cc._touches[event.targetTouches[1].identifier][0], cc._touches[event.targetTouches[0].identifier][1] + cc._touches[event.targetTouches[1].identifier][1]].map(function (i, idx) {
              return i / 2 - cc.trans[idx];
            }),
                _d = cc.sclSpeed * _dis2 / _inidist,
                _ntouches = _itouches.map(function (i) {
              return i * (1 - _d);
            });

            cc.scale(_d);
            if (cc._zoomChanged.every(function (zm) {
              return zm;
            })) cc.translate.apply(cc, _toConsumableArray(_ntouches));
          }

          inh();
        }

        cc._coordinates = coords;
      } //dragMobileMove

    }, {
      key: "dragMobileStart",
      value: function dragMobileStart(event, cc) {
        var cust = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        event.preventDefault();

        if (!cust) {
          var coords,
              sorted = Array.from(cc.wgets.entries()).map(function (s) {
            return s[1];
          }).sort(function (a, b) {
            return b._id - a._id;
          }),
              ret = false;
          Array.from(event.changedTouches).forEach(function (t) {
            return cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop];
          });
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = event.changedTouches[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var touch = _step3.value;
              coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];
              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = sorted[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var butt = _step4.value;
                  butt.enabled && butt._isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
                  if (ret) break;
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
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

    }, {
      key: "dragMobileEnd",
      value: function dragMobileEnd(event, cc) {
        event.preventDefault();
        var coords,
            sorted = Array.from(cc.wgets.entries()).map(function (s) {
          return s[1];
        }).sort(function (a, b) {
          return b._id - a._id;
        }),
            ret = false;
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = event.changedTouches[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var touch = _step5.value;
            coords = [(touch.clientX - cc.target.offsetLeft - cc.trans[0]) / cc.scl[0], (touch.clientY - cc.target.offsetTop - cc.trans[1]) / cc.scl[1]];
            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
              for (var _iterator7 = sorted[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var _butt = _step7.value;
                _butt.enabled && _butt._isOn(coords);
              }
            } catch (err) {
              _didIteratorError7 = true;
              _iteratorError7 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion7 && _iterator7.return != null) {
                  _iterator7.return();
                }
              } finally {
                if (_didIteratorError7) {
                  throw _iteratorError7;
                }
              }
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = sorted[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var butt = _step6.value;
              butt.enabled && butt._isOn(coords) && (ret = butt.click(coords));
              if (ret) break;
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }

          cc._clktime = 0;
        }

        Array.from(event.changedTouches).forEach(function (t) {
          cc._touches.splice(t.identifier, 1);
        });

        if (Object.keys(cc._touches).length == 1) {
          ControllableCanvas.dragMobileStart(event, cc, true);
        }

        cc._pressed = !!cc._touches.length;
      } //dragMobileEnd

    }, {
      key: "wheel",
      value: function wheel(event, cc) {
        event.preventDefault();
        var d = 1 - cc.sclSpeed * ControllableCanvas.fixDelta(event.deltaMode, event.deltaY) / cc.min,
            coords = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]];
        cc.scale(d);
        if (cc._zoomChanged.every(function (zm) {
          return zm;
        })) cc.translate.apply(cc, _toConsumableArray(coords.map(function (c) {
          return c * (1 - d);
        })));
      }
    }, {
      key: "fixDelta",
      //lineToPix
      value: function fixDelta(mode, deltaY) {
        if (mode === 1) {
          return ControllableCanvas._linepix * deltaY;
        } else if (mode === 2) {
          return window.innerHeight;
        } else {
          return deltaY;
        }
      } //fixDelta

    }, {
      key: "isMobile",
      get: function get() {
        if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
          return true;
        } else {
          return false;
        }
      } //isMobile

    }, {
      key: "lineToPix",
      get: function get() {
        var r,
            iframe = document.createElement("iframe");
        iframe.src = '#';
        document.body.appendChild(iframe);
        var iwin = iframe.contentWindow,
            idoc = iwin.document;
        idoc.open();
        idoc.write('<!DOCTYPE html><html><head></head><body><p>a</p></body></html>');
        idoc.close();
        var span = idoc.body.firstElementChild;
        r = span.offsetHeight;
        document.body.removeChild(iframe);
        return r;
      }
    }]);

    return ControllableCanvas;
  }(); //ControllableCanvas


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

  var KeyBind =
  /*#__PURE__*/
  function () {
    function KeyBind(element) {
      var bind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      _classCallCheck(this, KeyBind);

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


    _createClass(KeyBind, [{
      key: "bindArrows",
      //arrowMove
      value: function bindArrows() {
        for (var i in this.arrowBindings) {
          this.registerKeydown(i, KeyBind.arrowMove.bind(this));
          this.registerKeyup(i, KeyBind.arrowMove.bind(this));
        }

        this.bindArrows = function () {};
      } //bindArrows

      /**
       * Bind key event listeners
       * @method
       * @returns {boolean}
       */

    }, {
      key: "bind",
      value: function bind() {
        var _this6 = this;

        if (!this._bound) {
          this.element.addEventListener("keypress", function (event) {
            return _this6._handler.bind(_this6)("keypress", event);
          }, false);
          this.element.addEventListener("keyup", function (event) {
            return _this6._handler.bind(_this6)("keyup", event);
          }, false);
          this.element.addEventListener("keydown", function (event) {
            return _this6._handler.bind(_this6)("keydown", event);
          }, false);
          return this._bound = true;
        }

        return false;
      } //bind

    }, {
      key: "_handler",
      value: function _handler(type, event) {
        var handled = false;
        this[type.replace("key", '')].forEach(function (key) {
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

    }, {
      key: "registerKeypress",
      value: function registerKeypress(key, callback) {
        var out;
        this.press.push(out = {
          key: key,
          callback: callback,
          id: KeyBind._idcntr++,
          type: "press"
        });
        return out;
      } //registerKeypress

      /**
       * @method
       * @param {string} key
       * @param {Function} callback - cb(event)
       * @returns {Key}
       */

    }, {
      key: "registerKeydown",
      value: function registerKeydown(key, callback) {
        var out;
        this.down.push(out = {
          key: key,
          callback: callback,
          id: KeyBind._idcntr++,
          type: "down"
        });
        return out;
      } //registerKeydown

      /**
       * @method
       * @param {string} key
       * @param {Function} callback - cb(event)
       * @returns {Key}
       */

    }, {
      key: "registerKeyup",
      value: function registerKeyup(key, callback) {
        var out;
        this.up.push(out = {
          key: key,
          callback: callback,
          id: KeyBind._idcntr++,
          type: "up"
        });
        return out;
      } //registerKeyup

      /**
       * @method
       * @param {Key} key
       */

    }, {
      key: "unregister",
      value: function unregister(key, repl) {
        if (typeof key === "number") {
          var idx;

          if ((idx = this.press.findIndex(function (k) {
            return k.id === key;
          })) >= 0) {
            return this.press.splice(idx, 1, repl);
          } else if ((idx = this.down.findIndex(function (k) {
            return k.id === key;
          })) >= 0) {
            return this.down.splice(idx, 1, repl);
          } else if ((idx = this.up.findIndex(function (k) {
            return k.id === key;
          })) >= 0) {
            return this.up.splice(idx, 1, repl);
          } else {
            return false;
          }
        } else if (typeof key === "string") {
          this.press = this.press.filter(function (k) {
            return k.key !== key;
          });
          this.down = this.down.filter(function (k) {
            return k.key !== key;
          });
          this.up = this.up.filter(function (k) {
            return k.key !== key;
          });
        } else {
          return this[key.type].splice(this[key.type].findIndex(function (k) {
            return k.id === key.id;
          }), 1, repl);
        }
      } //unregister

    }], [{
      key: "arrowMove",
      value: function arrowMove(event, type) {
        if (type === "keydown") {
          event.target["_cc_"].translate(this.arrowMoveSpeed * this.arrowBindings[event.key][0], this.arrowMoveSpeed * this.arrowBindings[event.key][1]);
          if (this.arrowMoveSpeedupEnabled) this.arrowMoveSpeed = bound(this.arrowMoveSpeed + this.arrowMoveSpeedup, 0, this.arrowMoveSpeedMax);
        } else {
          this.arrowMoveSpeed = KeyBind.arrowMoveSpeed;
        }

        return false;
      }
    }]);

    return KeyBind;
  }(); //KeyBind


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

  var CanvasButton =
  /*#__PURE__*/
  function () {
    function CanvasButton() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : CanvasButton.defaultOpts;

      _classCallCheck(this, CanvasButton);

      this.x = 0;
      this.y = 0;
      this.dx = 0;
      this.dy = 0;
      this.index = -1;
      this.enabled = true;
      this.pstate = false;
      this.position = 2;
      inherit(opts, CanvasButton.defaultOpts);

      if ([opts.x, opts.y, opts.dx, opts.dy, opts.position, opts.index].some(function (num) {
        return isNaN(num) || num === '';
      })) {
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


    _createClass(CanvasButton, [{
      key: "blur",
      value: function blur() {
        return true;
      } //blur
      //@Override

      /**
       * Checks if button was entered and decides whether to propagate
       * @param any
       */

    }, {
      key: "focus",
      value: function focus() {
        return false;
      } //focus
      //@Override

      /**
       * Checks if button was clicked and decides whether to propagate
       * @param any
       */

    }, {
      key: "click",
      value: function click() {
        return true;
      } //click

      /**
       * Checks if pointer is above the widget
       * @param {number[]} relativeCoords
       * @method
       */

    }, {
      key: "_isOn",
      value: function _isOn(relativeCoords) {
        var x = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? (this.x - this.parent.trans[0]) / this.parent.scl[0] : this.x,
            y = (this.position & Opts.Position.FIXED) === Opts.Position.FIXED ? (this.y - this.parent.trans[1]) / this.parent.scl[1] : this.y,
            dx = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dx / this.parent.scl[0] : this.dx,
            dy = (this.position & Opts.Position.UNSCALABLE) === Opts.Position.UNSCALABLE ? this.dy / this.parent.scl[1] : this.dy,
            out = isWithin([x, y, dx, dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);

        if (!out && this.pstate) {
          this.blur(relativeCoords);
          this.pstate = false;
        }

        return out;
      } //_isOn

    }]);

    return CanvasButton;
  }(); //CanvasButton


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
    parent: new ControllableCanvas()
  };
  CanvasControls.CanvasButton = CanvasButton;
  ControllableCanvas.CanvasButton = CanvasButton;
  /**
   * A class offering mathematical Vector utilities
   * @inner
   * @class
   * @prop {number[]} props - vector vertices
   */

  var Vector =
  /*#__PURE__*/
  function () {
    function Vector() {
      var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      _classCallCheck(this, Vector);

      this.props = Array.from(props.map(Number));
    } //ctor

    /**
     * Add a vector or number to current vector
     * @method
     * @param {Vector|number} targ - target
     * @param {number} sub - Set to `-1` to substract instead
     * @returns `this` for method chaining
     */


    _createClass(Vector, [{
      key: "add",
      value: function add(targ) {
        var _this7 = this;

        var sub = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        if (targ instanceof Vector) {
          this.props.forEach(function (prop, idx) {
            _this7.props[idx] += sub * targ[idx];
          });
        } else {
          this.props.forEach(function (prop, idx) {
            _this7.props[idx] += sub * targ;
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

    }, {
      key: "mult",
      value: function mult(targ) {
        var _this8 = this;

        var div = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        if (targ instanceof Vector) {
          this.props.forEach(function (prop, idx) {
            _this8.props[idx] *= Math.pow(targ[idx], div);
          });
        } else {
          this.props.forEach(function (prop, idx) {
            _this8.props[idx] *= Math.pow(targ, div);
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

    }, {
      key: "dot",
      value: function dot(targ) {
        return this.props.reduce(function (acc, val, idx) {
          return acc + val * targ[idx];
        });
      } //dot

    }]);

    return Vector;
  }(); //Vector


  CanvasControls.Vector = Vector;
  /**
   * @prop {HTMLElement[]} resources - All HTML resource elements with "load" listeners that will be loaded. like: audio/img
   */

  var ResourceLoader =
  /*#__PURE__*/
  function () {
    function ResourceLoader(resources, onload) {
      var autobind = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      _classCallCheck(this, ResourceLoader);

      this.resources = [];
      this._loadcntr = 0;
      this.resources = Array.from(resources);
      this.load = onload || this.load;
      if (autobind) this.bind(this.load);
    } //ctor

    /**
     * Bind load events and await loadend
     * @param {Function} onload? - code to execute once loaded
     */


    _createClass(ResourceLoader, [{
      key: "bind",
      value: function bind(onload) {
        var _this9 = this;

        if (onload) this.load = onload;
        this.resources.forEach(function (res) {
          res.addEventListener("load", function () {
            if (++_this9._loadcntr === _this9.resources.length) {
              _this9.load(res, _this9._loadcntr);
            }
          });
        });
      } //bind
      //@Override

    }, {
      key: "load",
      value: function load(res, _load) {} //load

      /**
       * Load images by URLs
       * @method
       * @static
       * @param {string[]} urlist - list of urls
       * @param {Function} onload - callback
       * @param {boolean} autobind=true - auto bind
       * @returns {ResourceLoader} the loader
       */

    }], [{
      key: "images",
      value: function images(urlist, onload) {
        var autobind = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        var imglist = [];
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = urlist[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var url = _step8.value;
            var img = new Image();
            img.src = url;
            imglist.push(img);
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return != null) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
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

    }, {
      key: "audios",
      value: function audios(urlist, onload) {
        var autobind = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        var audiolist = [];
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = urlist[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var url = _step9.value;
            var audio = new Audio(url);
            audio.load();
            audiolist.push(audio);
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9.return != null) {
              _iterator9.return();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }

        return new ResourceLoader(audiolist, onload, autobind);
      } //audios

    }]);

    return ResourceLoader;
  }(); //ResourceLoader


  CanvasControls.ResourceLoader = ResourceLoader;
})(CanvasControls = exports.CanvasControls || (exports.CanvasControls = {})); //CanvasControls


exports.default = CanvasControls.ControllableCanvas;