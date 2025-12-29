import React, { useRef, useEffect, useState } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';

/**
 * iPad-optimized canvas wrapper component with:
 * - Apple Pencil/stylus pressure sensitivity support
 * - Palm rejection (ignores touch when stylus is active)
 * - Optimized touch event handling
 * 
 * @param {Object} props - Component props (passed through to ReactSketchCanvas)
 * @returns {JSX.Element} Optimized canvas component
 */
const IpadOptimizedCanvas = React.forwardRef(({ 
  strokeWidth: baseStrokeWidth = 4,
  strokeColor,
  eraserWidth,
  canvasColor,
  style,
  width,
  height,
  ...otherProps 
}, forwardedRef) => {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [isStylusActive, setIsStylusActive] = useState(false);
  const [currentPressure, setCurrentPressure] = useState(1.0);
  const [dynamicStrokeWidth, setDynamicStrokeWidth] = useState(baseStrokeWidth);
  
  // Track active pointers for palm rejection
  const activePointers = useRef(new Map());
  const stylusPointerId = useRef(null);
  const isStylusActiveRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    /**
     * Handle pointer down events
     * Detects stylus vs touch and implements palm rejection
     */
    const handlePointerDown = (e) => {
      const pointerType = e.pointerType;
      const pointerId = e.pointerId;
      
      // Detect stylus/pen
      if (pointerType === 'pen' || pointerType === 'stylus') {
        setIsStylusActive(true);
        isStylusActiveRef.current = true;
        stylusPointerId.current = pointerId;
        activePointers.current.set(pointerId, {
          type: 'pen',
          pressure: e.pressure || 1.0,
        });
        
        // Update stroke width based on pressure
        const pressure = e.pressure || 1.0;
        setCurrentPressure(pressure);
        // Pressure range: 0.0 to 1.0, map to stroke width variation
        // Base width * (0.5 + pressure * 1.5) gives range from 0.5x to 2x
        const pressureMultiplier = 0.5 + (pressure * 1.5);
        setDynamicStrokeWidth(Math.max(1, baseStrokeWidth * pressureMultiplier));
        
        // Allow the event to propagate to the canvas
        return true;
      } 
      // Touch input - implement palm rejection
      else if (pointerType === 'touch') {
        // If stylus is active, ignore touch events (palm rejection)
        if (isStylusActiveRef.current || stylusPointerId.current !== null) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        // Track touch pointer
        activePointers.current.set(pointerId, {
          type: 'touch',
          pressure: 1.0,
        });
      }
      
      return true;
    };

    /**
     * Handle pointer move events
     * Updates pressure sensitivity for stylus
     */
    const handlePointerMove = (e) => {
      const pointerType = e.pointerType;
      const pointerId = e.pointerId;
      
      // Update pressure for active stylus
      if (pointerType === 'pen' || pointerType === 'stylus') {
        if (pointerId === stylusPointerId.current) {
          const pressure = e.pressure || 1.0;
          setCurrentPressure(pressure);
          const pressureMultiplier = 0.5 + (pressure * 1.5);
          setDynamicStrokeWidth(Math.max(1, baseStrokeWidth * pressureMultiplier));
          
          // Update canvas stroke width dynamically if possible
          if (canvasRef.current) {
            // Note: react-sketch-canvas doesn't support dynamic stroke width during drawing
            // This would require a custom implementation, but we set it for the next stroke
          }
        }
      }
      // Palm rejection for touch during stylus use
      else if (pointerType === 'touch') {
        if (isStylusActiveRef.current || stylusPointerId.current !== null) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    /**
     * Handle pointer up events
     * Clean up pointer tracking
     */
    const handlePointerUp = (e) => {
      const pointerId = e.pointerId;
      const pointer = activePointers.current.get(pointerId);
      
      if (pointer && pointer.type === 'pen') {
        if (pointerId === stylusPointerId.current) {
          setIsStylusActive(false);
          isStylusActiveRef.current = false;
          stylusPointerId.current = null;
          setCurrentPressure(1.0);
          setDynamicStrokeWidth(baseStrokeWidth);
        }
      }
      
      activePointers.current.delete(pointerId);
    };

    /**
     * Handle pointer cancel events
     */
    const handlePointerCancel = (e) => {
      handlePointerUp(e);
    };

    // Add event listeners with capture phase for better control
    wrapper.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: false });
    wrapper.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false });
    wrapper.addEventListener('pointerup', handlePointerUp, { capture: true });
    wrapper.addEventListener('pointercancel', handlePointerCancel, { capture: true });

    // Also handle touch events for additional palm rejection
    const handleTouchStart = (e) => {
      // If stylus is active, prevent all touch events
      if (isStylusActiveRef.current || stylusPointerId.current !== null) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleTouchMove = (e) => {
      if (isStylusActiveRef.current || stylusPointerId.current !== null) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      wrapper.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      wrapper.removeEventListener('pointermove', handlePointerMove, { capture: true });
      wrapper.removeEventListener('pointerup', handlePointerUp, { capture: true });
      wrapper.removeEventListener('pointercancel', handlePointerCancel, { capture: true });
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
    };
  }, [baseStrokeWidth]);

  // Update stroke width when baseStrokeWidth changes
  useEffect(() => {
    if (!isStylusActive) {
      setDynamicStrokeWidth(baseStrokeWidth);
    }
  }, [baseStrokeWidth, isStylusActive]);

  return (
    <div 
      ref={wrapperRef}
      style={{
        position: 'relative',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <ReactSketchCanvas
        ref={(node) => {
          canvasRef.current = node;
          // Forward ref to parent component if provided
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        style={style}
        width={width}
        height={height}
        strokeWidth={dynamicStrokeWidth}
        strokeColor={strokeColor}
        eraserWidth={eraserWidth || dynamicStrokeWidth}
        canvasColor={canvasColor}
        {...otherProps}
      />
      {/* Optional: Show pressure indicator (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && isStylusActive && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          Pressure: {(currentPressure * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
});

IpadOptimizedCanvas.displayName = 'IpadOptimizedCanvas';

export default IpadOptimizedCanvas;

