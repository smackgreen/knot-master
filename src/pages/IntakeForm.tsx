import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  partnerName: z.string().min(2, "Partner name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(5, "Phone number must be at least 5 characters."),
  weddingDate: z.date({
    required_error: "Wedding date is required.",
  }),
  venue: z.string().min(2, "Venue must be at least 2 characters."),
  guestCount: z.coerce.number().min(0, "Guest count must be a positive number"),
  budget: z.coerce.number().min(0, "Budget must be a positive number"),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const IntakeForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      partnerName: "",
      email: "",
      phone: "",
      venue: "",
      guestCount: 0,
      budget: 0,
      additionalInfo: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <HeartHandshake className="text-primary h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-serif">Thank You!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your information has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              We're excited to help plan your special day! A wedding planner from Knot To It will be in touch with you shortly.
            </p>
            <Button asChild className="mt-4">
              <Link to="/">Return to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-2">
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HeartHandshake className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Knot To It Wedding Planning</h1>
          <h2 className="text-2xl font-serif mb-4">Client Intake Form</h2>
          <p className="text-muted-foreground">
            Please fill out this form to help us start planning your dream wedding. We'll be in touch shortly!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Wedding Details</CardTitle>
            <CardDescription>Tell us about your special day</CardDescription>
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
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
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
                        <FormLabel>Partner's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Partner's full name" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Your email address" {...field} />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
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
                        <FormLabel>Wedding Date</FormLabel>
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
                                  <span>Pick a date</span>
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
                        <FormLabel>Venue (if known)</FormLabel>
                        <FormControl>
                          <Input placeholder="Wedding venue name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Guest Count</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Number of guests" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Budget</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Your overall budget" {...field} />
                        </FormControl>
                        <FormDescription>Approximate total budget in USD</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional details about your wedding vision, specific requirements, or questions..."
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

                <div className="flex justify-end">
                  <Button type="submit">Submit</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Knot To It Wedding Planning. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default IntakeForm;
