import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Client, Vendor, ContractTemplate, ContractCategory } from '@/types';
import { mergeTemplateWithData } from '@/utils/contractUtils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Contract name is required' }),
  templateId: z.string().optional(),
  clientId: z.string().optional(),
  vendorId: z.string().optional(),
  content: z.string().min(1, { message: 'Contract content is required' }),
  expiresAt: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractFormProps {
  onSubmit: (values: FormValues) => void;
  initialValues?: Partial<FormValues>;
  templateId?: string;
  clientId?: string;
  vendorId?: string;
}

const ContractForm: React.FC<ContractFormProps> = ({
  onSubmit,
  initialValues,
  templateId,
  clientId,
  vendorId,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    clients,
    vendors,
    contractTemplates,
    getClientById,
    getVendorById,
    getContractTemplateById,
  } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    initialValues?.templateId || templateId
  );
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    initialValues?.clientId || clientId
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | undefined>(
    initialValues?.vendorId || vendorId
  );

  // Filter templates based on whether a vendor is selected
  const [filteredTemplates, setFilteredTemplates] = useState<ContractTemplate[]>([]);

  // Get the selected entities
  const selectedTemplate = selectedTemplateId ? getContractTemplateById(selectedTemplateId) : undefined;
  const selectedClient = selectedClientId ? getClientById(selectedClientId) : undefined;
  const selectedVendor = selectedVendorId ? getVendorById(selectedVendorId) : undefined;

  // Set up the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      templateId: initialValues?.templateId || templateId,
      clientId: initialValues?.clientId || clientId,
      vendorId: initialValues?.vendorId || vendorId,
      content: initialValues?.content || '',
      expiresAt: initialValues?.expiresAt,
    },
  });

  // Filter templates when vendor selection changes
  useEffect(() => {
    if (selectedVendorId) {
      // If vendor is selected, show only vendor templates
      setFilteredTemplates(
        contractTemplates.filter(template => template.category === 'vendor')
      );
    } else {
      // If no vendor, show client and planning templates
      setFilteredTemplates(
        contractTemplates.filter(template =>
          template.category === 'client' || template.category === 'planning'
        )
      );
    }
  }, [selectedVendorId, contractTemplates]);

  // Update content when template, client, or vendor changes
  useEffect(() => {
    if (selectedTemplate) {
      const mergedContent = mergeTemplateWithData(
        selectedTemplate.content,
        selectedClient,
        selectedVendor,
        user
      );
      form.setValue('content', mergedContent);
    }
  }, [selectedTemplate, selectedClient, selectedVendor, user, form]);

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    form.setValue('templateId', templateId);

    const template = getContractTemplateById(templateId);
    if (template) {
      // Set a default name based on the template and client/vendor
      let contractName = template.name;
      if (selectedClient) {
        contractName += ` - ${selectedClient.name}`;
      }
      if (selectedVendor) {
        contractName += ` - ${selectedVendor.name}`;
      }
      form.setValue('name', contractName);
    }
  };

  // Handle client change
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    form.setValue('clientId', clientId);
  };

  // Handle vendor change
  const handleVendorChange = (vendorId: string) => {
    // If "none" is selected, set vendorId to undefined
    if (vendorId === "none") {
      setSelectedVendorId(undefined);
      form.setValue('vendorId', undefined);
      return;
    }

    setSelectedVendorId(vendorId);
    form.setValue('vendorId', vendorId);

    // If vendor is selected, filter templates to vendor only
    if (vendorId) {
      const vendorTemplates = contractTemplates.filter(
        template => template.category === 'vendor'
      );

      // If there's only one vendor template, select it automatically
      if (vendorTemplates.length === 1) {
        handleTemplateChange(vendorTemplates[0].id);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.name')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.client')}</FormLabel>
                <Select
                  onValueChange={handleClientChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('contracts.selectClient')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('contracts.vendor')}</FormLabel>
                <Select
                  onValueChange={handleVendorChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('contracts.selectVendor')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      {t('contracts.noVendor')}
                    </SelectItem>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="templateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.template')}</FormLabel>
              <Select
                onValueChange={handleTemplateChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('contracts.selectTemplate')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('contracts.expirationDate')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>{t('contracts.selectExpirationDate')}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                {t('contracts.expirationDateDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.content')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[300px] font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          {t('common.save')}
        </Button>
      </form>
    </Form>
  );
};

export default ContractForm;
