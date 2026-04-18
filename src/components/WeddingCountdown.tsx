
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeart, Clock } from "lucide-react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

interface WeddingCountdownProps {
  clientId?: string;
}

export default function WeddingCountdown({ clientId }: WeddingCountdownProps) {
  const { clients } = useApp();
  const [countdowns, setCountdowns] = useState<{[key: string]: {days: number, text: string, isPast: boolean}}>({});
  
  // Function to calculate days until wedding
  const calculateCountdown = (weddingDate: string) => {
    const date = parseISO(weddingDate);
    const now = new Date();
    
    // Check if the date is in the past
    if (isPast(date)) {
      const distance = formatDistanceToNow(date);
      return { 
        days: 0, 
        text: `Wedding was ${distance} ago`, 
        isPast: true
      };
    }
    
    // Calculate days until wedding
    const timeDiff = date.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const distance = formatDistanceToNow(date, { addSuffix: true });
    
    return { 
      days: daysDiff,
      text: `Wedding is ${distance}`,
      isPast: false
    };
  };
  
  useEffect(() => {
    // Calculate countdown for all active clients or a specific client
    const relevantClients = clientId 
      ? clients.filter(c => c.id === clientId && c.status === 'active')
      : clients.filter(c => c.status === 'active');
      
    const newCountdowns: {[key: string]: {days: number, text: string, isPast: boolean}} = {};
    
    relevantClients.forEach(client => {
      if (client.weddingDate) {
        newCountdowns[client.id] = calculateCountdown(client.weddingDate.toString());
      }
    });
    
    setCountdowns(newCountdowns);
    
    // Update countdown every day
    const interval = setInterval(() => {
      const updatedCountdowns: {[key: string]: {days: number, text: string, isPast: boolean}} = {};
      
      relevantClients.forEach(client => {
        if (client.weddingDate) {
          updatedCountdowns[client.id] = calculateCountdown(client.weddingDate.toString());
        }
      });
      
      setCountdowns(updatedCountdowns);
    }, 86400000); // Update every 24 hours
    
    return () => clearInterval(interval);
  }, [clients, clientId]);
  
  // If this is for a specific client
  if (clientId) {
    const countdown = countdowns[clientId];
    if (!countdown) return null;
    
    return (
      <Card className={`border-2 ${countdown.isPast ? 'border-gray-300' : 'border-primary'} mb-6`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarHeart className="h-6 w-6 text-primary" />
            <h2 className="font-medium">{countdown.text}</h2>
          </div>
          {!countdown.isPast && (
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              {countdown.days} {countdown.days === 1 ? 'day' : 'days'} left
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // For all clients (task dashboard)
  const upcomingWeddings = Object.entries(countdowns)
    .filter(([_, countdown]) => !countdown.isPast)
    .sort(([_, a], [__, b]) => a.days - b.days);
  
  if (upcomingWeddings.length === 0) return null;
  
  // If there are upcoming weddings, show the closest one
  const [closestClientId, closestCountdown] = upcomingWeddings[0];
  const closestClient = clients.find(c => c.id === closestClientId);
  
  if (!closestClient) return null;
  
  return (
    <Card className="border-2 border-primary mb-6">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Next wedding</p>
            <h2 className="font-medium">{closestClient.name} & {closestClient.partnerName}</h2>
          </div>
        </div>
        <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          {closestCountdown.days} {closestCountdown.days === 1 ? 'day' : 'days'} left
        </div>
      </CardContent>
    </Card>
  );
}
