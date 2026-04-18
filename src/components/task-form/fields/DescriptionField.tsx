
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FieldProps } from "../types";

export const DescriptionField = ({ form }: FieldProps) => (
  <FormField
    control={form.control}
    name="description"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Description (Optional)</FormLabel>
        <FormControl>
          <Textarea
            placeholder="Add details about this task"
            className="resize-none"
            {...field}
            value={field.value || ""}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
