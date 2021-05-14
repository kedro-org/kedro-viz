import { useState, useRef } from 'react';

/**
 * A design agnostic user resizable split panel controller.
 * @param {function} children A `function(props)` for rendering the panels and handle (see implementation for props)
 * @param {?number} [splitDefault=0.65] A number [0...1] as the default % split position
 * @param {?number} [splitMin=0] A number [0...1] as the minimum % split position
 * @param {?number} [splitMax=1] A number [0...1] as the maximum % split position
 * @param {?number} [keyboardStep=0.025] A number [0...1] as the % step to move split when using keyboard
 * @param {?string} [orientation='vertical'] Only 'vertical' currently supported.
 * @return {object} The rendered children
 **/
export const SplitPanel = ({
  splitDefault = 0.65,
  splitMin = 0,
  splitMax = 1,
  keyboardStep = 0.025,
  orientation = 'vertical',
  children,
}) => {
  const containerRef = useRef();
  const handleRef = useRef();

  const getRects = () => ({
    container: containerRef.current?.getBoundingClientRect(),
    handle: handleRef.current?.getBoundingClientRect(),
  });

  const clampSplit = (value) => {
    const rects = getRects();
    const handleSize = rects.handle
      ? rects.handle.height / rects.container.height
      : 0;
    return Math.max(
      splitMin,
      Math.min(splitMax - handleSize, value)
    );
  };

  const [isResizing, setIsResizing] = useState(false);
  const [split, setSplit] = useState(clampSplit(splitDefault));

  const onMouse = (event) => {
    if (event.type === 'mouseup') {
      setIsResizing(false);
      return;
    }

    if (isResizing || event.type === 'mousedown') {
      const rects = getRects();

      const mouseOffsetVertical =
        (event.clientY - rects.container.top - rects.handle.height * 0.5) /
        rects.container.height;

      setIsResizing(true);
      setSplit(clampSplit(mouseOffsetVertical));

      event.preventDefault();
    }
  };

  const onKey = (event) => {
    const keyboardOffset =
      {
        ArrowUp: -keyboardStep,
        ArrowLeft: -keyboardStep,
        ArrowDown: keyboardStep,
        ArrowRight: keyboardStep,
      }[event.key] || 0;

    if (keyboardOffset) {
      setSplit(clampSplit(split + keyboardOffset));
      event.preventDefault();
    }
  };

  return children({
    isResizing,
    split,
    props: {
      container: { ref: containerRef, onMouseMove: onMouse, onMouseUp: onMouse },
      panelA: { style: { height: split * 100 + '%' } },
      panelB: { style: { height: (1 - split) * 100 + '%' } },
      handle: {
        ref: handleRef,
        role: 'separator',
        'aria-orientation': orientation,
        tabIndex: '0',
        onMouseUp: onMouse,
        onMouseDown: onMouse,
        onKeyDown: onKey,
      },
    }
  });
};

export default SplitPanel;
