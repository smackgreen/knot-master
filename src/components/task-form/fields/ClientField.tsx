
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/types";
import { FieldProps } from "../types";

interface ClientFieldProps extends FieldProps {
  clients: Client[];
}

export const ClientField = ({ form, clients }: ClientFieldProps) => (
  <FormField
    control={form.control}
    name="clientId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Client</FormLabel>
        <Select
          value={field.value}
          onValueChange={field.onChange}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {clients.length > 0 ? (
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} & {client.partnerName}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No clients available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);
