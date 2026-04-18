import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Document, SignerRole } from '@/types';
import { createSignatureRequest } from '@/services/documentService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RequestSignatureDialogProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSuccess?: () => void;
}

const RequestSignatureDialog: React.FC<RequestSignatureDialogProps> = ({
  document,
  open,
  onOpenChange,
  onRequestSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form schema
  const formSchema = z.object({
    recipientName: z.string().min(1, { message: t('documents.validation.nameRequired') }),
    recipientEmail: z.string().email({ message: t('documents.validation.emailInvalid') }),
    recipientRole: z.enum(['client', 'vendor', 'planner'], {
      required_error: t('documents.validation.roleRequired'),
    }),
    expiresInDays: z.coerce.number().min(1).max(30),
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      recipientRole: 'client' as SignerRole,
      expiresInDays: 7,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const result = await createSignatureRequest(
        document.id,
        values.recipientEmail,
        values.recipientName,
        values.recipientRole,
        values.expiresInDays
      );

      if (result) {
        toast({
          title: t('documents.requestSent'),
          description: t('documents.requestSentSuccess'),
        });
        
        if (onRequestSuccess) {
          onRequestSuccess();
        }
        
        onOpenChange(false);
      } else {
        throw new Error('Failed to create signature request');
      }
    } catch (error) {
      console.error('Error requesting signature:', error);
      toast({
        title: t('documents.requestError'),
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
          <DialogTitle>{t('documents.requestSignature')}</DialogTitle>
          <DialogDescription>
            {t('documents.requestSignatureDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.recipientName')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.recipientEmail')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.recipientRole')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('documents.selectRole')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="client">{t('documents.roles.client')}</SelectItem>
                      <SelectItem value="vendor">{t('documents.roles.vendor')}</SelectItem>
                      <SelectItem value="planner">{t('documents.roles.planner')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('documents.expiresInDays')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={1} max={30} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('documents.sendRequest')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSignatureDialog;
