import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import throttle from 'lodash.throttle';
import raf from 'raf';
import getDisplayName from 'react-display-name';
import hoist from 'hoist-non-react-statics';
import { DropTarget } from 'react-dnd';
import { noop, intBetween } from './util';

const DEFAULT_BUFFER = 150;

export function createHorizontalStrength(_buffer) {
  return function defaultHorizontalStrength({ x, w, y, h }, point) {
    const buffer = Math.min(w / 2, _buffer);
    const inRange = point.x >= x && point.x <= x + w;
    const inBox = inRange && point.y >= y && point.y <= y + h;

    if (inBox) {
      if (point.x < x + buffer) {
        return (point.x - x - buffer) / buffer;
      }
      if (point.x > x + w - buffer) {
        return -(x + w - point.x - buffer) / buffer;
      }
    }

    return 0;
  };
}

export function createVerticalStrength(_buffer) {
  return function defaultVerticalStrength({ y, h, x, w }, point) {
    const buffer = Math.min(h / 2, _buffer);
    const inRange = point.y >= y && point.y <= y + h;
    const inBox = inRange && point.x >= x && point.x <= x + w;

    if (inBox) {
      if (point.y < y + buffer) {
        return (point.y - y - buffer) / buffer;
      }
      if (point.y > y + h - buffer) {
        return -(y + h - point.y - buffer) / buffer;
      }
    }

    return 0;
  };
}

export const defaultHorizontalStrength = createHorizontalStrength(
  DEFAULT_BUFFER
);

export const defaultVerticalStrength = createVerticalStrength(DEFAULT_BUFFER);

export default function createScrollingComponent(WrappedComponent, itemTypes) {
  class ScrollingComponent extends Component {
    static displayName = `Scrolling(${getDisplayName(WrappedComponent)})`;

    static propTypes = {
      onScrollChange: PropTypes.func,
      verticalStrength: PropTypes.func,
      horizontalStrength: PropTypes.func,
      strengthMultiplier: PropTypes.number,
    };

    static defaultProps = {
      onScrollChange: noop,
      verticalStrength: defaultVerticalStrength,
      horizontalStrength: defaultHorizontalStrength,
      strengthMultiplier: 30,
    };

    constructor(props, ctx) {
      super(props, ctx);

      this.scaleX = 0;
      this.scaleY = 0;
      this.frame = null;

      this.updateScrolling = throttle(this.updateScrolling, 100, {
        trailing: false,
      });
    }

    componentDidMount() {
      this.container = findDOMNode(this.wrappedInstance);
    }

    componentDidUpdate(prevProps) {
      if (prevProps.isOver && !this.props.isOver) {
        this.stopScrolling();
      }
    }

    componentWillUnmount() {
      this.stopScrolling();
    }

    // Update scaleX and scaleY every 100ms or so
    // and start scrolling if necessary
    updateScrolling(coords) {
      const {
        left: x,
        top: y,
        width: w,
        height: h,
      } = this.container.getBoundingClientRect();
      const box = { x, y, w, h };

      // calculate strength
      this.scaleX = this.props.horizontalStrength(box, coords);
      this.scaleY = this.props.verticalStrength(box, coords);

      // start scrolling if we need to
      if (!this.frame && (this.scaleX || this.scaleY)) {
        this.startScrolling();
      }
    }

    startScrolling() {
      const tick = () => {
        const { scaleX, scaleY, container } = this;
        const { strengthMultiplier, onScrollChange } = this.props;

        // stop scrolling if there's nothing to do
        if (strengthMultiplier === 0 || scaleX + scaleY === 0) {
          this.stopScrolling();
          return;
        }

        const {
          scrollLeft,
          scrollTop,
          scrollWidth,
          scrollHeight,
          clientWidth,
          clientHeight,
        } = container;

        const newLeft = scaleX
          ? (container.scrollLeft = intBetween(
              0,
              scrollWidth - clientWidth,
              scrollLeft + scaleX * strengthMultiplier
            ))
          : scrollLeft;

        const newTop = scaleY
          ? (container.scrollTop = intBetween(
              0,
              scrollHeight - clientHeight,
              scrollTop + scaleY * strengthMultiplier
            ))
          : scrollTop;

        if (newLeft !== scrollLeft || newTop !== scrollTop) {
          onScrollChange(newLeft, newTop);
        }
        this.frame = raf(tick);
      };

      tick();
    }

    stopScrolling() {
      this.scaleX = 0;
      this.scaleY = 0;

      if (this.frame) {
        raf.cancel(this.frame);
        this.frame = null;
      }
    }

    render() {
      const {
        // not passing down these props
        strengthMultiplier,
        verticalStrength,
        horizontalStrength,
        onScrollChange,

        forwardedRef,
        connectDropTarget,
        isOver,

        ...props
      } = this.props;

      return connectDropTarget(
        <div>
          <WrappedComponent
            {...props}
            ref={ref => {
              this.wrappedInstance = ref;

              if (forwardedRef) {
                forwardedRef(ref);
              }
            }}
          />
        </div>
      );
    }
  }

  const enhance = DropTarget(
    itemTypes,
    {
      canDrop() {
        return false;
      },
      hover(props, monitor, component) {
        component.updateScrolling(monitor.getClientOffset());
      },
    },
    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver(),
    })
  );

  const HoistedDroppableScrollingComponent = hoist(
    enhance(ScrollingComponent),
    WrappedComponent
  );

  const forwardRef = (props, ref) => (
    <HoistedDroppableScrollingComponent {...props} forwardedRef={ref} />
  );

  forwardRef.displayName = getDisplayName(WrappedComponent);
  return React.forwardRef(forwardRef);
}
