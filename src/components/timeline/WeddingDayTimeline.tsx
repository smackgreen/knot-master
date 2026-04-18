import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, MapPin, Users, Plus, Download, Share2, Trash2, Edit, Save, ArrowRight, AlertTriangle } from "lucide-react";
import { format, parseISO, addMinutes } from "date-fns";
import { WeddingDayTimeline as WeddingDayTimelineType, WeddingDayEvent } from "@/types/timeline";
import { fetchWeddingDayTimeline, createWeddingDayTimeline, createWeddingDayEvent } from "@/services/timelineService";
import TimelineEventCard from "./TimelineEventCard";
import TimelineVisualization from "./TimelineVisualization";
import CriticalPathView from "./CriticalPathView";

interface WeddingDayTimelineProps {
  clientId: string;
  weddingDate: string;
}

const WeddingDayTimeline = ({ clientId, weddingDate }: WeddingDayTimelineProps) => {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState<WeddingDayTimelineType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState("");
  const [newTimelineDescription, setNewTimelineDescription] = useState("");
  const [newEvent, setNewEvent] = useState<Partial<WeddingDayEvent>>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "",
    responsibleParty: "",
    notes: "",
    isCriticalPath: false
  });

  useEffect(() => {
    const loadTimeline = async () => {
      setIsLoading(true);
      try {
        const timelineData = await fetchWeddingDayTimeline(clientId);
        setTimeline(timelineData);
      } catch (error) {
        console.error("Error loading timeline:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeline();
  }, [clientId]);

  const handleCreateTimeline = async () => {
    try {
      const newTimeline = await createWeddingDayTimeline(
        clientId,
        newTimelineName,
        weddingDate,
        newTimelineDescription
      );
      setTimeline(newTimeline);
      setIsCreateDialogOpen(false);
      setNewTimelineName("");
      setNewTimelineDescription("");
    } catch (error) {
      console.error("Error creating timeline:", error);
    }
  };

  const handleAddEvent = async () => {
    if (!timeline || !newEvent.title || !newEvent.startTime || !newEvent.endTime) return;

    try {
      const createdEvent = await createWeddingDayEvent(timeline.id, {
        title: newEvent.title || "",
        description: newEvent.description || "",
        startTime: newEvent.startTime || new Date().toISOString(),
        endTime: newEvent.endTime || new Date().toISOString(),
        location: newEvent.location || "",
        category: newEvent.category || "",
        responsibleParty: newEvent.responsibleParty || "",
        notes: newEvent.notes || "",
        isCriticalPath: newEvent.isCriticalPath || false
      });

      setTimeline({
        ...timeline,
        events: [...(timeline.events || []), createdEvent]
      });

      setIsAddEventDialogOpen(false);
      setNewEvent({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        category: "",
        responsibleParty: "",
        notes: "",
        isCriticalPath: false
      });
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleExportTimeline = () => {
    // Implementation for exporting timeline
    console.log("Exporting timeline...");
  };

  const handleShareTimeline = () => {
    // Implementation for sharing timeline
    console.log("Sharing timeline...");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('timeline.weddingDayTimeline')}</CardTitle>
          <CardDescription>{t('timeline.loading')}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin">
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('timeline.weddingDayTimeline')}</CardTitle>
          <CardDescription>{t('timeline.noTimelineFound')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8 space-y-4">
          <div className="text-center">
            <p className="mb-4">{t('timeline.createTimelinePrompt')}</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('timeline.createTimeline')}
            </Button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('timeline.createNewTimeline')}</DialogTitle>
                <DialogDescription>{t('timeline.createTimelineDescription')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="timeline-name" className="text-sm font-medium">
                    {t('timeline.timelineName')}
                  </label>
                  <Input
                    id="timeline-name"
                    value={newTimelineName}
                    onChange={(e) => setNewTimelineName(e.target.value)}
                    placeholder={t('timeline.timelineNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="timeline-description" className="text-sm font-medium">
                    {t('timeline.description')}
                  </label>
                  <Textarea
                    id="timeline-description"
                    value={newTimelineDescription}
                    onChange={(e) => setNewTimelineDescription(e.target.value)}
                    placeholder={t('timeline.descriptionPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateTimeline} disabled={!newTimelineName}>
                  {t('timeline.createTimeline')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{timeline.name}</CardTitle>
          <CardDescription>{timeline.description}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportTimeline}>
            <Download className="mr-2 h-4 w-4" />
            {t('timeline.export')}
          </Button>
          <Button variant="outline" onClick={handleShareTimeline}>
            <Share2 className="mr-2 h-4 w-4" />
            {t('timeline.share')}
          </Button>
          <Button onClick={() => setIsAddEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('timeline.addEvent')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">{t('timeline.timeline')}</TabsTrigger>
            <TabsTrigger value="visualization">{t('timeline.visualization')}</TabsTrigger>
            <TabsTrigger value="criticalPath">{t('timeline.criticalPath')}</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {timeline.events && timeline.events.length > 0 ? (
              <div className="space-y-4">
                {timeline.events
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('timeline.noEvents')}</p>
                <Button className="mt-4" onClick={() => setIsAddEventDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('timeline.addFirstEvent')}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="visualization">
            <TimelineVisualization events={timeline.events || []} />
          </TabsContent>

          <TabsContent value="criticalPath">
            <CriticalPathView clientId={clientId} events={timeline.events || []} />
          </TabsContent>
        </Tabs>

        <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('timeline.addEvent')}</DialogTitle>
              <DialogDescription>{t('timeline.addEventDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="event-title" className="text-sm font-medium">
                  {t('timeline.eventTitle')}
                </label>
                <Input
                  id="event-title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder={t('timeline.eventTitlePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="event-start-time" className="text-sm font-medium">
                    {t('timeline.startTime')}
                  </label>
                  <Input
                    id="event-start-time"
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="event-end-time" className="text-sm font-medium">
                    {t('timeline.endTime')}
                  </label>
                  <Input
                    id="event-end-time"
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="event-location" className="text-sm font-medium">
                  {t('timeline.location')}
                </label>
                <Input
                  id="event-location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder={t('timeline.locationPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="event-responsible" className="text-sm font-medium">
                  {t('timeline.responsibleParty')}
                </label>
                <Input
                  id="event-responsible"
                  value={newEvent.responsibleParty}
                  onChange={(e) => setNewEvent({ ...newEvent, responsibleParty: e.target.value })}
                  placeholder={t('timeline.responsiblePartyPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="event-description" className="text-sm font-medium">
                  {t('timeline.description')}
                </label>
                <Textarea
                  id="event-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder={t('timeline.descriptionPlaceholder')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="critical-path"
                  checked={newEvent.isCriticalPath}
                  onChange={(e) => setNewEvent({ ...newEvent, isCriticalPath: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="critical-path" className="text-sm font-medium">
                  {t('timeline.criticalPathEvent')}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('timeline.criticalPathTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddEventDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleAddEvent} 
                disabled={!newEvent.title || !newEvent.startTime || !newEvent.endTime}
              >
                {t('timeline.addEvent')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WeddingDayTimeline;
