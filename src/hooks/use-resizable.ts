import { useRef, useEffect, useState } from 'react';

interface UseResizableOptions {
  direction?: 'horizontal' | 'vertical' | 'both';
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  onResizeStart?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

interface Size {
  width: number;
  height: number;
}

export function useResizable({
  direction = 'both',
  minWidth = 200,
  minHeight = 100,
  maxWidth = Infinity,
  maxHeight = Infinity,
  aspectRatio,
  onResizeStart,
  onResize,
  onResizeEnd,
}: UseResizableOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [initialSize, setInitialSize] = useState<Size>({ width: 0, height: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    let currentSize = { width: 0, height: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      // Only trigger on the resize handle
      const target = e.target as HTMLElement;
      if (!target.classList.contains('resize-handle')) return;

      e.preventDefault();
      setIsResizing(true);
      onResizeStart?.();

      const rect = element.getBoundingClientRect();
      setInitialSize({ width: rect.width, height: rect.height });
      setInitialPosition({ x: e.clientX, y: e.clientY });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - initialPosition.x;
        const deltaY = e.clientY - initialPosition.y;

        let newWidth = initialSize.width;
        let newHeight = initialSize.height;

        if (direction === 'horizontal' || direction === 'both') {
          newWidth = Math.max(minWidth, Math.min(maxWidth, initialSize.width + deltaX));
        }

        if (direction === 'vertical' || direction === 'both') {
          newHeight = Math.max(minHeight, Math.min(maxHeight, initialSize.height + deltaY));
        }

        if (aspectRatio) {
          if (deltaX > deltaY) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        currentSize = { width: newWidth, height: newHeight };
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;

        onResize?.(currentSize);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        onResizeEnd?.(currentSize);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    element.addEventListener('mousedown', handleMouseDown);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
    };
  }, [
    direction,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    aspectRatio,
    onResizeStart,
    onResize,
    onResizeEnd,
    isResizing,
    initialSize,
    initialPosition,
  ]);

  const style = {
    position: 'relative' as const,
    userSelect: isResizing ? 'none' as const : 'auto' as const,
  };

  return { ref, style, isResizing };
}