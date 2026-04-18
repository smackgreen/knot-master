import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import {
  InventoryItem,
  StaffMember,
  Equipment,
  Vehicle,
  InventoryBooking,
  StaffAssignment,
  EquipmentBooking,
  TransportationSchedule
} from "@/types/resources";
import { fetchStaffAssignments } from "@/services/resourceService";

interface ResourceCalendarProps {
  activeTab: string;
  inventoryItems: InventoryItem[];
  staffMembers: StaffMember[];
  equipment: Equipment[];
  vehicles: Vehicle[];
}

const ResourceCalendar = ({
  activeTab,
  inventoryItems,
  staffMembers,
  equipment,
  vehicles
}: ResourceCalendarProps) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    resourceId: "",
    clientId: "",
    startTime: "",
    endTime: "",
    notes: ""
  });

  useEffect(() => {
    // Calculate the days of the current week
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    setWeekDays(days);

    // Reset selected resource when tab changes
    setSelectedResource("");
    setBookings([]);
  }, [currentDate, activeTab]);

  useEffect(() => {
    if (selectedResource) {
      loadBookings();
    }
  }, [selectedResource]);

  const loadBookings = async () => {
    try {
      if (activeTab === "staff" && selectedResource) {
        // For demonstration, we'll only implement staff assignments
        const startDate = format(weekDays[0], "yyyy-MM-dd");
        const endDate = format(weekDays[6], "yyyy-MM-dd");
        const assignments = await fetchStaffAssignments(selectedResource, undefined, startDate, endDate);
        setBookings(assignments);
      } else {
        // For other resource types, we would fetch their bookings here
        setBookings([]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };

  const handleResourceChange = (resourceId: string) => {
    setSelectedResource(resourceId);
  };

  const handleAddBooking = () => {
    // Make sure weekDays array is not empty before using it
    if (!weekDays.length) {
      console.error('weekDays array is empty');
      return;
    }

    try {
      setNewBooking({
        resourceId: selectedResource,
        clientId: "",
        startTime: `${format(weekDays[0], "yyyy-MM-dd")}T09:00`,
        endTime: `${format(weekDays[0], "yyyy-MM-dd")}T10:00`,
        notes: ""
      });
      setIsAddBookingOpen(true);
    } catch (error) {
      console.error('Error in handleAddBooking:', error);
      // Use current date as fallback
      const today = new Date();
      const formattedDate = format(today, "yyyy-MM-dd");
      setNewBooking({
        resourceId: selectedResource,
        clientId: "",
        startTime: `${formattedDate}T09:00`,
        endTime: `${formattedDate}T10:00`,
        notes: ""
      });
      setIsAddBookingOpen(true);
    }
  };

  const handleSaveBooking = () => {
    // In a real implementation, this would call an API to create the booking
    console.log("Saving booking:", newBooking);
    setIsAddBookingOpen(false);
    // After saving, reload the bookings
    loadBookings();
  };

  const getResourceOptions = () => {
    switch (activeTab) {
      case "inventory":
        return inventoryItems.map(item => ({
          id: item.id,
          name: item.name,
          status: item.status
        }));
      case "staff":
        return staffMembers.map(staff => ({
          id: staff.id,
          name: staff.name,
          status: staff.status
        }));
      case "equipment":
        return equipment.map(item => ({
          id: item.id,
          name: item.name,
          status: item.status
        }));
      case "vehicles":
        return vehicles.map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name,
          status: vehicle.status
        }));
      default:
        return [];
    }
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => {
      try {
        // Handle different types of date values
        let startDate: Date;
        if (booking.startTime instanceof Date) {
          startDate = booking.startTime;
        } else if (typeof booking.startTime === 'string') {
          startDate = parseISO(booking.startTime);
        } else {
          console.warn('Invalid startTime format:', booking.startTime);
          return false;
        }

        return isSameDay(startDate, day);
      } catch (error) {
        console.error('Error parsing booking date:', error, booking);
        return false;
      }
    });
  };

  const formatTimeRange = (startTime: string | Date, endTime: string | Date) => {
    try {
      // Handle start time
      let start: Date;
      if (startTime instanceof Date) {
        start = startTime;
      } else if (typeof startTime === 'string') {
        start = parseISO(startTime);
      } else {
        return 'Invalid time format';
      }

      // Handle end time
      let end: Date;
      if (endTime instanceof Date) {
        end = endTime;
      } else if (typeof endTime === 'string') {
        end = parseISO(endTime);
      } else {
        return `${format(start, "h:mm a")} - Invalid time`;
      }

      // Validate dates before formatting
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid time range';
      }

      return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`;
    } catch (error) {
      console.error('Error formatting time range:', error, { startTime, endTime });
      return 'Invalid time range';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('resources.resourceCalendar')}</CardTitle>
            <CardDescription>{t('resources.resourceCalendarDescription')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {weekDays.length > 0 ? (
                <>
                  {format(weekDays[0], "MMM d")} - {format(weekDays[weekDays.length - 1], "MMM d, yyyy")}
                </>
              ) : (
                "Select a date range"
              )}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Select value={selectedResource} onValueChange={handleResourceChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder={t('resources.selectResource')} />
            </SelectTrigger>
            <SelectContent>
              {getResourceOptions().map(resource => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAddBooking}
            disabled={!selectedResource}
          >
            <Plus className="mr-2 h-4 w-4" />
            {getBookingButtonText()}
          </Button>
        </div>

        {selectedResource ? (
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {weekDays.map(day => (
              <div key={day.toString()} className="text-center p-2 border-b">
                <div className="font-medium">
                  {(() => {
                    try {
                      return format(day, "EEE");
                    } catch (error) {
                      console.error('Error formatting day header:', error, day);
                      return 'Invalid';
                    }
                  })()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      return format(day, "MMM d");
                    } catch (error) {
                      console.error('Error formatting day date:', error, day);
                      return 'Invalid date';
                    }
                  })()}
                </div>
              </div>
            ))}

            {/* Calendar cells */}
            {weekDays.map(day => (
              <div
                key={day.toString()}
                className="h-40 border rounded-md p-2 overflow-y-auto"
              >
                {getBookingsForDay(day).length > 0 ? (
                  <div className="space-y-2">
                    {getBookingsForDay(day).map(booking => (
                      <div
                        key={booking.id}
                        className="text-xs p-2 rounded-md bg-primary/10 border border-primary/20"
                      >
                        <div className="font-medium truncate">{booking.title}</div>
                        <div className="text-muted-foreground">
                          {formatTimeRange(booking.startTime, booking.endTime)}
                        </div>
                        {booking.clientName && (
                          <div className="truncate">{booking.clientName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    {t('resources.noBookings')}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">{t('resources.selectResourcePrompt')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('resources.selectResourceDescription')}
            </p>
          </div>
        )}
      </CardContent>

      {/* Add Booking Dialog */}
      <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getAddBookingTitle()}</DialogTitle>
            <DialogDescription>{getAddBookingDescription()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start-time" className="text-sm font-medium">
                  {t('resources.startTime')}
                </label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="end-time" className="text-sm font-medium">
                  {t('resources.endTime')}
                </label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={newBooking.endTime}
                  onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="client" className="text-sm font-medium">
                {t('resources.client')}
              </label>
              <Select
                value={newBooking.clientId}
                onValueChange={(value) => setNewBooking({ ...newBooking, clientId: value })}
              >
                <SelectTrigger id="client">
                  <SelectValue placeholder={t('resources.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client1">Client 1</SelectItem>
                  <SelectItem value="client2">Client 2</SelectItem>
                  <SelectItem value="client3">Client 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                {t('resources.notes')}
              </label>
              <Textarea
                id="notes"
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                placeholder={t('resources.notesPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBookingOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveBooking}
              disabled={!newBooking.startTime || !newBooking.endTime}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );

  function getBookingButtonText() {
    switch (activeTab) {
      case "inventory":
        return t('resources.bookInventory');
      case "staff":
        return t('resources.assignStaff');
      case "equipment":
        return t('resources.bookEquipment');
      case "vehicles":
        return t('resources.scheduleVehicle');
      default:
        return t('resources.addBooking');
    }
  }

  function getAddBookingTitle() {
    switch (activeTab) {
      case "inventory":
        return t('resources.bookInventoryItem');
      case "staff":
        return t('resources.assignStaffMember');
      case "equipment":
        return t('resources.bookEquipmentItem');
      case "vehicles":
        return t('resources.scheduleVehicle');
      default:
        return t('resources.addBooking');
    }
  }

  function getAddBookingDescription() {
    switch (activeTab) {
      case "inventory":
        return t('resources.bookInventoryItemDescription');
      case "staff":
        return t('resources.assignStaffMemberDescription');
      case "equipment":
        return t('resources.bookEquipmentItemDescription');
      case "vehicles":
        return t('resources.scheduleVehicleDescription');
      default:
        return t('resources.addBookingDescription');
    }
  }
};

export default ResourceCalendar;
