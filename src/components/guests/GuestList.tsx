import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Guest } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Upload, Download, Mail, Edit, Trash2, QrCode, UserCheck } from "lucide-react";
import AddGuestDialog from "./AddGuestDialog";
import EditGuestDialog from "./EditGuestDialog";
import ImportGuestsDialog from "./ImportGuestsDialog";
import CheckInDashboard from "./CheckInDashboard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface GuestListProps {
  clientId: string;
}

const GuestList = ({ clientId }: GuestListProps) => {
  const { getGuestsByClientId, deleteGuest } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("guests");
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isEditGuestOpen, setIsEditGuestOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const guests = getGuestsByClientId(clientId);

  const handleOpenEditGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsEditGuestOpen(true);
  };

  const handleDeleteGuest = async (id: string) => {
    await deleteGuest(id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('guests.title')}</CardTitle>
          <CardDescription>{t('guests.manage')}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('guests.import')}
          </Button>
          <Button onClick={() => setIsAddGuestOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('guests.addGuest')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="guests">
              <Users className="mr-2 h-4 w-4" />
              {t('guests.guestList')}
            </TabsTrigger>
            <TabsTrigger value="checkin">
              <UserCheck className="mr-2 h-4 w-4" />
              {t('guests.checkIn')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guests">
        {guests.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="outline">{guests.length} {t('guests.totalGuests')}</Badge>
                <Badge variant="outline">{guests.filter(g => g.status === 'confirmed').length} {t('guests.confirmed')}</Badge>
                <Badge variant="outline">{guests.filter(g => g.status === 'declined').length} {t('guests.declined')}</Badge>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t('guests.export')}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('guests.primaryGuest')}</TableHead>
                    <TableHead>{t('guests.partner')}</TableHead>
                    <TableHead>{t('guests.children')}</TableHead>
                    <TableHead>{t('guests.contact')}</TableHead>
                    <TableHead>{t('guests.address')}</TableHead>
                    <TableHead>{t('guests.status')}</TableHead>
                    <TableHead>{t('guests.mealPreferences')}</TableHead>
                    <TableHead>{t('guests.table')}</TableHead>
                    <TableHead>{t('guests.notes')}</TableHead>
                    <TableHead className="w-[100px]">{t('guests.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell>
                        <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                      </TableCell>
                      <TableCell>
                        {guest.isCouple ? (
                          <div>
                            {guest.partnerFirstName && guest.partnerLastName ? (
                              <div className="font-medium">
                                {guest.partnerFirstName} {guest.partnerLastName}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {t('guests.partnerNotSpecified')}
                              </div>
                            )}
                            {guest.partnerEmail && (
                              <div className="text-xs text-muted-foreground">
                                {guest.partnerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">{t('guests.none')}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.hasChildren && guest.children && guest.children.length > 0 ? (
                          <div>
                            <div className="text-sm font-medium">
                              {guest.children.length} {guest.children.length === 1 ? t('guests.child') : t('guests.children')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {guest.children.map((child, index) => (
                                <div key={index}>
                                  {child.name}{child.age ? ` (${child.age})` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : guest.hasChildren ? (
                          <div className="text-sm text-muted-foreground">
                            {t('guests.hasChildrenNoDetails')}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">{t('guests.none')}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.email && <div className="text-sm">{guest.email}</div>}
                        {guest.phone && <div className="text-sm text-muted-foreground">{guest.phone}</div>}
                      </TableCell>
                      <TableCell>
                        {guest.address && (
                          <div className="text-sm">
                            <div>{guest.address}</div>
                            {guest.city && guest.state && (
                              <div className="text-muted-foreground">
                                {guest.city}, {guest.state} {guest.postalCode}
                              </div>
                            )}
                            {guest.country && guest.country !== "USA" && (
                              <div className="text-muted-foreground">{guest.country}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            guest.status === 'confirmed' ? 'success' :
                            guest.status === 'declined' ? 'destructive' :
                            guest.status === 'invited' ? 'default' : 'outline'
                          }
                        >
                          {guest.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            <span className="font-medium">{guest.firstName}:</span> {guest.mealPreference || t('guests.notSpecified')}
                          </div>
                          {guest.isCouple && (
                            <div>
                              <span className="font-medium">{guest.partnerFirstName || t('guests.partner')}:</span> {guest.partnerMealPreference || t('guests.notSpecified')}
                            </div>
                          )}
                          {guest.hasChildren && guest.children && guest.children.some(child => child.mealPreference) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {guest.children.filter(child => child.mealPreference).map((child, index) => (
                                <div key={index}>
                                  {child.name}: {child.mealPreference}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{guest.tableAssignment || "-"}</TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate text-sm">
                          {guest.notes || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEditGuest(guest)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('guests.deleteGuest')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('guests.deleteGuestConfirm', { firstName: guest.firstName, lastName: guest.lastName })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteGuest(guest.id)}>
                                  {t('common.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('guests.noGuestsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('guests.addGuestsPrompt')}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('guests.importFromExcel')}
              </Button>
              <Button onClick={() => setIsAddGuestOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('guests.addGuest')}
              </Button>
            </div>
          </div>
        )}
          </TabsContent>

          <TabsContent value="checkin">
            <CheckInDashboard clientId={clientId} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialogs */}
      <AddGuestDialog
        open={isAddGuestOpen}
        onOpenChange={setIsAddGuestOpen}
        clientId={clientId}
      />

      {selectedGuest && (
        <EditGuestDialog
          open={isEditGuestOpen}
          onOpenChange={setIsEditGuestOpen}
          guest={selectedGuest}
        />
      )}

      <ImportGuestsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        clientId={clientId}
      />
    </Card>
  );
};

export default GuestList;
