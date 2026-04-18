
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FieldProps } from "../types";
import { useTranslation } from "react-i18next";

export const TitleField = ({ form }: FieldProps) => {
  const { t } = useTranslation();

  return (
    <FormField
      control={form.control}
      name="title"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('tasks.taskTitle')}</FormLabel>
          <FormControl>
            <Input placeholder={t('tasks.enterTitle')} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
