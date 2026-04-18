import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Document, SignerRole } from '@/types';
import { getSignedUrl } from '@/services/storageService';
import { createElectronicSignature } from '@/services/documentService';
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
import SignaturePad from './SignatureCanvas';

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
      // Get IP address (in a real app, you might want to use a service for this)
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
            <SignaturePad onSave={handleSignatureSave} className="my-4" />

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep('review')}>
                {t('documents.back')}
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading || !signatureData}
              >
                {isLoading ? t('common.loading') : t('documents.signDocument')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignDocumentDialog;
