import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, AlertCircle, Download } from "lucide-react";
import { parseExcelFile, mapExcelRowsToGuests, standardColumnMapping } from "@/utils/excelImporter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Guest } from "@/types";
import * as XLSX from 'xlsx';

interface ImportGuestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

const ImportGuestsDialog = ({ open, onOpenChange, clientId }: ImportGuestsDialogProps) => {
  const { addGuest } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check if it's an Excel file
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls') && !selectedFile.name.endsWith('.csv')) {
        setError('Please select an Excel or CSV file');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setImportedCount(0);

    try {
      // Parse the Excel file
      const rows = await parseExcelFile(file);

      if (rows.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      // Map Excel rows to guest objects
      const guests = mapExcelRowsToGuests(rows, clientId, standardColumnMapping);

      // Add each guest to the database
      let successCount = 0;
      for (let i = 0; i < guests.length; i++) {
        try {
          await addGuest(guests[i]);
          successCount++;
          setUploadProgress(Math.round(((i + 1) / guests.length) * 100));
        } catch (error) {
          console.error(`Error adding guest ${guests[i].firstName} ${guests[i].lastName}:`, error);
        }
      }

      setImportedCount(successCount);
      setUploadProgress(100);
      setSuccess(true);

      // Close the dialog after a delay
      if (successCount > 0) {
        setTimeout(() => {
          onOpenChange(false);
          setFile(null);
          setUploadProgress(0);
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import guests. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setFile(null);
      setUploadProgress(0);
      setError(null);
      setSuccess(false);
    }
  };

  const downloadTemplateFile = () => {
    // Create a template Excel file with the correct headers
    const headers = Object.values(standardColumnMapping);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Guest List Template");

    // Generate the Excel file
    XLSX.writeFile(workbook, "guest_list_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Guests</DialogTitle>
          <DialogDescription>
            Import guests from an Excel or CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="file-upload">Select File</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplateFile}
                className="gap-1 text-xs"
              >
                <Download className="h-3 w-3" />
                Template
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: .xlsx, .xls, .csv
            </p>
            <div className="text-sm text-muted-foreground mt-2 p-2 border rounded-md">
              <h4 className="font-medium mb-1">Excel Format Tips:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>First Name and Last Name are required for each guest</li>
                <li>For couples, set "Is Couple" to "Yes" and provide partner details</li>
                <li>For children, set "Has Children" to "Yes" and list names separated by commas</li>
                <li>Example: Children Names: "John, Mary, Tom"</li>
                <li>Example: Children Ages: "5, 8, 10"</li>
              </ul>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2 border rounded">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {importedCount} {importedCount === 1 ? 'guest' : 'guests'} imported successfully!
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!file || isUploading}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportGuestsDialog;
