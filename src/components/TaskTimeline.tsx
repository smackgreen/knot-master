
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, Client } from "@/types";
import { useApp } from "@/context/AppContext";
import {
  parseISO, format, addWeeks, isSameWeek, startOfWeek, endOfWeek,
  addMonths, isSameMonth, startOfMonth, endOfMonth, isWithinInterval,
  isSameDay, getDate, getDaysInMonth, getDay, addDays
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import TaskCard from "./TaskCard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateI18n } from "@/utils/formatters";

interface TaskTimelineProps {
  tasks: Task[];
  clients: Client[];
  view: "week" | "month";
  searchTerm?: string;
}

export default function TaskTimeline({ tasks, clients, view, searchTerm = "" }: TaskTimelineProps) {
  const { updateTask } = useApp();
  const { t } = useTranslation();
  const now = new Date();

  // Timeline dates setup
  const [currentDate, setCurrentDate] = useState(now);

  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => {
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return searchMatch;
  });

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      const taskDate = parseISO(task.dueDate.toString());
      return isSameDay(taskDate, date);
    });
  };

  // Get all tasks for a month
  const getTasksForMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    return filteredTasks.filter(task => {
      const taskDate = parseISO(task.dueDate.toString());
      return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
    });
  };

  // Get all tasks for a week
  const getTasksForWeek = (date: Date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);

    return filteredTasks.filter(task => {
      const taskDate = parseISO(task.dueDate.toString());
      return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
    });
  };

  // Handle task date change via drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // If dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task
    const task = filteredTasks.find(t => t.id === draggableId);
    if (!task) return;

    // Parse the destination droppableId to get the date
    // Format is 'date-YYYY-MM-DD'
    const dateStr = destination.droppableId.replace('date-', '');
    const [year, month, day] = dateStr.split('-').map(Number);
    const newDueDate = new Date(year, month - 1, day);

    // Update the task
    updateTask(task.id, {
      dueDate: newDueDate.toISOString()
    });
  };

  // Navigate timeline
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? addWeeks(currentDate, -1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? addMonths(currentDate, -1) : addMonths(currentDate, 1));
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {view === "week"
            ? `${t('tasks.weekView')}: ${formatDateI18n(startOfWeek(currentDate), 'MMM d')} - ${formatDateI18n(endOfWeek(currentDate), 'MMM d, yyyy')}`
            : `${t('tasks.monthView')}: ${formatDateI18n(currentDate, 'MMMM yyyy')}`
          }
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigate('next')}
          >
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {view === "month" ? (
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>{formatDateI18n(currentDate, 'MMMM yyyy')}</span>
                <Badge variant="outline">
                  {getTasksForMonth(currentDate).length} {t('tasks.tasks')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {[
                  t('common.days.sun'),
                  t('common.days.mon'),
                  t('common.days.tue'),
                  t('common.days.wed'),
                  t('common.days.thu'),
                  t('common.days.fri'),
                  t('common.days.sat')
                ].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {(() => {
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(currentDate);
                  const startDate = startOfWeek(monthStart);
                  const endDate = endOfWeek(monthEnd);

                  const days = [];
                  let day = startDate;

                  while (day <= endDate) {
                    const formattedDate = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const tasksForDay = getTasksForDate(day);
                    const dayNumber = getDate(day);

                    days.push(
                      <Droppable key={formattedDate} droppableId={`date-${formattedDate}`}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[100px] border rounded-md p-1 ${
                              isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                            } ${isSameDay(day, new Date()) ? 'border-primary' : ''}`}
                          >
                            <div className="text-right text-sm font-medium p-1">
                              {dayNumber}
                            </div>

                            <div className="space-y-1">
                              {tasksForDay.slice(0, 3).map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`p-1 rounded text-xs ${
                                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                        'bg-green-100 text-green-800'
                                      } ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                    >
                                      <div className="truncate">{task.title}</div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}

                              {tasksForDay.length > 3 && (
                                <div className="text-xs text-center text-muted-foreground">
                                  {t('tasks.moreTasks', { count: tasksForDay.length - 3 })}
                                </div>
                              )}
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    );

                    day = addDays(day, 1);
                  }

                  return days;
                })()}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Week view
          <div className="space-y-4">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(startOfWeek(currentDate), i);
              const formattedDate = format(day, 'yyyy-MM-dd');
              const tasksForDay = getTasksForDate(day);

              return (
                <Card key={formattedDate} className={`border ${isSameDay(day, new Date()) ? 'border-primary' : ''}`}>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <span>{formatDateI18n(day, 'EEEE, MMMM d')}</span>
                      <Badge variant="outline">
                        {tasksForDay.length} {t('tasks.tasks')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={`date-${formattedDate}`}>
                      {(provided) => (
                        <div
                          className="min-h-[100px]"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {tasksForDay.length > 0 ? (
                            <div className="space-y-2">
                              {tasksForDay.map((task, index) => {
                                // Find the client for this task
                                const client = clients.find(c => c.id === task.clientId);

                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <div className={`p-3 rounded-lg border ${snapshot.isDragging ? 'bg-accent' : 'bg-card'} shadow-sm`}>
                                          <h3 className="font-medium text-sm truncate">{task.title}</h3>

                                          {client && (
                                            <div className="mt-1 text-xs text-muted-foreground truncate">
                                              {t('tasks.for')}: {client.name} & {client.partnerName}
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                              task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                              'bg-green-100 text-green-800'
                                            }`}>
                                              {t(`tasks.${task.priority}`)}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                              task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                            }`}>
                                              {t(`tasks.${task.status.replace('_', '')}`).toLowerCase()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center py-8 text-muted-foreground text-sm">
                              {t('tasks.noTasksForThisDay')}
                            </p>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DragDropContext>
    </div>
  );
}
