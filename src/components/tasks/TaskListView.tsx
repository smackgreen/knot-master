
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import DroppableWrapper from "./DroppableWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TaskCard from "@/components/TaskCard";
import { Client, Task } from "@/types";
import { useApp } from "@/context/AppContext";

interface TaskListViewProps {
  groupedTasks: {
    not_started: Task[];
    in_progress: Task[];
    completed: Task[];
    overdue: Task[];
  };
  clients: Client[];
  onDragEnd: (result: DropResult) => void;
  onEditTask?: (taskId: string) => void;
}

const TaskListView = ({ groupedTasks, clients, onDragEnd, onEditTask }: TaskListViewProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DroppableWrapper droppableId="overdue">
              {(provided) => (
                <div
                  className="space-y-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks.overdue.length > 0 ? (
                    groupedTasks.overdue.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              key={task.id}
                              task={task}
                              clients={clients}
                              isDragging={snapshot.isDragging}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">No overdue tasks.</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </DroppableWrapper>
          </CardContent>
        </Card>

        {/* Not Started Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="h-2 w-2 rounded-full p-0" />
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DroppableWrapper droppableId="not_started">
              {(provided) => (
                <div
                  className="space-y-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks.not_started.length > 0 ? (
                    groupedTasks.not_started.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              key={task.id}
                              task={task}
                              clients={clients}
                              isDragging={snapshot.isDragging}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">No tasks to display.</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </DroppableWrapper>
          </CardContent>
        </Card>

        {/* In Progress Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DroppableWrapper droppableId="in_progress">
              {(provided) => (
                <div
                  className="space-y-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks.in_progress.length > 0 ? (
                    groupedTasks.in_progress.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              key={task.id}
                              task={task}
                              clients={clients}
                              isDragging={snapshot.isDragging}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">No tasks to display.</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </DroppableWrapper>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-green-500 h-2 w-2 rounded-full p-0" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <DroppableWrapper droppableId="completed">
              {(provided) => (
                <div
                  className="space-y-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {groupedTasks.completed.length > 0 ? (
                    groupedTasks.completed.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              key={task.id}
                              task={task}
                              clients={clients}
                              isDragging={snapshot.isDragging}
                              onEditTask={onEditTask}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">No completed tasks.</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </DroppableWrapper>
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
};

export default TaskListView;
