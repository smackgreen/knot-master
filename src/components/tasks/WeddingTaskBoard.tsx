/**
 * WeddingTaskBoard
 *
 * Modern drag-and-drop task management interface for wedding planning.
 * Features:
 * - Drag-and-drop reordering via @dnd-kit
 * - Inline editing of task title, description, priority, timeline
 * - Collapsible subtask sections
 * - Visual grouping by category
 * - Add/delete tasks and subtasks
 * - Completion tracking with visual feedback
 * - Responsive design
 * - i18n support for task/subtask titles
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Translation Helpers
// ============================================================================

/**
 * Convert a task title to a translation key.
 * e.g., "Find and book ceremony venue" → "find_and_book_ceremony_venue"
 */
function titleToKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Get the translated title for a task based on its template category.
 * Falls back to the original title if no translation is found.
 */
function getTaskTitle(t: (key: string, fallback?: string) => string, task: { title: string; templateCategory?: string }): string {
  if (task.templateCategory) {
    const key = `tasks.taskTemplates.${task.templateCategory}.title`;
    const translated = t(key, task.title);
    // If the translation returns the key itself, use the original title
    return translated === key ? task.title : translated;
  }
  return task.title;
}

/**
 * Get the translated description for a task based on its template category.
 */
function getTaskDescription(t: (key: string, fallback?: string) => string, task: { description?: string; templateCategory?: string }): string | undefined {
  if (task.templateCategory) {
    const key = `tasks.taskTemplates.${task.templateCategory}.description`;
    const translated = t(key, task.description || '');
    return translated === key ? task.description : translated;
  }
  return task.description;
}

/**
 * Get the translated title for a subtask based on its parent task's template category.
 */
function getSubtaskTitle(
  t: (key: string, fallback?: string) => string,
  subtaskTitle: string,
  templateCategory?: string
): string {
  if (templateCategory) {
    const key = `tasks.taskTemplates.${templateCategory}.subtasks.${titleToKey(subtaskTitle)}`;
    const translated = t(key, subtaskTitle);
    return translated === key ? subtaskTitle : translated;
  }
  return subtaskTitle;
}
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Task, TaskSubtask, TaskPriority } from '@/types';
import {
  reorderTasks,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  toggleSubtask,
  reorderSubtasks,
} from '@/services/weddingTaskTemplateService';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  Save,
} from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: {
    color: 'text-red-700',
    bg: 'bg-red-100 border-red-300',
    label: 'Critical',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  high: {
    color: 'text-orange-700',
    bg: 'bg-orange-100 border-orange-300',
    label: 'High',
    icon: <ChevronRight className="h-3.5 w-3.5" />,
  },
  medium: {
    color: 'text-blue-700',
    bg: 'bg-blue-100 border-blue-300',
    label: 'Medium',
    icon: <Circle className="h-3.5 w-3.5" />,
  },
  low: {
    color: 'text-gray-600',
    bg: 'bg-gray-100 border-gray-300',
    label: 'Low',
    icon: <Clock className="h-3.5 w-3.3" />,
  },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  not_started: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Not Started' },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress' },
  completed: { color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
  overdue: { color: 'text-red-600', bg: 'bg-red-100', label: 'Overdue' },
};

// ============================================================================
// Main Component
// ============================================================================

interface WeddingTaskBoardProps {
  tasks: Task[];
  clientId: string;
  onTasksChanged?: () => void;
}

const WeddingTaskBoard: React.FC<WeddingTaskBoardProps> = ({
  tasks: initialTasks,
  clientId,
  onTasksChanged,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Task>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSubtaskConfirmId, setDeleteSubtaskConfirmId] = useState<string | null>(null);
  const [newSubtaskTaskId, setNewSubtaskTaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [groupByCategory, setGroupByCategory] = useState(true);

  // Sync tasks from props
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Expand tasks with subtasks by default
  React.useEffect(() => {
    const expanded = new Set(
      tasks.filter((t) => t.subtasks && t.subtasks.length > 0).map((t) => t.id)
    );
    setExpandedTasks(expanded);
  }, [tasks.length]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Group tasks by category
  const groupedTasks = useMemo(() => {
    if (!groupByCategory) {
      return { 'All Tasks': tasks };
    }
    const groups: Record<string, Task[]> = {};
    for (const task of tasks) {
      const category = task.templateCategory || 'Custom';
      if (!groups[category]) groups[category] = [];
      groups[category].push(task);
    }
    return groups;
  }, [tasks, groupByCategory]);

  const refreshTasks = useCallback(async () => {
    if (onTasksChanged) {
      onTasksChanged();
    }
    await queryClient.invalidateQueries({ queryKey: ['tasks', clientId] });
  }, [onTasksChanged, queryClient, clientId]);

  // ============================================================================
  // DnD Handlers
  // ============================================================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);

    // Persist new sort orders
    try {
      const updates = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
      await reorderTasks(updates);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      setTasks(tasks); // Revert
      toast({ title: t('common.error'), description: 'Failed to reorder tasks', variant: 'destructive' });
    }
  };

  // ============================================================================
  // Task Handlers
  // ============================================================================

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingValues({
      title: task.title,
      description: task.description,
      priority: task.priority,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId) return;

    try {
      await updateTask(editingTaskId, editingValues as any);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTaskId ? { ...t, ...editingValues } : t))
      );
      setEditingTaskId(null);
      setEditingValues({});
      toast({ title: t('common.success'), description: 'Task updated' });
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to update task', variant: 'destructive' });
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingValues({});
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setDeleteConfirmId(null);
      toast({ title: t('common.success'), description: 'Task deleted' });
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // ============================================================================
  // Subtask Handlers
  // ============================================================================

  const handleAddSubtask = async (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const subtask = await addSubtask(taskId, newSubtaskTitle.trim());
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
            : t
        )
      );
      setNewSubtaskTitle('');
      setNewSubtaskTaskId(null);
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to add subtask', variant: 'destructive' });
    }
  };

  const handleToggleSubtask = async (subtaskId: string, taskId: string) => {
    try {
      const updated = await toggleSubtask(subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === subtaskId ? updated : s
                ),
              }
            : t
        )
      );
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to toggle subtask', variant: 'destructive' });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string, taskId: string) => {
    try {
      await deleteSubtask(subtaskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) }
            : t
        )
      );
      setDeleteSubtaskConfirmId(null);
      refreshTasks();
    } catch (error) {
      toast({ title: t('common.error'), description: 'Failed to delete subtask', variant: 'destructive' });
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            {t('tasks.weddingTasks', 'Wedding Tasks')}
          </h3>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalCount} {t('tasks.completed', 'completed')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGroupByCategory(!groupByCategory)}
          >
            {groupByCategory ? t('tasks.ungroup', 'Ungroup') : t('tasks.groupByCategory', 'Group by Category')}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Task Groups */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
          <div key={category} className="space-y-2">
            {groupByCategory && (
              <div className="flex items-center gap-2 pt-4 pb-1">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t(`tasks.taskTemplates.${category}.title`, category.replace(/_/g, ' '))}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {categoryTasks.reduce((sum, task) => sum + (task.subtasks?.length || 0), 0)} {t('tasks.subtasks', 'subtasks')}
                </Badge>
              </div>
            )}

            <SortableContext
              items={categoryTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {categoryTasks.map((task, taskIndex) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  taskIndex={taskIndex}
                  totalInGroup={categoryTasks.length}
                  isEditing={editingTaskId === task.id}
                  editingValues={editingValues}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggleExpand={() => toggleExpanded(task.id)}
                  onStartEdit={() => handleStartEdit(task)}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditingValuesChange={setEditingValues}
                  onDelete={() => setDeleteConfirmId(task.id)}
                  onToggleStatus={() => handleToggleTaskStatus(task)}
                  onAddSubtask={() => setNewSubtaskTaskId(task.id)}
                  onToggleSubtask={(subtaskId) => handleToggleSubtask(subtaskId, task.id)}
                  onDeleteSubtask={(subtaskId) => setDeleteSubtaskConfirmId(subtaskId)}
                  newSubtaskTaskId={newSubtaskTaskId}
                  newSubtaskTitle={newSubtaskTitle}
                  onNewSubtaskTitleChange={setNewSubtaskTitle}
                  onSubmitSubtask={() => handleAddSubtask(task.id)}
                />
              ))}
            </SortableContext>
          </div>
        ))}

        <DragOverlay>
          {activeTaskId ? (
            <div className="bg-white border-2 border-primary rounded-lg shadow-xl p-4 opacity-90">
              {tasks.find((t) => t.id === activeTaskId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.deleteTask', 'Delete Task?')}</DialogTitle>
            <DialogDescription>
              {t('tasks.deleteTaskConfirm', 'This will permanently delete this task and all its subtasks. This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteTask(deleteConfirmId)}
            >
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subtask Confirmation Dialog */}
      <Dialog open={!!deleteSubtaskConfirmId} onOpenChange={() => setDeleteSubtaskConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tasks.deleteSubtask', 'Delete Subtask?')}</DialogTitle>
            <DialogDescription>
              {t('tasks.deleteSubtaskConfirm', 'This will permanently delete this subtask. This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSubtaskConfirmId(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteSubtaskConfirmId &&
                tasks
                  .find((t) => t.subtasks?.some((s) => s.id === deleteSubtaskConfirmId))
                  ?.id &&
                handleDeleteSubtask(
                  deleteSubtaskConfirmId,
                  tasks.find((t) => t.subtasks?.some((s) => s.id === deleteSubtaskConfirmId))!.id
                )
              }
            >
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// Sortable Task Item
// ============================================================================

interface SortableTaskItemProps {
  task: Task;
  taskIndex: number;
  totalInGroup: number;
  isEditing: boolean;
  editingValues: Partial<Task>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingValuesChange: (values: Partial<Task>) => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onAddSubtask: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  newSubtaskTaskId: string | null;
  newSubtaskTitle: string;
  onNewSubtaskTitleChange: (title: string) => void;
  onSubmitSubtask: () => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  taskIndex,
  totalInGroup,
  isEditing,
  editingValues,
  isExpanded,
  onToggleExpand,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingValuesChange,
  onDelete,
  onToggleStatus,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  newSubtaskTaskId,
  newSubtaskTitle,
  onNewSubtaskTitleChange,
  onSubmitSubtask,
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const isCompleted = task.status === 'completed';
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`transition-all duration-200 ${
          isCompleted ? 'opacity-70 bg-green-50/50' : ''
        } ${isDragging ? 'shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md'}`}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <button
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Completion Checkbox */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleStatus}
                    className="mt-0.5 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isCompleted ? t('tasks.markIncomplete', 'Mark as incomplete') : t('tasks.markComplete', 'Mark as complete')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editingValues.title || ''}
                    onChange={(e) =>
                      onEditingValuesChange({ ...editingValues, title: e.target.value })
                    }
                    className="font-medium"
                    placeholder={t('tasks.taskTitle', 'Task title')}
                  />
                  <Input
                    value={editingValues.description || ''}
                    onChange={(e) =>
                      onEditingValuesChange({ ...editingValues, description: e.target.value })
                    }
                    className="text-sm text-muted-foreground"
                    placeholder={t('tasks.taskDescription', 'Description (optional)')}
                  />
                  <div className="flex items-center gap-2">
                    <Select
                      value={editingValues.priority || 'medium'}
                      onValueChange={(val) =>
                        onEditingValuesChange({ ...editingValues, priority: val as TaskPriority })
                      }
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={onSaveEdit} className="h-8">
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {t('common.save', 'Save')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8">
                      <X className="h-3.5 w-3.5 mr-1" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-medium text-sm ${
                        isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {getTaskTitle(t, task)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${priorityConfig.color} ${priorityConfig.bg}`}
                    >
                      <span className="flex items-center gap-1">
                        {priorityConfig.icon}
                        {priorityConfig.label}
                      </span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${statusConfig.color} ${statusConfig.bg}`}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                  {getTaskDescription(t, task) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {getTaskDescription(t, task)}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {task.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.startDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('tasks.due', 'Due')}: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {totalSubtasks > 0 && (
                      <span className="flex items-center gap-1">
                        {completedSubtasks}/{totalSubtasks} {t('tasks.subtasks', 'subtasks')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-1">
                {totalSubtasks > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onToggleExpand}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onStartEdit}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      {t('common.edit', 'Edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onAddSubtask}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('tasks.addSubtask', 'Add Subtask')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete', 'Delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Subtasks Section */}
        {isExpanded && (
          <CardContent className="px-4 pb-3 pt-0">
            <div className="ml-11 space-y-1 border-l-2 border-muted pl-4">
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors hover:bg-muted/50 ${
                    subtask.isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <Checkbox
                    checked={subtask.isCompleted}
                    onCheckedChange={() => onToggleSubtask(subtask.id)}
                    className="h-4 w-4"
                  />
                  <span
                    className={`text-sm flex-1 ${
                      subtask.isCompleted ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {getSubtaskTitle(t, subtask.title, task.templateCategory)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground hover:text-red-600"
                    onClick={() => onDeleteSubtask(subtask.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add Subtask Input */}
              {newSubtaskTaskId === task.id && (
                <div className="flex items-center gap-2 py-1.5 px-2">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => onNewSubtaskTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSubmitSubtask();
                      if (e.key === 'Escape') {
                        onNewSubtaskTitleChange('');
                        onAddSubtask(); // Close by setting to null
                      }
                    }}
                    placeholder={t('tasks.subtaskPlaceholder', 'Add a subtask...')}
                    className="h-7 text-sm border-0 focus-visible:ring-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={onSubmitSubtask}
                    disabled={!newSubtaskTitle.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Subtask Progress Bar */}
              {totalSubtasks > 0 && (
                <div className="pt-1">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default WeddingTaskBoard;
