import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table } from '@/types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlanRef: React.RefObject<HTMLDivElement>;
  tables: Table[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  floorPlanRef,
  tables
}) => {
  const { t } = useTranslation();
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
  const [exportQuality, setExportQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [exportScale, setExportScale] = useState(2);
  const [exportName, setExportName] = useState('seating-chart');
  const [isExporting, setIsExporting] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Generate a preview when the dialog opens
  React.useEffect(() => {
    if (open && floorPlanRef.current) {
      generatePreview();
    }
    
    return () => {
      // Clean up preview URL when dialog closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [open]);
  
  const generatePreview = async () => {
    if (!floorPlanRef.current) return;
    
    try {
      // Create a clone of the floor plan for preview
      const canvas = await html2canvas(floorPlanRef.current, {
        scale: 0.5, // Lower scale for preview
        backgroundColor: 'white',
        logging: false,
      });
      
      // Convert to data URL for preview
      const dataUrl = canvas.toDataURL('image/png', 0.7);
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error(t('seating.failedToGeneratePreview'));
    }
  };
  
  const handleExport = async () => {
    if (!floorPlanRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Get quality multiplier
      const qualityMultiplier = exportQuality === 'high' ? 1 : 
                               exportQuality === 'medium' ? 0.8 : 0.6;
      
      // Create canvas from the floor plan
      const canvas = await html2canvas(floorPlanRef.current, {
        scale: exportScale,
        backgroundColor: 'white',
        logging: false,
      });
      
      if (exportFormat === 'pdf') {
        // Export as PDF
        const imgData = canvas.toDataURL('image/jpeg', qualityMultiplier);
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${exportName}.pdf`);
      } else {
        // Export as image (PNG or JPG)
        const mimeType = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, qualityMultiplier);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${exportName}.${exportFormat}`;
        link.href = dataUrl;
        link.click();
      }
      
      toast.success(t('seating.exportedSuccess', { format: exportFormat.toUpperCase() }));
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error(t('seating.failedToExport'));
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Seating Chart</DialogTitle>
          <DialogDescription>
            Export your seating chart as an image or PDF
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="options">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="options">Export Options</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="options" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select 
                  value={exportFormat} 
                  onValueChange={(value: any) => setExportFormat(value)}
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG Image</SelectItem>
                    <SelectItem value="jpg">JPG Image</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Select 
                  value={exportQuality} 
                  onValueChange={(value: any) => setExportQuality(value)}
                >
                  <SelectTrigger id="quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="name">File Name</Label>
              <Input 
                id="name" 
                value={exportName} 
                onChange={(e) => setExportName(e.target.value)}
                placeholder="seating-chart"
              />
            </div>
            
            <div>
              <Label>Chart Information</Label>
              <div className="text-sm text-gray-500 mt-1">
                <p>• {tables.length} tables in the seating chart</p>
                <p>• Export will include all visible elements</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="pt-4">
            <div className="border rounded-md p-2 bg-gray-50 overflow-hidden">
              <div className="text-sm text-gray-500 mb-2">Preview:</div>
              <div ref={previewRef} className="flex justify-center">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Seating Chart Preview" 
                    className="max-w-full max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[200px] w-full">
                    <p className="text-gray-400">Loading preview...</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || !floorPlanRef.current}
          >
            {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
