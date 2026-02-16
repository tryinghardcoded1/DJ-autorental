import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  error?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onChange, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas with high DPI support
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Make it visually fill the positioned parent
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Scale all drawing operations by the dpr, so you don't have to worry about it in your draw loop
        ctx.scale(dpr, dpr);
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; // slate-900
      }
    }
  };

  useEffect(() => {
    initCanvas();
    
    // Handle window resize (e.g. rotation on mobile)
    const handleResize = () => {
        // Note: Resizing clears the canvas. In a prod app, we might want to debounce this 
        // or redraw the paths. For now, we accept it clears to maintain correct aspect ratio.
        initCanvas();
        setIsEmpty(true);
        onChange(null);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      if (isEmpty) setIsEmpty(false);
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current && !isEmpty) {
      onChange(canvasRef.current.toDataURL());
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.preventDefault(); 
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      // Clear considering the transform
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      setIsEmpty(true);
      onChange(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
        <button 
          type="button"
          onClick={clear}
          className="text-xs text-red-600 flex items-center hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          <Eraser size={14} className="mr-1" />
          Clear
        </button>
      </div>
      <div 
        ref={containerRef}
        className={`relative w-full h-40 bg-white border-2 rounded-lg overflow-hidden touch-none select-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        {isEmpty && !isDrawing && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-300 select-none">
                <span className="flex items-center gap-2 text-xl italic opacity-50">
                    Sign Here
                    <PenTool size={20} />
                </span>
             </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">Sign above using your finger or mouse.</p>
    </div>
  );
};