
import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Tag, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Client, Task } from "@/types";
import { useApp } from "@/context/AppContext";
import { formatDate, getTaskStatusInfo, getPriorityBadge } from "@/utils/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskCardProps {
  task: Task;
  clients: Client[];
  isDragging?: boolean;
  onEditTask?: (taskId: string) => void;
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, clients, isDragging, onEditTask }, ref) => {
    const { updateTask, deleteTask } = useApp();
    const client = clients.find((c) => c.id === task.clientId);
    const statusInfo = getTaskStatusInfo(task.status, task.dueDate);
    const priorityInfo = getPriorityBadge(task.priority);

    const handleCompleteToggle = () => {
      updateTask(task.id, {
        status: task.status === "completed" ? "not_started" : "completed",
      });
    };

    const getCategoryColor = (category?: string) => {
      switch(category) {
        case 'venue': return 'bg-blue-100 text-blue-800';
        case 'catering': return 'bg-orange-100 text-orange-800';
        case 'photography': return 'bg-purple-100 text-purple-800';
        case 'videography': return 'bg-indigo-100 text-indigo-800';
        case 'florist': return 'bg-pink-100 text-pink-800';
        case 'music': return 'bg-cyan-100 text-cyan-800';
        case 'cake': return 'bg-rose-100 text-rose-800';
        case 'attire': return 'bg-teal-100 text-teal-800';
        case 'hair_makeup': return 'bg-fuchsia-100 text-fuchsia-800';
        case 'transportation': return 'bg-emerald-100 text-emerald-800';
        case 'rentals': return 'bg-amber-100 text-amber-800';
        case 'stationery': return 'bg-lime-100 text-lime-800';
        case 'gifts': return 'bg-violet-100 text-violet-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div
        ref={ref}
        className={`flex items-start p-4 border rounded-lg ${isDragging ? 'opacity-50 bg-secondary' : ''} cursor-move`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 mr-2"
          onClick={handleCompleteToggle}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-5 w-5 border rounded-full" />
          )}
          <span className="sr-only">
            {task.status === "completed" ? "Mark as incomplete" : "Mark as complete"}
          </span>
        </Button>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3
              className={`font-medium ${
                task.status === "completed" ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {task.category && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getCategoryColor(task.category)}`}>
                  <Tag className="h-3 w-3" />
                  {task.category.replace('_', ' ')}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                {priorityInfo.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Due: {formatDate(task.dueDate)}</p>

              {/* Edit button */}
              {onEditTask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTask(task.id);
                  }}
                >
                  <Edit size={14} />
                  <span className="sr-only">Edit</span>
                </Button>
              )}

              {/* Delete button with confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 size={14} />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTask(task.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {client && (
              <p className="text-xs">
                Client:
                <Button variant="link" asChild className="h-auto p-0 text-xs">
                  <Link to={`/clients/${client.id}`}>
                    {client.name} {client.partnerName ? `& ${client.partnerName}` : ''}
                  </Link>
                </Button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TaskCard.displayName = "TaskCard";

export default TaskCard;
