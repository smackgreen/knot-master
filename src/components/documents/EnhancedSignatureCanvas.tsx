/**
 * Enhanced Signature Canvas Component
 * 
 * A dual-mode signature pad that supports:
 * - Mouse drawing (desktop)
 * - Touch drawing (mobile/tablet)
 * - Type-to-sign with cursive font rendering
 * 
 * The component renders a canvas and converts the signature to a
 * base64 PNG string upon submission, ready for embedding into PDF documents.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pen, Type, Eraser, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EnhancedSignatureCanvasProps {
  /** Callback fired when the signature is saved as a base64 PNG string */
  onSave: (signatureData: string) => void;
  /** Optional CSS class name */
  className?: string;
  /** Default signer name for type-to-sign mode */
  defaultName?: string;
  /** Whether the save button should be disabled externally */
  disabled?: boolean;
}

const EnhancedSignatureCanvas: React.FC<EnhancedSignatureCanvasProps> = ({
  onSave,
  className,
  defaultName = '',
  disabled = false,
}) => {
  const { t } = useTranslation();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);
  const [typedName, setTypedName] = useState<string>(defaultName);
  const [typedSignatureGenerated, setTypedSignatureGenerated] = useState<boolean>(false);

  // Load Google Fonts for cursive rendering (deduplicated)
  useEffect(() => {
    const linkId = 'google-fonts-cursive';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Sacramento&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Responsive canvas sizing
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasWidth(width > 500 ? 500 : width - 40);
      }
    };

    updateCanvasWidth();
    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, []);

  // Regenerate typed signature when name changes
  useEffect(() => {
    if (mode === 'type' && typedName.trim()) {
      renderTypedSignature(typedName);
      setTypedSignatureGenerated(true);
      setIsEmpty(false);
    } else if (mode === 'type' && !typedName.trim()) {
      clearTypedSignature();
      setTypedSignatureGenerated(false);
      setIsEmpty(true);
    }
  }, [typedName, mode, canvasWidth]);

  /**
   * Render a typed name as a cursive signature on the canvas.
   * Uses a custom font rendering approach with canvas 2D context.
   */
  const renderTypedSignature = useCallback((name: string) => {
    const canvas = typeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up the cursive font
    const fontSize = Math.min(48, canvas.width / (name.length * 0.6));
    ctx.font = `${fontSize}px "Dancing Script", "Great Vibes", "Sacramento", cursive`;
    ctx.fillStyle = '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add slight rotation for a natural handwritten look
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-0.02); // Slight tilt
    
    // Draw the text with a slight shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(name, 0, 0);
    ctx.restore();

    // Add a subtle underline flourish
    const textWidth = ctx.measureText(name).width;
    const startX = (canvas.width - textWidth) / 2;
    const endX = (canvas.width + textWidth) / 2;
    const lineY = canvas.height / 2 + fontSize / 2 + 5;

    ctx.beginPath();
    ctx.moveTo(startX - 10, lineY);
    ctx.lineTo(endX + 10, lineY);
    ctx.strokeStyle = 'rgba(26, 26, 46, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  // Clear handlers
  const clearDrawn = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const clearTypedSignature = () => {
    const canvas = typeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const clearTyped = () => {
    setTypedName('');
    clearTypedSignature();
    setTypedSignatureGenerated(false);
    setIsEmpty(true);
  };

  // Save handler
  const save = () => {
    if (isEmpty) return;

    let dataURL: string | null = null;

    if (mode === 'draw') {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        dataURL = sigCanvas.current.toDataURL('image/png');
      }
    } else if (mode === 'type' && typedSignatureGenerated) {
      const canvas = typeCanvasRef.current;
      if (canvas) {
        dataURL = canvas.toDataURL('image/png');
      }
    }

    if (dataURL) {
      onSave(dataURL);
    }
  };

  // Mode change handler
  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'draw' | 'type');
    setIsEmpty(true);
    
    if (newMode === 'draw') {
      sigCanvas.current?.clear();
    } else {
      clearTypedSignature();
      if (typedName.trim()) {
        renderTypedSignature(typedName);
        setTypedSignatureGenerated(true);
        setIsEmpty(false);
      }
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col items-center ${className || ''}`}>
      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={handleModeChange} className="w-full max-w-[540px]">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            {t('documents.drawSignature', 'Draw Signature')}
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            {t('documents.typeSignature', 'Type Signature')}
          </TabsTrigger>
        </TabsList>

        {/* Draw Mode */}
        <TabsContent value="draw">
          <div className="border rounded-md p-4 bg-white shadow-sm">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                width: canvasWidth,
                height: 200,
                className: 'signature-canvas border border-gray-200 rounded-md touch-none',
              }}
              onBegin={() => setIsEmpty(false)}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('documents.drawInstructions', 'Use your mouse or finger to draw your signature')}
          </p>
        </TabsContent>

        {/* Type Mode */}
        <TabsContent value="type">
          <div className="space-y-3">
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={t('documents.typeYourName', 'Type your full name')}
              className="text-center text-lg"
              maxLength={50}
            />
            <div className="border rounded-md p-4 bg-white shadow-sm">
              <canvas
                ref={typeCanvasRef}
                width={canvasWidth}
                height={200}
                className="border border-gray-200 rounded-md w-full"
                style={{ 
                  fontFamily: '"Dancing Script", "Great Vibes", "Sacramento", cursive',
                  maxWidth: '100%',
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t('documents.typeInstructions', 'Your name will be rendered in a cursive font as your signature')}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex space-x-4 mt-4">
        <Button variant="outline" onClick={mode === 'draw' ? clearDrawn : clearTyped}>
          <Eraser className="h-4 w-4 mr-2" />
          {t('documents.clear', 'Clear')}
        </Button>
        <Button onClick={save} disabled={isEmpty || disabled}>
          <Check className="h-4 w-4 mr-2" />
          {t('documents.saveSignature', 'Save Signature')}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedSignatureCanvas;
