import React from 'react';

interface ResizerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

export const Resizer: React.FC<ResizerProps> = ({ direction, onResize }) => {
  const [isResizing, setIsResizing] = React.useState(false);
  const lastPosRef = React.useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    lastPosRef.current = direction === 'vertical' ? e.clientX : e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = direction === 'vertical' ? moveEvent.clientX : moveEvent.clientY;
      const delta = currentPos - lastPosRef.current;
      lastPosRef.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`resizer-${direction} ${isResizing ? 'resizing' : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
    />
  );
};
