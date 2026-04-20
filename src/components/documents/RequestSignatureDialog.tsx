import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, User, Send } from 'lucide-react';

interface Recipient {
  name: string;
  email: string;
  role: SignerRole;
}

interface RequestSignatureDialogProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSuccess?: () => void;
}

const MAX_RECIPIENTS = 3;

const RequestSignatureDialog: React.FC<RequestSignatureDialogProps> = ({
  document,
  open,
  onOpenChange,
  onRequestSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: '', email: '', role: 'client' },
  ]);
  const [errors, setErrors] = useState<Record<number, { name?: string; email?: string; role?: string }>>({});

  const addRecipient = () => {
    if (recipients.length >= MAX_RECIPIENTS) {
      toast({
        title: t('signatures.maxRecipientsReached'),
        variant: 'destructive',
      });
      return;
    }
    setRecipients(prev => [...prev, { name: '', email: '', role: 'client' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    setRecipients(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    setRecipients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear error for this field
    if (errors[index]?.[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        if (updated[index]) {
          const fieldErrors = { ...updated[index] };
          delete fieldErrors[field as keyof typeof fieldErrors];
          updated[index] = fieldErrors;
        }
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<number, { name?: string; email?: string; role?: string }> = {};
    let isValid = true;

    recipients.forEach((recipient, index) => {
      const fieldErrors: { name?: string; email?: string; role?: string } = {};

      if (!recipient.name.trim()) {
        fieldErrors.name = t('documents.validation.nameRequired');
        isValid = false;
      }

      if (!recipient.email.trim()) {
        fieldErrors.email = t('documents.validation.emailInvalid');
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) {
        fieldErrors.email = t('documents.validation.emailInvalid');
        isValid = false;
      }

      // Check for duplicate emails
      const duplicateIndex = recipients.findIndex(
        (r, i) => i !== index && r.email === recipient.email && recipient.email.trim() !== ''
      );
      if (duplicateIndex !== -1) {
        fieldErrors.email = t('documents.validation.emailDuplicate') || 'Duplicate email address';
        isValid = false;
      }

      if (Object.keys(fieldErrors).length > 0) {
        newErrors[index] = fieldErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      // Create a separate signature request for each recipient
      const results = await Promise.all(
        recipients.map(recipient =>
          createSignatureRequest(
            document.id,
            recipient.email,
            recipient.name,
            recipient.role,
            expiresInDays
          )
        )
      );

      const successCount = results.filter(r => r !== null).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast({
          title: t('documents.requestSent'),
          description: failCount > 0
            ? `${successCount} ${t('signatures.sendingToMultiple', { count: successCount })}${failCount > 0 ? ` (${failCount} failed)` : ''}`
            : t('documents.requestSentSuccess'),
        });

        if (onRequestSuccess) {
          onRequestSuccess();
        }

        // Reset form
        setRecipients([{ name: '', email: '', role: 'client' }]);
        setExpiresInDays(7);
        setErrors({});
        onOpenChange(false);
      } else {
        throw new Error('Failed to create signature requests');
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

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      client: 'default',
      vendor: 'secondary',
      planner: 'outline',
    };
    return variantMap[role] || 'default';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('documents.requestSignature')}</DialogTitle>
          <DialogDescription>
            {t('signatures.multipleRecipientsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients list */}
          {recipients.map((recipient, index) => (
            <div key={index} className="relative">
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(recipient.role)} className="text-xs">
                    {t('signatures.signerNumber', { number: index + 1 })}
                  </Badge>
                  {recipient.role && (
                    <span className="text-xs text-muted-foreground">
                      ({t(`documents.roles.${recipient.role}`)})
                    </span>
                  )}
                </div>
                {recipients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecipient(index)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${index}`} className="text-sm">
                    {t('documents.recipientName')}
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={recipient.name}
                    onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                    placeholder={t('documents.recipientName')}
                    className={errors[index]?.name ? 'border-destructive' : ''}
                  />
                  {errors[index]?.name && (
                    <p className="text-xs text-destructive">{errors[index].name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`email-${index}`} className="text-sm">
                    {t('documents.recipientEmail')}
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                    placeholder={t('documents.recipientEmail')}
                    className={errors[index]?.email ? 'border-destructive' : ''}
                  />
                  {errors[index]?.email && (
                    <p className="text-xs text-destructive">{errors[index].email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`role-${index}`} className="text-sm">
                    {t('documents.recipientRole')}
                  </Label>
                  <Select
                    value={recipient.role}
                    onValueChange={(value) => updateRecipient(index, 'role', value)}
                  >
                    <SelectTrigger id={`role-${index}`}>
                      <SelectValue placeholder={t('documents.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">{t('documents.roles.client')}</SelectItem>
                      <SelectItem value="vendor">{t('documents.roles.vendor')}</SelectItem>
                      <SelectItem value="planner">{t('documents.roles.planner')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          {/* Add recipient button */}
          {recipients.length < MAX_RECIPIENTS && (
            <Button
              variant="outline"
              onClick={addRecipient}
              className="w-full"
              type="button"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('signatures.addRecipient')}
            </Button>
          )}

          {recipients.length >= MAX_RECIPIENTS && (
            <p className="text-xs text-muted-foreground text-center">
              {t('signatures.maxRecipientsReached')}
            </p>
          )}

          <Separator />

          {/* Shared expiration field */}
          <div className="space-y-1.5">
            <Label htmlFor="expiresInDays" className="text-sm">
              {t('documents.expiresInDays')}
            </Label>
            <Input
              id="expiresInDays"
              type="number"
              min={1}
              max={30}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {t('signatures.sendingToMultiple', { count: recipients.length })}
            </span>
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                t('common.loading')
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('documents.sendRequest')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSignatureDialog;
