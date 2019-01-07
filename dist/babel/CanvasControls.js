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
    return n > M ? M : n < m ? m : n;
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
    return Math.sqrt([Xs[1] - Xs[0], Ys[1] - Ys[0]].map(function (v) {
      return Math.pow(v, 2);
    }).reduce(function (acc, v) {
      return acc + v;
    }));
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


  function isWithin(box, point) {
    var sensitivity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : .5;
    return box[0] - sensitivity <= point[0] && box[0] + box[2] + sensitivity >= point[0] && box[1] - sensitivity <= point[1] && box[1] + box[3] + sensitivity >= point[1];
  } //isWithin

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
      ScaleMode[ScaleMode["BYPASS"] = 4] = "BYPASS";
    })(ScaleMode = Opts.ScaleMode || (Opts.ScaleMode = {})); //ScaleMode

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
      this.scaleMode = Opts.ScaleMode.NORMAL;
      /** @todo mask: freescale-axis,rotation-as-scaling */

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
      if (!ControllableCanvas._linepix) ControllableCanvas._linepix = ControllableCanvas.lineToPix;
    } //ctor


    _createClass(ControllableCanvas, [{
      key: "handle",
      //g-max

      /**
       * Enable controls, call only once
       * @method
       * @param {boolean} force?=false - Force handle
       * @returns {boolean} bound? - whether bind suceeded or it was already bound earlier
       */
      value: function handle() {
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        if (!this._handled || force) {
          this._mobile ? this._mobileAdapt() : this._pcAdapt();
          return this._handled = true;
        }

        return false;
      } //handle

    }, {
      key: "addWidget",
      value: function addWidget(data) {
        if (data instanceof CanvasButton && !this.wgets.has(data)) {
          this.wgets.add(data);
        } else if (!(data instanceof CanvasButton)) {
          data = new ControllableCanvas.CanvasButton(data);
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

    }, {
      key: "translate",
      value: function translate() {
        var _this = this;

        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var abs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var by = [x, y].map(Number);
        return this.trans = this.trans.map(function (trn, idx) {
          return bound(Number(!abs ? trn + by[idx] : by[idx]), _this.transBounds[idx], _this.transBounds[idx + 2]);
        });
      } //translate

      /**
       * Intermediate scaling function for iconic scale before the real
       * @method
       * @param {number} x=1 - x scale
       * @param {number} y=x - y scale
       * @param {boolean} abs?=false - abslute scale or relative to current
       * @returns {number[]} scl - Returns current total scaling
       */

    }, {
      key: "scale",
      value: function scale() {
        var _this2 = this;

        var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : x;
        var abs = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var by = [x, y].map(Number);
        return this.scl = this.scl.map(function (scl, idx) {
          return bound(Number(!abs ? scl * by[idx] : by[idx]), _this2.sclBounds[idx], _this2.sclBounds[idx + 2]);
        });
      } //scale

    }, {
      key: "_mobileAdapt",
      value: function _mobileAdapt() {
        var _this3 = this;

        if (!this._adapts.drag && this.dragEnabled) {
          this.target.addEventListener("touchstart", function (e) {
            return ControllableCanvas.dragMobileStart(e, _this3);
          }, {
            passive: false
          });
          this.target.addEventListener("touchmove", this._adapts.pinchSwipe = this._adapts.pinch = this._adapts.drag = function (e) {
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

        if (!this._adapts.tilt) {}
      } //_mobileAdapt

    }, {
      key: "_pcAdapt",
      value: function _pcAdapt() {
        var _this4 = this;

        if (!this._adapts.drag && this.dragEnabled) {
          this.target.addEventListener("mousemove", this._adapts.drag = function (e) {
            return ControllableCanvas.dragPC(e, _this4);
          });
          this.target.addEventListener("mousedown", function (e) {
            return _this4._pressed = true;
          });
          this.target.addEventListener("mouseup", function (e) {
            return _this4._pressed = false;
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

        if (!this._adapts.tilt) {}

        if (!this._adapts.click) {
          this.target.addEventListener("click", this._adapts.click = function (e) {
            return ControllableCanvas.clickPC(e, _this4);
          });
        }
      } //_pcAdapt

    }, {
      key: "ratio",
      get: function get() {
        return this.target.width / this.target.height;
      } //g-ratio

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
      key: "dragPC",
      value: function dragPC(event, cc) {
        if ((cc.useButton & Opts.UseButton.USERIGHT) !== Opts.UseButton.USERIGHT && ("buttons" in event && (event.buttons & 2) === 2 || "which" in event && event.which === 3 || "button" in event && event.button === 2) || (cc.useButton & Opts.UseButton.USERIGHT) === Opts.UseButton.USERIGHT && (cc.useButton & Opts.UseButton.USEBOTH) !== Opts.UseButton.USEBOTH && "buttons" in event && (event.buttons & 2) !== 2 && "which" in event && event.which !== 3 && "button" in event && event.button !== 2) {
          return;
        }

        event.preventDefault();
        var coords = [event.clientX - cc.target.offsetLeft, event.clientY - cc.target.offsetTop],
            rel = [],
            ret = false;

        if (cc._pressed) {
          cc.translate(event.movementX * cc.transSpeed, event.movementY * cc.transSpeed);
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = cc.wgets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var butt = _step.value;
            butt.enabled && butt.isOn(rel = coords.map(function (c, idx) {
              return c - cc.trans[idx];
            })) && !butt.pstate && (butt.pstate = true, ret = butt.focus(rel));
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

        cc._coordinates = coords;
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
          return [[tlis[0].clientX, tlis[0].clientY], [tlis[1].clientX, tlis[1].clientY]];
        } //arraynge


        function every(t, nt) {
          var all = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
          var out = false;

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


        function inh() {
          var one = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
          cc._touches[0] = [event.targetTouches[0].clientX - cc.target.offsetLeft, event.targetTouches[0].clientY - cc.target.offsetTop];
          if (!one) cc._touches[1] = [event.targetTouches[1].clientX - cc.target.offsetLeft, event.targetTouches[1].clientY - cc.target.offsetTop];
        } //inh


        event.preventDefault();
        var coords = [event.targetTouches[event.targetTouches.length - 1].clientX - cc.target.offsetLeft, event.targetTouches[event.targetTouches.length - 1].clientY - cc.target.offsetTop];

        if (cc._touches.length === 1) {
          var cp = Array.from(cc.trans),
              dis;
          cc.translate.apply(cc, _toConsumableArray([coords[0] - cc._coordinates[0], coords[1] - cc._coordinates[1]].map(function (v) {
            return v * cc.transSpeed;
          })));
          dis = dist([cp[0], cc.trans[0]], [cp[1], cc.trans[1]]);
          if (dis > cc.touchSensitivity) cc._clktime = 0;
          inh(true);
        } else if (cc._touches.length === 2 && event.targetTouches.length === 2) {
          if (cc.pinchEnabled && (cc.scaleMode & Opts.ScaleMode.BYPASS) === Opts.ScaleMode.BYPASS) {
            console.info("scaling bypass"); //SPECIAL CENTER*
          } else if (cc.pinchSwipeEnabled && every(arraynge(event.targetTouches), cc._touches)) {
            console.info("rotation");
          } else if (cc.pinchEnabled && every(arraynge(event.targetTouches), cc._touches, true)) {
            //NEEDED FOR PRECISION!
            console.info("scaling");

            if ((cc.scaleMode & Opts.ScaleMode.FREESCALE) === Opts.ScaleMode.FREESCALE) {} else {
              //@ts-ignore
              var inidist = dist([cc._touches[event.changedTouches[0].identifier][0], cc._touches[event.changedTouches[1].identifier][0]], [cc._touches[event.changedTouches[0].identifier][1], cc._touches[event.changedTouches[1].identifier][1]]),
                  _dis = dist([event.changedTouches[0].clientX - cc.target.offsetLeft, event.changedTouches[1].clientX - cc.target.offsetLeft], [event.changedTouches[0].clientY - cc.target.offsetTop, event.changedTouches[1].clientY - cc.target.offsetTop]),
                  itouches = [cc._touches[0][0] + cc._touches[1][0], cc._touches[0][1] + cc._touches[1][1]].map(function (i, idx) {
                return i / 2 - cc.trans[idx];
              }),
                  d = _dis / inidist,
                  ntouches = itouches.map(function (i) {
                return i * (1 - d);
              });

              cc.translate.apply(cc, _toConsumableArray(ntouches));
              cc.scale(d);
            }
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
          var coords = [event.changedTouches[event.changedTouches.length - 1].clientX - cc.target.offsetLeft - cc.trans[0], event.changedTouches[event.changedTouches.length - 1].clientY - cc.target.offsetTop - cc.trans[1]],
              sorted = Array.from(cc.wgets.entries()).map(function (s) {
            return s[1];
          }).sort(function (a, b) {
            return b._id - a._id;
          }),
              ret = false;
          Array.from(event.changedTouches).forEach(function (t) {
            return cc._touches[t.identifier] = [t.clientX - cc.target.offsetLeft, t.clientY - cc.target.offsetTop];
          });
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = sorted[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var butt = _step2.value;
              butt.enabled && butt.isOn(coords) && !butt.pstate && (butt.pstate = true, ret = butt.focus(coords));
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
        }

        if (cc._touches.length === 1) {
          cc._clktime = Date.now();
        } else {
          cc._clktime = 0;
        }

        cc._pressed = true;
        cc._coordinates = cc._touches[cc._touches.length - 1];
      } //dragMobileStart

    }, {
      key: "dragMobileEnd",
      value: function dragMobileEnd(event, cc) {
        event.preventDefault();

        if (cc._touches.length === 1 && Date.now() - cc._clktime <= cc.clickSensitivity) {
          var coords = [event.changedTouches[event.changedTouches.length - 1].clientX - cc.target.offsetLeft - cc.trans[0], event.changedTouches[event.changedTouches.length - 1].clientY - cc.target.offsetTop - cc.trans[1]],
              sorted = Array.from(cc.wgets.entries()).map(function (s) {
            return s[1];
          }).sort(function (a, b) {
            return b._id - a._id;
          }),
              ret = false;
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = sorted[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var butt = _step3.value;
              butt.enabled && butt.isOn(coords) && (ret = butt.click(coords));
              if (ret) break;
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
        cc.translate.apply(cc, _toConsumableArray(coords.map(function (c) {
          return c * (1 - d);
        })));
        cc.scale(d);
      } //wheel

    }, {
      key: "clickPC",
      value: function clickPC(event, cc) {
        var coords = [event.clientX - cc.target.offsetLeft - cc.trans[0], event.clientY - cc.target.offsetTop - cc.trans[1]],
            sorted = Array.from(cc.wgets.entries()).map(function (s) {
          return s[1];
        }).sort(function (a, b) {
          return b._id - a._id;
        }),
            ret = false;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = sorted[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var butt = _step4.value;
            butt.enabled && butt.isOn(coords) && (ret = butt.click(coords));
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
      } //clickPC

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
      } //detectMobile

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
      inherit(opts, CanvasButton.defaultOpts);

      if ([opts.x, opts.y, opts.dx, opts.dy].some(function (num) {
        return isNaN(num) || num === '';
      })) {
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
      key: "isOn",
      value: function isOn(relativeCoords) {
        var out = isWithin([this.x, this.y, this.dx, this.dy], [relativeCoords[0], relativeCoords[1]], CanvasButton.sensitivity);

        if (!out && this.pstate) {
          this.blur(relativeCoords);
          this.pstate = false;
        }

        return out;
      } //isOn

    }]);

    return CanvasButton;
  }();

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
    parent: new ControllableCanvas()
  };
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
        var _this5 = this;

        var sub = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        if (targ instanceof Vector) {
          this.props.forEach(function (prop, idx) {
            _this5.props[idx] += sub * targ[idx];
          });
        } else {
          this.props.forEach(function (prop, idx) {
            _this5.props[idx] += sub * targ;
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
        var _this6 = this;

        var div = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        if (targ instanceof Vector) {
          this.props.forEach(function (prop, idx) {
            _this6.props[idx] *= Math.pow(targ[idx], div);
          });
        } else {
          this.props.forEach(function (prop, idx) {
            _this6.props[idx] *= Math.pow(targ, div);
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
})(CanvasControls = exports.CanvasControls || (exports.CanvasControls = {})); //CanvasControls


exports.default = CanvasControls.ControllableCanvas;