import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Guest, GuestStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const guestFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(["invited", "confirmed", "declined", "pending"]),
  mealPreference: z.string().optional(),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().optional(),
  tableAssignment: z.string().optional(),
  notes: z.string().optional(),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

interface EditGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest;
}

const EditGuestDialog = ({ open, onOpenChange, guest }: EditGuestDialogProps) => {
  const { updateGuest } = useApp();
  const [isPlusOne, setIsPlusOne] = useState(guest.plusOne);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      address: guest.address || "",
      city: guest.city || "",
      state: guest.state || "",
      postalCode: guest.postalCode || "",
      country: guest.country || "USA",
      status: guest.status,
      mealPreference: guest.mealPreference || "",
      plusOne: guest.plusOne,
      plusOneName: guest.plusOneName || "",
      tableAssignment: guest.tableAssignment || "",
      notes: guest.notes || "",
    },
  });

  // Update form when guest changes
  useEffect(() => {
    form.reset({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phone: guest.phone || "",
      address: guest.address || "",
      city: guest.city || "",
      state: guest.state || "",
      postalCode: guest.postalCode || "",
      country: guest.country || "USA",
      status: guest.status,
      mealPreference: guest.mealPreference || "",
      plusOne: guest.plusOne,
      plusOneName: guest.plusOneName || "",
      tableAssignment: guest.tableAssignment || "",
      notes: guest.notes || "",
    });
    setIsPlusOne(guest.plusOne);
  }, [guest, form]);

  const onSubmit = async (values: GuestFormValues) => {
    await updateGuest(guest.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Guest</DialogTitle>
          <DialogDescription>
            Update guest information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mealPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Preference</FormLabel>
                    <FormControl>
                      <Input placeholder="Meal preference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="plusOne"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsPlusOne(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Plus One</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This guest is bringing a plus one
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {isPlusOne && (
              <FormField
                control={form.control}
                name="plusOneName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plus One Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name of plus one" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tableAssignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Assignment</FormLabel>
                  <FormControl>
                    <Input placeholder="Table number or name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGuestDialog;
