import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Set up the worker for PDF.js — load from locally installed pdfjs-dist instead of CDN
// (CDN doesn't host pdfjs-dist v4.x, causing a 404 that prevents PDF rendering)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  url: string;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, className }) => {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);
  };

  const goToNextPage = () => {
    setPageNumber(pageNumber + 1 >= numPages! ? numPages! : pageNumber + 1);
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(scale - 0.2 <= 0.4 ? 0.4 : scale - 0.2);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex justify-between w-full mb-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('documents.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages!}
          >
            {t('documents.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="flex items-center">
          <span className="mr-4">
            {t('documents.page')} {pageNumber} {t('documents.of')} {numPages}
          </span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="border rounded-md p-4 bg-white shadow-sm overflow-auto max-h-[70vh] w-full">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          }
          error={
            <div className="flex justify-center items-center h-64 text-red-500">
              {t('documents.errorLoadingPdf')}
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
