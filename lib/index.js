"use strict";

exports.__esModule = true;
exports.createHorizontalStrength = createHorizontalStrength;
exports.createVerticalStrength = createVerticalStrength;
exports.default = createScrollingComponent;
exports.defaultVerticalStrength = exports.defaultHorizontalStrength = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactDom = require("react-dom");

var _lodash = _interopRequireDefault(require("lodash.throttle"));

var _raf = _interopRequireDefault(require("raf"));

var _reactDisplayName = _interopRequireDefault(require("react-display-name"));

var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));

var _util = require("./util");

var _reactDnd = require("react-dnd");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

var DEFAULT_BUFFER = 150;

function createHorizontalStrength(_buffer) {
  return function defaultHorizontalStrength(_ref, point) {
    var x = _ref.x,
        w = _ref.w,
        y = _ref.y,
        h = _ref.h;
    var buffer = Math.min(w / 2, _buffer);
    var inRange = point.x >= x && point.x <= x + w;
    var inBox = inRange && point.y >= y && point.y <= y + h;

    if (inBox) {
      if (point.x < x + buffer) {
        return (point.x - x - buffer) / buffer;
      } else if (point.x > x + w - buffer) {
        return -(x + w - point.x - buffer) / buffer;
      }
    }

    return 0;
  };
}

function createVerticalStrength(_buffer) {
  return function defaultVerticalStrength(_ref2, point) {
    var y = _ref2.y,
        h = _ref2.h,
        x = _ref2.x,
        w = _ref2.w;
    var buffer = Math.min(h / 2, _buffer);
    var inRange = point.y >= y && point.y <= y + h;
    var inBox = inRange && point.x >= x && point.x <= x + w;

    if (inBox) {
      if (point.y < y + buffer) {
        return (point.y - y - buffer) / buffer;
      } else if (point.y > y + h - buffer) {
        return -(y + h - point.y - buffer) / buffer;
      }
    }

    return 0;
  };
}

var defaultHorizontalStrength = createHorizontalStrength(DEFAULT_BUFFER);
exports.defaultHorizontalStrength = defaultHorizontalStrength;
var defaultVerticalStrength = createVerticalStrength(DEFAULT_BUFFER);
exports.defaultVerticalStrength = defaultVerticalStrength;

function createScrollingComponent(WrappedComponent, itemTypes) {
  var ScrollingComponent =
  /*#__PURE__*/
  function (_Component) {
    _inheritsLoose(ScrollingComponent, _Component);

    function ScrollingComponent(props, ctx) {
      var _this;

      _this = _Component.call(this, props, ctx) || this;
      _this.updateScrolling = (0, _lodash.default)(function (coords) {
        var _this$container$getBo = _this.container.getBoundingClientRect(),
            x = _this$container$getBo.left,
            y = _this$container$getBo.top,
            w = _this$container$getBo.width,
            h = _this$container$getBo.height;

        var box = {
          x: x,
          y: y,
          w: w,
          h: h
        }; // calculate strength

        _this.scaleX = _this.props.horizontalStrength(box, coords);
        _this.scaleY = _this.props.verticalStrength(box, coords); // start scrolling if we need to

        if (!_this.frame && (_this.scaleX || _this.scaleY)) {
          _this.startScrolling();
        }
      }, 100, {
        trailing: false
      });
      _this.scaleX = 0;
      _this.scaleY = 0;
      _this.frame = null;
      return _this;
    }

    var _proto = ScrollingComponent.prototype;

    _proto.componentDidMount = function componentDidMount() {
      this.container = (0, _reactDom.findDOMNode)(this.wrappedInstance);
    };

    _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
      if (prevProps.isOver && !this.props.isOver) {
        this.stopScrolling();
      }
    };

    _proto.componentWillUnmount = function componentWillUnmount() {
      this.stopScrolling();
    }; // Update scaleX and scaleY every 100ms or so
    // and start scrolling if necessary


    _proto.startScrolling = function startScrolling() {
      var _this2 = this;

      var tick = function tick() {
        var scaleX = _this2.scaleX,
            scaleY = _this2.scaleY,
            container = _this2.container;
        var _this2$props = _this2.props,
            strengthMultiplier = _this2$props.strengthMultiplier,
            onScrollChange = _this2$props.onScrollChange; // stop scrolling if there's nothing to do

        if (strengthMultiplier === 0 || scaleX + scaleY === 0) {
          _this2.stopScrolling();

          return;
        }

        var scrollLeft = container.scrollLeft,
            scrollTop = container.scrollTop,
            scrollWidth = container.scrollWidth,
            scrollHeight = container.scrollHeight,
            clientWidth = container.clientWidth,
            clientHeight = container.clientHeight;
        var newLeft = scaleX ? container.scrollLeft = (0, _util.intBetween)(0, scrollWidth - clientWidth, scrollLeft + scaleX * strengthMultiplier) : scrollLeft;
        var newTop = scaleY ? container.scrollTop = (0, _util.intBetween)(0, scrollHeight - clientHeight, scrollTop + scaleY * strengthMultiplier) : scrollTop;

        if (newLeft !== scrollLeft || newTop !== scrollTop) {
          onScrollChange(newLeft, newTop);
        }

        _this2.frame = (0, _raf.default)(tick);
      };

      tick();
    };

    _proto.stopScrolling = function stopScrolling() {
      this.scaleX = 0;
      this.scaleY = 0;

      if (this.frame) {
        _raf.default.cancel(this.frame);

        this.frame = null;
      }
    };

    _proto.render = function render() {
      var _this3 = this;

      var _this$props = this.props,
          strengthMultiplier = _this$props.strengthMultiplier,
          verticalStrength = _this$props.verticalStrength,
          horizontalStrength = _this$props.horizontalStrength,
          onScrollChange = _this$props.onScrollChange,
          forwardedRef = _this$props.forwardedRef,
          connectDropTarget = _this$props.connectDropTarget,
          isOver = _this$props.isOver,
          props = _objectWithoutPropertiesLoose(_this$props, ["strengthMultiplier", "verticalStrength", "horizontalStrength", "onScrollChange", "forwardedRef", "connectDropTarget", "isOver"]);

      return connectDropTarget(_react.default.createElement("div", null, _react.default.createElement(WrappedComponent, _extends({}, props, {
        ref: function ref(_ref3) {
          _this3.wrappedInstance = _ref3;

          if (forwardedRef) {
            forwardedRef(_ref3);
          }
        }
      }))));
    };

    return ScrollingComponent;
  }(_react.Component);

  ScrollingComponent.displayName = "Scrolling(" + (0, _reactDisplayName.default)(WrappedComponent) + ")";
  ScrollingComponent.propTypes = {
    onScrollChange: _propTypes.default.func,
    verticalStrength: _propTypes.default.func,
    horizontalStrength: _propTypes.default.func,
    strengthMultiplier: _propTypes.default.number
  };
  ScrollingComponent.defaultProps = {
    onScrollChange: _util.noop,
    verticalStrength: defaultVerticalStrength,
    horizontalStrength: defaultHorizontalStrength,
    strengthMultiplier: 30
  };
  var enhance = (0, _reactDnd.DropTarget)(itemTypes, {
    canDrop: function canDrop() {
      return false;
    },
    hover: function hover(props, monitor, component) {
      component.updateScrolling(monitor.getClientOffset());
    }
  }, function (connect, monitor) {
    return {
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    };
  });
  var HoistedDroppableScrollingComponent = (0, _hoistNonReactStatics.default)(enhance(ScrollingComponent), WrappedComponent);

  var forwardRef = function forwardRef(props, ref) {
    return _react.default.createElement(HoistedDroppableScrollingComponent, _extends({}, props, {
      forwardedRef: ref
    }));
  };

  forwardRef.displayName = (0, _reactDisplayName.default)(WrappedComponent);
  return _react.default.forwardRef(forwardRef);
}