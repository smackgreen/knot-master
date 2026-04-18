import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { MealType } from "@/types";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface CreateMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onMealPlanCreated: (mealPlanId: string) => void;
}

const CreateMealPlanDialog = ({
  open,
  onOpenChange,
  clientId,
  onMealPlanCreated
}: CreateMealPlanDialogProps) => {
  const { t } = useTranslation();
  const { addMealPlan } = useApp();

  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [guestCount, setGuestCount] = useState<string>("");
  const [budgetPerPerson, setBudgetPerPerson] = useState<string>("");
  const [location, setLocation] = useState("");
  const [season, setSeason] = useState("");
  const [culturalRequirements, setCulturalRequirements] = useState("");
  const [preferences, setPreferences] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      toast.error(t("mealPlanning.enterMealPlanName", "Please enter a name for the meal plan"));
      return;
    }

    if (!mealType) {
      toast.error(t("mealPlanning.selectMealTypeRequired", "Please select a meal type"));
      return;
    }

    setIsSubmitting(true);

    try {
      const mealPlanId = await addMealPlan({
        clientId,
        name,
        mealType,
        eventDate: eventDate?.toISOString(),
        guestCount: guestCount ? parseInt(guestCount) : undefined,
        budgetPerPerson: budgetPerPerson ? parseFloat(budgetPerPerson) : undefined,
        location,
        season,
        culturalRequirements,
        preferences,
        notes
      });

      onMealPlanCreated(mealPlanId);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      toast.error(t("mealPlanning.failedToCreateMealPlan", "Failed to create meal plan"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMealType("dinner");
    setEventDate(undefined);
    setGuestCount("");
    setBudgetPerPerson("");
    setLocation("");
    setSeason("");
    setCulturalRequirements("");
    setPreferences("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("mealPlanning.createNewMealPlan")}</DialogTitle>
          <DialogDescription>
            {t("mealPlanning.createNewMealPlanDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("mealPlanning.name")}</Label>
            <Input
              id="name"
              placeholder={t("mealPlanning.receptionDinner")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mealType">{t("mealPlanning.mealType")}</Label>
              <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("mealPlanning.selectMealType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t("mealPlanning.breakfast")}</SelectItem>
                  <SelectItem value="lunch">{t("mealPlanning.lunch")}</SelectItem>
                  <SelectItem value="dinner">{t("mealPlanning.dinner")}</SelectItem>
                  <SelectItem value="cocktail">{t("mealPlanning.cocktailHour")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventDate">{t("mealPlanning.eventDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="eventDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : <span>{t("mealPlanning.pickDate")}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="guestCount">{t("mealPlanning.guestCount")}</Label>
              <Input
                id="guestCount"
                type="number"
                placeholder="150"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="budgetPerPerson">{t("mealPlanning.budgetPerPerson")}</Label>
              <Input
                id="budgetPerPerson"
                type="number"
                placeholder="75"
                value={budgetPerPerson}
                onChange={(e) => setBudgetPerPerson(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="location">{t("mealPlanning.location")}</Label>
              <Input
                id="location"
                placeholder={t("mealPlanning.venueName")}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="season">{t("mealPlanning.season")}</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger>
                  <SelectValue placeholder={t("mealPlanning.selectSeason")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">{t("mealPlanning.spring")}</SelectItem>
                  <SelectItem value="summer">{t("mealPlanning.summer")}</SelectItem>
                  <SelectItem value="fall">{t("mealPlanning.fall")}</SelectItem>
                  <SelectItem value="winter">{t("mealPlanning.winter")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="culturalRequirements">{t("mealPlanning.culturalRequirements")}</Label>
            <Input
              id="culturalRequirements"
              placeholder={t("mealPlanning.kosherHalal")}
              value={culturalRequirements}
              onChange={(e) => setCulturalRequirements(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="preferences">{t("mealPlanning.preferences")}</Label>
            <Textarea
              id="preferences"
              placeholder={t("mealPlanning.farmToTable")}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">{t("mealPlanning.notes")}</Label>
            <Textarea
              id="notes"
              placeholder={t("mealPlanning.additionalNotes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("common.creating", "Creating...") : t("mealPlanning.createMealPlan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMealPlanDialog;
