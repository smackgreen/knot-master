import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, onCancel }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set line style
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    // Handle window resize
    const handleResize = () => {
      const oldData = canvas.toDataURL('image/png');
      
      // Create a temporary image to hold the current signature
      const img = new Image();
      img.onload = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Reset line style after resize
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        // Draw the old signature on the resized canvas
        ctx.drawImage(img, 0, 0);
      };
      img.src = oldData;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasSignature(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch devices
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };
  
  const endDrawing = () => {
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };
  
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="border rounded-md p-1 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {t('contracts.signatureInstructions')}
      </p>
      <div className="flex justify-between">
        <Button variant="outline" onClick={clearCanvas} disabled={!hasSignature}>
          <Eraser className="mr-2 h-4 w-4" />
          {t('contracts.clearSignature')}
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={saveSignature} disabled={!hasSignature}>
            <Check className="mr-2 h-4 w-4" />
            {t('contracts.saveSignature')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
