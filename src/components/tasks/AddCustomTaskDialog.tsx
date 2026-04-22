/**
 * AddCustomTaskDialog
 *
 * Dialog for adding a new custom task (not from a template).
 * Supports title, description, priority, dates, and initial subtasks.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskPriority } from '@/types';
import { createCustomTask } from '@/services/weddingTaskTemplateService';
import { useToast } from '@/components/ui/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, GripVertical } from 'lucide-react';

interface AddCustomTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onTaskCreated?: () => void;
}

const AddCustomTaskDialog: React.FC<AddCustomTaskDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  onTaskCreated,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [subtasks, setSubtasks] = useState<{ title: string; description: string }[]>([]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setStartDate('');
    setSubtasks([]);
  };

  const handleAddSubtaskField = () => {
    setSubtasks([...subtasks, { title: '', description: '' }]);
  };

  const handleRemoveSubtaskField = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskChange = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !dueDate) {
      toast({
        title: t('common.error'),
        description: t('tasks.titleAndDueDateRequired', 'Title and due date are required'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createCustomTask(clientId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate,
        startDate: startDate || undefined,
        subtasks: subtasks
          .filter((s) => s.title.trim())
          .map((s) => ({ title: s.title.trim(), description: s.description.trim() || undefined })),
      });

      toast({
        title: t('common.success'),
        description: t('tasks.taskCreated', 'Task created successfully'),
      });

      resetForm();
      onOpenChange(false);
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tasks.failedToCreateTask', 'Failed to create task'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('tasks.addCustomTask', 'Add Custom Task')}</DialogTitle>
          <DialogDescription>
            {t('tasks.addCustomTaskDescription', 'Create a new task for your wedding planning.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">{t('tasks.taskTitle', 'Task Title')} *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tasks.taskTitlePlaceholder', 'e.g., Book the florist')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">{t('tasks.description', 'Description')}</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tasks.taskDescriptionPlaceholder', 'Optional details about this task')}
              rows={2}
            />
          </div>

          {/* Priority & Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>{t('tasks.priority', 'Priority')}</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">{t('tasks.startDate', 'Start Date')}</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">{t('tasks.dueDate', 'Due Date')} *</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('tasks.subtasks', 'Subtasks')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubtaskField}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t('tasks.addSubtask', 'Add Subtask')}
              </Button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      value={subtask.title}
                      onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                      placeholder={t('tasks.subtaskTitle', 'Subtask title')}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => handleRemoveSubtaskField(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !dueDate}>
            {isSubmitting ? t('common.loading') : t('tasks.createTask', 'Create Task')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomTaskDialog;
