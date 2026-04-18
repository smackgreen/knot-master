
import { Button } from "@/components/ui/button";
import { CheckSquare, PlusCircle, ListChecks, CalendarRange } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

interface TaskHeaderProps {
  viewMode: "list" | "timeline";
  onViewModeChange: (value: "list" | "timeline") => void;
  onAddTaskClick: () => void;
}

const TaskHeader = ({
  viewMode,
  onViewModeChange,
  onAddTaskClick
}: TaskHeaderProps) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Header and Add Task Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <CheckSquare className="h-6 w-6" /> {t('tasks.title')}
        </h1>
        <Button onClick={onAddTaskClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('tasks.addTask')}
        </Button>
      </div>

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => onViewModeChange(v as "list" | "timeline")}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            {t('tasks.listView')}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            {t('tasks.timeline')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
};

export default TaskHeader;
