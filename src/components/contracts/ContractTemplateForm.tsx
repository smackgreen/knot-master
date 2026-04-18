import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { ContractCategory } from '@/types';
import { TEMPLATE_PLACEHOLDERS } from '@/utils/contractUtils';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, { message: 'Template name is required' }),
  description: z.string().optional(),
  category: z.enum(['client', 'vendor', 'planning', 'other'] as const),
  content: z.string().min(1, { message: 'Template content is required' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractTemplateFormProps {
  onSubmit: (values: FormValues) => void;
  initialValues?: Partial<FormValues>;
}

const ContractTemplateForm: React.FC<ContractTemplateFormProps> = ({
  onSubmit,
  initialValues,
}) => {
  const { t } = useTranslation();
  
  // Set up the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      category: initialValues?.category || 'client',
      content: initialValues?.content || '',
    },
  });
  
  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder: string) => {
    const contentField = form.getValues('content');
    const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = 
        contentField.substring(0, start) + 
        placeholder + 
        contentField.substring(end);
      
      form.setValue('content', newContent);
      
      // Set cursor position after the inserted placeholder
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      // If textarea not found, just append to the end
      form.setValue('content', contentField + placeholder);
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
              <FormLabel>{t('contracts.templateName')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.templateDescription')}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormDescription>
                {t('contracts.templateDescriptionHelp')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.templateCategory')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('contracts.selectCategory')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="client">{t('contracts.category.client')}</SelectItem>
                  <SelectItem value="vendor">{t('contracts.category.vendor')}</SelectItem>
                  <SelectItem value="planning">{t('contracts.category.planning')}</SelectItem>
                  <SelectItem value="other">{t('contracts.category.other')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {t('contracts.templateCategoryHelp')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="placeholders">
            <AccordionTrigger>
              {t('contracts.availablePlaceholders')}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                <div>
                  <h4 className="font-medium mb-2">{t('contracts.clientPlaceholders')}</h4>
                  <div className="space-y-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.CLIENT_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.CLIENT_NAME}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.PARTNER_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.PARTNER_NAME}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.WEDDING_DATE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.WEDDING_DATE}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.VENUE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.VENUE}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.BUDGET)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.BUDGET}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('contracts.vendorPlaceholders')}</h4>
                  <div className="space-y-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.VENDOR_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.VENDOR_NAME}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.VENDOR_CATEGORY)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.VENDOR_CATEGORY}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.VENDOR_COST)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.VENDOR_COST}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('contracts.companyPlaceholders')}</h4>
                  <div className="space-y-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_NAME}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_ADDRESS)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_ADDRESS}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_CITY)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_CITY}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_PHONE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_PHONE}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_EMAIL)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_EMAIL}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.COMPANY_WEBSITE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.COMPANY_WEBSITE}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.PLANNER_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.PLANNER_NAME}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">{t('contracts.otherPlaceholders')}</h4>
                  <div className="space-y-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.TODAY_DATE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.TODAY_DATE}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.CONTRACT_ID)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.CONTRACT_ID}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.CONTRACT_NAME)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.CONTRACT_NAME}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => insertPlaceholder(TEMPLATE_PLACEHOLDERS.EXPIRATION_DATE)}
                      className="w-full justify-start"
                    >
                      {TEMPLATE_PLACEHOLDERS.EXPIRATION_DATE}
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('contracts.templateContent')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-[400px] font-mono"
                />
              </FormControl>
              <FormDescription>
                {t('contracts.templateContentHelp')}
              </FormDescription>
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

export default ContractTemplateForm;
