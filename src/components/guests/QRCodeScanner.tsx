import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, QrCode, Search, Camera, X, Check, AlertCircle } from "lucide-react";
import { QRCodeData, CheckInResult } from "@/types/guestCheckin";
import { checkInGuest } from "@/services/guestCheckinService";
import { Html5Qrcode } from "html5-qrcode";

interface QRCodeScannerProps {
  eventId: string;
  stationName: string;
  onCheckInSuccess?: (result: CheckInResult) => void;
  onCheckInError?: (message: string) => void;
}

const QRCodeScanner = ({ eventId, stationName, onCheckInSuccess, onCheckInError }: QRCodeScannerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"scan" | "manual">("scan");
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    // Clean up scanner on component unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(error => {
          console.error("Error stopping scanner:", error);
        });
      }
    };
  }, [isScanning]);

  const startScanner = async () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        handleScanSuccess,
        handleScanError
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError(t('guests.scannerError'));
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Stop the scanner immediately to prevent multiple scans
      await stopScanner();
      setIsProcessing(true);

      // Parse the QR code data
      const qrData: QRCodeData = JSON.parse(decodedText);
      
      if (!qrData || !qrData.id) {
        setError(t('guests.invalidQRCode'));
        setIsProcessing(false);
        return;
      }

      // Process the check-in
      if (qrData.type === 'guest') {
        const result = await checkInGuest(
          eventId,
          qrData.id,
          stationName,
          'qr'
        );

        setScanResult(result);
        
        if (result.success) {
          if (onCheckInSuccess) onCheckInSuccess(result);
        } else {
          if (onCheckInError) onCheckInError(result.message);
        }
      } else if (qrData.type === 'group') {
        // For group QR codes, we would need to show a list of guests in the group
        // and allow checking them in individually or all at once
        setError(t('guests.groupQRNotSupported'));
      } else {
        setError(t('guests.unknownQRType'));
      }
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError(t('guests.invalidQRCode'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (err: any) => {
    // We don't need to show errors for normal scanning operations
    // Only show errors if there's a critical issue
    if (err && err.name === "NotAllowedError") {
      setError(t('guests.cameraPermissionDenied'));
      setIsScanning(false);
    }
  };

  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setError(null);
    setScanResult(null);
    setIsProcessing(true);

    try {
      // In a real implementation, we would search for the guest by name
      // and then check them in
      setError(t('guests.manualSearchNotImplemented'));
    } catch (err) {
      console.error("Error searching for guest:", err);
      setError(t('guests.searchError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setSearchTerm("");
    if (activeTab === "scan") {
      startScanner();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('guests.checkInGuest')}</CardTitle>
        <CardDescription>{t('guests.scanQRCodeOrSearchManually')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "scan" | "manual")}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="scan" onClick={() => {
              if (activeTab !== "scan") {
                setScanResult(null);
                setError(null);
              }
            }}>
              <QrCode className="mr-2 h-4 w-4" />
              {t('guests.scanQR')}
            </TabsTrigger>
            <TabsTrigger value="manual" onClick={() => {
              if (activeTab !== "manual") {
                stopScanner();
                setScanResult(null);
                setError(null);
              }
            }}>
              <Search className="mr-2 h-4 w-4" />
              {t('guests.manualSearch')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            {!isScanning && !scanResult && !error && !isProcessing && (
              <div className="flex justify-center">
                <Button onClick={startScanner}>
                  <Camera className="mr-2 h-4 w-4" />
                  {t('guests.startScanner')}
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div id={scannerContainerId} className="w-full h-64 overflow-hidden rounded-lg"></div>
                <Button variant="outline" onClick={stopScanner} className="w-full">
                  <X className="mr-2 h-4 w-4" />
                  {t('common.cancel')}
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>{t('guests.processingCheckIn')}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder={t('guests.searchByName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSearch();
                }}
              />
              <Button onClick={handleManualSearch} disabled={isProcessing}>
                <Search className="mr-2 h-4 w-4" />
                {t('common.search')}
              </Button>
            </div>

            {isProcessing && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scanResult && (
          <div className="mt-4 space-y-4">
            <Alert variant={scanResult.success ? "default" : "destructive"}>
              {scanResult.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {scanResult.success ? t('guests.checkInSuccess') : t('guests.checkInFailed')}
              </AlertTitle>
              <AlertDescription>{scanResult.message}</AlertDescription>
            </Alert>

            {scanResult.success && scanResult.guest && (
              <div className="border rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('guests.guestName')}</p>
                  <p className="font-medium">{scanResult.guest.name}</p>
                </div>
                
                {scanResult.tableAssignment && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('guests.tableAssignment')}</p>
                    <p>{scanResult.tableAssignment}</p>
                  </div>
                )}
                
                {scanResult.mealPreference && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('guests.mealPreference')}</p>
                    <p>{scanResult.mealPreference}</p>
                  </div>
                )}
                
                {scanResult.specialAccommodations && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('guests.specialAccommodations')}</p>
                    <p>{scanResult.specialAccommodations}</p>
                  </div>
                )}
              </div>
            )}

            <Button onClick={resetScanner} className="w-full">
              {t('guests.scanAnother')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
