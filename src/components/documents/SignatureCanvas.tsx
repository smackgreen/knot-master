import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  className?: string;
}

const SignaturePad: React.FC<SignatureCanvasProps> = ({ onSave, className }) => {
  const { t } = useTranslation();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(true);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCanvasWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasWidth(width > 500 ? 500 : width - 40);
      }
    };

    updateCanvasWidth();
    window.addEventListener('resize', updateCanvasWidth);

    return () => {
      window.removeEventListener('resize', updateCanvasWidth);
    };
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div ref={containerRef} className={`flex flex-col items-center ${className}`}>
      <div className="border rounded-md p-4 bg-white shadow-sm">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: canvasWidth,
            height: 200,
            className: 'signature-canvas border border-gray-300 rounded-md',
          }}
          onBegin={handleBegin}
        />
      </div>
      <div className="flex space-x-4 mt-4">
        <Button variant="outline" onClick={clear}>
          {t('documents.clear')}
        </Button>
        <Button onClick={save} disabled={isEmpty}>
          {t('documents.saveSignature')}
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
