import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createDocument, createDocumentWithPath } from '@/services/documentService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import UppyUploader from '../documents/UppyUploader';

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

interface UploadDocumentForSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

const UploadDocumentForSignatureDialog: React.FC<UploadDocumentForSignatureDialogProps> = ({
  open,
  onOpenChange,
  onUploadSuccess,
  onUploadError,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);

  // Form schema
  const formSchema = z.object({
    name: z.string().min(1, { message: t('documents.validation.nameRequired') }),
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  // Handle successful upload from Uppy
  const handleUploadSuccess = (filePath: string, fileName: string, fileType: string, fileSize: number) => {
    setUploadedFilePath(filePath);
    setUploadedFileName(fileName);
    setUploadedFileType(fileType);
    setUploadedFileSize(fileSize);
    setUploadSuccess(true);

    toast({
      title: t('documents.uploadSuccess'),
      description: t('documents.documentUploaded'),
    });
  };

  // Handle upload error from Uppy
  const handleUploadError = (error: Error) => {
    console.error('Error uploading document:', error);

    // Check if the error is related to the storage bucket
    if (error.message.includes('Storage bucket "documents" does not exist')) {
      toast({
        title: t('documents.uploadError'),
        description: t('documents.storageBucketMissing'),
        variant: 'destructive',
      });
    }
    // Check if it's an RLS policy error
    else if (error.message.includes('Permission denied') ||
             error.message.includes('row-level security policy')) {
      toast({
        title: t('documents.uploadError'),
        description: t('documents.rlsError'),
        variant: 'destructive',
      });

      // Call the parent's error handler if provided
      if (onUploadError) {
        onUploadError(error);
      }
    }
    else {
      toast({
        title: t('documents.uploadError'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    }

    // Call the parent's error handler if provided
    if (onUploadError) {
      onUploadError(error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast({
        title: t('common.error'),
        description: t('common.notAuthenticated'),
        variant: 'destructive',
      });
      return;
    }

    if (!uploadSuccess || !uploadedFilePath) {
      toast({
        title: t('documents.uploadError'),
        description: t('documents.fileNotUploaded'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create document record with the uploaded file path
      // For signature documents, we'll create a standalone document
      const result = await createDocumentWithPath(
        user.id,
        uploadedFilePath,
        values.name,
        uploadedFileName || '',
        uploadedFileType || 'application/pdf',
        uploadedFileSize || 0,
        undefined,
        undefined,
        undefined
      );

      if (result) {
        toast({
          title: t('documents.uploadSuccess'),
          description: t('signatures.documentReadyForSignature'),
        });

        if (onUploadSuccess) {
          onUploadSuccess();
        }

        onOpenChange(false);
      } else {
        throw new Error('Failed to create document record');
      }
    } catch (error) {
      console.error('Error creating document record:', error);
      toast({
        title: t('documents.uploadError'),
        description: t('documents.tryAgainLater'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('signatures.uploadDocumentForSignature')}</DialogTitle>
          <DialogDescription>
            {t('signatures.uploadDocumentForSignatureDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.documentName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">{t('documents.documentFile')}</h3>
                <UppyUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  documentType="signature"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('documents.upload')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDocumentForSignatureDialog;
