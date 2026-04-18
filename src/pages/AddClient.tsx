
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const AddClient = () => {
  const navigate = useNavigate();
  const { addClient } = useApp();
  const { t } = useTranslation();

  const formSchema = z.object({
    name: z.string().min(2, t('clients.nameMinLength')),
    partnerName: z.string().min(2, t('clients.partnerNameMinLength')),
    email: z.string().email(t('clients.invalidEmail')),
    phone: z.string().min(5, t('clients.phoneMinLength')),
    weddingDate: z.date({
      required_error: t('clients.weddingDateRequired'),
    }),
    venue: z.string().min(2, t('clients.venueMinLength')),
    notes: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      partnerName: "",
      email: "",
      phone: "",
      venue: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    // Fix: Make sure all required properties are included and not optional
    addClient({
      ...values,
      status: "active",
      venue: values.venue, // Explicitly set venue as required
      name: values.name,
      partnerName: values.partnerName,
      email: values.email,
      phone: values.phone,
      weddingDate: values.weddingDate,
    });
    navigate("/app/clients");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/app/clients")} className="-ml-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('common.backToClients')}
        </Button>
        <h1 className="text-3xl font-serif font-bold mt-2">{t('clients.addNewClient')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('clients.clientInformation')}</CardTitle>
          <CardDescription>{t('clients.enterNewClientDetails')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.clientName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('clients.namePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partnerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.partnerName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('clients.partnerNamePlaceholder')} {...field} />
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
                      <FormLabel>{t('clients.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('clients.emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('clients.phonePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weddingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('clients.weddingDate')}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t('clients.pickDate')}</span>
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('clients.venue')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('clients.venuePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('clients.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('clients.notesPlaceholder')}
                          {...field}
                          className="resize-none"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/app/clients")}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('clients.createClient')}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddClient;
