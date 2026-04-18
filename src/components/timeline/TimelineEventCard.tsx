import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, MapPin, Users, Edit, Trash2, AlertTriangle, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { WeddingDayEvent } from "@/types/timeline";

interface TimelineEventCardProps {
  event: WeddingDayEvent;
  onEdit?: (event: WeddingDayEvent) => void;
  onDelete?: (eventId: string) => void;
}

const TimelineEventCard = ({ event, onEdit, onDelete }: TimelineEventCardProps) => {
  const { t } = useTranslation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedEvent, setEditedEvent] = useState<WeddingDayEvent>(event);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(editedEvent);
    }
    setIsEditDialogOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
    setIsDeleteDialogOpen(false);
  };

  const formatTime = (dateString: string | Date) => {
    try {
      return format(typeof dateString === 'string' ? parseISO(dateString) : dateString, 'h:mm a');
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const formatDate = (dateString: string | Date) => {
    try {
      return format(typeof dateString === 'string' ? parseISO(dateString) : dateString, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <Card className={`border-l-4 ${event.isCriticalPath ? 'border-l-red-500' : 'border-l-primary'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              {event.isCriticalPath && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="destructive" className="h-5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {t('timeline.criticalPath')}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('timeline.criticalPathEventDescription')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.startTime)}</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-4 w-4" />
                <span>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.responsibleParty && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{event.responsibleParty}</span>
                </div>
              )}
            </div>
            
            {event.description && (
              <p className="text-sm mt-2">{event.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('timeline.editEvent')}</DialogTitle>
            <DialogDescription>{t('timeline.editEventDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-event-title" className="text-sm font-medium">
                {t('timeline.eventTitle')}
              </label>
              <Input
                id="edit-event-title"
                value={editedEvent.title}
                onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-event-start-time" className="text-sm font-medium">
                  {t('timeline.startTime')}
                </label>
                <Input
                  id="edit-event-start-time"
                  type="datetime-local"
                  value={typeof editedEvent.startTime === 'string' 
                    ? editedEvent.startTime.substring(0, 16) 
                    : format(editedEvent.startTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setEditedEvent({ ...editedEvent, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-event-end-time" className="text-sm font-medium">
                  {t('timeline.endTime')}
                </label>
                <Input
                  id="edit-event-end-time"
                  type="datetime-local"
                  value={typeof editedEvent.endTime === 'string' 
                    ? editedEvent.endTime.substring(0, 16) 
                    : format(editedEvent.endTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setEditedEvent({ ...editedEvent, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-event-location" className="text-sm font-medium">
                {t('timeline.location')}
              </label>
              <Input
                id="edit-event-location"
                value={editedEvent.location || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-event-responsible" className="text-sm font-medium">
                {t('timeline.responsibleParty')}
              </label>
              <Input
                id="edit-event-responsible"
                value={editedEvent.responsibleParty || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, responsibleParty: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-event-description" className="text-sm font-medium">
                {t('timeline.description')}
              </label>
              <Textarea
                id="edit-event-description"
                value={editedEvent.description || ""}
                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-critical-path"
                checked={editedEvent.isCriticalPath}
                onChange={(e) => setEditedEvent({ ...editedEvent, isCriticalPath: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="edit-critical-path" className="text-sm font-medium">
                {t('timeline.criticalPathEvent')}
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('timeline.deleteEvent')}</DialogTitle>
            <DialogDescription>{t('timeline.deleteEventConfirmation')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TimelineEventCard;
