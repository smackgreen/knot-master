/**
 * Wedding Tasks Page
 *
 * Displays the wedding task management board for a specific client/wedding.
 * Integrates the WeddingTaskBoard with template seeding and custom task creation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchClientTasks, createTasksFromTemplates } from '@/services/weddingTaskTemplateService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Sparkles, ArrowLeft } from 'lucide-react';

import WeddingTaskBoard from '@/components/tasks/WeddingTaskBoard';
import AddCustomTaskDialog from '@/components/tasks/AddCustomTaskDialog';

const WeddingTasks: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddTask, setShowAddTask] = useState(false);

  // Fetch tasks for this client
  const {
    data: tasks = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['weddingTasks', clientId],
    queryFn: () => fetchClientTasks(clientId!),
    enabled: !!clientId,
  });

  // Seed templates mutation
  const seedMutation = useMutation({
    mutationFn: () =>
      createTasksFromTemplates({
        clientId: clientId!,
        weddingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year from now
      }),
    onSuccess: (createdTasks) => {
      toast({
        title: t('tasks.templatesSeeded', 'Templates Applied'),
        description: t(
          'tasks.templatesSeededDescription',
          `{{count}} wedding planning tasks have been created.`,
          { count: createdTasks.length }
        ),
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to seed templates',
        variant: 'destructive',
      });
    },
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t('tasks.noClientSelected', 'No client selected')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 mb-4">{t('tasks.errorLoading', 'Error loading tasks')}</p>
        <Button onClick={() => refetch()}>{t('common.retry', 'Retry')}</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('tasks.weddingPlanner', 'Wedding Task Planner')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('tasks.weddingPlannerDescription', 'Manage and track all your wedding planning tasks')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length === 0 && (
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="gap-2"
            >
              {seedMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t('tasks.applyTemplates', 'Apply Wedding Templates')}
            </Button>
          )}
          <Button onClick={() => setShowAddTask(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('tasks.addTask', 'Add Task')}
          </Button>
        </div>
      </div>

      {/* Task Board */}
      <WeddingTaskBoard
        tasks={tasks}
        clientId={clientId}
        onTasksChanged={handleRefresh}
      />

      {/* Add Custom Task Dialog */}
      <AddCustomTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        clientId={clientId}
        onTaskCreated={handleRefresh}
      />
    </div>
  );
};

export default WeddingTasks;
