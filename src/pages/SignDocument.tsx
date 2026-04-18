import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, SignatureRequest } from '@/types';
import { getSignatureRequestByToken, getDocumentById } from '@/services/documentService';
import { getSignedUrl } from '@/services/storageService';
import { useToast } from '@/components/ui/use-toast';
import { verifySignatureRequest } from '@/services/signatureService';

import { Button } from '@/components/ui/button';
import PDFViewer from '@/components/documents/PDFViewer';
import SignaturePad from '@/components/documents/SignatureCanvas';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { createElectronicSignature } from '@/services/documentService';
import SMSVerification from '@/components/signatures/SMSVerification';

const SignDocument: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number>(0);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [step, setStep] = useState<'verify' | 'review' | 'sign' | 'success'>('verify');
  const [error, setError] = useState<string | null>(null);
  const [signedDocuments, setSignedDocuments] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      fetchSignatureRequest();
    } else {
      setError(t('documents.invalidToken'));
      setIsLoading(false);
    }
  }, [token]);

  const fetchSignatureRequest = async () => {
    try {
      const request = await verifySignatureRequest(token!);
      if (!request) {
        setError(t('signatures.requestNotFound'));
        setIsLoading(false);
        return;
      }

      setSignatureRequest(request);
      setName(request.recipientName);
      setEmail(request.recipientEmail);
      setDocuments(request.documents);

      // Get signed URLs for all documents
      const urls = await Promise.all(
        request.documents.map(doc => getSignedUrl(doc.filePath))
      );

      setPdfUrls(urls.filter(url => url !== null) as string[]);

      // If the request has a phone number, start with SMS verification
      // Otherwise, go directly to review step
      if (request.recipientPhone) {
        setStep('verify');
      } else {
        setStep('review');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching signature request:', error);
      setError(t('signatures.errorLoadingRequest'));
      setIsLoading(false);
    }
  };

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
  };

  const handleVerificationSuccess = () => {
    setStep('review');
  };

  const handleReviewContinue = () => {
    if (!name || !email || !consent) {
      toast({
        title: t('signatures.formIncomplete'),
        description: t('signatures.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setStep('sign');
  };

  const handleSign = async () => {
    if (!signatureData) {
      toast({
        title: t('signatures.signatureRequired'),
        description: t('signatures.pleaseDrawSignature'),
        variant: 'destructive',
      });
      return;
    }

    if (!documents.length || !signatureRequest) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get IP address (in a real app, you might want to use a service for this)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      const currentDocument = documents[currentDocumentIndex];

      const result = await createElectronicSignature(
        currentDocument.id,
        name,
        email,
        signatureRequest.recipientRole,
        signatureData,
        ipAddress
      );

      if (result) {
        // Add document to signed documents
        setSignedDocuments(prev => [...prev, currentDocument.id]);

        // Check if there are more documents to sign
        if (currentDocumentIndex < documents.length - 1) {
          // Move to the next document
          setCurrentDocumentIndex(prev => prev + 1);
          setSignatureData(null);
          toast({
            title: t('signatures.documentSigned'),
            description: t('signatures.continueWithNextDocument'),
          });
        } else {
          // All documents signed
          toast({
            title: t('signatures.allDocumentsSigned'),
            description: t('signatures.signatureSuccessMessage'),
          });
          setStep('success');
        }
      } else {
        throw new Error('Failed to create signature');
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        title: t('signatures.signatureError'),
        description: t('signatures.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{t('signatures.error')}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/')} className="w-full">
                {t('common.backToHome')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    // Redirect to the signature success page
    navigate('/signature-success');
    return null;
  }

  if (step === 'verify' && signatureRequest?.recipientPhone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle>{t('signatures.verifyIdentity')}</CardTitle>
              <CardDescription>
                {t('signatures.verifyIdentityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SMSVerification
                phoneNumber={signatureRequest.recipientPhone}
                onVerificationSuccess={handleVerificationSuccess}
                onCancel={() => navigate('/')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentDocument = documents[currentDocumentIndex];
  const currentPdfUrl = pdfUrls[currentDocumentIndex];

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {step === 'review' ? t('signatures.reviewDocument') : t('signatures.signDocument')}
        </h1>
        <p className="text-muted-foreground">
          {currentDocument?.name} ({currentDocumentIndex + 1}/{documents.length})
        </p>
      </div>

      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('signatures.reviewInformation')}</CardTitle>
                <CardDescription>
                  {t('signatures.reviewDocumentDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('signatures.fullName')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('signatures.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                  />
                  <Label htmlFor="consent" className="text-sm">
                    {t('signatures.consentText')}
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate('/')}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleReviewContinue}>
                  {t('signatures.continueToSign')}
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="h-[600px]">
            {currentPdfUrl && <PDFViewer url={currentPdfUrl} />}
          </div>
        </div>
      )}

      {step === 'sign' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('signatures.drawSignature')}</CardTitle>
                <CardDescription>
                  {t('signatures.drawSignatureDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignaturePad onSave={handleSignatureSave} />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('review')}>
                  {t('signatures.back')}
                </Button>
                <Button onClick={handleSign} disabled={!signatureData || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('signatures.sign')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="h-[600px]">
            {currentPdfUrl && <PDFViewer url={currentPdfUrl} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignDocument;
