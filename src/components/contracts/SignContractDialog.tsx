import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Contract, Signature } from '@/types';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SignatureCanvas from './SignatureCanvas';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface SignContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  role: 'client' | 'vendor' | 'planner';
  onSuccess?: () => void;
}

const SignContractDialog: React.FC<SignContractDialogProps> = ({
  open,
  onOpenChange,
  contract,
  role,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { signContract } = useApp();
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  
  // Set up the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });
  
  const handleContinue = () => {
    const isValid = form.trigger();
    if (isValid) {
      setShowSignatureCanvas(true);
    }
  };
  
  const handleCancel = () => {
    setShowSignatureCanvas(false);
    onOpenChange(false);
  };
  
  const handleSignatureSave = async (signatureData: string) => {
    const values = form.getValues();
    
    const signature: Signature = {
      name: values.name,
      email: values.email,
      signature: signatureData,
      timestamp: new Date().toISOString(),
      ip: '', // IP would be captured on the server in a real implementation
    };
    
    try {
      await signContract(contract.id, signature, role);
      toast.success(t('contracts.signSuccess'));
      setShowSignatureCanvas(false);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error(t('contracts.signError'));
    }
  };
  
  // Get role-specific title
  const getTitle = () => {
    switch (role) {
      case 'client':
        return t('contracts.signAsClient');
      case 'vendor':
        return t('contracts.signAsVendor');
      case 'planner':
        return t('contracts.signAsPlanner');
      default:
        return t('contracts.signContract');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setShowSignatureCanvas(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {showSignatureCanvas
              ? t('contracts.drawSignature')
              : t('contracts.signContractDescription')}
          </DialogDescription>
        </DialogHeader>
        
        {!showSignatureCanvas ? (
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contracts.signerName')}</FormLabel>
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
                    <FormLabel>{t('contracts.signerEmail')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleContinue}>
                  {t('common.continue')}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <SignatureCanvas
            onSave={handleSignatureSave}
            onCancel={() => setShowSignatureCanvas(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignContractDialog;
