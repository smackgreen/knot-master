import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, QrCode, UserCheck, Users, Clock, Download, Printer, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { 
  CheckInEvent, 
  CheckInRecord, 
  CheckInStatistics, 
  GuestWithCheckin, 
  CheckInResult,
  GuestSearchFilters
} from "@/types/guestCheckin";
import { 
  fetchCheckInEvents, 
  createCheckInEvent, 
  fetchCheckInRecords, 
  getCheckInStatistics 
} from "@/services/guestCheckinService";
import QRCodeScanner from "./QRCodeScanner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface CheckInDashboardProps {
  clientId: string;
}

const CheckInDashboard = ({ clientId }: CheckInDashboardProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<CheckInEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CheckInEvent | null>(null);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [statistics, setStatistics] = useState<CheckInStatistics | null>(null);
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    eventDate: new Date().toISOString().split('T')[0],
    location: "",
    description: ""
  });
  const [searchFilters, setSearchFilters] = useState<GuestSearchFilters>({
    searchTerm: "",
    checkedInOnly: false,
    notCheckedInOnly: false
  });
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [clientId]);

  useEffect(() => {
    if (selectedEvent) {
      loadCheckInRecords();
      loadStatistics();
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const eventsData = await fetchCheckInEvents(clientId);
      setEvents(eventsData);
      
      // Select the most recent active event by default
      const activeEvents = eventsData.filter(event => event.isActive);
      if (activeEvents.length > 0) {
        setSelectedEvent(activeEvents[0]);
      } else if (eventsData.length > 0) {
        setSelectedEvent(eventsData[0]);
      }
    } catch (error) {
      console.error("Error loading check-in events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCheckInRecords = async () => {
    if (!selectedEvent) return;
    
    try {
      const records = await fetchCheckInRecords(selectedEvent.id);
      setCheckInRecords(records);
    } catch (error) {
      console.error("Error loading check-in records:", error);
    }
  };

  const loadStatistics = async () => {
    if (!selectedEvent) return;
    
    try {
      const stats = await getCheckInStatistics(selectedEvent.id);
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading check-in statistics:", error);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const createdEvent = await createCheckInEvent(
        clientId,
        newEvent.name,
        newEvent.eventDate,
        newEvent.location,
        newEvent.description
      );
      
      setEvents([createdEvent, ...events]);
      setSelectedEvent(createdEvent);
      setIsCreateEventDialogOpen(false);
      setNewEvent({
        name: "",
        eventDate: new Date().toISOString().split('T')[0],
        location: "",
        description: ""
      });
    } catch (error) {
      console.error("Error creating check-in event:", error);
    }
  };

  const handleCheckInSuccess = (result: CheckInResult) => {
    // Refresh the check-in records and statistics
    loadCheckInRecords();
    loadStatistics();
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
    }
  };

  const handleSearch = () => {
    // In a real implementation, this would filter the guests based on the search filters
    console.log("Search filters:", searchFilters);
  };

  const handleExportData = () => {
    // Implementation for exporting check-in data
    console.log("Exporting check-in data...");
  };

  const handlePrintBadges = () => {
    // Implementation for printing guest badges
    console.log("Printing guest badges...");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('guests.checkInEvents')}</CardTitle>
          <CardDescription>{t('guests.noCheckInEvents')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8 space-y-4">
          <p className="text-center">{t('guests.createCheckInEventPrompt')}</p>
          <Button onClick={() => setIsCreateEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('guests.createCheckInEvent')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('guests.guestCheckIn')}</h2>
          <p className="text-muted-foreground">{t('guests.manageGuestCheckIn')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedEvent?.id} onValueChange={handleEventChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('guests.selectEvent')} />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('guests.newEvent')}
          </Button>
          
          <Button onClick={() => setIsQRScannerOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            {t('guests.scanQR')}
          </Button>
        </div>
      </div>

      {selectedEvent && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>{selectedEvent.name}</CardTitle>
                <CardDescription>
                  {format(new Date(selectedEvent.eventDate), 'EEEE, MMMM d, yyyy')}
                  {selectedEvent.location && ` • ${selectedEvent.location}`}
                </CardDescription>
              </div>
              <Badge variant={selectedEvent.isActive ? "default" : "secondary"}>
                {selectedEvent.isActive ? t('guests.active') : t('guests.inactive')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="overview">{t('guests.overview')}</TabsTrigger>
                <TabsTrigger value="checkins">{t('guests.checkIns')}</TabsTrigger>
                <TabsTrigger value="guests">{t('guests.guestList')}</TabsTrigger>
                <TabsTrigger value="statistics">{t('guests.statistics')}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('guests.totalGuests')}</p>
                          <p className="text-2xl font-bold">{statistics?.totalGuests || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('guests.checkedIn')}</p>
                          <p className="text-2xl font-bold">{statistics?.checkedInGuests || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">{t('guests.checkInProgress')}</p>
                          <p className="text-sm font-medium">
                            {Math.round(statistics?.checkedInPercentage || 0)}%
                          </p>
                        </div>
                        <Progress value={statistics?.checkedInPercentage || 0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('guests.recentCheckIns')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {checkInRecords.length > 0 ? (
                        <div className="space-y-4">
                          {checkInRecords.slice(0, 5).map(record => (
                            <div key={record.id} className="flex items-center justify-between border-b pb-2">
                              <div>
                                <p className="font-medium">{record.guest?.name || t('guests.unknownGuest')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(record.checkInTime), 'h:mm a')}
                                </p>
                              </div>
                              <Badge variant="outline">{record.method}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('guests.noCheckInsYet')}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("checkins")}>
                        {t('guests.viewAllCheckIns')}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('guests.checkInsByHour')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics && statistics.checkInsByHour.length > 0 ? (
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statistics.checkInsByHour}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#8884d8" name={t('guests.checkIns')} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('guests.noCheckInData')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="checkins">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('guests.checkInRecords')}</CardTitle>
                    <CardDescription>{t('guests.allCheckIns')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {checkInRecords.length > 0 ? (
                      <div className="border rounded-md">
                        <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                          <div>{t('guests.guestName')}</div>
                          <div>{t('guests.checkInTime')}</div>
                          <div>{t('guests.checkedInBy')}</div>
                          <div>{t('guests.method')}</div>
                        </div>
                        <div className="divide-y">
                          {checkInRecords.map(record => (
                            <div key={record.id} className="grid grid-cols-4 gap-4 p-4">
                              <div>{record.guest?.name || t('guests.unknownGuest')}</div>
                              <div>{format(new Date(record.checkInTime), 'h:mm a')}</div>
                              <div>{record.checkedInBy || t('guests.notSpecified')}</div>
                              <div>
                                <Badge variant="outline">{record.method}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {t('guests.noCheckInsYet')}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('guests.exportData')}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="guests">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{t('guests.guestList')}</CardTitle>
                      <CardDescription>{t('guests.manageGuestList')}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handlePrintBadges}>
                      <Printer className="mr-2 h-4 w-4" />
                      {t('guests.printBadges')}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <div className="flex-1">
                        <Input
                          placeholder={t('guests.searchGuests')}
                          value={searchFilters.searchTerm}
                          onChange={(e) => setSearchFilters({...searchFilters, searchTerm: e.target.value})}
                        />
                      </div>
                      <Button variant="outline" onClick={handleSearch}>
                        <Search className="mr-2 h-4 w-4" />
                        {t('common.search')}
                      </Button>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        {t('common.filter')}
                      </Button>
                    </div>

                    <p className="text-center text-muted-foreground py-8">
                      {t('guests.guestListNotImplemented')}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="statistics">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('guests.checkInsByHour')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics && statistics.checkInsByHour.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statistics.checkInsByHour}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="hour" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="count" fill="#8884d8" name={t('guests.checkIns')} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('guests.noCheckInData')}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('guests.checkInsByGroup')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statistics && statistics.checkInsByGroup.length > 0 ? (
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={statistics.checkInsByGroup}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="checkedIn"
                                nameKey="groupType"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {statistics.checkInsByGroup.map((entry, index) => {
                                  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
                                  return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                })}
                              </Pie>
                              <Tooltip formatter={(value) => [value, t('guests.checkedIn')]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('guests.noCheckInData')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('guests.createCheckInEvent')}</DialogTitle>
            <DialogDescription>{t('guests.createCheckInEventDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="event-name" className="text-sm font-medium">
                {t('guests.eventName')}
              </label>
              <Input
                id="event-name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                placeholder={t('guests.eventNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-date" className="text-sm font-medium">
                {t('guests.eventDate')}
              </label>
              <Input
                id="event-date"
                type="date"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-location" className="text-sm font-medium">
                {t('guests.location')}
              </label>
              <Input
                id="event-location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder={t('guests.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-description" className="text-sm font-medium">
                {t('guests.description')}
              </label>
              <Input
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder={t('guests.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateEvent} disabled={!newEvent.name || !newEvent.eventDate}>
              {t('guests.createEvent')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('guests.scanQRCode')}</DialogTitle>
            <DialogDescription>{t('guests.scanQRCodeDescription')}</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <QRCodeScanner
              eventId={selectedEvent.id}
              stationName="Main Station"
              onCheckInSuccess={handleCheckInSuccess}
              onCheckInError={(message) => console.error("Check-in error:", message)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInDashboard;
