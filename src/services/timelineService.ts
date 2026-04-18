import { supabase } from '@/integrations/supabase/client';
import {
  TaskDependency,
  TimelineTemplate,
  TimelineTemplateTask,
  TimelineTemplateDependency,
  WeddingDayTimeline,
  WeddingDayEvent,
  TimelineShare,
  TimelineTask,
  CriticalPathTask,
  TimelineVisualizationData,
  WeddingDayVisualizationData
} from '@/types/timeline';
import { Task } from '@/types';
import { addMinutes, parseISO, format, differenceInMinutes } from 'date-fns';

// Task Dependencies
export const fetchTaskDependencies = async (taskId: string): Promise<TaskDependency[]> => {
  // Fetch dependencies where this task is a predecessor
  const { data: predecessorDeps, error: predecessorError } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      predecessor_task_id,
      successor_task_id,
      dependency_type,
      lag_time,
      created_at,
      updated_at,
      successor_task:tasks(*)
    `)
    .eq('predecessor_task_id', taskId);

  if (predecessorError) {
    console.error('Error fetching predecessor dependencies:', predecessorError);
    throw predecessorError;
  }

  // Fetch dependencies where this task is a successor
  const { data: successorDeps, error: successorError } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      predecessor_task_id,
      successor_task_id,
      dependency_type,
      lag_time,
      created_at,
      updated_at,
      predecessor_task:tasks(*)
    `)
    .eq('successor_task_id', taskId);

  if (successorError) {
    console.error('Error fetching successor dependencies:', successorError);
    throw successorError;
  }

  // Combine and format the results
  const dependencies = [
    ...predecessorDeps.map(dep => ({
      id: dep.id,
      predecessorTaskId: dep.predecessor_task_id,
      successorTaskId: dep.successor_task_id,
      dependencyType: dep.dependency_type,
      lagTime: dep.lag_time,
      createdAt: dep.created_at,
      updatedAt: dep.updated_at,
      successorTask: dep.successor_task ? formatTask(dep.successor_task) : undefined
    })),
    ...successorDeps.map(dep => ({
      id: dep.id,
      predecessorTaskId: dep.predecessor_task_id,
      successorTaskId: dep.successor_task_id,
      dependencyType: dep.dependency_type,
      lagTime: dep.lag_time,
      createdAt: dep.created_at,
      updatedAt: dep.updated_at,
      predecessorTask: dep.predecessor_task ? formatTask(dep.predecessor_task) : undefined
    }))
  ];

  return dependencies;
};

export const createTaskDependency = async (
  predecessorTaskId: string,
  successorTaskId: string,
  dependencyType: string = 'finish_to_start',
  lagTime: number = 0
): Promise<TaskDependency> => {
  // Get the user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('task_dependencies')
    .insert({
      user_id: user.id,
      predecessor_task_id: predecessorTaskId,
      successor_task_id: successorTaskId,
      dependency_type: dependencyType,
      lag_time: lagTime
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task dependency:', error);
    throw error;
  }

  return {
    id: data.id,
    predecessorTaskId: data.predecessor_task_id,
    successorTaskId: data.successor_task_id,
    dependencyType: data.dependency_type,
    lagTime: data.lag_time,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const deleteTaskDependency = async (dependencyId: string): Promise<void> => {
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId);

  if (error) {
    console.error('Error deleting task dependency:', error);
    throw error;
  }
};

// Wedding Day Timeline
export const fetchWeddingDayTimeline = async (clientId: string): Promise<WeddingDayTimeline | null> => {
  const { data, error } = await supabase
    .from('wedding_day_timelines')
    .select(`
      id,
      client_id,
      name,
      wedding_date,
      description,
      is_shared,
      share_token,
      created_at,
      updated_at,
      events:wedding_day_events(*)
    `)
    .eq('client_id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No timeline found
      return null;
    }
    console.error('Error fetching wedding day timeline:', error);
    throw error;
  }

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    weddingDate: data.wedding_date,
    description: data.description,
    isShared: data.is_shared,
    shareToken: data.share_token,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    events: data.events ? data.events.map(formatWeddingDayEvent) : []
  };
};

export const createWeddingDayTimeline = async (
  clientId: string,
  name: string,
  weddingDate: string,
  description?: string
): Promise<WeddingDayTimeline> => {
  // Get the user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('wedding_day_timelines')
    .insert({
      user_id: user.id,
      client_id: clientId,
      name,
      wedding_date: weddingDate,
      description
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating wedding day timeline:', error);
    throw error;
  }

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    weddingDate: data.wedding_date,
    description: data.description,
    isShared: data.is_shared,
    shareToken: data.share_token,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    events: []
  };
};

// Wedding Day Events
export const createWeddingDayEvent = async (
  timelineId: string,
  event: Omit<WeddingDayEvent, 'id' | 'timelineId' | 'createdAt' | 'updatedAt'>
): Promise<WeddingDayEvent> => {
  const { data, error } = await supabase
    .from('wedding_day_events')
    .insert({
      timeline_id: timelineId,
      title: event.title,
      description: event.description,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      category: event.category,
      responsible_party: event.responsibleParty,
      notes: event.notes,
      is_critical_path: event.isCriticalPath
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating wedding day event:', error);
    throw error;
  }

  return formatWeddingDayEvent(data);
};

// Critical Path Analysis
export const analyzeCriticalPath = async (clientId: string): Promise<CriticalPathTask[]> => {
  // Fetch all tasks for the client
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    throw tasksError;
  }

  // Fetch all dependencies for these tasks
  const taskIds = tasks.map(task => task.id);
  const { data: dependencies, error: depsError } = await supabase
    .from('task_dependencies')
    .select('*')
    .in('predecessor_task_id', taskIds)
    .in('successor_task_id', taskIds);

  if (depsError) {
    console.error('Error fetching dependencies:', depsError);
    throw depsError;
  }

  // Implement critical path algorithm
  // This is a simplified version - a real implementation would be more complex
  const criticalPathTasks = calculateCriticalPath(tasks, dependencies);
  
  return criticalPathTasks;
};

// Helper functions
function formatTask(task: any): Task {
  return {
    id: task.id,
    clientId: task.client_id,
    title: task.title,
    description: task.description,
    dueDate: task.due_date,
    status: task.status,
    priority: task.priority,
    category: task.category,
    createdAt: task.created_at
  };
}

function formatWeddingDayEvent(event: any): WeddingDayEvent {
  return {
    id: event.id,
    timelineId: event.timeline_id,
    title: event.title,
    description: event.description,
    startTime: event.start_time,
    endTime: event.end_time,
    location: event.location,
    category: event.category,
    responsibleParty: event.responsible_party,
    notes: event.notes,
    isCriticalPath: event.is_critical_path,
    createdAt: event.created_at,
    updatedAt: event.updated_at
  };
}

function calculateCriticalPath(tasks: any[], dependencies: any[]): CriticalPathTask[] {
  // This is a placeholder for the actual critical path algorithm
  // A real implementation would use the Critical Path Method (CPM)
  
  // For now, we'll just mark tasks with no slack as critical
  return tasks.map(task => {
    const startDate = parseISO(task.due_date);
    const endDate = addMinutes(startDate, task.duration || 60);
    
    return {
      id: task.id,
      title: task.title,
      startDate,
      endDate,
      duration: task.duration || 60,
      earliestStart: 0,
      earliestFinish: task.duration || 60,
      latestStart: 0,
      latestFinish: task.duration || 60,
      slack: 0,
      isCritical: task.is_critical_path || false
    };
  });
}
