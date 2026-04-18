import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Calendar, CalendarPlus, Check, ExternalLink, Info, RefreshCw, Trash, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import calendarService, { ConnectedCalendar } from "@/services/CalendarService";

interface CalendarSettingsProps {
  onClose: () => void;
}

const CalendarSettings = ({ onClose }: CalendarSettingsProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("external");
  const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Load connected calendars and check if Google Calendar is connected
  useEffect(() => {
    const loadCalendarData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Set the user in the calendar service
        calendarService.setUser(user);

        // Check if Google Calendar is connected
        const isConnected = await calendarService.isGoogleCalendarConnected();
        setIsGoogleConnected(isConnected);

        // If connected, load the calendars
        if (isConnected) {
          const calendars = await calendarService.getConnectedCalendars();
          setConnectedCalendars(calendars);
        }
      } catch (error) {
        console.error("Error loading calendar data:", error);
        toast({
          title: t('calendar.settings.loadError'),
          description: t('calendar.settings.loadErrorDescription'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCalendarData();
  }, [user, t, toast]);

  // Toggle calendar selection
  const toggleCalendarSelection = async (calendarId: string, isSelected: boolean) => {
    try {
      await calendarService.toggleCalendarSelection(calendarId, isSelected);

      // Update local state
      setConnectedCalendars(calendars =>
        calendars.map(cal =>
          cal.id === calendarId ? { ...cal, is_selected: isSelected } : cal
        )
      );

      toast({
        title: isSelected
          ? t('calendar.settings.calendarEnabled')
          : t('calendar.settings.calendarDisabled'),
        description: t('calendar.settings.calendarSelectionUpdated'),
      });
    } catch (error) {
      console.error("Error toggling calendar selection:", error);
      toast({
        title: t('calendar.settings.updateError'),
        description: t('calendar.settings.updateErrorDescription'),
        variant: "destructive"
      });
    }
  };

  // Connect to Google Calendar
  const connectGoogleCalendar = async () => {
    if (!user) {
      toast({
        title: t('calendar.settings.notLoggedIn'),
        description: t('calendar.settings.loginRequired'),
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Set the user in the calendar service
      calendarService.setUser(user);

      // Get the authorization URL
      const authUrl = await calendarService.connectGoogleCalendar();

      // Redirect to Google's OAuth consent screen
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        title: t('calendar.settings.connectionError'),
        description: t('calendar.settings.connectionErrorDescription'),
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    if (!user) return;

    setIsDisconnecting(true);

    try {
      // Set the user in the calendar service
      calendarService.setUser(user);

      // Disconnect Google Calendar
      await calendarService.disconnectGoogleCalendar();

      // Update state
      setIsGoogleConnected(false);
      setConnectedCalendars([]);

      toast({
        title: t('calendar.settings.disconnected'),
        description: t('calendar.settings.googleCalendarDisconnected'),
      });
    } catch (error) {
      console.error("Error disconnecting from Google Calendar:", error);
      toast({
        title: t('calendar.settings.disconnectionError'),
        description: t('calendar.settings.disconnectionErrorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Connect to Outlook Calendar (placeholder for future implementation)
  const connectOutlookCalendar = () => {
    setIsConnecting(true);

    // Simulate API connection
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: t('calendar.settings.notImplemented'),
        description: t('calendar.settings.featureComingSoon'),
      });
    }, 1500);
  };

  // Connect to Apple Calendar (placeholder for future implementation)
  const connectAppleCalendar = () => {
    setIsConnecting(true);

    // Simulate API connection
    setTimeout(() => {
      setIsConnecting(false);
      toast({
        title: t('calendar.settings.notImplemented'),
        description: t('calendar.settings.featureComingSoon'),
      });
    }, 1500);
  };

  // Save settings
  const saveSettings = () => {
    toast({
      title: t('calendar.settings.saved'),
      description: t('calendar.settings.calendarSettingsSaved'),
    });
    onClose();
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{t('calendar.settings.title')}</CardTitle>
        <CardDescription>{t('calendar.settings.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="external">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('calendar.settings.externalCalendars')}
            </TabsTrigger>
            <TabsTrigger value="display">
              <Calendar className="h-4 w-4 mr-2" />
              {t('calendar.settings.displayOptions')}
            </TabsTrigger>
            <TabsTrigger value="sync">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('calendar.settings.syncOptions')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="external" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>{t('calendar.settings.googleCalendar')}</CardTitle>
                  <CardDescription>
                    {isGoogleConnected
                      ? t('calendar.settings.googleCalendarConnected')
                      : t('calendar.settings.connectGoogleCalendar')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  ) : isGoogleConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        {t('calendar.settings.connectedToGoogle')}
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={disconnectGoogleCalendar}
                        disabled={isDisconnecting}
                        className="w-full"
                      >
                        {isDisconnecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            {t('calendar.settings.disconnecting')}
                          </>
                        ) : (
                          <>
                            <Trash className="mr-2 h-4 w-4" />
                            {t('calendar.settings.disconnectGoogleCalendar')}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={connectGoogleCalendar}
                      className="w-full"
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          {t('calendar.settings.connecting')}
                        </>
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          {t('calendar.settings.connectGoogleCalendar')}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>{t('calendar.settings.otherCalendars')}</CardTitle>
                  <CardDescription>{t('calendar.settings.connectOtherCalendars')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={connectOutlookCalendar}
                    className="w-full"
                    variant="outline"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Calendar className="mr-2 h-4 w-4" />
                    )}
                    {t('calendar.settings.connectOutlookCalendar')}
                  </Button>

                  <Button
                    onClick={connectAppleCalendar}
                    className="w-full"
                    variant="outline"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <Calendar className="mr-2 h-4 w-4" />
                    )}
                    {t('calendar.settings.connectAppleCalendar')}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('calendar.settings.calendarPermissionsInfo')}
              </AlertDescription>
            </Alert>

            {isGoogleConnected && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t('calendar.settings.connectedCalendars')}</h3>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                  </div>
                ) : connectedCalendars.length > 0 ? (
                  <div className="space-y-2">
                    {connectedCalendars.map(calendar => (
                      <div
                        key={calendar.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: calendar.color }}
                          ></div>
                          <span>{calendar.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({calendar.provider})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={calendar.is_selected}
                            onCheckedChange={(checked) => toggleCalendarSelection(calendar.id, checked)}
                          />
                          <Label htmlFor={`calendar-${calendar.id}`} className="sr-only">
                            {calendar.name}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('calendar.settings.noCalendarsFound')}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.showWeekends')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.showWeekendsDescription')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.showWeekNumbers')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.showWeekNumbersDescription')}
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.showAllDayEvents')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.showAllDayEventsDescription')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.autoSync')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.autoSyncDescription')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.twoWaySync')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.twoWaySyncDescription')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('calendar.settings.syncFrequency')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('calendar.settings.syncFrequencyDescription')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {t('calendar.settings.syncNow')}
                    <RefreshCw className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={saveSettings}>
          {t('common.save')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CalendarSettings;
