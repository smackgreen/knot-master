
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DropResult } from "react-beautiful-dnd";
import { Task } from "@/types";
import { useTranslation } from "react-i18next";
import WeddingCountdown from "@/components/WeddingCountdown";
import TaskTimeline from "@/components/TaskTimeline";
import TaskHeader from "@/components/tasks/TaskHeader";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskListView from "@/components/tasks/TaskListView";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";

const Tasks = () => {
  const { tasks, clients, updateTask } = useApp();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [timelineView, setTimelineView] = useState<"week" | "month">("week");

  // Filter tasks based on search, status, priority, and category
  const filteredTasks = tasks.filter(task => {
    const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    const categoryMatch = categoryFilter === "all" || task.category === categoryFilter;

    return searchMatch && statusMatch && priorityMatch && categoryMatch;
  });

  // Group tasks by status for the list view
  const groupedTasks = {
    not_started: filteredTasks.filter(task => task.status === "not_started"),
    in_progress: filteredTasks.filter(task => task.status === "in_progress"),
    completed: filteredTasks.filter(task => task.status === "completed"),
    overdue: filteredTasks.filter(task => task.status === "overdue"),
  };

  // Handle drag and drop in list view
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped in the same place, do nothing
    if (!destination ||
        (destination.droppableId === source.droppableId &&
         destination.index === source.index)) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update the task status based on the destination droppableId
    const newStatus = destination.droppableId as "not_started" | "in_progress" | "completed" | "overdue";

    // Only update if the status is changing
    if (task.status !== newStatus) {
      updateTask(task.id, { status: newStatus });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Wedding Countdown */}
      <WeddingCountdown />

      {/* Task Header with view mode tabs */}
      <TaskHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
      />

      {/* Search and filters */}
      <TaskFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        categoryFilter={categoryFilter}
        timelineView={timelineView}
        viewMode={viewMode}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onCategoryChange={setCategoryFilter}
        onTimelineViewChange={(view) => setTimelineView(view)}
      />

      {/* Task Views (List or Timeline) */}
      {viewMode === "list" ? (
        <TaskListView
          groupedTasks={groupedTasks}
          clients={clients}
          onDragEnd={handleDragEnd}
          onEditTask={(taskId) => {
            setSelectedTaskId(taskId);
            setIsEditTaskOpen(true);
          }}
        />
      ) : (
        <TaskTimeline
          tasks={filteredTasks}
          clients={clients}
          view={timelineView}
          searchTerm={searchTerm}
        />
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        isOpen={isEditTaskOpen}
        onOpenChange={setIsEditTaskOpen}
        taskId={selectedTaskId}
      />
    </div>
  );
};

export default Tasks;
