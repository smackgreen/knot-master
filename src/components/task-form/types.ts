
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";

export const taskFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  status: z.enum(["not_started", "in_progress", "completed", "overdue"], {
    required_error: "Status is required",
  }),
  clientId: z.string({
    required_error: "Client is required",
  }),
  category: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface FieldProps {
  form: UseFormReturn<TaskFormValues>;
}
