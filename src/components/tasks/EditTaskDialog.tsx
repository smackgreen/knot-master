import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Task } from "@/types";

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string | null;
}

const EditTaskDialog = ({ isOpen, onOpenChange, taskId }: EditTaskDialogProps) => {
  const { tasks, clients, updateTask } = useApp();
  const [editedTask, setEditedTask] = useState<{
    title: string;
    description: string;
    clientId: string;
    status: "not_started" | "in_progress" | "completed" | "overdue";
    priority: "low" | "medium" | "high";
    dueDate: string;
    category: string;
  }>({
    title: "",
    description: "",
    clientId: "",
    status: "not_started",
    priority: "medium",
    dueDate: new Date().toISOString().split('T')[0],
    category: "",
  });

  // Load task data when dialog opens or taskId changes
  useEffect(() => {
    if (isOpen && taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setEditedTask({
          title: task.title,
          description: task.description || "",
          clientId: task.clientId,
          status: task.status as "not_started" | "in_progress" | "completed" | "overdue",
          priority: task.priority as "low" | "medium" | "high",
          dueDate: task.dueDate,
          category: task.category || "",
        });
      }
    }
  }, [isOpen, taskId, tasks]);

  const handleUpdateTask = () => {
    if (!taskId) return;
    
    if (!editedTask.title) {
      alert("Please enter a task title");
      return;
    }
    
    if (!editedTask.clientId) {
      alert("Please select a client");
      return;
    }
    
    updateTask(taskId, editedTask);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input
              id="taskTitle"
              value={editedTask.title}
              onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editedTask.description}
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="client">Client</Label>
            <select
              id="client"
              value={editedTask.clientId}
              onChange={(e) => setEditedTask({...editedTask, clientId: e.target.value})}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.partnerName ? `& ${client.partnerName}` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as "low" | "medium" | "high"})}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editedTask.status}
                onChange={(e) => setEditedTask({...editedTask, status: e.target.value as "not_started" | "in_progress" | "completed" | "overdue"})}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={editedTask.dueDate}
              onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <select
              id="category"
              value={editedTask.category}
              onChange={(e) => setEditedTask({...editedTask, category: e.target.value})}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">None</option>
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="florist">Florist</option>
              <option value="music">Music</option>
              <option value="cake">Cake</option>
              <option value="attire">Attire</option>
              <option value="hair_makeup">Hair & Makeup</option>
              <option value="transportation">Transportation</option>
              <option value="rentals">Rentals</option>
              <option value="stationery">Stationery</option>
              <option value="gifts">Gifts</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdateTask}>Update Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
