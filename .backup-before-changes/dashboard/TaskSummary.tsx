import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, getTaskStatusInfo } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface TaskSummaryProps {
  limit?: number;
}

const TaskSummary = ({ limit }: TaskSummaryProps) => {
  const { t } = useTranslation();
  const { tasks, clients } = useApp();

  // Get upcoming tasks sorted by due date
  const upcomingTasks = useMemo(() => {
    const incompleteTasks = tasks.filter(task => task.status !== 'completed');
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

    return limit ? sortedTasks.slice(0, limit) : sortedTasks;
  }, [tasks, limit]);

  // Get client name by ID
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : t('common.unknownClient');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {t('dashboard.upcomingTasks')}
        </CardTitle>
        <Link to="/app/tasks">
          <Button variant="ghost" size="sm" className="gap-1">
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <div className="space-y-3">
            {upcomingTasks.map(task => {
              const { color: statusColor, label: statusText } = getTaskStatusInfo(task.status, task.dueDate);

              return (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-full min-h-[2.5rem] ${statusColor} rounded-full`} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/tasks?id=${task.id}`} className="hover:underline">
                      <h3 className="font-medium truncate">{task.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">
                      {getClientName(task.clientId)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={statusColor.replace('bg-', 'border-')}>
                      {statusText}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {t('dashboard.noUpcomingTasks')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSummary;
