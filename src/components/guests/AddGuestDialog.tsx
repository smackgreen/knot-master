import { useState } from "react";
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

const childSchema = z.object({
  name: z.string().min(1, "Child name is required"),
  age: z.number().optional(),
  mealPreference: z.string().optional(),
});

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
  isCouple: z.boolean().default(false),
  partnerFirstName: z.string().optional(),
  partnerLastName: z.string().optional(),
  partnerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  partnerMealPreference: z.string().optional(),
  hasChildren: z.boolean().default(false),
  children: z.array(childSchema).optional(),
  tableAssignment: z.string().optional(),
  notes: z.string().optional(),
  // Keep for backward compatibility
  plusOne: z.boolean().default(false),
  plusOneName: z.string().optional(),
});

type GuestFormValues = z.infer<typeof guestFormSchema>;

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

const AddGuestDialog = ({ open, onOpenChange, clientId }: AddGuestDialogProps) => {
  const { addGuest } = useApp();
  const [isCouple, setIsCouple] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [children, setChildren] = useState<{ name: string; age?: number; mealPreference?: string }[]>([]);

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "USA",
      status: "pending",
      mealPreference: "",
      isCouple: false,
      partnerFirstName: "",
      partnerLastName: "",
      partnerEmail: "",
      partnerMealPreference: "",
      hasChildren: false,
      children: [],
      tableAssignment: "",
      notes: "",
      // For backward compatibility
      plusOne: false,
      plusOneName: "",
    },
  });

  const addChild = () => {
    setChildren([...children, { name: "" }]);
  };

  const removeChild = (index: number) => {
    const newChildren = [...children];
    newChildren.splice(index, 1);
    setChildren(newChildren);
  };

  const updateChild = (index: number, field: keyof typeof children[0], value: string | number) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const onSubmit = async (values: GuestFormValues) => {
    // Update the children array from the state
    const updatedValues = {
      ...values,
      clientId,
      children: hasChildren ? children : [],
      // Ensure backward compatibility
      plusOne: values.isCouple,
      plusOneName: values.isCouple && values.partnerFirstName && values.partnerLastName
        ? `${values.partnerFirstName} ${values.partnerLastName}`
        : "",
    };

    await addGuest(updatedValues);

    form.reset();
    setChildren([]);
    setIsCouple(false);
    setHasChildren(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
          <DialogDescription>
            Add a new guest to the wedding guest list
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
              name="isCouple"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsCouple(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Couple</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This guest is part of a couple
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {isCouple && (
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="font-medium">Partner Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partnerFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Partner's first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partnerLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Partner's last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="partnerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Partner's email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnerMealPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Preference</FormLabel>
                      <FormControl>
                        <Input placeholder="Partner's meal preference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="hasChildren"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setHasChildren(!!checked);
                        if (!!checked && children.length === 0) {
                          // Add one empty child by default
                          setChildren([{ name: "" }]);
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Children</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This guest is bringing children
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {hasChildren && (
              <div className="space-y-4 border rounded-md p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Children Information</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChild}
                  >
                    Add Child
                  </Button>
                </div>

                {children.map((child, index) => (
                  <div key={index} className="space-y-4 border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Child {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChild(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`child-name-${index}`}>Name</Label>
                        <Input
                          id={`child-name-${index}`}
                          value={child.name || ""}
                          onChange={(e) => updateChild(index, "name", e.target.value)}
                          placeholder="Child's name"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`child-age-${index}`}>Age</Label>
                        <Input
                          id={`child-age-${index}`}
                          type="number"
                          value={child.age || ""}
                          onChange={(e) => updateChild(index, "age", parseInt(e.target.value) || 0)}
                          placeholder="Child's age"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`child-meal-${index}`}>Meal Preference</Label>
                      <Input
                        id={`child-meal-${index}`}
                        value={child.mealPreference || ""}
                        onChange={(e) => updateChild(index, "mealPreference", e.target.value)}
                        placeholder="Child's meal preference"
                      />
                    </div>
                  </div>
                ))}

                {children.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No children added yet. Click "Add Child" to add a child.
                  </div>
                )}
              </div>
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
              <Button type="submit">Add Guest</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGuestDialog;
