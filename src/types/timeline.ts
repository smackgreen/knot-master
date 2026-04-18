// Types for the advanced timeline management features

import { Task, VendorCategory } from "./index";

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export interface TaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
  lagTime: number; // in minutes
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  predecessorTask?: Task;
  successorTask?: Task;
}

export interface TimelineTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  tasks?: TimelineTemplateTask[];
  dependencies?: TimelineTemplateDependency[];
}

export interface TimelineTemplateTask {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  relativeDay: number; // Days relative to wedding date (can be negative)
  duration: number; // in minutes
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  category?: VendorCategory;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TimelineTemplateDependency {
  id: string;
  templateId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
  lagTime: number; // in minutes
  createdAt: Date | string;
  updatedAt: Date | string;
  // Joined data
  predecessorTask?: TimelineTemplateTask;
  successorTask?: TimelineTemplateTask;
}

export interface WeddingDayTimeline {
  id: string;
  clientId: string;
  name: string;
  weddingDate: Date | string;
  description?: string;
  isShared: boolean;
  shareToken?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  events?: WeddingDayEvent[];
  shares?: TimelineShare[];
  // Joined data
  clientName?: string;
}

export interface WeddingDayEvent {
  id: string;
  timelineId: string;
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  category?: string;
  responsibleParty?: string;
  notes?: string;
  isCriticalPath: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TimelineShare {
  id: string;
  timelineId: string;
  email: string;
  name?: string;
  accessLevel: 'view' | 'edit';
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Extended Task interface with timeline-specific properties
export interface TimelineTask extends Task {
  duration: number; // in minutes
  isCriticalPath: boolean;
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
}

// Critical path analysis types
export interface CriticalPathTask {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  duration: number;
  earliestStart: number; // in minutes from project start
  earliestFinish: number; // in minutes from project start
  latestStart: number; // in minutes from project start
  latestFinish: number; // in minutes from project start
  slack: number; // in minutes
  isCritical: boolean;
}

// Timeline visualization types
export interface TimelineVisualizationData {
  tasks: TimelineVisualizationTask[];
  links: TimelineVisualizationLink[];
  criticalPath: string[]; // Array of task IDs in the critical path
}

export interface TimelineVisualizationTask {
  id: string;
  text: string;
  start_date: Date | string;
  end_date: Date | string;
  duration: number;
  progress: number;
  parent?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  color?: string;
  textColor?: string;
  isCritical?: boolean;
}

export interface TimelineVisualizationLink {
  id: string;
  source: string;
  target: string;
  type: string; // Based on dependency type
}

// Wedding day timeline visualization types
export interface WeddingDayVisualizationData {
  events: WeddingDayVisualizationEvent[];
  criticalPath: string[]; // Array of event IDs in the critical path
}

export interface WeddingDayVisualizationEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  location?: string;
  category?: string;
  responsibleParty?: string;
  isCritical?: boolean;
  color?: string;
  textColor?: string;
}

// Timeline export types
export interface TimelineExportOptions {
  format: 'pdf' | 'excel' | 'ics' | 'google';
  includeDetails: boolean;
  includeCriticalPath: boolean;
  includeResponsibleParties: boolean;
  includeNotes: boolean;
}
