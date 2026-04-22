/**
 * Wedding Task Template Service
 *
 * Manages pre-built wedding task templates and their lifecycle:
 * - Fetching templates from the database
 * - Creating tasks from templates for a specific wedding (client)
 * - Subtask CRUD operations
 * - Task reordering
 */

import { supabase } from '@/integrations/supabase/client';
import {
  Task,
  TaskSubtask,
  TaskPriority,
  TaskStatus,
  WeddingTaskTemplate,
} from '@/types';
import { addDays, format, parseISO } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface CreateTasksFromTemplatesOptions {
  clientId: string;
  weddingDate: Date | string;
  /** Specific template categories to include. If omitted, all templates are used. */
  categories?: string[];
}

export interface TaskReorderItem {
  id: string;
  sortOrder: number;
}

// ============================================================================
// Template Fetching
// ============================================================================

/**
 * Fetch all wedding task templates, optionally filtered by category.
 */
export async function fetchWeddingTaskTemplates(
  categories?: string[]
): Promise<WeddingTaskTemplate[]> {
  let query = supabase
    .from('wedding_task_templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (categories && categories.length > 0) {
    query = query.in('category', categories);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[weddingTaskTemplateService] Error fetching templates:', error);
    throw error;
  }

  return (data || []).map(mapTemplateFromDb);
}

/**
 * Get all available template categories.
 */
export async function fetchTemplateCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('wedding_task_templates')
    .select('category')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[weddingTaskTemplateService] Error fetching categories:', error);
    throw error;
  }

  return [...new Set((data || []).map((d) => d.category))];
}

// ============================================================================
// Task Creation from Templates
// ============================================================================

/**
 * Create tasks from all wedding templates for a specific client/wedding.
 * This is called when a new wedding event is created.
 *
 * Each template's date offsets are calculated relative to the wedding date:
 * - start_date = weddingDate - startDateOffsetDays
 * - due_date = weddingDate - endDateOffsetDays
 */
export async function createTasksFromTemplates(
  options: CreateTasksFromTemplatesOptions
): Promise<Task[]> {
  const { clientId, weddingDate, categories } = options;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Fetch templates
  const templates = await fetchWeddingTaskTemplates(categories);

  if (templates.length === 0) {
    console.warn('[createTasksFromTemplates] No templates found');
    return [];
  }

  const weddingDateObj = typeof weddingDate === 'string' ? parseISO(weddingDate) : weddingDate;

  const createdTasks: Task[] = [];

  for (const template of templates) {
    // Calculate dates relative to wedding date
    const startDate = addDays(weddingDateObj, -template.startDateOffsetDays);
    const dueDate = addDays(weddingDateObj, -template.endDateOffsetDays);

    // Create the task
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: template.title,
        description: template.description,
        client_id: clientId,
        user_id: user.id,
        status: 'not_started',
        priority: template.priority,
        start_date: startDate.toISOString(),
        due_date: format(dueDate, 'yyyy-MM-dd'),
        template_category: template.category,
        is_from_template: true,
        sort_order: template.sortOrder,
      })
      .select()
      .single();

    if (taskError || !taskData) {
      console.error(`[createTasksFromTemplates] Error creating task for ${template.category}:`, taskError);
      continue;
    }

    const task = mapTaskFromDb(taskData);

    // Create subtasks
    if (template.subtasks && template.subtasks.length > 0) {
      const subtaskInserts = template.subtasks.map((st, index) => ({
        task_id: taskData.id,
        title: st.title,
        description: st.description || null,
        is_completed: false,
        sort_order: index,
      }));

      const { data: subtaskData, error: subtaskError } = await supabase
        .from('task_subtasks')
        .insert(subtaskInserts)
        .select();

      if (subtaskError) {
        console.error(`[createTasksFromTemplates] Error creating subtasks for ${template.category}:`, subtaskError);
      } else {
        task.subtasks = (subtaskData || []).map(mapSubtaskFromDb);
      }
    }

    createdTasks.push(task);
  }

  console.log(`[createTasksFromTemplates] Created ${createdTasks.length} tasks from templates for client ${clientId}`);
  return createdTasks;
}

// ============================================================================
// Task CRUD
// ============================================================================

/**
 * Fetch all tasks for a client, including subtasks.
 */
export async function fetchClientTasks(clientId: string): Promise<Task[]> {
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: true });

  if (tasksError) {
    console.error('[fetchClientTasks] Error:', tasksError);
    throw tasksError;
  }

  if (!tasksData || tasksData.length === 0) return [];

  // Fetch all subtasks for these tasks
  const taskIds = tasksData.map((t) => t.id);
  const { data: subtasksData, error: subtasksError } = await supabase
    .from('task_subtasks')
    .select('*')
    .in('task_id', taskIds)
    .order('sort_order', { ascending: true });

  if (subtasksError) {
    console.error('[fetchClientTasks] Error fetching subtasks:', subtasksError);
  }

  const subtasksByTaskId = new Map<string, TaskSubtask[]>();
  if (subtasksData) {
    for (const st of subtasksData) {
      const list = subtasksByTaskId.get(st.task_id) || [];
      list.push(mapSubtaskFromDb(st));
      subtasksByTaskId.set(st.task_id, list);
    }
  }

  return tasksData.map((t) => {
    const task = mapTaskFromDb(t);
    task.subtasks = subtasksByTaskId.get(t.id) || [];
    return task;
  });
}

/**
 * Update a task's properties (inline editing).
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'startDate' | 'dueDate' | 'sortOrder'>>
): Promise<Task> {
  const dbUpdates: Record<string, any> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  if (updates.startDate !== undefined) {
    dbUpdates.start_date = typeof updates.startDate === 'string'
      ? updates.startDate
      : updates.startDate.toISOString();
  }
  if (updates.dueDate !== undefined) {
    dbUpdates.due_date = typeof updates.dueDate === 'string'
      ? updates.dueDate
      : format(updates.dueDate, 'yyyy-MM-dd');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('[updateTask] Error:', error);
    throw error;
  }

  return mapTaskFromDb(data);
}

/**
 * Delete a task and all its subtasks (cascade).
 */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('[deleteTask] Error:', error);
    throw error;
  }
}

/**
 * Reorder tasks by updating sort_order values.
 */
export async function reorderTasks(items: TaskReorderItem[]): Promise<void> {
  // Use Promise.all for batch updates
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      supabase
        .from('tasks')
        .update({ sort_order: sortOrder })
        .eq('id', id)
    )
  );
}

/**
 * Create a custom task (not from a template).
 */
export async function createCustomTask(
  clientId: string,
  task: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate: Date | string;
    startDate?: Date | string;
    templateCategory?: string;
    subtasks?: { title: string; description?: string }[];
  }
): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get the max sort_order for this client's tasks
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('client_id', clientId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (existingTasks?.[0]?.sort_order || 0) + 1;

  const { data: taskData, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description || null,
      client_id: clientId,
      user_id: user.id,
      status: 'not_started',
      priority: task.priority || 'medium',
      start_date: task.startDate
        ? (typeof task.startDate === 'string' ? task.startDate : task.startDate.toISOString())
        : null,
      due_date: typeof task.dueDate === 'string' ? task.dueDate : format(task.dueDate, 'yyyy-MM-dd'),
      template_category: task.templateCategory || null,
      is_from_template: false,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (taskError || !taskData) {
    console.error('[createCustomTask] Error:', taskError);
    throw taskError;
  }

  const newTask = mapTaskFromDb(taskData);

  // Create subtasks if provided
  if (task.subtasks && task.subtasks.length > 0) {
    const subtaskInserts = task.subtasks.map((st, index) => ({
      task_id: taskData.id,
      title: st.title,
      description: st.description || null,
      is_completed: false,
      sort_order: index,
    }));

    const { data: subtaskData, error: subtaskError } = await supabase
      .from('task_subtasks')
      .insert(subtaskInserts)
      .select();

    if (subtaskError) {
      console.error('[createCustomTask] Error creating subtasks:', subtaskError);
    } else {
      newTask.subtasks = (subtaskData || []).map(mapSubtaskFromDb);
    }
  }

  return newTask;
}

// ============================================================================
// Subtask CRUD
// ============================================================================

/**
 * Add a subtask to a task.
 */
export async function addSubtask(
  taskId: string,
  title: string,
  description?: string
): Promise<TaskSubtask> {
  // Get the max sort_order for this task's subtasks
  const { data: existing } = await supabase
    .from('task_subtasks')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = (existing?.[0]?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from('task_subtasks')
    .insert({
      task_id: taskId,
      title,
      description: description || null,
      is_completed: false,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('[addSubtask] Error:', error);
    throw error;
  }

  return mapSubtaskFromDb(data);
}

/**
 * Update a subtask.
 */
export async function updateSubtask(
  subtaskId: string,
  updates: Partial<Pick<TaskSubtask, 'title' | 'description' | 'isCompleted' | 'sortOrder'>>
): Promise<TaskSubtask> {
  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('task_subtasks')
    .update(dbUpdates)
    .eq('id', subtaskId)
    .select()
    .single();

  if (error) {
    console.error('[updateSubtask] Error:', error);
    throw error;
  }

  return mapSubtaskFromDb(data);
}

/**
 * Delete a subtask.
 */
export async function deleteSubtask(subtaskId: string): Promise<void> {
  const { error } = await supabase
    .from('task_subtasks')
    .delete()
    .eq('id', subtaskId);

  if (error) {
    console.error('[deleteSubtask] Error:', error);
    throw error;
  }
}

/**
 * Toggle a subtask's completion status.
 */
export async function toggleSubtask(subtaskId: string): Promise<TaskSubtask> {
  // First get the current state
  const { data: current, error: fetchError } = await supabase
    .from('task_subtasks')
    .select('is_completed')
    .eq('id', subtaskId)
    .single();

  if (fetchError || !current) {
    throw fetchError || new Error('Subtask not found');
  }

  return updateSubtask(subtaskId, { isCompleted: !current.is_completed });
}

/**
 * Reorder subtasks within a task.
 */
export async function reorderSubtasks(
  items: TaskReorderItem[]
): Promise<void> {
  await Promise.all(
    items.map(({ id, sortOrder }) =>
      supabase
        .from('task_subtasks')
        .update({ sort_order: sortOrder })
        .eq('id', id)
    )
  );
}

// ============================================================================
// Database Mappers
// ============================================================================

function mapTaskFromDb(row: any): Task {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    startDate: row.start_date,
    status: row.status || 'not_started',
    priority: row.priority || 'medium',
    createdAt: row.created_at,
    category: row.category,
    templateCategory: row.template_category,
    isFromTemplate: row.is_from_template,
    sortOrder: row.sort_order,
    subtasks: [],
  };
}

function mapSubtaskFromDb(row: any): TaskSubtask {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    description: row.description,
    isCompleted: row.is_completed,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplateFromDb(row: any): WeddingTaskTemplate {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    priority: row.priority,
    startDateOffsetDays: row.start_date_offset_days,
    endDateOffsetDays: row.end_date_offset_days,
    sortOrder: row.sort_order,
    subtasks: row.subtasks || [],
    icon: row.icon,
  };
}
