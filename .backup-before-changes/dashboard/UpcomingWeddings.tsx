import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, getDaysRemaining, getWeddingStatusInfo } from "@/utils/formatters";

interface UpcomingWeddingsProps {
  limit?: number;
}

const UpcomingWeddings = ({ limit }: UpcomingWeddingsProps) => {
  const { t } = useTranslation();
  const { clients } = useApp();

  // Get upcoming weddings sorted by date
  const upcomingWeddings = useMemo(() => {
    const activeClients = clients.filter(client => client.status === 'active');
    const sortedClients = [...activeClients].sort((a, b) => {
      const dateA = new Date(a.weddingDate || '');
      const dateB = new Date(b.weddingDate || '');
      return dateA.getTime() - dateB.getTime();
    });

    return limit ? sortedClients.slice(0, limit) : sortedClients;
  }, [clients, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {t('dashboard.upcomingWeddings')}
        </CardTitle>
        <Link to="/app/clients">
          <Button variant="ghost" size="sm" className="gap-1">
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {upcomingWeddings.length > 0 ? (
          <div className="space-y-4">
            {upcomingWeddings.map(client => {
              const { color: statusColor, label: statusText } = getWeddingStatusInfo(client.status, client.weddingDate);
              const daysRemaining = getDaysRemaining(client.weddingDate);

              return (
                <div key={client.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full ${statusColor} flex items-center justify-center`}>
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/clients/${client.id}`} className="hover:underline">
                      <h3 className="font-medium truncate">{client.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">
                      {client.weddingDate ? formatDate(client.weddingDate) : t('common.noDateSet')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor} text-white`}>
                      {statusText}
                    </span>
                    {daysRemaining !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {daysRemaining > 0
                          ? t('dashboard.daysRemaining', { count: daysRemaining })
                          : t('dashboard.daysAgo', { count: Math.abs(daysRemaining) })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {t('dashboard.noUpcomingWeddings')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingWeddings;
