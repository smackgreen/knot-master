
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskFormSchema, TaskFormValues } from "./types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { FormFields } from "./FormFields";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useTranslation } from "react-i18next";

interface TaskFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<TaskFormValues>;
  taskId?: string;
}

export const TaskForm = ({ onSuccess, defaultValues, taskId }: TaskFormProps) => {
  const { user } = useAuth();
  const { addTask, updateTask } = useApp();
  const { t } = useTranslation();
  const isEditing = !!taskId;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(),
      priority: "medium",
      status: "not_started",
      clientId: "",
      category: "",
      ...defaultValues,
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (!user) {
        toast({
          title: t('common.error'),
          description: t('tasks.loginRequired'),
          variant: "destructive",
        });
        return;
      }

      // Format the date to ISO string for database storage
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString().split('T')[0],
      };

      if (isEditing && taskId) {
        // Update existing task
        await updateTask(taskId, formattedData);
      } else {
        // Create new task
        await addTask(formattedData);
      }

      // Show success message
      toast({
        title: isEditing ? t('tasks.taskUpdated') : t('tasks.taskAdded'),
        description: t('tasks.taskActionSuccess', {
          title: data.title,
          action: isEditing ? t('common.updated') : t('common.added')
        }),
      });

      // Reset form and call success callback
      if (!isEditing) form.reset();
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: t('common.error'),
        description: t('tasks.savingError'),
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormFields />

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <span className="mr-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </span>
                {isEditing ? t('common.updating') : t('common.creating')}
              </>
            ) : (
              isEditing ? t('tasks.updateTask') : t('tasks.createTask')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
