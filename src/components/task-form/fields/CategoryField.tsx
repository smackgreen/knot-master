
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldProps } from "../types";

export const CategoryField = ({ form }: FieldProps) => (
  <FormField
    control={form.control}
    name="category"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Category (Optional)</FormLabel>
        <Select
          value={field.value || "none"}
          onValueChange={(value) => {
            // Convert "none" to empty string or null for the form value
            field.onChange(value === "none" ? "" : value);
          }}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="venue">Venue</SelectItem>
            <SelectItem value="catering">Catering</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
            <SelectItem value="videography">Videography</SelectItem>
            <SelectItem value="florist">Florist</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="cake">Cake</SelectItem>
            <SelectItem value="attire">Attire</SelectItem>
            <SelectItem value="hair_makeup">Hair & Makeup</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="rentals">Rentals</SelectItem>
            <SelectItem value="stationery">Stationery</SelectItem>
            <SelectItem value="gifts">Gifts</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);
