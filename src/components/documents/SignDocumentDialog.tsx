/**
 * Sign Document Dialog (Enhanced)
 * 
 * Updated to use the EnhancedSignatureCanvas with draw + type-to-sign support.
 * After signing, triggers the dual-layer PDF finalization pipeline.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Document, SignerRole } from '@/types';
import { getSignedUrl } from '@/services/storageService';
import { createElectronicSignature } from '@/services/documentService';
import { finalizePdfDocument, isDocumentReadyForFinalization } from '@/services/pdfSigningService';
import { useToast } from '@/components/ui/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import PDFViewer from './PDFViewer';
import EnhancedSignatureCanvas from './EnhancedSignatureCanvas';

interface SignDocumentDialogProps {
  document: Document;
  signerRole: SignerRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignSuccess?: () => void;
}

const SignDocumentDialog: React.FC<SignDocumentDialogProps> = ({
  document,
  signerRole,
  open,
  onOpenChange,
  onSignSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [step, setStep] = useState<'review' | 'sign'>('review');

  // Form schema
  const formSchema = z.object({
    name: z.string().min(1, { message: t('documents.validation.nameRequired') }),
    email: z.string().email({ message: t('documents.validation.emailInvalid') }),
    consent: z.boolean().refine(val => val === true, {
      message: t('documents.validation.consentRequired'),
    }),
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      consent: false,
    },
  });

  // Load PDF when dialog opens
  React.useEffect(() => {
    if (open && document) {
      loadPdf();
    }
  }, [open, document]);

  const loadPdf = async () => {
    if (document) {
      const url = await getSignedUrl(document.filePath);
      if (url) {
        setPdfUrl(url);
      } else {
        toast({
          title: t('documents.errorLoadingDocument'),
          description: t('documents.tryAgainLater'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleSignatureSave = (data: string) => {
    setSignatureData(data);
  };

  /**
   * After signing, check if all parties have signed and trigger
   * the dual-layer PDF finalization pipeline if ready.
   */
  const triggerPdfFinalization = async (documentId: string) => {
    try {
      const { ready, missingRoles } = await isDocumentReadyForFinalization(documentId);
      
      if (ready) {
        setIsFinalizing(true);
        toast({
          title: t('documents.finalizingPdf', 'Finalizing signed PDF...'),
          description: t('documents.finalizingDescription', 'Applying visual and cryptographic signatures to your document.'),
        });

        const result = await finalizePdfDocument(documentId);
        
        if (result.success) {
          toast({
            title: t('documents.pdfFinalized', 'PDF finalized successfully'),
            description: t('documents.pdfFinalizedDescription', 'Your document has been signed and secured with a cryptographic signature.'),
          });
        } else {
          console.warn('PDF finalization failed:', result.error);
          // Don't show error to user - their signature was still recorded
        }
      } else {
        console.log(`Document not yet ready for finalization. Missing: ${missingRoles.join(', ')}`);
      }
    } catch (error) {
      console.error('Error during PDF finalization:', error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (step === 'review') {
      setStep('sign');
      return;
    }

    if (!signatureData) {
      toast({
        title: t('documents.signatureRequired'),
        description: t('documents.pleaseDrawSignature'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get IP address
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      const result = await createElectronicSignature(
        document.id,
        values.name,
        values.email,
        signerRole,
        signatureData,
        ipAddress
      );

      if (result) {
        toast({
          title: t('documents.signatureSuccess'),
          description: t('documents.documentSigned'),
        });
        
        // Trigger PDF finalization in the background
        triggerPdfFinalization(document.id);
        
        if (onSignSuccess) {
          onSignSuccess();
        }
        
        onOpenChange(false);
      } else {
        throw new Error('Failed to create signature');
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        title: t('documents.signatureError'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('documents.signDocument')}</DialogTitle>
          <DialogDescription>
            {step === 'review'
              ? t('documents.reviewDocumentDescription')
              : t('documents.drawSignatureDescription')}
          </DialogDescription>
        </DialogHeader>

        {step === 'review' ? (
          <>
            {pdfUrl ? (
              <PDFViewer url={pdfUrl} className="my-4" />
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('documents.fullName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('documents.email')}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {t('documents.consentText')}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.loading') : t('documents.continueToSign')}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <EnhancedSignatureCanvas
              onSave={handleSignatureSave}
              className="my-4"
              defaultName={form.getValues('name')}
            />

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep('review')}>
                {t('documents.back')}
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading || isFinalizing || !signatureData}
              >
                {isLoading || isFinalizing
                  ? t('common.loading')
                  : t('documents.signDocument')}
              </Button>
            </div>
            {isFinalizing && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                {t('documents.finalizingPdf', 'Finalizing PDF with cryptographic signature...')}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignDocumentDialog;
