import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RecentClientsProps {
  limit?: number;
}

const RecentClients = ({ limit }: RecentClientsProps) => {
  const { t } = useTranslation();
  const { clients } = useApp();

  // Get recent clients sorted by creation date
  const recentClients = useMemo(() => {
    const sortedClients = [...clients].sort((a, b) => {
      const dateA = new Date(a.createdAt || '');
      const dateB = new Date(b.createdAt || '');
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return limit ? sortedClients.slice(0, limit) : sortedClients;
  }, [clients, limit]);

  // Get initials from client name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'on_hold':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          {t('dashboard.recentClients')}
        </CardTitle>
        <Link to="/app/clients">
          <Button variant="ghost" size="sm" className="gap-1">
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentClients.length > 0 ? (
          <div className="space-y-4">
            {recentClients.map(client => (
              <div key={client.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link to={`/app/clients/${client.id}`} className="hover:underline">
                    <h3 className="font-medium truncate">{client.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">
                    {client.weddingDate ? formatDate(client.weddingDate) : t('common.noDateSet')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(client.status)}>
                    {t(`clients.${client.status}`)}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {client.createdAt ? formatDate(client.createdAt) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            {t('dashboard.noClientsFound')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentClients;
